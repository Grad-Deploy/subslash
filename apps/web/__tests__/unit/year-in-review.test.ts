import { describe, it, expect } from "vitest";
import {
  buildYearInReview,
  getYearDefendedSeries,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

const YEAR = 2026;
const NOW = new Date(2026, 8, 11);
const RATE = 1400;

function sub(overrides: Partial<Subscription> & Pick<Subscription, "id" | "name">): Subscription {
  return {
    amount: 10000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function log(
  subscriptionId: string,
  usageCount: number,
  costPerUse: number,
  checkedAt: string,
): UsageLog {
  return {
    id: `${subscriptionId}-${checkedAt}`,
    subscriptionId,
    month: checkedAt.slice(0, 7),
    usageCount,
    costPerUse,
    riskLevel: "yellow",
    checkedAt,
  };
}

describe("buildYearInReview", () => {
  it("그 해에 해지한 구독만 담고, 해지 날짜가 없는 구독은 따로 센다", () => {
    const review = buildYearInReview(
      [
        sub({ id: "a", name: "올해 3월", status: "killed", killedAt: "2026-03-01T00:00:00.000Z" }),
        sub({ id: "b", name: "올해 1월", status: "killed", killedAt: "2026-01-05T00:00:00.000Z" }),
        sub({ id: "c", name: "작년", status: "killed", killedAt: "2025-11-01T00:00:00.000Z" }),
        sub({ id: "d", name: "날짜 없음", status: "killed" }),
      ],
      [],
      YEAR,
      RATE,
      NOW,
    );

    expect(review.killedThisYear.map((s) => s.name)).toEqual(["올해 1월", "올해 3월"]);
    expect(review.killedAtUnknown).toBe(1);
  });

  it("지금 구독 중인 서비스의 연간 내 몫을 카테고리별로 큰 순서로 나눈다", () => {
    const review = buildYearInReview(
      [
        // 둘이 나누는 월 10,000원 → 내 몫 연 60,000원
        sub({ id: "ott", name: "넷플릭스", category: "ott", sharingCount: 2 }),
        // 월 $10 → 연 $120 × 1,400원
        sub({ id: "ai", name: "ChatGPT", category: "ai", currency: "USD", amount: 10 }),
        // 연 30,000원
        sub({
          id: "cloud",
          name: "iCloud",
          category: "cloud",
          billingCycle: "yearly",
          amount: 30000,
        }),
        sub({
          id: "gone",
          name: "해지함",
          category: "music",
          status: "killed",
          killedAt: "2026-02-01T00:00:00.000Z",
        }),
      ],
      [],
      YEAR,
      RATE,
      NOW,
    );

    expect(review.categorySpend.map((c) => [c.category, c.annualKRW])).toEqual([
      ["ai", 168000],
      ["ott", 60000],
      ["cloud", 30000],
    ]);
    expect(review.activeAnnualKRW).toBe(258000);
    expect(review.categorySpend[0].share).toBeCloseTo(168000 / 258000);
  });

  it("체크인은 그 해의 것만, 서비스마다 마지막 것을 원화로 바꿔 싼 순서로 줄 세운다", () => {
    const review = buildYearInReview(
      [
        sub({ id: "netflix", name: "넷플릭스" }),
        sub({ id: "gpt", name: "ChatGPT", currency: "USD", amount: 20 }),
        sub({ id: "melon", name: "멜론", status: "killed", killedAt: "2026-06-01T00:00:00.000Z" }),
        sub({
          id: "old",
          name: "작년 해지",
          status: "killed",
          killedAt: "2025-06-01T00:00:00.000Z",
        }),
      ],
      [
        log("netflix", 2, 5000, "2026-03-01T00:00:00.000Z"),
        log("netflix", 10, 1000, "2026-08-01T00:00:00.000Z"),
        log("netflix", 20, 500, "2025-12-01T00:00:00.000Z"),
        log("gpt", 4, 5, "2026-07-01T00:00:00.000Z"),
        log("melon", 1, 10900, "2026-05-01T00:00:00.000Z"),
        log("old", 30, 100, "2026-01-01T00:00:00.000Z"),
      ],
      YEAR,
      RATE,
      NOW,
    );

    // 넷플릭스는 2026년 마지막(8월) 체크인, ChatGPT는 $5 × 1,400원.
    // 작년에 해지한 구독의 체크인은 올해 가성비에 넣지 않는다.
    expect(review.checkIns.map((c) => [c.name, c.costPerUseKRW, c.killed])).toEqual([
      ["넷플릭스", 1000, false],
      ["ChatGPT", 7000, false],
      ["멜론", 10900, true],
    ]);
  });

  it("방어액은 달별 방어액 계산과 같다", () => {
    const subs = [
      sub({ id: "k", name: "넷플릭스", status: "killed", killedAt: "2026-05-10T00:00:00.000Z" }),
    ];
    const review = buildYearInReview(subs, [], YEAR, RATE, NOW);

    expect(review.defended).toEqual(getYearDefendedSeries(subs, YEAR, RATE, NOW));
    expect(review.isComplete).toBe(false);
  });

  it("지난해는 끝난 해다", () => {
    expect(buildYearInReview([], [], 2025, RATE, NOW).isComplete).toBe(true);
  });
});
