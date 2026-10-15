import { metricOfLog, type UsageLog, type ValueMetric, localMonthKey } from "@subslash/shared";

/** 한 달의 체크인 수량. 그 달에 체크인하지 않았으면 null이다 — 0(안 썼다)과 다르다. */
export interface CheckInMonth {
  /** `YYYY-MM` */
  month: string;
  quantity: number | null;
}

export interface CheckInMonths {
  months: CheckInMonth[];
  /** 기간 안에서 지금 지표와 다른 기준으로 센 체크인 수. 단위가 달라 같은 축에 그리지 않는다. */
  otherMetric: number;
}

/**
 * 구독 상세의 달별 체크인 막대(최근 `count`달, 이번 달이 마지막). 체크인은 "최근 30일 동안 얼마나"를 한
 * 달에 한 번 적은 숫자라 날마다·요일마다로 나눌 수 없다 — 나누면 지어낸 숫자가 된다. 같은 달에 여러 번
 * 체크인했으면 마지막 것을 쓴다(체크인 근거 칸의 '마지막 체크인'과 같다). 지표가 바뀌기 전의 체크인
 * (예: 횟수로 세다가 쓴 날로 바뀐 구독)은 단위가 달라 빼고 몇 건인지만 돌려준다.
 */
export function checkInMonths(
  logs: readonly UsageLog[],
  metric: ValueMetric,
  now: Date,
  count = 12,
): CheckInMonths {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(localMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const inRange = new Set(keys);
  const latest = new Map<string, UsageLog>();
  let otherMetric = 0;
  for (const log of logs) {
    if (!inRange.has(log.month)) continue;
    if (metricOfLog(log) !== metric) {
      otherMetric += 1;
      continue;
    }
    const prev = latest.get(log.month);
    if (!prev || log.checkedAt > prev.checkedAt) latest.set(log.month, log);
  }
  return {
    months: keys.map((month) => ({ month, quantity: latest.get(month)?.usageCount ?? null })),
    otherMetric,
  };
}
