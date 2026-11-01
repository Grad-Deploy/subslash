import { describe, expect, it } from "vitest";
import { describeActionReason } from "@lib/i18n/action-reason";
import { describeCheckInText, shortUnitCostText } from "@lib/i18n/check-in-text";
import { messages } from "@lib/i18n/messages";
import { describeCheckIn, shortUnitCost } from "@subslash/shared";

describe("행동 큐 이유 문장", () => {
  it("영어로도 값을 그대로 넣어 만든다", () => {
    const text = describeActionReason(messages.en, {
      type: "amount-changed",
      observedAt: "2026.09.05",
      observed: 13900,
      billed: 17000,
      currency: "KRW",
    });
    expect(text).toContain("₩13,900");
    expect(text).toContain("₩17,000");
    expect(text).toContain("2026.09.05");
  });

  it("해지 확인 날짜는 올해가 아니면 연도를 붙인다", () => {
    const base = { type: "verify-kill", amount: 17000, currency: "KRW" } as const;
    const date = new Date(2025, 11, 5);
    expect(
      describeActionReason(messages.en, { ...base, billingDate: date, sameYear: true }),
    ).toContain("Dec 5,");
    expect(
      describeActionReason(messages.en, { ...base, billingDate: date, sameYear: false }),
    ).toContain("Dec 5, 2025");
    expect(
      describeActionReason(messages.ko, { ...base, billingDate: date, sameYear: false }),
    ).toContain("2025년 12월 5일");
  });

  it("저사용 문구는 소비재를 언어에 맞게 붙인다", () => {
    const reason = {
      type: "low-usage-billing-soon",
      days: 3,
      usageCount: 1,
      amount: 17000,
      currency: "KRW",
      item: "movie",
      count: 1.13,
    } as const;
    expect(describeActionReason(messages.ko, reason)).toContain("영화관 티켓 1.1장 값(₩17,000)");
    expect(describeActionReason(messages.en, reason)).toContain("1.1 movie tickets (₩17,000)");
  });

  it("stakeKRW나 amount가 0 이하일 때는 9개 언어 모두에서 ₩0 문구를 만들지 않는다", () => {
    const zeroReasons = [
      { type: "trial-ending", daysLeft: 2, endsAt: "2026-09-12", stakeKRW: 0 },
      { type: "trial-ending", daysLeft: 2, endsAt: "2026-09-12", stakeKRW: null },
      {
        type: "billing-soon",
        days: 3,
        stakeKRW: 0,
        sinceCheckIn: 20,
        hasCheckIn: true,
      },
      {
        type: "billing-soon-risky",
        days: 3,
        checkIn: { usageCount: 1, costPerUse: 17000 },
        currency: "KRW",
        stakeKRW: 0,
      },
      {
        type: "charged-after-kill",
        chargedAt: "2026.09.05",
        amount: 0,
        currency: "KRW",
      },
    ] as const;

    expect(describeActionReason(messages.ko, zeroReasons[0])).toContain(
      "그대로 두면 유료 결제가 시작됩니다.",
    );
    expect(describeActionReason(messages.ko, zeroReasons[2])).toContain("곧 결제됩니다.");

    for (const locale of Object.keys(messages) as Array<keyof typeof messages>) {
      for (const reason of zeroReasons) {
        expect(describeActionReason(messages[locale], reason)).not.toContain("₩0");
      }
    }
  });
});

describe("describeCheckInText", () => {
  it("한국어는 @subslash/shared의 describeCheckIn과 같은 문장이다", () => {
    const logs = [
      { usageCount: 5, costPerUse: 3400 },
      { metric: "days", usageCount: 8, costPerUse: 2500 },
      { metric: "days", usageCount: 0, costPerUse: 2500 },
      { metric: "hours", usageCount: 15, costPerUse: 500 },
      { metric: "benefit", usageCount: 6000, costPerUse: 1.315 },
      { metric: "storage", usageCount: 40, costPerUse: 110 },
    ] as const;
    for (const log of logs) {
      expect(describeCheckInText(messages.ko, log, "KRW")).toBe(describeCheckIn(log, "KRW"));
    }
  });

  it("영어로 수량과 단가를 잇는다", () => {
    expect(describeCheckInText(messages.en, { usageCount: 5, costPerUse: 3400 }, "KRW")).toBe(
      "5 uses · ₩3,400 per use",
    );
  });

  it("표의 짧은 단가도 한국어는 shortUnitCost와 같고 영어는 단위를 영어로 쓴다", () => {
    const logs = [
      { usageCount: 5, costPerUse: 3400 },
      { metric: "days", usageCount: 8, costPerUse: 2500 },
      { metric: "days", usageCount: 0, costPerUse: 2500 },
      { metric: "hours", usageCount: 15, costPerUse: 500 },
      { metric: "benefit", usageCount: 6000, costPerUse: 1.315 },
      { metric: "storage", usageCount: 40, costPerUse: 110 },
    ] as const;
    for (const log of logs) {
      expect(shortUnitCostText(messages.ko, log, "KRW")).toBe(shortUnitCost(log, "KRW"));
    }
    expect(shortUnitCostText(messages.en, logs[1], "KRW")).toBe("₩2,500/day");
  });
});
