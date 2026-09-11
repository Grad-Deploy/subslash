"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CATEGORY_LABELS,
  buildYearInReview,
  formatKRW,
  getSavingsTiers,
  type CheckInStanding,
} from "@subslash/shared";
import { useStore } from "../../../lib/store";
import { useExchangeRate } from "../../../hooks/useExchangeRate";

/** 이보다 이른 해는 이 앱에 기록이 있을 수 없다. */
const EARLIEST_YEAR = 2020;

function readYear(value: string | null, currentYear: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= EARLIEST_YEAR && parsed <= currentYear
    ? parsed
    : currentYear;
}

function formatDay(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin text-3xl">✂️</div>
    </div>
  );
}

function Standing({ label, item, value }: { label: string; item: CheckInStanding; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/60 space-y-0.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-bold text-foreground">
        {item.iconUrl ?? "📦"} {item.name}
        {item.killed && (
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">(해지함)</span>
        )}
      </dd>
      <dd className="text-[11px] text-muted-foreground">{value}</dd>
    </div>
  );
}

function YearInReviewContent() {
  const searchParams = useSearchParams();
  const { subscriptions, usageLogs } = useStore();
  const rate = useExchangeRate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Spinner />;

  const now = new Date();
  const currentYear = now.getFullYear();
  const year = readYear(searchParams.get("year"), currentYear);
  const review = buildYearInReview(subscriptions, usageLogs, year, rate, now);
  const { defended, checkIns } = review;
  const scope = review.isComplete ? `${year}년` : `${year}년 지금까지`;
  // 막은 결제 가운데, 그 해 결제일에 결제가 멈춘 것을 확인한 금액.
  const yearTiers = getSavingsTiers(subscriptions, now, rate, {
    from: new Date(year, 0, 1),
    to: new Date(year + 1, 0, 1),
  });

  const cheapest = checkIns[0];
  const priciest = checkIns.length > 1 ? checkIns[checkIns.length - 1] : undefined;
  const mostUsed =
    checkIns.length > 1
      ? checkIns.reduce((best, item) => (item.usageCount > best.usageCount ? item : best))
      : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/savings" className="text-muted-foreground hover:text-foreground">
          ← 절약 현황
        </Link>
        <div className="flex gap-3 text-xs">
          {year > EARLIEST_YEAR && (
            <Link
              href={`/savings/review?year=${year - 1}`}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {year - 1}년 결산
            </Link>
          )}
          {year < currentYear && (
            <Link
              href="/savings/review"
              className="text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              올해 결산
            </Link>
          )}
        </div>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">📆 {year}년 구독 결산</h1>
        <p className="text-sm text-muted-foreground">
          {review.isComplete
            ? `${year}년 한 해 동안의 기록입니다.`
            : `${now.getMonth() + 1}월 ${now.getDate()}일까지의 기록입니다. 연말이 지나면 한 해 결산이 됩니다.`}
        </p>
      </header>

      <section
        aria-labelledby="review-defended"
        className="p-6 border rounded-2xl bg-card shadow-sm space-y-2"
      >
        <h2 id="review-defended" className="text-xs font-semibold text-muted-foreground">
          {scope} 해지로 막은 결제
        </h2>
        <p className="text-4xl font-black text-foreground">{formatKRW(defended.pastAmount)}</p>
        <p className="text-xs text-muted-foreground">
          이 중 결제가 멈춘 것을 확인한 지킨 돈은{" "}
          <strong className="text-foreground">{formatKRW(yearTiers.confirmed)}</strong>입니다.
          {yearTiers.pending > 0 &&
            ` 확인 대기 ${formatKRW(yearTiers.pending)}은 대시보드에서 결제가 멈췄는지 답하면 지킨 돈이 됩니다.`}
        </p>
        {!review.isComplete && defended.scheduledAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            연말까지 {formatKRW(defended.scheduledAmount)}을 더 지킬 예정입니다. 해지하지 않았다면
            나갔을 금액입니다.
          </p>
        )}
        {defended.unknownCount > 0 && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            ⚠️ 결제 월을 모르는 연간 구독 {defended.unknownCount}건은 언제 결제되는지 알 수 없어
            빠졌습니다.
          </p>
        )}
      </section>

      <section
        aria-labelledby="review-killed"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-killed" className="font-bold text-base">
          {scope} 해지한 구독 {review.killedThisYear.length}개
        </h2>
        {review.killedThisYear.length === 0 ? (
          <p className="text-xs text-muted-foreground">{year}년에 해지한 구독이 없습니다.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {review.killedThisYear.map((sub) => (
              <li
                key={sub.id}
                className="px-3 py-1.5 rounded-lg bg-muted/60 text-xs font-medium text-foreground"
              >
                {sub.iconUrl ?? "📦"} {sub.name}
                <span className="ml-1 text-muted-foreground">
                  · {formatDay(sub.killedAt as string)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {review.killedAtUnknown > 0 && (
          <p className="text-[11px] text-muted-foreground">
            해지 날짜 기록이 없는 {review.killedAtUnknown}건은 어느 해에 해지했는지 알 수 없어 넣지
            않았습니다.
          </p>
        )}
      </section>

      <section
        aria-labelledby="review-spend"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-spend" className="font-bold text-base">
          지금 구독 중인 서비스의 지출 구성
        </h2>
        {review.isComplete ? (
          <p className="text-xs text-muted-foreground">
            지난 해의 구독 구성은 기록으로 남아 있지 않아 보여줄 수 없습니다.
          </p>
        ) : review.categorySpend.length === 0 ? (
          <p className="text-xs text-muted-foreground">지금 구독 중인 서비스가 없습니다.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {review.categorySpend.map((item) => {
                const percent = Math.round(item.share * 100);
                return (
                  <li key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {CATEGORY_LABELS[item.category]}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {item.count}개
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">연 {formatKRW(item.annualKRW)}</strong>{" "}
                        · {percent}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-[11px] text-muted-foreground">
              구독 중인 서비스를 1년 내내 낸다고 셈한 내 몫입니다(연{" "}
              {formatKRW(review.activeAnnualKRW)}). 앱에는 지난 결제 내역이 없어서, 올해 실제로
              결제된 금액과는 다를 수 있습니다.
            </p>
          </>
        )}
      </section>

      <section
        aria-labelledby="review-checkins"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-checkins" className="font-bold text-base">
          {scope} 체크인으로 본 가성비
        </h2>
        {!cheapest ? (
          <p className="text-xs text-muted-foreground">
            {year}년에 한 체크인이 없어 비교할 수 없습니다. 구독 상세에서 이용 횟수를 체크인하면
            여기에 모입니다.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Standing
                label={priciest ? "1회당 가장 싸게 쓴 서비스" : "체크인한 서비스"}
                item={cheapest}
                value={`1회당 ${formatKRW(cheapest.costPerUseKRW)} · ${cheapest.usageCount}회 이용`}
              />
              {priciest && (
                <Standing
                  label="1회당 가장 비싸게 쓴 서비스"
                  item={priciest}
                  value={`1회당 ${formatKRW(priciest.costPerUseKRW)} · ${priciest.usageCount}회 이용`}
                />
              )}
              {mostUsed && (
                <Standing
                  label="가장 자주 쓴 서비스"
                  item={mostUsed}
                  value={`30일 동안 ${mostUsed.usageCount}회`}
                />
              )}
            </dl>
            <p className="text-[11px] text-muted-foreground">
              서비스마다 {year}년의 마지막 체크인 기준입니다. 이용 횟수는 체크인 때 직접 적은 값이라
              실제 사용량과는 다를 수 있습니다.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export default function YearInReviewPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <YearInReviewContent />
    </Suspense>
  );
}
