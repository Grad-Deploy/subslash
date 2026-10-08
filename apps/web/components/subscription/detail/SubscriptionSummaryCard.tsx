"use client";

import React from "react";
import {
  formatCurrency,
  formatDday,
  getBilledAmount,
  getDaysUntilBillingFor,
  getDaysUntilTrialEnd,
  type Subscription,
} from "@subslash/shared";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useT, useServiceNames } from "@lib/i18n";
import { ServiceLogo } from "../ServiceLogo";

/**
 * 구독 상세 맨 위의 요약 — 이름·요금·결제 일정, 그리고 체크인·해지(구독 중) 또는 되살리기(해지함).
 *
 * 목록 옆 칸처럼 좁게 그려질 때는 가격을 이름 아래로 내린다. 화면 폭이 아니라 이 카드의 폭을
 * 본다(@container) — 넓은 화면의 옆 칸도 좁기 때문이다.
 */
export function SubscriptionSummaryCard({
  sub,
  headingLevel,
  onCheckIn,
  onKill,
  onRevive,
}: {
  sub: Subscription;
  headingLevel: "h1" | "h2";
  onCheckIn: () => void;
  onKill: () => void;
  onRevive: () => void;
}) {
  const names = useServiceNames();
  const Title = headingLevel;
  const t = useT();
  const s = t.detail.summary;
  const isKilled = sub.status === "killed";
  const daysLeft = getDaysUntilBillingFor(sub);
  // 연간 구독에 "매월 결제일"이라고 적으면 1년에 한 번인 결제가 매달 있는 것처럼 읽힌다.
  // 체험 중이면 아직 청구되지 않는다. 결제 주기만 적으면 지금 나가는 돈처럼 읽힌다.
  const trialDaysLeft = getDaysUntilTrialEnd(sub);
  const billingScheduleLabel =
    sub.billingCycle !== "yearly"
      ? s.monthlyOn(sub.billingDay)
      : typeof sub.billingMonth === "number"
        ? s.yearlyOn(sub.billingMonth, sub.billingDay)
        : s.yearlyUnset;

  return (
    <div className="@container p-6 border rounded-2xl bg-card shadow-sm space-y-4">
      <div className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="w-16 h-16 shrink-0 rounded-2xl bg-secondary flex items-center justify-center">
            <ServiceLogo
              name={sub.name}
              cancelUrl={sub.cancelUrl}
              fallbackEmoji={sub.iconUrl}
              fallbackColor={sub.iconColor}
              size={44}
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Title className="min-w-0 text-2xl font-black break-keep [overflow-wrap:anywhere]">
                {names.sub(sub)}
              </Title>
              <Badge variant={isKilled ? "secondary" : "default"} className="whitespace-nowrap">
                {isKilled ? s.killed : s.active}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {s.meta(
                t.value.category[sub.category] ?? sub.category,
                sub.planName ?? null,
                sub.billingCycle === "yearly" ? s.cycleYearly : s.cycleMonthly,
              )}
            </p>
          </div>
        </div>

        <div className="@md:text-right">
          <div className="text-2xl font-extrabold text-foreground">
            <span className="text-sm font-semibold text-muted-foreground">
              {sub.billingCycle === "yearly" ? s.perYear : s.perMonth}
            </span>
            {formatCurrency(getBilledAmount(sub), sub.currency)}
          </div>
          {/* 카드에 찍히는 금액이 등록한 요금과 다른 이유를 적는다. */}
          {sub.taxRate ? (
            <div className="text-xs text-muted-foreground">
              {s.withTax(formatCurrency(sub.amount, sub.currency), sub.taxRate)}
            </div>
          ) : null}
          {sub.billingCycle === "yearly" && (
            <div className="text-xs text-muted-foreground">
              {s.monthlyEquiv(formatCurrency(getBilledAmount(sub) / 12, sub.currency))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">{billingScheduleLabel}</div>
          {trialDaysLeft !== null && (
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {s.trial(sub.trialEndsAt ?? "", formatDday(trialDaysLeft))}
            </div>
          )}
        </div>
      </div>

      {!isKilled ? (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
          <div className="text-sm font-medium">
            {s.nextBilling}
            {daysLeft === null ? (
              <span className="font-bold text-muted-foreground">{s.monthUnset}</span>
            ) : (
              <span className="font-bold text-destructive">{formatDday(daysLeft)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCheckIn}>
              {s.checkIn}
            </Button>
            <Button size="sm" variant="destructive" onClick={onKill}>
              {s.kill}
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-2 flex items-center justify-between border-t text-sm">
          <span className="text-muted-foreground">{s.killedNote}</span>
          <Button size="sm" variant="outline" onClick={onRevive}>
            {s.revive}
          </Button>
        </div>
      )}
    </div>
  );
}
