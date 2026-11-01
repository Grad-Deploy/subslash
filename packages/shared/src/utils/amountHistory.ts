import type { AmountChange, Currency, PriceSnapshot, Subscription } from "../types";
import { startOfDay } from "./date";

/**
 * 사용자가 고친 금액의 기록(`Subscription.amountHistory`).
 *
 * 앱은 요금이 언제 바뀌었는지 모른다. 그래서 **사용자가 고친 그날부터** 새 금액이라고 본다 — 그 전의 결제는
 * 고치기 전 금액으로 셈한다(`priceAsOf`). 이 기록이 없을 때는 요금을 올려 적으면 지난 달 영수증까지 새
 * 금액으로 다시 계산됐다.
 *
 * 결제 기록(`chargeHistory`)에 넣지 않는다. 그쪽은 결제 메일이 보여 주는 결제라 등록 전 달을 채우는 증거로
 * 쓴다 — 사용자가 적은 값을 섞으면 결제가 없던 날이 결제한 날로, 적은 값이 청구액으로 읽힌다.
 *
 * 오타를 바로잡은 것과 요금이 바뀐 것은 앱이 가릴 수 없다. 다만 다음 둘은 바로잡은 것으로 본다.
 * - 등록한 날 고친 것: 등록한 값을 고친 것이라 기록하지 않는다(등록한 달의 결제도 새 금액이다).
 * - 같은 날 여러 번 고친 것: 하나로 합친다. 처음 값으로 되돌렸으면 기록을 지운다.
 */

/** 한 구독에 남길 기록 수. 넘으면 오래된 것부터 버린다. */
export const MAX_AMOUNT_HISTORY = 24;

const CURRENCIES: readonly Currency[] = ["KRW", "USD"];

const isPositive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;
const isOptionalNumber = (v: unknown) =>
  v === undefined || (typeof v === "number" && Number.isFinite(v) && v >= 0);

function isPriceSnapshot(value: unknown): value is PriceSnapshot {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    isPositive(r.amount) &&
    CURRENCIES.includes(r.currency as Currency) &&
    isOptionalNumber(r.taxRate) &&
    isOptionalNumber(r.sharingCount) &&
    isOptionalNumber(r.myShareAmount)
  );
}

export function isAmountChange(value: unknown): value is AmountChange {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.changedAt === "string" &&
    !Number.isNaN(Date.parse(r.changedAt)) &&
    isPriceSnapshot(r.before) &&
    isPriceSnapshot(r.after)
  );
}

/** 구독에서 결제액을 정하는 칸만. 없는 칸은 넣지 않는다. */
export function priceSnapshotOf(sub: PriceSnapshot): PriceSnapshot {
  const snapshot: PriceSnapshot = { amount: sub.amount, currency: sub.currency };
  if (sub.taxRate !== undefined) snapshot.taxRate = sub.taxRate;
  if (sub.sharingCount !== undefined) snapshot.sharingCount = sub.sharingCount;
  if (sub.myShareAmount !== undefined) snapshot.myShareAmount = sub.myShareAmount;
  return snapshot;
}

function samePrice(a: PriceSnapshot, b: PriceSnapshot): boolean {
  return (
    a.amount === b.amount &&
    a.currency === b.currency &&
    (a.taxRate ?? 0) === (b.taxRate ?? 0) &&
    (a.sharingCount ?? 1) === (b.sharingCount ?? 1) &&
    a.myShareAmount === b.myShareAmount
  );
}

function sameDay(a: string, b: Date): boolean {
  const day = new Date(a);
  return !Number.isNaN(day.getTime()) && startOfDay(day).getTime() === startOfDay(b).getTime();
}

/**
 * 구독을 `next`로 고칠 때 남길 금액 기록. 결제액을 정하는 칸이 바뀌지 않았으면 지금 기록을 그대로 돌려준다.
 * 돌려준 값이 `undefined`면 기록이 없는 것이다.
 */
export function nextAmountHistory(
  sub: Pick<Subscription, "createdAt" | "amountHistory"> & PriceSnapshot,
  next: PriceSnapshot,
  now: Date = new Date(),
): AmountChange[] | undefined {
  const history = sub.amountHistory ?? [];
  const before = priceSnapshotOf(sub);
  const after = priceSnapshotOf(next);
  if (samePrice(before, after) || !isPriceSnapshot(after)) return sub.amountHistory;
  // 등록한 날 고친 것은 등록한 값을 바로잡은 것이다.
  if (sameDay(sub.createdAt, now)) return sub.amountHistory;

  const last = history[history.length - 1];
  if (last && sameDay(last.changedAt, now)) {
    // 같은 날 다시 고쳤으면 그날의 처음 값에서 새 값으로 바뀐 것 하나로 둔다.
    const rest = history.slice(0, -1);
    const merged = samePrice(last.before, after)
      ? rest
      : [...rest, { changedAt: now.toISOString(), before: last.before, after }];
    return merged.length > 0 ? merged : undefined;
  }
  return [...history, { changedAt: now.toISOString(), before, after }].slice(-MAX_AMOUNT_HISTORY);
}

/**
 * `date`에 결제됐다면 그때의 금액으로 본 구독. 그날보다 뒤에 고친 기록이 있으면 그중 가장 이른 것의
 * 고치기 전 값이다 — 고친 날의 결제부터 새 금액이다. 기록이 없으면 지금 구독 그대로다.
 */
export function priceAsOf<T extends Subscription>(sub: T, date: Date): T {
  const day = startOfDay(date).getTime();
  const later = (sub.amountHistory ?? [])
    .filter(isAmountChange)
    .filter((change) => startOfDay(new Date(change.changedAt)).getTime() > day)
    .sort((a, b) => Date.parse(a.changedAt) - Date.parse(b.changedAt))[0];
  if (!later) return sub;
  const { before } = later;
  return {
    ...sub,
    amount: before.amount,
    currency: before.currency,
    taxRate: before.taxRate,
    sharingCount: before.sharingCount,
    myShareAmount: before.myShareAmount,
  };
}
