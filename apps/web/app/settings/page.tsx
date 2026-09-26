"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";

// 설정 탭(앱 전용). 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppSettingsPage = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/settings/app/AppSettingsPage").then((m) => m.AppSettingsPage),
      { ssr: false },
    )
  : null;

/**
 * 앱의 설정 탭. 웹에는 이 화면이 없다 — 웹의 설정은 구독 관리 맨 아래와 상단 계정 메뉴에 있으므로, 주소로
 * 들어오면 구독 관리로 보낸다.
 */
export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    if (!AppSettingsPage) router.replace("/subs");
  }, [router]);
  return AppSettingsPage ? <AppSettingsPage /> : null;
}
