"use client";

import React from "react";
import { type Subscription, formatKRW } from "@subslash/shared";
import { cn } from "@lib/utils";
import { formatDuration, monthlyTotals, type UsageHistory } from "@lib/usage/history";
import { RANGE_LABEL, type UsageRange } from "@lib/usage/value";
import { ServiceLogo } from "../../subscription/ServiceLogo";

/** '₩ 17,000'처럼 기호 뒤를 한 칸 띄운다(계산서와 같은 표기). */
export function won(amount: number): string {
  return formatKRW(amount).replace(/^([−-]?)₩\s*/, "$1₩ ");
}

export function SubLogo({ sub, size = 32 }: { sub: Subscription; size?: number }) {
  return (
    <ServiceLogo
      name={sub.name}
      cancelUrl={sub.cancelUrl}
      fallbackEmoji={sub.iconUrl}
      fallbackColor={sub.iconColor}
      size={size}
    />
  );
}

const RANGES: UsageRange[] = ["week", "month", "year"];

/** 1주 / 1달 / 1년 */
export function RangeTabs({
  value,
  onChange,
  label,
}: {
  value: UsageRange;
  onChange: (range: UsageRange) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl bg-secondary p-1">
      {RANGES.map((range) => (
        <button
          key={range}
          type="button"
          role="tab"
          aria-selected={value === range}
          onClick={() => onChange(range)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors",
            value === range
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {RANGE_LABEL[range]}
        </button>
      ))}
    </div>
  );
}

export function StatTile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-black tracking-tight tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-xs font-bold">{unit}</span>}
      </p>
    </div>
  );
}

/** 'M월 D일' */
export function monthDay(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(m)}월 ${Number(d)}일`;
}

/** 사용 시간 막대 하나. `ms`가 null이면 그때의 기록이 없다(0분과 다르다). */
export interface UsageBar {
  key: string;
  label: string;
  /** 축에 글자를 붙일지(1달은 30칸이라 몇 칸에만). */
  showLabel: boolean;
  ms: number | null;
  spoken: string;
}

/** 최근 12달의 달별 막대. 기록이 하루도 없는 달은 null이다. */
export function monthBars(
  history: UsageHistory,
  packages: readonly string[],
  now: Date,
): UsageBar[] {
  return monthlyTotals(history, packages, now).map((m) => ({
    key: m.month,
    label: m.label,
    showLabel: true,
    ms: m.totals.coveredDays > 0 ? m.totals.usedMs : null,
    spoken: m.label,
  }));
}

/**
 * 사용 시간 막대 그래프. 기록이 없는 때는 점선으로 그려 '안 썼다'와 나눈다. 리포트의 1년 추이와 구독
 * 상세의 사용 현황이 같은 것을 쓴다 — 따로 그렸을 때는 같은 달별 막대가 두 화면에서 모양이 달랐다.
 * 읽는 기계에는 막대 대신 목록을 준다.
 */
export function UsageBarChart({ bars }: { bars: UsageBar[] }) {
  const maxMs = Math.max(1, ...bars.map((bar) => bar.ms ?? 0));
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]" aria-hidden>
        {bars.map((bar) => (
          <div key={bar.key} className="flex h-full flex-1 flex-col justify-end">
            {bar.ms === null ? (
              <div className="h-1 w-full rounded-full border border-dashed border-border" />
            ) : (
              <div
                className="w-full rounded-t-sm bg-foreground/80"
                style={{ height: `${bar.ms > 0 ? Math.max(3, (bar.ms / maxMs) * 100) : 0}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px]" aria-hidden>
        {bars.map((bar) => (
          <span
            key={bar.key}
            className="flex-1 overflow-visible whitespace-nowrap text-center text-[9.5px] text-muted-foreground"
          >
            {bar.showLabel ? bar.label : ""}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {bars.map((bar) => (
          <li key={bar.key}>
            {bar.spoken}: {bar.ms === null ? "기록 없음" : formatDuration(bar.ms)}
          </li>
        ))}
      </ul>
    </div>
  );
}
