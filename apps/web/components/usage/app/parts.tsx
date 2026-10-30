"use client";

import React from "react";
import type { Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { monthlyTotals, type UsageHistory } from "@lib/usage/history";
import { type UsageRange } from "@lib/usage/value";
import { useT, type Messages } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
import { ServiceLogo } from "../../subscription/ServiceLogo";

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

/** 칸을 나눠 하나를 고르는 탭. 사용 현황의 기간(1주·1달·1년)과 사용 시간 그래프(최근 30일·월별)가 함께 쓴다. */
export function SegmentedTabs<T extends string>({
  value,
  onChange,
  label,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  label: string;
  options: readonly { value: T; label: string; disabled?: boolean }[];
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl bg-secondary p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors disabled:opacity-40",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

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
  const t = useT();
  return (
    <SegmentedTabs
      value={value}
      onChange={onChange}
      label={label}
      options={RANGES.map((range) => ({ value: range, label: t.usageApp.range[range] }))}
    />
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
export function monthDay(t: Messages, date: string): string {
  const [, m, d] = date.split("-");
  return t.usageApp.monthDay(Number(m), Number(d));
}

/** 막대 하나. `value`가 null이면 그때의 기록이 없다(0과 다르다). 폰 기록은 밀리초, 체크인은 그 지표의 수량이다. */
export interface UsageBar {
  key: string;
  label: string;
  /** 축에 글자를 붙일지(1달은 30칸이라 몇 칸에만). */
  showLabel: boolean;
  value: number | null;
  spoken: string;
}

/** 최근 12달의 달별 막대. 기록이 하루도 없는 달은 null이다. */
export function monthBars(
  t: Messages,
  history: UsageHistory,
  packages: readonly string[],
  now: Date,
): UsageBar[] {
  return monthlyTotals(history, packages, now).map((m) => {
    const label = t.usageApp.month(Number(m.month.slice(5)));
    return {
      key: m.month,
      label,
      showLabel: true,
      value: m.totals.coveredDays > 0 ? m.totals.usedMs : null,
      spoken: label,
    };
  });
}

/**
 * 사용 시간 막대 그래프. 기록이 없는 때는 점선으로 그려 '안 썼다'와 나눈다. 리포트의 1년 추이와 구독
 * 상세의 사용 현황이 같은 것을 쓴다 — 따로 그렸을 때는 같은 달별 막대가 두 화면에서 모양이 달랐다.
 * 읽는 기계에는 막대 대신 목록을 준다.
 */
export function UsageBarChart({
  bars,
  format,
}: {
  bars: UsageBar[];
  /** 읽는 기계에 줄 값. 없으면 사용 시간(밀리초)으로 읽는다. */
  format?: (value: number) => string;
}) {
  const t = useT();
  const describe = format ?? ((value: number) => formatDurationText(t, value));
  const max = Math.max(1, ...bars.map((bar) => bar.value ?? 0));
  return (
    <div>
      <div className="flex h-28 items-end gap-[3px]" aria-hidden>
        {bars.map((bar) => (
          <div key={bar.key} className="flex h-full flex-1 flex-col justify-end">
            {bar.value === null ? (
              <div className="h-1 w-full rounded-full border border-dashed border-border" />
            ) : (
              <div
                className="w-full rounded-t-sm bg-foreground/80"
                style={{ height: `${bar.value > 0 ? Math.max(3, (bar.value / max) * 100) : 0}%` }}
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
            {bar.spoken}: {bar.value === null ? t.usageApp.noRecord : describe(bar.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}
