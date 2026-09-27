import { describe, it, expect } from "vitest";
import { getPlanAlternatives, type Subscription, type UsageLog } from "@subslash/shared";

const NOW = new Date("2026-09-27T09:00:00+09:00");

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 5,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    cancelUrl: "https://www.netflix.com/cancelplan",
    planId: "premium",
    planName: "프리미엄",
    ...overrides,
  };
}

function uses(count: number, checkedAt: string, overrides: Partial<UsageLog> = {}): UsageLog {
  return {
    id: `log-${checkedAt}`,
    subscriptionId: "sub-1",
    month: checkedAt.slice(0, 7),
    usageCount: count,
    costPerUse: 17000 / count,
    riskLevel: "yellow",
    checkedAt,
    ...overrides,
  };
}

describe("getPlanAlternatives", () => {
  it("같은 결제 주기의 더 싼 요금제를 1년에 덜 내는 순서로 보여 준다", () => {
    const result = getPlanAlternatives(sub(), [], NOW);
    expect(result.state).toBe("ok");
    if (result.state !== "ok") return;
    expect(result.current.planName).toBe("프리미엄");
    expect(result.alternatives.map((a) => [a.planName, a.yearlySaving])).toEqual([
      ["광고형 스탠다드", (17000 - 7000) * 12],
      ["스탠다드", (17000 - 13500) * 12],
    ]);
  });

  it("이미 가장 싼 요금제면 대안이 없다", () => {
    const result = getPlanAlternatives(sub({ planId: "ads", amount: 7000 }), [], NOW);
    expect(result.state === "ok" && result.alternatives).toEqual([]);
  });

  it("어느 요금제인지 모르면 비교하지 않는다", () => {
    const result = getPlanAlternatives(sub({ planId: undefined }), [], NOW);
    expect(result).toEqual({ state: "plan-unknown", planCount: 3 });
  });

  it("요금제가 없는 서비스는 비교할 것이 없다", () => {
    const result = getPlanAlternatives(
      sub({ name: "직접 등록한 서비스", cancelUrl: undefined, planId: undefined }),
      [],
      NOW,
    );
    expect(result.state).toBe("none");
  });

  it("최근 30일 안의 횟수 체크인으로 요금제마다 1회 단가를 계산한다", () => {
    const result = getPlanAlternatives(sub(), [uses(4, "2026-09-20T00:00:00.000Z")], NOW);
    if (result.state !== "ok") throw new Error(result.state);
    expect(result.current.costPerUse).toBe(17000 / 4);
    expect(result.alternatives[0].costPerUse).toBe(7000 / 4);
    expect(result.usage).toEqual({ count: 4, checkedAt: "2026-09-20T00:00:00.000Z" });
  });

  it("오래된 체크인이나 시간 지표로는 1회 단가를 계산하지 않는다", () => {
    const stale = getPlanAlternatives(sub(), [uses(4, "2026-07-01T00:00:00.000Z")], NOW);
    const hours = getPlanAlternatives(
      sub(),
      [uses(4, "2026-09-20T00:00:00.000Z", { metric: "hours" })],
      NOW,
    );
    for (const result of [stale, hours]) {
      if (result.state !== "ok") throw new Error(result.state);
      expect(result.usage).toBeNull();
      expect(result.current.costPerUse).toBeNull();
    }
  });

  it("고르게 나눠 내면 1회 단가를 내 몫으로, 따로 적은 내 몫이면 계산하지 않는다", () => {
    const even = getPlanAlternatives(
      sub({ sharingCount: 2 }),
      [uses(4, "2026-09-20T00:00:00.000Z")],
      NOW,
    );
    if (even.state !== "ok") throw new Error(even.state);
    expect(even.shared).toBe(true);
    expect(even.current.costPerUse).toBe(17000 / 2 / 4);

    const uneven = getPlanAlternatives(
      sub({ sharingCount: 2, myShareAmount: 5000 }),
      [uses(4, "2026-09-20T00:00:00.000Z")],
      NOW,
    );
    if (uneven.state !== "ok") throw new Error(uneven.state);
    expect(uneven.current.costPerUse).toBeNull();
  });

  it("짝으로 적어 둔 연 결제 요금제가 있으면 연 결제로 바꿀 때 덜 내는 돈을 보여 준다", () => {
    const result = getPlanAlternatives(
      sub({
        name: "노션",
        cancelUrl: "https://www.notion.com/",
        planId: "plus-monthly",
        amount: 16800,
        category: "other",
      }),
      [],
      NOW,
    );
    if (result.state !== "ok") throw new Error(result.state);
    expect(result.alternatives).toHaveLength(1);
    expect(result.alternatives[0]).toMatchObject({
      kind: "yearly",
      planName: "플러스 (연 결제)",
      yearlySaving: 16800 * 12 - 168000,
      monthlyAmount: 168000 / 12,
    });
  });

  it("저장 공간 요금제는 싸다는 이유만으로 내리라고 하지 않는다", () => {
    const result = getPlanAlternatives(
      sub({
        name: "아이클라우드",
        cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
        planId: "2tb",
        amount: 14000,
        category: "cloud",
      }),
      [],
      NOW,
    );
    expect(result.state === "ok" && result.alternatives).toEqual([]);
  });
});
