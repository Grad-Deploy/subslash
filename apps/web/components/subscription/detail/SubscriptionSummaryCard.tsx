"use client";

import React from "react";
import {
  CATEGORY_LABELS,
  formatCurrency,
  formatDday,
  getBilledAmount,
  getDaysUntilBillingFor,
  getDaysUntilTrialEnd,
  type Subscription,
} from "@subslash/shared";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
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
  const Title = headingLevel;
  const isKilled = sub.status === "killed";
  const daysLeft = getDaysUntilBillingFor(sub);
  // 연간 구독에 "매월 결제일"이라고 적으면 1년에 한 번인 결제가 매달 있는 것처럼 읽힌다.
  // 체험 중이면 아직 청구되지 않는다. 결제 주기만 적으면 지금 나가는 돈처럼 읽힌다.
  const trialDaysLeft = getDaysUntilTrialEnd(sub);
  const billingScheduleLabel =
    sub.billingCycle !== "yearly"
      ? `매월 ${sub.billingDay}일 결제`
      : typeof sub.billingMonth === "number"
        ? `매년 ${sub.billingMonth}월 ${sub.billingDay}일 결제`
        : "연간 결제 · 결제 월 미설정";

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
                {sub.name}
              </Title>
              <Badge variant={isKilled ? "secondary" : "default"} className="whitespace-nowrap">
                {isKilled ? "해지 완료" : "구독 중"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              카테고리: {CATEGORY_LABELS[sub.category] ?? sub.category}
              {sub.planName ? ` · 요금제: ${sub.planName}` : ""} · 결제 주기:{" "}
              {sub.billingCycle === "yearly" ? "매년" : "매월"}
            </p>
          </div>
        </div>

        <div className="@md:text-right">
          <div className="text-2xl font-extrabold text-foreground">
            <span className="text-sm font-semibold text-muted-foreground">
              {sub.billingCycle === "yearly" ? "연 " : "월 "}
            </span>
            {formatCurrency(getBilledAmount(sub), sub.currency)}
          </div>
          {/* 카드에 찍히는 금액이 등록한 요금과 다른 이유를 적는다. */}
          {sub.taxRate ? (
            <div className="text-xs text-muted-foreground">
              요금 {formatCurrency(sub.amount, sub.currency)} + 부가세 {sub.taxRate}%
            </div>
          ) : null}
          {sub.billingCycle === "yearly" && (
            <div className="text-xs text-muted-foreground">
              월 {formatCurrency(getBilledAmount(sub) / 12, sub.currency)}꼴
            </div>
          )}
          <div className="text-xs text-muted-foreground">{billingScheduleLabel}</div>
          {trialDaysLeft !== null && (
            <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              무료 체험 중 · {sub.trialEndsAt} 종료({formatDday(trialDaysLeft)}) · 그때까지 지출에서
              빼요
            </div>
          )}
        </div>
      </div>

      {!isKilled ? (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
          <div className="text-sm font-medium">
            다음 결제까지:{" "}
            {daysLeft === null ? (
              <span className="font-bold text-muted-foreground">결제 월 미설정</span>
            ) : (
              <span className="font-bold text-destructive">{formatDday(daysLeft)}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCheckIn}>
              이용 횟수 체크인
            </Button>
            <Button size="sm" variant="destructive" onClick={onKill}>
              지금 해지하기
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-2 flex items-center justify-between border-t text-sm">
          <span className="text-muted-foreground">해지한 구독입니다.</span>
          <Button size="sm" variant="outline" onClick={onRevive}>
            다시 구독 중으로 변경
          </Button>
        </div>
      )}
    </div>
  );
}
