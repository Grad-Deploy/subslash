import { describe, expect, it } from "vitest";
import { messages } from "@lib/i18n/messages";

describe("구독 상세·해지 안내 문구", () => {
  it("영어와 한국어가 같은 칸을 갖고, 영어에 한글이 없다", () => {
    const ko = messages.ko.detail;
    const en = messages.en.detail;
    expect(Object.keys(en)).toEqual(Object.keys(ko));
    expect(en.summary.trial("2026.10.20", "D-3")).toBe(
      "On a free trial · ends 2026.10.20 (D-3) · left out of your spending until then",
    );
    expect(en.summary.yearlyOn(3, 14)).toBe("Billed every year on March 14");
    expect(ko.summary.yearlyOn(3, 14)).toBe("매년 3월 14일 결제");
  });

  it("해지 안내는 결제 수단에 따라 문장을 나눈다", () => {
    const { guide, link } = messages.en.detail;
    expect(guide.paymentDirect("Google Play")).toBe("If you paid with Google Play, cancel here.");
    expect(guide.paymentEntry("Google Play")).toContain("not the recurring-payment list");
    expect(link.newWindow(link.paymentManage("Google Play", true))).toBe(
      "Manage recurring payments in Google Play (new window)",
    );
    expect(
      messages.ko.detail.link.newWindow(messages.ko.detail.link.paymentManage("구글 플레이", true)),
    ).toBe("구글 플레이 정기결제 관리 열기 (새 창)");
  });
});
