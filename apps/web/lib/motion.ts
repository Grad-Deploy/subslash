/**
 * 사용자가 기기에서 '움직임 줄이기'를 켰는지. 켰으면 화면을 움직이지 않고 끝 모습을 바로 보여 준다.
 * 브라우저에서만 부른다(effect·이벤트 핸들러 안).
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
