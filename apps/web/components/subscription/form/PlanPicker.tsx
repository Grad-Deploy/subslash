"use client";

import {
  ServicePreset,
  type ServicePlan,
  formatAmount,
  planCurrency,
  yearlyDiscountOf,
} from "@subslash/shared";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * 요금제가 여럿인 서비스의 요금제 고르기. 등록할 때는 반드시 고르게 한다 — 하나를 미리 골라
 * 두면 손대지 않은 사람의 요금이 그 요금제로 저장된다. 고른 요금제는 가격 확인의 기준이 된다.
 */
export function PlanPicker({
  preset,
  plans,
  selectedPlanId,
  required,
  onPick,
}: {
  preset: ServicePreset;
  plans: ServicePlan[];
  selectedPlanId?: string;
  required: boolean;
  onPick: (plan: ServicePlan) => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className={`${FIELD_LABEL} mb-1.5`}>요금제</legend>
      <div className="grid grid-cols-2 gap-2">
        {plans.map((plan) => {
          const checked = selectedPlanId === plan.id;
          const currency = planCurrency(preset, plan);
          const discount = yearlyDiscountOf(preset, plan);
          return (
            <label
              key={plan.id}
              className={`relative cursor-pointer rounded-xl border p-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                checked
                  ? "border-primary bg-primary/5"
                  : "bg-card hover:border-primary/40 hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="planId"
                value={plan.id}
                checked={checked}
                onChange={() => onPick(plan)}
                required={required}
                className="sr-only"
              />
              <span className="block text-xs font-bold">{plan.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {(plan.billingCycle ?? "monthly") === "yearly" ? "연" : "월"}{" "}
                {formatAmount(plan.amount, currency)}
              </span>
              {discount && (
                <span className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  월 {formatAmount(plan.amount / 12, currency)}꼴 · 월 결제보다 연{" "}
                  {formatAmount(discount.saved, currency)} 적게 ({discount.percent}%)
                </span>
              )}
            </label>
          );
        })}
      </div>
      {preset.priceNote && <p className="text-[11px] text-muted-foreground">{preset.priceNote}</p>}
    </fieldset>
  );
}
