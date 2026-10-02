"use client";

import React from "react";
import { usePathname } from "next/navigation";

/**
 * 앱이 인앱 브라우저로 여는 웹 화면. 사이트의 헤더·하단 탭·푸터와 Gmail 받기 상자를 그리지 않는다.
 *
 * 앱의 간편 로그인은 인앱 브라우저에서 이 웹 화면으로 끝난다. 예전에는 여기에 사이트 메뉴가 그대로 붙어
 * 있어, 누르면 인앱 브라우저(또는 카카오톡이 돌려보낸 Chrome) 안에서 웹 대시보드로 이어졌다. 그 브라우저가
 * 웹에 로그인돼 있으면 GmailDiscoveryInbox가 찾은 구독을 웹으로 받아 가 앱에는 오지 않을 수도 있었다.
 */
const BRIDGE_PATHS = ["/oauth/done"];

export function isBridgePath(pathname: string | null): boolean {
  return !!pathname && BRIDGE_PATHS.some((path) => pathname.startsWith(path));
}

/** 다리 화면이 아닐 때만 그린다. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return isBridgePath(pathname) ? null : <>{children}</>;
}
