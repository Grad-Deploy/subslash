"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";
import { restoreRecords } from "@lib/mirrored-storage";
import { onReminderTapped } from "@lib/native-reminders";
import { subscriptionDetailHref } from "@lib/routes";
import { useStore } from "@lib/store";
import { useLocalReminderSync } from "@hooks/useLocalReminders";

// 안드로이드 뒤로가기. @capacitor/app과 종료 확인 창이 웹 번들에 들어가지 않게 떼어 부른다.
const AppBackButton = IS_APP_BUILD
  ? dynamic(() => import("./app/AppBackButton").then((m) => m.AppBackButton), { ssr: false })
  : null;

/**
 * 앱(Capacitor)에서만 하는 작업. 웹에서는 아무것도 하지 않는다.
 *
 * - 운영체제가 웹뷰 저장소를 비웠으면 기기 저장소의 사본으로 기록을 되살리고 스토어가 다시 읽게
 *   한다(lib/mirrored-storage).
 * - 로컬 결제 알림을 켜 두었으면 구독이 바뀔 때마다 다시 걸고, 알림을 누르면 그 구독을 연다.
 * - 안드로이드 뒤로가기를 앱 안에서 처리한다(AppBackButton).
 */
export function NativeAppEffects() {
  const router = useRouter();

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    void restoreRecords(useStore.persist.getOptions().name ?? "").then((restored) => {
      if (restored) return useStore.persist.rehydrate();
    });
  }, []);

  useLocalReminderSync();

  useEffect(
    () => onReminderTapped((subscriptionId) => router.push(subscriptionDetailHref(subscriptionId))),
    [router],
  );

  return AppBackButton ? <AppBackButton /> : null;
}
