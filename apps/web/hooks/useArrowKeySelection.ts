"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { isWideScreen } from "@lib/wide-screen";

/**
 * 넓은 화면에서 목록 옆 칸에 하나를 고른 뒤 ↑↓로 이웃 항목으로 넘긴다(내 구독). 아무것도 고르지 않았거나
 * 입력 칸·메뉴·창에 있을 때는 평소처럼 둔다.
 *
 * 화면을 칠하기 전에 다시 단다(useLayoutEffect). useEffect면 뒤로 가기로 옆 칸이 바뀐 것이 보인 뒤에도
 * 잠깐 이전 선택을 들고 있어, 그때 누른 ↓가 한 칸 더 넘어갔다(E2E가 가끔 실패했다).
 *
 * `order`는 지금 보이는 순서의 id들이다. 매 렌더 새 배열이어도 내용이 같으면 다시 달지 않는다.
 */
export function useArrowKeySelection({
  order,
  selectedId,
  onSelect,
}: {
  order: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}): void {
  const orderKey = order.join("|");
  // onSelect는 렌더마다 새로 만들어진다. ref로 들어 키가 바뀔 때만 다시 단다.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useLayoutEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!selectedId || !isWideScreen() || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='menu']"))
        return;
      if (document.querySelector("[role='dialog']")) return;
      const ids = orderKey ? orderKey.split("|") : [];
      if (ids.length === 0) return;
      e.preventDefault();
      const current = ids.indexOf(selectedId);
      const nextIndex =
        current < 0
          ? 0
          : e.key === "ArrowDown"
            ? Math.min(current + 1, ids.length - 1)
            : Math.max(current - 1, 0);
      const next = ids[nextIndex];
      if (next && next !== selectedId) onSelectRef.current(next);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [orderKey, selectedId]);
}
