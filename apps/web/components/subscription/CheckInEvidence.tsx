"use client";

import React from "react";
import { Currency, UsageLog, formatCurrency, getCheckInEvidence } from "@subslash/shared";

interface CheckInEvidenceProps {
  logs: UsageLog[];
  currency: Currency;
}

function formatUses(count: number): string {
  return `${Number.isInteger(count) ? count : count.toFixed(1)}회`;
}

function describeUsageChange(delta: number): string {
  if (delta > 0) return `${delta}회 늘었음`;
  if (delta < 0) return `${Math.abs(delta)}회 줄었음`;
  return "이용 횟수 그대로";
}

function describeCostChange(delta: number, currency: Currency): string {
  // 표시 단위보다 작은 차이(원 단위 아래 등)는 "그대로"로 본다.
  const shown = formatCurrency(Math.abs(delta), currency);
  if (shown === formatCurrency(0, currency)) return "1회당 비용 그대로";
  return delta > 0 ? `1회당 ${shown} 비싸짐` : `1회당 ${shown} 싸짐`;
}

function formatCheckedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "날짜 모름"
    : date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

/**
 * 구독 상세의 체크인 근거 — 해지할지 판단할 때 기댈 숫자.
 *
 * 이용 횟수는 사용자가 체크인 때 직접 적은 값이다. 앱이 실제 사용량을 재지
 * 않으므로 그렇다고 밝히고, 한 번뿐인 기록으로는 변화를 말하지 않는다.
 */
export function CheckInEvidence({ logs, currency }: CheckInEvidenceProps) {
  const evidence = getCheckInEvidence(logs);
  if (!evidence) return null;

  const { recent, averageUsage, latest, change } = evidence;

  return (
    <section className="p-4 border rounded-xl bg-card space-y-3" aria-label="체크인 근거">
      <h4 className="text-sm font-bold">📈 체크인으로 본 근거</h4>
      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">최근 {recent.length}회 체크인 평균</dt>
          <dd className="text-base font-bold text-foreground">{formatUses(averageUsage)}</dd>
          <dd className="text-[11px] text-muted-foreground">30일 동안 이용한 횟수</dd>
        </div>
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">마지막 체크인 1회당</dt>
          <dd className="text-base font-bold text-foreground">
            {formatCurrency(latest.costPerUse, currency)}
          </dd>
          <dd className="text-[11px] text-muted-foreground">
            {formatCheckedAt(latest.checkedAt)} 기록 · {latest.usageCount}회 이용
          </dd>
        </div>
        <div className="p-3 rounded-lg bg-muted/60 space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">직전 체크인 대비</dt>
          {change ? (
            <>
              <dd className="text-base font-bold text-foreground">
                {describeUsageChange(change.usage)}
              </dd>
              <dd className="text-[11px] text-muted-foreground">
                {describeCostChange(change.costPerUse, currency)}
              </dd>
            </>
          ) : (
            <>
              <dd className="text-base font-bold text-muted-foreground">비교할 기록 부족</dd>
              <dd className="text-[11px] text-muted-foreground">
                체크인이 한 번 더 쌓이면 비교합니다
              </dd>
            </>
          )}
        </div>
      </dl>
      {change?.priceChanged && (
        <p className="text-[11px] text-muted-foreground">
          두 체크인 사이에 요금(내 몫)이 바뀌어, 1회당 변화에는 요금 변화도 섞여 있습니다.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        이용 횟수는 체크인 때 직접 적은 값입니다. 앱이 실제 사용량을 재지는 않습니다.
      </p>
    </section>
  );
}
