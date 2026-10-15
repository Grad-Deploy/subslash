import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { latestFreshLogFor, latestFreshUsage } from "../../lib/checkins";

const NOW = new Date("2026-09-24T12:00:00+09:00");

const log = (
  subscriptionId: string,
  usageCount: number,
  daysAgo: number,
  metric?: UsageLog["metric"],
): UsageLog => ({
  id: `${subscriptionId}-${daysAgo}`,
  subscriptionId,
  month: "2026-09",
  usageCount,
  costPerUse: 0,
  riskLevel: "green",
  checkedAt: new Date(NOW.getTime() - daysAgo * 86400000).toISOString(),
  ...(metric ? { metric } : {}),
});

describe("최근 체크인 이용 횟수", () => {
  it("가장 최근의 것을, 45일 안의 것만 쓴다", () => {
    const logs = [log("s1", 3, 10), log("s1", 7, 2), log("s2", 9, 1), log("s1", 5, 60)];
    expect(latestFreshUsage(logs, "s1", NOW)).toBe(7);
    expect(latestFreshUsage([log("s1", 5, 60)], "s1", NOW)).toBeNull();
    expect(latestFreshUsage([], "s1", NOW)).toBeNull();
  });

  it("0회는 0으로 둔다 — 모름(null)과 다르다", () => {
    expect(latestFreshUsage([log("s1", 0, 1)], "s1", NOW)).toBe(0);
  });

  it("횟수가 아닌 체크인은 횟수로 읽지 않는다", () => {
    expect(latestFreshUsage([log("s1", 12, 1, "hours")], "s1", NOW)).toBeNull();
  });
});

describe("구독의 지표에 맞는 최근 체크인", () => {
  const music = {
    id: "s1",
    name: "멜론",
    amount: 10900,
    currency: "KRW",
    billingDay: 3,
    billingCycle: "monthly",
    category: "music",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  } as Subscription;

  it("지표가 바뀌기 전의 옛 체크인은 쓰지 않는다", () => {
    expect(latestFreshLogFor([log("s1", 5, 1)], music, NOW)).toBeNull();
    expect(latestFreshLogFor([log("s1", 12, 1, "hours")], music, NOW)?.usageCount).toBe(12);
  });
});
