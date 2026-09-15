import { useEffect, useRef } from "react";
import { realRecords, useStore } from "../lib/store";
import { SyncTokenRejectedError, pushMirror, toMirrorPayload } from "../lib/notify-client";

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

      // 샘플 체험 중에도 서버에는 실제 기록만 보낸다. 샘플을 보내면 가짜 구독의 결제 알림이 간다.
      const subscriptions = realRecords(state).subscriptions;
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
          // 서버에 이 브라우저의 기록이 없다. 예전에는 콘솔에만 남겨, 알림이 끊긴 뒤에도 화면은
          // '알림 켜짐'이었다. 다시 보내도 통하지 않으니 꺼진 상태로 돌리고 화면이 이유를 알린다.
          if (error instanceof SyncTokenRejectedError) {
            useStore.getState().markNotifyRejected(token);
            return;
          }
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
