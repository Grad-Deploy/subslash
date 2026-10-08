"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { lastDays } from "@lib/usage/history";
import { useT } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
import { packagesFor } from "@lib/usage/packages";
import { recentOpens, subUsage } from "@lib/usage/value";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";

/**
 * 체크인 막대 아래의 폰 기록 한 줄(안드로이드 앱). 최근 30일 동안 이 폰에서 쓴 횟수를 알려 주고
 * onOpens로 넘겨 막대를 미리 맞추게 한다. 기록을 켜지 않았으면 '폰 사용 기록으로 채우기'를 둔다.
 *
 * 체크인 막대(AppUsageCountPicker)는 웹의 첫 체크인 카드도 쓰므로, 폰 기록 코드는 이 파일로 떼어
 * 앱 빌드에서만 불러온다.
 */
export function AppPhoneHint({
  subscription,
  onOpens,
}: {
  subscription: Subscription;
  onOpens: (opens: number | null) => void;
}) {
  const t = useT();
  const m = t.usageMore;
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [accessOpen, setAccessOpen] = useState(false);
  const recent = useMemo(
    () =>
      status === "on" ? recentOpens(subscription, history, installed, new Date(), rate) : null,
    [status, history, installed, subscription, rate],
  );
  const opens = recent?.totals.opens ?? null;

  useEffect(() => {
    onOpens(opens);
  }, [opens, onOpens]);

  if (recent) {
    return (
      <div className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed">
        {opens === 0 ? (
          <p>
            <b>{m.hint.notOpened}</b>
            {m.hint.notOpenedAfter}
          </p>
        ) : (
          <p>
            {m.hint.usedBefore(m.within(recent.totals.coveredDays))}
            <b>{m.hint.usedOpens(opens ?? 0, formatDurationText(t, recent.totals.ms))}</b>
            {m.hint.usedAfter}
          </p>
        )}
        <p className="text-muted-foreground">{m.tvTabletMissing}</p>
      </div>
    );
  }

  // 켰는데 숫자가 없으면 이유를 말한다. 말없이 줄을 치우면 켠 직후의 사람은 켜진 줄도 모른다.
  if (status === "on" && packagesFor(subscription)) {
    const state = subUsage(subscription, history, installed, lastDays(new Date(), 30), rate).state;
    return (
      <p className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {state === "not-installed" ? m.hint.notInstalledBar : m.hint.building}
      </p>
    );
  }

  if (status !== "off" || !packagesFor(subscription)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAccessOpen(true)}
        className="mt-3 flex w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs"
      >
        <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{m.hint.fill}</span>
          <span className="block text-muted-foreground">{m.hint.fillOpens}</span>
        </span>
      </button>
      <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
    </>
  );
}
