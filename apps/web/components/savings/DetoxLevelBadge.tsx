"use client";

import React from "react";
import { formatKRW, getDetoxLevel } from "@subslash/shared";

interface DetoxLevelBadgeProps {
  /** 해지한 구독의 연간 환산 절약액(KRW). 쌓인 돈이 아니라 1년치 요금이다. */
  annualSavings: number;
  /** 해지 완료한 구독 수. */
  killCount: number;
  /** 진행률 바와 다음 레벨 안내를 함께 보여줄지. */
  showProgress?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

export function DetoxLevelBadge({
  annualSavings,
  killCount,
  showProgress = true,
  variant = "card",
  className = "",
}: DetoxLevelBadgeProps) {
  const level = getDetoxLevel(annualSavings, killCount);

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 ${className}`}
      >
        <span>{level.emoji}</span>
        <span>
          {level.levelLabel} {level.title}
        </span>
      </span>
    );
  }

  return (
    <div className={`p-5 border rounded-2xl bg-card shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{level.emoji}</span>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              구독 디톡스 레벨
            </p>
            <p className="text-lg font-black tracking-tight">
              <span className="text-emerald-600 dark:text-emerald-400">{level.levelLabel}</span>{" "}
              {level.title}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground">연간 환산 절약</p>
          <p className="text-sm font-bold font-mono">{formatKRW(annualSavings)}</p>
        </div>
      </div>

      {showProgress &&
        (level.nextThreshold === null ? (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🎉 최고 레벨입니다. 더 지킬 구독이 남아있는지 점검해보세요.
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-secondary/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(level.progressPercent, 2)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">{formatKRW(level.remainingToNext ?? 0)}</strong>을
              더 방어하면 <strong className="text-foreground">{level.nextTitle}</strong>
              (Lv.{level.level + 1})로 올라갑니다.
            </p>
          </div>
        ))}
    </div>
  );
}
