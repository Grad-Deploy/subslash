import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { pushMirror, toMirrorPayload } from "../lib/notify-client";

const DEBOUNCE_MS = 1500;

/**
 * Keeps the server mirror in step with localStorage while reminders are on.
 *
 * This subscribes to the store imperatively rather than through a selector on
 * purpose: the hook lives in the header, which sits in the root layout, and
 * uploading is a pure side effect. Selecting `subscriptions` here would re-render
 * the whole layout on every subscription change for no visual benefit.
 *
 * Sync is one-way by design: the server never writes back.
 */
export function useMirrorSync() {
  const lastPayload = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const evaluate = (state: ReturnType<typeof useStore.getState>) => {
      const token = state.notify.syncToken;
      if (!token) {
        lastPayload.current = null;
        return;
      }

      const subscriptions = state.subscriptions;
      const payload = JSON.stringify(toMirrorPayload(subscriptions));
      if (payload === lastPayload.current) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          const result = await pushMirror(token, subscriptions);
          // Recorded before setNotify so the resulting store update is a no-op
          // when it comes back through this same listener.
          lastPayload.current = payload;
          useStore.getState().setNotify({
            verified: result.verified,
            lastSyncedAt: new Date().toISOString(),
          });
        } catch (error) {
          // Left for the next change to retry; a reminder is not time-critical
          // enough to justify a backoff loop here.
          console.error("Mirror sync failed:", error);
        }
      }, DEBOUNCE_MS);
    };

    evaluate(useStore.getState());
    const unsubscribe = useStore.subscribe(evaluate);

    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
