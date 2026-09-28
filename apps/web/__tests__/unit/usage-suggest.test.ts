import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import { lastDays, type UsageHistory } from "@lib/usage/history";
import {
  SUGGEST_MIN_COVERED_DAYS,
  dismissUntil,
  findSubscriptionSuggestions,
} from "@lib/usage/suggest";

const NOW = new Date(2026, 8, 28, 15, 0, 0); // 2026-09-28 15:00 (기기 시간대)
const NETFLIX = "com.netflix.mediaclient";
const TVING = "net.cj.cjhv.gs.tving";
const YOUTUBE = "com.google.android.youtube";
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

  it("무료로도 많이 쓰는 앱(유튜브)은 쓴다는 것으로 묻지 않는다", () => {
    const found = findSubscriptionSuggestions([], history(30, { [YOUTUBE]: 120 * MIN }), {}, NOW);
    expect(found).toEqual([]);
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
