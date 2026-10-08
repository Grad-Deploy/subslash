/**
 * 영어 문구(`messages/*.ts`의 `en`)가 함께 쓰는 도우미. 예전에는 영역 파일마다 복수형·달 이름을 따로 적어
 * 같은 규칙이 열 곳 넘게 흩어져 있었다.
 *
 * 숫자를 받는 함수는 `Number()`로 바꿔 비교한다 — 문구 검사(`__tests__/unit/i18n.test.ts`)가 함수 문구를 글자
 * "2"로 불러 본다.
 */

/** 단수인지. */
export const one = (n: number) => Number(n) === 1;

/** 수에 맞는 낱말만: pluralOf(2, "day", "days") → "days". */
export const pluralOf = (n: number, singular: string, plural: string) =>
  one(n) ? singular : plural;

/** 수와 낱말: countOf(2, "day") → "2 days". 복수형이 s만 붙는 게 아니면 셋째 인자로 준다. */
export const countOf = (n: number, singular: string, plural = `${singular}s`) =>
  `${n} ${pluralOf(n, singular, plural)}`;

export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** 1~12월의 이름. 범위 밖이면 숫자 그대로. */
export const monthLong = (month: number) => MONTHS_LONG[Number(month) - 1] ?? String(month);
export const monthShort = (month: number) => MONTHS_SHORT[Number(month) - 1] ?? String(month);
