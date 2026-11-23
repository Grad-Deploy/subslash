"use client";

import React, { useState } from "react";
import {
  metricOfLog,
  metricsForSubscription,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { useServiceNames, useT } from "@lib/i18n";
import { ownerScopedKey } from "@lib/owner-scoped";
import { Button } from "../ui/button";

const DISMISSED_KEY = "subslash-ott-hours-notice";

/**
 * OTT를 연 횟수에서 본 시간으로 바꾼 뒤, 예전 횟수 체크인만 남은 OTT 구독. 그 체크인은 지금 기준(시간)으로 읽지 않아
 * '체크인 전'이 되므로, 왜 그런지 알리고 다시 체크인하게 한다. 시간으로 체크인하면 그 구독은 빠진다.
 */
export function staleOttCheckIns(active: Subscription[], usageLogs: UsageLog[]): Subscription[] {
  return active.filter((sub) => {
    if (sub.category !== "ott") return false;
    const accepted = metricsForSubscription(sub);
    if (accepted.includes("uses")) return false;
    const logs = usageLogs.filter((log) => log.subscriptionId === sub.id);
    return (
      logs.some((log) => metricOfLog(log) === "uses") &&
      !logs.some((log) => accepted.includes(metricOfLog(log)))
    );
  });
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(ownerScopedKey(DISMISSED_KEY)) === "1";
  } catch {
    return false;
  }
}

/** 대시보드 위의 안내. '확인'을 누르면 이 기기(기록 주인)에서 다시 띄우지 않는다. */
export function MetricChangeNotice({
  active,
  usageLogs,
  onCheckIn,
}: {
  active: Subscription[];
  usageLogs: UsageLog[];
  onCheckIn: (subscriptionId: string) => void;
}) {
  const t = useT().dashboard.metricChange;
  const names = useServiceNames();
  const [dismissed, setDismissed] = useState(readDismissed);
  const stale = staleOttCheckIns(active, usageLogs);
  if (dismissed || stale.length === 0) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(ownerScopedKey(DISMISSED_KEY), "1");
    } catch {
      // 저장하지 못해도 이번 화면에서는 닫는다.
    }
  };
  return (
    <section
      aria-label={t.title}
      className="space-y-2 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm"
    >
      <p className="font-bold">{t.title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{t.body}</p>
      <div className="flex flex-wrap gap-2">
        {stale.map((sub) => (
          <Button key={sub.id} size="sm" variant="outline" onClick={() => onCheckIn(sub.id)}>
            {t.checkIn(names.sub(sub))}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t.dismiss}
        </Button>
      </div>
    </section>
  );
}
