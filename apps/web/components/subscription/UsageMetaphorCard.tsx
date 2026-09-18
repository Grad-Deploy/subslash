"use client";

import React from "react";
import { Subscription, getUsageMetaphor, getMyMonthlyShareAmount } from "@subslash/shared";

interface UsageMetaphorCardProps {
  subscription: Subscription;
  usageCount: number;
  costPerUse: number;
}

export function UsageMetaphorCard({
  subscription,
  usageCount,
  costPerUse: _costPerUse,
}: UsageMetaphorCardProps) {
  const monthlyAmount = getMyMonthlyShareAmount(subscription);
  const metaphor = getUsageMetaphor(
    monthlyAmount,
    subscription.currency,
    usageCount,
    subscription.name,
  );

  const toneStyles = {
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    safe: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        toneStyles[metaphor.tone]
      } max-w-[400px] w-full`}
    >
      <div className="text-2xl">{metaphor.emoji}</div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm opacity-80 mb-1">{metaphor.comparison}</span>
        <span className="font-medium text-base break-keep leading-tight">{metaphor.message}</span>
      </div>
    </div>
  );
}
