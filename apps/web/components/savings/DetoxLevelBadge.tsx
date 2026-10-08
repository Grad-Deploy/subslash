"use client";

import React from "react";
import { Award } from "lucide-react";
import { formatKRW, getDetoxLevel } from "@subslash/shared";
import { useT } from "@lib/i18n";

interface DetoxLevelBadgeProps {
  /** 결제가 멈춘 것을 확인한 지킨 돈(KRW). 1년치 요금이 아니다. */
  savings: number;
  /** 해지 완료한 구독 수. */
  killCount: number;
  /** 진행률 바와 다음 레벨 안내를 함께 보여줄지. */
  showProgress?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

export function DetoxLevelBadge({
  savings,
  killCount,
  showProgress = true,
  variant = "card",
  className = "",
}: DetoxLevelBadgeProps) {
  const t = useT();
  const d = t.savings.detox;
  const level = getDetoxLevel(savings, killCount);
  const title = t.value.detoxTitle[level.level as 0 | 1 | 2 | 3 | 4 | 5];

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 ${className}`}
      >
        <span>
          {level.levelLabel} {title}
        </span>
      </span>
    );
  }

  return (
    <div className={`p-5 border rounded-2xl bg-card shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Award className="size-8 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {d.label}
            </p>
            <p className="text-lg font-black tracking-tight">
              <span className="text-emerald-600 dark:text-emerald-400">{level.levelLabel}</span>{" "}
              {title}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground">{d.saved}</p>
          <p className="text-sm font-bold font-mono">{formatKRW(savings)}</p>
        </div>
      </div>

      {showProgress &&
        (level.nextThreshold === null ? (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{d.max}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="w-full h-2 bg-secondary/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(level.progressPercent, 2)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {d.next(
                formatKRW(level.remainingToNext ?? 0),
                t.value.detoxTitle[(level.level + 1) as 0 | 1 | 2 | 3 | 4 | 5],
                level.level + 1,
              )}
            </p>
          </div>
        ))}
    </div>
  );
}
