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
