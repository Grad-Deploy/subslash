"use client";

import React, { useState } from "react";
import {
  findPresetForSubscription,
  formatCurrency,
  getPlanAlternatives,
  planFormData,
  type PlanAlternative,
  type Subscription,
} from "@subslash/shared";
import { ArrowDownRight } from "lucide-react";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";

interface PlanAlternativesProps {
  subscription: Subscription;
  /** 요금제를 바꿨다고 기록한 뒤. 토스트를 띄우거나 창을 닫는 데 쓴다. */
  onChanged?: (message: string) => void;
  /** 해지 가이드 안에서는 제목을 줄이고 대안이 없으면 통째로 숨긴다. */
  compact?: boolean;
  className?: string;
}

function cycleLabel(alternative: Pick<PlanAlternative, "billingCycle">): string {
  return alternative.billingCycle === "yearly" ? "연" : "월";
}

/**
 * 해지 대신 — 같은 서비스의 더 싼 요금제·연 결제(utils/planAlternatives).
 *
 * 금액은 요금표 가격이다. 요금제마다 광고·화질·기능이 다른데 앱은 그 차이를 적어 두지 않았으므로,
 * 무엇이 빠지는지는 서비스에서 확인하라고 적는다. '바꿨어요'는 사용자가 서비스에서 바꾼 뒤 누르는
 * 기록이다 — 앱이 요금제를 바꿔 주는 것이 아니다.
 */
export function PlanAlternatives({
  subscription: sub,
  onChanged,
  compact = false,
  className,
}: PlanAlternativesProps) {
  const updateSubscription = useStore((state) => state.updateSubscription);
  const logs = useStore((state) => state.usageLogs);
  const [pending, setPending] = useState<PlanAlternative | null>(null);

  const result = getPlanAlternatives(sub, logs);
  if (result.state === "none") return null;
  if (result.state === "plan-unknown") {
    if (compact) return null;
    return (
      <section className={cn("p-4 border rounded-2xl bg-card space-y-1 text-xs", className)}>
        <h3 className="text-sm font-bold">해지 대신 요금제를 낮출 수도 있어요</h3>
        <p className="text-muted-foreground leading-relaxed">
          이 서비스에는 요금제가 {result.planCount}개 있어요. &lsquo;정보 수정&rsquo;에서 지금 쓰는
          요금제를 고르면 더 싼 요금제와 비교해 드려요.
        </p>
      </section>
    );
  }

  const { current, alternatives, usage, shared, taxExcluded } = result;
  if (alternatives.length === 0 && compact) return null;

  const apply = (alternative: PlanAlternative) => {
    const preset = findPresetForSubscription(sub);
    const plan = preset?.plans?.find((candidate) => candidate.id === alternative.planId);
    if (!preset || !plan) return;
    const toYearly = alternative.billingCycle === "yearly" && sub.billingCycle !== "yearly";
    updateSubscription(sub.id, {
      ...planFormData(preset, plan),
      // 연 결제로 바꾼 날 결제됐을 수도, 아닐 수도 있다. 결제 월을 짐작해 채우지 않고 비워 둔다 —
      // 행동 큐가 '결제 월 입력'을 묻는다.
      ...(toYearly ? { billingMonth: undefined } : {}),
    });
    setPending(null);
    onChanged?.(
      toYearly
        ? `${alternative.planName}(으)로 기록했어요. 결제 월을 '정보 수정'에서 적어 주세요.`
        : `${alternative.planName}(으)로 기록했어요`,
    );
  };

  return (
    <section className={cn("p-4 border rounded-2xl bg-card space-y-3", className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold">
          {compact ? "해지 전에: 더 싼 방법" : "해지 대신 할 수 있는 것"}
        </h3>
        <p className="text-xs text-muted-foreground">
          지금 {current.planName} · {cycleLabel(current)}{" "}
          {formatCurrency(current.amount, current.currency)}
          {current.costPerUse !== null &&
            ` · 1회 ${formatCurrency(current.costPerUse, current.currency)}`}
        </p>
      </div>

      {alternatives.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          이미 이 서비스에서 가장 싼 요금제예요. 더 줄이려면 해지뿐이에요.
        </p>
      ) : (
        <ul className="space-y-2">
          {alternatives.map((alternative) => (
            <li key={alternative.planId} className="p-3 border rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {alternative.kind === "yearly" ? "연 결제로 바꾸기" : alternative.planName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {alternative.kind === "yearly" && `${alternative.planName} · `}
                    {cycleLabel(alternative)}{" "}
                    {formatCurrency(alternative.amount, alternative.currency)}
                    {alternative.billingCycle === "yearly" &&
                      ` (월 ${formatCurrency(alternative.monthlyAmount, alternative.currency)}꼴)`}
                    {alternative.costPerUse !== null &&
                      ` · 1회 ${formatCurrency(alternative.costPerUse, alternative.currency)}`}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <ArrowDownRight className="size-4" aria-hidden />
                    {formatCurrency(alternative.yearlySaving, alternative.currency)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">1년에 덜 내요</div>
                </div>
              </div>

              {pending?.planId === alternative.planId ? (
                <InlineConfirm
                  message={`서비스에서 ${alternative.planName}(으)로 바꿨나요? 금액과 요금제를 이걸로 고쳐 둘게요.`}
                  confirmText="바꿨어요"
                  onConfirm={() => apply(alternative)}
                  onCancel={() => setPending(null)}
                />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setPending(alternative)}
                >
                  이 요금제로 바꿨어요
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        요금표 가격끼리 비교했어요
        {taxExcluded ? "(세금은 두 쪽에 똑같이 붙어요)" : ""}. 요금제마다 광고·화질·기능이 달라요 —
        무엇이 빠지는지는 서비스에서 확인하세요.
        {shared && " 나눠 내는 구독이라 금액은 카드에 찍히는 전체 요금이에요."}
        {usage === null && " 최근 30일 안에 체크인하면 1회 단가도 함께 보여 드려요."}
      </p>
    </section>
  );
}
