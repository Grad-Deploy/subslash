"use client";

import React from "react";
import {
  Currency,
  UsageLog,
  type ValueMetric,
  formatCurrency,
  getCheckInEvidence,
  metricOfLog,
  unitCostPart,
} from "@subslash/shared";
import { useT, type Messages } from "@lib/i18n";
import { describeQuantityText, unitCostText } from "@lib/i18n/check-in-text";

interface CheckInEvidenceProps {
  logs: UsageLog[];
  currency: Currency;
}

/** 수량만: '12', '8.5'(평균은 소수가 나올 수 있다)에 단위를 붙인다. */
function amountOf(t: Messages, metric: ValueMetric, quantity: number): string {
  if (metric === "benefit") return formatCurrency(quantity, "KRW");
  const n = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
  return t.checkin.evidence.amountOf(t.checkin.metric[metric].unit, n);
}

function describeUsageChange(t: Messages, metric: ValueMetric, delta: number): string {
  const e = t.checkin.evidence;
  if (delta > 0) return e.increased(amountOf(t, metric, delta));
  if (delta < 0) return e.decreased(amountOf(t, metric, Math.abs(delta)));
  return e.same;
}

function describeCostChange(
  t: Messages,
  metric: ValueMetric,
  delta: number,
  currency: Currency,
): string | null {
  const perUnit = t.checkin.metric[metric].perUnit;
  if (!perUnit) return null;
  const e = t.checkin.evidence;
  // 표시 단위보다 작은 차이(원 단위 아래 등)는 "그대로"로 본다.
  const shown = formatCurrency(Math.abs(delta), currency);
  if (shown === formatCurrency(0, currency)) return e.costSame(perUnit);
  return delta > 0 ? e.costUp(perUnit, shown) : e.costDown(perUnit, shown);
}

function formatCheckedAt(t: Messages, iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? t.checkin.evidence.unknownDate
    : date.toLocaleDateString(t.checkin.evidence.dateLocale, { month: "long", day: "numeric" });
}

/**
 * 구독 상세의 체크인 근거 — 해지할지 판단할 때 기댈 숫자.
 *
 * 이용 횟수는 사용자가 체크인 때 직접 적은 값이다. 앱이 실제 사용량을 재지
 * 않으므로 그렇다고 밝히고, 한 번뿐인 기록으로는 변화를 말하지 않는다.
 */
export function CheckInEvidence({ logs, currency }: CheckInEvidenceProps) {
  const t = useT();
  const e = t.checkin.evidence;
  const evidence = getCheckInEvidence(logs);
  if (!evidence) return null;

  const { recent, averageUsage, latest, change } = evidence;
  // 평균과 비교는 최근 체크인과 같은 지표끼리만 한다(getCheckInEvidence).
  const metric = metricOfLog(latest);
  const text = t.checkin.metric[metric];
  const unitCost = unitCostText(
    t,
    unitCostPart(metric, latest.costPerUse, latest.usageCount),
    currency,
  );

  return (
    <section className="p-4 border rounded-xl bg-card space-y-3" aria-label={e.label}>
      <h4 className="text-sm font-bold">{e.title}</h4>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">{e.average(recent.length)}</dt>
          <dd className="text-base font-bold text-foreground">
            {amountOf(t, metric, averageUsage)}
          </dd>
          <dd className="text-[11px] text-muted-foreground">{text.quantityLabel}</dd>
        </div>
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">{e.last(text.perUnit)}</dt>
          <dd className="text-base font-bold text-foreground">
            {text.perUnit
              ? formatCurrency(latest.costPerUse, currency)
              : (unitCost ?? describeQuantityText(t, metric, latest.usageCount))}
          </dd>
          <dd className="text-[11px] text-muted-foreground">
            {e.recorded(
              formatCheckedAt(t, latest.checkedAt),
              describeQuantityText(t, metric, latest.usageCount),
            )}
          </dd>
        </div>
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">{e.versusPrevious}</dt>
          {change ? (
            <>
              <dd className="text-base font-bold text-foreground">
                {describeUsageChange(t, metric, change.usage)}
              </dd>
              <dd className="text-[11px] text-muted-foreground">
                {describeCostChange(t, metric, change.costPerUse, currency)}
              </dd>
            </>
          ) : (
            <>
              <dd className="text-base font-bold text-muted-foreground">{e.notEnough}</dd>
              <dd className="text-[11px] text-muted-foreground">{e.notEnoughHint}</dd>
            </>
          )}
        </div>
      </dl>
      {change?.priceChanged && (
        <p className="text-[11px] text-muted-foreground">{e.priceChanged}</p>
      )}
      <p className="text-[11px] text-muted-foreground">{e.selfReported}</p>
    </section>
  );
}
