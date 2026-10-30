"use client";

import React from "react";
import { useT } from "@lib/i18n";
import { PlayStoreLink } from "../../layout/PlayStoreLink";
import { LevelLegend, UsageBarColumns } from "../../usage/UsageBarColumns";
import type { CheckInBar } from "../valueRows";

/**
 * 리포트의 '구독별 사용량'(웹). 앱은 폰 사용 기록으로 사용 시간을 그리지만(`UsageTimeChart`) 웹에는 그 기록이
 * 없다 — 폰 기록은 기기 밖으로 나가지 않는다. 그래서 웹은 최근 체크인으로 같은 모양의 막대를 그린다. 단위가
 * 구독마다 달라(횟수·쓴 날·시간) 막대 길이는 '잘 씀' 기준에 견준 비율이고, 색은 체크인의 가성비다.
 */
export function CheckInUsageChart({
  bars,
  pending,
  other,
}: {
  bars: CheckInBar[];
  pending: number;
  other: number;
}) {
  const t = useT();
  const c = t.usageChart.checkIn;
  return (
    <section className="space-y-3 rounded-2xl border p-4" aria-labelledby="checkin-chart-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="checkin-chart-heading" className="text-base font-bold">
          {c.title}
        </h2>
        <span className="text-xs text-muted-foreground">{c.basis}</span>
      </div>

      {bars.length === 0 ? (
        <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">{c.empty}</p>
      ) : (
        <>
          <UsageBarColumns
            label={c.title}
            bars={bars.map((bar) => ({
              sub: bar.sub,
              fraction: bar.fraction,
              value: t.usageApp.goal[bar.metric](bar.quantity),
              level: bar.level,
            }))}
          />
          <LevelLegend pending={false} />
        </>
      )}
      <p className="text-xs text-muted-foreground">
        {bars.length > 0 && `${c.legend} `}
        {pending > 0 && bars.length > 0 && `${c.pending(pending)} `}
        {other > 0 && `${c.other(other)} `}
        {c.appHint} <PlayStoreLink />
      </p>
    </section>
  );
}
