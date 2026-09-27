import { describe, expect, it } from "vitest";
import {
  bundlesIncluding,
  coveredServices,
  findBundleOverlaps,
  metricForSubscription,
  type Subscription,
} from "@subslash/shared";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { packagesFor } from "@lib/usage/packages";
import { planDiscoveries, type GmailDiscovery } from "@lib/gmail-auto-client";

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s",
    name: "",
    amount: 13990,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const BUNDLE = sub({ id: "bundle", name: "배민클럽 + 유튜브 프리미엄" });
const YOUTUBE = sub({ id: "yt", name: "유튜브 프리미엄", amount: 14900 });

describe("결합 상품", () => {
  it("결합 상품은 자신과 포함된 서비스를 받는다", () => {
    expect(coveredServices(BUNDLE)).toEqual([
      "baemin-youtube-premium",
      "baemin-club",
      "youtube-premium",
    ]);
    expect(bundlesIncluding("youtube-premium").map((b) => b.id)).toEqual([
      "baemin-youtube-premium",
      "uplus-double-streaming",
      "uplus-google-ai-youtube",
    ]);
  });

  it("티빙 결합 이용권은 포함된 OTT를 따로 내는 것과 겹친다", () => {
    const pack = sub({ id: "pack", name: "티빙 3 PACK (티빙 + 디즈니+ + 웨이브)", amount: 21500 });
    const disney = sub({ id: "disney", name: "디즈니플러스", amount: 9900 });
    const wavve = sub({ id: "wavve", name: "웨이브", amount: 10900 });
    expect(coveredServices(pack)).toEqual(["tving-3pack", "tving", "disney-plus", "wavve"]);
    expect(findBundleOverlaps([pack, disney, wavve]).map((o) => o.serviceIds)).toEqual([
      ["disney-plus"],
      ["wavve"],
    ]);
    // 두 결합 상품이 같은 서비스를 주면 한 번만 알린다.
    const double = sub({ id: "double", name: "티빙 더블 (티빙 + 디즈니+)", amount: 18000 });
    expect(findBundleOverlaps([pack, double])).toEqual([
      { bundle: pack, other: double, serviceIds: ["tving", "disney-plus"] },
    ]);
  });

  it("Apple One은 애플 뮤직·TV·아이클라우드를 따로 내는 것과 겹친다", () => {
    const one = sub({
      id: "one",
      name: "Apple One",
      cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    });
    const music = sub({
      id: "music",
      name: "애플 뮤직",
      cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    });
    expect(coveredServices(one)).toEqual(["apple-one", "apple-music", "apple-tv", "apple-icloud"]);
    expect(findBundleOverlaps([one, music]).map((o) => o.serviceIds)).toEqual([["apple-music"]]);
  });

  it("포함된 서비스의 앱으로 시간을 잰다", () => {
    expect(packagesFor(BUNDLE)).toEqual([
      "com.google.android.youtube",
      "com.google.android.apps.youtube.music",
    ]);
    expect(metricForSubscription(BUNDLE)).toBe("hours");
  });

  it("결합 상품에 든 서비스를 따로도 내고 있으면 알린다", () => {
    expect(findBundleOverlaps([BUNDLE, YOUTUBE])).toEqual([
      { bundle: BUNDLE, other: YOUTUBE, serviceIds: ["youtube-premium"] },
    ]);
    // 해지한 구독은 겹치지 않는다.
    expect(findBundleOverlaps([BUNDLE, { ...YOUTUBE, status: "killed" }])).toEqual([]);
  });

  it("등록할 때 이름이 달라도 결합 상품과 겹치면 한 번 묻는다", () => {
    expect(findDuplicateSubscription([BUNDLE], YOUTUBE)?.id).toBe("bundle");
    expect(findDuplicateSubscription([YOUTUBE], BUNDLE)?.id).toBe("yt");
    expect(findDuplicateSubscription([BUNDLE], sub({ name: "넷플릭스" }))).toBeUndefined();
  });

  it("결합 상품으로 받는 서비스의 영수증은 조용히 등록하지 않고 확인을 받는다", () => {
    const receipt: GmailDiscovery = {
      id: "d1",
      name: "유튜브 프리미엄",
      amount: 14900,
      currency: "KRW",
      billingDay: 3,
      billingCycle: "monthly",
      billingMonth: null,
      category: "ott",
      presetId: "youtube-premium",
      paymentMethod: null,
      receiptDate: "2026.09.03",
      sender: "googleplay-noreply@google.com",
      tier: "auto",
    };
    const plan = planDiscoveries([receipt], [BUNDLE]);
    expect(plan.register).toEqual([]);
    expect(plan.review).toEqual([receipt]);
  });
});
