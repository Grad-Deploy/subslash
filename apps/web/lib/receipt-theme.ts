"use client";

import { readLocal, writeLocal } from "@lib/local-storage";
import { useCallback, useSyncExternalStore } from "react";

/**
 * 영수증 이미지의 디자인. 기기의 취향이라 언어처럼 이 기기에만 둔다 — 구독 기록 저장소·백업·계정 동기화에 넣지
 * 않는다. 저장소를 못 쓰면(사생활 보호 창 등) 이번에 고른 것을 메모리에만 두고, 처음에는 기본으로 그린다.
 */
export const RECEIPT_THEMES = ["classic", "color", "pass", "tag", "chat"] as const;
export type ReceiptTheme = (typeof RECEIPT_THEMES)[number];

const KEY = "subslash-receipt-theme";
const CHANGE_EVENT = "subslash-receipt-theme-change";
let inMemory: ReceiptTheme | null = null;

export function isReceiptTheme(value: unknown): value is ReceiptTheme {
  return typeof value === "string" && (RECEIPT_THEMES as readonly string[]).includes(value);
}

function read(): ReceiptTheme {
  if (inMemory) return inMemory;
  const saved = readLocal(KEY);
  return isReceiptTheme(saved) ? saved : "classic";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 고른 디자인. 서버 렌더링과 하이드레이션은 기본으로 그리고, 그 뒤 기기에 남긴 값으로 다시 그린다. */
export function useReceiptTheme(): [ReceiptTheme, (theme: ReceiptTheme) => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "classic" as const);
  const choose = useCallback((next: ReceiptTheme) => {
    inMemory = next;
    // 남기지 못해도 이번에 고른 것으로 그린다.
    writeLocal(KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return [theme, choose];
}
