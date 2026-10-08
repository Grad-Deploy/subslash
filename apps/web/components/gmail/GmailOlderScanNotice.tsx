"use client";

import { useEffect, useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { IS_APP_BUILD } from "@lib/platform";
import {
  GMAIL_OLDER_SCAN_MS,
  isGmailOlderScanPending,
  scheduleGmailDiscoveriesSince,
} from "@lib/gmail-auto-client";
import { Spinner } from "../ui/spinner";
import { useT } from "@lib/i18n";

/**
 * 원클릭으로 막 연결했을 때의 안내. 연결 화면은 최근 40일만 보고 끝나고, 나머지 1년 치(연간 결제)는
 * 웹 앱이 몇 분 동안 이어서 보낸다. 알리지 않으면 3월에 결제한 연간 구독이 왜 없는지 모른다.
 *
 * 진행률은 서버가 모르므로 보여 주지 않는다. 확인이 끝날 시간이 지나면 안내를 거둔다.
 */
export function GmailOlderScanNotice({ createdAt }: { createdAt: string }) {
  const o = useT().importing.older;
  const isClient = useIsClient();
  const [expiredFor, setExpiredFor] = useState<string | null>(null);
  // 탭 저장소를 읽으므로 브라우저에서만 판단한다.
  const pending = isClient && expiredFor !== createdAt && isGmailOlderScanPending(createdAt);

  useEffect(() => {
    if (!pending) return;
    const now = Date.now();
    const hide = window.setTimeout(
      () => setExpiredFor(createdAt),
      Date.parse(createdAt) + GMAIL_OLDER_SCAN_MS - now,
    );
    // 앱은 인앱 브라우저가 닫힐 때 다시 받기를 이미 건다(requestGmailDiscoveriesAfterConnect).
    const stopRefetch = IS_APP_BUILD
      ? () => undefined
      : scheduleGmailDiscoveriesSince(createdAt, now);
    return () => {
      window.clearTimeout(hide);
      stopRefetch();
    };
  }, [pending, createdAt]);

  if (!pending) return null;
  return (
    <div className="flex gap-2.5 rounded-xl bg-secondary px-3 py-2.5 text-xs leading-relaxed">
      <Spinner className="mt-0.5 size-3.5 shrink-0" label={o.spinner} />
      <p>{o.body}</p>
    </div>
  );
}
