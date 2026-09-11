"use client";

import React, { useState } from "react";
import {
  Subscription,
  formatKRW,
  getMyAnnualAmountKRW,
  getMyYearDefendedAmountKRW,
  sumMyAnnualKRW,
  sumMyYearDefendedKRW,
} from "@subslash/shared";
import { DetoxLevelBadge } from "./DetoxLevelBadge";

interface SavingsBreakdownChartProps {
  killedSubscriptions: Subscription[];
  exchangeRate: number;
}

export function SavingsBreakdownChart({
  killedSubscriptions,
  exchangeRate,
}: SavingsBreakdownChartProps) {
  const currentYear = new Date().getFullYear();
  const [viewMode, setViewMode] = useState<"annual" | "yearDefended">("annual");

  if (!killedSubscriptions || killedSubscriptions.length === 0) {
    return null;
  }

  const totalAnnual = sumMyAnnualKRW(killedSubscriptions, exchangeRate);
  const totalYearDefended = sumMyYearDefendedKRW(killedSubscriptions, currentYear, exchangeRate);

  const activeTotal = viewMode === "annual" ? totalAnnual : totalYearDefended.amount;

  // Compute breakdown item for each subscription. In the year view a yearly plan
  // with no billing month has no defended amount to show, only "not set".
  const items = killedSubscriptions
    .map((sub) => {
      const amount =
        viewMode === "annual"
          ? getMyAnnualAmountKRW(sub, exchangeRate)
          : getMyYearDefendedAmountKRW(sub, currentYear, exchangeRate);
      const percentage =
        amount !== null && activeTotal > 0 ? Math.round((amount / activeTotal) * 100) : 0;
      return {
        id: sub.id,
        name: sub.name,
        iconUrl: sub.iconUrl || "📦",
        category: sub.category,
        amount,
        percentage,
      };
    })
    .sort((a, b) => (b.amount ?? -1) - (a.amount ?? -1));

  const topContributor = items[0];

  return (
    <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <span>📊</span> 서비스별 절약 기여도
            </h3>
            {/* 레벨은 연간 환산 누적 방어액 기준이라 보기 모드와 무관하게 같다. */}
            <DetoxLevelBadge
              annualSavings={totalAnnual}
              killCount={killedSubscriptions.length}
              variant="inline"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            어떤 구독을 끊었을 때 가장 많은 돈이 지켜졌는지 확인해보세요.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex p-1 bg-muted rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "annual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setViewMode("annual")}
          >
            연간 환산 기준
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "yearDefended"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setViewMode("yearDefended")}
          >
            {currentYear}년 실질 방어액
          </button>
        </div>
      </div>

      {/* Bar Chart list */}
      <div className="space-y-3 pt-1">
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-base">{item.iconUrl}</span>
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.amount === null ? (
                  <span className="font-semibold text-muted-foreground">결제 월 미설정</span>
                ) : (
                  <>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatKRW(item.amount)}
                    </span>
                    <span className="text-[11px] text-muted-foreground w-9 text-right font-medium">
                      {item.percentage}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Progress bar container */}
            <div className="w-full h-2.5 bg-secondary/70 rounded-full overflow-hidden">
              {item.amount !== null && (
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(item.percentage, 2)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {viewMode === "yearDefended" && totalYearDefended.unknownCount > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          ⚠️ 결제 월을 모르는 연간 구독 {totalYearDefended.unknownCount}건은 올해 결제가 해지
          전이었는지 알 수 없어 합계에서 빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.
        </p>
      )}

      {/* Highlight note */}
      {topContributor && topContributor.percentage > 0 && (
        <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            💡 <strong>{topContributor.name}</strong> 해지가 전체 절약의{" "}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {topContributor.percentage}%
            </strong>
            를 차지합니다.
          </span>
          <span className="font-semibold text-foreground">합계 {formatKRW(activeTotal)}</span>
        </div>
      )}
    </div>
  );
}
