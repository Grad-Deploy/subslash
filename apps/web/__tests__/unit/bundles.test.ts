import { describe, expect, it } from "vitest";
import {
  bundleCheckLinks,
  bundlesIncluding,
  coveredServices,
  findBundleOverlaps,
  getCancelAndroidApp,
  metricForSubscription,
  POPULAR_SERVICES,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { latestFreshLogFor } from "@lib/checkins";
import { matchPcUsageSubscription, pcUsageServiceFor } from "@lib/pc-usage";
import { planAutoCheckIns } from "@lib/usage/auto-checkin";
import { lastDays, type UsageHistory } from "@lib/usage/history";
import { withLatestCheckIn, type MetricView } from "@lib/usage/value";
import { buildCheckInBars } from "../../components/report/valueRows";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { packageBreakdown, packagesFor } from "@lib/usage/packages";
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

  const presetNamed = (id: string) => {
    const preset = POPULAR_SERVICES.find((service) => service.id === id);
    if (!preset) throw new Error(id);
    return sub({ name: preset.nameKo, category: preset.category });
  };

  it("구글 AI + 유튜브 결합은 앱에서 유튜브 시간, 웹에서 AI를 쓴 날로 잰다", () => {
    const bundle = presetNamed("uplus-google-ai-youtube");
    expect(metricForSubscription(bundle, "app")).toBe("hours");
    expect(metricForSubscription(bundle, "web")).toBe("days");
    expect(packagesFor(bundle)).toEqual([
      "com.google.android.youtube",
      "com.google.android.apps.youtube.music",
    ]);
    expect(pcUsageServiceFor(bundle)).toBe("google-ai-pro");
    expect(matchPcUsageSubscription("google-ai-pro", [bundle])).toEqual({
      kind: "match",
      subscription: bundle,
    });
  });

  it("웹·앱 어느 쪽 체크인이든 최근 것으로 판단한다", () => {
    const bundle = { ...presetNamed("uplus-google-ai-youtube"), id: "b" };
    const now = new Date("2026-06-20T00:00:00.000Z");
    const log = (metric: "days" | "hours", riskLevel: "green" | "red", checkedAt: string) =>
      ({
        id: checkedAt,
        subscriptionId: "b",
        usageCount: 12,
        costPerUse: 1000,
        riskLevel,
        metric,
        checkedAt,
      }) as UsageLog;
    const web = log("days", "green", "2026-06-19T00:00:00.000Z");
    const app = log("hours", "red", "2026-06-10T00:00:00.000Z");
    expect(latestFreshLogFor([app, web], bundle, now)).toBe(web);
    const laterApp = { ...app, checkedAt: "2026-06-19T12:00:00.000Z" };
    expect(latestFreshLogFor([web, laterApp], bundle, now)?.metric).toBe("hours");
    expect(buildCheckInBars([bundle], [web], now).bars[0]).toMatchObject({
      metric: "days",
      level: "green",
    });
  });

  it("폰 기록의 평가보다 최근 체크인을 따른다", () => {
    const bundle = { ...presetNamed("uplus-google-ai-youtube"), id: "b" };
    const now = new Date("2026-06-20T00:00:00.000Z");
    const view = { metric: "hours", level: "green", pendingDays: 0 } as MetricView;
    const red = {
      id: "w",
      subscriptionId: "b",
      usageCount: 1,
      costPerUse: 29000,
      riskLevel: "red",
      metric: "days",
      checkedAt: "2026-06-19T00:00:00.000Z",
    } as UsageLog;
    expect(withLatestCheckIn(view, bundle, [red], now)).toMatchObject({
      level: "red",
      fromCheckIn: true,
    });
    // 체크인이 없으면 폰 기록, 다른 구독은 지금처럼 폰 기록이다.
    expect(withLatestCheckIn(view, bundle, [], now)).toBe(view);
    const netflix = { ...presetNamed("naver-plus-netflix"), id: "b" };
    expect(withLatestCheckIn(view, netflix, [{ ...red, metric: "uses" }], now)).toBe(view);
  });

  it("웹에서 체크인한 지 30일 안이면 폰 기록으로 덮지 않는다", () => {
    const bundle = { ...presetNamed("uplus-google-ai-youtube"), id: "b", amount: 29000 };
    const now = new Date(2026, 5, 30, 12);
    const days: UsageHistory["days"] = {};
    for (const date of lastDays(now, 30)) {
      days[date] = { "com.google.android.youtube": [3_600_000, 1, 3_600_000] };
    }
    const history = {
      days,
      syncedAt: now.toISOString(),
      playbackFrom: "2026-01-01",
      packagesSince: {
        "com.google.android.youtube": "2026-01-01",
        "com.google.android.apps.youtube.music": "2026-01-01",
      },
    } as unknown as UsageHistory;
    const web = {
      id: "w",
      subscriptionId: "b",
      usageCount: 12,
      costPerUse: 2000,
      riskLevel: "green",
      metric: "days",
      checkedAt: new Date(2026, 5, 25).toISOString(),
    } as UsageLog;
    expect(planAutoCheckIns([bundle], [web], history, null, now, 1350)).toEqual([]);
    const old = { ...web, checkedAt: new Date(2026, 3, 1).toISOString() };
    expect(planAutoCheckIns([bundle], [old], history, null, now, 1350)[0]).toMatchObject({
      metric: "hours",
      quantity: 30,
    });
  });

  it("스포티파이가 든 결합 상품은 시간으로 잰다", () => {
    const both = presetNamed("naver-plus-netflix-spotify");
    expect(metricForSubscription(both)).toBe("hours");
    expect(packagesFor(both)).toEqual(["com.netflix.mediaclient", "com.spotify.music"]);
    expect(metricForSubscription(presetNamed("naver-plus-spotify"))).toBe("hours");
    // 스포티파이가 없는 넷플릭스 결합은 넷플릭스 단독과 같이 횟수다.
    expect(metricForSubscription(presetNamed("naver-plus-netflix"))).toBe("uses");
  });

  it("앱이 여럿이면 패키지 이름이 아니라 서비스 이름으로 보인다", () => {
    const apps = ["com.netflix.mediaclient", "com.spotify.music"];
    const labels = (locale?: "en") => packageBreakdown(apps, {}, locale).map((row) => row.label);
    expect(labels()).toEqual(["넷플릭스", "스포티파이"]);
    expect(labels("en")).toEqual(["Netflix", "Spotify"]);
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

/**
 * 결합 상품을 해지한 뒤 포함된 서비스마다 끝났는지 볼 곳. 해지 버튼을 서비스마다 두지 않는다 —
 * 판매처가 결제하므로 유튜브 쪽에서는 해지되지 않는다.
 */
describe("결합 상품 해지 뒤 확인할 곳", () => {
  it("배민 결합은 유튜브 멤버십 화면만 준다 — 배민클럽은 해지 버튼과 같은 곳이다", () => {
    const links = bundleCheckLinks({
      name: "배민클럽 + 유튜브 프리미엄",
      cancelUrl: "https://www.baemin.com/",
    });
    expect(links.map((link) => [link.serviceId, link.url])).toEqual([
      ["youtube-premium", "https://www.youtube.com/paid_memberships"],
    ]);
  });

  it("티빙 3 PACK은 티빙을 빼고 디즈니+·웨이브를 준다", () => {
    const links = bundleCheckLinks({
      name: "티빙 3 PACK (티빙 + 디즈니+ + 웨이브)",
      cancelUrl: "https://www.tving.com/",
    });
    expect(links.map((link) => link.serviceId)).toEqual(["disney-plus", "wavve"]);
  });

  it("결합 상품이 아니거나 서비스 목록에 없으면 아무것도 주지 않는다", () => {
    expect(bundleCheckLinks({ name: "유튜브 프리미엄" })).toEqual([]);
    expect(bundleCheckLinks({ name: "내가 적은 구독" })).toEqual([]);
  });
});

describe("해지 버튼이 여는 앱", () => {
  it("배민 결합은 배달의민족 앱을 연다", () => {
    expect(
      getCancelAndroidApp({
        name: "배민클럽 + 유튜브 프리미엄",
        cancelUrl: "https://www.baemin.com/",
      }),
    ).toBe("com.sampleapp");
  });

  it("사용자가 해지 주소를 바꿨으면 앱을 열지 않는다 — 그 주소로 가려는 것이다", () => {
    expect(
      getCancelAndroidApp({
        name: "배민클럽 + 유튜브 프리미엄",
        cancelUrl: "https://example.com/",
      }),
    ).toBeUndefined();
  });

  it("해지 화면으로 바로 가는 주소가 있는 서비스에는 앱을 적지 않는다", () => {
    expect(
      getCancelAndroidApp({ name: "넷플릭스", cancelUrl: "https://www.netflix.com/cancelplan" }),
    ).toBeUndefined();
  });
});
