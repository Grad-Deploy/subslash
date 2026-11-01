"use client";

import { useEffect, useRef } from "react";

/**
 * `active`인 동안 Esc를 누르면 `onEscape`를 부른다. 창·시트·작은 카드가 같은 효과를 따로 들고 있던 것을 모았다.
 *
 * 함수는 ref로 들고 있다 — 렌더마다 새로 만든 함수를 넘겨도 리스너를 다시 걸지 않는다.
 */
export function useEscapeKey(active: boolean, onEscape: (() => void) | undefined): void {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
