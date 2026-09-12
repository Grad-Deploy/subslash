import { describe, it, expect } from "vitest";
import {
  buildYearInReview,
  describeSpendingType,
  getSpendingType,
  type CategorySpend,
  type Subscription,
} from "@subslash/shared";

function spend(
  category: CategorySpend["category"],
  annualKRW: number,
  share: number,
): CategorySpend {
  return { category, annualKRW, share, count: 1 };
}

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

describe("getSpendingType", () => {
  it("한 분야가 절반 이상이면 그 분야 집중형이다", () => {
    const type = getSpendingType([spend("ott", 120000, 0.6), spend("music", 80000, 0.4)]);
    expect(type).toEqual({ kind: "focused", category: "ott", share: 0.6 });
    expect(describeSpendingType(type!)).toMatchObject({
      title: "OTT 집중형",
      detail: "구독 지출의 60%가 OTT에 모여 있습니다.",
    });
  });

  it("딱 절반이어도 집중형이다", () => {
    expect(getSpendingType([spend("ai", 50, 0.5), spend("cloud", 50, 0.5)])).toMatchObject({
      kind: "focused",
    });
  });

  it("가장 큰 분야도 절반이 안 되면 분산형이고, 돈을 내는 분야만 센다", () => {
    const type = getSpendingType([
      spend("ott", 40, 0.4),
      spend("music", 35, 0.35),
      spend("cloud", 25, 0.25),
      spend("news", 0, 0),
    ]);
    expect(type).toEqual({ kind: "spread", categoryCount: 3 });
    expect(describeSpendingType(type!).title).toBe("고루 쓰는 분산형");
  });

  it("구독 중인 서비스가 없거나 금액이 모두 0이면 유형을 지어내지 않는다", () => {
    expect(getSpendingType([])).toBeNull();
    expect(getSpendingType([spend("ott", 0, 0)])).toBeNull();
  });
});

describe("buildYearInReview의 소비 유형", () => {
  const NOW = new Date(2026, 8, 11);
  const subs = [
    sub({ id: "a", name: "넷플릭스", category: "ott", amount: 17000 }),
    sub({ id: "b", name: "멜론", category: "music", amount: 10900 }),
  ];

  it("올해 결산은 지금 구독 구성으로 유형을 정한다", () => {
    const review = buildYearInReview(subs, [], 2026, 1400, NOW);
    expect(review.spendingType).toMatchObject({ kind: "focused", category: "ott" });
  });

  it("지난 해 결산에는 유형이 없다 — 그 해의 구성은 기록에 없다", () => {
    const review = buildYearInReview(subs, [], 2025, 1400, NOW);
    expect(review.spendingType).toBeNull();
  });
});
