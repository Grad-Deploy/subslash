"use client";

import React, { useEffect, useState } from "react";
import {
  Subscription,
  formatKRW,
  isShared,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import { Card, CardContent } from "../ui/card";
import { useExchangeRate } from "../../hooks/useExchangeRate";

export function TotalSpend({ subscriptions }: { subscriptions: Subscription[] }) {
  const rate = useExchangeRate();
  const active = subscriptions.filter((sub) => sub.status === "active");
  // The headline is what leaves this user's pocket; the card charge is shown
  // underneath only when a shared plan makes the two differ.
  const total = sumMyMonthlyKRW(active, rate);
  const billed = sumMonthlyKRW(active, rate);
  const sharedCount = active.filter(isShared).length;
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.max(Math.floor(total / 20), 1);
    const timer = setInterval(() => {
      current += step;
      if (current >= total) {
        setDisplayTotal(total);
        clearInterval(timer);
      } else {
        setDisplayTotal(current);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-slate-300 mb-2">월 고정지출</div>
        <div className="text-4xl font-bold">{formatKRW(displayTotal)}</div>
        {sharedCount > 0 && (
          <div className="mt-1.5 text-xs text-slate-300">
            공유 구독 {sharedCount}건 반영 · 카드 청구액은 월 {formatKRW(billed)}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <div className="flex items-center text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span> OTT
          </div>
          <div className="flex items-center text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 mr-1"></span> 음악
          </div>
          <div className="flex items-center text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span> 유틸리티
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
