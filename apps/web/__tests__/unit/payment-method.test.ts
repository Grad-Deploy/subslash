import { describe, expect, it } from "vitest";
import { PAYMENT_METHOD_OPTIONS } from "@subslash/shared";
import { PAYMENT_METHODS_EN, findPaymentMethod, paymentMethodOptions } from "@lib/payment-method";
import { LOCALES } from "@lib/i18n/config";

const HANGUL = /[가-힣]/;

describe("결제 수단의 영어 화면 문구", () => {
  it("목록의 결제 수단은 모두 영어가 있고, 영어 화면에 한글이 남지 않는다", () => {
    for (const option of PAYMENT_METHOD_OPTIONS) {
      expect(PAYMENT_METHODS_EN[option.value], option.value).toBeDefined();
    }
    for (const option of paymentMethodOptions("en")) {
      expect(option.label, option.value).not.toMatch(HANGUL);
      expect(option.shortName ?? "", option.value).not.toMatch(HANGUL);
      expect(option.guide ?? "", option.value).not.toMatch(HANGUL);
    }
  });

  it("영어에 해지 경로가 있으면 한국어에도 있다(문구만 바뀌고 갈래는 같다)", () => {
    for (const option of PAYMENT_METHOD_OPTIONS) {
      expect(Boolean(PAYMENT_METHODS_EN[option.value].guide), option.value).toBe(
        Boolean(option.guide),
      );
      expect(Boolean(PAYMENT_METHODS_EN[option.value].shortName), option.value).toBe(
        Boolean(option.shortName),
      );
    }
  });

  it("주소와 해지 경로 종류는 언어와 상관없이 같다", () => {
    const ko = findPaymentMethod("google_play", "ko")!;
    const en = findPaymentMethod("google_play", "en")!;
    expect(en.directCancelUrl).toBe(ko.directCancelUrl);
    expect(en.directCancelUrlKind).toBe(ko.directCancelUrlKind);
    expect(ko.label).toBe("Google Play 정기결제");
    expect(en.label).toBe("Google Play subscription");
    expect(findPaymentMethod("unknown", "en")).toBeUndefined();
  });
});

describe("결제 수단의 모든 번역", () => {
  it("언어마다 모든 결제 수단이 있고 한글이 남지 않으며, 해지 경로 갈래가 같다", () => {
    for (const locale of LOCALES.filter((l) => l !== "ko")) {
      const options = paymentMethodOptions(locale);
      expect(
        options.map((o) => o.value),
        locale,
      ).toEqual(PAYMENT_METHOD_OPTIONS.map((o) => o.value));
      for (const option of options) {
        const ko = PAYMENT_METHOD_OPTIONS.find((o) => o.value === option.value)!;
        expect(
          `${option.label} ${option.shortName ?? ""} ${option.guide ?? ""}`,
          `${locale} ${option.value}`,
        ).not.toMatch(HANGUL);
        expect(Boolean(option.guide), `${locale} ${option.value}`).toBe(Boolean(ko.guide));
      }
    }
  });
});
