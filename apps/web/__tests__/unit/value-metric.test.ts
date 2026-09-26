import { describe, expect, it } from "vitest";
import {
  clampQuantity,
  describeCheckIn,
  evaluateMetric,
  getCheckInEvidence,
  metricForSubscription,
  metricRiskLevel,
  shortUnitCost,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s1",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 15,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

describe("metricForSubscription", () => {
  it("서비스 목록의 서비스는 그 서비스의 지표로 잰다", () => {
    expect(metricForSubscription(sub({ name: "넷플릭스" }))).toBe("uses");
    // 백그라운드 재생·유튜브 뮤직이 프리미엄의 값이라 시간으로 잰다.
    expect(metricForSubscription(sub({ name: "유튜브 프리미엄" }))).toBe("hours");
    expect(metricForSubscription(sub({ name: "Spotify", category: "music" }))).toBe("hours");
    expect(metricForSubscription(sub({ name: "ChatGPT Plus", category: "ai" }))).toBe("days");
    expect(
      metricForSubscription(sub({ name: "쿠팡 와우 (쿠팡플레이)", category: "shopping" })),
    ).toBe("benefit");
    expect(metricForSubscription(sub({ name: "아이클라우드", category: "cloud" }))).toBe("storage");
  });

  it("목록에 없으면 고른 분류로, 그것도 아니면 횟수로 잰다", () => {
    expect(metricForSubscription(sub({ name: "동네 음악앱", category: "music" }))).toBe("hours");
    expect(metricForSubscription(sub({ name: "내 AI", category: "ai" }))).toBe("days");
    expect(metricForSubscription(sub({ name: "헬스장", category: "other" }))).toBe("uses");
  });

  it("달러 회비에는 원화 혜택을 견주지 않는다", () => {
    expect(
      metricForSubscription(sub({ name: "쿠팡 와우", category: "shopping", currency: "USD" })),
    ).toBe("uses");
  });
});

describe("metricRiskLevel", () => {
  it("쓴 날·시간·혜택·용량마다 기준이 다르다", () => {
    expect(metricRiskLevel("days", 20000, 2)).toBe("red");
    expect(metricRiskLevel("days", 20000, 5)).toBe("yellow");
    expect(metricRiskLevel("days", 20000, 10)).toBe("green");
    expect(metricRiskLevel("hours", 10000, 1)).toBe("red");
    expect(metricRiskLevel("hours", 10000, 10)).toBe("green");
    expect(metricRiskLevel("benefit", 7890, 3000)).toBe("red");
    expect(metricRiskLevel("benefit", 7890, 5000)).toBe("yellow");
    expect(metricRiskLevel("benefit", 7890, 7890)).toBe("green");
    // 적게 써도 해지하라고 하지 않는다. 아무것도 안 둘 때만 빨강.
    expect(metricRiskLevel("storage", 4400, 0)).toBe("red");
    expect(metricRiskLevel("storage", 4400, 20)).toBe("yellow");
    expect(metricRiskLevel("storage", 4400, 60)).toBe("green");
  });
});

describe("evaluateMetric", () => {
  it("단가는 늘 한 달치 ÷ 수량이라 한 달치를 되짚을 수 있다", () => {
    const result = evaluateMetric("hours", "멜론", 10000, 20, "KRW");
    expect(result.costPerUse).toBe(500);
    expect(result.riskLevel).toBe("green");
    expect(result.shockMessage).toContain("한 시간에 ₩500");
  });

  it("범위를 넘는 값은 자른다", () => {
    expect(clampQuantity("days", 45)).toBe(30);
    expect(clampQuantity("storage", 120)).toBe(100);
    expect(clampQuantity("uses", -3)).toBe(0);
  });
});

describe("describeCheckIn / shortUnitCost", () => {
  it("지표마다 다른 말로 적는다. 지표가 없는 예전 기록은 횟수다", () => {
    expect(describeCheckIn({ usageCount: 5, costPerUse: 3400 }, "KRW")).toBe(
      "5회 이용 · 1회당 ₩3,400",
    );
    expect(describeCheckIn({ metric: "days", usageCount: 8, costPerUse: 2500 }, "KRW")).toBe(
      "30일 중 8일 사용 · 하루당 ₩2,500",
    );
    expect(describeCheckIn({ metric: "benefit", usageCount: 6000, costPerUse: 1.315 }, "KRW")).toBe(
      "혜택 ₩6,000 · 회비의 76% 돌려받음",
    );
    expect(describeCheckIn({ metric: "storage", usageCount: 40, costPerUse: 110 }, "KRW")).toBe(
      "용량의 40% 사용",
    );
    expect(shortUnitCost({ metric: "hours", usageCount: 20, costPerUse: 500 }, "KRW")).toBe(
      "₩500/시간",
    );
  });
});

describe("getCheckInEvidence", () => {
  const log = (overrides: Partial<UsageLog>): UsageLog => ({
    id: "l",
    subscriptionId: "s1",
    month: "2026-09",
    usageCount: 10,
    costPerUse: 1000,
    riskLevel: "green",
    checkedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  });

  it("지표가 바뀌었으면 최근 것과 같은 지표끼리만 평균·비교한다", () => {
    const evidence = getCheckInEvidence([
      log({ id: "old", usageCount: 30, checkedAt: "2026-07-01T00:00:00.000Z" }),
      log({ id: "a", metric: "hours", usageCount: 10, checkedAt: "2026-08-01T00:00:00.000Z" }),
      log({ id: "b", metric: "hours", usageCount: 20, checkedAt: "2026-09-01T00:00:00.000Z" }),
    ])!;
    expect(evidence.recent.map((l) => l.id)).toEqual(["b", "a"]);
    expect(evidence.averageUsage).toBe(15);
    expect(evidence.change?.usage).toBe(10);
  });
});
