import { describe, it, expect } from "vitest";
import {
  getMyMonthDefendedAmountKRW,
  sumMyMonthDefendedKRW,
  DEFAULT_EXCHANGE_RATE,
} from "@subslash/shared";

/** 2026년 9월을 기준 달로 본다. */
const YEAR = 2026;
const MONTH = 9;

const monthly = {
  amount: 17000,
  currency: "KRW" as const,
  billingCycle: "monthly" as const,
  billingDay: 15,
};

describe("getMyMonthDefendedAmountKRW", () => {
  it("결제일 전에 해지했으면 이번 달 돈은 방어된 것이다", () => {
    const sub = { ...monthly, killedAt: "2026-09-01T00:00:00.000Z" };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(17000);
  });

  it("결제일이 지난 뒤 해지했으면 이번 달 돈은 이미 나갔다", () => {
    const sub = { ...monthly, killedAt: "2026-09-20T00:00:00.000Z" };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(0);
  });

  it("지난달에 해지한 구독은 이번 달도 방어된다", () => {
    const sub = { ...monthly, killedAt: "2026-08-02T00:00:00.000Z" };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(17000);
  });

  it("해지 시점을 모르는 예전 데이터도 현재 해지 상태이므로 방어로 센다", () => {
    expect(getMyMonthDefendedAmountKRW(monthly, YEAR, MONTH)).toBe(17000);
  });

  it("공유 구독은 내 몫만 방어액으로 센다", () => {
    const sub = { ...monthly, sharingCount: 4, killedAt: "2026-09-01T00:00:00.000Z" };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(17000 / 4);
  });

  it("결제 월이 이번 달인 연간 구독은 연 결제액 전체가 방어된다", () => {
    const sub = {
      amount: 120000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingDay: 20,
      billingMonth: 9,
      killedAt: "2026-09-05T00:00:00.000Z",
    };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(120000);
  });

  it("결제 월이 다른 연간 구독은 이번 달 방어액이 0이다", () => {
    const sub = {
      amount: 120000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingDay: 20,
      billingMonth: 3,
      killedAt: "2026-09-05T00:00:00.000Z",
    };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(0);
  });

  it("결제 월을 모르는 연간 구독은 0이 아니라 null이다", () => {
    const sub = {
      amount: 120000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingDay: 20,
      killedAt: "2026-09-05T00:00:00.000Z",
    };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBeNull();
  });

  it("31일 결제인데 30일까지인 달이면 말일을 결제일로 본다", () => {
    // 2026년 4월은 30일까지. 4월 30일에 해지했으면 아직 결제 전이다.
    const sub = { ...monthly, billingDay: 31, killedAt: "2026-04-30T00:00:00.000Z" };
    expect(getMyMonthDefendedAmountKRW(sub, 2026, 4)).toBe(17000);
  });

  it("USD 구독은 사용자 환율로 환산한다", () => {
    const sub = {
      amount: 10,
      currency: "USD" as const,
      billingCycle: "monthly" as const,
      billingDay: 5,
      killedAt: "2026-09-01T00:00:00.000Z",
    };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH, 1400)).toBe(14000);
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBe(10 * DEFAULT_EXCHANGE_RATE);
  });

  it("해지 시각이 깨졌으면 방어액을 지어내지 않고 null이다", () => {
    const sub = { ...monthly, killedAt: "언젠가" };
    expect(getMyMonthDefendedAmountKRW(sub, YEAR, MONTH)).toBeNull();
  });
});

describe("sumMyMonthDefendedKRW", () => {
  it("판단할 수 없는 구독은 합계에 넣지 않고 따로 센다", () => {
    const subs = [
      { ...monthly, killedAt: "2026-09-01T00:00:00.000Z" },
      { ...monthly, amount: 9900, killedAt: "2026-09-25T00:00:00.000Z" },
      {
        amount: 120000,
        currency: "KRW" as const,
        billingCycle: "yearly" as const,
        billingDay: 20,
        killedAt: "2026-09-05T00:00:00.000Z",
      },
    ];
    expect(sumMyMonthDefendedKRW(subs, YEAR, MONTH)).toEqual({
      amount: 17000,
      unknownCount: 1,
    });
  });

  it("해지 구독이 없으면 0원이다", () => {
    expect(sumMyMonthDefendedKRW([], YEAR, MONTH)).toEqual({ amount: 0, unknownCount: 0 });
  });
});
