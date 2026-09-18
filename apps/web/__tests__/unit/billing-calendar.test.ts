import { describe, it, expect } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  billingDayInMonth,
  buildBillingMonth,
  dayTotalKRW,
  nextBillingDayInMonth,
} from "../../lib/billing-calendar";

/**
 * 대시보드 결제 캘린더가 어느 날에 무엇을 찍는지.
 *
 * 가장 중요한 것은 찍지 않는 것이다 — 결제 월을 모르는 연간 구독은 어느 날에도 찍지 않고 몇
 * 건인지만 센다.
 */

const RATE = 1400;

function sub(over: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 25,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  } as Subscription;
}

describe("billingDayInMonth", () => {
  it("월간 구독은 모든 달에 같은 날 청구된다", () => {
    expect(billingDayInMonth(sub({ billingDay: 25 }), 2026, 8)).toBe(25);
    expect(billingDayInMonth(sub({ billingDay: 25 }), 2026, 9)).toBe(25);
  });

  it("결제일이 1일인 구독도 그 달에 찍힌다", () => {
    // 그 달 1일을 기준으로 '다음 결제일'을 구하면 다음 달 1일로 밀려 어느 달에도 안 찍힌다.
    expect(billingDayInMonth(sub({ billingDay: 1 }), 2026, 8)).toBe(1);
  });

  it("그 달에 없는 날짜는 말일로 당긴다 — 캘린더 피드의 RRULE과 같은 규칙", () => {
    expect(billingDayInMonth(sub({ billingDay: 31 }), 2026, 1)).toBe(28); // 2026년 2월
    expect(billingDayInMonth(sub({ billingDay: 31 }), 2028, 1)).toBe(29); // 2028년 윤년
    expect(billingDayInMonth(sub({ billingDay: 31 }), 2026, 3)).toBe(30); // 4월
  });

  it("연간 구독은 결제 월에만 찍힌다", () => {
    const yearly = sub({ billingCycle: "yearly", billingMonth: 3, billingDay: 2 });
    expect(billingDayInMonth(yearly, 2027, 2)).toBe(2); // 3월
    expect(billingDayInMonth(yearly, 2027, 3)).toBeNull(); // 4월
  });

  it("결제 월을 모르는 연간 구독은 어느 달에도 찍지 않는다", () => {
    const undated = sub({ billingCycle: "yearly", billingMonth: undefined });
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      expect(billingDayInMonth(undated, 2026, monthIndex)).toBeNull();
    }
  });
});

describe("buildBillingMonth", () => {
  it("같은 날 결제를 모으고, 건수와 합계를 센다", () => {
    const month = buildBillingMonth(
      [
        sub({ id: "a", name: "넷플릭스", billingDay: 25, amount: 17000 }),
        sub({ id: "b", name: "티빙", billingDay: 25, amount: 13900 }),
        sub({ id: "c", name: "스포티파이", billingDay: 10, amount: 10, currency: "USD" }),
      ],
      2026,
      8,
      RATE,
    );

    expect([...month.days.keys()].sort((x, y) => x - y)).toEqual([10, 25]);
    expect(month.days.get(25)?.map((s) => s.name)).toEqual(["넷플릭스", "티빙"]);
    expect(month.billingCount).toBe(3);
    expect(month.totalKRW).toBe(17000 + 13900 + 10 * RATE);
    expect(month.undatedCount).toBe(0);
  });

  it("체험 중인 구독은 찍지 않는다 — 그 달에 청구되지 않는다", () => {
    // 2026년 9월을 볼 때, 체험이 10월에 끝나면 9월에는 나갈 돈이 없다.
    const month = buildBillingMonth([sub({ trialEndsAt: "2026-10-05" })], 2026, 8, RATE);
    expect(month.days.size).toBe(0);
    expect(month.totalKRW).toBe(0);
  });

  it("체험이 끝난 달부터는 보통 구독처럼 찍는다", () => {
    const month = buildBillingMonth([sub({ trialEndsAt: "2026-10-05" })], 2026, 10, RATE);
    expect([...month.days.keys()]).toEqual([25]);
  });

  it("해지한 구독은 청구되지 않으므로 찍지 않는다", () => {
    const month = buildBillingMonth([sub({ status: "killed" })], 2026, 8, RATE);
    expect(month.days.size).toBe(0);
    expect(month.billingCount).toBe(0);
  });

  it("결제 월을 모르는 연간 구독은 찍지 않고 따로 센다", () => {
    const month = buildBillingMonth(
      [sub({ id: "a" }), sub({ id: "b", billingCycle: "yearly", billingMonth: undefined })],
      2026,
      8,
      RATE,
    );

    expect(month.billingCount).toBe(1);
    expect(month.undatedCount).toBe(1);
    // 합계에도 들어가지 않는다 — 이 달에 나간다고 말할 수 없다.
    expect(month.totalKRW).toBe(17000);
  });

  it("세금이 따로 붙는 구독은 카드에 찍히는 금액으로 센다", () => {
    const month = buildBillingMonth(
      [sub({ amount: 9.99, currency: "USD", taxRate: 10 })],
      2026,
      8,
      RATE,
    );
    expect(month.totalKRW).toBe(Math.round(10.99 * RATE));
  });

  it("사용자 환율로 환산한다 — 헬퍼 기본값(1,350)에 기대지 않는다", () => {
    const usd = [sub({ amount: 10, currency: "USD" })];
    expect(buildBillingMonth(usd, 2026, 8, 1400).totalKRW).toBe(14000);
    expect(buildBillingMonth(usd, 2026, 8, 1500).totalKRW).toBe(15000);
  });
});

describe("nextBillingDayInMonth", () => {
  const month = buildBillingMonth(
    [sub({ id: "a", billingDay: 5 }), sub({ id: "b", billingDay: 25 })],
    2026,
    8,
    RATE,
  );

  it("오늘 이후 가장 가까운 결제일을 고른다", () => {
    expect(nextBillingDayInMonth(month, 1)).toBe(5);
    expect(nextBillingDayInMonth(month, 18)).toBe(25);
  });

  it("오늘이 결제일이면 오늘을 고른다", () => {
    expect(nextBillingDayInMonth(month, 5)).toBe(5);
  });

  it("남은 결제가 없으면 아무 날도 고르지 않는다", () => {
    expect(nextBillingDayInMonth(month, 26)).toBeNull();
  });
});

describe("dayTotalKRW", () => {
  it("통화가 섞인 하루의 합을 원으로 낸다", () => {
    expect(dayTotalKRW([sub({ amount: 17000 }), sub({ amount: 10, currency: "USD" })], RATE)).toBe(
      17000 + 10 * RATE,
    );
  });
});
