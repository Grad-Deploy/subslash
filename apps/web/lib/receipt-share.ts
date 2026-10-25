import type { Receipt, ReceiptLine, ReceiptPeriod } from "@subslash/shared";
import { isReceiptTheme, type ReceiptTheme } from "./receipt-theme";

/**
 * 영수증 공유 링크(`/report/receipt/share#r=…`). 영수증 한 장을 링크에 통째로 싣고, 받는 사람의 브라우저가 풀어 그린다.
 *
 * 서버에 영수증을 두지 않는다 — 값은 `#` 뒤에만 있어 서버 접속 기록에도 남지 않는다(`?`로 옮기지 않는다). 그래서 링크를
 * 가진 사람은 누구나 볼 수 있고 지울 수도 없다. 보내는 화면이 그렇게 적는다(`receiptView.page.privacy`).
 *
 * 링크는 남이 지어 보낼 수 있으므로 푸는 쪽은 칸마다 모양을 확인하고, 하나라도 틀리면 아무것도 그리지 않는다. 구독 ID와
 * 사용자가 고른 아이콘(`iconUrl`)은 싣지 않는다 — 아이콘은 그림 주소일 수 있어, 지어 보낸 링크가 받는 사람의 브라우저에
 * 바깥 주소를 부르게 할 수 있다(영수증 그림도 아이콘을 쓰지 않는다).
 */

export const RECEIPT_SHARE_PATH = "/report/receipt/share";

const VERSION = 1;
/** 압축한 것(deflate-raw)과 그대로인 것. 압축을 모르는 브라우저에서 만든 링크도 열리게 둘 다 읽는다. */
const PLAIN = "1.";
const DEFLATED = "1z.";
/** 풀어낸 글자 수 상한 — 작게 압축한 것을 크게 풀게 하는 링크를 막는다. 1년치 영수증도 이보다 훨씬 작다. */
const MAX_JSON = 200_000;
const MAX_LINES = 100;
const MAX_DATES = 400;
const MAX_NAME = 100;

type WireUsage = [count: number, costPerUseKRW: number, checkedAt: string] | null;
type WireLine = [
  name: string,
  chargeDates: string[],
  upcomingDates: string[],
  evidencedDates: string[],
  amountKRW: number,
  billedKRW: number,
  shared: 0 | 1,
  billingCycle: ReceiptLine["billingCycle"],
  killedOn: string | null,
  usage: WireUsage,
];

interface Wire {
  v: number;
  p: ReceiptPeriod;
  c: 0 | 1;
  l: WireLine[];
  t: [total: number, billedTotal: number];
  n: [chargeCount: number, upcomingCount: number, evidencedCount: number];
  /** 1회 단가가 가장 높은 줄의 자리. */
  pp: number | null;
  d: [defendedKRW: number, defendedUnknownCount: number];
  k: [name: string, killedOn: string][];
  fx: [historical: number, current: number];
  x: [undated: number, beforeRegistration: number, trial: number];
  i: string;
  th: ReceiptTheme;
}

export interface SharedReceipt {
  receipt: Receipt;
  issuedAt: Date;
  theme: ReceiptTheme;
}

function toWire({ receipt, issuedAt, theme }: SharedReceipt): Wire {
  const index = receipt.priciestPerUse
    ? receipt.lines.findIndex(
        (line) => line.subscriptionId === receipt.priciestPerUse?.subscriptionId,
      )
    : -1;
  return {
    v: VERSION,
    p: receipt.period,
    c: receipt.isComplete ? 1 : 0,
    l: receipt.lines.map((line) => [
      line.name,
      line.chargeDates,
      line.upcomingDates,
      line.evidencedDates,
      line.amountKRW,
      line.billedKRW,
      line.shared ? 1 : 0,
      line.billingCycle,
      line.killedOn,
      line.usage ? [line.usage.count, line.usage.costPerUseKRW, line.usage.checkedAt] : null,
    ]),
    t: [receipt.totalKRW, receipt.billedTotalKRW],
    n: [receipt.chargeCount, receipt.upcomingCount, receipt.evidencedCount],
    pp: index >= 0 ? index : null,
    d: [receipt.defendedKRW, receipt.defendedUnknownCount],
    k: receipt.killed.map((item) => [item.name, item.killedOn]),
    fx: [receipt.fx.historical, receipt.fx.current],
    x: [receipt.excluded.undated, receipt.excluded.beforeRegistration, receipt.excluded.trial],
    i: issuedAt.toISOString(),
    th: theme,
  };
}

const isDay = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isName = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "" && value.length <= MAX_NAME;
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 1_000_000;
const isWon = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1e12;
const isDays = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= MAX_DATES && value.every(isDay);
const tupleOf = <T>(
  value: unknown,
  length: number,
  check: (item: unknown) => boolean,
): value is T => Array.isArray(value) && value.length === length && value.every(check);

function readPeriod(value: unknown): ReceiptPeriod | null {
  if (!value || typeof value !== "object") return null;
  const { kind, year, month } = value as Record<string, unknown>;
  if (typeof year !== "number" || !Number.isInteger(year) || year < 2000 || year > 2100)
    return null;
  if (kind === "year") return { kind, year };
  if (
    kind === "month" &&
    typeof month === "number" &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  ) {
    return { kind, year, month };
  }
  return null;
}

function readLine(value: unknown, index: number): ReceiptLine | null {
  if (!Array.isArray(value) || value.length !== 10) return null;
  const [
    name,
    chargeDates,
    upcomingDates,
    evidencedDates,
    amount,
    billed,
    shared,
    cycle,
    killedOn,
    usage,
  ] = value as unknown[];
  if (!isName(name) || !isDays(chargeDates) || !isDays(upcomingDates) || !isDays(evidencedDates)) {
    return null;
  }
  if (!isWon(amount) || !isWon(billed) || (shared !== 0 && shared !== 1)) return null;
  if (cycle !== "monthly" && cycle !== "yearly") return null;
  if (killedOn !== null && !isDay(killedOn)) return null;
  let readUsage: ReceiptLine["usage"] = null;
  if (usage !== null) {
    if (!Array.isArray(usage) || usage.length !== 3) return null;
    const [count, costPerUse, checkedAt] = usage as unknown[];
    if (!isCount(count) || !isWon(costPerUse) || typeof checkedAt !== "string") return null;
    if (Number.isNaN(new Date(checkedAt).getTime())) return null;
    readUsage = { count, costPerUseKRW: costPerUse, checkedAt };
  }
  return {
    subscriptionId: `shared-${index}`,
    name,
    chargeDates,
    upcomingDates,
    evidencedDates,
    amountKRW: amount,
    billedKRW: billed,
    shared: shared === 1,
    billingCycle: cycle,
    killedOn,
    usage: readUsage,
  };
}

function fromWire(value: unknown): SharedReceipt | null {
  if (!value || typeof value !== "object") return null;
  const wire = value as Partial<Record<keyof Wire, unknown>>;
  if (wire.v !== VERSION) return null;
  const period = readPeriod(wire.p);
  if (!period || (wire.c !== 0 && wire.c !== 1)) return null;
  if (!Array.isArray(wire.l) || wire.l.length > MAX_LINES) return null;
  const lines = wire.l.map(readLine);
  if (lines.some((line) => line === null)) return null;
  const okLines = lines as ReceiptLine[];
  if (!tupleOf<[number, number]>(wire.t, 2, isWon)) return null;
  if (!tupleOf<[number, number, number]>(wire.n, 3, isCount)) return null;
  if (!Array.isArray(wire.d) || wire.d.length !== 2 || !isWon(wire.d[0]) || !isCount(wire.d[1])) {
    return null;
  }
  const pp = wire.pp;
  if (pp !== null && !(isCount(pp) && pp < okLines.length)) return null;
  if (!Array.isArray(wire.k) || wire.k.length > MAX_LINES) return null;
  const killed: Receipt["killed"] = [];
  for (const [i, item] of wire.k.entries()) {
    if (!Array.isArray(item) || item.length !== 2 || !isName(item[0]) || !isDay(item[1]))
      return null;
    killed.push({ subscriptionId: `shared-killed-${i}`, name: item[0], killedOn: item[1] });
  }
  if (!tupleOf<[number, number]>(wire.fx, 2, isCount)) return null;
  if (!tupleOf<[number, number, number]>(wire.x, 3, isCount)) return null;
  const issuedAt = typeof wire.i === "string" ? new Date(wire.i) : null;
  if (!issuedAt || Number.isNaN(issuedAt.getTime())) return null;
  if (!isReceiptTheme(wire.th)) return null;
  const [defendedKRW, defendedUnknownCount] = wire.d as [number, number];
  return {
    receipt: {
      period,
      isComplete: wire.c === 1,
      lines: okLines,
      totalKRW: wire.t[0],
      billedTotalKRW: wire.t[1],
      chargeCount: wire.n[0],
      upcomingCount: wire.n[1],
      evidencedCount: wire.n[2],
      priciestPerUse: pp === null ? null : okLines[pp as number],
      defendedKRW,
      defendedUnknownCount,
      killed,
      fx: { historical: wire.fx[0], current: wire.fx[1] },
      excluded: { undated: wire.x[0], beforeRegistration: wire.x[1], trial: wire.x[2] },
    },
    issuedAt,
    theme: wire.th,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

const canCompress = () =>
  typeof CompressionStream === "function" && typeof DecompressionStream === "function";

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** 상한을 넘으면 그만 읽고 null. */
async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  const reader = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_JSON * 4) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** 링크의 `#` 뒤에 붙일 값(`r=…`). */
export async function encodeReceiptShare(shared: SharedReceipt): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(toWire(shared)));
  if (canCompress()) {
    try {
      return `r=${DEFLATED}${toBase64Url(await deflate(bytes))}`;
    } catch {
      // 압축이 실패하면 그대로 싣는다 — 링크가 길어질 뿐이다.
    }
  }
  return `r=${PLAIN}${toBase64Url(bytes)}`;
}

/** `#r=…`(맨 앞 `#`는 있어도 없어도 된다)를 풀어 영수증으로. 틀렸거나 잘린 링크면 null. */
export async function decodeReceiptShare(hash: string): Promise<SharedReceipt | null> {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("r");
  if (!value) return null;
  let bytes: Uint8Array | null;
  if (value.startsWith(DEFLATED)) {
    if (!canCompress()) return null;
    const packed = fromBase64Url(value.slice(DEFLATED.length));
    bytes = packed && (await inflate(packed));
  } else if (value.startsWith(PLAIN)) {
    bytes = fromBase64Url(value.slice(PLAIN.length));
  } else {
    return null;
  }
  if (!bytes || bytes.length > MAX_JSON * 4) return null;
  let json: string;
  try {
    json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  if (json.length > MAX_JSON) return null;
  try {
    return fromWire(JSON.parse(json));
  } catch {
    return null;
  }
}
