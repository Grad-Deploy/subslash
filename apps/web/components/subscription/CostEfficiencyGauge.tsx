"use client";

import React from "react";
import {
  Subscription,
  getBreakEvenInfo,
  getMyMonthlyShareAmount,
  formatCurrency,
} from "@subslash/shared";

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
        <span className={`text-sm font-bold min-w-[40px] ${levelColors[breakEvenInfo.level]}`}>
          {breakEvenInfo.progressPercent}%
        </span>
        <div className="relative flex-1 h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${barColors[breakEvenInfo.level]}`}
            style={{ width: `${displayProgress}%` }}
          />
          {/* Break-even marker at 80% position visually representing the target */}
          <div className="absolute top-0 bottom-0 left-[80%] w-[2px] bg-border border-l border-dashed border-primary-foreground/50 z-10" />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs mt-1">
        <span className={`font-medium ${levelColors[breakEvenInfo.level]}`}>
          {breakEvenInfo.level === "danger" && `지출 다이어트 추천 (회당 ${formattedCostPerUse})`}
          {breakEvenInfo.level === "warning" && breakEvenInfo.remainingMessage}
          {breakEvenInfo.level === "safe" && `본전 달성 완료! (회당 ${formattedCostPerUse})`}
        </span>
        <span className="text-muted-foreground text-[10px]">본전 기준선</span>
      </div>
    </div>
  );
}
