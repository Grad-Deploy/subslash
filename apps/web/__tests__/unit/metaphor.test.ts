import { describe, it, expect } from "vitest";
import { messages } from "@lib/i18n/messages";
import { describeBreakEven, describeUsageMetaphor } from "@lib/i18n/check-in-outcome";
import { getCostPerUseBarState } from "../../components/subscription/CostPerUseBar";
import {
  GOOD_AT,
  calculateCostPerUse,
  getRiskLevel,
  getUsageMetaphor,
  getBreakEvenInfo,
  getMonthlyValueSummary,
  getLowUsageBillingFigures,
  Subscription,
  UsageLog,
} from "@subslash/shared";

/** 화면이 넘기는 사용자 환율. 헬퍼에는 기본값이 없다 — 잊으면 타입이 잡는다. */
const RATE = 1400;

/** 한국어 화면에 보이는 비유 문장(tone은 그대로). */
const metaphor = (...args: Parameters<typeof getUsageMetaphor>) => {
  const raw = getUsageMetaphor(...args);
  return { tone: raw.tone, ...describeUsageMetaphor(messages.ko, raw) };
};

describe("Metaphor and Value Calculation Utils", () => {
  describe("getUsageMetaphor", () => {
    it("0회 사용 시 쉬어가기 추천 메타포 반환", () => {
      const result = metaphor(17000, "KRW", 0, "넷플릭스", RATE);
      expect(result.tone).toBe("danger");
      expect(result.message).toContain("잠시 구독을 쉬어가면");
    });

    it("1회 사용 시 OTT 세이브 기회 메타포 반환", () => {
      const result = metaphor(17000, "KRW", 1, "넷플릭스", RATE);
      expect(result.tone).toBe("danger");
      expect(result.comparison).toContain("영화관 티켓");
      expect(result.message).toContain("세이브");
    });

    it("충분히 많이 사용(10회) 시 이용 목표 달성 메타포 반환", () => {
      const result = metaphor(17000, "KRW", 10, "넷플릭스", RATE);
      expect(result.tone).toBe("safe");
      expect(result.message).toContain("이용 목표 달성 완료");
    });

    it("USD는 넘겨받은 환율로 바꾼다 — 상수 1,350에 기대지 않는다", () => {
      // 비유는 원으로 환산한 금액에서 나온다. 환율이 두 배면 세는 개수도 두 배가 되어야 한다.
      expect(metaphor(20, "USD", 1, "Claude", 1000).comparison).toContain("1.3장");
      expect(metaphor(20, "USD", 1, "Claude", 2000).comparison).toContain("2.7장");
    });

    it("1에 가까운 개수를 '1.0장'으로 적지 않는다", () => {
      // ₩14,900 ÷ 영화관 티켓 ₩15,000 = 0.993 — 소수 한 자리로 반올림하면 '1.0'이 된다.
      const comparison = metaphor(14900, "KRW", 1, "유튜브 프리미엄", RATE).comparison;
      expect(comparison).toContain("1장");
      expect(comparison).not.toContain("1.0");
    });

    it("0원 부담 구독은 0~1회 danger·2~3회 warning·4회 이상 safe 톤을 유지하되 ₩0 절약 문구를 만들지 않는다", () => {
      const zero0 = metaphor(0, "KRW", 0, "넷플릭스", RATE);
      const zero1 = metaphor(0, "KRW", 1, "넷플릭스", RATE);
      const zero2 = metaphor(0, "KRW", 2, "넷플릭스", RATE);
      const zero4 = metaphor(0, "KRW", 4, "넷플릭스", RATE);

      expect(zero0.tone).toBe("danger");
      expect(zero1.tone).toBe("danger");
      expect(zero2.tone).toBe("warning");
      expect(zero4.tone).toBe("safe");

      for (const locale of Object.keys(messages) as Array<keyof typeof messages>) {
        for (const count of [0, 1, 2, 4]) {
          const text = describeUsageMetaphor(
            messages[locale],
            getUsageMetaphor(0, "KRW", count, "Netflix", RATE),
          );
          expect(text.comparison).not.toContain("₩0");
          expect(text.message).not.toContain("₩0");
        }
      }
    });
  });

  describe("getBreakEvenInfo", () => {
    it("기본 목표는 GOOD_AT.uses(4회)이며 getRiskLevel의 단계와 일치한다", () => {
      expect(GOOD_AT.uses).toBe(4);
      const levelMap = { red: "danger", yellow: "warning", green: "safe" } as const;
      for (const count of [0, 1, 2, 3, 4, 5, 8]) {
        const info = getBreakEvenInfo(17000, count);
        const risk = getRiskLevel(calculateCostPerUse(17000, count), 17000, count);
        expect(info.breakEvenUsage).toBe(GOOD_AT.uses);
        expect(info.level).toBe(levelMap[risk]);
      }
    });

    it("0회 사용 시 0% 및 위험 단계 반환", () => {
      const info = getBreakEvenInfo(17000, 0);
      expect(info.progressPercent).toBe(0);
      expect(info.level).toBe("danger");
      expect(describeBreakEven(messages.ko, info)).toContain("이용이 아직 없어요");
    });

    it("3회 사용 시 75% 및 주의 단계 반환 (기본 목표 4회)", () => {
      const info = getBreakEvenInfo(17000, 3);
      expect(info.progressPercent).toBe(75);
      expect(info.level).toBe("warning");
      expect(describeBreakEven(messages.ko, info)).toContain("1회 더 이용하면 달성");
    });

    it("4회 이상 사용 시 100% 이상 및 달성 단계 반환", () => {
      const info = getBreakEvenInfo(17000, 4);
      expect(info.progressPercent).toBe(100);
      expect(info.level).toBe("safe");
      expect(describeBreakEven(messages.ko, info)).toContain("이용 목표 달성 완료");
    });

    it("사용자 지정 목표(8회)에서도 50% 미만 danger, 100% 미만 warning, 100% 이상 safe 기준을 유지한다", () => {
      expect(getBreakEvenInfo(17000, 3, 8).level).toBe("danger");
      expect(getBreakEvenInfo(17000, 7, 8).level).toBe("warning");
      expect(getBreakEvenInfo(17000, 8, 8).level).toBe("safe");
    });
  });

  describe("getCostPerUseBarState", () => {
    it("막대 길이(ratio)는 1→2→4→10회로 갈수록 점진적으로 줄고, 색상(variant)은 4회 목표(getRiskLevel) 기준을 따른다", () => {
      expect(getCostPerUseBarState(17000, 17000, 0)).toEqual({
        ratio: 100,
        variant: "destructive",
      });
      expect(getCostPerUseBarState(17000, 17000, 1)).toEqual({
        ratio: 100,
        variant: "destructive",
      });
      expect(getCostPerUseBarState(8500, 17000, 2)).toEqual({
        ratio: 50,
        variant: "warning",
      });
      expect(getCostPerUseBarState(4250, 17000, 4)).toEqual({
        ratio: 25,
        variant: "success",
      });
      expect(getCostPerUseBarState(1700, 17000, 10)).toEqual({
        ratio: 10,
        variant: "success",
      });
    });

    it("0원 부담 구독(monthlyAmount <= 0)은 막대 길이를 0으로 두되 색상은 사용량 기준(0~1 적색, 2~3 황색, 4+ 녹색)을 유지한다", () => {
      expect(getCostPerUseBarState(0, 0, 0)).toEqual({
        ratio: 0,
        variant: "destructive",
      });
      expect(getCostPerUseBarState(0, 0, 1)).toEqual({
        ratio: 0,
        variant: "destructive",
      });
      expect(getCostPerUseBarState(0, 0, 2)).toEqual({
        ratio: 0,
        variant: "warning",
      });
      expect(getCostPerUseBarState(0, 0, 4)).toEqual({
        ratio: 0,
        variant: "success",
      });
    });
  });

  describe("getMonthlyValueSummary", () => {
    const sampleSubs: Subscription[] = [
      {
        id: "sub-1",
        name: "유튜브 프리미엄",
        amount: 14900,
        currency: "KRW",
        billingDay: 15,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "sub-2",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay: 20,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const sampleLogs: UsageLog[] = [
      {
        id: "log-1",
        subscriptionId: "sub-1",
        month: "2026-09",
        usageCount: 20,
        costPerUse: 745,
        riskLevel: "green",
        checkedAt: "2026-09-10T00:00:00.000Z",
      },
      {
        id: "log-2",
        subscriptionId: "sub-2",
        month: "2026-09",
        usageCount: 0,
        costPerUse: 17000,
        riskLevel: "red",
        checkedAt: "2026-09-10T00:00:00.000Z",
      },
    ];

    it("뽕 뽑은 구독과 낭비 구독을 정확히 분류", () => {
      const summary = getMonthlyValueSummary(sampleSubs, sampleLogs, RATE);
      expect(summary.totalSpendKRW).toBe(31900);
      expect(summary.worthItItems).toHaveLength(1);
      expect(summary.worthItItems[0].sub.name).toBe("유튜브 프리미엄");
      expect(summary.wastedItems).toHaveLength(1);
      expect(summary.wastedItems[0].sub.name).toBe("넷플릭스");
      expect(summary.wasteSuggestion).not.toBeNull();
    });
  });

  describe("getLowUsageBillingFigures", () => {
    it("한 달치 내 몫과 가장 가까운 소비재를 값으로 돌려준다", () => {
      const sub: Subscription = {
        id: "sub-netflix",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay: 19,
        billingCycle: "monthly",
        category: "ott",
        status: "active",
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const figures = getLowUsageBillingFigures(sub, RATE);
      expect(figures).toMatchObject({ amount: 17000, currency: "KRW", item: "movie" });
      expect(figures.count).toBeCloseTo(17000 / 15000);
    });
  });
});
