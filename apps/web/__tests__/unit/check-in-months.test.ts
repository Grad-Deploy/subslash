import { describe, expect, it } from "vitest";
import type { UsageLog } from "@subslash/shared";
import { checkInMonths } from "@lib/check-in-months";

function log(month: string, usageCount: number, extra: Partial<UsageLog> = {}): UsageLog {
  return {
    id: `${month}-${usageCount}`,
    subscriptionId: "s1",
    month,
    usageCount,
    costPerUse: 0,
    riskLevel: "green",
    checkedAt: `${month}-15T00:00:00.000Z`,
    ...extra,
  };
}

const NOW = new Date(2026, 9, 13); // 2026-10-13

describe("checkInMonths", () => {
  it("최근 12달을 이번 달까지 순서대로 돌려주고, 체크인하지 않은 달은 0이 아니라 null이다", () => {
    const { months } = checkInMonths([log("2026-10", 0), log("2026-08", 5)], "uses", NOW);
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe("2025-11");
    expect(months[11]).toEqual({ month: "2026-10", quantity: 0 });
    expect(months[9]).toEqual({ month: "2026-08", quantity: 5 });
    expect(months[10]).toEqual({ month: "2026-09", quantity: null });
  });

  it("시각을 읽을 수 없는 기록은 마지막으로 고르지 않되, 그것뿐인 달은 그 기록을 쓴다", () => {
    const { months } = checkInMonths(
      [
        log("2026-10", 8, { checkedAt: "2026-10-01T00:00:00.000Z" }),
        log("2026-10", 1, { checkedAt: "어제" }),
        log("2026-09", 3, { checkedAt: "어제" }),
      ],
      "uses",
      NOW,
    );
    expect(months[11]).toEqual({ month: "2026-10", quantity: 8 });
    expect(months[10]).toEqual({ month: "2026-09", quantity: 3 });
  });

  it("같은 달에 여러 번 체크인했으면 마지막 것을 쓴다", () => {
    const { months } = checkInMonths(
      [
        log("2026-10", 9, { id: "late", checkedAt: "2026-10-12T00:00:00.000Z" }),
        log("2026-10", 3, { id: "early", checkedAt: "2026-10-02T00:00:00.000Z" }),
      ],
      "uses",
      NOW,
    );
    expect(months[11].quantity).toBe(9);
  });

  it("다른 지표로 센 체크인은 막대에 넣지 않고 몇 건인지 센다 — 지표가 없던 예전 체크인은 횟수다", () => {
    const result = checkInMonths(
      [
        log("2026-10", 8, { metric: "days" }),
        log("2026-09", 12),
        log("2026-08", 4, { metric: "days" }),
      ],
      "days",
      NOW,
    );
    expect(result.months[11].quantity).toBe(8);
    expect(result.months[10].quantity).toBeNull();
    expect(result.otherMetric).toBe(1);
  });

  it("기간 밖의 체크인은 세지 않는다", () => {
    const result = checkInMonths(
      [log("2025-10", 3), log("2025-09", 2, { metric: "days" })],
      "uses",
      NOW,
    );
    expect(result.months.every((m) => m.quantity === null)).toBe(true);
    expect(result.otherMetric).toBe(0);
  });
});
