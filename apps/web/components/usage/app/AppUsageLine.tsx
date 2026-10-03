"use client";

import React from "react";
import { cn } from "@lib/utils";
import { formatDuration } from "@lib/usage/history";
import { packageBreakdown, packagesFor } from "@lib/usage/packages";
import { LEVEL_STYLE, type MetricView, type SubUsage } from "@lib/usage/value";
import { won } from "./parts";

export type SortKey = "value" | "time" | "opens";

/** 구독 하나의 줄: 고른 기간의 사용량(시간·횟수 칩)과 최근 30일의 가성비(가성비 칩). */
export interface UsageReportLine {
  period: SubUsage;
  month: SubUsage;
  view: MetricView | null;
}

export const isUnused = (u: SubUsage) => u.totals.opens === 0 && u.totals.usedMs === 0;

/**
 * 평가 글자와 색. 평가 전이면 남은 날을 회색으로. 한 번도 안 연 것은 평가가 아니라 관측이라 평가 전에도
 * 그대로 말한다('9일 동안 안 열었어요') — 바로 알고 싶은 것은 대개 이것이다.
 */
function verdictOf(
  view: MetricView,
  unused: boolean,
  covered: number,
): { text: string; className: string } {
  if (unused && view.pendingDays > 0) {
    return { text: `${covered}일 동안 안 열었어요`, className: LEVEL_STYLE.red.text };
  }
  if (view.pendingDays > 0) {
    return { text: `평가까지 ${view.pendingDays}일`, className: "text-muted-foreground" };
  }
  if (unused) return { text: "안 씀", className: LEVEL_STYLE.red.text };
  const level = view.level ?? "red";
  return { text: LEVEL_STYLE[level].label, className: LEVEL_STYLE[level].text };
}

/** '6일 사용' · '4회' · '2시간 10분' — 가성비 지표로 잰 양. */
function amountText(view: MetricView, usage: SubUsage): string {
  if (view.metric === "uses") return `${usage.totals.opens}회`;
  if (view.metric === "days") return `${usage.totals.activeDays}일 사용`;
  return formatDuration(usage.totals.usedMs);
}

function formatGoalAmount(value: number, unit: string): string {
  const rounded = unit === "시간" ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded}${unit}`;
}

/** 목록 한 줄의 가운데: 이름·오른쪽 값·아랫줄·막대. 고른 칩에 따라 값과 막대가 바뀐다. */
export function UsageLine({
  line,
  sort,
  totalMs,
  totalOpens,
}: {
  line: UsageReportLine;
  sort: SortKey;
  totalMs: number;
  totalOpens: number;
}) {
  const { period, month, view } = line;
  const packages = packagesFor(period.sub) ?? [];
  const breakdown =
    period.state === "measured" ? packageBreakdown(packages, period.totals.byPackage) : [];

  if (period.state !== "measured" || !view) {
    return (
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-bold">{period.sub.name}</p>
        <p className="text-xs text-muted-foreground">
          {period.state === "not-installed" ? "이 폰에 앱이 없어요" : "이 기간에는 기록이 없어요"}
        </p>
      </div>
    );
  }

  const unused = isUnused(month);
  const verdict = verdictOf(view, unused, month.totals.coveredDays);
  const barColor =
    view.pendingDays > 0 || !view.level
      ? "bg-foreground/70"
      : LEVEL_STYLE[unused ? "red" : view.level].bar;

  let value: React.ReactNode;
  let detail: React.ReactNode;
  let width: number;
  let caption: string;
  if (sort === "value") {
    value = unused ? (
      <span className={cn("text-xs font-semibold", LEVEL_STYLE.red.text)}>안 씀</span>
    ) : view.short ? (
      <>
        <span className="text-sm font-black tabular-nums">{won(month.periodCostKRW)}</span>
        <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
          {formatDuration(month.totals.usedMs)}에
        </span>
      </>
    ) : (
      <>
        <span className="text-sm font-black tabular-nums">
          {view.unitKRW === null ? "—" : won(view.unitKRW)}
        </span>
        <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
          {view.perLabel}
        </span>
      </>
    );
    detail = unused ? (
      <span className={LEVEL_STYLE.red.text}>
        {month.totals.coveredDays}일 동안 이 폰에서 한 번도 안 열었어요
      </span>
    ) : (
      <>
        <span className={cn("font-semibold", verdict.className)}>{verdict.text}</span> ·{" "}
        {amountText(view, month)}
      </>
    );
    // 평가 전에는 늘리지 않은 양을 30일 목표에 대 본다 — 며칠 치를 30일로 늘려 꽉 채우지 않게.
    const have = view.pendingDays > 0 ? view.have : view.have30;
    width = Math.min(100, (have / view.goal) * 100);
    caption =
      view.pendingDays > 0
        ? `${month.totals.coveredDays}일 동안 ${formatGoalAmount(view.have, view.goalUnit)} · 잘 씀 기준은 30일에 ${view.goal}${view.goalUnit}`
        : `한 달에 ${formatGoalAmount(view.have30, view.goalUnit)} · 잘 씀 기준 ${view.goal}${view.goalUnit}`;
  } else if (sort === "time") {
    value = (
      <span className="text-sm font-black tabular-nums">
        {formatDuration(period.totals.usedMs)}
      </span>
    );
    detail = (
      <>
        {period.totals.opens}회 · <span className={verdict.className}>{verdict.text}</span>
      </>
    );
    width = totalMs > 0 ? (period.totals.usedMs / totalMs) * 100 : 0;
    caption = `구독 앱 전체 사용 시간의 ${Math.round(width)}%`;
  } else {
    value = (
      <span className="text-sm font-black tabular-nums">
        {period.totals.opens}
        <span className="ml-0.5 text-[11px] font-bold">회</span>
      </span>
    );
    detail = (
      <>
        {formatDuration(period.totals.usedMs)} ·{" "}
        <span className={verdict.className}>{verdict.text}</span>
      </>
    );
    width = totalOpens > 0 ? (period.totals.opens / totalOpens) * 100 : 0;
    caption = `구독 앱 전체 쓴 횟수의 ${Math.round(width)}%`;
  }

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-bold">{period.sub.name}</p>
        <span className="shrink-0 text-right">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
      {breakdown.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {breakdown.map((row) => `${row.label} ${formatDuration(row.usedMs)}`).join(" · ")}
        </p>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${width > 0 ? Math.max(3, width) : 0}%` }}
        />
      </div>
      <p className="text-[10.5px] text-muted-foreground">{caption}</p>
    </div>
  );
}
