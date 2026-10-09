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
import { useServiceNames, useT } from "@lib/i18n";

interface PlanAlternativesProps {
  subscription: Subscription;
  /** 요금제를 바꿨다고 기록한 뒤. 토스트를 띄우거나 창을 닫는 데 쓴다. */
  onChanged?: (message: string) => void;
  /** 해지 가이드 안에서는 제목을 줄이고 대안이 없으면 통째로 숨긴다. */
  compact?: boolean;
  className?: string;
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
  const t = useT().detail.alt;
  const names = useServiceNames();
  const cycleLabel = (alternative: Pick<PlanAlternative, "billingCycle">) =>
    alternative.billingCycle === "yearly" ? t.cycleYearly : t.cycleMonthly;
  const updateSubscription = useStore((state) => state.updateSubscription);
  const logs = useStore((state) => state.usageLogs);
  const [pending, setPending] = useState<PlanAlternative | null>(null);

  const result = getPlanAlternatives(sub, logs);
  if (result.state === "none") return null;
  if (result.state === "plan-unknown") {
    if (compact) return null;
    return (
      <section className={cn("p-4 border rounded-2xl bg-card space-y-1 text-xs", className)}>
        <h3 className="text-sm font-bold">{t.unknownTitle}</h3>
        <p className="text-muted-foreground leading-relaxed">{t.unknownBody(result.planCount)}</p>
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
        ? t.recordedYearly(names.plan(alternative.planName))
        : t.recorded(names.plan(alternative.planName)),
    );
  };

  return (
    <section className={cn("p-4 border rounded-2xl bg-card space-y-3", className)}>
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold">{compact ? t.titleCompact : t.title}</h3>
        <p className="text-xs text-muted-foreground">
          {t.nowOn(
            names.plan(current.planName),
            cycleLabel(current),
            formatCurrency(current.amount, current.currency),
            current.costPerUse !== null
              ? formatCurrency(current.costPerUse, current.currency)
              : null,
          )}
        </p>
      </div>

      {alternatives.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t.cheapest}</p>
      ) : (
        <ul className="space-y-2">
          {alternatives.map((alternative) => (
            <li key={alternative.planId} className="p-3 border rounded-xl bg-muted/30 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {alternative.kind === "yearly" ? t.toYearly : names.plan(alternative.planName)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {alternative.kind === "yearly" && `${names.plan(alternative.planName)} · `}
                    {t.line(
                      cycleLabel(alternative),
                      formatCurrency(alternative.amount, alternative.currency),
                      alternative.billingCycle === "yearly"
                        ? formatCurrency(alternative.monthlyAmount, alternative.currency)
                        : null,
                      alternative.costPerUse !== null
                        ? formatCurrency(alternative.costPerUse, alternative.currency)
                        : null,
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    <ArrowDownRight className="size-4" aria-hidden />
                    {formatCurrency(alternative.yearlySaving, alternative.currency)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{t.saves}</div>
                </div>
              </div>

              {pending?.planId === alternative.planId ? (
                <InlineConfirm
                  message={t.confirm(names.plan(alternative.planName))}
                  confirmText={t.confirmYes}
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
                  {t.switched}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {t.footerBase(taxExcluded)}
        {shared && t.footerShared}
        {usage === null && t.footerNoUsage}
      </p>
    </section>
  );
}
