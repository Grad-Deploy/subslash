"use client";

import { useEffect, useState } from "react";

/** 이만큼(px) 줄어야 화상 키보드로 본다. 주소창이 접히거나 시스템 막대가 바뀌는 정도는 이보다 작다. */
const KEYBOARD_MIN_PX = 150;

const NOT_TYPED_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "radio",
  "range",
  "submit",
]);

/** 글자를 치는 칸인지. 체크박스를 눌러도 키보드는 뜨지 않는다. */
export function isTypingTarget(element: Element | null): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLInputElement) return !NOT_TYPED_INPUTS.has(element.type);
  return element instanceof HTMLElement && element.isContentEditable;
}

/** 글자 칸에 있으면서 화면이 키보드만큼 줄었는지. 포커스만 보면 뒤로 가기로 키보드를 내려도 열린 것으로 읽는다. */
export function isSoftKeyboardOpen(
  fullHeight: number,
  currentHeight: number,
  typing: boolean,
): boolean {
  return typing && fullHeight - currentHeight >= KEYBOARD_MIN_PX;
}

/**
 * 화상 키보드가 열렸는지. 화면 아래에 고정한 것(하단 탭·+ 버튼)은 키보드 위로 따라 올라오는데, 브라우저는 그것을
 * 모르고 입력칸을 줄어든 화면의 맨 아래까지만 올려 보여 준다 — 리포트의 질문칸이 하단 탭에 가려 입력한 글자가 보이지 않았다.
 */
export function useSoftKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let fullHeight = viewport.height;
    let width = viewport.width;
    const update = () => {
      // 화면을 돌리면 온전한 높이가 달라지므로 기준을 다시 잡는다.
      if (viewport.width !== width) {
        width = viewport.width;
        fullHeight = viewport.height;
      }
      fullHeight = Math.max(fullHeight, viewport.height);
      setOpen(
        isSoftKeyboardOpen(fullHeight, viewport.height, isTypingTarget(document.activeElement)),
      );
    };
    viewport.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      viewport.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
    };
  }, []);

  return open;
}
