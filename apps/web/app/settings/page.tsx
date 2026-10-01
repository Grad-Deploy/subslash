"use client";

import React from "react";
import dynamic from "next/dynamic";
import { IS_APP_BUILD } from "@lib/platform";
import { useIsClient } from "@hooks/useIsClient";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { Spinner } from "../../components/ui/spinner";

// 앱의 설정 탭(폰 사용 기록 칸이 더 있다). 폰 기록 코드가 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppSettingsPage = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/settings/app/AppSettingsPage").then((m) => m.AppSettingsPage),
      { ssr: false },
    )
  : null;

/**
 * 설정(웹·앱). 웹은 상단 바의 설정 아이콘(예전 결제 알림 종 자리)에서, 앱은 하단 설정 탭에서 온다. 구독 기록은
 * 브라우저 저장소에만 있어 서버에서는 그리지 않는다.
 */
export default function SettingsPage() {
  const mounted = useIsClient();
  if (AppSettingsPage) return <AppSettingsPage />;
  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  return <SettingsScreen storageNote="지금 기록은 이 브라우저에만 저장돼요" />;
}
