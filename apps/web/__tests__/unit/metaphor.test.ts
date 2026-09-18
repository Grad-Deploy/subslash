import { describe, it, expect } from "vitest";
import {
  getUsageMetaphor,
  getBreakEvenInfo,
  getMonthlyValueSummary,
  getLowUsageBillingMessage,
  Subscription,
  UsageLog,
} from "@subslash/shared";

/** 화면이 넘기는 사용자 환율. 헬퍼에는 기본값이 없다 — 잊으면 타입이 잡는다. */
const RATE = 1400;

describe("Metaphor and Value Calculation Utils", () => {
  describe("getUsageMetaphor", () => {
    it("0회 사용 시 쉬어가기 추천 메타포 반환", () => {
      const result = getUsageMetaphor(17000, "KRW", 0, "넷플릭스", RATE);
      expect(result.tone).toBe("danger");
      expect(result.message).toContain("잠시 구독을 쉬어가면");
    });

    it("1회 사용 시 OTT 세이브 기회 메타포 반환", () => {
      const result = getUsageMetaphor(17000, "KRW", 1, "넷플릭스", RATE);
      expect(result.tone).toBe("danger");
      expect(result.comparison).toContain("영화관 티켓");
      expect(result.message).toContain("세이브");
    });

    it("충분히 많이 사용(10회) 시 가성비 달성 메타포 반환", () => {
      const result = getUsageMetaphor(17000, "KRW", 10, "넷플릭스", RATE);
      expect(result.tone).toBe("safe");
      expect(result.message).toContain("본전 달성 완료");
    });

    it("USD는 넘겨받은 환율로 바꾼다 — 상수 1,350에 기대지 않는다", () => {
      // 비유는 원으로 환산한 금액에서 나온다. 환율이 두 배면 세는 개수도 두 배가 되어야 한다.
      expect(getUsageMetaphor(20, "USD", 1, "Claude", 1000).comparison).toContain("1.3장");
      expect(getUsageMetaphor(20, "USD", 1, "Claude", 2000).comparison).toContain("2.7장");
    });
  });

  describe("getBreakEvenInfo", () => {
    it("0회 사용 시 0% 및 위험 단계 반환", () => {
      const info = getBreakEvenInfo(17000, 0, 8);
      expect(info.progressPercent).toBe(0);
      expect(info.level).toBe("danger");
      expect(info.remainingMessage).toContain("이용이 아직 없어요");
    });

    it("5회 사용 시 약 63% 및 주의 단계 반환", () => {
      const info = getBreakEvenInfo(17000, 5, 8);
      expect(info.progressPercent).toBe(63);
      expect(info.level).toBe("warning");
      expect(info.remainingMessage).toContain("3회 더 이용하면 달성");
    });

    it("8회 이상 사용 시 100% 이상 및 달성 단계 반환", () => {
      const info = getBreakEvenInfo(17000, 10, 8);
      expect(info.progressPercent).toBe(125);
      expect(info.level).toBe("safe");
      expect(info.remainingMessage).toContain("본전 달성 완료");
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

  describe("getLowUsageBillingMessage", () => {
    it("결제 D-3 저사용 시 메타포 메시지 생성", () => {
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
      const msg = getLowUsageBillingMessage(sub, 1, 3, RATE);
      expect(msg).toContain("이번 달은 1회만 이용했어요");
      expect(msg).toContain("3일 뒤 갱신 전에 잠시 쉬어가면");
    });
  });
});
