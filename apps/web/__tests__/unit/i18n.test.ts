import { describe, expect, it } from "vitest";
import { isLocale, resolveLocale } from "@lib/i18n/config";
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

  it("한국어가 아닌 다른 언어는 영어로 보인다", () => {
    expect(resolveLocale(null, ["ja-JP"])).toBe("en");
  });

  it("저장값이 틀렸거나 기기 언어를 모르면 원문(한국어)이다", () => {
    expect(resolveLocale("fr", [])).toBe("ko");
    expect(resolveLocale(null, [])).toBe("ko");
    expect(isLocale("fr")).toBe(false);
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
const OPTIONAL_TEXT = new Set(["hint", "perUnit"]);

describe("문구", () => {
  it("영어는 한국어와 같은 칸을 같은 모양으로 갖는다", () => {
    expect(shape(messages.en)).toEqual(shape(messages.ko));
  });

  it("빈 문구가 없다", () => {
    for (const locale of ["ko", "en"] as const) {
      for (const text of render(messages[locale])) expect(text.trim()).not.toBe("");
    }
  });

  it("영어 문구에 한글이 섞이지 않는다", () => {
    // 언어 이름처럼 일부러 두 언어로 적는 칸은 한국어 쪽에만 있다.
    for (const text of render(messages.en)) expect(text).not.toMatch(/[가-힣]/);
  });
});
