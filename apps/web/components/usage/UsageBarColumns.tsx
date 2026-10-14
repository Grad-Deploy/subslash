"use client";

import React from "react";
import Link from "next/link";
import type { RiskLevel, Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useServiceNames, useT } from "@lib/i18n";
import { LEVEL_STYLE } from "@lib/usage/value";
import { ServiceLogo } from "../subscription/ServiceLogo";

/**
 * 막대가 들어가는 높이(px). 가장 긴 막대가 이 높이이고 나머지는 그 비율이라, 값이 커도 칸을 넘지 않는다.
 */
const BAR_AREA = 112;
/** 평가 전 막대 색. 가성비 색(빨강·노랑·초록)과 겹치지 않게 회색으로 둔다. */
const PENDING_BAR = "bg-muted-foreground/35";

export interface UsageBarColumn {
  sub: Subscription;
  /** 막대 길이(0~1). */
  fraction: number;
  /** 막대 아래 값('114시간 39분'·'3회'). */
  value: string;
  /** 가성비. 평가 전이면 null. */
  level: RiskLevel | null;
}

/**
 * 구독마다 세로 막대 하나 — 막대 위는 서비스 아이콘, 아래는 값과 가성비. 막대를 누르면 그 구독의 상세로
 * 간다. 리포트의 사용 시간 그래프(앱, 폰 기록)와 사용량 그래프(웹, 체크인)가 같은 모양을 쓴다.
 */
export function UsageBarColumns({ bars, label }: { bars: UsageBarColumn[]; label: string }) {
  const t = useT();
  const names = useServiceNames();
  return (
    <ul className="-mx-1 flex items-start overflow-x-auto px-1 pb-1" aria-label={label}>
      {bars.map((bar) => {
        const levelText = bar.level ? t.usageApp.level[bar.level] : t.usageChart.pending;
        const height = bar.fraction > 0 ? Math.max(4, Math.round(bar.fraction * BAR_AREA)) : 0;
        return (
          <li key={bar.sub.id} className="min-w-16 flex-1 shrink-0">
            <Link
              href={subscriptionDetailHref(bar.sub.id)}
              className="flex flex-col items-center gap-1 rounded-lg pt-1 hover:bg-muted/50"
            >
              <span className="sr-only">
                {names.sub(bar.sub)}: {bar.value}, {levelText}
              </span>
              <div
                // 칸이 줄 너비를 나눠 가져 바닥선이 끝까지 이어진다 — 막대가 정해진 칸 안에서 비율로 그려진다는 것이 보이게.
                className="flex w-full flex-col items-center justify-end border-b border-border"
                style={{ height: BAR_AREA + 34 }}
                aria-hidden
              >
                <ServiceLogo
                  name={bar.sub.name}
                  cancelUrl={bar.sub.cancelUrl}
                  fallbackEmoji={bar.sub.iconUrl}
                  fallbackColor={bar.sub.iconColor}
                  size={28}
                />
                <div
                  className={cn(
                    "mt-1 w-7 rounded-t-md",
                    bar.level ? LEVEL_STYLE[bar.level].bar : PENDING_BAR,
                  )}
                  style={{ height }}
                />
              </div>
              {/* 자르지 않는다 — 칸이 좁아 '114시간 39분'이 '114시간 3…'으로 보였다. 띄어 쓴 곳에서 줄을 바꾼다. */}
              <span
                className="w-full break-keep text-center text-[10px] font-bold leading-tight tabular-nums"
                aria-hidden
              >
                {bar.value}
              </span>
              <span
                className={cn(
                  "w-full break-keep text-center text-[10px] leading-tight",
                  bar.level ? LEVEL_STYLE[bar.level].text : "text-muted-foreground",
                )}
                aria-hidden
              >
                {levelText}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 막대 색의 뜻. `pending`이면 '평가 전' 회색도 적는다. */
export function LevelLegend({ pending = true }: { pending?: boolean }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground" aria-hidden>
      {(["green", "yellow", "red"] as const).map((level) => (
        <span key={level} className="inline-flex items-center gap-1">
          <span className={cn("size-2.5 rounded-sm", LEVEL_STYLE[level].bar)} />
          {t.usageApp.level[level]}
        </span>
      ))}
      {pending && (
        <span className="inline-flex items-center gap-1">
          <span className={cn("size-2.5 rounded-sm", PENDING_BAR)} />
          {t.usageChart.pending}
        </span>
      )}
    </div>
  );
}
