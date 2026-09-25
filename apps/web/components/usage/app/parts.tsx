"use client";

import React from "react";
import { type Subscription, formatKRW } from "@subslash/shared";
import { cn } from "@lib/utils";
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
