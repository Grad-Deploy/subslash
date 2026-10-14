import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import type { UsageHistory } from "@lib/usage/history";
import { isCurrentMonth, monthDates } from "@lib/usage/history";
import { usageChartBars } from "@lib/usage/chart";
import { rangeDates } from "@lib/usage/value";

const NETFLIX = "com.netflix.mediaclient";
const NOW = new Date(2026, 9, 14, 9, 0);
const HOUR = 3_600_000;

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 10,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** `dates`마다 그 패키지를 `ms`만큼, 하루 한 번 연 기록. */
function history(pkg: string, dates: readonly string[], ms: number): UsageHistory {
  return {
    v: 1,
    syncedAt: null,
    days: Object.fromEntries(dates.map((date) => [date, { [pkg]: [ms, 1] as [number, number] }])),
  };
}

describe("usageChartBars — 구독별 사용 시간 막대", () => {
  const netflix = sub({});
  const melon = sub({ id: "melon", name: "Melon", category: "music" });

  it("30일을 다 잰 구독은 쓴 시간과 가성비 색을 갖는다", () => {
    const dates = rangeDates("month", NOW);
    const { bars, excluded } = usageChartBars(
      [netflix],
      history(NETFLIX, dates, HOUR),
      null,
      dates,
      1400,
    );
    expect(excluded).toEqual({ unmapped: 0, unmeasured: 0 });
    expect(bars).toHaveLength(1);
    expect(bars[0].usedMs).toBe(30 * HOUR);
    expect(bars[0].level).toBe("green");
  });

  it("30일이 안 된 기록은 색을 매기지 않는다(평가 전)", () => {
    const dates = rangeDates("month", NOW);
    const recent = dates.slice(-5);
    const { bars, partial } = usageChartBars(
      [netflix],
      history(NETFLIX, recent, HOUR),
      null,
      dates,
      1400,
    );
    expect(bars[0].level).toBeNull();
    expect(partial).toBe(true);
  });

  it("이 폰에서 잴 수 없는 구독은 0으로 그리지 않고 센다", () => {
    const dates = rangeDates("month", NOW);
    const { bars, excluded } = usageChartBars(
      [netflix, melon],
      history(NETFLIX, dates, HOUR),
      [NETFLIX],
      dates,
      1400,
    );
    expect(bars.map((bar) => bar.sub.id)).toEqual(["netflix"]);
    expect(excluded).toEqual({ unmapped: 0, unmeasured: 1 });
  });

  it("폰 기록으로 잴 방법이 없는 구독은 따로 센다", () => {
    const dates = rangeDates("month", NOW);
    const custom = sub({ id: "custom", name: "우리 동네 헬스장", category: "other" });
    const { bars, excluded } = usageChartBars(
      [netflix, custom],
      history(NETFLIX, dates, HOUR),
      null,
      dates,
      1400,
    );
    expect(bars).toHaveLength(1);
    expect(excluded).toEqual({ unmapped: 1, unmeasured: 0 });
  });

  it("빠짐없이 잰 지난달은 28일인 달도 한 달 치로 평가한다", () => {
    const february = monthDates("2026-02", NOW);
    expect(february).toHaveLength(28);
    const { bars } = usageChartBars(
      [netflix],
      history(NETFLIX, february, HOUR),
      null,
      february,
      1400,
      true,
    );
    expect(bars[0].level).not.toBeNull();
  });
});

describe("monthDates·isCurrentMonth", () => {
  it("이번 달은 오늘까지다", () => {
    expect(monthDates("2026-10", NOW)).toHaveLength(14);
    expect(monthDates("2026-09", NOW)).toHaveLength(30);
    expect(isCurrentMonth("2026-10", NOW)).toBe(true);
    expect(isCurrentMonth("2025-10", NOW)).toBe(false);
  });
});
