import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getNextBillingDate,
  getDaysUntilBilling,
  getNextBillingDateFor,
  getDaysUntilBillingFor,
  needsBillingMonth,
  isPaymentImminent,
  formatDday,
  formatCountdown,
} from "@subslash/shared";

describe("Date Utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getNextBillingDate", () => {
    it("기본: billingDay=15, now=Sep 6 -> Sep 15", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      const next = getNextBillingDate(15, now);
      expect(next.getMonth()).toBe(8); // September is 8 (0-indexed)
      expect(next.getDate()).toBe(15);
    });

    it("이미 지남: billingDay=5, now=Sep 6 -> Oct 5", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      const next = getNextBillingDate(5, now);
      expect(next.getMonth()).toBe(9); // October
      expect(next.getDate()).toBe(5);
    });

    it("월말 보정: billingDay=31, now=Sep 6 -> Sep 30 (9월은 30일까지)", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      const next = getNextBillingDate(31, now);
      expect(next.getMonth()).toBe(8);
      expect(next.getDate()).toBe(30);
    });

    it("월말 보정 2월: billingDay=31, now=Feb 15 -> Feb 28 (평년)", () => {
      const now = new Date("2023-02-15T00:00:00Z");
      const next = getNextBillingDate(31, now);
      expect(next.getMonth()).toBe(1); // February
      expect(next.getDate()).toBe(28);
    });

    it("당일: billingDay=6, now=Sep 6 -> Oct 6", () => {
      // Assuming it's already passed for the day or counts as passed
      const now = new Date("2023-09-06T10:00:00Z");
      const next = getNextBillingDate(6, now);
      expect(next.getMonth()).toBe(9);
      expect(next.getDate()).toBe(6);
    });

    it("연말: billingDay=15, now=Dec 20 -> Jan 15 next year (month rollover)", () => {
      const now = new Date("2023-12-20T00:00:00Z");
      const next = getNextBillingDate(15, now);
      expect(next.getFullYear()).toBe(2024);
      expect(next.getMonth()).toBe(0); // January
      expect(next.getDate()).toBe(15);
    });
  });

  describe("getDaysUntilBilling", () => {
    it("billingDay=9, now=Sep 6 -> 3", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      expect(getDaysUntilBilling(9, now)).toBe(3);
    });

    it("billingDay=6, now=Sep 6 -> next month", () => {
      const now = new Date("2023-09-06T10:00:00Z");
      expect(getDaysUntilBilling(6, now)).toBeGreaterThan(25);
    });
  });

  describe("isPaymentImminent", () => {
    it("D-3 with threshold 3: true", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      expect(isPaymentImminent(9, 3, now)).toBe(true);
    });

    it("D-7 with threshold 3: false", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      expect(isPaymentImminent(13, 3, now)).toBe(false);
    });

    it("D-1 with threshold 1: true", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      expect(isPaymentImminent(7, 1, now)).toBe(true);
    });
  });

  describe("formatDday", () => {
    it("0 -> D-Day", () => {
      expect(formatDday(0)).toBe("D-Day");
    });

    it("3 -> D-3", () => {
      expect(formatDday(3)).toBe("D-3");
    });

    it("-2 -> D+2", () => {
      expect(formatDday(-2)).toBe("D+2");
    });
  });

  describe("formatCountdown", () => {
    it("Target 1 day ahead: starts with D-", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      const target = new Date("2023-09-07T00:00:00Z");
      expect(formatCountdown(target, now)).toMatch(/^D-/);
    });

    it("Target in the past: D-Day 00:00:00", () => {
      const now = new Date("2023-09-06T00:00:00Z");
      const target = new Date("2023-09-05T00:00:00Z");
      expect(formatCountdown(target, now)).toBe("D-Day 00:00:00");
    });
  });
});

describe("연간 결제 구독의 다음 결제일", () => {
  const SEP_9 = new Date(2026, 8, 9);

  it("월간 구독은 기존 동작 그대로다", () => {
    const next = getNextBillingDateFor({ billingDay: 15, billingCycle: "monthly" }, SEP_9);

    expect(next).not.toBeNull();
    expect(next!.getMonth()).toBe(8);
    expect(next!.getDate()).toBe(15);
  });

  it("결제 월이 아직 오지 않았으면 올해로 잡는다", () => {
    const next = getNextBillingDateFor(
      { billingDay: 3, billingCycle: "yearly", billingMonth: 11 },
      SEP_9,
    );

    expect(next!.getFullYear()).toBe(2026);
    expect(next!.getMonth()).toBe(10);
    expect(next!.getDate()).toBe(3);
  });

  it("올해 결제 월이 지났으면 내년으로 넘긴다", () => {
    const next = getNextBillingDateFor(
      { billingDay: 3, billingCycle: "yearly", billingMonth: 2 },
      SEP_9,
    );

    expect(next!.getFullYear()).toBe(2027);
    expect(next!.getMonth()).toBe(1);
  });

  it("평년 2월 29일 결제는 28일로 당긴다", () => {
    const next = getNextBillingDateFor(
      { billingDay: 29, billingCycle: "yearly", billingMonth: 2 },
      new Date(2026, 0, 5),
    );

    expect(next!.getMonth()).toBe(1);
    expect(next!.getDate()).toBe(28);
  });

  it("결제 월을 모르는 연간 구독은 날짜를 지어내지 않고 null을 준다", () => {
    expect(getNextBillingDateFor({ billingDay: 15, billingCycle: "yearly" }, SEP_9)).toBeNull();
    expect(getDaysUntilBillingFor({ billingDay: 15, billingCycle: "yearly" }, SEP_9)).toBeNull();
  });

  it("needsBillingMonth가 보완이 필요한 구독만 짚는다", () => {
    expect(needsBillingMonth({ billingDay: 15, billingCycle: "yearly" })).toBe(true);
    expect(needsBillingMonth({ billingDay: 15, billingCycle: "yearly", billingMonth: 6 })).toBe(
      false,
    );
    expect(needsBillingMonth({ billingDay: 15, billingCycle: "monthly" })).toBe(false);
  });

  it("남은 일수를 결제 월 기준으로 센다", () => {
    expect(
      getDaysUntilBillingFor({ billingDay: 12, billingCycle: "yearly", billingMonth: 9 }, SEP_9),
    ).toBe(3);
  });
});
