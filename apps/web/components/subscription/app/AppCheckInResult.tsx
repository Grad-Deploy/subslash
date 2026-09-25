"use client";

import React from "react";
import {
  type CheckInResponse,
  type RiskLevel,
  type Subscription,
  formatCurrency,
  getBreakEvenInfo,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { Button, WRAPPING_BUTTON } from "../../ui/button";

/** 계산서와 같은 말을 쓴다(뽕 뽑은 구독 / 쉬어가도 될 구독). 색만으로 말하지 않게 늘 글자를 붙인다. */
const TONE: Record<RiskLevel, { label: string; dot: string; bar: string; text: string }> = {
  green: {
    label: "뽕 뽑는 중",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    bar: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  yellow: {
    label: "애매해요",
    dot: "bg-amber-500 dark:bg-amber-400",
    bar: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
  },
  red: {
    label: "쉬어가도 될 구독",
    dot: "bg-red-500 dark:bg-red-400",
    bar: "bg-red-500 dark:bg-red-400",
    text: "text-red-700 dark:text-red-400",
  },
};

/** '₩ 7,890'처럼 기호 뒤를 한 칸 띄운다(계산서와 같은 표기). */
function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/**
 * 앱의 체크인 결과. 웹의 결과 화면(충격 문구·배지·비유 카드·게이지 두 개·로그인 안내·버튼 셋)을
 * 한 화면에 한 가지 말만 하도록 줄였다: 상태 한 줄 → 1회당 금액 → 본전까지 막대 하나 → 할 일 하나.
 * 로그인 계정·결제 수단 안내는 해지 안내 창에 이미 있어 여기서는 뺐다.
 */
export function AppCheckInResult({
  subscription,
  count,
  result,
  onCancelGuide,
  fallbackLink,
  onClose,
}: {
  subscription: Subscription;
  count: number;
  result: CheckInResponse;
  /** 해지 안내를 연다. 없으면 fallbackLink로 서비스(또는 결제 관리)를 연다. */
  onCancelGuide?: () => void;
  fallbackLink?: { label: string; open: () => void };
  onClose: () => void;
}) {
  const tone = TONE[result.riskLevel];
  const monthly = getMyMonthlyShareAmount(subscription);
  const money = (amount: number) => spaced(formatCurrency(amount, subscription.currency));
  const breakEven = getBreakEvenInfo(monthly, count);
  const progress = Math.min(100, breakEven.progressPercent);
  const remaining = Math.max(0, breakEven.breakEvenUsage - count);

  const note =
    count === 0
      ? `최근 30일 동안 안 썼어요. 쉬어가면 한 달 ${money(monthly)}를 아껴요.`
      : result.riskLevel === "red"
        ? `쉬어가면 한 달 ${money(monthly)}를 아껴요.`
        : remaining > 0
          ? `${remaining}번 더 쓰면 본전이에요.`
          : "낸 돈 이상으로 쓰고 있어요.";

  const suggestCancel = result.riskLevel !== "green";

  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-1 text-center">
        <p className={cn("inline-flex items-center gap-1.5 text-sm font-bold", tone.text)}>
          <span className={cn("size-2 rounded-full", tone.dot)} aria-hidden />
          {tone.label}
        </p>
        <p className="text-xs text-muted-foreground">1회당</p>
        <p className="text-[40px] leading-tight font-black tracking-tight tabular-nums">
          {count === 0 ? "—" : money(result.costPerUse)}
        </p>
        <p className="text-xs text-muted-foreground">
          최근 30일 {count}회 · 한 달 {money(monthly)}
        </p>
      </div>

      <div className="space-y-2 rounded-2xl bg-secondary/60 p-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-bold">본전까지</span>
          <span className="text-muted-foreground tabular-nums">
            {Math.min(count, breakEven.breakEvenUsage)} / {breakEven.breakEvenUsage}회
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-background"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={breakEven.breakEvenUsage}
          aria-valuenow={Math.min(count, breakEven.breakEvenUsage)}
          aria-label="본전까지 사용 횟수"
        >
          <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${progress}%` }} />
        </div>
        <p className="text-sm">{note}</p>
      </div>

      <div className="space-y-2">
        {suggestCancel && onCancelGuide ? (
          <Button
            variant={result.riskLevel === "red" ? "destructive" : "default"}
            className="h-12 w-full rounded-xl text-base font-bold"
            onClick={onCancelGuide}
          >
            해지 안내 보기
          </Button>
        ) : suggestCancel && fallbackLink ? (
          <Button
            variant="outline"
            className={`${WRAPPING_BUTTON} min-h-12 rounded-xl text-sm font-bold`}
            onClick={fallbackLink.open}
          >
            {fallbackLink.label}
          </Button>
        ) : null}
        <Button
          variant={suggestCancel ? "ghost" : "default"}
          className={cn("w-full", !suggestCancel && "h-12 rounded-xl text-base font-bold")}
          onClick={onClose}
        >
          {suggestCancel ? "계속 쓸게요" : "확인"}
        </Button>
      </div>
    </div>
  );
}
