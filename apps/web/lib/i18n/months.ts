/**
 * 영어 밖의 번역(`messages/*.ts`의 zh·ja·vi·fr·es·de·pt)이 함께 쓰는 달 이름. 영어는 `english.ts`의
 * `monthLong`·`monthShort`를 쓴다. 숫자 인자는 `Number()`로 받는다 — 문구 검사가 함수 문구를 글자 "2"로 불러 본다.
 */
const NAMES = {
  fr: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  es: [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ],
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  pt: [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ],
} as const;

/** 그 언어의 달 이름. 중국어·일본어는 "3月", 베트남어는 "tháng 3"이다. */
export function monthName(locale: "zh" | "ja" | "vi" | keyof typeof NAMES, month: number): string {
  const m = Number(month);
  if (locale === "zh" || locale === "ja") return `${m}月`;
  if (locale === "vi") return `tháng ${m}`;
  return NAMES[locale][m - 1] ?? String(m);
}
