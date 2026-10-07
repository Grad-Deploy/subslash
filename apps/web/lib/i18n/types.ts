/**
 * 한국어 문구(원문)의 모양에서 다른 언어가 채울 모양을 만든다. 글자는 아무 글자나, 문구를 만드는 함수는 같은
 * 인자를 받는 함수여야 한다 — 영어에 빠진 문구가 있으면 타입 검사가 잡는다.
 */
export type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : { [K in keyof T]: Widen<T[K]> };
