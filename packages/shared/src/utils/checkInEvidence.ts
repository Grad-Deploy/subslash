import type { UsageLog } from "../types";
import { parseTimestamp } from "./date";

type CheckInLog = Pick<UsageLog, "usageCount" | "costPerUse" | "checkedAt" | "metric">;

/**
 * 가장 늦은 체크인. `include`가 있으면 그것이 받아 준 것 중에서 고른다. 시각이 같으면 나중에 기록한(배열에서
 * 뒤에 있는) 것을 최신으로 보고, 시각을 읽을 수 없는 기록은 고르지 않는다 — 언제인지 모르는 체크인을 '최근'이라고
 * 말하지 않는다. 없으면 `null`.
 */
export function latestCheckIn<T extends Pick<UsageLog, "checkedAt">>(
  logs: Iterable<T>,
  include?: (log: T, at: Date) => boolean,
): T | null {
  let latest: T | null = null;
  let latestTime = -Infinity;
  for (const log of logs) {
    const at = parseTimestamp(log.checkedAt);
    if (!at || (include && !include(log, at))) continue;
    if (at.getTime() >= latestTime) {
      latest = log;
      latestTime = at.getTime();
    }
  }
  return latest;
}

/** 구독마다 가장 늦은 체크인(`latestCheckIn`과 같은 기준). */
export function latestCheckInBySubscription<
  T extends Pick<UsageLog, "checkedAt" | "subscriptionId">,
>(logs: Iterable<T>): Map<string, T> {
  const bySubscription = new Map<string, T[]>();
  for (const log of logs) {
    const list = bySubscription.get(log.subscriptionId);
    if (list) list.push(log);
    else bySubscription.set(log.subscriptionId, [log]);
  }
  const latest = new Map<string, T>();
  for (const [id, list] of bySubscription) {
    const log = latestCheckIn(list);
    if (log) latest.set(id, log);
  }
  return latest;
}

/** 평균을 낼 최근 체크인 수. */
export const CHECK_IN_EVIDENCE_WINDOW = 3;

export interface CheckInChange {
  /** 이용 횟수 변화(최근 − 직전). */
  usage: number;
  /** 1회당 비용 변화(최근 − 직전), 구독의 통화 그대로. */
  costPerUse: number;
  /**
   * 두 체크인 사이에 한 달치 내 몫이 바뀌었는가. 바뀌었다면 1회당 변화에는 이용
   * 횟수 말고 요금 변화도 섞여 있다.
   */
  priceChanged: boolean;
}

export interface CheckInEvidence<T extends CheckInLog = CheckInLog> {
  /** 최근 체크인, 최신 순. 최대 `CHECK_IN_EVIDENCE_WINDOW`회. */
  recent: T[];
  /** `recent`의 평균 이용 횟수(30일 기준). */
  averageUsage: number;
  latest: T;
  /**
   * 직전 체크인과의 변화. 체크인이 한 번뿐이면 비교할 대상이 없어 `null`이다 —
   * 0으로 채우면 "변화 없음"이라고 말하는 셈이 된다.
   */
  change: CheckInChange | null;
}

/**
 * 체크인 한 번에 담긴 한 달치 내 몫. 기록에는 1회당 비용만 남아 있어서 되짚는다.
 * 이용 0회면 `calculateCostPerUse`가 한 달치를 그대로 1회당 비용으로 저장한다.
 */
function monthlyCostOf(log: CheckInLog): number {
  return log.usageCount === 0 ? log.costPerUse : log.costPerUse * log.usageCount;
}

/**
 * 구독 상세에 보여줄 체크인 근거: 최근 평균, 마지막 1회당 비용, 직전 대비 변화.
 *
 * 1회당 비용을 여러 체크인에 걸쳐 평균 내지 않는다. 그 사이 요금이 바뀌었으면
 * 비율의 평균은 어느 달의 사실도 아니다. 기록된 값을 그때의 값으로 보여준다.
 *
 * 기록이 없으면 `null`이다.
 */
export function getCheckInEvidence<T extends CheckInLog>(logs: T[]): CheckInEvidence<T> | null {
  if (logs.length === 0) return null;

  // 기록은 추가된 순서로 쌓이지만 그 순서를 믿지 않고 체크인 시각으로 줄 세운다.
  // 시각이 같거나 읽을 수 없으면 나중에 추가된 것을 최신으로 본다.
  const ordered = logs
    .map((log, index) => ({ log, index }))
    .sort((a, b) => {
      const diff = Date.parse(b.log.checkedAt) - Date.parse(a.log.checkedAt);
      return Number.isNaN(diff) || diff === 0 ? b.index - a.index : diff;
    })
    .map(({ log }) => log);

  // 재는 것이 바뀐 적이 있으면(예전 횟수 체크인 → 시간) 최근 것과 같은 지표끼리만 평균·비교한다.
  // 12회와 12시간을 한 평균에 넣으면 어느 쪽의 사실도 아니다.
  const metricOf = (log: CheckInLog) => log.metric ?? "uses";
  const sameMetric = ordered.filter((log) => metricOf(log) === metricOf(ordered[0]));
  const recent = sameMetric.slice(0, CHECK_IN_EVIDENCE_WINDOW);
  const averageUsage = recent.reduce((sum, log) => sum + log.usageCount, 0) / recent.length;
  const [latest, previous] = sameMetric;

  if (!previous) return { recent, averageUsage, latest, change: null };

  const latestMonthly = monthlyCostOf(latest);
  const previousMonthly = monthlyCostOf(previous);
  return {
    recent,
    averageUsage,
    latest,
    change: {
      usage: latest.usageCount - previous.usageCount,
      costPerUse: latest.costPerUse - previous.costPerUse,
      priceChanged:
        Math.abs(latestMonthly - previousMonthly) >
        Math.max(latestMonthly, previousMonthly) * 0.001,
    },
  };
}
