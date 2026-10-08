import { describe, expect, it } from "vitest";
import { buildReceipt, type Subscription } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import {
  describeReceiptLine,
  formatReceiptPeriodText,
  formatReceiptShareText,
  receiptFootnotes,
} from "@lib/receipt-view";

const NOW = new Date(2026, 9, 5, 12);
const SUB: Subscription = {
  id: "a",
  name: "Netflix",
  amount: 17000,
  currency: "KRW",
  billingDay: 10,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: new Date(2026, 0, 1).toISOString(),
};
const SEPTEMBER = { kind: "month", year: 2026, month: 9 } as const;

describe("구독 영수증 문구", () => {
  const receipt = buildReceipt([SUB], [], SEPTEMBER, 1400, NOW);

  it("기간 이름을 언어에 맞게 쓴다", () => {
    expect(formatReceiptPeriodText(messages.ko, SEPTEMBER)).toBe("2026년 9월");
    expect(formatReceiptPeriodText(messages.en, SEPTEMBER)).toBe("September 2026");
    expect(formatReceiptPeriodText(messages.en, { kind: "year", year: 2026 })).toBe("2026");
  });

  it("줄 설명과 바닥 글을 영어로 만든다", () => {
    const line = describeReceiptLine(messages.en, receipt.lines[0], SEPTEMBER);
    expect(line).toContain("Paid 09.10");
    expect(line).toContain("no check-in");
    expect(line).not.toMatch(/[가-힣]/);
    expect(receiptFootnotes(messages.en, receipt)[0]).toContain(
      "It may differ from your card statement",
    );
  });

  it("공유 글은 한국어와 영어가 같은 숫자를 쓴다", () => {
    const ko = formatReceiptShareText(messages.ko, receipt);
    const en = formatReceiptShareText(messages.en, receipt);
    expect(ko.split("\n")[0]).toBe("SubSlash 구독 영수증 · 2026년 9월");
    expect(en.split("\n")[0]).toBe("SubSlash subscription receipt · September 2026");
    expect(ko.match(/₩[\d,]+/g)).toEqual(en.match(/₩[\d,]+/g));
    expect(en).not.toMatch(/[가-힣]/);
  });
});
