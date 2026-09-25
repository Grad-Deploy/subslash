/**
 * 창·시트가 열려 있는 동안 뒤 화면의 스크롤을 막는다.
 *
 * 창마다 "열 때의 overflow 값을 기억했다가 닫을 때 되돌리는" 방식이면, 창이 겹쳐 열리고 닫히는
 * 순서가 엇갈릴 때(계산서 시트 위에 해지 안내 → 확인 창 → 다음 구독 창) 마지막으로 닫힌 창이
 * 'hidden'을 되돌려 놓아 모든 창이 닫힌 뒤에도 화면이 스크롤되지 않았다. 몇 개가 열려 있는지를
 * 세어, 마지막 하나가 닫힐 때만 원래 값으로 돌린다.
 */
let openCount = 0;
let savedOverflow = "";

export function lockBodyScroll(): () => void {
  if (openCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  openCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.style.overflow = savedOverflow;
  };
}
