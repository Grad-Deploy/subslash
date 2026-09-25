import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { buildContribution, median, parseContribution, summarize } from "../../lib/stats";

const NOW = new Date("2026-09-24T12:00:00+09:00");

const sub = (overrides: Partial<Subscription>): Subscription => ({
  id: "s1",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 3,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const log = (subscriptionId: string, usageCount: number, daysAgo: number): UsageLog => ({
  id: `${subscriptionId}-${daysAgo}`,
  subscriptionId,
  month: "2026-09",
  usageCount,
  costPerUse: 0,
  riskLevel: "green",
  checkedAt: new Date(NOW.getTime() - daysAgo * 86400000).toISOString(),
});

describe("익명 통계 요약 만들기", () => {
  it("목록에 있는 서비스만 보내고, 직접 적은 이름은 합계에만 들어간다", () => {
    const result = buildContribution(
      [sub({}), sub({ id: "s2", name: "우리 동네 헬스장", amount: 50000, category: "other" })],
      [log("s1", 3, 2)],
      1400,
      NOW,
    );
    expect(result.items).toEqual([{ presetId: "netflix", monthlyKRW: 17000, usageCount: 3 }]);
    expect(result.totalMonthlyKRW).toBe(67000);
    expect(result.activeCount).toBe(2);
    expect(JSON.stringify(result)).not.toContain("헬스장");
  });

  it("오래된 체크인은 이용 횟수를 모른다고 보내고, 체험 중·해지한 구독은 뺀다", () => {
    const result = buildContribution(
      [
        sub({}),
        sub({ id: "s2", name: "TVING", amount: 13500, trialEndsAt: "2026-10-10" }),
        sub({ id: "s3", name: "Spotify", amount: 11990, status: "killed" }),
      ],
      [log("s1", 9, 60)],
      1400,
      NOW,
    );
    expect(result.items).toEqual([{ presetId: "netflix", monthlyKRW: 17000, usageCount: null }]);
    expect(result.activeCount).toBe(1);
  });

  it("만든 요약은 서버 검사를 통과한다", () => {
    const result = buildContribution([sub({})], [log("s1", 3, 2)], 1400, NOW);
    expect(parseContribution(JSON.parse(JSON.stringify(result)))).toEqual(result);
  });
});

describe("요약 집계", () => {
  it("가운데 값", () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it("이용 횟수를 알려준 사람이 모자라면 서비스 이용 횟수는 비워 둔다", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      totalMonthlyKRW: 10000,
      activeCount: 1,
      items: [{ presetId: "netflix", monthlyKRW: 17000, usageCount: i < 5 ? i : null }],
    }));
    const [netflix] = summarize(rows).services;
    expect(netflix.participants).toBe(10);
    expect(netflix.medianUsage).toBeNull();
  });
});
