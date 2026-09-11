"use client";

import React from "react";
import Link from "next/link";
import { Subscription, formatKRW, getSavingsEquivalent, getSavingsTiers } from "@subslash/shared";
import { useExchangeRate } from "../../hooks/useExchangeRate";

/**
 * 절약 현황의 머리 숫자. 절약을 세 칸으로 나눠 보여준다.
 *
 * 머리 숫자는 결제가 멈춘 것을 확인한 '지킨 돈'뿐이다. 해지 버튼만 누른 것,
 * 결제일이 아직 오지 않은 것은 지킨 돈이 아니다. 확인 대기는 답하면 더해지는
 * 금액으로 따로 보여주고, 1년치 요금은 '앞으로 아끼는 속도'로 적는다.
 */
export function SavingsPot({ killedSubscriptions }: { killedSubscriptions: Subscription[] }) {
  const rate = useExchangeRate();

  if (killedSubscriptions.length === 0) {
    return null;
  }

  const tiers = getSavingsTiers(killedSubscriptions, new Date(), rate);
  const equivalent = getSavingsEquivalent(tiers.annualRunRate)[0];
  const nothingPassedYet = tiers.confirmed === 0 && tiers.pending === 0;

  return (
    <section
      aria-labelledby="savings-tiers-heading"
      className="p-5 sm:p-6 border rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200 dark:from-emerald-950 dark:to-emerald-900/60 dark:border-emerald-800 space-y-4"
    >
      <div className="space-y-1">
        <h2
          id="savings-tiers-heading"
          className="text-sm font-bold text-emerald-800 dark:text-emerald-300"
        >
          ✅ 지킨 돈
        </h2>
        <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
          {formatKRW(tiers.confirmed)}
        </p>
        <p className="text-xs text-emerald-900/70 dark:text-emerald-200/70">
          해지 뒤 결제일이 지났고, 그날 결제가 없었다고 확인한 금액입니다.
        </p>
      </div>

      {nothingPassedYet && (
        <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
          아직 해지 뒤 결제일이 지나지 않았습니다. 첫 결제일이 지나면 결제가 멈췄는지 여쭤볼게요.
        </p>
      )}

      {tiers.pending > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            ⏳ 확인 대기 {formatKRW(tiers.pending)} ({tiers.pendingCount}건)
          </p>
          <p className="text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
            결제일은 지났지만 결제가 멈췄는지 아직 답하지 않은 해지입니다. 답하면 지킨 돈에
            더해집니다.{" "}
            <Link href="/dashboard" className="underline underline-offset-2 font-semibold">
              대시보드에서 답하기 →
            </Link>
          </p>
        </div>
      )}

      <div className="text-xs text-emerald-900/80 dark:text-emerald-200/80 space-y-0.5">
        <p>
          <span className="font-semibold">📅 앞으로</span> · 해지를 유지하면 연{" "}
          {formatKRW(tiers.annualRunRate)} 아끼는 중
        </p>
        {equivalent && <p>{equivalent}</p>}
      </div>

      {tiers.unknownCount > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          ⚠️ 결제 월이나 해지 날짜를 모르는 {tiers.unknownCount}건은 언제 결제되는지 알 수 없어 지킨
          돈과 확인 대기에서 빠졌습니다.
        </p>
      )}
    </section>
  );
}
