import { describe, expect, it } from "vitest";
import {
  POPULAR_SERVICES,
  planFormData,
  presetFormData,
  type ServicePreset,
  type Subscription,
} from "@subslash/shared";
import { lastDays, mergeUsage, totalsFor, type UsageHistory } from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, USAGE_PACKAGES, packagesFor } from "@lib/usage/packages";
import {
  SUGGEST_SIGNALS,
  SUGGESTABLE_SERVICES,
  findSubscriptionSuggestions,
} from "@lib/usage/suggest";

/**
 * 폰 기록으로 '구독 중인가요?'를 묻는 서비스 하나하나가 유튜브 뮤직(유튜브 프리미엄)과 같은 길을 가는지 본다:
 * 앱을 쓰면 묻고 → '내가 구독 중'으로 등록 폼을 채우고 → 등록하면 다시 묻지 않는다. 해지한 서비스는 되살리지
 * 않고 묻고, 결합 상품으로 등록해도 다시 묻지 않는다. 화면을 끄고 재생한 시간(재생 알림)도 쓴 시간으로 친다.
 */

const NOW = new Date(2026, 8, 28, 15, 0, 0);
const MIN = 60_000;

/** 이 서비스를 묻는 데 보는 앱(유튜브 프리미엄은 유튜브 뮤직, 쿠팡 와우는 쿠팡플레이). */
function appOf(id: string): string {
  const pkg = SUGGEST_SIGNALS[id]?.packages[0] ?? USAGE_PACKAGES[id]?.[0];
  if (!pkg) throw new Error(`${id}의 앱이 없다`);
  return pkg;
}

/** 모든 앱을 처음부터 읽은 기록. 최근 30일 동안 pkg를 날마다 [앞에 있던 시간, 재생 알림 시간]만큼 썼다. */
function usedHistory(pkg: string, foregroundMs: number, serviceMs = 0): UsageHistory {
  const dates = lastDays(NOW, 30);
  return {
    v: 1,
    days: Object.fromEntries(dates.map((date) => [date, { [pkg]: [foregroundMs, 1, serviceMs] }])),
    syncedAt: NOW.toISOString(),
    playbackFrom: dates[0],
    packagesSince: Object.fromEntries(ALL_USAGE_PACKAGES.map((p) => [p, ""])),
  };
}

/** 등록 폼을 그대로 제출했을 때 스토어(addSubscription)가 만드는 구독. 요금제가 있으면 첫 요금제를 고른다. */
function register(preset: ServicePreset, status: Subscription["status"] = "active"): Subscription {
  const plan = preset.plans?.[0];
  return {
    ...presetFormData(preset),
    ...(plan ? planFormData(preset, plan) : { amount: preset.defaultAmount ?? 10_000 }),
    billingDay: 15,
    id: `sub-${preset.id}`,
    status,
    createdAt: "2026-09-01T00:00:00.000Z",
  } as Subscription;
}

const presetOf = (id: string) => {
  const preset = POPULAR_SERVICES.find((service) => service.id === id);
  if (!preset) throw new Error(`${id}가 서비스 목록에 없다`);
  return preset;
};

describe("묻는 서비스마다 유튜브 뮤직과 같게 동작한다", () => {
  it("묻는 서비스는 넷플릭스·디즈니플러스·티빙·웨이브·왓챠·유튜브 프리미엄·쿠팡 와우다", () => {
    expect([...SUGGESTABLE_SERVICES].sort()).toEqual(
      [
        "coupang-wow",
        "disney-plus",
        "netflix",
        "tving",
        "watcha",
        "wavve",
        "youtube-premium",
      ].sort(),
    );
  });

  describe.each(SUGGESTABLE_SERVICES.map((id) => [id]))("%s", (id) => {
    const preset = presetOf(id);
    const pkg = appOf(id);

    it("앱을 폰이 읽는 목록에 있다", () => {
      expect(ALL_USAGE_PACKAGES).toContain(pkg);
    });

    it("꾸준히 쓰면 묻는다(하루 10분 × 30일)", () => {
      const found = findSubscriptionSuggestions([], usedHistory(pkg, 10 * MIN), {}, NOW);
      expect(found.map((s) => s.preset.id)).toEqual([id]);
      expect(found[0]).toMatchObject({ killed: false });
      expect(found[0].totals).toMatchObject({ coveredDays: 30, activeDays: 30 });
      expect(found[0].appName).toBe(SUGGEST_SIGNALS[id]?.appName);
    });

    it("화면을 끄고 재생한 시간(재생 알림)도 쓴 시간으로 친다", () => {
      const found = findSubscriptionSuggestions([], usedHistory(pkg, 0, 10 * MIN), {}, NOW);
      expect(found.map((s) => s.preset.id)).toEqual([id]);
    });

    it("잠깐 열어 본 것으로는 묻지 않는다(하루 1분)", () => {
      expect(findSubscriptionSuggestions([], usedHistory(pkg, MIN), {}, NOW)).toEqual([]);
    });

    it("'내가 구독 중'으로 연 폼을 그대로 등록하면 다시 묻지 않는다", () => {
      const history = usedHistory(pkg, 10 * MIN);
      expect(findSubscriptionSuggestions([register(preset)], history, {}, NOW)).toEqual([]);
    });

    it("해지한 기록이 있으면 되살리지 않고 '다시 쓰고 있어요'로 묻고, 새로 등록하면 그친다", () => {
      const history = usedHistory(pkg, 10 * MIN);
      const killed = register(preset, "killed");
      const found = findSubscriptionSuggestions([killed], history, {}, NOW);
      expect(found.map((s) => s.preset.id)).toEqual([id]);
      expect(found[0].killed).toBe(true);
      const again = { ...register(preset), id: "sub-again" };
      expect(findSubscriptionSuggestions([killed, again], history, {}, NOW)).toEqual([]);
    });

    it("'결합 상품으로 받아요'에서 고른 상품을 등록해도 다시 묻지 않는다", () => {
      const history = usedHistory(pkg, 10 * MIN);
      const { bundles } = findSubscriptionSuggestions([], history, {}, NOW)[0];
      for (const bundle of bundles) {
        expect(findSubscriptionSuggestions([register(bundle)], history, {}, NOW)).toEqual([]);
      }
    });

    it("'내가 내지 않아요'를 고르면 묻지 않는다", () => {
      const history = usedHistory(pkg, 10 * MIN);
      expect(findSubscriptionSuggestions([], history, { [id]: "2026-12-27" }, NOW)).toEqual([]);
    });

    it("앱이 들어온 기록을 쌓으면(mergeUsage) 그 기록으로 묻는다", () => {
      const days = 35;
      const from = lastDays(NOW, days)[0];
      const merged = mergeUsage(
        { v: 1, days: {}, syncedAt: null },
        {
          from: new Date(`${from}T00:00:00`).getTime(),
          dataFrom: new Date(`${from}T00:00:00`).getTime(),
          serviceSupported: true,
          days: lastDays(NOW, days).map((date) => ({
            date,
            pkg,
            foregroundMs: 10 * MIN,
            opens: 1,
            serviceMs: 0,
          })),
        },
        days,
        NOW,
        ALL_USAGE_PACKAGES,
      );
      expect(totalsFor(merged, [pkg], lastDays(NOW, 30)).coveredDays).toBe(30);
      const found = findSubscriptionSuggestions([], merged, {}, NOW);
      expect(found.map((s) => s.preset.id)).toEqual([id]);
    });
  });

  it("등록한 뒤 사용 기록으로 재는 앱은 묻는 앱과 같다 — 쿠팡 와우만 재지 않는다(무료 시청·배송 혜택)", () => {
    for (const id of SUGGESTABLE_SERVICES) {
      const measured = packagesFor(register(presetOf(id)));
      if (id === "coupang-wow") expect(measured).toBeNull();
      else expect(measured).toContain(appOf(id));
    }
  });
});
