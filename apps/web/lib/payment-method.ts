import { PAYMENT_METHOD_OPTIONS, type PaymentMethodOption } from "@subslash/shared";
import type { Locale } from "./i18n/config";

type PaymentMethodText = Pick<PaymentMethodOption, "label" | "shortName" | "guide">;

/**
 * 결제 수단 목록(`PAYMENT_METHOD_OPTIONS`)의 영어 화면 문구. 구독에는 `value`만 저장되므로 보여 줄 때 바꾼다.
 * 해지 경로의 메뉴 이름은 각 회사가 영어 화면에서 쓰는 이름을 따른다. 목록에 결제 수단을 더하면 여기도
 * 더한다(테스트가 확인한다).
 */
export const PAYMENT_METHODS_EN: Record<string, PaymentMethodText> = {
  credit_card: { label: "Credit / debit card" },
  kakaopay: {
    label: "KakaoPay auto-pay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > cancel the service",
  },
  naverpay: {
    label: "Naver Pay recurring payment",
    shortName: "Naver Pay",
    guide: "Naver Pay home > My wallet > Recurring payments > cancel the service",
  },
  apple_iap: {
    label: "Apple App Store in-app purchase",
    shortName: "App Store",
    guide:
      "Settings > your name (Apple ID) > Subscriptions > choose the subscription > Cancel Subscription",
  },
  google_play: {
    label: "Google Play subscription",
    shortName: "Google Play",
    guide: "Google Play app or web > Profile > Payments & subscriptions > Subscriptions > Cancel",
  },
  telecom: {
    label: "Carrier bundle / add-on service",
    guide: "Cancel from the add-on services menu of your carrier's app (SKT T world, KT, LG U+)",
  },
  other: { label: "Other payment method" },
};

/** 지금 언어의 결제 수단 목록. 주소·해지 경로 종류 같은 값은 그대로다. */
export function paymentMethodOptions(locale: Locale): PaymentMethodOption[] {
  if (locale !== "en") return PAYMENT_METHOD_OPTIONS;
  return PAYMENT_METHOD_OPTIONS.map((option) => ({
    ...option,
    ...PAYMENT_METHODS_EN[option.value],
  }));
}

/** 구독에 저장된 결제 수단(`value`)의 지금 언어 문구. 모르는 값이면 undefined. */
export function findPaymentMethod(
  value: string | undefined,
  locale: Locale,
): PaymentMethodOption | undefined {
  return paymentMethodOptions(locale).find((option) => option.value === value);
}
