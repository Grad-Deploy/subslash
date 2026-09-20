"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  formatCurrency,
  formatDday,
  formatKRW,
  getBilledAmount,
  type Subscription,
} from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { subscriptionDetailHref } from "@lib/routes";
import {
  buildBillingMonth,
  dayTotalKRW,
  nextBillingDayInMonth,
  type BillingMonth,
} from "@lib/billing-calendar";
import { ServiceLogo } from "@components/subscription/ServiceLogo";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 이번 달 어느 날에 무엇이 빠져나가는지 달력으로 보여준다. '다가오는 결제' 목록을 대신한다 —
 * 목록은 다음 다섯 건만 보여줘서 "이번 달에 결제가 몰린 주"가 보이지 않았다.
 *
 * 규칙 하나가 이 컴포넌트의 전부다: **결제 월을 모르는 연간 구독은 어느 날에도 찍지 않는다.**
 * 대신 몇 건인지 말하고 적으러 갈 곳을 알려 준다. 아무 날에나 찍으면 있지도 않은 결제를 사실처럼
 * 보여주게 되고, 조용히 빼면 왜 없는지 알 수 없다.
 *
 * 금액은 카드에 찍히는 값(`getBilledAmount`)이고, 통화가 섞인 합계는 사용자 환율로 환산한다
 * (`useExchangeRate` — 헬퍼의 기본 환율에 기대면 '내 환율' 문구와 다른 숫자가 나온다).
 */
export function BillingCalendar({
  subscriptions,
  now,
}: {
  subscriptions: Subscription[];
  now: Date;
}) {
  const rate = useExchangeRate();
  const [view, setView] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));
  // null이면 아직 아무 날도 고르지 않은 것이다. 달을 넘기면 다시 null로 돌아간다.
  const [pickedDay, setPickedDay] = useState<number | null>(null);

  const active = useMemo(
    () => subscriptions.filter((sub) => sub.status === "active"),
    [subscriptions],
  );
  const month = useMemo(
    () => buildBillingMonth(active, view.year, view.month, rate),
    [active, view, rate],
  );

  const isThisMonth = view.year === now.getFullYear() && view.month === now.getMonth();
  const today = now.getDate();
  // 이 달을 열었을 때 처음 보여줄 날: 오늘 이후 가장 가까운 결제일. 지난 결제일을 골라 두면
  // "다음에 무엇이 나가는가"에 답하지 못한다.
  const defaultDay = isThisMonth ? nextBillingDayInMonth(month, today) : null;
  const selectedDay = pickedDay ?? defaultDay;
  const selectedSubs = selectedDay === null ? [] : (month.days.get(selectedDay) ?? []);

  const goMonth = (step: number) => {
    setView(({ year, month: m }) => {
      const moved = new Date(year, m + step, 1);
      return { year: moved.getFullYear(), month: moved.getMonth() };
    });
    setPickedDay(null);
  };
  const goToday = () => {
    setView({ year: now.getFullYear(), month: now.getMonth() });
    setPickedDay(null);
  };

  if (active.length === 0) return null;

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const dayCount = new Date(view.year, view.month + 1, 0).getDate();

  return (
    <section
      aria-labelledby="billing-calendar"
      className="space-y-3 rounded-2xl border bg-card p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="billing-calendar" className="text-sm font-bold">
          결제 캘린더
        </h2>
        <div className="flex items-center gap-1">
          {!isThisMonth && (
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              이번 달
            </button>
          )}
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            ‹
          </button>
          <span className="min-w-[6.5rem] text-center text-xs font-semibold tabular-nums">
            {view.year}년 {view.month + 1}월
          </span>
          <button
            type="button"
            onClick={() => goMonth(1)}
            aria-label="다음 달"
            className="rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted"
          >
            ›
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }, (_, i) => (
          <div key={`pad-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: dayCount }, (_, i) => {
          const day = i + 1;
          const subs = month.days.get(day);
          const isToday = isThisMonth && day === today;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              type="button"
              disabled={!subs}
              aria-pressed={isSelected}
              aria-label={
                subs
                  ? `${view.month + 1}월 ${day}일, 결제 ${subs.length}건`
                  : `${view.month + 1}월 ${day}일, 결제 없음`
              }
              onClick={() => setPickedDay(day)}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-xs tabular-nums transition-colors",
                subs ? "font-bold hover:bg-muted" : "text-muted-foreground",
                isSelected ? "bg-primary/10 ring-1 ring-primary" : "",
                isToday && !isSelected ? "ring-1 ring-border" : "",
              ].join(" ")}
            >
              <span className={isToday ? "text-primary" : undefined}>{day}</span>
              <span className="flex h-1.5 items-center gap-0.5">
                {subs?.slice(0, 4).map((sub) => (
                  <span
                    key={sub.id}
                    aria-hidden="true"
                    // 색은 통화로만 나눈다. 서비스마다 색을 주면 개수가 늘수록 뜻이 사라진다.
                    className={`size-1.5 rounded-full ${
                      sub.currency === "USD" ? "bg-amber-500" : "bg-primary"
                    }`}
                  />
                ))}
                {subs && subs.length > 4 && (
                  <span
                    aria-hidden="true"
                    className="text-[9px] leading-none text-muted-foreground"
                  >
                    +
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay !== null && selectedSubs.length > 0 && (
        <SelectedDay month={month} day={selectedDay} subs={selectedSubs} now={now} rate={rate} />
      )}

      <footer className="space-y-1 border-t pt-3 text-xs">
        {month.billingCount === 0 ? (
          <p className="text-muted-foreground">이 달에 청구되는 구독이 없습니다.</p>
        ) : (
          <p className="text-muted-foreground">
            이 달 결제 {month.days.size}일 · {month.billingCount}건 ·{" "}
            <strong className="text-foreground">{formatKRW(month.totalKRW)}</strong>
            {selectedSubs.length === 0 && " — 점이 있는 날짜를 누르면 무엇이 나가는지 봅니다"}
          </p>
        )}
        {month.undatedCount > 0 && (
          <p className="text-amber-700 dark:text-amber-400">
            결제 월 미설정 {month.undatedCount}건은 날짜를 몰라 찍지 못했습니다 —{" "}
            <Link href="/subs" className="font-semibold underline underline-offset-2">
              연간 구독의 결제 월 적기
            </Link>
          </p>
        )}
      </footer>
    </section>
  );
}

/** 고른 날에 무엇이 얼마나 빠져나가는지. */
function SelectedDay({
  month,
  day,
  subs,
  now,
  rate,
}: {
  month: BillingMonth;
  day: number;
  subs: Subscription[];
  now: Date;
  rate: number;
}) {
  // 날짜끼리만 뺀다. 시각이 섞이면 같은 날인데 D-1로 보이는 일이 생긴다.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(month.year, month.monthIndex, day).getTime();
  const daysAway = Math.round((target - startOfToday) / (24 * 60 * 60 * 1000));
  // 통화가 섞였을 때만 환산 합계를 보여준다. 원화뿐이면 같은 숫자를 두 번 쓰는 셈이다.
  const mixed = subs.some((sub) => sub.currency !== subs[0].currency);

  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-3">
      <p className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-bold">
          {month.monthIndex + 1}월 {day}일 결제
        </span>
        <span className="font-mono text-muted-foreground">{formatDday(daysAway)}</span>
      </p>
      <ul className="space-y-1.5">
        {subs.map((sub) => (
          <li key={sub.id} className="flex items-center justify-between gap-3 text-sm">
            <Link
              href={subscriptionDetailHref(sub.id)}
              className="flex min-w-0 items-center gap-2 hover:underline underline-offset-2"
            >
              <ServiceLogo
                name={sub.name}
                cancelUrl={sub.cancelUrl}
                fallbackEmoji={sub.iconUrl}
                size={18}
              />
              <span className="truncate">{sub.name}</span>
            </Link>
            <span className="shrink-0 font-mono text-xs font-semibold">
              {formatCurrency(getBilledAmount(sub), sub.currency)}
            </span>
          </li>
        ))}
      </ul>
      {subs.length > 1 && (
        <p className="border-t pt-2 text-right text-xs text-muted-foreground">
          합계 <strong className="text-foreground">{formatKRW(dayTotalKRW(subs, rate))}</strong>
          {mixed && " (내 환율로 환산)"}
        </p>
      )}
    </div>
  );
}
