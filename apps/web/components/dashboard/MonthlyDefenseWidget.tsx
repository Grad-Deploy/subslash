"use client";

import React from "react";
import { Subscription, formatKRW, sumMyMonthDefendedKRW } from "@subslash/shared";
import { useExchangeRate } from "../../hooks/useExchangeRate";

interface MonthlyDefenseWidgetProps {
  killedSubscriptions: Subscription[];
}

/**
 * "이번 달에 실제로 통장에서 안 빠져나간 돈".
 *
 * 해지했다고 이번 달 결제가 전부 막힌 것은 아니다. 결제일이 지난 뒤 해지한
 * 건은 이미 돈이 나갔으므로 빠지고, 결제 월을 모르는 연간 구독은 합계에
 * 넣지 않고 몇 건인지만 알린다.
 */
export function MonthlyDefenseWidget({ killedSubscriptions }: MonthlyDefenseWidgetProps) {
  const rate = useExchangeRate();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (killedSubscriptions.length === 0) return null;

  const { amount, unknownCount } = sumMyMonthDefendedKRW(killedSubscriptions, year, month, rate);

  return (
    <section className="p-5 border rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            {month}월 지출 방어 성공
          </p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            {formatKRW(amount)}
          </p>
        </div>
        <span className="text-3xl leading-none">🛡️</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {amount > 0
          ? `이번 달 결제될 예정이었지만 해지 덕분에 빠져나가지 않은 금액입니다.`
          : `이번 달에는 결제일이 돌아온 해지 구독이 없습니다. 다음 결제 주기부터 방어 금액이 쌓입니다.`}
      </p>

      {unknownCount > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          ⚠️ 결제 월을 모르는 연간 구독 {unknownCount}건은 이번 달 결제 여부를 알 수 없어 합계에서
          빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.
        </p>
      )}
    </section>
  );
}
