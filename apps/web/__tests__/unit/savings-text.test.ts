import { describe, expect, it } from "vitest";
import { describeSpendingType, getSavingsEquivalent } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import { describeSpendingTypeText, rewardHeadline } from "@lib/i18n/savings-text";

describe("절약 현황 문구", () => {
  it("소비 유형: 한국어는 shared의 describeSpendingType과 같다", () => {
    const focused = { kind: "focused", category: "ott", share: 0.62 } as const;
    const spread = { kind: "spread", categoryCount: 4 } as const;
    expect(describeSpendingTypeText(messages.ko, focused)).toEqual(describeSpendingType(focused));
    expect(describeSpendingTypeText(messages.ko, spread)).toEqual(describeSpendingType(spread));
    expect(describeSpendingTypeText(messages.en, focused)).toEqual({
      title: "OTT-focused",
      detail: "62% of your subscription spending is in OTT.",
    });
  });

  it("보상 한 줄: 한국어는 getSavingsEquivalent와 같고, 못 미치면 빈 글자", () => {
    for (const annual of [0, 4999, 25000, 250000, 600000]) {
      expect(rewardHeadline(messages.ko, annual)).toBe(getSavingsEquivalent(annual)[0] ?? "");
    }
    expect(rewardHeadline(messages.en, 25000)).toBe("1 order of fried chicken");
  });

  it("월 수입 단위와 원화 표기를 언어에 맞게 쓴다", () => {
    const ko = messages.ko.savings.income;
    const en = messages.en.savings.income;
    expect(ko.won(300000)).toBe("30만 원");
    expect(ko.won(1234567)).toBe("123만 4,567원");
    expect(en.won(300000)).toBe("300,000 KRW");
    expect(en.units).toEqual(["10k", "100k", "1M", "10M"]);
  });
});
