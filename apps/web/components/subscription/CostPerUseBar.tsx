import React from "react";
import { Progress } from "../ui/progress";
import { Currency, formatCurrency } from "@subslash/shared";

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

export function CostPerUseBar({
  costPerUse,
  monthlyAmount,
  currency,
  usageCount,
}: CostPerUseBarProps) {
  const ratio =
    usageCount === 0 || monthlyAmount <= 0
      ? 100
      : Math.min(100, (costPerUse / monthlyAmount) * 100 * 5);
  const variant = usageCount === 0 ? "destructive" : ratio > 30 ? "warning" : "success";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-medium text-muted-foreground">1회 이용당 비용</span>
        <span className="text-xl font-bold">{formatCurrency(costPerUse, currency)}</span>
      </div>

      <Progress value={ratio} variant={variant} className="h-3" />

      <div className="text-xs text-center text-muted-foreground">
        총 {usageCount}회 이용 · 월 {formatCurrency(monthlyAmount, currency)} 기준
      </div>
    </div>
  );
}
