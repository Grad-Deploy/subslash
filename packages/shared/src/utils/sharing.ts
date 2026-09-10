import { BillingCycle, Currency } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { formatAmount, formatKRW, getAnnualAmountKRW, getMonthlyAmountKRW } from "./currency";

/** The fields that describe how a plan is split. */
export interface SharedPlan {
  amount: number;
  sharingCount?: number;
  myShareAmount?: number;
}

/** A plan is only "shared" once more than one person is on it. */
export function isShared(sub: SharedPlan): boolean {
  return (sub.sharingCount ?? 1) > 1;
}

/** People on the plan, normalised: anything below 1 is one person. */
export function getSharingCount(sub: SharedPlan): number {
  const count = sub.sharingCount ?? 1;
  return Number.isFinite(count) && count > 1 ? Math.floor(count) : 1;
}

/**
 * The slice of the bill the user carries, in the subscription's own currency.
 *
 * An explicit `myShareAmount` wins because real splits are often uneven — the
 * person holding the card frequently pays a bit more. Without one the bill is
 * divided evenly.
 */
export function getMyShareAmount(sub: SharedPlan): number {
  if (typeof sub.myShareAmount === "number" && Number.isFinite(sub.myShareAmount)) {
    return Math.max(0, sub.myShareAmount);
  }
  return sub.amount / getSharingCount(sub);
}

/**
 * What one month of this plan costs the user, in the subscription's own
 * currency.
 *
 * This is the figure the cost-per-use engine must divide: a check-in asks how
 * many times the service was used in the last 30 days, so pairing that count
 * with a yearly charge reports a per-use cost twelve times too high.
 */
export function getMyMonthlyShareAmount(sub: SharedPlan & { billingCycle?: BillingCycle }): number {
  const mine = getMyShareAmount(sub);
  return sub.billingCycle === "yearly" ? mine / 12 : mine;
}

/** What the other members owe the payer each billing date, in their currency. */
export function getOthersShareAmount(sub: SharedPlan): number {
  return Math.max(0, sub.amount - getMyShareAmount(sub));
}

type SharedSubscription = SharedPlan & { currency: Currency; billingCycle?: BillingCycle };

/**
 * The same subscription restated as the user's own cost, so the existing KRW
 * helpers can be reused instead of a second conversion path.
 */
function asMyShare<T extends SharedSubscription>(sub: T): T {
  return { ...sub, amount: getMyShareAmount(sub) };
}

/** The user's own monthly cost in KRW, after splitting. */
export function getMyMonthlyAmountKRW(
  sub: SharedSubscription,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return getMonthlyAmountKRW(asMyShare(sub), rate);
}

/** The user's own annual cost in KRW, after splitting. */
export function getMyAnnualAmountKRW(
  sub: SharedSubscription,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return getAnnualAmountKRW(asMyShare(sub), rate);
}

/** Sum of what the user personally pays each month, in KRW. */
export function sumMyMonthlyKRW(
  subs: SharedSubscription[],
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getMyMonthlyAmountKRW(sub, rate), 0);
}

/** Sum of what the user personally pays each year, in KRW. */
export function sumMyAnnualKRW(
  subs: SharedSubscription[],
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getMyAnnualAmountKRW(sub, rate), 0);
}

export type DefendedSubscription = SharedSubscription & {
  killedAt?: string;
  billingMonth?: number;
};

/**
 * Calculates the defended savings for the given subscription in a specific calendar year (defaults to current year).
 * If killed in September 2026, the remaining months of 2026 (Sep, Oct, Nov, Dec = 4 months) are considered defended in 2026.
 * For yearly plans, if billingMonth is in the defended window, the yearly amount is counted; otherwise 0.
 */
export function getMyYearDefendedAmountKRW(
  sub: DefendedSubscription,
  targetYear: number = new Date().getFullYear(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  if (!sub.killedAt) {
    return getMyAnnualAmountKRW(sub, rate);
  }

  const killDate = new Date(sub.killedAt);
  const killYear = killDate.getFullYear();

  if (killYear > targetYear) {
    // Was killed in a future year; in targetYear it was still active
    return 0;
  }

  if (killYear < targetYear) {
    // Was killed before targetYear; defended for the entire targetYear
    return getMyAnnualAmountKRW(sub, rate);
  }

  // killYear === targetYear: months remaining in this year from kill month onwards
  const killMonth = killDate.getMonth() + 1; // 1-12

  if (sub.billingCycle === "yearly") {
    if (typeof sub.billingMonth === "number") {
      // If the yearly billing month was after or in the kill month, it was successfully prevented
      if (sub.billingMonth >= killMonth) {
        return getMyAnnualAmountKRW(sub, rate);
      }
      // If billing month was earlier in the year, this year's payment already took place
      return 0;
    }
    // Pro-rate if yearly billing month is unknown
    const remainingFraction = Math.max(0, 13 - killMonth) / 12;
    return Math.round(getMyAnnualAmountKRW(sub, rate) * remainingFraction);
  }

  // Monthly billing: number of billing cycles saved from kill month through December
  const remainingMonths = Math.max(0, 13 - killMonth);
  return Math.round(getMyMonthlyAmountKRW(sub, rate) * remainingMonths);
}

/**
 * Sum of defended savings in the target calendar year across multiple subscriptions.
 */
export function sumMyYearDefendedKRW(
  subs: DefendedSubscription[],
  targetYear: number = new Date().getFullYear(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getMyYearDefendedAmountKRW(sub, targetYear, rate), 0);
}

/**
 * Message the payer sends to the other members to collect their share.
 *
 * Deliberately plain text rather than a payment-app deep link: a transfer link
 * needs the recipient's bank and account number, which this app never asks for,
 * and a link built without them would open an empty transfer screen while
 * promising a one-tap request.
 */
export function formatSettlementMessage(sub: {
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number;
  sharingCount?: number;
  myShareAmount?: number;
}): string {
  const count = getSharingCount(sub);
  const perPerson = count > 1 ? getOthersShareAmount(sub) / (count - 1) : 0;
  const total = formatAmount(sub.amount, sub.currency);
  const each =
    sub.currency === "KRW" ? formatKRW(perPerson) : formatAmount(perPerson, sub.currency);

  return `[${sub.name}] 매월 ${sub.billingDay}일 ${total} 결제 · ${count}명이서 나눠서 1인 ${each}입니다. 정산 부탁드려요!`;
}

/**
 * 이번 달에 실제로 통장에서 빠져나가지 않은 금액.
 *
 * 해지했다고 해서 이번 달 결제가 전부 막힌 것은 아니다. 결제일이 이미
 * 지난 뒤에 해지했다면 그 달 돈은 이미 나갔으므로 0이다.
 *
 * 결제 월을 모르는 연간 구독은 이번 달에 결제일이 있었는지 판단할 근거가
 * 없으므로 `null`을 반환한다. 화면은 이 값을 0으로 합산하지 말고 '미설정'
 * 으로 따로 세어야 한다.
 */
export function getMyMonthDefendedAmountKRW(
  sub: DefendedSubscription & { billingDay: number },
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number | null {
  if (sub.billingCycle === "yearly" && typeof sub.billingMonth !== "number") {
    return null;
  }

  if (sub.billingCycle === "yearly" && sub.billingMonth !== month) {
    return 0;
  }

  // 해당 월에 결제일이 며칠인지. 31일 결제인데 30일까지인 달이면 말일로 본다.
  const daysInMonth = new Date(year, month, 0).getDate();
  const billingDay = Math.min(Math.max(1, sub.billingDay || 1), daysInMonth);
  const billingDate = new Date(year, month - 1, billingDay);

  if (sub.killedAt) {
    const killDate = new Date(sub.killedAt);
    if (Number.isNaN(killDate.getTime())) return null;
    // 결제일이 지난 뒤에 해지했다면 이번 달 돈은 이미 나갔다. 비교는 시각이
    // 아니라 날짜 단위로 한다 — 결제일 당일 몇 시에 눌렀는지까지 따지면
    // 표준시가 다른 곳에서 하루가 밀려 방어액이 통째로 사라진다.
    const killDay = new Date(killDate.getFullYear(), killDate.getMonth(), killDate.getDate());
    if (killDay.getTime() > billingDate.getTime()) return 0;
  }

  return sub.billingCycle === "yearly"
    ? getMyAnnualAmountKRW(sub, rate)
    : getMyMonthlyAmountKRW(sub, rate);
}

/** `getMyMonthDefendedAmountKRW`의 합계와, 판단할 수 없었던 구독 수. */
export interface MonthDefendedSummary {
  amount: number;
  /** 결제 월을 몰라 합계에 넣지 못한 연간 구독 수. */
  unknownCount: number;
}

export function sumMyMonthDefendedKRW(
  subs: (DefendedSubscription & { billingDay: number })[],
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  rate: number = DEFAULT_EXCHANGE_RATE,
): MonthDefendedSummary {
  return subs.reduce<MonthDefendedSummary>(
    (acc, sub) => {
      const defended = getMyMonthDefendedAmountKRW(sub, year, month, rate);
      if (defended === null) return { ...acc, unknownCount: acc.unknownCount + 1 };
      return { ...acc, amount: acc.amount + defended };
    },
    { amount: 0, unknownCount: 0 },
  );
}
