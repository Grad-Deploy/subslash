"use client";

import { useMemo } from "react";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { useT } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
import { useStore } from "@lib/store";
import { lastDays } from "@lib/usage/history";
import { subUsage } from "@lib/usage/value";

/**
 * 체험이 끝나 가는 구독의 근거 한 줄. 체험 중에는 체크인하지 않으므로 계속 낼지 정할 근거로 폰 기록을 보여 준다.
 * 잴 수 없으면(권한 없음·앱 없음·기록 없음) 그리지 않는다 — 모르는 것을 '안 썼다'고 말하지 않는다.
 */
export function AppTrialUsageLine({ subscriptionId }: { subscriptionId: string }) {
  const t = useT();
  const rate = useExchangeRate();
  const sub = useStore((state) => state.subscriptions.find((s) => s.id === subscriptionId));
  const { status, history, installed } = usePhoneUsage();
  const usage = useMemo(
    () =>
      sub && status === "on"
        ? subUsage(sub, history, installed, lastDays(new Date(), 30), rate)
        : null,
    [sub, status, history, installed, rate],
  );
  if (usage?.state !== "measured") return null;
  return (
    <p className="text-xs text-muted-foreground leading-relaxed">
      {t.usageApp.trialUsage(formatDurationText(t, usage.totals.usedMs))}
    </p>
  );
}
