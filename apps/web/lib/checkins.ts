import {
  metricForSubscription,
  metricOfLog,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

/** 체크인이 이보다 오래됐으면 이용량을 모른다고 본다(일). 리포트의 1회 단가도 같은 기준을 쓴다. */
export const USAGE_FRESH_DAYS = 45;

/** 이 구독의 최근 체크인(지표와 관계없이). `USAGE_FRESH_DAYS`보다 오래됐으면 null. */
export function latestFreshLog(
  usageLogs: UsageLog[],
  subscriptionId: string,
  now: Date = new Date(),
): UsageLog | null {
  const freshAfter = now.getTime() - USAGE_FRESH_DAYS * 24 * 60 * 60 * 1000;
  let latest: UsageLog | null = null;
  for (const log of usageLogs) {
    if (log.subscriptionId !== subscriptionId) continue;
    const checkedAt = Date.parse(log.checkedAt);
    if (checkedAt < freshAfter) continue;
    if (!latest || checkedAt > Date.parse(latest.checkedAt)) latest = log;
  }
  return latest;
}

/**
 * 이 구독의 최근 체크인 이용 횟수. 체크인이 없거나 `USAGE_FRESH_DAYS`보다 오래됐으면 null이다 —
 * 오래된 횟수를 지금 것으로, 모름을 0회로 읽지 않는다. 횟수 체크인만 본다 — 시간·쓴 날·혜택 금액을
 * 횟수로 읽지 않는다(utils/valueMetric).
 */
export function latestFreshUsage(
  usageLogs: UsageLog[],
  subscriptionId: string,
  now: Date = new Date(),
): number | null {
  const latest = latestFreshLog(usageLogs, subscriptionId, now);
  if (!latest || metricOfLog(latest) !== "uses") return null;
  return latest.usageCount;
}

/**
 * 이 구독이 지금 재는 지표로 적은 최근 체크인. 체크인 전이거나 지표가 바뀌기 전의 옛 체크인뿐이면 null —
 * 음악을 시간으로 재게 된 뒤에 남은 '5회' 체크인을 5시간으로 읽지 않는다.
 */
export function latestFreshLogFor(
  usageLogs: UsageLog[],
  sub: Subscription,
  now: Date = new Date(),
): UsageLog | null {
  const log = latestFreshLog(usageLogs, sub.id, now);
  return log && metricOfLog(log) === metricForSubscription(sub) ? log : null;
}
