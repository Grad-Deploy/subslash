"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  calculateCostPerUse,
  formatCurrency,
  getMyMonthlyShareAmount,
  getRiskLevel,
  type RiskLevel,
  type Subscription,
  metricForSubscription,
} from "@subslash/shared";
import { useT } from "@lib/i18n";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { RiskBadge } from "@components/dashboard/RiskBadge";
import { useStoredFlag } from "@hooks/useStoredFlag";
import { AppUsageCountPicker } from "@components/subscription/app/AppUsageCountPicker";

interface FirstCheckInCardProps {
  subscription: Subscription;
  onSubmit: (count: number) => void;
}

/**
 * 앱에서 구독을 등록한 직후, 체크인 창으로 보내지 않고 대시보드 카드 안에서 바로 사용 횟수를
 * 묻는다. 계산은 스토어의 checkIn과 같게 한 달치 내 몫(getMyMonthlyShareAmount)으로 나눈다.
 */
export function FirstCheckInCard({ subscription, onSubmit }: FirstCheckInCardProps) {
  const t = useT();
  const f = t.appSmall.first;
  const [count, setCount] = useState<number | null>(null);

  const monthly = getMyMonthlyShareAmount(subscription);
  const risk: RiskLevel | null =
    count === null ? null : getRiskLevel(calculateCostPerUse(monthly, count), monthly, count);

  const [hintSeen, markHintSeen] = useStoredFlag(`subslash_app_hint_${risk ?? "none"}`, true);
  const showHint = risk !== null && !hintSeen;

  const planLine = [
    subscription.planName,
    f.perMonth(formatCurrency(monthly, subscription.currency)),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="rounded-2xl border bg-card p-4" aria-label={f.label(subscription.name)}>
      <div className="flex items-center gap-2.5">
        <ServiceLogo
          name={subscription.name}
          cancelUrl={subscription.cancelUrl}
          fallbackEmoji={subscription.iconUrl}
          fallbackColor={subscription.iconColor}
          size={34}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{subscription.name}</p>
          <p className="text-[11.5px] text-muted-foreground tabular-nums">{planLine}</p>
        </div>
      </div>

      <p className="mt-3 mb-2 text-[13px] font-bold">
        {t.checkin.metric[metricForSubscription(subscription)].question}
      </p>

      {/* 입력은 앱의 다른 체크인(등록 직후·체크인 창)과 같은 단계 막대다. */}
      <AppUsageCountPicker subscription={subscription} value={count} onChange={setCount} />

      {count !== null && risk && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
          <p className="text-[11.5px] text-muted-foreground">{f.thisMuch}</p>
          <RiskBadge level={risk} />
        </div>
      )}

      {showHint && risk && (
        <div className="relative mt-2 rounded-xl bg-foreground py-2 pr-8 pl-3 text-[11.5px] leading-relaxed text-background">
          {f.hints[risk]}
          <button
            type="button"
            onClick={markHintSeen}
            aria-label={f.closeHint}
            className="absolute top-1.5 right-1.5 rounded p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={count === null}
        onClick={() => {
          if (count === null) return;
          if (risk) markHintSeen();
          onSubmit(count);
        }}
        className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
      >
        {f.record}
      </button>
    </section>
  );
}
