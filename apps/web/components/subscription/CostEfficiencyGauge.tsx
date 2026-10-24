"use client";

import React from "react";
import {
  Subscription,
  getBreakEvenInfo,
  getMyMonthlyShareAmount,
  formatCurrency,
} from "@subslash/shared";
import { useT } from "@lib/i18n";
import { describeBreakEven } from "@lib/i18n/check-in-outcome";

interface CostEfficiencyGaugeProps {
  subscription: Subscription;
  usageCount: number;
  costPerUse: number;
}

export function CostEfficiencyGauge({
  subscription,
  usageCount,
  costPerUse,
}: CostEfficiencyGaugeProps) {
  const t = useT();
  const g = t.checkin.gauge;
  const monthlyAmount = getMyMonthlyShareAmount(subscription);
  const breakEvenInfo = getBreakEvenInfo(monthlyAmount, usageCount);

  // Level specific colors
  const levelColors = {
    danger: "text-destructive",
    warning: "text-amber-500",
    safe: "text-emerald-500",
  };

  const barColors = {
    danger: "bg-destructive",
    warning: "bg-amber-500",
    safe: "bg-emerald-500",
  };

  // Cap progress at 100 for the UI
  const displayProgress = Math.min(Math.max(breakEvenInfo.progressPercent, 0), 100);
  const formattedCostPerUse = formatCurrency(costPerUse, subscription.currency);

  return (
    <div className="flex flex-col gap-2 w-full max-w-[400px]">
      <div className="flex items-center gap-3">
        {/* 무엇의 퍼센트인지 적는다 — 숫자만 있을 때는 '38%'가 무엇인지 알 수 없었다. */}
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${levelColors[breakEvenInfo.level]}`}
        >
          {g.progress(breakEvenInfo.progressPercent)}
        </span>
        {/* 막대 끝이 본전(100%)이다. 예전에는 본전선을 막대의 80% 자리에 그려 숫자와 맞지 않았다. */}
        <div className="relative flex-1 h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${barColors[breakEvenInfo.level]}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs mt-1">
        <span
          className={`min-w-0 font-medium [overflow-wrap:anywhere] ${levelColors[breakEvenInfo.level]}`}
        >
          {breakEvenInfo.level === "danger" && g.diet(formattedCostPerUse)}
          {breakEvenInfo.level === "warning" && describeBreakEven(t, breakEvenInfo)}
          {breakEvenInfo.level === "safe" && g.achieved(formattedCostPerUse)}
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground">{g.baseline}</span>
      </div>
    </div>
  );
}
