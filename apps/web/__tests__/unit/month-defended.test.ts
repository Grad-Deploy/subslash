import { describe, it, expect } from "vitest";
import {
  getMyMonthDefendedAmountKRW,
  getYearDefendedSeries,
  sumMyMonthDefendedKRW,
  sumMyYearDefendedKRW,
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

describe("getYearDefendedSeries", () => {
  /** 2026년 9월 11일을 오늘로 본다. */
  const NOW = new Date(2026, 8, 11);
  const killedInMay = { ...monthly, killedAt: "2026-05-10T00:00:00.000Z" };
  const yearlyMarch = {
    amount: 120000,
    currency: "KRW" as const,
    billingCycle: "yearly" as const,
    billingDay: 20,
    billingMonth: 3,
    killedAt: "2026-01-10T00:00:00.000Z",
  };

  it("해지 전 달은 0이고, 해지한 달부터 결제일마다 방어액이 생긴다", () => {
    const { months } = getYearDefendedSeries([killedInMay], YEAR, DEFAULT_EXCHANGE_RATE, NOW);

    expect(months.map((m) => m.amount)).toEqual([
      0, 0, 0, 0, 17000, 17000, 17000, 17000, 17000, 17000, 17000, 17000,
    ]);
  });

  it("이번 달까지는 지킨 돈, 남은 달은 예정으로 나눈다", () => {
    const series = getYearDefendedSeries([killedInMay], YEAR, DEFAULT_EXCHANGE_RATE, NOW);

    // 5~9월은 지켰고, 10~12월은 해지하지 않았다면 나갔을 예정이다.
    expect(series.pastAmount).toBe(17000 * 5);
    expect(series.scheduledAmount).toBe(17000 * 3);
    expect(series.months[8]).toMatchObject({ month: 9, isFuture: false });
    expect(series.months[9]).toMatchObject({ month: 10, isFuture: true });
  });

  it("연간 구독은 결제 월에만 연 결제액 전체가 잡힌다", () => {
    const { months } = getYearDefendedSeries([yearlyMarch], YEAR, DEFAULT_EXCHANGE_RATE, NOW);

    expect(months[2].amount).toBe(120000);
    expect(months.filter((m) => m.amount > 0)).toHaveLength(1);
  });

  it("지킨 돈과 예정을 더하면 올해 방어액과 같다", () => {
    const subs = [killedInMay, yearlyMarch, { ...monthly, amount: 9900, sharingCount: 2 }];
    const series = getYearDefendedSeries(subs, YEAR, DEFAULT_EXCHANGE_RATE, NOW);

    expect(series.pastAmount + series.scheduledAmount).toBe(
      sumMyYearDefendedKRW(subs, YEAR).amount,
    );
  });

  it("결제 월을 모르는 연간 구독은 어느 달에도 0으로 넣지 않고 따로 센다", () => {
    const noMonth = { ...yearlyMarch, billingMonth: undefined };
    const series = getYearDefendedSeries([killedInMay, noMonth], YEAR, DEFAULT_EXCHANGE_RATE, NOW);

    expect(series.unknownCount).toBe(1);
    expect(series.months[2].amount).toBe(17000 * 0);
    expect(series.pastAmount).toBe(17000 * 5);
  });

  it("지난해를 보면 모든 달이 이미 지나간 달이다", () => {
    const series = getYearDefendedSeries([killedInMay], 2025, DEFAULT_EXCHANGE_RATE, NOW);

    expect(series.months.every((m) => !m.isFuture)).toBe(true);
    expect(series.scheduledAmount).toBe(0);
  });
});
