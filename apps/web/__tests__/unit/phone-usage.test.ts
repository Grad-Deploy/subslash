import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  ACTIVE_DAY_MS,
  EMPTY_HISTORY,
  MEASURE_VERSION,
  daysToQuery,
  formatDuration,
  formatDurationPrecise,
  lastDays,
  mergeUsage,
  monthlyTotals,
  totalsFor,
  type UsageHistory,
} from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, packageBreakdown, packagesFor } from "@lib/usage/packages";
import {
  GOOD_AT,
  MIN_HOURLY_MS,
  VERDICT_DAYS,
  compareValue,
  median,
  metricView,
  subUsage,
} from "@lib/usage/value";

const NOW = new Date(2026, 8, 25, 15, 0, 0); // 2026-09-25 15:00 (기기 시간대)
const at = (date: string, hour = 0) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, hour).getTime();
};

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

describe("mergeUsage", () => {
  it("요청한 첫날부터 기록이 있으면 모든 날을 쌓고, 앱이 없는 날은 0으로 둔다", () => {
    const history = mergeUsage(
      EMPTY_HISTORY,
      {
        from: at("2026-09-23"),
        dataFrom: at("2026-09-23", 7),
        days: [
          { date: "2026-09-24", pkg: "com.netflix.mediaclient", foregroundMs: 3_600_000, opens: 2 },
        ],
      },
      3,
      NOW,
    );
    expect(Object.keys(history.days).sort()).toEqual(["2026-09-23", "2026-09-24", "2026-09-25"]);
    expect(history.days["2026-09-23"]).toEqual({});
    expect(history.days["2026-09-24"]["com.netflix.mediaclient"]).toEqual([3_600_000, 2]);
  });

  it("운영체제가 앞을 지웠으면 일부만 있는 날과 그 앞은 쌓지 않는다(모름을 0으로 읽지 않는다)", () => {
    const history = mergeUsage(
      EMPTY_HISTORY,
      { from: at("2026-09-21"), dataFrom: at("2026-09-23", 13), days: [] },
      5,
      NOW,
    );
    expect(Object.keys(history.days).sort()).toEqual(["2026-09-24", "2026-09-25"]);
  });

  it("기록이 하나도 없으면 아무 날도 쌓지 않는다", () => {
    const history = mergeUsage(
      EMPTY_HISTORY,
      { from: at("2026-09-24"), dataFrom: null, days: [] },
      2,
      NOW,
    );
    expect(history.days).toEqual({});
    expect(history.syncedAt).not.toBeNull();
  });

  it("이미 쌓은 날은 새 결과로 덮고, 새 결과에 없는 옛날은 남긴다", () => {
    const first = mergeUsage(
      EMPTY_HISTORY,
      {
        from: at("2026-09-20"),
        dataFrom: at("2026-09-20", 1),
        days: [{ date: "2026-09-20", pkg: "com.spotify.music", foregroundMs: 1000, opens: 1 }],
      },
      6,
      NOW,
    );
    const second = mergeUsage(
      first,
      {
        from: at("2026-09-24"),
        dataFrom: at("2026-09-24", 1),
        days: [{ date: "2026-09-25", pkg: "com.spotify.music", foregroundMs: 5000, opens: 3 }],
      },
      2,
      NOW,
    );
    expect(second.days["2026-09-20"]["com.spotify.music"]).toEqual([1000, 1]);
    expect(second.days["2026-09-25"]["com.spotify.music"]).toEqual([5000, 3]);
  });
});

describe("재생 알림 시간", () => {
  it("잴 수 있는 기기면 세 번째 칸에 적고, 처음 잰 날을 기억한다", () => {
    const history = mergeUsage(
      EMPTY_HISTORY,
      {
        from: at("2026-09-24"),
        dataFrom: at("2026-09-24", 1),
        serviceSupported: true,
        days: [
          {
            date: "2026-09-24",
            pkg: "com.spotify.music",
            foregroundMs: 60_000,
            opens: 1,
            serviceMs: 3_600_000,
          },
        ],
      },
      2,
      NOW,
    );
    expect(history.days["2026-09-24"]["com.spotify.music"]).toEqual([60_000, 1, 3_600_000]);
    expect(history.playbackFrom).toBe("2026-09-24");
    const totals = totalsFor(history, ["com.spotify.music"], ["2026-09-24", "2026-09-25"]);
    expect(totals.listenMs).toBe(3_600_000);
  });

  it("잴 수 없는 기기(안드로이드 9 이하)면 재생 시간을 모른다", () => {
    const history = mergeUsage(
      EMPTY_HISTORY,
      {
        from: at("2026-09-24"),
        dataFrom: at("2026-09-24", 1),
        serviceSupported: false,
        days: [{ date: "2026-09-24", pkg: "com.spotify.music", foregroundMs: 60_000, opens: 1 }],
      },
      2,
      NOW,
    );
    expect(history.playbackFrom).toBeUndefined();
    expect(totalsFor(history, ["com.spotify.music"], ["2026-09-24"]).listenMs).toBeNull();
  });
});

describe("유튜브 프리미엄(유튜브 + 유튜브 뮤직)", () => {
  const YT = "com.google.android.youtube";
  const MUSIC = "com.google.android.apps.youtube.music";

  it("앱마다 앱 시간과 재생 알림 시간 중 긴 쪽을 골라 더하고, 앱별로도 나눠 준다", () => {
    const history: UsageHistory = {
      v: 1,
      syncedAt: null,
      playbackFrom: "2026-09-20",
      days: {
        // 유튜브로 영상 2시간(재생 알림 1시간 겹침), 유튜브 뮤직은 화면 5분에 화면 끄고 1시간.
        "2026-09-24": { [YT]: [7_200_000, 2, 3_600_000], [MUSIC]: [300_000, 1, 3_600_000] },
      },
    };
    const totals = totalsFor(history, [YT, MUSIC], ["2026-09-24"]);
    expect(totals.usedMs).toBe(10_800_000);
    expect(totals.listenMs).toBe(10_800_000);
    expect(packageBreakdown([YT, MUSIC], totals.byPackage)).toEqual([
      { pkg: YT, label: "유튜브", usedMs: 7_200_000, opens: 2 },
      { pkg: MUSIC, label: "유튜브 뮤직", usedMs: 3_600_000, opens: 1 },
    ]);
  });

  it("재생 시간을 모르는 날은 앱 시간만 더하고, 앱이 하나인 구독은 나누지 않는다", () => {
    const history: UsageHistory = {
      v: 1,
      syncedAt: null,
      days: { "2026-09-24": { [MUSIC]: [300_000, 1] } },
    };
    const totals = totalsFor(history, [MUSIC], ["2026-09-24"]);
    expect(totals.usedMs).toBe(300_000);
    expect(totals.listenMs).toBeNull();
    expect(packageBreakdown([MUSIC], totals.byPackage)).toEqual([]);
  });
});

describe("totalsFor · monthlyTotals", () => {
  const history = mergeUsage(
    EMPTY_HISTORY,
    {
      from: at("2026-09-22"),
      dataFrom: at("2026-09-22", 8),
      days: [
        { date: "2026-09-22", pkg: "com.google.android.youtube", foregroundMs: 60_000, opens: 1 },
        {
          date: "2026-09-23",
          pkg: "com.google.android.apps.youtube.music",
          foregroundMs: 120_000,
          opens: 2,
        },
      ],
    },
    4,
    NOW,
  );

  it("기록이 있는 날만 세고, 한 구독의 여러 앱을 더한다", () => {
    const totals = totalsFor(
      history,
      packagesFor(
        sub({ name: "유튜브 프리미엄", cancelUrl: "https://www.youtube.com/paid_memberships" }),
      ) ?? [],
      lastDays(NOW, 7),
    );
    // 재생 시간을 잰 적이 없는 기록이라 들은 시간은 모른다(null).
    expect(totals).toEqual({
      ms: 180_000,
      opens: 3,
      coveredDays: 4,
      // 두 날 모두 5분(ACTIVE_DAY_MS)이 안 돼 쓴 날로 치지 않는다.
      activeDays: 0,
      listenMs: null,
      usedMs: 180_000,
      byPackage: {
        "com.google.android.youtube": { usedMs: 60_000, opens: 1 },
        "com.google.android.apps.youtube.music": { usedMs: 120_000, opens: 2 },
      },
    });
  });

  it("쓴 날은 그날 5분 이상 쓴 날만 센다(잠깐 켜 본 날은 빼고)", () => {
    const pkg = "com.netflix.mediaclient";
    const days = lastDays(NOW, 3);
    const h: UsageHistory = {
      v: 1,
      syncedAt: null,
      days: {
        [days[0]]: { [pkg]: [ACTIVE_DAY_MS - 1_000, 1] },
        [days[1]]: { [pkg]: [ACTIVE_DAY_MS, 1] },
        [days[2]]: { [pkg]: [3 * 60_000, 1], "com.google.android.youtube": [0, 0] },
      },
    };
    expect(totalsFor(h, [pkg], days).activeDays).toBe(1);
  });

  it("달별 합계는 12칸이고, 기록 없는 달은 coveredDays 0", () => {
    const months = monthlyTotals(history, ALL_USAGE_PACKAGES, NOW);
    expect(months).toHaveLength(12);
    expect(months[11].month).toBe("2026-09");
    expect(months[11].totals.ms).toBe(180_000);
    expect(months[0].totals.coveredDays).toBe(0);
  });
});

describe("subUsage", () => {
  const dates = lastDays(NOW, 30);

  it("연결표에 없는 구독(멤버십 등)은 잴 수 없다고 답한다", () => {
    const u = subUsage(
      sub({ name: "배민클럽", cancelUrl: "https://baemin.com" }),
      EMPTY_HISTORY,
      null,
      dates,
      1350,
    );
    expect(u.state).toBe("unmapped");
  });

  it("이 폰에 앱이 없고 기록도 없으면 0회를 '안 씀'으로 읽지 않는다", () => {
    const u = subUsage(sub(), EMPTY_HISTORY, [], dates, 1350);
    expect(u.state).toBe("not-installed");
  });

  it("시간당 단가는 기록이 있는 날만큼의 구독료 ÷ 사용 시간이다", () => {
    const days: Record<string, Record<string, [number, number]>> = {};
    for (const date of dates) days[date] = {};
    days[dates[29]] = { "com.netflix.mediaclient": [10 * 3_600_000, 10] };
    const u = subUsage(
      sub(),
      { v: 1, days, syncedAt: null },
      ["com.netflix.mediaclient"],
      dates,
      1350,
    );
    expect(u.state).toBe("measured");
    expect(u.hourlyKRW).toBeCloseTo(1700);
    expect(u.perOpenKRW).toBeCloseTo(1700);
    expect(u.level).toBe("green");
  });

  // Gemini 앱이 Google 앱으로 화면을 넘기는 0.5초만 잡혔을 때 '시간당 5,400만 원'이 나왔다.
  it("1시간도 안 썼으면 시간당 금액을 내지 않고, 그동안 낸 돈은 남긴다", () => {
    const days: Record<string, Record<string, [number, number]>> = {};
    for (const date of dates) days[date] = {};
    days[dates[29]] = { "com.netflix.mediaclient": [500, 0] };
    const u = subUsage(
      sub(),
      { v: 1, days, syncedAt: null },
      ["com.netflix.mediaclient"],
      dates,
      1350,
    );
    expect(u.state).toBe("measured");
    expect(u.hourlyKRW).toBeNull();
    expect(u.periodCostKRW).toBeCloseTo(17000);
    const view = metricView(u, "hours");
    expect(view.short).toBe(true);
    expect(view.unitKRW).toBeNull();
    expect(formatDurationPrecise(500)).toBe("1초");
    expect(formatDurationPrecise(12_400)).toBe("12초");
    expect(formatDurationPrecise(MIN_HOURLY_MS)).toBe("1시간");
  });

  it("쓴 날로 재는 구독은 하루당 금액으로 말하고, 기록이 30일이 안 되면 30일로 늘린다", () => {
    const recent = dates.slice(15); // 15일치 기록
    const days: Record<string, Record<string, [number, number]>> = {};
    for (const date of recent) days[date] = {};
    for (const date of recent.slice(0, 5)) days[date] = { "com.netflix.mediaclient": [600_000, 1] };
    const u = subUsage(
      sub(),
      { v: 1, days, syncedAt: null },
      ["com.netflix.mediaclient"],
      dates,
      1350,
    );
    const view = metricView(u, "days");
    expect(view.perLabel).toBe("하루당");
    expect(view.quantity).toBe(5);
    // 15일 중 5일 → 30일이면 10일 → 17,000 ÷ 10
    expect(view.unitKRW).toBeCloseTo(1700);
    // 기록이 30일이 안 되면 평가는 미룬다(숫자는 보인다). 이틀에 한 번 연 것이 '잘 씀'이 되던 것.
    expect(view.level).toBeNull();
    expect(view.pendingDays).toBe(15);
  });

  it("기록이 30일 쌓이면 평가하고, '잘 씀' 기준(GOOD_AT)에 닿으면 초록이다", () => {
    const make = (opens: number) => {
      const days: Record<string, Record<string, [number, number]>> = {};
      for (const date of dates) days[date] = {};
      for (const date of dates.slice(0, opens)) {
        days[date] = { "com.netflix.mediaclient": [3_600_000, 1] };
      }
      return subUsage(
        sub(),
        { v: 1, days, syncedAt: null },
        ["com.netflix.mediaclient"],
        dates,
        1350,
      );
    };
    expect(dates.length).toBe(VERDICT_DAYS);
    // getRiskLevel은 1회 단가가 요금의 25% 이하면 초록 — 막대의 '잘 씀' 기준과 같아야 한다.
    expect(metricView(make(GOOD_AT.uses), "uses").level).toBe("green");
    expect(metricView(make(GOOD_AT.uses - 1), "uses").level).not.toBe("green");
    expect(metricView(make(0), "uses").level).toBe("red");
    // 가성비 순서는 안 좋은 것부터
    const views = [make(6), make(0), make(2)].map((u) => metricView(u, "uses"));
    expect([...views].sort(compareValue).map((v) => v.have)).toEqual([0, 2, 6]);
  });
});

describe("helpers", () => {
  it("daysToQuery: 처음이면 35일, 어제 읽었으면 이틀", () => {
    expect(daysToQuery(EMPTY_HISTORY, NOW)).toBe(35);
    const yesterday = new Date(NOW.getTime() - 86_400_000).toISOString();
    expect(
      daysToQuery({ ...EMPTY_HISTORY, syncedAt: yesterday, measureVersion: MEASURE_VERSION }, NOW),
    ).toBe(2);
  });

  it("daysToQuery: 재는 방식이 바뀐 기록은 어제 읽었어도 35일을 다시 읽는다", () => {
    const yesterday = new Date(NOW.getTime() - 86_400_000).toISOString();
    // 판이 없는 기록(Gemini를 bard 앱으로만 재던 때)
    expect(daysToQuery({ ...EMPTY_HISTORY, syncedAt: yesterday }, NOW)).toBe(35);
    expect(daysToQuery({ ...EMPTY_HISTORY, syncedAt: yesterday, measureVersion: 1 }, NOW)).toBe(35);
  });

  it("mergeUsage: 다시 읽은 기록에 지금 판을 적어 다음부터는 하루치만 읽는다", () => {
    const merged = mergeUsage(
      EMPTY_HISTORY,
      { from: at("2026-09-24"), dataFrom: at("2026-09-24"), days: [] },
      2,
      NOW,
    );
    expect(merged.measureVersion).toBe(MEASURE_VERSION);
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0분");
    expect(formatDuration(30_000)).toBe("1분 미만");
    expect(formatDuration(40 * 60_000)).toBe("40분");
    expect(formatDuration((12 * 60 + 10) * 60_000)).toBe("12시간 10분");
  });

  it("median", () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("연결표 ↔ 안드로이드 매니페스트", () => {
  it("연결표의 모든 패키지가 매니페스트 <queries>에 있다(없으면 설치 여부를 알 수 없다)", () => {
    const manifest = readFileSync(
      path.resolve(__dirname, "../../../mobile/android/app/src/main/AndroidManifest.xml"),
      "utf8",
    );
    const declared = [...manifest.matchAll(/<package android:name="([^"]+)"/g)].map((m) => m[1]);
    expect([...declared].sort()).toEqual([...ALL_USAGE_PACKAGES].sort());
  });
});
