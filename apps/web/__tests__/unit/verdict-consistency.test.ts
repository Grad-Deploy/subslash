import { describe, expect, it } from "vitest";
import {
  GOOD_AT,
  VERDICT_THRESHOLDS,
  calculateCostPerUse,
  getBreakEvenInfo,
  getRiskLevel,
  metricRiskLevel,
  type RiskLevel,
} from "@subslash/shared";
import { getCostPerUseBarState } from "../../components/subscription/CostPerUseBar";

const RISK_ORDER: Record<RiskLevel, number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

const RISK_TO_GAUGE_LEVEL: Record<RiskLevel, "danger" | "warning" | "safe"> = {
  red: "danger",
  yellow: "warning",
  green: "safe",
};

const RISK_TO_BAR_VARIANT: Record<RiskLevel, "destructive" | "warning" | "success"> = {
  red: "destructive",
  yellow: "warning",
  green: "success",
};

const MONTHLY_AMOUNTS = [0, 1000, 12000] as const;
const INTEGER_COUNTS = Array.from({ length: 31 }, (_, i) => i); // 0..30
const FRACTIONAL_COUNTS = Array.from({ length: 13 }, (_, i) => i * 0.5); // 0, 0.5, ..., 6.0
const ALL_USES_COUNTS = Array.from(new Set([...INTEGER_COUNTS, ...FRACTIONAL_COUNTS])).sort(
  (a, b) => a - b,
);

function assertUsesInvariants() {
  // 1) 정수 횟수(0..30)에서 getRiskLevel <-> getBreakEvenInfo(..., GOOD_AT.uses).level 일치
  for (const monthly of MONTHLY_AMOUNTS) {
    for (const count of INTEGER_COUNTS) {
      const cpu = calculateCostPerUse(monthly, count);
      const risk = getRiskLevel(cpu, monthly, count);
      const gauge = getBreakEvenInfo(monthly, count, GOOD_AT.uses);
      expect(gauge.breakEvenUsage).toBe(GOOD_AT.uses);
      expect(gauge.level, `monthly=${monthly}, count=${count}`).toBe(RISK_TO_GAUGE_LEVEL[risk]);
    }
  }

  // 2) 모든 횟수(정수 0..30 + 소수 0..6)에서 CostPerUseBar variant <-> getRiskLevel 일치
  for (const monthly of MONTHLY_AMOUNTS) {
    for (const count of ALL_USES_COUNTS) {
      const cpu = calculateCostPerUse(monthly, count);
      const risk = getRiskLevel(cpu, monthly, count);
      const bar = getCostPerUseBarState(cpu, monthly, count);
      expect(bar.variant, `monthly=${monthly}, count=${count}`).toBe(RISK_TO_BAR_VARIANT[risk]);
    }
  }

  // 3) 유료(1000, 12000)와 0원(0)이 같은 횟수(소수 포함)에서 항상 같은 색을 반환
  for (const count of ALL_USES_COUNTS) {
    const riskFree = getRiskLevel(calculateCostPerUse(0, count), 0, count);
    for (const paid of [1000, 12000] as const) {
      const riskPaid = getRiskLevel(calculateCostPerUse(paid, count), paid, count);
      expect(riskPaid, `paid=${paid} vs free=0 at count=${count}`).toBe(riskFree);
    }
  }

  // 4) 단조성: 횟수가 늘어날 때 위험도가 나빠지는 일이 없다 (red <= yellow <= green)
  for (const monthly of MONTHLY_AMOUNTS) {
    let prevOrder = -1;
    for (const count of ALL_USES_COUNTS) {
      const cpu = calculateCostPerUse(monthly, count);
      const risk = getRiskLevel(cpu, monthly, count);
      const order = RISK_ORDER[risk];
      expect(
        order,
        `monotonicity failed at monthly=${monthly}, count=${count}`,
      ).toBeGreaterThanOrEqual(prevOrder);
      prevOrder = order;
    }
  }

  // 5) 경계 확인: redBelow 미만은 red, redBelow 이상 GOOD_AT.uses 미만은 yellow, GOOD_AT.uses 이상은 green
  for (const monthly of MONTHLY_AMOUNTS) {
    for (const count of ALL_USES_COUNTS) {
      const risk = getRiskLevel(calculateCostPerUse(monthly, count), monthly, count);
      if (count < VERDICT_THRESHOLDS.uses.redBelow) {
        expect(risk, `monthly=${monthly}, count=${count}`).toBe("red");
      } else if (count < GOOD_AT.uses) {
        expect(risk, `monthly=${monthly}, count=${count}`).toBe("yellow");
      } else {
        expect(risk, `monthly=${monthly}, count=${count}`).toBe("green");
      }
    }
  }
}

describe("5대 가치 지표 판정 일관성 및 불변식 (verdict-consistency)", () => {
  describe("uses 지표 불변식 (기본 GOOD_AT.uses = 4)", () => {
    it("월 부담금 {0, 1000, 12000} × 정수(0~30)·소수(0~6, 0.5 간격) 전 구간에서 게이지·막대·0원/유료·단조성이 일치한다", () => {
      expect(GOOD_AT.uses).toBe(4);
      assertUsesInvariants();
    });
  });

  describe("days / hours 지표 단조성 및 GOOD_AT 경계 일치", () => {
    it("days(0~30일)에 대해 metricRiskLevel이 단조 증가(red <= yellow <= green)하고 GOOD_AT.days 경계와 일치한다", () => {
      for (const monthly of MONTHLY_AMOUNTS) {
        let prevOrder = -1;
        for (let days = 0; days <= 30; days += 1) {
          const risk = metricRiskLevel("days", monthly, days, "KRW");
          const order = RISK_ORDER[risk];
          expect(order, `days=${days}, monthly=${monthly}`).toBeGreaterThanOrEqual(prevOrder);
          prevOrder = order;

          if (days <= VERDICT_THRESHOLDS.days.redAtOrBelow) {
            expect(risk).toBe("red");
          } else if (days < GOOD_AT.days) {
            expect(risk).toBe("yellow");
          } else {
            expect(risk).toBe("green");
          }
        }
      }
    });

    it("hours(0~40시간)에 대해 metricRiskLevel이 단조 증가(red <= yellow <= green)하고 GOOD_AT.hours 경계와 일치한다", () => {
      for (const monthly of MONTHLY_AMOUNTS) {
        let prevOrder = -1;
        for (let hours = 0; hours <= 40; hours += 1) {
          const risk = metricRiskLevel("hours", monthly, hours, "KRW");
          const order = RISK_ORDER[risk];
          expect(order, `hours=${hours}, monthly=${monthly}`).toBeGreaterThanOrEqual(prevOrder);
          prevOrder = order;

          if (hours < VERDICT_THRESHOLDS.hours.redBelow) {
            expect(risk).toBe("red");
          } else if (hours < GOOD_AT.hours) {
            expect(risk).toBe("yellow");
          } else {
            expect(risk).toBe("green");
          }
        }
      }
    });
  });

  describe("단일 출처 동적 파생 검증 (GOOD_AT.uses = 5)", () => {
    it("GOOD_AT.uses를 임시로 5로 바꾸면 getRiskLevel, getBreakEvenInfo, CostPerUseBar가 모두 5회 기준으로 함께 이동하며 불변식을 유지한다", () => {
      const originalUses = GOOD_AT.uses;
      try {
        GOOD_AT.uses = 5;
        expect(VERDICT_THRESHOLDS.uses.greenAt).toBe(5);

        // 4회는 기본(4)일 때 green이었으나, 5로 바꾸면 yellow / warning이 되어야 한다.
        expect(getRiskLevel(calculateCostPerUse(10000, 4), 10000, 4)).toBe("yellow");
        expect(getRiskLevel(calculateCostPerUse(0, 4), 0, 4)).toBe("yellow");
        expect(getBreakEvenInfo(10000, 4).level).toBe("warning");
        expect(getCostPerUseBarState(calculateCostPerUse(10000, 4), 10000, 4).variant).toBe(
          "warning",
        );

        // 5회부터 green / safe / success가 된다.
        expect(getRiskLevel(calculateCostPerUse(10000, 5), 10000, 5)).toBe("green");
        expect(getRiskLevel(calculateCostPerUse(0, 5), 0, 5)).toBe("green");
        expect(getBreakEvenInfo(10000, 5).level).toBe("safe");
        expect(getCostPerUseBarState(calculateCostPerUse(10000, 5), 10000, 5).variant).toBe(
          "success",
        );

        assertUsesInvariants();
      } finally {
        GOOD_AT.uses = originalUses;
      }
      expect(GOOD_AT.uses).toBe(4);
    });
  });
});
