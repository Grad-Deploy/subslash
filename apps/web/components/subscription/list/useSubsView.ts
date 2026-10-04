import { useState } from "react";

export type SubsView = "cards" | "table";

/** 카드/표 중 고른 보기. 이 브라우저의 취향일 뿐이라 백업·동기화에 넣지 않는다. */
const VIEW_KEY = "subslash-subs-view";

/**
 * 내 구독의 보기 방식. 표는 넓은 화면(md 이상)에서만 고를 수 있고 좁은 화면은 늘 카드다.
 *
 * 서버에는 저장소가 없어 카드로 시작한다. 하이드레이션 동안은 화면이 스피너만 그리므로, 브라우저에서
 * 처음부터 저장된 보기로 시작해도 서버 화면과 어긋나지 않는다. 저장소를 쓰지 못하는 곳(사생활 보호
 * 모드 등)에서는 이 탭에서만 기억한다.
 */
export function useSubsView(): [SubsView, (next: SubsView) => void] {
  const [view, setView] = useState<SubsView>(() => {
    if (typeof window === "undefined") return "cards";
    try {
      return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });

  const changeView = (next: SubsView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  return [view, changeView];
}
