import { describe, it, expect } from "vitest";
import {
  calculateCostPerUse,
  getRiskLevel,
  formatShockMessage,
  formatCurrency,
  calculateAnnualSavings,
  getSavingsEquivalent,
  getSavingsEquivalents,
} from "@subslash/shared";

describe("Cost Per Use Utils", () => {
  describe("calculateCostPerUse", () => {
    it("정상 계산: 17000 / 3 = 5666.67 (approx)", () => {
      expect(calculateCostPerUse(17000, 3)).toBeCloseTo(5666.67, 1);
    });

    it("0회 사용: 17000 / 0 = 17000 (전액 반환)", () => {
      expect(calculateCostPerUse(17000, 0)).toBe(17000);
    });

    it("1회 사용: 17000 / 1 = 17000", () => {
      expect(calculateCostPerUse(17000, 1)).toBe(17000);
    });

    it("많은 사용: 9900 / 30 = 330", () => {
      expect(calculateCostPerUse(9900, 30)).toBe(330);
    });
  });

  describe("getRiskLevel", () => {
    it("Red: usageCount 0 -> red", () => {
      expect(getRiskLevel(17000, 17000, 0)).toBe("red");
    });

    it("Red: usageCount 1 -> red", () => {
      expect(getRiskLevel(17000, 17000, 1)).toBe("red");
    });

    it("Red: costPerUse > amount * 0.5", () => {
      // e.g. 17000 / 2 = 8500. Depending on strict >, > 0.5 might be handled.
      // Let's test a value clearly > 50%
      expect(getRiskLevel(8501, 17000, 2)).toBe("red");
    });

    it("Yellow: usageCount 3, costPerUse <= amount * 0.5", () => {
      expect(getRiskLevel(5000, 17000, 3)).toBe("yellow");
    });

    it("Green: usageCount 8+ regardless", () => {
      expect(getRiskLevel(2000, 17000, 8)).toBe("green");
    });

    it("Green: costPerUse <= amount * 0.25", () => {
      expect(getRiskLevel(4000, 17000, 4)).toBe("green");
    });
  });

  describe("formatShockMessage", () => {
    it('0회 이용: "공중에 버리셨습니다" 포함', () => {
      const msg = formatShockMessage("Netflix", 17000, 0, "KRW");
      expect(msg).toContain("공중에 버리셨습니다");
    });

    it('1회 이용: "1회를" 포함', () => {
      const msg = formatShockMessage("Netflix", 17000, 1, "KRW");
      expect(msg).toContain("1회를");
    });

    it('다회 이용: "1회당" 포함', () => {
      const msg = formatShockMessage("Netflix", 17000, 5, "KRW");
      expect(msg).toContain("1회당");
    });

    it("KRW 통화: ₩ 기호 포함", () => {
      const msg = formatShockMessage("Netflix", 17000, 1, "KRW");
      expect(msg).toContain("₩");
    });

    it("USD 통화: $ 기호 포함", () => {
      const msg = formatShockMessage("Netflix", 9.99, 1, "USD");
      expect(msg).toContain("$");
    });
  });

  describe("formatCurrency", () => {
    it('KRW: formatCurrency(17000, "KRW") -> ₩17,000', () => {
      expect(formatCurrency(17000, "KRW")).toBe("₩17,000");
    });

    it('USD: formatCurrency(9.99, "USD") -> $9.99', () => {
      expect(formatCurrency(9.99, "USD")).toBe("$9.99");
    });
  });

  describe("calculateAnnualSavings", () => {
    it("17000 * 12 = 204000", () => {
      expect(calculateAnnualSavings(17000)).toBe(204000);
    });
  });

  describe("getSavingsEquivalent", () => {
    it('500000+ -> includes "해외 여행"', () => {
      const equivalents = getSavingsEquivalent(600000);
      expect(equivalents.some((e) => e.includes("해외 여행"))).toBe(true);
    });

    it('200000+ -> includes "레스토랑"', () => {
      const equivalents = getSavingsEquivalent(250000);
      expect(equivalents.some((e) => e.includes("레스토랑"))).toBe(true);
    });

    it("25000 -> 실제로 살 수 있는 것 중 가장 큰 보상인 치킨 1마리를 제시한다", () => {
      expect(getSavingsEquivalent(25000)).toEqual(["맛있는 치킨 1마리"]);
    });

    it("가장 싼 보상에도 못 미치면 아무것도 제시하지 않는다", () => {
      expect(getSavingsEquivalent(4999)).toEqual([]);
      expect(getSavingsEquivalent(0)).toEqual([]);
    });

    it("환산 카드와 공유 문구가 같은 값을 말한다", () => {
      const annualSavings = 60000;
      const cards = getSavingsEquivalents(annualSavings);
      const headline = getSavingsEquivalent(annualSavings)[0];
      const best = cards[cards.length - 1];

      expect(headline).toBe(`${best.label} ${best.count}${best.unit}`);
    });
  });

  describe("getSavingsEquivalents", () => {
    it("절약액이 감당하지 못하는 보상은 아예 제외한다", () => {
      // ₩12,000이면 라떼 2잔은 되지만 ₩20,000짜리 치킨부터는 아직 못 산다.
      expect(getSavingsEquivalents(12000).map((e) => e.label)).toEqual(["카페 라떼"]);

      // ₩30,000이면 치킨까지는 되지만 ₩100,000짜리 레스토랑 저녁은 안 된다.
      expect(getSavingsEquivalents(30000).map((e) => e.label)).toEqual([
        "카페 라떼",
        "맛있는 치킨",
      ]);
    });

    it("개수는 단가로 나눈 실제 수량이다", () => {
      const chicken = getSavingsEquivalents(65000).find((e) => e.label === "맛있는 치킨");

      expect(chicken?.count).toBe(3); // floor(65000 / 20000)
    });

    it("가장 싼 보상에도 못 미치면 빈 배열을 반환한다", () => {
      expect(getSavingsEquivalents(4999)).toEqual([]);
    });

    it("싼 것부터 비싼 순서로 반환한다", () => {
      const labels = getSavingsEquivalents(600000).map((e) => e.label);

      expect(labels).toEqual([
        "카페 라떼",
        "맛있는 치킨",
        "고급 레스토랑 저녁",
        "가까운 해외 여행",
      ]);
    });
  });
});
