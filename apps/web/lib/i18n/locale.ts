"use client";

import { localChannel, readLocal, removeLocal, writeLocal } from "@lib/local-storage";
import { useCallback, useSyncExternalStore } from "react";
import { LOCALE_STORAGE_KEY, SERVER_LOCALE, isLocale, resolveLocale, type Locale } from "./config";

export type { Locale } from "./config";

const channel = localChannel("subslash:locale", LOCALE_STORAGE_KEY);

/** 저장소에 쓰지 못한 경우(사생활 보호 모드 등)에도 이 탭에서는 고른 언어를 쓴다. */
let inMemory: Locale | null | undefined;

function readStored(): string | null {
  if (inMemory !== undefined) return inMemory;
  return readLocal(LOCALE_STORAGE_KEY);
}

function deviceLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

function subscribe(onChange: () => void) {
  const stopLocal = channel.subscribe(onChange);
  // 고른 언어가 없으면 기기 언어를 따르므로, 기기 언어가 바뀌어도 다시 그린다.
  window.addEventListener("languagechange", onChange);
  return () => {
    stopLocal();
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
  if (preference) writeLocal(LOCALE_STORAGE_KEY, preference);
  else removeLocal(LOCALE_STORAGE_KEY);
  channel.notify();
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
