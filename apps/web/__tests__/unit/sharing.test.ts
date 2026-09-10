import { describe, it, expect } from "vitest";
import {
  formatSettlementMessage,
  getMyShareAmount,
  getMyMonthlyAmountKRW,
  getMyYearDefendedAmountKRW,
  getOthersShareAmount,
  getSharingCount,
  isShared,
  sumMyAnnualKRW,
  sumMyMonthlyKRW,
  sumMyYearDefendedKRW,
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

describe("해지 시점 기준 당해년도 실제 방어액 계산", () => {
  it("월간 구독을 9월에 해지하면 9~12월 4개월치가 올해 방어액으로 계산된다", () => {
    const sub = {
      ...netflix,
      killedAt: "2026-09-10T10:00:00.000Z",
    };
    // 9, 10, 11, 12월 4회 x 17,000 = 68,000
    const defended = getMyYearDefendedAmountKRW(sub, 2026);
    expect(defended).toBe(68000);
  });

  it("전년도에 해지된 구독은 올해 12개월 전체가 방어된 것으로 계산된다", () => {
    const sub = {
      ...netflix,
      killedAt: "2025-11-15T10:00:00.000Z",
    };
    const defended = getMyYearDefendedAmountKRW(sub, 2026);
    expect(defended).toBe(17000 * 12);
  });

  it("미래 연도에 해지 예정인 구독은 당해년도 방어액이 0이다", () => {
    const sub = {
      ...netflix,
      killedAt: "2027-01-01T10:00:00.000Z",
    };
    const defended = getMyYearDefendedAmountKRW(sub, 2026);
    expect(defended).toBe(0);
  });

  it("연간 구독의 결제월이 해지월 이후이면 올해 결제액 전체가 방어된다", () => {
    const yearlySub = {
      name: "어도비 CC",
      amount: 600000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingMonth: 11, // 11월 결제 예정
      killedAt: "2026-08-15T10:00:00.000Z", // 8월에 해지
    };
    const defended = getMyYearDefendedAmountKRW(yearlySub, 2026);
    expect(defended).toBe(600000);
  });

  it("연간 구독의 결제월이 해지월 이전이면 이미 올해 결제되었으므로 올해 방어액은 0이다", () => {
    const yearlySub = {
      name: "어도비 CC",
      amount: 600000,
      currency: "KRW" as const,
      billingCycle: "yearly" as const,
      billingMonth: 3, // 3월 결제 완료
      killedAt: "2026-08-15T10:00:00.000Z", // 8월에 해지
    };
    const defended = getMyYearDefendedAmountKRW(yearlySub, 2026);
    expect(defended).toBe(0);
  });

  it("여러 구독의 올해 방어액 합산을 바르게 계산한다", () => {
    const subs = [
      { ...netflix, killedAt: "2026-09-10T10:00:00.000Z" }, // 4 x 17,000 = 68,000
      {
        name: "유튜브",
        amount: 14900,
        currency: "KRW" as const,
        billingCycle: "monthly" as const,
        killedAt: "2026-10-01T10:00:00.000Z", // 3 x 14,900 = 44,700
      },
    ];
    const total = sumMyYearDefendedKRW(subs, 2026);
    expect(total).toBe(68000 + 44700);
  });
});
