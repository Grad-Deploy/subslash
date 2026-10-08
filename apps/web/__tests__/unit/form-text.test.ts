import { describe, expect, it } from "vitest";
import { POPULAR_SERVICES, describePresetPrice, parseServiceUrl } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import { describePresetPriceText } from "@lib/i18n/preset-price";
import { translateKnownText } from "@lib/i18n/known-text";

describe("등록 폼 문구", () => {
  it("서비스 목록의 가격 한 마디: 한국어는 shared의 describePresetPrice와 같다", () => {
    for (const preset of POPULAR_SERVICES) {
      expect(describePresetPriceText(messages.ko, preset)).toBe(describePresetPrice(preset));
    }
  });

  it("영어는 주기와 금액을 영어로 쓴다", () => {
    const withPlans = POPULAR_SERVICES.find((p) => p.plans && p.plans.length > 0)!;
    const text = describePresetPriceText(messages.en, withPlans);
    expect(text).toMatch(/^(Monthly|Yearly) [₩$]/);
    expect(text).not.toMatch(/[가-힣]/);
  });

  it("서비스 주소 오류는 영어 표에 있다", () => {
    const { error } = parseServiceUrl("localhost");
    expect(error).toBeTruthy();
    expect(translateKnownText(error!, "en")).toBe("Check the address (e.g. service.com).");
  });
});
