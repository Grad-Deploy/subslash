"use client";

import { useState } from "react";
import type { CliTool } from "@subslash/shared";
import { folderPath, isWindowsUserName, type PcPlatform } from "@lib/pc-usage-reader";

const WINDOWS_USER_KEY = "subslash-pc-usage-windows-user";

function detectPlatform(): PcPlatform {
  if (typeof navigator === "undefined") return "windows";
  if (/Windows/i.test(navigator.userAgent)) return "windows";
  if (/Mac/i.test(navigator.userAgent)) return "mac";
  return "linux";
}

function loadWindowsUser(): string {
  try {
    return localStorage.getItem(WINDOWS_USER_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveWindowsUser(name: string) {
  try {
    if (name) localStorage.setItem(WINDOWS_USER_KEY, name);
    else localStorage.removeItem(WINDOWS_USER_KEY);
  } catch {
    // 저장소를 못 쓰면 이번만 쓴다.
  }
}

/**
 * 이 PC에서 도구마다 기록 폴더가 있는 경로. 윈도우는 사용자 이름을 브라우저가 알 수 없어 사용자가 적고, 이
 * 브라우저에만 기억한다(`placeholder`는 이름을 적기 전에 경로에 보이는 자리 표시).
 *
 * 이 화면은 기기에서 그린 뒤에만 보이므로(페이지가 마운트를 기다린다) 처음 값에서 저장소를 읽어도 된다.
 */
export function usePcFolderPaths(placeholder: string) {
  const [platform] = useState(detectPlatform);
  const [windowsUser, setWindowsUserState] = useState(loadWindowsUser);
  const windows = platform === "windows";
  return {
    windows,
    windowsUser,
    setWindowsUser: (name: string) => {
      setWindowsUserState(name);
      saveWindowsUser(name);
    },
    /** 경로가 다 채워졌는지(윈도우는 사용자 이름을 적어야 한다). */
    pathReady: !windows || isWindowsUserName(windowsUser),
    pathOf: (tool: CliTool) => folderPath(tool, platform, windowsUser || placeholder),
  };
}
