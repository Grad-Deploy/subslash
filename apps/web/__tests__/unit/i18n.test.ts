import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  APPS_SCRIPT_LOCALES,
  LOCALES,
  LOCALE_INFO,
  SOURCE_LOCALE,
  appsScriptLocale,
  intlLocale,
  isLocale,
  localeInitScript,
  resolveLocale,
} from "@lib/i18n/config";
import { messages } from "@lib/i18n/messages";

describe("resolveLocale", () => {
  it("고른 언어가 있으면 기기 언어보다 앞선다", () => {
    expect(resolveLocale("en", ["ko-KR"])).toBe("en");
    expect(resolveLocale("ko", ["en-US"])).toBe("ko");
  });

  it("고르지 않았으면 기기가 가장 앞에 둔 언어를 따른다", () => {
    expect(resolveLocale(null, ["ko-KR", "en-US"])).toBe("ko");
    expect(resolveLocale(null, ["KO"])).toBe("ko");
    expect(resolveLocale(null, ["en-US", "ko-KR"])).toBe("en");
  });

  it("지원하지 않는 다른 언어는 영어(FALLBACK_LOCALE)로 보인다", () => {
    expect(resolveLocale(null, ["th-TH"])).toBe("en");
    expect(resolveLocale(null, ["ja-JP"])).toBe("ja");
    expect(resolveLocale(null, ["pt-PT"])).toBe("pt");
  });

  it("저장값이 틀렸거나 기기 언어를 모르면 원문(한국어)이다", () => {
    expect(resolveLocale("xx", [])).toBe("ko");
    expect(resolveLocale(null, [])).toBe("ko");
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("fr")).toBe(true);
  });
});

/** 문구 트리를 '경로 → 종류(글자 또는 함수 인자 수)'로 펼친다. */
function shape(tree: unknown, prefix = ""): Record<string, string> {
  if (typeof tree === "string") return { [prefix]: "string" };
  if (typeof tree === "function") return { [prefix]: `fn/${tree.length}` };
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
    Object.assign(out, shape(value, prefix ? `${prefix}.${key}` : key));
  }
  return out;
}

/**
 * 함수 문구를 아무 값으로 불러 빈 문구가 아닌지 본다. 인자는 글자 "2"로 넘긴다 — 숫자 인자(`n - 1`)와 글자
 * 인자(`label.toLowerCase()`)를 함께 받는 값이다.
 */
function render(tree: unknown, path = ""): string[] {
  if (typeof tree === "string") return [tree];
  if (typeof tree === "function") {
    const args = Array.from({ length: tree.length }, () => "2");
    return [String((tree as (...a: unknown[]) => unknown)(...args))];
  }
  return Object.entries(tree as Record<string, unknown>)
    .filter(([key, value]) => !(value === "" && OPTIONAL_TEXT.has(key)))
    .flatMap(([key, value]) => render(value, path ? path + "." + key : key));
}

/** 없을 수 있는 칸(질문 아래 힌트, 단가 앞말)은 빈 글자로 둔다. */
const OPTIONAL_TEXT = new Set(["hint", "perUnit", "step1Before"]);

const TRANSLATED = LOCALES.filter((locale) => locale !== SOURCE_LOCALE);

describe("문구", () => {
  it.each(TRANSLATED)("%s는 한국어와 같은 칸을 같은 모양으로 갖는다", (locale) => {
    expect(shape(messages[locale])).toEqual(shape(messages[SOURCE_LOCALE]));
  });

  it.each(LOCALES)("%s에 빈 문구가 없다", (locale) => {
    for (const text of render(messages[locale])) expect(text.trim()).not.toBe("");
  });

  it.each(TRANSLATED)("%s 문구에 한글이 섞이지 않는다", (locale) => {
    // 언어 이름처럼 일부러 두 언어로 적는 칸은 한국어 쪽에만 있다.
    for (const text of render(messages[locale])) expect(text).not.toMatch(/[가-힣]/);
  });
});

// 언어를 더할 때 `LOCALES`에만 넣고 지나치기 쉬운 곳. 표 대부분은 `Translations<T>` 타입이 막고, 여기서는
// 타입이 막지 못하는 값(기기 언어 태그·서식)을 본다.
describe("언어 목록", () => {
  it.each(LOCALES)("%s는 기기 언어 태그로 고를 수 있고, 서식이 있다", (locale) => {
    expect(resolveLocale(null, [`${locale.toUpperCase()}-XX`])).toBe(locale);
    expect(() => new Intl.DateTimeFormat(intlLocale(locale))).not.toThrow();
    expect(LOCALE_INFO[locale].nativeName.trim()).not.toBe("");
  });

  it("Apps Script 웹 앱이 모르는 언어는 영어로 연다", () => {
    for (const locale of LOCALES) {
      const lang = appsScriptLocale(locale);
      expect(APPS_SCRIPT_LOCALES).toContain(lang);
      if ((APPS_SCRIPT_LOCALES as readonly string[]).includes(locale)) expect(lang).toBe(locale);
      else expect(lang).toBe("en");
    }
  });
});

describe("첫 화면 스크립트", () => {
  /** 스크립트를 브라우저 대신 돌려 `<html lang>`에 넣은 값을 돌려준다. */
  function runInit(stored: string | null, languages: string[]): string {
    const html = { lang: "" };
    runInNewContext(localeInitScript, {
      localStorage: { getItem: () => stored },
      navigator: { languages, language: languages[0] },
      document: { documentElement: html },
    });
    return html.lang;
  }

  it.each([
    [null, ["ko-KR"]],
    [null, ["en-US", "ko"]],
    [null, ["ja-JP"]],
    [null, []],
    ["en", ["ko-KR"]],
    ["ko", ["en-US"]],
    ["fr", ["ko-KR"]],
  ] as const)("저장값 %s, 기기 %j는 resolveLocale과 같다", (stored, languages) => {
    expect(runInit(stored, [...languages])).toBe(resolveLocale(stored, languages));
  });
});
