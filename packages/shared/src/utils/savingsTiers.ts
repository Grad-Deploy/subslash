import type { Subscription } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { getNextBillingDateFor } from "./date";
import { getFirstBillingDateAfterKill, getKillCheckStatus } from "./killCheck";
import {
  getMyAnnualAmountKRW,
  getMyMonthDefendedAmountKRW,
  getMyMonthlyAmountKRW,
  sumMyAnnualKRW,
} from "./sharing";

/**
 * 절약을 세 칸으로 나눈다.
 *
 * 앱이 '절약'이라고 불러 온 숫자에는 셋이 섞여 있었다 — 해지한 구독의 1년치
 * 요금(앞으로 아낄 예상), 해지 뒤 지나간 결제일의 합(막은 결제), 그리고 그중
 * 결제가 정말 멈췄는지. 해지 버튼을 누른 것만으로는 돈을 지키지 못한다.
 * 결제일이 지나야 하고, 그날 결제가 없었다는 확인이 있어야 한다.
 *
 * 결제일이 '지났다'는 것은 결제일 다음 날부터다. 결제 문자는 당일 몇 시에
 * 올지 모르므로, 해지 확인(`getKillCheckStatus`)과 같은 기준을 쓴다.
 */

export interface SavingsTiers {
  /** 결제가 멈춘 것을 확인한 해지에서, 이미 지나간 결제일에 안 나간 내 몫. 머리 숫자. */
  confirmed: number;
  /** 첫 결제일이 지났지만 결제가 멈췄는지 아직 답하지 않은 해지의 같은 금액. */
  pending: number;
  /** 확인 대기인 해지 수. */
  pendingCount: number;
  /** 해지를 유지하면 1년에 아끼는 금액(연간 환산). 이미 아낀 돈이 아니다. */
  annualRunRate: number;
  /** 결제 월이나 해지 날짜를 몰라 어느 칸에도 넣지 못한 해지 수. */
  unknownCount: number;
}

/** 결제일을 세는 구간. `to`는 넣지 않는다(그날 결제일은 세지 않는다). */
export interface DefenseRange {
  from?: Date;
  to: Date;
}

/** 깨진 데이터로 끝없이 돌지 않게 막는 상한. 월 결제 100년치. */
const MAX_BILLING_DATES = 1200;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 결제일 한 번에 빠져나갔을 내 몫(KRW). 연간 플랜은 한 번에 1년치가 나간다. */
function chargeKRW(sub: Subscription, rate: number): number {
  return sub.billingCycle === "yearly"
    ? getMyAnnualAmountKRW(sub, rate)
    : getMyMonthlyAmountKRW(sub, rate);
}

/**
 * 해지 뒤 결제일마다 빠져나가지 않은 내 몫을 구간 안에서 더한다. 연도를
 * 넘어 이어진다.
 *
 * 첫 결제일은 해지 확인과 같다(`getFirstBillingDateAfterKill` — 해지한 날의
 * 결제일도 포함). 결제 월을 모르는 연간 구독이나 해지 날짜가 없는 구독은
 * 결제일을 정할 수 없으므로 `null`이다.
 */
export function getDefendedBetweenKRW(
  sub: Subscription,
  range: DefenseRange,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number | null {
  let date = getFirstBillingDateAfterKill(sub);
  if (!date) return null;

  const charge = chargeKRW(sub, rate);
  let total = 0;
  for (let i = 0; date && date.getTime() < range.to.getTime() && i < MAX_BILLING_DATES; i += 1) {
    if (!range.from || date.getTime() >= range.from.getTime()) total += charge;
    // 결제일 당일을 기준으로 넘기면 그다음 결제일이 나온다.
    date = getNextBillingDateFor(sub, date);
  }
  return total;
}

/**
 * 해지한 구독의 절약을 지킨 돈 / 확인 대기 / 앞으로로 나눈다.
 *
 * `range`를 주면 그 구간의 결제일만 센다(올해 결산처럼). 구간 끝이 오늘보다
 * 뒤여도 아직 오지 않은 결제일은 세지 않는다.
 */
export function getSavingsTiers(
  subs: Subscription[],
  now: Date = new Date(),
  rate: number = DEFAULT_EXCHANGE_RATE,
  range?: DefenseRange,
): SavingsTiers {
  const killed = subs.filter((sub) => sub.status === "killed");
  const today = startOfDay(now);
  const to = range && range.to.getTime() < today.getTime() ? range.to : today;

  let confirmed = 0;
  let pending = 0;
  let pendingCount = 0;
  let unknownCount = 0;

  for (const sub of killed) {
    const check = getKillCheckStatus(sub, now);
    const amount = getDefendedBetweenKRW(sub, { from: range?.from, to }, rate);
    if (!check || check.state === "unknown" || amount === null) {
      unknownCount += 1;
      continue;
    }
    if (check.state === "verified") {
      confirmed += amount;
    } else if (check.state === "due") {
      pending += amount;
      if (amount > 0) pendingCount += 1;
    }
    // "waiting": 첫 결제일이 오지 않아 지나간 결제일이 없다.
  }

  return {
    confirmed,
    pending,
    pendingCount,
    annualRunRate: sumMyAnnualKRW(killed, rate),
    unknownCount,
  };
}

export interface MonthDefenseSplit {
  /** 이번 달 결제일이 이미 지났고, 그 전에 해지해 빠져나가지 않았을 금액. */
  passed: number;
  /** 이번 달 결제일이 아직 오지 않았다. 해지를 유지하면 빠져나가지 않을 금액. */
  upcoming: number;
  /** 결제 월을 몰라 이번 달 결제 여부를 알 수 없는 해지 수. */
  unknownCount: number;
}

/**
 * 이번 달 결제일을 지나간 것과 남은 것으로 나눈다.
 *
 * 예전 '이번 달 방어' 위젯은 결제일이 아직 오지 않았어도 이번 달 금액을 전부
 * 지킨 것으로 셌다. 금액 판단(해지가 결제일 전이었는지)은
 * `getMyMonthDefendedAmountKRW`에 맡기고, 여기서는 결제일이 지났는지만 가른다.
 */
export function splitThisMonthDefendedKRW(
  subs: Subscription[],
  now: Date = new Date(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): MonthDefenseSplit {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = startOfDay(now);
  const daysInMonth = new Date(year, month, 0).getDate();

  let passed = 0;
  let upcoming = 0;
  let unknownCount = 0;

  for (const sub of subs) {
    if (sub.status !== "killed") continue;
    const amount = getMyMonthDefendedAmountKRW(sub, year, month, rate);
    if (amount === null) {
      unknownCount += 1;
      continue;
    }
    if (amount === 0) continue;

    // getMyMonthDefendedAmountKRW와 같은 방식으로 이 달의 결제일을 정한다.
    const day = Math.min(Math.max(1, sub.billingDay || 1), daysInMonth);
    const billingDate = new Date(year, month - 1, day);
    if (billingDate.getTime() < today.getTime()) passed += amount;
    else upcoming += amount;
  }

  return { passed, upcoming, unknownCount };
}
