"use client";

import React, { useMemo } from "react";
import { metricForSubscription, type Subscription, type UsageLog } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { describeQuantityText } from "@lib/i18n/check-in-text";
import { checkInMonths } from "@lib/check-in-months";
import { useIsClient } from "@hooks/useIsClient";
import { UsageBarChart, type UsageBar } from "../../usage/app/parts";

/**
 * 구독 상세의 달별 체크인 막대(웹·앱). 앱의 날별·요일별 막대는 폰 사용 기록으로 그리고, 이것은 사용자가
 * 체크인으로 적은 숫자다. 체크인하지 않은 달은 점선(모름)이다.
 */
export function CheckInMonthChart({ sub, logs }: { sub: Subscription; logs: UsageLog[] }) {
  const t = useT();
  const h = t.checkin.history;
  // 이번 달이 어디인지는 기기의 시계로 정한다. 서버 렌더링과 어긋나지 않게 그리고 난 뒤에 그린다.
  const mounted = useIsClient();
  const metric = metricForSubscription(sub);
  const data = useMemo(
    () => (mounted ? checkInMonths(logs, metric, new Date()) : null),
    [mounted, logs, metric],
  );
  if (!data || data.months.every((m) => m.quantity === null)) return null;

  const bars: UsageBar[] = data.months.map((m) => {
    const label = t.usageApp.month(Number(m.month.slice(5)));
    return { key: m.month, label, showLabel: true, value: m.quantity, spoken: label };
  });
  return (
    <section aria-label={h.chartTitle} className="space-y-2 rounded-xl border bg-card p-4">
      <h4 className="text-sm font-bold">{h.chartTitle}</h4>
      <UsageBarChart bars={bars} format={(value) => describeQuantityText(t, metric, value)} />
      <p className="text-[11px] text-muted-foreground">{h.chartGap}</p>
      {data.otherMetric > 0 && (
        <p className="text-[11px] text-muted-foreground">{h.chartOtherMetric(data.otherMetric)}</p>
      )}
    </section>
  );
}
