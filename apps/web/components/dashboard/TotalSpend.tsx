"use client";

import React, { useEffect, useState } from "react";
import {
  CATEGORY_LABELS,
  Subscription,
  type SubscriptionCategory,
  formatKRW,
  isShared,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import { Card, CardContent } from "../ui/card";
import { useExchangeRate } from "../../hooks/useExchangeRate";

/** 이름을 적어 보여줄 분류 수. 나머지는 '외 N개 분류'로 묶는다. */
const BREAKDOWN_LIMIT = 3;

export function TotalSpend({ subscriptions }: { subscriptions: Subscription[] }) {
  const rate = useExchangeRate();
  const active = subscriptions.filter((sub) => sub.status === "active");
  // The headline is what leaves this user's pocket; the card charge is shown
  // underneath only when a shared plan makes the two differ.
  const total = sumMyMonthlyKRW(active, rate);
  const billed = sumMonthlyKRW(active, rate);
  const sharedCount = active.filter(isShared).length;
  const [displayTotal, setDisplayTotal] = useState(0);

  // 분류별 내 몫. 예전에는 구독과 상관없이 'OTT · 음악 · 유틸리티'를 늘 똑같이 찍어서,
  // 음악 구독이 없는 사람에게도 음악이 지출에 들어 있는 것처럼 보였다.
  const byCategory = new Map<SubscriptionCategory, Subscription[]>();
  for (const sub of active) {
    byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
  }
  const breakdown = [...byCategory.entries()]
    .map(([category, subs]) => ({ category, amount: sumMyMonthlyKRW(subs, rate) }))
    .sort((a, b) => b.amount - a.amount);

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
    // 테마 색 변수로 칠한다. 예전에는 라이트 모드에서도 이 카드만 남색으로 칠해져 대시보드에서 따로 놀았다.
    // 금액을 강조하는 옅은 그라데이션은 라이트·다크 모두 테마 색 안에서 둔다.
    <Card className="bg-gradient-to-br from-secondary to-card">
      <CardContent className="pt-6">
        <div className="text-sm font-medium text-muted-foreground mb-2">월 고정지출</div>
        <div className="text-4xl font-bold text-foreground">{formatKRW(displayTotal)}</div>
        {sharedCount > 0 && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            공유 구독 {sharedCount}건 반영 · 카드 청구액은 월 {formatKRW(billed)}
          </div>
        )}
        {breakdown.length > 0 && (
          <ul
            className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
            aria-label="분류별 월 지출"
          >
            {breakdown.slice(0, BREAKDOWN_LIMIT).map(({ category, amount }) => (
              <li key={category} className="whitespace-nowrap">
                {CATEGORY_LABELS[category] ?? category} {formatKRW(amount)}
              </li>
            ))}
            {breakdown.length > BREAKDOWN_LIMIT && (
              <li className="whitespace-nowrap">외 {breakdown.length - BREAKDOWN_LIMIT}개 분류</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
