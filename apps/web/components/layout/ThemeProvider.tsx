"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { syncSystemBars } from "@lib/native";

type Theme = "dark" | "light";
/** 사용자가 고른 화면 모드. "system"은 기기의 라이트/다크 설정을 따른다. */
export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextType {
  /** 지금 화면에 적용된 테마. */
  theme: Theme;
  /** 사용자가 고른 것. 고른 적이 없으면 "system". */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  preference: "system",
  setPreference: () => {},
});

const STORAGE_KEY = "subslash-theme";

/** 이 탭에서 테마를 바꿨다고 알린다. */
const THEME_EVENT = "subslash:theme";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

/**
 * 지금 테마는 <html>의 dark 클래스가 원본이다. 첫 화면을 그리기 전에 layout의
 * themeInitScript가 저장된 값(없으면 시스템 설정)으로 이 클래스를 붙인다. 예전에는 같은 값을
 * effect에서 다시 읽어 상태에 옮겼는데, 렌더링을 한 번 더 일으켰다.
 */
function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * "system"은 저장하지 않고 값을 지워 둔다 — themeInitScript가 저장값이 없을 때 시스템 설정을 따르므로,
 * 첫 화면 스크립트를 따로 고치지 않아도 같은 뜻이 된다. 예전에는 라이트/다크를 오가는 버튼뿐이라, 한 번
 * 누르면 시스템 설정으로 돌아갈 길이 없었다.
 */
function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}

function applyPreference(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    () => "system",
  );

  // 앱에서는 상태 표시줄도 같은 테마로 맞춘다. 웹에서는 아무것도 하지 않는다.
  useEffect(() => {
    syncSystemBars(theme);
  }, [theme]);

  // 시스템 설정을 따르는 동안에는 기기가 라이트/다크를 바꾸면 화면도 따라 바꾼다.
  useEffect(() => {
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPreference("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyPreference(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
