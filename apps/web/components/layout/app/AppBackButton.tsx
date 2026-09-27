"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** 하단 탭의 첫 화면. 여기서 뒤로가기를 누르면 앞 화면으로 돌아가지 않고 종료를 묻는다. */
const TAB_ROOTS = ["/dashboard", "/subs", "/report"];

/** 첫 번째 뒤로가기 뒤 이 시간 안에 한 번 더 누르면 종료한다. */
const EXIT_WINDOW_MS = 2000;

/**
 * 안드로이드 뒤로가기(앱 전용). `@capacitor/app`이 없으면 운영체제가 뒤로가기를 받아 앱 화면을 그냥
 * 닫아 버린다 — 시트를 열어 둔 채로 눌러도, 다른 탭에서 눌러도 앱이 꺼졌다.
 *
 * 누르면 이 순서로 하나만 한다.
 * 1. 열린 창(시트·다이얼로그)이 있으면 닫는다. 앱의 창은 모두 `aria-modal`을 달고 Escape로 닫히므로,
 *    창마다 뒤로가기를 따로 붙이지 않고 Escape를 보낸다.
 * 2. 하단 탭의 첫 화면(대시보드·구독 관리·리포트)이면 '한 번 더 누르면 종료돼요'를 띄우고, 2초 안에 다시
 *    누르면 종료한다. 탭을 오간 기록을 끝없이 거슬러 올라가지 않게 탭 첫 화면에서 멈춘다. 확인 창 대신
 *    두 번 누르기로 한 것은 토스 같은 앱의 익숙한 방식이라서다.
 * 3. 그 밖의 화면(구독 상세 등)은 앞 화면으로 간다. 앞 화면이 없으면(알림을 눌러 바로 연 경우) 대시보드로.
 */
export function AppBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [hintVisible, setHintVisible] = useState(false);
  const pathRef = useRef(pathname);
  const lastPressRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    let remove: (() => Promise<void>) | null = null;
    void import("@capacitor/app")
      .then(async ({ App }) => {
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (document.querySelector('[aria-modal="true"]')) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            return;
          }
          const path = (pathRef.current ?? "/").replace(/\/+$/, "") || "/";
          if (TAB_ROOTS.includes(path) || path === "/") {
            const now = Date.now();
            if (now - lastPressRef.current < EXIT_WINDOW_MS) {
              void App.exitApp();
              return;
            }
            lastPressRef.current = now;
            setHintVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setHintVisible(false), EXIT_WINDOW_MS);
            return;
          }
          if (canGoBack) window.history.back();
          else router.replace("/dashboard");
        });
        if (cancelled) void handle.remove();
        else remove = () => handle.remove();
      })
      .catch((error) => console.error("[native] 뒤로가기를 연결하지 못했습니다", error));
    return () => {
      cancelled = true;
      void remove?.();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [router]);

  if (!hintVisible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4"
    >
      <span className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg animate-in fade-in">
        한 번 더 누르면 앱이 종료돼요
      </span>
    </div>
  );
}
