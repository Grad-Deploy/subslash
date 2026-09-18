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

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");

  // 앱에서는 상태 표시줄도 같은 테마로 맞춘다. 웹에서는 아무것도 하지 않는다.
  useEffect(() => {
    syncSystemBars(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = readTheme() === "light" ? "dark" : "light";
    try {
      localStorage.setItem("subslash-theme", next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
