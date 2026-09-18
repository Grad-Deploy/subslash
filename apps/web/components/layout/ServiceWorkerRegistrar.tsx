"use client";

import { useEffect } from "react";
import { IS_APP_BUILD } from "@lib/platform";

/**
 * Registers the service worker that makes the app installable — which is what
 * puts SubSlash in the Android share sheet (see `share_target` in
 * manifest.json).
 *
 * Skipped in development: the worker would sit between every navigation and a
 * dev server that is already reloading itself, for no benefit.
 *
 * 앱(Capacitor)에서도 등록하지 않는다. 화면이 이미 앱 안에 들어 있어 오프라인 안내나 설치가
 * 필요 없고, 앱을 업데이트한 뒤에도 옛 워커가 남아 요청 사이에 끼어들 수 있다.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || IS_APP_BUILD) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      // Installability is a bonus, not a requirement: the app works the same
      // without it, so a failure here is logged and otherwise ignored.
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
