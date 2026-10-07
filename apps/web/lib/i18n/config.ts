/**
 * 화면 언어. 기본은 기기(브라우저·폰) 언어를 따르고, 설정에서 고르면 이 기기에 남긴다.
 *
 * 언어는 기기의 것이라 구독 기록 저장소·백업·계정 동기화에 넣지 않는다(화면 모드와 같다). 주소에 언어를
 * 싣지 않는다 — 앱은 화면을 정적으로 담아 경로를 늘릴 수 없고, 남에게 보낸 링크는 받는 사람의 언어로 열린다.
 */

export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** 사용자가 고른 언어. 없으면 기기 언어를 따른다. */
export const LOCALE_STORAGE_KEY = "subslash-locale";

/** 서버 렌더링·하이드레이션 동안 쓰는 언어. 지금 모든 문구의 원문이 한국어다. */
export const SERVER_LOCALE: Locale = "ko";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * 고른 언어가 있으면 그것, 없으면 기기가 가장 앞에 둔 언어. 한국어가 아니면 영어로 보인다 — 지원하는 다른
 * 언어가 없으므로, 한국어를 읽지 못할 사람에게 한국어를 보이지 않는다. 기기 언어를 모르면 원문(한국어)이다.
 */
export function resolveLocale(stored: string | null, languages: readonly string[]): Locale {
  if (isLocale(stored)) return stored;
  const first = languages[0];
  if (!first) return SERVER_LOCALE;
  return first.toLowerCase().startsWith("ko") ? "ko" : "en";
}

/**
 * 첫 화면을 그리기 전에 `<html lang>`을 맞추는 스크립트. 화면 낭독기와 글꼴 선택이 lang을 본다.
 * resolveLocale과 같은 규칙이다.
 */
export const localeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${LOCALE_STORAGE_KEY}");
    var lang = stored === "ko" || stored === "en" ? stored : null;
    if (!lang) {
      var first = (navigator.languages && navigator.languages[0]) || navigator.language;
      lang = first ? (first.toLowerCase().indexOf("ko") === 0 ? "ko" : "en") : "ko";
    }
    document.documentElement.lang = lang;
  } catch (e) {}
})();
`;
