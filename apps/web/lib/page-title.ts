"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * 주소로 탭 제목을 정할 수 없는 화면(없는 주소의 404처럼 주소가 제각각인 것)이 제목을 직접 정하는 길.
 * 탭 제목은 LocaleEffects 한 곳이 맞추고, 여기 정한 제목이 있으면 `pageTitles` 표보다 앞선다.
 */
let override: string | null = null;
const listeners = new Set<() => void>();

function setOverride(next: string | null) {
  if (override === next) return;
  override = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 화면이 정한 탭 제목. 없으면 null. */
export function usePageTitleOverride(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  );
}

/** 이 화면이 떠 있는 동안 탭 제목을 `title`로 둔다. */
export function usePageTitle(title: string) {
  useEffect(() => {
    setOverride(title);
    return () => setOverride(null);
  }, [title]);
}
