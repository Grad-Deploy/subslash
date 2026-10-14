"use client";

import React from "react";
import { formatCurrency, isAmountChange, type Subscription } from "@subslash/shared";
import { useLocale, useT } from "@lib/i18n";
import { intlLocale } from "@lib/i18n/config";

/**
 * 사용자가 금액을 고친 기록(utils/amountHistory). 결제 기록이 아니라 직접 적은 값이라고 밝히고, 고친 날부터
 * 새 금액으로 영수증을 셈한다는 것을 적는다. 기록이 없으면 그리지 않는다.
 */
export function AmountHistoryCard({ subscription }: { subscription: Subscription }) {
  const t = useT().amountHistory;
  const locale = useLocale();
  const changes = (subscription.amountHistory ?? []).filter(isAmountChange).slice().reverse();
  if (changes.length === 0) return null;
  return (
    <section className="space-y-2 rounded-2xl border bg-card p-4" aria-label={t.title}>
      <h3 className="text-sm font-bold">{t.title}</h3>
      <ul className="space-y-1.5 text-sm">
        {changes.map((change) => {
          const sameMoney =
            change.before.amount === change.after.amount &&
            change.before.currency === change.after.currency;
          return (
            <li key={change.changedAt} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs text-muted-foreground tabular-nums">
                {new Date(change.changedAt).toLocaleDateString(intlLocale(locale))}
              </span>
              <span className="font-semibold tabular-nums">
                {sameMoney
                  ? t.shared
                  : `${formatCurrency(change.before.amount, change.before.currency)} → ${formatCurrency(change.after.amount, change.after.currency)}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
    </section>
  );
}
