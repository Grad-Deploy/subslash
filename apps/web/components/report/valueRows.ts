import {
  calculateCostPerUse,
  getMyMonthlyAmountKRW,
  metricForSubscription,
  type RiskLevel,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { latestFreshLog, latestFreshLogFor, latestFreshUsage } from "@lib/checkins";
import { GOOD_AT } from "@lib/usage/value";

/** 1회 단가 순위의 한 줄. */
export interface ValueRow {
  sub: Subscription;
  monthlyKRW: number;
  /** 최근 체크인의 사용 횟수. 체크인 전이면 null(모름). */
  usageCount: number | null;
  costPerUse: number | null;
}

/** 횟수가 아닌 것으로 재는 구독의 한 줄. 색(돈값 기준)으로 줄 세운다. */
export interface OtherMetricRow {
  sub: Subscription;
  log: UsageLog | null;
}

/**
 * 순위의 기준. 한 번도 쓰지 않은 구독이 가장 아깝다 — calculateCostPerUse는 0회에 한 달 요금을
 * 돌려줘서, 그대로 두면 1번 쓴 더 비싼 구독보다 뒤로 밀렸다. 모르는 것(체크인 전)은 맨 뒤다.
 */
function rankKey(row: ValueRow): number {
  if (row.usageCount === 0) return Number.POSITIVE_INFINITY;
  return row.costPerUse ?? -1;
}

/** 빨강이 먼저, 체크인 전은 맨 뒤. */
function levelRank(log: UsageLog | null): number {
  if (!log) return -1;
  return log.riskLevel === "red" ? 2 : log.riskLevel === "yellow" ? 1 : 0;
}

/**
 * 횟수로 재는 구독의 1회 단가 순위. 비싼 것부터, 모르는 것은 뒤로 — 모름을 싸다고 읽지 않는다.
 * 시간·쓴 날·혜택·용량으로 재는 구독은 넣지 않는다. 시간당 ₩500과 1회 ₩500은 같은 줄에 세울 수 없다.
 */
export function buildValueRows(
  active: Subscription[],
  usageLogs: UsageLog[],
  rate: number,
  now: Date,
): ValueRow[] {
  return active
    .filter((sub) => metricForSubscription(sub) === "uses")
    .map((sub) => {
      const monthlyKRW = getMyMonthlyAmountKRW(sub, rate);
      const usageCount = latestFreshUsage(usageLogs, sub.id, now);
      return {
        sub,
        monthlyKRW,
        usageCount,
        costPerUse: usageCount === null ? null : calculateCostPerUse(monthlyKRW, usageCount),
      };
    })
    .sort((a, b) => rankKey(b) - rankKey(a));
}

/** 횟수 말고 다른 기준으로 재는 구독. 빨강(쉬어가도 될 구독)이 먼저, 체크인 전은 맨 뒤. */
export function buildOtherMetricRows(
  active: Subscription[],
  usageLogs: UsageLog[],
  now: Date,
): OtherMetricRow[] {
  return active
    .filter((sub) => metricForSubscription(sub) !== "uses")
    .map((sub) => ({ sub, log: latestFreshLog(usageLogs, sub.id, now) }))
    .sort((a, b) => levelRank(b.log) - levelRank(a.log));
}

/** 사용량 막대그래프(웹)의 막대 하나. */
export interface CheckInBar {
  sub: Subscription;
  metric: keyof typeof GOOD_AT;
  /** 최근 체크인에 적은 양(30일 동안의 횟수·쓴 날·시간). */
  quantity: number;
  /** '잘 씀' 기준 대비(0~1, 넘으면 1). 단위가 구독마다 달라 기준에 견준 비율로 막대를 맞춘다. */
  fraction: number;
  level: RiskLevel;
}

/**
 * 리포트의 사용량 막대그래프(웹). 웹에는 폰 사용 기록이 없으므로 최근 체크인으로 그린다. 횟수·쓴 날·시간으로
 * 재는 구독만 막대로 만들고(혜택·용량은 '잘 씀' 기준이 금액·비율이라 아래 칸에서 본다), 체크인 전이거나
 * 지표가 바뀌기 전의 체크인뿐인 구독은 막대 없이 센다 — 모름을 0으로 그리지 않는다. 기준에 가까운 순.
 */
export function buildCheckInBars(
  active: Subscription[],
  usageLogs: UsageLog[],
  now: Date,
): { bars: CheckInBar[]; pending: number; other: number } {
  const bars: CheckInBar[] = [];
  let pending = 0;
  let other = 0;
  for (const sub of active) {
    const metric = metricForSubscription(sub);
    if (metric !== "uses" && metric !== "days" && metric !== "hours") {
      other += 1;
      continue;
    }
    const log = latestFreshLogFor(usageLogs, sub, now);
    if (!log) {
      pending += 1;
      continue;
    }
    bars.push({
      sub,
      metric,
      quantity: log.usageCount,
      fraction: Math.min(1, log.usageCount / GOOD_AT[metric]),
      level: log.riskLevel,
    });
  }
  bars.sort((a, b) => b.fraction - a.fraction || b.quantity - a.quantity);
  return { bars, pending, other };
}
