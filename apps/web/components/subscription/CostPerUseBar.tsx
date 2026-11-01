import React from "react";
import { Progress } from "../ui/progress";
import { Currency, formatCurrency, getRiskLevel } from "@subslash/shared";
import { useT } from "@lib/i18n";

interface CostPerUseBarProps {
  costPerUse: number;
  /**
   * 1회당 단가를 계산할 때 나눈 것과 같은 값 — 한 달치 내 몫(구독 통화).
   * 연 결제액이나 나누기 전 전체 금액을 넣으면, 막대와 문구가 1회당 단가와
   * 다른 기준을 말하게 된다.
   */
  monthlyAmount: number;
  currency: Currency;
  usageCount: number;
}

/**
 * 1회당 비용 비중(`ratio`)과 위험도 기준 색상(`variant`).
 *
 * - 막대 길이(`ratio`)는 월 부담금 대비 1회 단가 비중(`costPerUse / monthlyAmount`, 1회 100% → 2회 50% → 4회 25% → 10회 10%)을
 *   점진적으로 나타낸다(0회 이용 시에는 한 달 부담금이 그대로 남아 100%, 0원 구독은 금전 부담이 없어 0%).
 * - 막대 색상(`variant`)은 이와 별개로 `getRiskLevel`(`GOOD_AT.uses` 4회 목표 기준: 0~1회 빨강, 2~3회 노랑, 4회 이상 초록)을 따른다.
 */
export function getCostPerUseBarState(
  costPerUse: number,
  monthlyAmount: number,
  usageCount: number,
): { ratio: number; variant: "destructive" | "warning" | "success" } {
  const ratio =
    monthlyAmount <= 0
      ? 0
      : usageCount <= 0
        ? 100
        : Math.min(100, Math.max(0, Math.round((costPerUse / monthlyAmount) * 100)));
  const risk = getRiskLevel(costPerUse, monthlyAmount, usageCount);
  const variant = risk === "red" ? "destructive" : risk === "yellow" ? "warning" : "success";
  return { ratio, variant };
}

export function CostPerUseBar({
  costPerUse,
  monthlyAmount,
  currency,
  usageCount,
}: CostPerUseBarProps) {
  const b = useT().checkin.bar;
  const { ratio, variant } = getCostPerUseBarState(costPerUse, monthlyAmount, usageCount);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-muted-foreground">{b.label}</span>
        <span className="text-xl font-bold">{formatCurrency(costPerUse, currency)}</span>
      </div>

      <Progress value={ratio} variant={variant} className="h-3" />

      <div className="text-xs text-center text-muted-foreground">
        {b.footer(usageCount, formatCurrency(monthlyAmount, currency))}
      </div>
    </div>
  );
}
