/**
 * 화면 언어. 기본은 기기(브라우저·폰) 언어를 따르고, 설정에서 고르면 이 기기에 남긴다.
 *
 * 언어는 기기의 것이라 구독 기록 저장소·백업·계정 동기화에 넣지 않는다(화면 모드와 같다). 주소에 언어를
 * 싣지 않는다 — 앱은 화면을 정적으로 담아 경로를 늘릴 수 없고, 남에게 보낸 링크는 받는 사람의 언어로 열린다.
 *
 * 언어를 더할 때는 `LOCALES`와 `LOCALE_INFO`에 넣는다. 그러면 원문이 아닌 언어마다 두는 번역 표
 * (`Translations<T>`: 문구 `messages`, 서비스·요금제 이름, FAQ, 서버 문장 표 등)가 빈칸을 타입 오류로 알린다.
 */

export const LOCALES = ["ko", "en", "zh", "ja", "vi", "fr", "es", "de", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

/** 원문 언어. 문구·서비스 목록·개인정보처리방침은 이 언어로 먼저 쓰고, 다른 언어는 이것을 옮긴다. */
export const SOURCE_LOCALE = "ko" satisfies Locale;

/** 원문이 아닌 언어. */
export type TranslatedLocale = Exclude<Locale, typeof SOURCE_LOCALE>;

/**
 * 원문이 아닌 언어마다 하나씩 두는 번역 표. 원문(한국어)은 코드·데이터에 이미 있으므로 표에 넣지 않는다.
 * `Record<Locale, …>`이 아니라 이 타입으로 두면 언어를 더했을 때 채울 곳이 타입 오류로 드러난다.
 */
export type Translations<T> = Record<TranslatedLocale, T>;

/** 지금 언어의 번역 표. 원문 언어면 null — 원문을 그대로 쓴다. */
export function translationFor<T>(table: Translations<T>, locale: Locale): T | null {
  return locale === SOURCE_LOCALE ? null : table[locale as TranslatedLocale];
}

/**
 * 언어마다 다른 서식. `nativeName`은 화면 언어와 관계없이 그 언어로 적는다(설정의 언어 고르기) — 읽지 못하는
 * 언어로 바꿔 버린 사람도 돌아올 수 있게. `intl`은 날짜·숫자 서식(`toLocaleDateString` 등)에 넘기는 값이다.
 */
export const LOCALE_INFO: Record<
  Locale,
  {
    nativeName: string;
    intl: string;
    listSeparator: string;
    /**
     * 원어민 검토 전의 번역. 언어 고르기에 '베타'라고 적고, 고르면 검토 중이라고 알린다 — 해지 판단의 근거를
     * 보여 주는 앱이라, 검토하지 않은 번역을 다른 언어와 같은 무게로 내놓지 않는다.
     */
    beta?: boolean;
  }
> = {
  ko: { nativeName: "한국어", intl: "ko-KR", listSeparator: "·" },
  en: { nativeName: "English", intl: "en-US", listSeparator: ", " },
  // 기기 언어 태그의 앞말로 고르므로 zh-TW·zh-HK도 간체로 보인다(번체판은 아직 없다).
  zh: { nativeName: "简体中文", intl: "zh-CN", listSeparator: "、", beta: true },
  ja: { nativeName: "日本語", intl: "ja-JP", listSeparator: "、", beta: true },
  vi: { nativeName: "Tiếng Việt", intl: "vi-VN", listSeparator: ", ", beta: true },
  fr: { nativeName: "Français", intl: "fr-FR", listSeparator: ", ", beta: true },
  es: { nativeName: "Español", intl: "es-ES", listSeparator: ", ", beta: true },
  de: { nativeName: "Deutsch", intl: "de-DE", listSeparator: ", ", beta: true },
  // 서식은 사용자가 가장 많은 브라질 포르투갈어로 맞춘다.
  pt: { nativeName: "Português", intl: "pt-BR", listSeparator: ", ", beta: true },
};

/** 날짜·숫자 서식에 넘길 언어 태그. */
export function intlLocale(locale: Locale): string {
  return LOCALE_INFO[locale].intl;
}

/** 사용자가 고른 언어. 없으면 기기 언어를 따른다. */
export const LOCALE_STORAGE_KEY = "subslash-locale";

/** 서버 렌더링·하이드레이션 동안 쓰는 언어. 지금 모든 문구의 원문이 한국어다. */
export const SERVER_LOCALE: Locale = SOURCE_LOCALE;

/**
 * 기기 언어가 지원하는 언어가 아닐 때 보일 언어. 한국어를 읽지 못할 사람에게 원문(한국어)을 보이지 않는다.
 * 기기 언어를 아예 모를 때는 원문이다.
 */
export const FALLBACK_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** 기기 언어 태그("ko-KR", "EN")의 앞말이 지원하는 언어면 그 언어. */
function localeOfTag(tag: string): Locale | null {
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  return isLocale(primary) ? primary : null;
}

/**
 * 고른 언어가 있으면 그것, 없으면 기기가 가장 앞에 둔 언어. 지원하지 않는 언어면 `FALLBACK_LOCALE`이다.
 * 기기 언어를 모르면 원문(한국어)이다.
 */
export function resolveLocale(stored: string | null, languages: readonly string[]): Locale {
  if (isLocale(stored)) return stored;
  const first = languages[0];
  if (!first) return SERVER_LOCALE;
  return localeOfTag(first) ?? FALLBACK_LOCALE;
}

/**
 * Gmail 연결·캘린더 등록·용량 측정의 Apps Script 웹 앱이 아는 화면 언어. 웹 앱 코드(`TEXT`)를 고치면 운영자가
 * 다시 배포해야 하므로 화면 언어와 따로 둔다 — 모르는 언어는 영어로 연다.
 */
export const APPS_SCRIPT_LOCALES = ["ko", "en"] as const satisfies readonly Locale[];
export type AppsScriptLocale = (typeof APPS_SCRIPT_LOCALES)[number];

export function isAppsScriptLocale(value: unknown): value is AppsScriptLocale {
  return typeof value === "string" && (APPS_SCRIPT_LOCALES as readonly string[]).includes(value);
}

export function appsScriptLocale(locale: Locale): AppsScriptLocale {
  return (APPS_SCRIPT_LOCALES as readonly string[]).includes(locale)
    ? (locale as AppsScriptLocale)
    : "en";
}

/**
 * 첫 화면을 그리기 전에 `<html lang>`을 맞추는 스크립트. 화면 낭독기와 글꼴 선택이 lang을 본다.
 * resolveLocale과 같은 규칙이다.
 */
export const localeInitScript = `
(function () {
  try {
    var locales = ${JSON.stringify(LOCALES)};
    var stored = localStorage.getItem("${LOCALE_STORAGE_KEY}");
    var lang = locales.indexOf(stored) >= 0 ? stored : null;
    if (!lang) {
      var first = (navigator.languages && navigator.languages[0]) || navigator.language;
      var primary = first ? first.toLowerCase().split(/[-_]/)[0] : null;
      lang = !first ? "${SERVER_LOCALE}" : locales.indexOf(primary) >= 0 ? primary : "${FALLBACK_LOCALE}";
    }
    document.documentElement.lang = lang;
  } catch (e) {}
})();
`;
