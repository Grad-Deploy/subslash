"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "../../lib/store";

/** Feedback for the redirect targets of the reminder emails' links. */
const NOTIFY_MESSAGES: Record<string, string> = {
  verified: "결제 알림이 켜졌어요. 결제일 전에 메일로 알려 드려요.",
  unsubscribed: "결제 알림을 껐어요. 서버의 구독 사본도 지웠어요.",
  invalid: "만료됐거나 잘못된 링크예요. 알림 설정에서 다시 시도해 주세요.",
  error: "알림을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

/**
 * 결제 알림 메일의 링크가 돌려보낸 `?notify=` 결과를 알려 준다. useSearchParams는 Suspense 안에서만
 * 쓸 수 있어 화면을 그리지 않는 컴포넌트로 뺐다.
 */
export function NotifyResultBanner({ onMessage }: { onMessage: (message: string) => void }) {
  const searchParams = useSearchParams();
  const setNotify = useStore((state) => state.setNotify);
  const clearNotify = useStore((state) => state.clearNotify);
  const notifyResult = searchParams.get("notify");

  useEffect(() => {
    if (!notifyResult) return;

    const message = NOTIFY_MESSAGES[notifyResult];
    if (message) onMessage(message);

    // The link acted on the server; mirror the outcome locally so the header
    // badge and settings modal do not keep showing a stale state.
    if (notifyResult === "verified") setNotify({ verified: true });
    if (notifyResult === "unsubscribed") clearNotify();

    window.history.replaceState(null, "", window.location.pathname);
  }, [notifyResult, onMessage, setNotify, clearNotify]);

  return null;
}
