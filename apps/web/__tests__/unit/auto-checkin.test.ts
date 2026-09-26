import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { lastDays, type UsageHistory } from "@lib/usage/history";
import { daysUntilAutoCheckIn, measuredQuantity, planAutoCheckIns } from "@lib/usage/auto-checkin";

const NOW = new Date(2026, 8, 25, 15, 0, 0); // 2026-09-25 15:00 (기기 시간대)
const PKG = "com.netflix.mediaclient";
const RATE = 1350;

function sub(overrides: Partial<Subscription> = {}): Subscription {
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

/** 최근 `days`일에 기록 칸을 만들고, 그중 앞의 `opens`일에 한 번씩 열었다고 적는다. */
function history(days: number, opens: number): UsageHistory {
  const result: UsageHistory = { v: 1, days: {}, syncedAt: NOW.toISOString() };
  lastDays(NOW, days).forEach((date, index) => {
    result.days[date] = index < opens ? { [PKG]: [600_000, 1] } : {};
  });
  return result;
}

function log(overrides: Partial<UsageLog>): UsageLog {
  return {
    id: "log1",
    subscriptionId: "s1",
    month: "2026-09",
    usageCount: 3,
    costPerUse: 5000,
    riskLevel: "yellow",
    checkedAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

const plan = (logs: UsageLog[], h: UsageHistory, subs = [sub()]) =>
  planAutoCheckIns(subs, logs, h, [PKG], NOW, RATE);

describe("planAutoCheckIns", () => {
  it("30일을 온전히 덮으면 이 폰에서 연 횟수로 적는다", () => {
    expect(plan([], history(30, 12))).toEqual([
      { subscriptionId: "s1", metric: "uses", quantity: 12 },
    ]);
  });

  it("기록이 30일보다 짧으면 적지 않는다(짧은 기간의 횟수를 '30일 동안'으로 적지 않는다)", () => {
    expect(plan([], history(20, 12))).toEqual([]);
  });

  it("이 폰에서 한 번도 안 열었으면 적지 않는다(다른 기기에서 봤을 수 있다)", () => {
    expect(plan([], history(30, 0))).toEqual([]);
  });

  it("최근에 직접 센 숫자가 폰 기록 이상이면 덮지 않는다", () => {
    const manual = log({ usageCount: 20, checkedAt: "2026-09-10T00:00:00.000Z" });
    expect(plan([manual], history(30, 12))).toEqual([]);
  });

  it("직접 센 숫자보다 폰에서 더 많이 열었으면 새로 적는다", () => {
    const manual = log({ usageCount: 2, checkedAt: "2026-09-10T00:00:00.000Z" });
    expect(plan([manual], history(30, 12))).toEqual([
      { subscriptionId: "s1", metric: "uses", quantity: 12 },
    ]);
  });

  it("같은 달의 자동 체크인은 새로 쌓지 않고 그 줄을 바꾼다", () => {
    const auto = log({ id: "auto", source: "phone", checkedAt: "2026-09-20T00:00:00.000Z" });
    expect(plan([auto], history(30, 12))).toEqual([
      { subscriptionId: "s1", metric: "uses", quantity: 12, replaceLogId: "auto" },
    ]);
  });

  it("지난달의 자동 체크인은 두고 새 줄을 적는다", () => {
    const auto = log({ id: "auto", source: "phone", checkedAt: "2026-08-31T00:00:00.000Z" });
    expect(plan([auto], history(30, 12))).toEqual([
      { subscriptionId: "s1", metric: "uses", quantity: 12 },
    ]);
  });

  it("방금 적은 자동 체크인은 다시 맞추지 않는다", () => {
    const auto = log({
      source: "phone",
      checkedAt: new Date(NOW.getTime() - 3_600_000).toISOString(),
    });
    expect(plan([auto], history(30, 12))).toEqual([]);
  });

  it("해지한 구독·체험 중인 구독·폰 기록으로 잴 수 없는 구독은 건너뛴다", () => {
    const subs = [
      sub({ id: "killed", status: "killed" }),
      sub({ id: "trial", trialEndsAt: "2026-10-10" }),
      sub({ id: "coupang", name: "쿠팡 와우", cancelUrl: "https://www.coupang.com" }),
    ];
    expect(plan([], history(30, 12), subs)).toEqual([]);
  });
});

describe("쓴 날·시간으로 재는 구독", () => {
  const CHATGPT = "com.openai.chatgpt";
  const SPOTIFY = "com.spotify.music";

  function playbackHistory(pkg: string, entry: (index: number) => number[] | null, from?: string) {
    const result: UsageHistory = { v: 1, days: {}, syncedAt: NOW.toISOString() };
    lastDays(NOW, 30).forEach((date, index) => {
      const value = entry(index);
      result.days[date] = value ? { [pkg]: value as [number, number, number] } : {};
    });
    if (from !== undefined) result.playbackFrom = from;
    return result;
  }

  it("AI는 이 폰에서 쓴 날 수로 적는다", () => {
    const chatgpt = sub({
      name: "ChatGPT",
      cancelUrl: undefined,
      category: "ai",
      currency: "USD",
      amount: 20,
    });
    // 앞 8일 동안 하루 한 번씩, 그중 하루는 30초뿐이라 열었으니 쓴 날이다.
    const h = playbackHistory(CHATGPT, (i) => (i < 8 ? [i === 0 ? 30_000 : 600_000, 1] : null));
    expect(planAutoCheckIns([chatgpt], [], h, [CHATGPT], NOW, RATE)).toEqual([
      { subscriptionId: "s1", metric: "days", quantity: 8 },
    ]);
  });

  it("음악은 날마다 앱 시간과 재생 알림 시간 중 긴 쪽을 더한 시간으로 적는다", () => {
    const spotify = sub({ name: "Spotify", cancelUrl: undefined, category: "music" });
    const first = lastDays(NOW, 30)[0];
    // 10일 동안 화면은 6분, 재생 알림은 1시간 → 10시간.
    const h = playbackHistory(SPOTIFY, (i) => (i < 10 ? [360_000, 1, 3_600_000] : null), first);
    expect(planAutoCheckIns([spotify], [], h, [SPOTIFY], NOW, RATE)).toEqual([
      { subscriptionId: "s1", metric: "hours", quantity: 10 },
    ]);
  });

  it("재생 시간을 모르는 날이 섞이면 음악은 적지 않는다(화면을 끄고 들은 것이 빠진다)", () => {
    const spotify = sub({ name: "Spotify", cancelUrl: undefined, category: "music" });
    const h = playbackHistory(SPOTIFY, (i) => (i < 10 ? [360_000, 1] : null));
    expect(planAutoCheckIns([spotify], [], h, [SPOTIFY], NOW, RATE)).toEqual([]);
  });

  it("예전에 횟수로 센 체크인은 시간과 견주지 않고 새로 적는다", () => {
    const spotify = sub({ name: "Spotify", cancelUrl: undefined, category: "music" });
    const first = lastDays(NOW, 30)[0];
    const h = playbackHistory(SPOTIFY, (i) => (i < 10 ? [0, 0, 3_600_000] : null), first);
    const manual = log({ usageCount: 30, checkedAt: "2026-09-20T00:00:00.000Z" });
    expect(planAutoCheckIns([spotify], [manual], h, [SPOTIFY], NOW, RATE)).toEqual([
      { subscriptionId: "s1", metric: "hours", quantity: 10 },
    ]);
  });
});

describe("daysUntilAutoCheckIn", () => {
  it("쌓인 날만큼 줄고, 기록이 없으면 모른다", () => {
    expect(daysUntilAutoCheckIn(history(0, 0), NOW)).toBeNull();
    expect(daysUntilAutoCheckIn(history(12, 0), NOW)).toBe(18);
    expect(daysUntilAutoCheckIn(history(30, 0), NOW)).toBe(0);
  });
});

describe("체크인 칸에 채울 폰 측정값", () => {
  it("쓴 날은 쓴 날 수, 시간은 1시간 단위로 내린다(리포트와 같은 사용 시간)", () => {
    expect(measuredQuantity("days", { activeDays: 8, usedMs: 5_400_000 })).toBe(8);
    expect(measuredQuantity("hours", { activeDays: 8, usedMs: 5_400_000 })).toBe(1);
    expect(measuredQuantity("hours", { activeDays: 1, usedMs: 1_800_000 })).toBe(0);
  });
});
