"use client";

import React from "react";
import Link from "next/link";
import { formatKRW, getDetoxLevel, getSavingsTiers, type Subscription } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";

/**
 * 웹 대시보드 오른쪽 요약의 '지킨 돈' 한 줄. 절약 성과는 /savings가 전담하고, 여기서는 결제가 멈춘 것을
 * 확인한 금액과 레벨만 보여주고 넘긴다 — 같은 위젯을 두 화면에 두면 어느 쪽이 본체인지 알 수 없게 된다.
 * 해지한 구독이 없으면 그리지 않는다.
 */
export function SavedMoneyLink({
  killedSubscriptions,
  killedCount,
  now,
}: {
  killedSubscriptions: Subscription[];
  killedCount: number;
  now: Date;
}) {
  const rate = useExchangeRate();
  if (killedSubscriptions.length === 0) return null;
  const tiers = getSavingsTiers(killedSubscriptions, now, rate);
  // 레벨은 1년치 요금이 아니라 결제가 멈춘 것을 확인한 지킨 돈으로 매긴다.
  const detoxLevel = getDetoxLevel(tiers.confirmed, killedCount);

  return (
    <Link
      href="/savings"
      className="flex items-center justify-between gap-3 p-4 border rounded-2xl bg-card hover:bg-muted transition-colors"
    >
      <div className="min-w-0">
        {/* 머리 숫자는 결제가 멈춘 것을 확인한 돈뿐이다. 1년치 요금은 아끼는 속도로 적는다. */}
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          지킨 돈
        </p>
        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {formatKRW(tiers.confirmed)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {tiers.pending > 0 && `확인 대기 ${formatKRW(tiers.pending)} · `}연{" "}
          {formatKRW(tiers.annualRunRate)} 아끼는 중 · {detoxLevel.levelLabel} {detoxLevel.title}
          {tiers.unknownCount > 0 && ` · 결제 월 미설정 ${tiers.unknownCount}건 제외`}
        </p>
      </div>
      <span className="text-sm font-semibold text-muted-foreground shrink-0">절약 현황 →</span>
    </Link>
  );
}
