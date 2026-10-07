"use client";

import { useCallback, useSyncExternalStore } from "react";
import { LOCALE_STORAGE_KEY, SERVER_LOCALE, isLocale, resolveLocale, type Locale } from "./config";

export type { Locale } from "./config";

/** 같은 탭 안에서 값이 바뀐 것을 알린다. storage 이벤트는 다른 탭에만 온다. */
const CHANGE_EVENT = "subslash:locale";

/** 저장소에 쓰지 못한 경우(사생활 보호 모드 등)에도 이 탭에서는 고른 언어를 쓴다. */
let inMemory: Locale | null | undefined;

function readStored(): string | null {
  if (inMemory !== undefined) return inMemory;
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function deviceLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === LOCALE_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  // 고른 언어가 없으면 기기 언어를 따르므로, 기기 언어가 바뀌어도 다시 그린다.
  window.addEventListener("languagechange", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("languagechange", onChange);
  };
}

/** 고른 언어. null이면 기기 언어를 따른다. */
export type LocalePreference = Locale | null;

function readPreference(): LocalePreference {
  const stored = readStored();
  return isLocale(stored) ? stored : null;
}

export function setLocalePreference(preference: LocalePreference) {
  inMemory = preference;
  try {
    if (preference) localStorage.setItem(LOCALE_STORAGE_KEY, preference);
    else localStorage.removeItem(LOCALE_STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 지금 화면 언어. 하이드레이션 동안은 원문(SERVER_LOCALE)이고, 그 뒤 기기의 언어로 다시 그린다. */
export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => resolveLocale(readStored(), deviceLanguages()),
    () => SERVER_LOCALE,
  );
}

/** 설정 화면의 언어 고르기. */
export function useLocalePreference(): [LocalePreference, (value: LocalePreference) => void] {
  const preference = useSyncExternalStore(subscribe, readPreference, () => null);
  const set = useCallback((value: LocalePreference) => setLocalePreference(value), []);
  return [preference, set];
}
