"use client";

import React from "react";
import Link from "next/link";
import {
  Subscription,
  formatCurrency,
  formatDday,
  getBilledAmount,
  getDaysUntilBillingFor,
} from "@subslash/shared";

const LIMIT = 5;

/**
 * 곧 카드에 청구될 결제를 가까운 순으로 보여준다.
 *
 * 금액은 카드에 실제로 청구되는 값(공유 구독이면 나누기 전 전체, 연간이면 1년치, 세금이 따로
 * 붙으면 그것까지)이다.
 * 결제 월을 모르는 연간 구독은 날짜를 지어내지 않고 '미설정'으로 따로 센다.
 */
export function UpcomingBilling({
  subscriptions,
  now,
}: {
  subscriptions: Subscription[];
  now: Date;
}) {
  const active = subscriptions.filter((sub) => sub.status === "active");
  if (active.length === 0) return null;

  const known: { sub: Subscription; days: number }[] = [];
  let unknownCount = 0;
  for (const sub of active) {
    const days = getDaysUntilBillingFor(sub, now);
    if (days === null) unknownCount += 1;
    else known.push({ sub, days });
  }
  known.sort((a, b) => a.days - b.days);

  return (
    <section
      aria-labelledby="upcoming-billing"
      className="p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="upcoming-billing" className="text-sm font-bold">
          다가오는 결제
        </h2>
        <Link href="/subs" className="text-xs text-muted-foreground hover:text-foreground">
          전체 보기 →
        </Link>
      </div>

      {known.length === 0 ? (
        <p className="text-xs text-muted-foreground">결제일을 아는 구독이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {known.slice(0, LIMIT).map(({ sub, days }) => (
            <li key={sub.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">{sub.iconUrl || "📦"}</span>
                <span className="truncate">{sub.name}</span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={
                    days <= 3
                      ? "font-mono text-xs font-bold text-rose-600 dark:text-rose-400"
                      : "font-mono text-xs font-bold"
                  }
                >
                  {formatDday(days)}
                </span>{" "}
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(getBilledAmount(sub), sub.currency)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {known.length > LIMIT && (
        <p className="text-xs text-muted-foreground">
          외 {known.length - LIMIT}건은 내 구독에서 볼 수 있습니다.
        </p>
      )}
      {unknownCount > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          결제 월 미설정 {unknownCount}건 — 연간 구독의 결제 월을 적으면 여기에 나옵니다.
        </p>
      )}
    </section>
  );
}
