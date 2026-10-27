import {
  DAY_MS,
  isChargeDate,
  localDateKey,
  receiptPeriodDays,
  type Receipt,
  type ReceiptLine,
  type ReceiptPeriod,
} from "@subslash/shared";
import { fromBase64Url, toBase64Url } from "./base64url";
import { isReceiptTheme, type ReceiptTheme } from "./receipt-theme";
import type { ReceiptRenderOptions } from "./receipt-view";

/**
 * 영수증 공유 링크(`/report/receipt/share#r=…`). 영수증 한 장을 링크에 통째로 싣고, 받는 사람의 브라우저가 풀어 그린다.
 *
 * 서버에 영수증을 두지 않는다 — 값은 `#` 뒤에만 있어 서버 접속 기록에도 남지 않는다(`?`로 옮기지 않는다). 그래서 링크를
 * 가진 사람은 누구나 볼 수 있고, 보낸 링크는 취소할 수 없다. 보내는 화면이 처음 공유할 때 그렇게 묻는다. 받는 화면은 읽은
 * 뒤 주소창에서 `#` 뒤를 지운다 — 방문 기록·동기화에 남는 것을 줄이려는 것이고, 이미 기록된 것까지 지우지는 못한다.
 *
 * 서명하지 않는다. 숫자는 사용자가 적은 기록이라 서버가 서명해도 '사실'이 아니라 'SubSlash가 만들었다'만 증명하고, 그러면
 * 지어낸 금액도 인증된 것처럼 보인다. 대신 받는 화면과 그림에 '확인되지 않은 내용'이라고 적는다(`unverified`). 만료도 두지
 * 않는다 — 내용이 링크 안에 있어 이 화면을 거치지 않고도 풀어 읽을 수 있으므로, 화면이 막아도 지켜지는 것이 없다.
 *
 * 링크에는 영수증에 꼭 필요한 것만 싣는다: 사용 횟수·1회 단가, 나눠 내는지와 카드에 찍힌 금액은 싣지 않는다(남에게 보일
 * 까닭이 적고 사생활에 가깝다). 가리면(`maskNames`) 합계만 싣는다(`totalOnly`) — 이름만 가리면 29,811원 같은 금액과
 * 결제일로, 구독 수·건수만으로도 무엇을 내는지 좁혀진다. 금액을 반올림하지 않는 것은 내지 않은 숫자를 그리게 되어서다.
 * 구독 ID와 사용자가 고른 아이콘(`iconUrl`)도 싣지 않는다 — 아이콘은 그림 주소일 수 있다.
 *
 * 링크는 남이 지어 보낼 수 있으므로 푸는 쪽은 칸마다 모양을 확인하고, 하나라도 틀리면 아무것도 그리지 않는다.
 * - 이름: 주소·이메일·전화번호처럼 보이는 것(`looksLikeContact`)은 받지 않는다 — SubSlash 화면과 로고가 찍힌 그림에
 *   "로그인하려면 evil.com"을 띄우는 길이 된다. 보내는 쪽은 같은 이름을 가려서 싣는다.
 * - 날짜: 달력에 있는 날이고 영수증 기간 안이어야 한다. 결제 예정·메일로 넣은 날은 결제일 가운데 있어야 한다.
 * - 합계·건수: 줄에서 다시 센 값과 같아야 한다(만들 때와 같은 순서로 더하므로 정확히 같다). 다르면 고친 링크다.
 * - 금액: 유한하고 상한 안. 나눠 내는 몫은 소수일 수 있어 정수로 막지 않는다(그릴 때 원 단위로 반올림한다).
 */

export const RECEIPT_SHARE_PATH = "/report/receipt/share";

/** 3판: 가림 모드가 구독별 줄 대신 요약(`h`)을 싣는다. 2판(가림이 이름만 가린 것)도 같은 검사로 읽는다. */
const VERSION = 3;
const READABLE = [2, 3] as const;
/** 풀어낸 크기 상한(바이트) — 작게 압축한 것을 크게 풀게 하는 링크를 막는다. 50줄짜리도 15KB쯤이다. */
const MAX_BYTES = 64 * 1024;
/** `r=` 뒤 값의 글자 수 상한. 50줄짜리를 압축하면 5천 자 안쪽이다. */
const MAX_LINK = 16_000;
/** 영수증 그림은 줄마다 세로로 늘어나, 이보다 많으면 캔버스가 그리지 못할 수 있다. */
export const MAX_SHARE_LINES = 50;
/** 한 줄의 결제일 수. 연 영수증의 월 결제도 12번이다. */
const MAX_DATES = 40;
/** 서비스 목록에서 가장 긴 이름이 52자다. */
const MAX_NAME = 60;
/** 한 줄(한 구독의 한 기간)과 합계의 금액 상한(원). */
const MAX_LINE_WON = 100_000_000;
const MAX_TOTAL_WON = 1_000_000_000;

/** 주소·이메일·전화번호처럼 보이는 글. 서비스 목록의 이름 중에는 없다(`receipt-share.test`). */
export function looksLikeContact(text: string): boolean {
  return /(?:https?:|www\.|\/\/)|[^\s@]+@[^\s@]+|\+?\d[\d\s().-]{7,}\d|\b[a-z0-9-]{2,}\.[a-z]{2,}\b/i.test(
    text.normalize("NFKC"),
  );
}

type WireLine = [
  /** null이면 가린 이름(2판). */
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
  /** 가림 모드(3판)의 구독 수. 있으면 `l`·`k`는 비어 있다. */
  h?: number;
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
  /** 받는 쪽이 그릴 때 넘기는 것 — 가린 영수증이면 줄 대신 요약을 그린다. */
  render: ReceiptRenderOptions;
}

/** 2판 링크의 가린 이름을 화면 언어로 부르는 말. */
export interface MaskedNameLabels {
  masked: (n: number) => string;
  maskedKilled: (n: number) => string;
}

export interface ShareOptions {
  /** 서비스 이름과 구독별 금액·결제일을 가린다. 원본은 링크에 싣지 않는다. */
  maskNames?: boolean;
}

/** 링크에 실을 이름. 비었거나 연락처처럼 보이면 null(받는 쪽이 '구독 N'으로 그린다). */
function wireName(name: string): string | null {
  const trimmed = name.trim().slice(0, MAX_NAME);
  return !trimmed || looksLikeContact(trimmed) ? null : trimmed;
}

/**
 * 가린 영수증: 기간·발행일·합계만 남긴다. 구독별 줄·해지 목록·지킨 돈과 구독 수·건수·환율·빠진 구독 수는 0으로 둔다 —
 * 개수만으로도 무엇을 내는지 좁혀진다. 결제 예정이 있었는지(합계가 '결제 예정 포함'인지)만 0·1로 남긴다. 보내는 글·링크와
 * 받는 쪽이 모두 이것을 써서, 예전 링크(구독 수를 실은 3판)도 받는 쪽에서 합계만 보인다.
 */
function totalOnly(receipt: Receipt): Receipt {
  return {
    ...receipt,
    lines: [],
    killed: [],
    billedTotalKRW: receipt.totalKRW,
    priciestPerUse: null,
    chargeCount: 0,
    upcomingCount: receipt.upcomingCount > 0 ? 1 : 0,
    evidencedCount: 0,
    defendedKRW: 0,
    defendedUnknownCount: 0,
    fx: { historical: 0, current: 0 },
    excluded: { undated: 0, beforeRegistration: 0, trial: 0 },
  };
}

/** 링크에 싣는 칸만으로 만든 줄. 보내는 글(`shareableReceipt`)과 받는 쪽(`readLine`)이 같은 모양을 쓴다. */
type SharedLineFields = Pick<
  ReceiptLine,
  "chargeDates" | "upcomingDates" | "evidencedDates" | "amountKRW" | "billingCycle" | "killedOn"
> & { name: string | null };

function sharedLine(line: SharedLineFields, index: number, labels: MaskedNameLabels): ReceiptLine {
  // 칸을 하나씩 옮긴다 — 펼치면 보내는 쪽 줄의 아이콘 주소(`iconUrl`)·사용 횟수가 따라온다.
  return {
    subscriptionId: `shared-${index}`,
    name: line.name ?? labels.masked(index + 1),
    chargeDates: line.chargeDates,
    upcomingDates: line.upcomingDates,
    evidencedDates: line.evidencedDates,
    amountKRW: line.amountKRW,
    billedKRW: line.amountKRW,
    shared: false,
    billingCycle: line.billingCycle,
    killedOn: line.killedOn,
    usage: null,
  };
}

function sharedKilled(
  name: string | null,
  killedOn: string,
  index: number,
  labels: MaskedNameLabels,
): Receipt["killed"][number] {
  return {
    subscriptionId: `shared-killed-${index}`,
    name: name ?? labels.maskedKilled(index + 1),
    killedOn,
  };
}

const renderFor = (hidden: boolean): ReceiptRenderOptions =>
  hidden ? { unverified: true, hidden: true } : { unverified: true };

/**
 * 링크에 실리는 것과 같은 영수증과 그릴 때 넘길 것 — 공유하는 글도 이것으로 만들어 글과 링크가 같은 것을 보이게 한다.
 * 가리면 합계만 남는다(`totalOnly`). 사용 횟수·나눠 내는 금액은 늘 빠진다.
 */
export function shareableReceipt(
  receipt: Receipt,
  { maskNames = false }: ShareOptions,
  labels: MaskedNameLabels,
): { receipt: Receipt; render: ReceiptRenderOptions } {
  if (maskNames) return { receipt: totalOnly(receipt), render: renderFor(true) };
  return {
    receipt: {
      ...receipt,
      billedTotalKRW: receipt.totalKRW,
      priciestPerUse: null,
      lines: receipt.lines.map((line, i) =>
        sharedLine({ ...line, name: wireName(line.name) }, i, labels),
      ),
      killed: receipt.killed.map((item, i) =>
        sharedKilled(wireName(item.name), item.killedOn, i, labels),
      ),
    },
    render: renderFor(false),
  };
}

function toWire(
  shared: Pick<SharedReceipt, "receipt" | "issuedAt" | "theme">,
  { maskNames = false }: ShareOptions,
): Wire {
  const { issuedAt, theme } = shared;
  // 가리면 합계만 남긴 영수증을 싣는다. 구독 수(`h`)는 가렸다는 표시로만 두고 0을 싣는다.
  const receipt = maskNames ? totalOnly(shared.receipt) : shared.receipt;
  return {
    v: VERSION,
    p: receipt.period,
    c: receipt.isComplete ? 1 : 0,
    // 가린 영수증은 `totalOnly`가 줄·해지 목록을 이미 비웠다.
    l: receipt.lines.map((line) => [
      wireName(line.name),
      line.chargeDates,
      line.upcomingDates,
      line.evidencedDates,
      line.amountKRW,
      line.billingCycle,
      line.killedOn,
    ]),
    ...(maskNames ? { h: 0 } : {}),
    t: receipt.totalKRW,
    n: [receipt.chargeCount, receipt.upcomingCount, receipt.evidencedCount],
    d: [receipt.defendedKRW, receipt.defendedUnknownCount],
    k: receipt.killed.map((item) => [wireName(item.name), item.killedOn]),
    fx: [receipt.fx.historical, receipt.fx.current],
    x: [receipt.excluded.undated, receipt.excluded.beforeRegistration, receipt.excluded.trial],
    i: issuedAt.toISOString(),
    th: theme,
  };
}

/** 달력에 있는 날(`YYYY-MM-DD`). 2026-13-45처럼 모양만 맞는 것은 아니다. */
const isDay = isChargeDate;
/** 이름 칸: 가린 것(null)이거나, 길이 안이고 연락처처럼 보이지 않는 글. */
const isWireName = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === "string" &&
    value.trim() !== "" &&
    value.length <= MAX_NAME &&
    !looksLikeContact(value));
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100_000;
const isWon = (value: unknown, max: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
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

/** 영수증 기간의 첫날·마지막 날(`YYYY-MM-DD`, 글자로 견줄 수 있다)과 첫날 0시(기기 시간대). */
function periodBounds(period: ReceiptPeriod): { first: string; last: string; start: Date } {
  const { start, end } = receiptPeriodDays(period);
  return { first: localDateKey(start), last: localDateKey(end), start };
}

function readLine(
  value: unknown,
  index: number,
  labels: MaskedNameLabels,
  inPeriod: (day: string) => boolean,
): ReceiptLine | null {
  if (!Array.isArray(value) || value.length !== 7) return null;
  const [name, chargeDates, upcomingDates, evidencedDates, amount, cycle, killedOn] =
    value as unknown[];
  if (!isWireName(name) || !isWon(amount, MAX_LINE_WON)) return null;
  const isDays = (days: unknown): days is string[] =>
    Array.isArray(days) && days.length <= MAX_DATES && days.every((d) => isDay(d) && inPeriod(d));
  if (!isDays(chargeDates) || !isDays(upcomingDates) || !isDays(evidencedDates)) return null;
  // 결제 예정·메일로 넣은 날은 결제일 가운데 있다(buildReceipt).
  const charged = new Set(chargeDates);
  if (![...upcomingDates, ...evidencedDates].every((day) => charged.has(day))) return null;
  if (cycle !== "monthly" && cycle !== "yearly") return null;
  if (killedOn !== null && !(isDay(killedOn) && inPeriod(killedOn))) return null;
  return sharedLine(
    {
      name,
      chargeDates,
      upcomingDates,
      evidencedDates,
      amountKRW: amount,
      billingCycle: cycle,
      killedOn,
    },
    index,
    labels,
  );
}

function fromWire(value: unknown, labels: MaskedNameLabels, now: Date): SharedReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const wire = value as Partial<Record<keyof Wire, unknown>>;
  if (!READABLE.includes(wire.v as (typeof READABLE)[number])) return null;
  const period = readPeriod(wire.p);
  if (!period || (wire.c !== 0 && wire.c !== 1)) return null;
  const { first, last, start } = periodBounds(period);
  const inPeriod = (day: string) => day >= first && day <= last;

  // 발행일은 기간이 시작한 뒤부터 오늘까지다. 기간의 시작은 받는 사람의 시간대로 재므로, 보낸 사람과 시간대가 달라도
  // 거절하지 않게 양쪽에 하루씩 여유를 둔다(한국에서 1일 0시 30분에 만든 것을 미국에서 열면 그곳은 아직 전날이다).
  const issuedAt = typeof wire.i === "string" ? new Date(wire.i) : null;
  if (!issuedAt || Number.isNaN(issuedAt.getTime())) return null;
  if (
    issuedAt.getTime() < start.getTime() - DAY_MS ||
    issuedAt.getTime() > now.getTime() + DAY_MS
  ) {
    return null;
  }
  if (!isReceiptTheme(wire.th)) return null;

  // 가림 모드(3판만): 구독별 줄과 해지 목록이 없고 구독 수만 있다.
  const hidden = wire.v === 3 && wire.h !== undefined;
  if (hidden && !(isCount(wire.h) && (wire.h as number) <= MAX_SHARE_LINES)) return null;
  if (!Array.isArray(wire.l) || wire.l.length > MAX_SHARE_LINES) return null;
  if (!Array.isArray(wire.k) || wire.k.length > MAX_SHARE_LINES) return null;
  if (hidden && (wire.l.length > 0 || wire.k.length > 0)) return null;

  const lines: ReceiptLine[] = [];
  for (const [i, item] of wire.l.entries()) {
    const line = readLine(item, i, labels, inPeriod);
    if (!line) return null;
    lines.push(line);
  }
  const killed: Receipt["killed"] = [];
  for (const [i, item] of wire.k.entries()) {
    if (!Array.isArray(item) || item.length !== 2 || !isWireName(item[0])) return null;
    if (!isDay(item[1]) || !inPeriod(item[1])) return null;
    killed.push(sharedKilled(item[0], item[1], i, labels));
  }

  if (!isWon(wire.t, MAX_TOTAL_WON)) return null;
  if (!tupleOf<[number, number, number]>(wire.n, 3, isCount)) return null;
  const [chargeCount, upcomingCount, evidencedCount] = wire.n;
  if (!hidden) {
    if (upcomingCount > chargeCount || evidencedCount > chargeCount) return null;
    // 합계와 건수는 줄에서 다시 센다. 만들 때(buildReceipt)와 같은 순서로 더하므로 고치지 않은 링크면 정확히 같다.
    const total = lines.reduce((sum, line) => sum + line.amountKRW, 0);
    const count = (pick: (line: ReceiptLine) => string[]) =>
      lines.reduce((sum, line) => sum + pick(line).length, 0);
    if (wire.t !== total) return null;
    if (chargeCount !== count((line) => line.chargeDates)) return null;
    if (upcomingCount !== count((line) => line.upcomingDates)) return null;
    if (evidencedCount !== count((line) => line.evidencedDates)) return null;
  }
  if (!Array.isArray(wire.d) || wire.d.length !== 2) return null;
  if (!isWon(wire.d[0], MAX_TOTAL_WON) || !isCount(wire.d[1])) return null;
  if (!tupleOf<[number, number]>(wire.fx, 2, isCount)) return null;
  if (!tupleOf<[number, number, number]>(wire.x, 3, isCount)) return null;
  const [defendedKRW, defendedUnknownCount] = wire.d as [number, number];
  const receipt: Receipt = {
    period,
    isComplete: wire.c === 1,
    lines,
    totalKRW: wire.t,
    billedTotalKRW: wire.t,
    chargeCount,
    upcomingCount,
    evidencedCount,
    priciestPerUse: null,
    defendedKRW,
    defendedUnknownCount,
    killed,
    fx: { historical: wire.fx[0], current: wire.fx[1] },
    excluded: { undated: wire.x[0], beforeRegistration: wire.x[1], trial: wire.x[2] },
  };
  return {
    // 가린 영수증은 링크에 무엇이 실렸든 합계만 그린다(구독 수를 실은 예전 3판 링크도).
    receipt: hidden ? totalOnly(receipt) : receipt,
    issuedAt,
    theme: wire.th,
    render: renderFor(hidden),
  };
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
  shared: Pick<SharedReceipt, "receipt" | "issuedAt" | "theme">,
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
  let value: string | null = null;
  if (canCompress()) {
    try {
      value = `${VERSION}z.${toBase64Url(await deflate(bytes))}`;
    } catch {
      // 압축이 실패하면 그대로 싣는다 — 링크가 길어질 뿐이다.
    }
  }
  value ??= `${VERSION}.${toBase64Url(bytes)}`;
  return value.length > MAX_LINK ? null : `r=${value}`;
}

/**
 * `#r=…`(맨 앞 `#`는 있어도 없어도 된다)를 풀어 영수증으로. 틀렸거나 잘렸거나 고친 링크면 null. 예외를 던지지 않는다.
 * `now`는 발행일이 미래인지 볼 때 쓴다.
 */
export async function decodeReceiptShare(
  hash: string,
  labels: MaskedNameLabels,
  now: Date = new Date(),
): Promise<SharedReceipt | null> {
  try {
    if (hash.length > MAX_LINK + 8) return null;
    const value = new URLSearchParams(hash.replace(/^#/, "")).get("r");
    if (!value || value.length > MAX_LINK) return null;
    const match = /^(\d+)(z?)\.([A-Za-z0-9_-]*)$/.exec(value);
    if (!match || !READABLE.includes(Number(match[1]) as (typeof READABLE)[number])) return null;
    const packed = fromBase64Url(match[3]);
    if (!packed) return null;
    let bytes: Uint8Array | null = packed;
    if (match[2] === "z") {
      if (!canCompress()) return null;
      bytes = await inflate(packed);
    }
    if (!bytes || bytes.length > MAX_BYTES) return null;
    const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const wire = JSON.parse(json) as unknown;
    // 접두사의 판과 안의 판이 다르면 고친 링크다.
    if ((wire as { v?: unknown } | null)?.v !== Number(match[1])) return null;
    return fromWire(wire, labels, now);
  } catch {
    return null;
  }
}
