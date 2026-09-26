import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  EMPTY_HISTORY,
  daysToQuery,
  formatDuration,
  lastDays,
  mergeUsage,
  monthlyTotals,
  totalsFor,
} from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, packagesFor } from "@lib/usage/packages";
import { median, subUsage } from "@lib/usage/value";

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
      activeDays: 2,
      listenMs: null,
    });
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
});

describe("helpers", () => {
  it("daysToQuery: 처음이면 35일, 어제 읽었으면 이틀", () => {
    expect(daysToQuery(EMPTY_HISTORY, NOW)).toBe(35);
    expect(
      daysToQuery(
        { ...EMPTY_HISTORY, syncedAt: new Date(NOW.getTime() - 86_400_000).toISOString() },
        NOW,
      ),
    ).toBe(2);
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
