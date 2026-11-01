/**
 * 기준을 바꾸면 이 표와 docs/VERDICT_ALGORITHMS.md를 함께 고친다.
 */
import { describe, expect, it } from "vitest";
import {
  GOOD_AT,
  VERDICT_THRESHOLDS,
  calculateCostPerUse,
  getBreakEvenInfo,
  getRiskLevel,
  metricRiskLevel,
  type RiskLevel,
  type StoragePlanFit,
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
  // 기준을 바꾸면 이 표와 docs/VERDICT_ALGORITHMS.md를 함께 고친다.
  // GOOD_AT나 VERDICT_THRESHOLDS를 참조하지 않고 리터럴 숫자로 기대값을 고정해,
  // 상수가 의도치 않게 변경되었을 때 테스트가 즉시 실패하도록 한다.
  describe("기본 임계값 리터럴 고정 골든 테스트 (golden thresholds)", () => {
    it("uses: 월 부담금 12000원 및 0원 모두 0·1·1.5회 red, 2·3·3.9회 yellow, 4·5회 green이다", () => {
      const goldenUses: ReadonlyArray<readonly [number, RiskLevel]> = [
        [0, "red"],
        [1, "red"],
        [1.5, "red"],
        [2, "yellow"],
        [3, "yellow"],
        [3.9, "yellow"],
        [4, "green"],
        [5, "green"],
      ];

      for (const monthly of [12000, 0] as const) {
        for (const [count, expected] of goldenUses) {
          const cpu = calculateCostPerUse(monthly, count);
          expect(getRiskLevel(cpu, monthly, count), `monthly=${monthly}, count=${count}`).toBe(
            expected,
          );
        }
      }
    });

    it("days: 0·1·2일 red, 3·9일 yellow, 10·30일 green이다", () => {
      const goldenDays: ReadonlyArray<readonly [number, RiskLevel]> = [
        [0, "red"],
        [1, "red"],
        [2, "red"],
        [3, "yellow"],
        [9, "yellow"],
        [10, "green"],
        [30, "green"],
      ];

      for (const [days, expected] of goldenDays) {
        expect(metricRiskLevel("days", 12000, days), `days=${days}`).toBe(expected);
      }
    });

    it("hours: 0·1·1.9시간 red, 2·9시간 yellow, 10시간 green이다", () => {
      const goldenHours: ReadonlyArray<readonly [number, RiskLevel]> = [
        [0, "red"],
        [1, "red"],
        [1.9, "red"],
        [2, "yellow"],
        [9, "yellow"],
        [10, "green"],
      ];

      for (const [hours, expected] of goldenHours) {
        expect(metricRiskLevel("hours", 12000, hours), `hours=${hours}`).toBe(expected);
      }
    });

    it("게이지 기본 호출(getBreakEvenInfo): 0·1회 danger, 2·3회 warning, 4회 이상 safe이며 목표 횟수를 바꿔도 기본 danger 경계는 2회 미만이다", () => {
      const goldenGaugeDefault: ReadonlyArray<readonly [number, "danger" | "warning" | "safe"]> = [
        [0, "danger"],
        [1, "danger"],
        [2, "warning"],
        [3, "warning"],
        [4, "safe"],
        [5, "safe"],
      ];

      for (const [count, expected] of goldenGaugeDefault) {
        expect(getBreakEvenInfo(12000, count).level, `default target count=${count}`).toBe(
          expected,
        );
      }

      // breakEvenTarget을 8로 넘기더라도 기본 규칙(2회 미만 danger)을 따른다.
      expect(getBreakEvenInfo(12000, 1, 8).level).toBe("danger");
      expect(getBreakEvenInfo(12000, 2, 8).level).toBe("warning");
      expect(getBreakEvenInfo(12000, 3, 8).level).toBe("warning");
      expect(getBreakEvenInfo(12000, 8, 8).level).toBe("safe");
    });
  });

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
          const risk = metricRiskLevel("days", monthly, days);
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
          const risk = metricRiskLevel("hours", monthly, hours);
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

  describe("benefit·free-tier·API 가치 보정·storage 불변식 및 경계", () => {
    it("benefit(KRW, 월 회비 {1000, 12000}): 혜택을 0부터 회비의 2배까지 늘릴 때 단조 증가하고 리터럴 비율 경계(0.5 / 1.0) 및 0원 회비(항상 green)를 만족한다", () => {
      for (const monthly of [1000, 12000] as const) {
        const step = monthly === 1000 ? 50 : 500;
        let prevOrder = -1;
        for (let benefit = 0; benefit <= monthly * 2; benefit += step) {
          const risk = metricRiskLevel("benefit", monthly, benefit);
          const order = RISK_ORDER[risk];
          expect(
            order,
            `monotonicity failed at monthly=${monthly}, benefit=${benefit}`,
          ).toBeGreaterThanOrEqual(prevOrder);
          prevOrder = order;

          const ratio = benefit / monthly;
          if (ratio < 0.5) {
            expect(risk, `monthly=${monthly}, benefit=${benefit}`).toBe("red");
          } else if (ratio < 1) {
            expect(risk, `monthly=${monthly}, benefit=${benefit}`).toBe("yellow");
          } else {
            expect(risk, `monthly=${monthly}, benefit=${benefit}`).toBe("green");
          }
        }
      }

      // 리터럴 경계 정밀 확인 (1000원: 499 red / 500 yellow / 999 yellow / 1000 green, 12000원: 5999 red / 6000 yellow / 11999 yellow / 12000 green)
      expect(metricRiskLevel("benefit", 1000, 499)).toBe("red");
      expect(metricRiskLevel("benefit", 1000, 500)).toBe("yellow");
      expect(metricRiskLevel("benefit", 1000, 999)).toBe("yellow");
      expect(metricRiskLevel("benefit", 1000, 1000)).toBe("green");

      expect(metricRiskLevel("benefit", 12000, 5999)).toBe("red");
      expect(metricRiskLevel("benefit", 12000, 6000)).toBe("yellow");
      expect(metricRiskLevel("benefit", 12000, 11999)).toBe("yellow");
      expect(metricRiskLevel("benefit", 12000, 12000)).toBe("green");

      // 월 회비 0원이면 혜택 금액과 무관하게 항상 green
      for (const benefit of [0, 100, 5000, 20000]) {
        expect(metricRiskLevel("benefit", 0, benefit)).toBe("green");
      }
    });

    it("days 보정: freeTier='enough'는 green만 yellow로 내리고, apiValueRatio >= 1은 0~2일도 green으로 올리되 freeTier='enough'와 함께 오면 yellow가 된다", () => {
      for (let days = 0; days <= 30; days += 1) {
        const base = metricRiskLevel("days", 20000, days);
        const withEnough = metricRiskLevel("days", 20000, days, null, "enough");
        const withNeeded = metricRiskLevel("days", 20000, days, null, "needed");

        // freeTier="needed"는 기본 판정과 완전히 같다
        expect(withNeeded, `days=${days} needed`).toBe(base);

        // freeTier="enough"는 green만 yellow로 내리고 red(0~2일)·yellow(3~9일)는 그대로 둔다
        if (base === "green") {
          expect(withEnough, `days=${days} enough on green`).toBe("yellow");
        } else {
          expect(withEnough, `days=${days} enough on ${base}`).toBe(base);
        }

        // apiValueRatio >= 1이면 일수가 0~2일(red)이어도 green이 되고, freeTier="enough"와 함께 오면 yellow가 된다
        for (const ratio of [1, 1.5, 3]) {
          expect(
            metricRiskLevel("days", 20000, days, null, null, ratio),
            `days=${days}, ratio=${ratio}`,
          ).toBe("green");
          expect(
            metricRiskLevel("days", 20000, days, null, "enough", ratio),
            `days=${days}, enough, ratio=${ratio}`,
          ).toBe("yellow");
        }

        // apiValueRatio < 1이면 일수 기준(base) 그대로다
        for (const ratio of [0, 0.5, 0.99]) {
          expect(
            metricRiskLevel("days", 20000, days, null, null, ratio),
            `days=${days}, ratio=${ratio}`,
          ).toBe(base);
        }
      }
    });

    it("storage: 0%는 red, 요금제 미상 시 49%는 yellow·50%는 green이며, storageFit.smaller 유무가 고정 비율보다 우선한다", () => {
      const fitWithSmaller: StoragePlanFit = {
        planName: "2TB",
        capacityGB: 2000,
        usedGB: 100,
        smaller: { planName: "200GB", capacityGB: 200, amount: 4400 },
        bundledExtras: null,
      };
      const fitWithoutSmaller: StoragePlanFit = {
        planName: "2TB",
        capacityGB: 2000,
        usedGB: 800,
        smaller: null,
        bundledExtras: null,
      };

      // quantity === 0은 storageFit 유무와 상관없이 항상 red
      expect(metricRiskLevel("storage", 14000, 0)).toBe("red");
      expect(metricRiskLevel("storage", 14000, 0, fitWithSmaller)).toBe("red");
      expect(metricRiskLevel("storage", 14000, 0, fitWithoutSmaller)).toBe("red");

      // 요금제를 모를 때(storageFit = null): 49%는 yellow, 50%는 green
      expect(metricRiskLevel("storage", 14000, 49, null)).toBe("yellow");
      expect(metricRiskLevel("storage", 14000, 50, null)).toBe("green");

      // 요금제를 알 때(storageFit): smaller가 있으면 yellow(50% 이상이어도), 없으면 green(50% 미만인 40%여도)
      expect(metricRiskLevel("storage", 14000, 5, fitWithSmaller)).toBe("yellow");
      expect(metricRiskLevel("storage", 14000, 60, fitWithSmaller)).toBe("yellow");
      expect(metricRiskLevel("storage", 14000, 40, fitWithoutSmaller)).toBe("green");
      expect(metricRiskLevel("storage", 14000, 80, fitWithoutSmaller)).toBe("green");
    });
  });
});
