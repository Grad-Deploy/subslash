import type { Receipt, ReceiptLine, ReceiptPeriod } from "@subslash/shared";
import { isReceiptTheme, type ReceiptTheme } from "./receipt-theme";

/**
 * 영수증 공유 링크(`/report/receipt/share#r=…`). 영수증 한 장을 링크에 통째로 싣고, 받는 사람의 브라우저가 풀어 그린다.
 *
 * 서버에 영수증을 두지 않는다 — 값은 `#` 뒤에만 있어 서버 접속 기록에도 남지 않는다(`?`로 옮기지 않는다). 그래서 링크를
 * 가진 사람은 누구나 볼 수 있고, 보낸 링크는 취소할 수 없다. 보내는 화면이 처음 공유할 때 그렇게 묻는다.
 *
 * 서명하지 않는다. 숫자는 사용자가 적은 기록이라 서버가 서명해도 '사실'이 아니라 'SubSlash가 만들었다'만 증명하고, 그러면
 * 지어낸 금액도 인증된 것처럼 보인다. 대신 받는 화면과 그림에 '확인되지 않은 내용'이라고 적는다(`unverified`). 만료도 두지
 * 않는다 — 내용이 링크 안에 있어 이 화면을 거치지 않고도 풀어 읽을 수 있으므로, 화면이 막아도 지켜지는 것이 없다.
 *
 * 링크에는 영수증에 꼭 필요한 것만 싣는다: 사용 횟수·1회 단가, 나눠 내는지와 카드에 찍힌 금액은 싣지 않는다(남에게 보일
 * 까닭이 적고 사생활에 가깝다). 이름을 가리면(`maskNames`) 원본을 싣지 않고 받는 쪽이 '구독 1'로 그린다. 구독 ID와
 * 사용자가 고른 아이콘(`iconUrl`)도 싣지 않는다 — 아이콘은 그림 주소일 수 있다.
 *
 * 링크는 남이 지어 보낼 수 있으므로 푸는 쪽은 칸마다 모양을 확인하고, 하나라도 틀리면 아무것도 그리지 않는다. 이름 칸은
 * 아무 글이나 적을 수 있어, 주소·이메일·전화번호처럼 보이는 이름(`looksLikeContact`)은 받지 않는다 — SubSlash 화면과 로고가
 * 찍힌 그림에 "로그인하려면 evil.com"을 띄우는 길이 된다. 보내는 쪽은 같은 이름을 가려서 싣는다.
 */

export const RECEIPT_SHARE_PATH = "/report/receipt/share";

const VERSION = 2;
/** 압축한 것(deflate-raw)과 그대로인 것. 압축을 모르는 브라우저에서 만든 링크도 열리게 둘 다 읽는다. */
const PLAIN = `${VERSION}.`;
const DEFLATED = `${VERSION}z.`;
/** 풀어낸 크기 상한(바이트) — 작게 압축한 것을 크게 풀게 하는 링크를 막는다. 50줄짜리도 15KB쯤이다. */
const MAX_BYTES = 64 * 1024;
/** 영수증 그림은 줄마다 세로로 늘어나, 이보다 많으면 캔버스가 그리지 못할 수 있다. */
export const MAX_SHARE_LINES = 50;
/** 한 줄의 결제일 수. 연 영수증의 월 결제도 12번이다. */
const MAX_DATES = 40;
/** 서비스 목록에서 가장 긴 이름이 52자다. */
const MAX_NAME = 60;

/** 주소·이메일·전화번호처럼 보이는 글. 서비스 목록의 이름 중에는 없다(`receipt-share.test`). */
export function looksLikeContact(text: string): boolean {
  return /(?:https?:|www\.|\/\/)|[^\s@]+@[^\s@]+|\+?\d[\d\s().-]{7,}\d|\b[a-z0-9-]{2,}\.[a-z]{2,}\b/i.test(
    text.normalize("NFKC"),
  );
}

type WireLine = [
  /** null이면 가린 이름. */
  name: string | null,
  chargeDates: string[],
  upcomingDates: string[],
  evidencedDates: string[],
  amountKRW: number,
  billingCycle: ReceiptLine["billingCycle"],
  killedOn: string | null,
];

interface Wire {
  v: number;
  p: ReceiptPeriod;
  c: 0 | 1;
  l: WireLine[];
  t: number;
  n: [chargeCount: number, upcomingCount: number, evidencedCount: number];
  d: [defendedKRW: number, defendedUnknownCount: number];
  k: [name: string | null, killedOn: string][];
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

/** 가린 이름을 화면 언어로 부르는 말. */
export interface MaskedNameLabels {
  masked: (n: number) => string;
  maskedKilled: (n: number) => string;
}

export interface ShareOptions {
  /** 서비스 이름을 가린다. 원본은 링크에 싣지 않는다. */
  maskNames?: boolean;
}

/** 링크에 실을 이름. 가리거나 연락처처럼 보이면 null. */
function wireName(name: string, { maskNames }: ShareOptions): string | null {
  const trimmed = name.trim().slice(0, MAX_NAME);
  return maskNames || !trimmed || looksLikeContact(trimmed) ? null : trimmed;
}

/**
 * 링크에 실리는 것과 같은 영수증 — 공유하는 글도 이것으로 만들어 글과 링크가 같은 것을 보이게 한다. 이름은 가렸으면 화면
 * 언어의 '구독 1'이 되고, 사용 횟수·나눠 내는 금액은 빠진다.
 */
export function shareableReceipt(
  receipt: Receipt,
  options: ShareOptions,
  labels: MaskedNameLabels,
): Receipt {
  const lines = receipt.lines.map((line, i) => ({
    ...line,
    subscriptionId: `shared-${i}`,
    iconUrl: undefined,
    name: wireName(line.name, options) ?? labels.masked(i + 1),
    billedKRW: line.amountKRW,
    shared: false,
    usage: null,
  }));
  return {
    ...receipt,
    lines,
    billedTotalKRW: receipt.totalKRW,
    priciestPerUse: null,
    killed: receipt.killed.map((item, i) => ({
      subscriptionId: `shared-killed-${i}`,
      name: wireName(item.name, options) ?? labels.maskedKilled(i + 1),
      killedOn: item.killedOn,
    })),
  };
}

function toWire({ receipt, issuedAt, theme }: SharedReceipt, options: ShareOptions): Wire {
  return {
    v: VERSION,
    p: receipt.period,
    c: receipt.isComplete ? 1 : 0,
    l: receipt.lines.map((line) => [
      wireName(line.name, options),
      line.chargeDates,
      line.upcomingDates,
      line.evidencedDates,
      line.amountKRW,
      line.billingCycle,
      line.killedOn,
    ]),
    t: receipt.totalKRW,
    n: [receipt.chargeCount, receipt.upcomingCount, receipt.evidencedCount],
    d: [receipt.defendedKRW, receipt.defendedUnknownCount],
    k: receipt.killed.map((item) => [wireName(item.name, options), item.killedOn]),
    fx: [receipt.fx.historical, receipt.fx.current],
    x: [receipt.excluded.undated, receipt.excluded.beforeRegistration, receipt.excluded.trial],
    i: issuedAt.toISOString(),
    th: theme,
  };
}

const isDay = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
/** 이름 칸: 가린 것(null)이거나, 길이 안이고 연락처처럼 보이지 않는 글. */
const isWireName = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === "string" &&
    value.trim() !== "" &&
    value.length <= MAX_NAME &&
    !looksLikeContact(value));
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

function readLine(value: unknown, index: number, labels: MaskedNameLabels): ReceiptLine | null {
  if (!Array.isArray(value) || value.length !== 7) return null;
  const [name, chargeDates, upcomingDates, evidencedDates, amount, cycle, killedOn] =
    value as unknown[];
  if (!isWireName(name) || !isDays(chargeDates) || !isDays(upcomingDates)) return null;
  if (!isDays(evidencedDates) || !isWon(amount)) return null;
  if (cycle !== "monthly" && cycle !== "yearly") return null;
  if (killedOn !== null && !isDay(killedOn)) return null;
  return {
    subscriptionId: `shared-${index}`,
    name: name ?? labels.masked(index + 1),
    chargeDates,
    upcomingDates,
    evidencedDates,
    amountKRW: amount,
    billedKRW: amount,
    shared: false,
    billingCycle: cycle,
    killedOn,
    usage: null,
  };
}

function fromWire(value: unknown, labels: MaskedNameLabels): SharedReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const wire = value as Partial<Record<keyof Wire, unknown>>;
  if (wire.v !== VERSION) return null;
  const period = readPeriod(wire.p);
  if (!period || (wire.c !== 0 && wire.c !== 1)) return null;
  if (!Array.isArray(wire.l) || wire.l.length > MAX_SHARE_LINES) return null;
  const lines: ReceiptLine[] = [];
  for (const [i, item] of wire.l.entries()) {
    const line = readLine(item, i, labels);
    if (!line) return null;
    lines.push(line);
  }
  if (!isWon(wire.t)) return null;
  if (!tupleOf<[number, number, number]>(wire.n, 3, isCount)) return null;
  if (!Array.isArray(wire.d) || wire.d.length !== 2 || !isWon(wire.d[0]) || !isCount(wire.d[1])) {
    return null;
  }
  if (!Array.isArray(wire.k) || wire.k.length > MAX_SHARE_LINES) return null;
  const killed: Receipt["killed"] = [];
  for (const [i, item] of wire.k.entries()) {
    if (!Array.isArray(item) || item.length !== 2 || !isWireName(item[0]) || !isDay(item[1])) {
      return null;
    }
    killed.push({
      subscriptionId: `shared-killed-${i}`,
      name: item[0] ?? labels.maskedKilled(i + 1),
      killedOn: item[1],
    });
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
      lines,
      totalKRW: wire.t,
      billedTotalKRW: wire.t,
      chargeCount: wire.n[0],
      upcomingCount: wire.n[1],
      evidencedCount: wire.n[2],
      priciestPerUse: null,
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
      if (size > MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
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

/**
 * 링크의 `#` 뒤에 붙일 값(`r=…`). 받는 쪽 상한을 넘는 영수증(줄이 너무 많은 것 등)이면 null — 열리지 않을 링크를
 * 보내지 않고 글로만 공유한다.
 */
export async function encodeReceiptShare(
  shared: SharedReceipt,
  options: ShareOptions = {},
): Promise<string | null> {
  const { receipt } = shared;
  if (receipt.lines.length > MAX_SHARE_LINES || receipt.killed.length > MAX_SHARE_LINES) {
    return null;
  }
  const tooManyDates = receipt.lines.some((line) =>
    [line.chargeDates, line.upcomingDates, line.evidencedDates].some((d) => d.length > MAX_DATES),
  );
  if (tooManyDates) return null;
  const bytes = new TextEncoder().encode(JSON.stringify(toWire(shared, options)));
  if (bytes.length > MAX_BYTES) return null;
  if (canCompress()) {
    try {
      return `r=${DEFLATED}${toBase64Url(await deflate(bytes))}`;
    } catch {
      // 압축이 실패하면 그대로 싣는다 — 링크가 길어질 뿐이다.
    }
  }
  return `r=${PLAIN}${toBase64Url(bytes)}`;
}

/** `#r=…`(맨 앞 `#`는 있어도 없어도 된다)를 풀어 영수증으로. 틀렸거나 잘린 링크면 null. 예외를 던지지 않는다. */
export async function decodeReceiptShare(
  hash: string,
  labels: MaskedNameLabels,
): Promise<SharedReceipt | null> {
  try {
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
    if (!bytes || bytes.length > MAX_BYTES) return null;
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return fromWire(JSON.parse(json), labels);
  } catch {
    return null;
  }
}
