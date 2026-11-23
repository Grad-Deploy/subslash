import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import { unusedBundleServices } from "@lib/usage/bundle-unused";
import { lastDays, type UsageHistory } from "@lib/usage/history";

const NOW = new Date("2026-11-23T12:00:00");
const TVING = "net.cj.cjhv.gs.tving";
const DISNEY = "com.disney.disneyplus";
const YOUTUBE = "com.google.android.youtube";

const sub = (name: string) =>
  ({
    id: "b",
    name,
    amount: 18000,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  }) as Subscription;

/** 최근 days일 동안 날마다 pkg를 ms만큼 쓴 기록(나머지 앱은 0으로 읽힌 날). */
function history(days: number, usage: Record<string, number>): UsageHistory {
  return {
    v: 1,
    syncedAt: null,
    days: Object.fromEntries(
      lastDays(NOW, days).map((date) => [
        date,
        Object.fromEntries(Object.entries(usage).map(([pkg, ms]) => [pkg, [ms, ms ? 1 : 0]])),
      ]),
    ),
  } as UsageHistory;
}

describe("결합 상품에서 이 폰으로 쓰지 않은 서비스", () => {
  it("30일을 모두 재고 쓴 날이 없는 서비스만 안 쓴다고 본다", () => {
    const h = history(30, { [TVING]: 60 * 60_000, [DISNEY]: 0 });
    expect(unusedBundleServices(sub("티빙 더블 (티빙 + 디즈니+)"), h, NOW)).toEqual([
      "disney-plus",
    ]);
  });

  it("하루 5분이 안 되게 잠깐 연 것은 쓴 날로 세지 않는다", () => {
    const h = history(30, { [TVING]: 60 * 60_000, [DISNEY]: 2 * 60_000 });
    expect(unusedBundleServices(sub("티빙 더블 (티빙 + 디즈니+)"), h, NOW)).toEqual([
      "disney-plus",
    ]);
  });

  it("기록이 30일이 안 되면 모른다", () => {
    const h = history(29, { [TVING]: 60 * 60_000, [DISNEY]: 0 });
    expect(unusedBundleServices(sub("티빙 더블 (티빙 + 디즈니+)"), h, NOW)).toEqual([]);
  });

  it("잴 앱이 없는 혜택형 멤버십(배민클럽)은 안 쓴다고 보지 않는다", () => {
    const h = history(30, { [YOUTUBE]: 60 * 60_000 });
    expect(unusedBundleServices(sub("배민클럽 + 유튜브 프리미엄"), h, NOW)).toEqual([]);
  });
});
