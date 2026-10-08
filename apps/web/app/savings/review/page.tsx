"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  buildYearInReview,
  formatKRW,
  getSavingsTiers,
  type CheckInStanding,
} from "@subslash/shared";
import { useStore } from "../../../lib/store";
import { useExchangeRate } from "../../../hooks/useExchangeRate";
import { rateRangeFor, useHistoricalRates } from "../../../hooks/useHistoricalRates";
import { buildReviewShareSearchParams } from "../../../lib/share-review";
import { webUrl } from "../../../lib/api";
import { shareText } from "../../../lib/native";
import { Button } from "../../../components/ui/button";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { Spinner } from "../../../components/ui/spinner";
import { copyText } from "@lib/native";
import { useT, useServiceNames } from "@lib/i18n";
import { describeSpendingTypeText } from "@lib/i18n/savings-text";

/** 이보다 이른 해는 이 앱에 기록이 있을 수 없다. */
const EARLIEST_YEAR = 2020;

function readYear(value: string | null, currentYear: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= EARLIEST_YEAR && parsed <= currentYear
    ? parsed
    : currentYear;
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner className="size-8" />
    </div>
  );
}

function Standing({ label, item, value }: { label: string; item: CheckInStanding; value: string }) {
  const names = useServiceNames();
  const mark = useT().savings.review.killedMark;
  return (
    <div className="p-3 rounded-xl bg-muted/60 space-y-0.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-bold text-foreground">
        <ServiceLogo
          name={item.name}
          fallbackEmoji={item.iconUrl}
          size={16}
          className="align-text-bottom"
        />{" "}
        {names.sub(item)}
        {item.killed && (
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">{mark}</span>
        )}
      </dd>
      <dd className="text-[11px] text-muted-foreground">{value}</dd>
    </div>
  );
}

function YearInReviewContent() {
  const names = useServiceNames();
  const searchParams = useSearchParams();
  const { subscriptions, usageLogs } = useStore();
  const rate = useExchangeRate();
  const mounted = useIsClient();
  const t = useT();
  const r = t.savings.review;
  const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString(r.dateLocale, { month: "long", day: "numeric" });
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => new Date());
  const currentYear = now.getFullYear();
  const year = readYear(searchParams.get("year"), currentYear);
  // 지난 달러 결제(막은 결제·체크인)는 그날의 고시 환율로 바꾼다. 받는 동안은 숫자가 바뀌어 보이지 않게 기다린다.
  const range = useMemo(
    () => rateRangeFor(subscriptions, new Date(year, 0, 1), new Date(year, 11, 31), now),
    [subscriptions, year, now],
  );
  const { rateOn, loading: ratesLoading } = useHistoricalRates(range);

  if (!mounted || ratesLoading) return <LoadingScreen />;

  const review = buildYearInReview(subscriptions, usageLogs, year, rate, now, rateOn);
  const { defended, checkIns } = review;
  const scope = review.isComplete ? r.scopeFull(year) : r.scopeSoFar(year);
  // 막은 결제 가운데, 그 해 결제일에 결제가 멈춘 것을 확인한 금액.
  const yearTiers = getSavingsTiers(
    subscriptions,
    now,
    rate,
    { from: new Date(year, 0, 1), to: new Date(year + 1, 0, 1) },
    rateOn,
  );
  const spendingType = review.spendingType
    ? describeSpendingTypeText(t, review.spendingType)
    : null;
  // 해지도 막은 결제도 없으면 공유할 결산이 없다. ₩0짜리 카드를 퍼뜨리지 않는다.
  const canShare = review.killedThisYear.length > 0 || defended.pastAmount > 0;

  const cheapest = checkIns[0];
  const priciest = checkIns.length > 1 ? checkIns[checkIns.length - 1] : undefined;
  const mostUsed =
    checkIns.length > 1
      ? checkIns.reduce((best, item) => (item.usageCount > best.usageCount ? item : best))
      : undefined;

  const handleShare = async () => {
    const params = buildReviewShareSearchParams({
      year,
      isComplete: review.isComplete,
      blocked: defended.pastAmount,
      confirmed: yearTiers.confirmed,
      killedCount: review.killedThisYear.length,
      names: review.killedThisYear.map((sub) => names.sub(sub)),
      spendingType: review.spendingType,
    });
    const url = webUrl(`/savings/review/share?${params.toString()}`);
    // 남에게 보이는 문장이라 지킨 돈이 없으면 막은 결제만 적는다.
    const confirmedLine =
      yearTiers.confirmed > 0 ? r.shareConfirmed(formatKRW(yearTiers.confirmed)) : "";
    const text = r.shareText(
      scope,
      review.killedThisYear.length,
      formatKRW(defended.pastAmount),
      confirmedLine,
      spendingType?.title ?? null,
      url,
    );

    // 공유 창을 열었거나 사용자가 닫았으면 끝이다. 공유할 수 없는 환경이면 복사로 넘어간다.
    if (await shareText({ title: r.shareTitle(year), text, url })) return;
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      console.error("Failed to copy review share text");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/savings" className="text-muted-foreground hover:text-foreground">
          {r.back}
        </Link>
        <div className="flex gap-3 text-xs">
          {year > EARLIEST_YEAR && (
            <Link
              href={`/savings/review?year=${year - 1}`}
              className="text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {r.prevYear(year - 1)}
            </Link>
          )}
          {year < currentYear && (
            <Link
              href="/savings/review"
              className="text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              {r.thisYear}
            </Link>
          )}
        </div>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{r.title(year)}</h1>
          <p className="text-sm text-muted-foreground">
            {review.isComplete
              ? r.completeNote(year)
              : r.partialNote(now.getMonth() + 1, now.getDate())}
          </p>
        </div>
        <Link
          href={`/report/receipt?year=${year}`}
          className="text-sm font-semibold underline underline-offset-4"
        >
          {r.asReceipt}
        </Link>
        {canShare && (
          <Button size="sm" variant="outline" onClick={handleShare}>
            {copied ? r.copied : r.share}
          </Button>
        )}
      </header>

      <section
        aria-labelledby="review-defended"
        className="p-6 border rounded-2xl bg-card shadow-sm space-y-2"
      >
        <h2 id="review-defended" className="text-xs font-semibold text-muted-foreground">
          {r.defendedTitle(scope)}
        </h2>
        <p className="text-4xl font-black text-foreground">{formatKRW(defended.pastAmount)}</p>
        <p className="text-xs text-muted-foreground">
          {r.confirmedBefore}
          <strong className="text-foreground">{formatKRW(yearTiers.confirmed)}</strong>
          {r.confirmedAfter}
          {yearTiers.pending > 0 && r.pendingNote(formatKRW(yearTiers.pending))}
        </p>
        {!review.isComplete && defended.scheduledAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            {r.scheduledNote(formatKRW(defended.scheduledAmount))}
          </p>
        )}
        {defended.unknownCount > 0 && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            {r.unknownNote(defended.unknownCount)}
          </p>
        )}
        {/* 달러 구독이 있을 때만. 고시 환율도 카드사가 청구한 환율은 아니다. */}
        {range && (
          <p className="text-[11px] text-muted-foreground">
            {rateOn ? r.fxHistorical : r.fxCurrent}
          </p>
        )}
      </section>

      <section
        aria-labelledby="review-killed"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-killed" className="font-bold text-base">
          {r.killedTitle(scope, review.killedThisYear.length)}
        </h2>
        {review.killedThisYear.length === 0 ? (
          <p className="text-xs text-muted-foreground">{r.killedNone(year)}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {review.killedThisYear.map((sub) => (
              <li
                key={sub.id}
                className="px-3 py-1.5 rounded-lg bg-muted/60 text-xs font-medium text-foreground"
              >
                <ServiceLogo
                  name={sub.name}
                  fallbackEmoji={sub.iconUrl}
                  fallbackColor={sub.iconColor}
                  size={14}
                  className="align-text-bottom"
                />{" "}
                {names.sub(sub)}
                <span className="ml-1 text-muted-foreground">
                  · {formatDay(sub.killedAt as string)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {review.killedAtUnknown > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {r.killedAtUnknown(review.killedAtUnknown)}
          </p>
        )}
      </section>

      <section
        aria-labelledby="review-spend"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-spend" className="font-bold text-base">
          {r.spendTitle}
        </h2>
        {review.isComplete ? (
          <p className="text-xs text-muted-foreground">{r.spendPast}</p>
        ) : review.categorySpend.length === 0 ? (
          <p className="text-xs text-muted-foreground">{r.spendNone}</p>
        ) : (
          <>
            {spendingType && (
              <div className="p-3 rounded-xl bg-muted/60 space-y-0.5">
                <p className="text-[11px] text-muted-foreground">{r.typeLabel}</p>
                <p className="text-sm font-black text-foreground">{spendingType.title}</p>
                <p className="text-[11px] text-muted-foreground">{spendingType.detail}</p>
              </div>
            )}
            <ul className="space-y-3">
              {review.categorySpend.map((item) => {
                const percent = Math.round(item.share * 100);
                return (
                  <li key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">
                        {t.value.category[item.category]}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {r.categoryCount(item.count)}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">
                          {r.annualOf(formatKRW(item.annualKRW))}
                        </strong>{" "}
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
              {r.spendNote(formatKRW(review.activeAnnualKRW))}
            </p>
          </>
        )}
      </section>

      <section
        aria-labelledby="review-checkins"
        className="p-5 border rounded-2xl bg-card shadow-sm space-y-3"
      >
        <h2 id="review-checkins" className="font-bold text-base">
          {r.checkInsTitle(scope)}
        </h2>
        {!cheapest ? (
          <p className="text-xs text-muted-foreground">{r.checkInsNone(year)}</p>
        ) : (
          <>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Standing
                label={priciest ? r.cheapestLabel : r.checkedLabel}
                item={cheapest}
                value={r.perUseValue(formatKRW(cheapest.costPerUseKRW), cheapest.usageCount)}
              />
              {priciest && (
                <Standing
                  label={r.priciestLabel}
                  item={priciest}
                  value={r.perUseValue(formatKRW(priciest.costPerUseKRW), priciest.usageCount)}
                />
              )}
              {mostUsed && (
                <Standing
                  label={r.mostUsedLabel}
                  item={mostUsed}
                  value={r.mostUsedValue(mostUsed.usageCount)}
                />
              )}
            </dl>
            <p className="text-[11px] text-muted-foreground">{r.checkInsNote(year)}</p>
          </>
        )}
      </section>
    </div>
  );
}

export default function YearInReviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <YearInReviewContent />
    </Suspense>
  );
}
