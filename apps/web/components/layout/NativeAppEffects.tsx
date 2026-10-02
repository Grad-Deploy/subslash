"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";
import { restoreRecords } from "@lib/mirrored-storage";
import { onReminderTapped } from "@lib/native-reminders";
import { useStore } from "@lib/store";
import { useLocalReminderSync } from "@hooks/useLocalReminders";
import { enterAfterLogin } from "@hooks/useAuth";
import { claimPendingLogin, hasPendingLogin } from "@lib/app-oauth";

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
 * - 인앱 브라우저에서 마친 간편 로그인을 받아 간다(lib/app-oauth). 로그인 버튼이 돌아오는 길을 기다리지만,
 *   그사이 앱이 내려갔거나(다음 실행) 사용자가 Chrome에서 끝내고 직접 앱으로 돌아오면(복귀) 버튼이 받지
 *   못한다.
 */
export function NativeAppEffects() {
  const router = useRouter();

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    void restoreRecords(useStore.persist.getOptions().name ?? "").then((restored) => {
      if (restored) return useStore.persist.rehydrate();
    });
  }, []);

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    let cancelled = false;
    let handle: { remove: () => Promise<void> } | undefined;
    const claim = async () => {
      if (!hasPendingLogin()) return;
      if ((await claimPendingLogin()) !== "ok" || cancelled) return;
      await enterAfterLogin(router);
    };
    void claim();
    void import("@capacitor/app").then(async ({ App }) => {
      const added = await App.addListener("resume", () => void claim());
      if (cancelled) void added.remove();
      else handle = added;
    });
    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, [router]);

  useLocalReminderSync();

  useEffect(() => onReminderTapped((href) => router.push(href)), [router]);

  return AppBackButton ? <AppBackButton /> : null;
}
