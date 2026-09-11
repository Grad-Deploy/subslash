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
  billingDay: number;
  killedAt?: string;
  billingMonth?: number;
};

/** "매월 15일", "매년 3월 15일". 결제 월을 모르는 연간 구독에는 날짜를 붙이지 않는다. */
function describeBillingSchedule(sub: {
  billingDay: number;
  billingCycle?: BillingCycle;
  billingMonth?: number;
}): string {
  if (sub.billingCycle !== "yearly") return `매월 ${sub.billingDay}일`;
  return typeof sub.billingMonth === "number"
    ? `매년 ${sub.billingMonth}월 ${sub.billingDay}일`
    : "매년 1회";
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
  billingCycle?: BillingCycle;
  billingMonth?: number;
  sharingCount?: number;
  myShareAmount?: number;
}): string {
  const count = getSharingCount(sub);
  const perPerson = count > 1 ? getOthersShareAmount(sub) / (count - 1) : 0;
  const total = formatAmount(sub.amount, sub.currency);
  const each =
    sub.currency === "KRW" ? formatKRW(perPerson) : formatAmount(perPerson, sub.currency);

  return `[${sub.name}] ${describeBillingSchedule(sub)} ${total} 결제 · ${count}명이서 나눠서 1인 ${each}입니다. 정산 부탁드려요!`;
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
  sub: DefendedSubscription,
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

/**
 * 한 해 동안 해지 덕분에 실제로 빠져나가지 않은 금액.
 *
 * 그 해의 결제일을 달마다 `getMyMonthDefendedAmountKRW`로 따져 더한다. 예전
 * 계산은 해지한 달을 통째로 방어로 세어서, 결제일이 지난 뒤 해지해도 그 달
 * 돈을 지킨 것으로 쳤다 — 같은 화면의 '이번 달 방어' 위젯은 0원이라고
 * 말하는데도.
 *
 * 결제 월을 모르는 연간 구독은 올해 결제가 해지 전이었는지 후였는지 알 수
 * 없으므로 `null`이다. 남은 달 수로 나눠 채우면, 실제로는 전액이거나 0원인
 * 금액을 그 사이 어딘가로 지어내게 된다.
 */
export function getMyYearDefendedAmountKRW(
  sub: DefendedSubscription,
  targetYear: number = new Date().getFullYear(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): number | null {
  let total = 0;
  for (let month = 1; month <= 12; month += 1) {
    const defended = getMyMonthDefendedAmountKRW(sub, targetYear, month, rate);
    if (defended === null) return null;
    total += defended;
  }
  return total;
}

/** 방어액 합계와, 판단할 수 없어 합계에서 뺀 구독 수. */
export interface DefendedSummary {
  amount: number;
  /** 결제 월이나 해지 시각을 몰라 합계에 넣지 못한 구독 수. */
  unknownCount: number;
}

function summarizeDefended(
  subs: DefendedSubscription[],
  defendedOf: (sub: DefendedSubscription) => number | null,
): DefendedSummary {
  return subs.reduce<DefendedSummary>(
    (acc, sub) => {
      const defended = defendedOf(sub);
      if (defended === null) return { ...acc, unknownCount: acc.unknownCount + 1 };
      return { ...acc, amount: acc.amount + defended };
    },
    { amount: 0, unknownCount: 0 },
  );
}

export function sumMyMonthDefendedKRW(
  subs: DefendedSubscription[],
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  rate: number = DEFAULT_EXCHANGE_RATE,
): DefendedSummary {
  return summarizeDefended(subs, (sub) => getMyMonthDefendedAmountKRW(sub, year, month, rate));
}

export function sumMyYearDefendedKRW(
  subs: DefendedSubscription[],
  targetYear: number = new Date().getFullYear(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): DefendedSummary {
  return summarizeDefended(subs, (sub) => getMyYearDefendedAmountKRW(sub, targetYear, rate));
}

export interface MonthDefended {
  month: number;
  amount: number;
  /**
   * 아직 오지 않은 달. 이 달의 금액은 "해지하지 않았다면 나갔을 예정"이지
   * 이미 지킨 돈이 아니다.
   */
  isFuture: boolean;
}

export interface YearDefendedSeries {
  months: MonthDefended[];
  /** 지난 달과 이번 달에 지킨 금액. */
  pastAmount: number;
  /** 남은 달에 지킬 예정인 금액. `pastAmount`와 더하면 `sumMyYearDefendedKRW`와 같다. */
  scheduledAmount: number;
  /** 결제 월이나 해지 시각을 몰라 어느 달에도 넣지 못한 구독 수. */
  unknownCount: number;
}

/**
 * 한 해의 방어액을 달별로 나눈다.
 *
 * 올해 방어액(`sumMyYearDefendedKRW`)은 남은 달의 결제일까지 더한 값이다. 달별로
 * 펼쳐야 그중 얼마를 이미 지켰고 얼마가 아직 예정인지 구분된다 — 12월까지 더한
 * 금액을 "지금까지 아낀 돈"으로 보여주면 사실이 아니다.
 *
 * 이번 달은 지난 달로 센다. 이번 달 방어액은 결제일 전에 해지했다는 사실로 이미
 * 정해지기 때문이다(대시보드의 '이번 달 방어' 위젯과 같은 기준).
 *
 * 한 달이라도 판단할 수 없는 구독은 열두 달 모두 판단할 수 없다(결제 월 미설정,
 * 깨진 해지 시각). 그런 구독은 어느 달에도 0으로 넣지 않고 `unknownCount`로 센다.
 */
export function getYearDefendedSeries(
  subs: DefendedSubscription[],
  targetYear: number,
  rate: number = DEFAULT_EXCHANGE_RATE,
  now: Date = new Date(),
): YearDefendedSeries {
  const known = subs.filter((sub) => getMyYearDefendedAmountKRW(sub, targetYear, rate) !== null);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const months = Array.from({ length: 12 }, (_, index): MonthDefended => {
    const month = index + 1;
    return {
      month,
      amount: sumMyMonthDefendedKRW(known, targetYear, month, rate).amount,
      isFuture: targetYear > currentYear || (targetYear === currentYear && month > currentMonth),
    };
  });

  let pastAmount = 0;
  let scheduledAmount = 0;
  for (const { amount, isFuture } of months) {
    if (isFuture) scheduledAmount += amount;
    else pastAmount += amount;
  }

  return { months, pastAmount, scheduledAmount, unknownCount: subs.length - known.length };
}
