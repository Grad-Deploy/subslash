"use client";

import React, { useState } from "react";
import { Subscription, formatKRW, getYearDefendedSeries } from "@subslash/shared";
import { cn } from "../../lib/utils";
import { niceCeil } from "@lib/chart-scale";
import { useT } from "@lib/i18n";

interface MonthlyDefenseChartProps {
  killedSubscriptions: Subscription[];
  exchangeRate: number;
}

/**
 * 막대 색. 같은 에메랄드의 두 단계로, 표면색 대비와 단계 차이를 dataviz 검증기로
 * 확인했다(밝은 모드 700/500, 어두운 모드 400/600). 색만으로 구분하지 않도록
 * 읽기 칸·표·범례에 '막음'과 '예정'을 글자로 함께 적는다.
 */
const DEFENDED = "bg-emerald-700 dark:bg-emerald-400";
const SCHEDULED = "bg-emerald-500 dark:bg-emerald-600";

/**
 * 올해 달마다 해지 덕분에 빠져나가지 않은 금액.
 *
 * 이번 달까지는 결제일 기준으로 막은 결제이고, 남은 달은 "해지하지 않았다면
 * 나갔을 예정"이다. 둘을 같은 막대로 그리면 연말까지의 예정액을 이미 아낀 돈처럼
 * 읽게 되므로 색의 단계와 글자로 나눈다.
 *
 * 결제가 실제로 멈췄는지는 따지지 않으므로 '지킨 돈'이라고 부르지 않는다. 확인된
 * 금액은 절약 현황 맨 위 칸(`getSavingsTiers`)이 보여준다.
 */
export function MonthlyDefenseChart({
  killedSubscriptions,
  exchangeRate,
}: MonthlyDefenseChartProps) {
  const d = useT().savings.defense;
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [activeMonth, setActiveMonth] = useState(currentMonth);

  if (killedSubscriptions.length === 0) return null;

  const series = getYearDefendedSeries(killedSubscriptions, year, exchangeRate, now);
  const scaleMax = niceCeil(Math.max(...series.months.map((m) => m.amount)));
  const active = series.months[activeMonth - 1];
  const pastLabel = d.past(currentMonth);

  return (
    <section
      className="p-5 border rounded-2xl bg-card shadow-sm space-y-4"
      aria-labelledby="monthly-defense-title"
    >
      <div className="space-y-1">
        <h3 id="monthly-defense-title" className="font-bold text-base flex items-center gap-1.5">
          {d.title(year)}
        </h3>
        <p className="text-xs text-muted-foreground">{d.intro}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/60">
          <dt className="text-[11px] text-muted-foreground">{pastLabel}</dt>
          <dd className="text-lg font-bold text-foreground">{formatKRW(series.pastAmount)}</dd>
        </div>
        <div className="p-3 rounded-xl bg-muted/60">
          <dt className="text-[11px] text-muted-foreground">{d.future(currentMonth)}</dt>
          <dd className="text-lg font-bold text-foreground">{formatKRW(series.scheduledAmount)}</dd>
        </div>
      </dl>

      {scaleMax === 0 ? (
        <p className="p-4 border border-dashed rounded-xl text-xs text-muted-foreground">
          {d.empty}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-[3px]", DEFENDED)} aria-hidden />
              {d.blocked}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-[3px]", SCHEDULED)} aria-hidden />
              {d.scheduled}
            </span>
          </div>

          <div className="flex gap-2">
            {/* 눈금은 맨 위와 0만 둔다. 달마다의 값은 아래 읽기 칸과 표가 전한다.
                글자 높이(10px)만큼 위아래로 늘려, 두 눈금이 각자의 선 한가운데 오게 한다. */}
            <div
              className="flex flex-col justify-between h-[calc(9rem+10px)] -my-[5px] text-[10px] leading-none text-muted-foreground tabular-nums text-right shrink-0"
              aria-hidden
            >
              <span>{formatKRW(scaleMax)}</span>
              <span>₩0</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative h-36 border-y border-border">
                <div className="absolute inset-0 flex items-end gap-0.5">
                  {series.months.map((m) => (
                    <button
                      key={m.month}
                      type="button"
                      className={cn(
                        "flex-1 h-full flex items-end justify-center rounded-t-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        m.month === activeMonth && "bg-muted/70",
                      )}
                      onMouseEnter={() => setActiveMonth(m.month)}
                      onFocus={() => setActiveMonth(m.month)}
                      onClick={() => setActiveMonth(m.month)}
                      aria-label={d.barLabel(m.month, formatKRW(m.amount), m.isFuture)}
                      aria-pressed={m.month === activeMonth}
                    >
                      {m.amount > 0 && (
                        <span
                          className={cn(
                            "w-full max-w-6 rounded-t-[4px]",
                            m.isFuture ? SCHEDULED : DEFENDED,
                          )}
                          style={{ height: `${Math.max((m.amount / scaleMax) * 100, 2)}%` }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-0.5 mt-1.5" aria-hidden>
                {series.months.map((m) => (
                  <span
                    key={m.month}
                    className={cn(
                      "flex-1 text-center text-[10px]",
                      m.month === currentMonth
                        ? "font-bold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {d.month(m.month)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            <strong className="text-sm text-foreground">{formatKRW(active.amount)}</strong> ·{" "}
            {d.month(active.month)}{" "}
            {active.isFuture
              ? d.activeScheduled
              : active.month === currentMonth
                ? d.activeNow
                : d.activePast}
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground font-medium">
              {d.table}
            </summary>
            <table className="mt-2 w-full text-left tabular-nums">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 font-medium">{d.colMonth}</th>
                  <th className="py-1 font-medium text-right">{d.colAmount}</th>
                  <th className="py-1 font-medium text-right">{d.colKind}</th>
                </tr>
              </thead>
              <tbody>
                {series.months.map((m) => (
                  <tr key={m.month} className="border-t border-border">
                    <td className="py-1">{d.month(m.month)}</td>
                    <td className="py-1 text-right">{formatKRW(m.amount)}</td>
                    <td className="py-1 text-right text-muted-foreground">
                      {m.isFuture ? d.kindScheduled : d.kindBlocked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}

      {series.unknownCount > 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          {d.unknown(series.unknownCount)}
        </p>
      )}
    </section>
  );
}
