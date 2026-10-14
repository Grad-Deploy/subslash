"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useServiceNames, useT } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
import type { UsageHistory } from "@lib/usage/history";
import {
  chartMonths,
  monthDates,
  usageChartBars,
  type ChartBar,
  type ChartMode,
} from "@lib/usage/chart";
import { LEVEL_STYLE, rangeDates } from "@lib/usage/value";
import { SubLogo } from "./parts";

/**
 * 막대가 들어가는 높이(px). 가장 오래 쓴 구독이 이 높이이고 나머지는 그 비율이라, 시간이 길어도 칸을 넘지
 * 않는다.
 */
const BAR_AREA = 112;
/** 평가 전 막대 색. 가성비 색(빨강·노랑·초록)과 겹치지 않게 회색으로 둔다. */
const PENDING_BAR = "bg-muted-foreground/35";

/**
 * 리포트의 '구독별 사용 시간'. 구독마다 세로 막대 하나 — 길이는 이 폰에서 쓴 시간, 색은 가성비, 막대 위는
 * 그 서비스 아이콘이다. 최근 30일과 월별을 고른다. 예전에는 사용 시간을 보려면 구독 상세로 들어가 아래로
 * 내려야 해서, 그런 화면이 있는 줄 모르기 쉬웠다. 막대를 누르면 그 구독의 상세로 간다.
 */
export function UsageTimeChart({
  subs,
  history,
  installed,
  rate,
  now,
  unmappedCount,
  onOpenDetail,
}: {
  subs: Subscription[];
  history: UsageHistory;
  installed: readonly string[] | null;
  rate: number;
  now: Date;
  /** 폰 기록으로 잴 방법이 없는 구독(멤버십·PC에서 쓰는 구독) 수. 막대 없이 빠진 것을 말해 준다. */
  unmappedCount: number;
  onOpenDetail: () => void;
}) {
  const t = useT();
  const c = t.usageChart;
  const names = useServiceNames();
  const [mode, setMode] = useState<ChartMode>("recent");
  const months = useMemo(() => chartMonths(history, subs, now), [history, subs, now]);
  const [monthIndex, setMonthIndex] = useState<number | null>(null);
  // 고른 달이 없으면 기록이 있는 가장 최근 달.
  const index = monthIndex ?? months.length - 1;
  const month = months[index] ?? null;

  const { bars, excluded, partial } = useMemo(() => {
    if (mode === "month" && month) {
      const dates = monthDates(month, now);
      const [y, m] = month.split("-").map(Number);
      const complete = !(y === now.getFullYear() && m === now.getMonth() + 1);
      return usageChartBars(subs, history, installed, dates, rate, complete);
    }
    return usageChartBars(subs, history, installed, rangeDates("month", now), rate);
  }, [mode, month, subs, history, installed, rate, now]);

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

      <div
        role="tablist"
        aria-label={c.modeLabel}
        className="flex gap-1 rounded-xl bg-secondary p-1"
      >
        {(["recent", "month"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            disabled={value === "month" && months.length === 0}
            onClick={() => setMode(value)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors disabled:opacity-40",
              mode === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "recent" ? c.recent : c.monthly}
          </button>
        ))}
      </div>

      {mode === "month" && month && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={c.prevMonth}
            disabled={index <= 0}
            onClick={() => setMonthIndex(index - 1)}
            className="rounded-full p-1.5 hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="text-sm font-bold tabular-nums" aria-live="polite">
            {t.receiptView.periodMonth(year, monthNumber)}
          </span>
          <button
            type="button"
            aria-label={c.nextMonth}
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
        <ul className="-mx-1 flex items-start overflow-x-auto px-1 pb-1" aria-label={c.title}>
          {bars.map((bar) => (
            <BarColumn
              key={bar.sub.id}
              bar={bar}
              max={max}
              name={names.sub(bar.sub)}
              time={formatDurationText(t, bar.usedMs)}
              levelText={bar.level ? t.usageApp.level[bar.level] : c.pending}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-hidden>
        {(["green", "yellow", "red"] as const).map((level) => (
          <span key={level} className="inline-flex items-center gap-1">
            <span className={cn("size-2.5 rounded-sm", LEVEL_STYLE[level].bar)} />
            {t.usageApp.level[level]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className={cn("size-2.5 rounded-sm", PENDING_BAR)} />
          {c.pending}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {c.legend}
        {mode === "month" && partial && ` ${c.partialMonth}`}
        {excluded > 0 && ` ${c.excluded(excluded)}`} {t.usageApp.report.tvMissing}
        {unmappedCount > 0 && t.usageApp.report.unmapped(unmappedCount)}
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

function BarColumn({
  bar,
  max,
  name,
  time,
  levelText,
}: {
  bar: ChartBar;
  max: number;
  name: string;
  time: string;
  levelText: string;
}) {
  const height = bar.usedMs > 0 ? Math.max(4, Math.round((bar.usedMs / max) * BAR_AREA)) : 0;
  return (
    <li className="min-w-16 flex-1 shrink-0">
      <Link
        href={subscriptionDetailHref(bar.sub.id)}
        className="flex flex-col items-center gap-1 rounded-lg pt-1 hover:bg-muted/50"
      >
        <span className="sr-only">
          {name}: {time}, {levelText}
        </span>
        <div
          // 칸이 줄 너비를 나눠 가져 바닥선이 끝까지 이어진다 — 막대가 정해진 칸 안에서 비율로 그려진다는 것이 보이게.
          className="flex w-full flex-col items-center justify-end border-b border-border"
          style={{ height: BAR_AREA + 34 }}
          aria-hidden
        >
          <SubLogo sub={bar.sub} size={28} />
          <div
            className={cn(
              "mt-1 w-7 rounded-t-md",
              bar.level ? LEVEL_STYLE[bar.level].bar : PENDING_BAR,
            )}
            style={{ height }}
          />
        </div>
        {/* 자르지 않는다 — 칸이 좁아 '114시간 39분'이 '114시간 3…'으로 보였다. 띄어 쓴 곳에서 줄을 바꾼다. */}
        <span
          className="w-full break-keep text-center text-[10px] font-bold leading-tight tabular-nums"
          aria-hidden
        >
          {time}
        </span>
        <span
          className={cn(
            "w-full break-keep text-center text-[10px] leading-tight",
            bar.level ? LEVEL_STYLE[bar.level].text : "text-muted-foreground",
          )}
          aria-hidden
        >
          {levelText}
        </span>
      </Link>
    </li>
  );
}
