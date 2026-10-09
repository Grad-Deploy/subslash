import type { Locale } from "@lib/i18n";

/**
 * 소개 페이지·앱 소개의 앱 화면 캡처(1080×1920, 샘플 데이터). 한국어는 `public/landing/`, 영어는
 * `public/landing/en/`에 있고 화면 언어로 고른다. 다시 찍을 때는 `pnpm --filter @subslash/web landing:screens`
 * (scripts/landing-screens/capture.ts).
 */
export type LandingScreen = "dashboard" | "cancel-guide" | "gmail-import" | "savings";

export function landingScreen(screen: LandingScreen, locale: Locale): string {
  return locale === "en" ? `/landing/en/${screen}.png` : `/landing/${screen}.png`;
}
