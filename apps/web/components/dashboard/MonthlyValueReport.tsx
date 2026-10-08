"use client";

import React from "react";
import { Subscription, UsageLog, getMonthlyValueSummary, formatKRW } from "@subslash/shared";
import { useT } from "@lib/i18n";
import {
  describeWastedItem,
  describeWasteSuggestion,
  describeWorthItem,
} from "@lib/i18n/value-report";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { Button } from "../ui/button";

interface MonthlyValueReportProps {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  now: Date;
  onCancelGuide: (subscriptionId: string) => void;
  onCheckIn: (subscriptionId: string) => void;
}

export function MonthlyValueReport({
  subscriptions,
  usageLogs,
  now,
  onCancelGuide,
  onCheckIn,
}: MonthlyValueReportProps) {
  const rate = useExchangeRate();
  const t = useT();
  const r = t.report;
  const month = now.getMonth() + 1;

  const active = subscriptions.filter((s) => s.status === "active");
  if (active.length === 0) {
    return null;
  }

  const summary = getMonthlyValueSummary(subscriptions, usageLogs, rate);

  return (
    <div className="flex flex-col p-5 border rounded-2xl bg-card shadow-sm w-full">
      <h3 className="text-lg font-bold mb-4">{r.title(month)}</h3>

      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <span className="text-sm font-medium text-muted-foreground">{r.totalSpend}</span>
        <span className="text-base font-bold">{formatKRW(summary.totalSpendKRW)}</span>
      </div>

      <div className="flex flex-col gap-4">
        {/* 뽕 뽑은 구독 */}
        {summary.worthItItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-emerald-500">
              <span className="text-sm font-semibold flex items-center gap-1.5">{r.worth}</span>
              <span className="text-sm font-semibold">{formatKRW(summary.worthItKRW)}</span>
            </div>
            <div className="pl-6 flex flex-col gap-1.5">
              {summary.worthItItems.map((item) => (
                <div
                  key={item.sub.id}
                  className="flex justify-between items-center text-xs text-muted-foreground"
                >
                  <span>{item.sub.name}</span>
                  <span>({describeWorthItem(t, item)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 줄일 수 있는 지출 */}
        {summary.wastedItems.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-amber-500 dark:text-amber-400">
              <span className="text-sm font-semibold flex items-center gap-1.5">{r.wasted}</span>
              <span className="text-sm font-semibold">{formatKRW(summary.wastedKRW)}</span>
            </div>
            <div className="pl-6 flex flex-col gap-1.5">
              {summary.wastedItems.map((item) => (
                <div
                  key={item.sub.id}
                  className="flex justify-between items-center text-xs text-muted-foreground"
                >
                  <span>{item.sub.name}</span>
                  <span>{describeWastedItem(t, item)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 판단 불가 */}
        {summary.unknownItems.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 opacity-70">
            <div className="flex justify-between items-center text-muted-foreground">
              <span className="text-sm font-semibold flex items-center gap-1.5">{r.unknown}</span>
              <span className="text-sm font-semibold">{formatKRW(summary.unknownKRW)}</span>
            </div>
            <div className="pl-6 flex flex-col gap-1.5">
              {summary.unknownItems.map((item) => (
                <div key={item.sub.id} className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{item.sub.name}</span>
                  <button
                    onClick={() => onCheckIn(item.sub.id)}
                    className="text-[10px] bg-secondary px-2 py-0.5 rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    {r.needsCheckIn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(summary.wasteSuggestion ||
        summary.wastedItems.length > 0 ||
        summary.unknownItems.length > 0) && (
        <div className="mt-5 pt-4 border-t flex flex-col gap-3">
          {summary.wasteSuggestion && (
            <div className="text-sm font-medium bg-secondary/50 p-3 rounded-lg flex gap-2 items-center leading-relaxed">
              <span>{describeWasteSuggestion(t, summary.wasteSuggestion)}</span>
            </div>
          )}

          <div className="flex gap-2 w-full mt-2">
            {summary.wastedItems.length > 0 && (
              <Button
                variant="destructive"
                className="flex-1 text-xs h-10"
                onClick={() => onCancelGuide(summary.wastedItems[0].sub.id)}
              >
                {r.cancelGuide}
              </Button>
            )}
            {summary.unknownItems.length > 0 && (
              <Button
                variant="outline"
                className="flex-1 text-xs h-10"
                onClick={() => onCheckIn(summary.unknownItems[0].sub.id)}
              >
                {r.checkIn}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
