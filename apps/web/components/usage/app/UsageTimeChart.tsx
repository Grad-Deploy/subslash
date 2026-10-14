"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Subscription } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { useStore } from "@lib/store";
import { latestFreshLogFor } from "@lib/stats";
import { formatDurationText } from "@lib/i18n/duration";
import { isCurrentMonth, monthDates, type UsageHistory } from "@lib/usage/history";
import { usageChartBars, type ChartMode } from "@lib/usage/chart";
import { rangeDates } from "@lib/usage/value";
import { LevelLegend, UsageBarColumns } from "../UsageBarColumns";
import { SegmentedTabs } from "./parts";

/**
 * 리포트의 '구독별 사용 시간'. 구독마다 세로 막대 하나 — 길이는 이 폰에서 쓴 시간, 색은 가성비, 막대 위는
 * 그 서비스 아이콘이다. 최근 30일과 월별을 고른다. 예전에는 사용 시간을 보려면 구독 상세로 들어가 아래로
 * 내려야 해서, 그런 화면이 있는 줄 모르기 쉬웠다. 막대를 누르면 그 구독의 상세로 간다.
 */
export function UsageTimeChart({
  subs,
  months,
  history,
  installed,
  rate,
  now,
  onOpenDetail,
}: {
  /** 구독 중인 구독 전부. 폰 기록으로 잴 수 없는 것은 막대 없이 센다. */
  subs: Subscription[];
  /** 기록이 하루라도 있는 달(`YYYY-MM`), 이른 순. */
  months: readonly string[];
  history: UsageHistory;
  installed: readonly string[] | null;
  rate: number;
  now: Date;
  onOpenDetail: () => void;
}) {
  const t = useT();
  const c = t.usageChart;
  const usageLogs = useStore((state) => state.usageLogs);
  const [mode, setMode] = useState<ChartMode>("recent");
  const [monthIndex, setMonthIndex] = useState<number | null>(null);
  // 고른 달이 없으면 기록이 있는 가장 최근 달.
  const index = monthIndex ?? months.length - 1;
  const month = mode === "month" ? (months[index] ?? null) : null;

  const { bars, excluded, partial } = useMemo(
    () =>
      month
        ? usageChartBars(
            subs,
            history,
            installed,
            monthDates(month, now),
            rate,
            !isCurrentMonth(month, now),
          )
        : // 최근 30일은 폰 기록으로 아직 평가하지 못한 구독에 최근 체크인의 색을 준다(웹 그래프와 같은 색).
          // 지난 달에는 주지 않는다 — 지금의 체크인은 그 달의 사용이 아니다.
          usageChartBars(
            subs,
            history,
            installed,
            rangeDates("month", now),
            rate,
            false,
            (sub) => latestFreshLogFor(usageLogs, sub, now)?.riskLevel ?? null,
          ),
    [month, subs, history, installed, rate, now, usageLogs],
  );

  const max = Math.max(1, ...bars.map((bar) => bar.usedMs));
  const [year, monthNumber] = month ? month.split("-").map(Number) : [0, 0];

  return (
    <section className="space-y-3 rounded-2xl border p-4" aria-labelledby="usage-chart-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="usage-chart-heading" className="text-base font-bold">
          {c.title}
        </h2>
        <span className="text-xs text-muted-foreground">{t.usageApp.thisPhone}</span>
      </div>

      <SegmentedTabs
        value={mode}
        onChange={setMode}
        label={c.modeLabel}
        options={[
          { value: "recent", label: c.recent },
          { value: "month", label: c.monthly, disabled: months.length === 0 },
        ]}
      />

      {month && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={t.overview.calendar.prevMonth}
            disabled={index <= 0}
            onClick={() => setMonthIndex(index - 1)}
            className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="text-sm font-bold tabular-nums" aria-live="polite">
            {t.overview.calendar.monthLabel(year, monthNumber)}
          </span>
          <button
            type="button"
            aria-label={t.overview.calendar.nextMonth}
            disabled={index >= months.length - 1}
            onClick={() => setMonthIndex(index + 1)}
            className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {bars.length === 0 ? (
        <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">{c.noBars}</p>
      ) : (
        <UsageBarColumns
          label={c.title}
          bars={bars.map((bar) => ({
            sub: bar.sub,
            fraction: bar.usedMs / max,
            value: formatDurationText(t, bar.usedMs),
            level: bar.level,
          }))}
        />
      )}

      <LevelLegend />
      <p className="text-xs text-muted-foreground">
        {c.legend}
        {month && partial && ` ${c.partialMonth}`}
        {excluded.unmeasured > 0 && ` ${c.excluded(excluded.unmeasured)}`}{" "}
        {t.usageApp.report.tvMissing}
        {excluded.unmapped > 0 && t.usageApp.report.unmapped(excluded.unmapped)}
      </p>

      <button
        type="button"
        onClick={onOpenDetail}
        className="w-full rounded-xl border py-2 text-sm font-semibold hover:bg-muted"
      >
        {c.more}
      </button>
    </section>
  );
}
