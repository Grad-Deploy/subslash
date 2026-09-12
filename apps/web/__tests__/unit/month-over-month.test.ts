import { describe, it, expect } from "vitest";
import { DEFAULT_EXCHANGE_RATE, getMonthOverMonthDefended } from "@subslash/shared";

/** 2026년 9월 11일을 오늘로 본다. */
const NOW = new Date(2026, 8, 11);

const monthly = {
  amount: 17000,
  currency: "KRW" as const,
  billingCycle: "monthly" as const,
  billingDay: 15,
};

describe("getMonthOverMonthDefended", () => {
  it("두 달 모두 해지 뒤라면 같은 금액이고 변화가 없다", () => {
    const killedInMay = { ...monthly, killedAt: "2026-05-10T00:00:00.000Z" };
    expect(getMonthOverMonthDefended([killedInMay], DEFAULT_EXCHANGE_RATE, NOW)).toEqual({
      current: { year: 2026, month: 9, amount: 17000 },
      previous: { year: 2026, month: 8, amount: 17000 },
      change: 0,
      unknownCount: 0,
    });
  });

  it("지난달 결제일이 지난 뒤 해지했으면 지난달은 0, 이번 달부터 막는다", () => {
    const killedAfterAugBilling = { ...monthly, killedAt: "2026-08-20T00:00:00.000Z" };
    const result = getMonthOverMonthDefended([killedAfterAugBilling], DEFAULT_EXCHANGE_RATE, NOW);

    expect(result.previous.amount).toBe(0);
    expect(result.current.amount).toBe(17000);
    expect(result.change).toBe(17000);
  });

  it("연간 구독은 결제 월에만 잡혀서, 결제 월이 지난달이면 이번 달이 줄어든다", () => {
    const yearlyAugust = {
      amount: 120000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingDay: 20,
      billingMonth: 8,
      killedAt: "2026-01-10T00:00:00.000Z",
    };
    const result = getMonthOverMonthDefended([yearlyAugust], DEFAULT_EXCHANGE_RATE, NOW);

    expect(result.previous.amount).toBe(120000);
    expect(result.current.amount).toBe(0);
    expect(result.change).toBe(-120000);
  });

  it("1월의 지난달은 작년 12월이다", () => {
    const january = new Date(2026, 0, 10);
    const killedInNovember = { ...monthly, killedAt: "2025-11-01T00:00:00.000Z" };
    const result = getMonthOverMonthDefended([killedInNovember], DEFAULT_EXCHANGE_RATE, january);

    expect(result.previous).toEqual({ year: 2025, month: 12, amount: 17000 });
    expect(result.current).toEqual({ year: 2026, month: 1, amount: 17000 });
  });

  it("판단할 수 없는 구독은 두 달 모두에서 빼고 따로 센다", () => {
    const noMonth = {
      amount: 120000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingDay: 20,
      killedAt: "2026-01-10T00:00:00.000Z",
    };
    const broken = { ...monthly, killedAt: "언젠가" };
    const killedInMay = { ...monthly, killedAt: "2026-05-10T00:00:00.000Z" };
    const result = getMonthOverMonthDefended(
      [noMonth, broken, killedInMay],
      DEFAULT_EXCHANGE_RATE,
      NOW,
    );

    expect(result.unknownCount).toBe(2);
    expect(result.current.amount).toBe(17000);
    expect(result.previous.amount).toBe(17000);
  });

  it("공유 구독은 내 몫으로, USD 구독은 넘긴 환율로 센다", () => {
    const shared = { ...monthly, sharingCount: 4, killedAt: "2026-05-10T00:00:00.000Z" };
    const usd = {
      amount: 10,
      currency: "USD" as const,
      billingCycle: "monthly" as const,
      billingDay: 5,
      killedAt: "2026-05-10T00:00:00.000Z",
    };
    const result = getMonthOverMonthDefended([shared, usd], 1400, NOW);

    expect(result.current.amount).toBe(17000 / 4 + 14000);
    expect(result.change).toBe(0);
  });
});
