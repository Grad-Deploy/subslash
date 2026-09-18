import {
  getBilledAmount,
  isInTrial,
  needsBillingMonth,
  toKRW,
  type Subscription,
} from "@subslash/shared";

/**
 * 대시보드 결제 캘린더가 그릴 한 달치.
 *
 * `getNextBillingDateFor`는 "지금 기준 다음 결제일"을 답한다. 캘린더가 묻는 것은 다른 질문이다 —
 * "보고 있는 달의 며칠에 청구되는가". 그 달의 1일을 기준으로 다음 결제일을 구하면 결제일이 1일인
 * 구독이 다음 달로 밀려 어느 달에도 찍히지 않는다(`getNextBillingDate`는 결제일 당일을 지난 것으로
 * 친다). 그래서 달을 고정해 놓고 그 달의 결제일을 직접 구한다. 짧은 달로 당기는 규칙(29~31일)은
 * 캘린더 피드의 RRULE(`BYMONTHDAY=<일>,-1;BYSETPOS=1`)과 같다.
 */

export interface BillingMonth {
  year: number;
  /** 0-11. */
  monthIndex: number;
  /** 날짜(1-31) → 그날 청구되는 구독. 결제가 없는 날은 들어 있지 않다. */
  days: Map<number, Subscription[]>;
  /** 이 달에 청구되는 건수. */
  billingCount: number;
  /** 이 달에 카드에 찍히는 금액의 합(원 환산). */
  totalKRW: number;
  /**
   * 결제 월을 몰라 어느 날에도 찍지 못한 구독 수.
   *
   * 화면은 이 수를 반드시 말해야 한다. 조용히 빼면 "내 연간 구독이 왜 캘린더에 없지"로 남고,
   * 아무 달에나 찍으면 있지도 않은 결제를 사실처럼 보여주게 된다.
   */
  undatedCount: number;
}

/** 카드 회사가 하는 것처럼, 그 달에 없는 날짜(2월 30일 등)는 말일로 당긴다. */
function effectiveDay(year: number, monthIndex: number, billingDay: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(billingDay, lastDay);
}

/** 이 구독이 그 달에 청구되는 날. 청구되지 않으면 null. */
export function billingDayInMonth(
  sub: Pick<Subscription, "billingDay" | "billingCycle" | "billingMonth">,
  year: number,
  monthIndex: number,
): number | null {
  if (sub.billingCycle === "yearly") {
    if (needsBillingMonth(sub)) return null;
    if (sub.billingMonth !== monthIndex + 1) return null;
  }
  return effectiveDay(year, monthIndex, sub.billingDay);
}

/**
 * 한 달치 결제를 날짜별로 모은다. 구독 중인 것만 센다 — 해지한 구독은 청구되지 않는다.
 *
 * 금액은 카드에 찍히는 값(`getBilledAmount`: 공유 구독이면 나누기 전 전체, 연간이면 1년치, 세금
 * 포함)이고, 합계는 사용자 환율로 원 환산한다.
 */
export function buildBillingMonth(
  subscriptions: Subscription[],
  year: number,
  monthIndex: number,
  rate: number,
): BillingMonth {
  const days = new Map<number, Subscription[]>();
  let undatedCount = 0;
  let billingCount = 0;
  let totalKRW = 0;

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;
    // 체험 중이면 그 달에 청구되지 않는다. 찍으면 있지도 않은 결제를 달력에 올리게 된다.
    if (isInTrial(sub, new Date(year, monthIndex, 1))) continue;
    if (needsBillingMonth(sub)) {
      undatedCount += 1;
      continue;
    }
    const day = billingDayInMonth(sub, year, monthIndex);
    if (day === null) continue;

    const onDay = days.get(day);
    if (onDay) onDay.push(sub);
    else days.set(day, [sub]);
    billingCount += 1;
    totalKRW += toKRW(getBilledAmount(sub), sub.currency, rate);
  }

  return { year, monthIndex, days, billingCount, totalKRW, undatedCount };
}

/** 그날 카드에 찍히는 금액의 합(원 환산). */
export function dayTotalKRW(subs: Subscription[], rate: number): number {
  return subs.reduce((sum, sub) => sum + toKRW(getBilledAmount(sub), sub.currency, rate), 0);
}

/**
 * 이 달에서 오늘 이후(오늘 포함) 가장 가까운 결제일. 없으면 null.
 *
 * 캘린더를 열었을 때 처음 고를 날이다. 지난 결제일을 골라 두면 "다음에 무엇이 나가는가"라는
 * 질문에 답하지 못한다.
 */
export function nextBillingDayInMonth(month: BillingMonth, today: number): number | null {
  const upcoming = [...month.days.keys()].filter((day) => day >= today).sort((a, b) => a - b);
  return upcoming[0] ?? null;
}
