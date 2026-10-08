"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { lastDays } from "@lib/usage/history";
import { useLocale, useT } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
import { packageBreakdown, packagesFor } from "@lib/usage/packages";
import { subUsage } from "@lib/usage/value";
import { measuredQuantity } from "@lib/usage/auto-checkin";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";

/**
 * 쓴 날·시간으로 재는 구독의 체크인 칸 아래 폰 기록 한 줄(안드로이드 앱). 리포트의 '구독 사용 현황'과
 * 같은 계산(최근 30일, 앱별로 max(앞에 있던 시간, 재생 알림 시간))으로 잰 값을 onMeasured로 넘겨 칸을
 * 미리 채우게 한다. 저장은 사용자가 누를 때만 한다 — TV·PC에서 본 것은 폰 기록에 없다.
 *
 * 횟수 구독의 AppPhoneHint와 같은 자리다. 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
 */
export function AppPhoneMetricHint({
  subscription,
  metric,
  onMeasured,
}: {
  subscription: Subscription;
  metric: "days" | "hours";
  onMeasured: (quantity: number | null) => void;
}) {
  const t = useT();
  const m = t.usageMore;
  const locale = useLocale();
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [accessOpen, setAccessOpen] = useState(false);
  const packages = packagesFor(subscription);

  const usage = useMemo(
    () =>
      status === "on" && packages
        ? subUsage(subscription, history, installed, lastDays(new Date(), 30), rate)
        : null,
    [status, packages, subscription, history, installed, rate],
  );
  const measured = usage?.state === "measured" ? usage : null;
  const quantity = measured ? measuredQuantity(metric, measured.totals) : null;

  useEffect(() => {
    onMeasured(quantity);
  }, [quantity, onMeasured]);

  if (!packages || status === "loading" || status === "unsupported") return null;

  if (status === "off") {
    return (
      <>
        <button
          type="button"
          onClick={() => setAccessOpen(true)}
          className="flex w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs"
        >
          <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{m.hint.fill}</span>
            <span className="block text-muted-foreground">
              {metric === "days" ? m.hint.fillDays : m.hint.fillHours}
            </span>
          </span>
        </button>
        <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
      </>
    );
  }

  if (!measured) {
    return (
      <p className="rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {usage?.state === "not-installed" ? m.hint.notInstalledInput : m.hint.building}
      </p>
    );
  }

  const { totals } = measured;
  const covered = Math.min(30, totals.coveredDays);
  const breakdown = packageBreakdown(packages, totals.byPackage, locale);
  return (
    <div className="space-y-1 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed">
      <p>
        {m.hint.usedBefore(m.within(covered))}
        <b>
          {metric === "days"
            ? m.hint.usedDays(totals.activeDays, formatDurationText(t, totals.usedMs))
            : formatDurationText(t, totals.usedMs)}
        </b>
        {m.hint.usedAfterPlain}
        {quantity && quantity > 0 ? m.hint.fitted : metric === "hours" ? m.hint.underHour : ""}
      </p>
      {breakdown.length > 0 && (
        <p className="text-muted-foreground">
          {breakdown.map((row) => `${row.label} ${formatDurationText(t, row.usedMs)}`).join(" · ")}
        </p>
      )}
      <p className="text-muted-foreground">
        {totals.listenMs === null && metric === "hours" ? m.hint.listenMissing : ""}
        {m.tvTabletMissing}
      </p>
    </div>
  );
}
