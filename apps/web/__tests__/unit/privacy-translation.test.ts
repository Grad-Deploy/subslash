import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { englishDate } from "../../components/privacy/parts";

/**
 * 개인정보처리방침의 한국어판과 영어판이 같은 모양인지. 한쪽에만 항목을 더하면 영어로 읽는 사람이 다른 방침을
 * 읽게 된다 — 절·항목·목록 줄의 수와, 기능 시작일에 따라 보이는 조건이 같아야 한다.
 */
const read = (name: string) =>
  readFileSync(join(__dirname, "../../components/privacy", name), "utf8");
const ko = read("PrivacyKo.tsx");
const en = read("PrivacyEn.tsx");

const count = (src: string, pattern: RegExp) => (src.match(pattern) ?? []).length;
const flags = (src: string) =>
  (src.match(/\{(?:[A-Z_]+_STARTS_ON|storageQuotaWebAppUrl\(\)) &&/g) ?? []).sort();

describe("개인정보처리방침 영어판", () => {
  it("절·항목·목록·표 줄의 수가 한국어판과 같다", () => {
    for (const pattern of [/<Section /g, /<Item\b/g, /<li\b/g, /<tr /g]) {
      expect(count(en, pattern), String(pattern)).toBe(count(ko, pattern));
    }
  });

  it("기능 시작일에 따라 보이는 조건이 한국어판과 같다", () => {
    expect(flags(en)).toEqual(flags(ko));
  });

  it("시행일을 영어 날짜로 적는다", () => {
    expect(englishDate("2026년 10월 1일")).toBe("October 1, 2026");
    expect(englishDate("2026-09-28")).toBe("September 28, 2026");
  });
});
