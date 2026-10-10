import { POPULAR_SERVICES, findPresetForSubscription, type ServicePreset } from "@subslash/shared";
import type { Locale } from "./i18n/config";

/**
 * 서비스 목록의 화면 이름. 영어 화면은 브랜드의 영문 표기(`nameEn`)를, 없으면 `nameKo`를 쓴다 — Claude·GitHub
 * Copilot처럼 원래 영문인 것은 `nameKo`가 이미 영문이다.
 */
export function presetName(preset: ServicePreset, locale: Locale = "ko"): string {
  return locale === "en" ? (preset.nameEn ?? preset.nameKo) : preset.nameKo;
}

/** 탭·타일·목록처럼 좁은 자리에 쓰는 서비스 이름. 괄호 속 부연("쿠팡 와우 (쿠팡플레이)")을 뺀다. */
export function shortServiceName(preset: ServicePreset, locale: Locale = "ko"): string {
  return presetName(preset, locale).replace(/\s*\(.*\)$/, "");
}

/**
 * 등록한 구독의 화면 이름. 이름은 사용자 기록이라 바꾸지 않고, 영어 화면에서 서비스 목록의 한국어 이름
 * (`nameKo`) 그대로인 구독만 영문 이름으로 보인다. 한국어 화면은 적힌 그대로다 — 'Netflix'처럼 영문으로 적은
 * 이름을 '넷플릭스'로 바꾸면, 사용자가 적은 이름이 화면에서 사라진다. 사용자가 고쳐 적은 이름도 그대로다.
 */
export function subscriptionName(
  sub: { name: string; cancelUrl?: string },
  locale: Locale = "ko",
): string {
  if (locale !== "en") return sub.name;
  const preset = findPresetForSubscription(sub);
  if (!preset || sub.name.trim() !== preset.nameKo) return sub.name;
  return presetName(preset, locale);
}

/** 서비스 id의 화면 이름(결합 상품의 구성, 통계처럼 id만 아는 자리). 목록에 없는 id는 id 그대로다. */
export function serviceIdName(serviceId: string, locale: Locale = "ko"): string {
  const preset = POPULAR_SERVICES.find((service) => service.id === serviceId);
  return preset ? presetName(preset, locale) : serviceId;
}

/**
 * 서비스 목록 요금제 이름(`ServicePlan.name`)의 영어 화면 이름. 요금제 이름은 등록할 때 구독에 그대로
 * 복사되므로(`planName`) 저장값은 두고 보여 줄 때만 바꾼다. 브랜드가 영문으로 쓰는 이름은 그 표기를 따른다.
 * 서비스 목록에 한글 요금제 이름을 더하면 여기도 더한다(테스트가 확인한다).
 */
export const PLAN_NAMES_EN: Record<string, string> = {
  "광고형 스탠다드": "Standard with ads",
  스탠다드: "Standard",
  프리미엄: "Premium",
  베이직: "Basic",
  "프리미엄 라이트": "Premium Lite",
  "아마존 프라임 멤버십": "Amazon Prime membership",
  "아마존 프라임 멤버십 (연 결제)": "Amazon Prime membership (annual)",
  개인: "Individual",
  학생: "Student",
  듀오: "Duo",
  가족: "Family",
  "가족 (최대 6명)": "Family (up to 6)",
  스트리밍클럽: "Streaming Club",
  "스트리밍 플러스": "Streaming Plus",
  "Hi-Fi 스트리밍클럽": "Hi-Fi Streaming Club",
  "모바일 스트리밍클럽": "Mobile Streaming Club",
  "스탠다드 (추가 결제)": "Standard (extra charge)",
  "프리미엄 (추가 결제)": "Premium (extra charge)",
  "상시 할인가": "Ongoing discount",
  정가: "Regular price",
  기본: "Base price",
  "U+ 멤버십 VIP 쿠폰 적용": "With U+ Membership VIP coupon",
  "80GB (웹 결제)": "80GB (web payment)",
  "180GB (웹 결제)": "180GB (web payment)",
  "330GB (웹 결제)": "330GB (web payment)",
  "2TB (웹 결제)": "2TB (web payment)",
  "80GB (App Store 결제)": "80GB (App Store payment)",
  "180GB (App Store 결제)": "180GB (App Store payment)",
  "330GB (App Store 결제)": "330GB (App Store payment)",
  "2TB (App Store 결제)": "2TB (App Store payment)",
  "80GB (App Store 연 결제)": "80GB (App Store, annual)",
  "180GB (App Store 연 결제)": "180GB (App Store, annual)",
  "웹 결제": "Web payment",
  "구글플레이 결제": "Google Play payment",
  "앱스토어 결제": "App Store payment",
  "베이직 100GB": "Basic 100GB",
  "플러스 (월 결제)": "Plus (monthly)",
  "플러스 (연 결제)": "Plus (annual)",
  "Pro (연 결제)": "Pro (annual)",
  "모든 앱 (Creative Cloud Pro)": "All Apps (Creative Cloud Pro)",
  "포토그래피 (Lightroom + Photoshop)": "Photography (Lightroom + Photoshop)",
  "퍼스널 (월 결제)": "Personal (monthly)",
  "패밀리 (월 결제)": "Family (monthly)",
  "퍼스널 (연 결제)": "Personal (annual)",
  "패밀리 (연 결제)": "Family (annual)",
  전자책: "E-books",
  "종이책 정기구독": "Print book subscription",
  "종이책 정기구독 (연 결제)": "Print book subscription (annual)",
  프로: "Pro",
  "베이직 (연 결제)": "Basic (annual)",
  "베이직 (연 결제·이전 가격)": "Basic (annual, previous price)",
  "프로 (연 결제)": "Pro (annual)",
};

/** 요금제 이름을 지금 언어로. 표에 없는 이름(사용자가 고친 이름·원래 영문인 이름)은 그대로다. */
export function planName(name: string, locale: Locale = "ko"): string {
  if (locale !== "en") return name;
  return PLAN_NAMES_EN[name.trim()] ?? name;
}
