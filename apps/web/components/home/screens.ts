import type { Locale } from "@lib/i18n";

/**
 * 소개 페이지·앱 소개의 앱 화면 캡처(1080×1920, 샘플 데이터). 한국어는 `public/landing/`, 영어는
 * `public/landing/en/`에 있고 화면 언어로 고른다. 다시 찍을 때는 `pnpm --filter @subslash/web landing:screens`
 * (scripts/landing-screens/capture.ts).
 */
export type LandingScreen = "dashboard" | "cancel-guide" | "gmail-import" | "savings";

/**
 * 언어마다 캡처를 둔 폴더. 캡처가 없는 언어는 영어 캡처를 보인다 — 원문(한국어) 화면보다 읽을 수 있는 쪽이다.
 */
const SCREEN_DIRS: Partial<Record<Locale, string>> = { ko: "/landing", en: "/landing/en" };

export function landingScreen(screen: LandingScreen, locale: Locale): string {
  return `${SCREEN_DIRS[locale] ?? SCREEN_DIRS.en}/${screen}.png`;
}
