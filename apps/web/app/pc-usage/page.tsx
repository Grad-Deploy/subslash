"use client";

import React, { useMemo } from "react";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useT } from "@lib/i18n";
import { parsePcUsageHash } from "@lib/pc-usage";
import { PcUsageReader } from "../../components/pc-usage/PcUsageReader";
import { PcUsageRow } from "../../components/pc-usage/PcUsageRow";
import { Spinner } from "../../components/ui/spinner";

/**
 * PC의 AI 코딩 도구 사용을 체크인으로 받는다.
 *
 * - 링크 없이 열면 'PC 기록 읽기': 사용자가 고른 기록 폴더를 브라우저가 기기 안에서 읽는다(PcUsageReader).
 * - 명령줄 도구(`subslash-usage`)가 만든 링크(`#pc=…`, lib/pc-usage)로 열면 그 숫자를 보여 준다. 링크가
 *   틀렸거나 오래됐으면 이유를 말하고 읽기 화면을 함께 둔다.
 *
 * 어느 쪽이든 숫자를 체크인 창에 채워 보여 주기만 하고, 저장은 사용자가 확인을 눌러야 된다.
 */
export default function PcUsagePage() {
  const mounted = useIsClient();
  const t = useT().pcUsage;
  const subscriptions = useStore((state) => state.subscriptions);
  const parsed = useMemo(() => {
    if (!mounted) return null;
    const hash = window.location.hash;
    return hash.length > 1 ? parsePcUsageHash(hash) : "none";
  }, [mounted]);

  if (!parsed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 py-8">
      <h1 className="text-xl font-black tracking-tight">{t.title}</h1>
      {parsed === "none" ? (
        <PcUsageReader subscriptions={subscriptions} />
      ) : !parsed.ok ? (
        <>
          <div className="space-y-1 rounded-2xl border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-sm font-bold">
              {parsed.reason === "stale" ? t.staleTitle : t.invalidTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {parsed.reason === "stale" ? t.staleBody : t.invalidBody}
            </p>
          </div>
          <PcUsageReader subscriptions={subscriptions} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t.description(parsed.link.windowDays, parsed.link.until)}
          </p>
          <ul className="space-y-2">
            {parsed.link.entries.map((entry) => (
              <PcUsageRow
                key={entry.serviceId}
                serviceId={entry.serviceId}
                days={entry.days}
                apiUsd={entry.apiUsd}
                tokens={entry.tokens}
                subscriptions={subscriptions}
              />
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.pcOnly}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{t.privacy}</p>
        </>
      )}
    </div>
  );
}
