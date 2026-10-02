"use client";

import { useEffect, useRef } from "react";
import { lockBodyScroll } from "@lib/scroll-lock";

/**
 * 창·시트가 열려 있는 동안 Esc로 닫고 뒤 화면의 스크롤을 막는다. 공용 Dialog와 앱의 시트들이 같은 효과를
 * 따로 들고 있던 것을 모았다.
 *
 * 닫기 함수는 ref로 들고 있다 — 렌더마다 새로 만든 함수를 넘겨도 잠금을 풀었다 다시 걸지 않는다(그래서
 * 앱의 불러오기 창은 의존성 경고를 끄고 있었다).
 */
export function useOverlayLock(open: boolean, onClose: (() => void) | undefined): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKeyDown);
    const unlockScroll = lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open]);
}
