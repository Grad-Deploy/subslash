"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that makes the app installable — which is what
 * puts SubSlash in the Android share sheet (see `share_target` in
 * manifest.json).
 *
 * Skipped in development: the worker would sit between every navigation and a
 * dev server that is already reloading itself, for no benefit.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      // Installability is a bonus, not a requirement: the app works the same
      // without it, so a failure here is logged and otherwise ignored.
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
