"use client";

import React from "react";
import {
  Subscription,
  formatKRW,
  getKillCheckStatus,
  getMonthOverMonthDefended,
  splitThisMonthDefendedKRW,
} from "@subslash/shared";
import { useExchangeRate } from "../../hooks/useExchangeRate";

interface MonthlyDefenseWidgetProps {
  killedSubscriptions: Subscription[];
}

/**
 * 이번 달 결제일 현황.
 *
 * 예전에는 이번 달 결제일이 아직 오지 않았어도 "{month}월 지출 방어 성공"으로
 * 셌다. 결제일이 지나간 것과 남은 것을 나눈다. 결제가 실제로 멈췄는지는 여기서
 * 따지지 않으므로 '지킨 돈'이라고 부르지 않는다 — 그건 절약 현황 맨 위 칸의
 * 몫이다. 결제 월을 모르는 연간 구독은 합계에 넣지 않고 몇 건인지만 알린다.
 */
export function MonthlyDefenseWidget({ killedSubscriptions }: MonthlyDefenseWidgetProps) {
  const rate = useExchangeRate();
  const now = new Date();
  const month = now.getMonth() + 1;

  if (killedSubscriptions.length === 0) return null;

  const { passed, upcoming, unknownCount } = splitThisMonthDefendedKRW(
    killedSubscriptions,
    now,
    rate,
  );
  const comparison = getMonthOverMonthDefended(killedSubscriptions, rate, now);
  const hasUnverified = killedSubscriptions.some(
    (sub) => getKillCheckStatus(sub, now)?.state === "due",
  );

  return (
    <section
      aria-labelledby="month-billing-heading"
      className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
    >
      <h3 id="month-billing-heading" className="font-bold text-base">
        🗓️ {month}월 결제일 현황
      </h3>

      <dl className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/60">
          <dt className="text-[11px] text-muted-foreground">해지 뒤 지나간 결제일</dt>
          <dd className="text-lg font-bold text-foreground">{formatKRW(passed)}</dd>
        </div>
        <div className="p-3 rounded-xl bg-muted/60">
          <dt className="text-[11px] text-muted-foreground">남은 결제일 (해지를 유지하면)</dt>
          <dd className="text-lg font-bold text-foreground">{formatKRW(upcoming)}</dd>
        </div>
      </dl>

      {passed === 0 && upcoming === 0 && (
        <p className="text-xs text-muted-foreground">
          이번 달에는 해지 뒤에 돌아오는 결제일이 없습니다.
        </p>
      )}

      {(comparison.current.amount > 0 || comparison.previous.amount > 0) && (
        <MonthOverMonthLine
          currentMonth={comparison.current.month}
          previousMonth={comparison.previous.month}
          current={comparison.current.amount}
          previous={comparison.previous.amount}
          change={comparison.change}
        />
      )}

      {hasUnverified && (
        <p className="text-[11px] text-muted-foreground">
          결제가 멈췄는지 아직 확인하지 않은 해지도 들어 있습니다. 확인된 금액은 위 &lsquo;지킨
          돈&rsquo;에 있습니다.
        </p>
      )}

      {unknownCount > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          ⚠️ 결제 월을 모르는 연간 구독 {unknownCount}건은 이번 달 결제 여부를 알 수 없어 합계에서
          빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.
        </p>
      )}
    </section>
  );
}

/**
 * 지난달과 비교한 한 줄. 두 달 모두 '해지로 막는 결제'의 합이다 — 이번 달은 남은
 * 결제일까지 포함한다(해지를 유지하면 나가지 않을 돈). 연간 구독은 결제 월에만
 * 잡혀서, 달마다 크게 오르내리는 것이 정상이다.
 */
function MonthOverMonthLine({
  currentMonth,
  previousMonth,
  current,
  previous,
  change,
}: {
  currentMonth: number;
  previousMonth: number;
  current: number;
  previous: number;
  change: number;
}) {
  const verdict =
    change > 0
      ? `지난달보다 ${formatKRW(change)} 더 막습니다`
      : change < 0
        ? `지난달보다 ${formatKRW(-change)} 적습니다`
        : "지난달과 같습니다";

  return (
    <p className="text-xs text-muted-foreground">
      해지로 막는 결제: {currentMonth}월 {formatKRW(current)} · {previousMonth}월{" "}
      {formatKRW(previous)} —{" "}
      <span
        className={
          change > 0
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : "font-semibold text-foreground"
        }
      >
        {verdict}
      </span>
    </p>
  );
}
