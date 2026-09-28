import { describe, expect, it } from "vitest";
import { POPULAR_SERVICES, type Subscription } from "@subslash/shared";
import { lastDays, type UsageHistory } from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, MEASURED_USAGE_PACKAGES, packagesFor } from "@lib/usage/packages";
import {
  SUGGEST_MIN_COVERED_DAYS,
  dismissUntil,
  findSubscriptionSuggestions,
} from "@lib/usage/suggest";

const NOW = new Date(2026, 8, 28, 15, 0, 0); // 2026-09-28 15:00 (기기 시간대)
const NETFLIX = "com.netflix.mediaclient";
const TVING = "net.cj.cjhv.gs.tving";
const YOUTUBE = "com.google.android.youtube";
const YOUTUBE_MUSIC = "com.google.android.apps.youtube.music";
const COUPANG_PLAY = "com.coupang.mobile.play";
const MIN = 60_000;

/** 최근 n일 모두 기록이 있고, used에 적은 앱을 그날마다 그만큼 쓴 기록. */
function history(n: number, used: Record<string, number>, everyNthDay = 1): UsageHistory {
  const days: UsageHistory["days"] = {};
  lastDays(NOW, n).forEach((date, i) => {
    days[date] = {};
    if (i % everyNthDay !== 0) return;
    for (const [pkg, ms] of Object.entries(used)) days[date][pkg] = [ms, 1];
  });
  return { v: 1, days, syncedAt: NOW.toISOString() };
}

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
    cancelUrl: "https://www.netflix.com/cancelplan",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const ids = (list: ReturnType<typeof findSubscriptionSuggestions>) => list.map((s) => s.preset.id);

describe("findSubscriptionSuggestions", () => {
  it("등록하지 않았는데 꾸준히 쓴 OTT를 많이 쓴 순으로 묻는다", () => {
    const found = findSubscriptionSuggestions(
      [],
      history(30, { [NETFLIX]: 30 * MIN, [TVING]: 60 * MIN }),
      {},
      NOW,
    );
    expect(ids(found)).toEqual(["tving", "netflix"]);
    expect(found[1]).toMatchObject({ killed: false });
    expect(found[1].totals.activeDays).toBe(30);
  });

  it("잠깐 열어 본 것은 묻지 않는다", () => {
    // 이틀, 합계 20분.
    const found = findSubscriptionSuggestions(
      [],
      history(30, { [NETFLIX]: 10 * MIN }, 15),
      {},
      NOW,
    );
    expect(found).toEqual([]);
  });

  it("기록이 모자라면 묻지 않는다", () => {
    const found = findSubscriptionSuggestions(
      [],
      history(SUGGEST_MIN_COVERED_DAYS - 1, { [NETFLIX]: 60 * MIN }),
      {},
      NOW,
    );
    expect(found).toEqual([]);
  });

  it("사용자가 직접 찾을 때는 기록이 며칠뿐이어도 찾는다", () => {
    const short = history(3, { [NETFLIX]: 40 * MIN });
    expect(findSubscriptionSuggestions([], short, {}, NOW)).toEqual([]);
    const found = findSubscriptionSuggestions([], short, {}, NOW, 1);
    expect(ids(found)).toEqual(["netflix"]);
    expect(found[0].totals.coveredDays).toBe(3);
  });

  it("무료로도 많이 쓰는 앱(유튜브)은 쓴다는 것으로 묻지 않는다", () => {
    const found = findSubscriptionSuggestions([], history(30, { [YOUTUBE]: 120 * MIN }), {}, NOW);
    expect(found).toEqual([]);
  });

  it("유튜브 뮤직을 쓰면 유튜브 프리미엄을 묻는다 — 한국에는 뮤직의 무료 요금제가 없다", () => {
    const found = findSubscriptionSuggestions(
      [],
      history(30, { [YOUTUBE]: 120 * MIN, [YOUTUBE_MUSIC]: 30 * MIN }),
      {},
      NOW,
    );
    expect(ids(found)).toEqual(["youtube-premium"]);
    expect(found[0]).toMatchObject({ appName: "유튜브 뮤직" });
    // 유튜브 앱 사용은 세지 않는다(무료로 쓴다).
    expect(found[0].totals.usedMs).toBe(30 * 30 * MIN);

    // 결합 상품(배민클럽 + 유튜브 프리미엄)으로 받고 있으면 묻지 않는다.
    const baemin = sub({
      name: "배민클럽 + 유튜브 프리미엄",
      cancelUrl: "https://www.youtube.com/paid_memberships",
    });
    expect(
      ids(
        findSubscriptionSuggestions([baemin], history(30, { [YOUTUBE_MUSIC]: 30 * MIN }), {}, NOW),
      ),
    ).not.toContain("youtube-premium");
  });

  it("쿠팡플레이를 쓰면 쿠팡 와우를 묻되, 무료로도 볼 수 있다고 함께 적는다", () => {
    // 쿠팡플레이를 처음부터 읽은 기록.
    const used = {
      ...history(30, { [COUPANG_PLAY]: 60 * MIN }),
      packagesSince: { [COUPANG_PLAY]: "" },
    };
    const found = findSubscriptionSuggestions([], used, {}, NOW);
    expect(ids(found)).toEqual(["coupang-wow"]);
    expect(found[0]).toMatchObject({ appName: "쿠팡플레이" });
    expect(found[0].note).toContain("무료");
  });

  it("쿠팡플레이를 읽기 전에 쌓은 기록으로는 묻지 않는다 — 그 앞의 날은 0이 아니라 모른다", () => {
    // 쿠팡플레이를 연결표에 더하기 전의 30일(칸은 있고 쿠팡플레이는 없다) + 더한 뒤 이틀.
    const before = history(30, {});
    const days = { ...before.days };
    for (const date of lastDays(NOW, 2)) days[date] = { [COUPANG_PLAY]: [60 * MIN, 1] };
    const found = findSubscriptionSuggestions(
      [],
      { ...before, days, packagesSince: { [COUPANG_PLAY]: lastDays(NOW, 2)[0] } },
      {},
      NOW,
      1,
    );
    // 이틀치로 찾되(직접 찾기), 기록은 2일치라고 적는다.
    expect(ids(found)).toEqual(["coupang-wow"]);
    expect(found[0].totals.coveredDays).toBe(2);
  });

  it("쿠팡플레이는 묻는 데에만 쓰고 와우의 사용 기록으로 재지 않는다", () => {
    const wow = sub({
      name: "쿠팡 와우 (쿠팡플레이)",
      amount: 7890,
      cancelUrl: POPULAR_SERVICES.find((s) => s.id === "coupang-wow")?.cancelUrl,
    });
    expect(packagesFor(wow)).toBeNull();
    expect(ALL_USAGE_PACKAGES).toContain(COUPANG_PLAY);
    expect(MEASURED_USAGE_PACKAGES).not.toContain(COUPANG_PLAY);
  });

  it("이미 구독 중이면 묻지 않는다 — 결합 상품에 들어 있는 것, 무료 체험 중인 것도", () => {
    const used = history(30, { [NETFLIX]: 60 * MIN, [TVING]: 60 * MIN });
    expect(findSubscriptionSuggestions([sub({})], used, {}, NOW).map((s) => s.preset.id)).toEqual([
      "tving",
    ]);
    const bundle = sub({
      name: "티빙 x 웨이브 더블 이용권",
      cancelUrl: "https://www.tving.com/",
    });
    expect(ids(findSubscriptionSuggestions([bundle], used, {}, NOW))).toEqual(["netflix"]);
    const trial = sub({ trialEndsAt: "2026-10-10" } as Partial<Subscription>);
    expect(ids(findSubscriptionSuggestions([trial], used, {}, NOW))).toEqual(["tving"]);
  });

  it("해지한 서비스를 다시 쓰면 되살리지 않고 해지했다고 알린 채 묻는다", () => {
    const found = findSubscriptionSuggestions(
      [sub({ status: "killed" })],
      history(30, { [NETFLIX]: 60 * MIN }),
      {},
      NOW,
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ killed: true });
  });

  it("'내가 내지 않아요'를 고르면 90일 동안 묻지 않고, 그 뒤에 다시 묻는다", () => {
    const used = history(30, { [NETFLIX]: 60 * MIN });
    const dismissed = { netflix: dismissUntil(NOW) };
    expect(dismissed.netflix).toBe("2026-12-27");
    expect(findSubscriptionSuggestions([], used, dismissed, NOW)).toEqual([]);
    const later = { netflix: "2026-09-27" };
    expect(ids(findSubscriptionSuggestions([], used, later, NOW))).toEqual(["netflix"]);
  });

  it("그 서비스를 포함하는 결합 상품을 함께 알려 준다", () => {
    const [tving] = findSubscriptionSuggestions([], history(30, { [TVING]: 60 * MIN }), {}, NOW);
    expect(tving.bundles.map((b) => b.id)).toEqual(
      expect.arrayContaining(["tving-3pack", "tving-double-disney", "tving-wavve-double"]),
    );
  });
});
