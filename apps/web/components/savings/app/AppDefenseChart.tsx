"use client";

import { useState } from "react";
import { type Subscription, formatKRW, getYearDefendedSeries } from "@subslash/shared";
import { cn } from "@lib/utils";

/**
 * 막대·선 색. 웹 그래프(MonthlyDefenseChart)와 같은 에메랄드 두 단계다(밝은 모드 700/500,
 * 어두운 모드 400/600). '막은 결제'와 '예정'을 범례 글자로도 적는다.
 */
const DEFENDED = "bg-emerald-700 dark:bg-emerald-400";
const SCHEDULED = "bg-emerald-500 dark:bg-emerald-600";
const DEFENDED_STROKE = "stroke-emerald-700 dark:stroke-emerald-400";
const SCHEDULED_STROKE = "stroke-emerald-500 dark:stroke-emerald-600";

function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const base = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

/**
 * 앱의 올해 월별 방어액. 웹과 같은 데이터(getYearDefendedSeries)를 좁은 화면에 맞게 그린다.
 * 막대를 누르면 위 숫자가 그 달로 바뀌고, '누적'으로 바꾸면 올해 쌓이는 선을 보여준다.
 * 이번 달까지는 막은 결제, 남은 달은 예정이다(예정을 아낀 돈처럼 읽지 않게 색과 글자로 나눈다).
 */
export function AppDefenseChart({
  killedSubscriptions,
  exchangeRate,
}: {
  killedSubscriptions: Subscription[];
  exchangeRate: number;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [mode, setMode] = useState<"month" | "total">("month");
  const [active, setActive] = useState(currentMonth);

  const series = getYearDefendedSeries(killedSubscriptions, year, exchangeRate, now);
  const cumulative = series.months.reduce<number[]>(
    (acc, m, i) => [...acc, (acc[i - 1] ?? 0) + m.amount],
    [],
  );
  const monthMax = niceCeil(Math.max(...series.months.map((m) => m.amount)));
  const totalMax = niceCeil(cumulative[11] ?? 0);
  const activeMonth = series.months[active - 1];

  return (
    <section className="rounded-2xl border bg-card p-4" aria-labelledby="app-defense-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="app-defense-title" className="text-[14.5px] font-extrabold tracking-tight">
          {year}년 월별 방어액
        </h2>
        <div className="inline-flex rounded-[10px] bg-secondary p-0.5" role="tablist">
          {(
            [
              ["month", "월별"],
              ["total", "누적"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              onClick={() => setMode(key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-bold",
                mode === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {monthMax === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
          올해는 해지한 구독의 결제일이 아직 돌아오지 않았어요. 결제일이 지나면 그 달에 쌓여요.
        </p>
      ) : (
        <>
          <div className="mt-3 mb-2 flex items-baseline justify-between gap-2">
            <p className="text-xl font-black tracking-tight tabular-nums" aria-live="polite">
              {formatKRW(
                mode === "month" ? activeMonth.amount : (cumulative[currentMonth - 1] ?? 0),
              )}
            </p>
            <p className="text-right text-[11px] text-muted-foreground">
              {mode === "month"
                ? `${active}월 · ${activeMonth.isFuture ? "예정" : "막은 결제"}`
                : `1~${currentMonth}월 누적 · 연말까지 ${formatKRW(cumulative[11] ?? 0)} 예정`}
            </p>
          </div>

          {mode === "month" ? (
            <div className="relative h-32 border-b">
              <span className="absolute inset-x-0 top-0 border-t border-dashed" aria-hidden />
              <span className="absolute inset-x-0 top-1/2 border-t border-dashed" aria-hidden />
              <div className="absolute inset-0 flex items-end gap-1">
                {series.months.map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    onClick={() => setActive(m.month)}
                    aria-label={`${m.month}월 ${formatKRW(m.amount)} ${m.isFuture ? "예정" : "막음"}`}
                    aria-pressed={m.month === active}
                    className={cn(
                      "flex h-full flex-1 items-end justify-center rounded-t-md",
                      m.month === active && "bg-secondary/80",
                    )}
                  >
                    {m.amount > 0 && (
                      <span
                        className={cn(
                          "w-full max-w-4 rounded-t-[4px]",
                          m.isFuture ? SCHEDULED : DEFENDED,
                        )}
                        style={{ height: `${Math.max((m.amount / monthMax) * 100, 2)}%` }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <CumulativeLine values={cumulative} max={totalMax} currentMonth={currentMonth} />
          )}

          <div className="mt-1 flex gap-1" aria-hidden>
            {series.months.map((m) => (
              <span
                key={m.month}
                className={cn(
                  "flex-1 text-center text-[9.5px]",
                  m.month === currentMonth
                    ? "font-extrabold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {m.month}
              </span>
            ))}
          </div>
          <div className="mt-2.5 flex gap-3 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-[2px]", DEFENDED)} aria-hidden />
              막은 결제
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-[2px]", SCHEDULED)} aria-hidden />
              예정
            </span>
          </div>
          {series.unknownCount > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              결제월을 몰라 그래프에 넣지 못한 구독 {series.unknownCount}개가 있어요.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** 누적 선. 이번 달까지는 실선, 남은 달은 점선. 가로는 12칸의 가운데에 점을 둔다. */
function CumulativeLine({
  values,
  max,
  currentMonth,
}: {
  values: number[];
  max: number;
  currentMonth: number;
}) {
  const W = 120;
  const H = 100;
  const point = (v: number, i: number) => `${((i + 0.5) / 12) * W},${H - (max ? v / max : 0) * H}`;
  const past = values.slice(0, currentMonth).map(point).join(" ");
  const future = values
    .slice(currentMonth - 1)
    .map((v, i) => point(v, i + currentMonth - 1))
    .join(" ");
  const [cx, cy] = point(values[currentMonth - 1] ?? 0, currentMonth - 1).split(",");

  return (
    <div className="relative h-32 border-b">
      <span className="absolute inset-x-0 top-0 border-t border-dashed" aria-hidden />
      <span className="absolute inset-x-0 top-1/2 border-t border-dashed" aria-hidden />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        role="img"
        aria-label="올해 누적 방어액"
      >
        <polyline
          points={past}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={DEFENDED_STROKE}
        />
        {currentMonth < 12 && (
          <polyline
            points={future}
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            className={SCHEDULED_STROKE}
          />
        )}
      </svg>
      {/* 점은 SVG 비율이 늘어나도 둥글게 보이도록 HTML로 얹는다. */}
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-emerald-700 dark:bg-emerald-400"
        style={{ left: `${(Number(cx) / W) * 100}%`, top: `${(Number(cy) / H) * 100}%` }}
        aria-hidden
      />
    </div>
  );
}
