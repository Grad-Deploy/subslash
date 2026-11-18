import { describe, expect, it } from "vitest";
import { findBundleOpportunities, type Subscription } from "@subslash/shared";

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s",
    name: "",
    amount: 0,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const NOW = new Date("2026-11-18T00:00:00");
const find = (subs: Subscription[]) => findBundleOpportunities(subs, 1350, NOW);
const netflix = (planId?: string, amount = 7000) =>
  sub({ id: "n", name: "넷플릭스", amount, planId });
const naverPlus = sub({ id: "np", name: "네이버플러스", amount: 4900 });
const spotify = (planId?: string, amount = 8690) =>
  sub({ id: "sp", name: "스포티파이", amount, planId });

describe("findBundleOpportunities", () => {
  it("같은 등급끼리 견줘 덜 내는 결합 상품을 찾는다", () => {
    // 넷플릭스 광고형 7,000 + 네이버플러스 4,900 = 11,900 → 네이버플러스+넷플릭스 광고형 4,900
    const [found] = find([netflix("ads"), naverPlus]);
    expect(found.bundle.id).toBe("naver-plus-netflix");
    expect(found.currentMonthly).toBe(11900);
    expect(found.saving).toEqual({ min: 7000, max: 7000 });
  });

  it("요금제를 고르지 않았거나 결합이 주는 등급과 다르면 견주지 않는다", () => {
    expect(
      find([netflix(undefined), naverPlus]).some((o) => o.bundle.id === "naver-plus-netflix"),
    ).toBe(false);
    // 프리미엄 사용자에게 광고형 결합이 싸다고 하지 않는다 — 프리미엄 결합(14,900)이 기준이다.
    const [found] = find([netflix("premium", 17000), naverPlus]);
    expect(found.bundleMonthly).toEqual({ min: 14900, max: 14900 });
    expect(found.saving.min).toBe(17000 + 4900 - 14900);
  });

  it("결합 상품이 주는 요금제를 모르는 것은 견주지 않는다(유독 더블스트리밍)", () => {
    const yt = sub({ id: "yt", name: "유튜브 프리미엄", amount: 14900, planId: "premium" });
    expect(find([netflix("premium", 17000), yt]).map((o) => o.bundle.id)).not.toContain(
      "uplus-double-streaming",
    );
  });

  it("나눠 내는 구독·같은 서비스 두 개·체험 중·0원은 뺀다", () => {
    expect(
      find([netflix("ads"), naverPlus].map((s, i) => (i ? s : { ...s, sharingCount: 4 }))),
    ).toEqual([]);
    expect(find([netflix("ads"), netflix("ads"), naverPlus])).toEqual([]);
    expect(find([netflix("ads"), { ...naverPlus, trialEndsAt: "2026-12-01" }])).toEqual([]);
    expect(find([netflix("ads"), { ...naverPlus, amount: 0 }])).toEqual([]);
  });

  it("대신할 구독이 하나뿐이면 추천하지 않고, 결합에만 있는 서비스는 덤으로만 알린다", () => {
    expect(find([netflix("ads")])).toEqual([]);
    const found = find([netflix("ads"), spotify("basic")]).find(
      (o) => o.bundle.id === "naver-plus-netflix-spotify",
    );
    // 7,000 + 8,690 = 15,690 vs 10,800. 네이버플러스는 쓰지 않으니 절약액이 아니라 덤이다.
    expect(found?.saving.min).toBe(4890);
    expect(found?.extraServiceIds).toEqual(["naver-plus"]);
  });

  it("이미 그 결합 상품을 쓰고 있으면 겹침 안내에 맡긴다", () => {
    const bundle = sub({ id: "b", name: "네이버플러스 + 넷플릭스", amount: 4900, planId: "ads" });
    expect(find([bundle, netflix("ads"), naverPlus])).toEqual([]);
  });

  it("같은 구독을 바꾸는 결합 상품이 여럿이면 가장 많이 덜 내는 하나만 보인다", () => {
    const tving = sub({ id: "t", name: "티빙", amount: 13500, planId: "standard" });
    const disney = sub({ id: "d", name: "디즈니플러스", amount: 9900, planId: "standard" });
    // 티빙 더블 18,000(5,400 절약)과 3 PACK 21,500(1,900 절약, 웨이브 덤) 중 앞의 것만.
    expect(find([tving, disney]).map((o) => o.bundle.id)).toEqual(["tving-double-disney"]);
    // 넷플릭스 광고형 + 네이버플러스는 4,900짜리 결합이 있어 스포티파이까지 든 10,800짜리는 따로 안 보인다.
    expect(find([netflix("ads"), naverPlus]).map((o) => o.bundle.id)).toEqual([
      "naver-plus-netflix",
    ]);
  });
});
