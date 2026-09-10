"use client";

import React, { useEffect, useState } from "react";
import {
  Subscription,
  formatCurrency,
  getSavingsEquivalent,
  sumMyAnnualKRW,
  sumMyYearDefendedKRW,
} from "@subslash/shared";
import { Card, CardContent } from "../ui/card";
import { useExchangeRate } from "../../hooks/useExchangeRate";

export function SavingsPot({ killedSubscriptions }: { killedSubscriptions: Subscription[] }) {
  const rate = useExchangeRate();
  const currentYear = new Date().getFullYear();
  // Cancelling a plan split four ways saves the user a quarter, not all of it.
  const annualSavings = sumMyAnnualKRW(killedSubscriptions, rate);
  const yearDefendedSavings = sumMyYearDefendedKRW(killedSubscriptions, currentYear, rate);
  const equivalents = getSavingsEquivalent(annualSavings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || killedSubscriptions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 dark:from-green-950 dark:to-emerald-900">
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">방어 성공! 💰</h3>
        <div className="flex flex-wrap items-baseline gap-2 mb-2">
          <div className="text-3xl font-black text-green-600 dark:text-green-400">
            연 ₩{annualSavings.toLocaleString()} 절약
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100">
            {currentYear}년 실질 방어 ₩{yearDefendedSavings.toLocaleString()}
          </span>
        </div>
        <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-4 bg-white/50 dark:bg-black/20 p-2 rounded-md">
          {equivalents[0] || "이 돈으로 더 가치있는 곳에 쓸 수 있어요!"}
        </p>

        <div className="space-y-2 mt-4">
          <div className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase">
            해지된 구독
          </div>
          {killedSubscriptions.map((sub) => (
            <div
              key={sub.id}
              className="flex justify-between items-center text-sm border-b border-green-200 dark:border-green-800 pb-1"
            >
              <span>{sub.name}</span>
              <span className="font-mono text-gray-500 line-through">
                {formatCurrency(sub.amount, sub.currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
