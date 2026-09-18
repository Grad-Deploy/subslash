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
      <div className="shrink-0 text-2xl">{metaphor.emoji}</div>
      {/*
        문구에 서비스 이름이 들어간다. 길이를 모르는 글자라 min-w-0으로 줄어들 수 있게 하고,
        띄어쓰기 없이 길게 적은 이름도 줄바꿈되도록 overflow-wrap:anywhere를 준다 — break-keep은
        한국어 낱말을 끊지 않아 이름이 칸 밖으로 나간다.
      */}
      <div className="flex min-w-0 flex-col">
        <span className="mb-1 text-sm font-semibold opacity-80 [overflow-wrap:anywhere]">
          {metaphor.comparison}
        </span>
        <span className="text-base font-medium leading-tight [overflow-wrap:anywhere]">
          {metaphor.message}
        </span>
      </div>
    </div>
  );
}
