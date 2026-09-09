import { describe, it, expect } from "vitest";
import {
  formatSettlementMessage,
  getMyShareAmount,
  getMyMonthlyAmountKRW,
  getOthersShareAmount,
  getSharingCount,
  isShared,
  sumMyAnnualKRW,
  sumMyMonthlyKRW,
} from "@subslash/shared";

const netflix = {
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW" as const,
  billingDay: 15,
  billingCycle: "monthly" as const,
};

describe("공유 구독 분담", () => {
  it("인원을 정하지 않으면 전액을 혼자 부담한다", () => {
    expect(isShared(netflix)).toBe(false);
    expect(getSharingCount(netflix)).toBe(1);
    expect(getMyShareAmount(netflix)).toBe(17000);
  });

  it("인원수만 정하면 균등하게 나눈다", () => {
    const shared = { ...netflix, sharingCount: 4 };

    expect(isShared(shared)).toBe(true);
    expect(getMyShareAmount(shared)).toBe(4250);
    expect(getOthersShareAmount(shared)).toBe(12750);
  });

  it("직접 정한 부담금이 균등 분할보다 우선한다", () => {
    const shared = { ...netflix, sharingCount: 4, myShareAmount: 8000 };

    expect(getMyShareAmount(shared)).toBe(8000);
    expect(getOthersShareAmount(shared)).toBe(9000);
  });

  it("1명 이하나 비정상적인 인원수는 혼자 쓰는 것으로 본다", () => {
    expect(getSharingCount({ amount: 100, sharingCount: 0 })).toBe(1);
    expect(getSharingCount({ amount: 100, sharingCount: -3 })).toBe(1);
    expect(getSharingCount({ amount: 100, sharingCount: Number.NaN })).toBe(1);
  });

  it("합계는 카드 청구액이 아니라 내 부담금을 더한다", () => {
    const subs = [
      { ...netflix, sharingCount: 4 },
      {
        name: "지니뮤직",
        amount: 9000,
        currency: "KRW" as const,
        billingCycle: "monthly" as const,
      },
    ];

    expect(sumMyMonthlyKRW(subs)).toBe(4250 + 9000);
    expect(sumMyAnnualKRW(subs)).toBe((4250 + 9000) * 12);
  });

  it("USD·연간 구독도 분담한 뒤 환산한다", () => {
    const claude = {
      amount: 20,
      currency: "USD" as const,
      billingCycle: "monthly" as const,
      sharingCount: 2,
    };

    expect(getMyMonthlyAmountKRW(claude, 1400)).toBe(14000);
  });

  it("정산 문구가 카드 결제액과 1인당 금액을 함께 말한다", () => {
    const message = formatSettlementMessage({ ...netflix, sharingCount: 4 });

    expect(message).toContain("넷플릭스");
    expect(message).toContain("15일");
    expect(message).toContain("₩17,000");
    expect(message).toContain("4명");
    expect(message).toContain("₩4,250");
  });

  it("내가 더 내기로 한 경우 나머지 인원의 1인당 금액이 줄어든다", () => {
    const message = formatSettlementMessage({ ...netflix, sharingCount: 3, myShareAmount: 9000 });

    // 남은 ₩8,000을 두 명이 나눠 1인 ₩4,000.
    expect(message).toContain("₩4,000");
  });
});
