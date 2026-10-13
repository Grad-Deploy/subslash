import { describe, expect, it } from "vitest";
import type { Receipt } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import { receiptArt } from "@lib/receipt-art";
import { isReceiptTheme } from "@lib/receipt-theme";

const t = messages.ko;
const ISSUED = new Date(2026, 9, 13); // 2026-10-13

function receipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    period: { kind: "month", year: 2026, month: 9 },
    isComplete: true,
    lines: [],
    totalKRW: 0,
    billedTotalKRW: 0,
    chargeCount: 0,
    upcomingCount: 0,
    evidencedCount: 0,
    priciestPerUse: null,
    defendedKRW: 0,
    defendedUnknownCount: 0,
    killed: [],
    fx: { historical: 0, current: 0 },
    excluded: { undated: 0, beforeRegistration: 0, trial: 0 },
    ...overrides,
  };
}

describe("영수증 디자인 테마의 내용", () => {
  it("끝난 달의 탑승권 구간은 1일부터 말일까지다", () => {
    const art = receiptArt(t, receipt(), ISSUED);
    expect([art.from, art.to]).toEqual(["09.01", "09.30"]);
    expect(art.number).toBe("2026-09");
    expect(art.issuedDate).toBe("2026.10.13");
  });

  it("끝나지 않은 달은 오늘까지이고, 결제 예정을 넣었으면 그 달 말일까지다", () => {
    const thisMonth = { kind: "month", year: 2026, month: 10 } as const;
    expect(receiptArt(t, receipt({ period: thisMonth, isComplete: false }), ISSUED).to).toBe(
      "10.13",
    );
    expect(
      receiptArt(t, receipt({ period: thisMonth, isComplete: false, upcomingCount: 1 }), ISSUED).to,
    ).toBe("10.31");
  });

  it("연말 결산은 1월 1일부터 12월 31일까지다", () => {
    const art = receiptArt(t, receipt({ period: { kind: "year", year: 2025 } }), ISSUED);
    expect([art.from, art.to]).toEqual(["01.01", "12.31"]);
  });

  it("화면 영수증의 덧붙임(카드 금액·지킨 돈)을 빼지 않는다", () => {
    const art = receiptArt(
      t,
      receipt({ totalKRW: 5000, billedTotalKRW: 20000, defendedKRW: 9900 }),
      ISSUED,
    );
    expect(art.extras).toEqual(["카드에 찍힌 금액 ₩20,000", "해지로 지킨 돈 ₩9,900"]);
    expect(art.empty).toBe("결제된 구독이 없어요");
  });

  it("기기에 남은 디자인 값은 목록에 있는 것만 받는다", () => {
    expect(isReceiptTheme("pass")).toBe(true);
    expect(isReceiptTheme("neon")).toBe(false);
    expect(isReceiptTheme(null)).toBe(false);
  });
});
