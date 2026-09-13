/** 내 구독 목록 옆에 상세 칸을 여는 폭. Tailwind의 `xl`과 같은 값이다. */
export const WIDE_SCREEN_QUERY = "(min-width: 1280px)";

/** 지금 옆 칸이 보이는 폭인가. 서버에서는 늘 false다. */
export function isWideScreen(): boolean {
  return typeof window !== "undefined" && window.matchMedia(WIDE_SCREEN_QUERY).matches;
}
