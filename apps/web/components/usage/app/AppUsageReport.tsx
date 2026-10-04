"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";
import { metricForSubscription, type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { firstRecordedDay, formatDuration } from "@lib/usage/history";
import { MEASURED_USAGE_PACKAGES, packagesFor } from "@lib/usage/packages";
import {
  RANGE_DAYS,
  compareValue,
  metricView,
  rangeDates,
  subUsage,
  type MetricView,
  type UsageRange,
} from "@lib/usage/value";
import { Button } from "../../ui/button";
import { AppSheet } from "../../settings/app/AppSheet";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { UsageLine, isUnused, type SortKey, type UsageReportLine } from "./AppUsageLine";
import { UsageCard } from "./AppUsageCard";
import { RangeTabs, StatTile, SubLogo, UsageBarChart, monthBars, monthDay } from "./parts";

const SORT_LABEL: Record<SortKey, string> = {
  value: "가성비",
  time: "사용 시간",
  opens: "쓴 횟수",
};

/**
 * 잰 것이 앞, 앱 없음·기록 없음이 뒤. 가성비는 안 쓴 것 → 비쌈 → 애매 → 잘 씀(평가 전이면 '잘 씀'까지 먼 순),
 * 시간·횟수는 많은 순(안 쓴 것은 뒤).
 */
function compare(sort: SortKey) {
  const group = (line: UsageReportLine) => (line.period.state === "measured" && line.view ? 0 : 1);
  return (a: UsageReportLine, b: UsageReportLine) => {
    const g = group(a) - group(b);
    if (g !== 0 || !a.view || !b.view) return g;
    if (sort === "value") {
      const za = isUnused(a.month) ? 0 : 1;
      const zb = isUnused(b.month) ? 0 : 1;
      return za - zb || compareValue(a.view, b.view) || b.month.monthlyKRW - a.month.monthlyKRW;
    }
    if (sort === "time") return b.period.totals.usedMs - a.period.totals.usedMs;
    return b.period.totals.opens - a.period.totals.opens;
  };
}

/**
 * 리포트 › 구독 사용 현황(안드로이드 앱). 폰 기록으로 구독마다 얼마나 썼고 시간당 얼마였는지를
 * 기간별로 보여준다. 막대 길이는 사용 시간, 색은 돈값(체크인과 같은 getRiskLevel)이다.
 *
 * 시간당 단가 = 기록이 있는 날만큼의 구독료 ÷ 사용 시간. 쓴 횟수보다 OTT·음악에 공정하다(한 번 열고
 * 두 시간 보는 경우).
 */
export function AppUsageReport({ active }: { active: Subscription[] }) {
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [range, setRange] = useState<UsageRange>("month");
  const [sort, setSort] = useState<SortKey>("value");
  const [accessOpen, setAccessOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const mapped = useMemo(() => active.filter((sub) => packagesFor(sub)), [active]);

  const now = useMemo(() => new Date(), []);
  // 가성비는 기간 탭과 관계없이 늘 최근 30일이다(체크인과 같은 기준). 시간·횟수는 고른 기간.
  const lines = useMemo(() => {
    const dates = rangeDates(range, now);
    const monthDates = rangeDates("month", now);
    return mapped
      .map((sub): UsageReportLine => {
        const month = subUsage(sub, history, installed, monthDates, rate);
        return {
          period: range === "month" ? month : subUsage(sub, history, installed, dates, rate),
          month,
          view: month.state === "measured" ? metricView(month, metricForSubscription(sub)) : null,
        };
      })
      .sort(compare(sort));
  }, [mapped, history, installed, range, sort, rate, now]);
  const usages = useMemo(() => lines.map((line) => line.period), [lines]);

  const months = useMemo(() => {
    const packages = [...new Set(mapped.flatMap((sub) => packagesFor(sub) ?? []))];
    return monthBars(history, packages.length > 0 ? packages : MEASURED_USAGE_PACKAGES, now);
  }, [mapped, history, now]);

  // 카드는 기간 탭과 관계없이 늘 최근 30일이다(체크인과 같은 기준).
  const card = useMemo(
    () =>
      lines
        .filter((line) => line.month.state === "measured" && line.view)
        .map((line) => ({ usage: line.month, view: line.view as MetricView })),
    [lines],
  );

  if (status === "loading" || status === "unsupported" || mapped.length === 0) return null;

  if (status === "off") {
    return (
      <section className="space-y-3 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Smartphone className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">구독 사용 현황</h2>
            <p className="text-sm text-muted-foreground">
              폰 사용 기록을 연결하면 구독 앱을 얼마나 썼는지, 시간당 얼마였는지 보여 드려요.
            </p>
          </div>
        </div>
        <Button className="w-full" onClick={() => setAccessOpen(true)}>
          폰 사용 기록 연결하기
        </Button>
        <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
      </section>
    );
  }

  const measured = usages.filter((u) => u.state === "measured");
  const totalMs = measured.reduce((sum, u) => sum + u.totals.usedMs, 0);
  const totalOpens = measured.reduce((sum, u) => sum + u.totals.opens, 0);
  const covered = Math.max(0, ...usages.map((u) => u.totals.coveredDays));
  const since = firstRecordedDay(history);
  const unmappedCount = active.length - mapped.length;
  const hasYear = months.some((m) => m.ms !== null);

  const detail = (
    <section className="space-y-4 pt-1" aria-labelledby="usage-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="usage-heading" className="text-base font-bold">
          구독 사용 현황
        </h2>
        <span className="text-xs text-muted-foreground">
          이 폰 기준
          {covered > 0 && covered < RANGE_DAYS[range] && ` · 기록 ${covered}일`}
        </span>
      </div>

      <RangeTabs value={range} onChange={setRange} label="기간" />

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="구독 앱 사용 시간" value={formatDuration(totalMs)} />
        <StatTile label="구독 앱 쓴 횟수" value={totalOpens.toLocaleString("ko-KR")} unit="회" />
      </div>

      {covered === 0 ? (
        <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
          아직 쌓인 기록이 없어요. 내일부터 이 폰의 사용 기록이 여기에 쌓여요.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="정렬">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={sort === key}
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  sort === key
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground",
                )}
              >
                {SORT_LABEL[key]}
              </button>
            ))}
          </div>

          {sort === "value" && range !== "month" && (
            <p className="text-xs text-muted-foreground">
              가성비는 기간과 관계없이 최근 30일로 봐요.
            </p>
          )}

          <ul className="divide-y rounded-2xl border">
            {lines.map((line) => (
              <li key={line.period.sub.id}>
                <Link
                  href={subscriptionDetailHref(line.period.sub.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <SubLogo sub={line.period.sub} size={32} />
                  <UsageLine line={line} sort={sort} totalMs={totalMs} totalOpens={totalOpens} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            {sort === "value"
              ? "막대가 꽉 차면 '잘 씀'이에요(한 달에 OTT 4회 · AI 10일(하루 5분 이상) · 음악 10시간, 체크인과 같은 기준). 평가는 기록이 30일 쌓이면 나와요."
              : "막대를 모두 더하면 100%예요. 색은 가성비 평가예요."}{" "}
            TV·PC에서 본 건 빠져 있어요.
            {unmappedCount > 0 &&
              ` 멤버십이나 PC에서 쓰는 구독 ${unmappedCount}개는 폰 기록으로 알 수 없어 빠졌어요.`}
          </p>
        </>
      )}

      {hasYear && (
        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-bold">1년 추이</h3>
            <span className="text-xs text-muted-foreground">달별 사용 시간</span>
          </div>
          <UsageBarChart bars={months} />
          {since && (
            <p className="text-xs text-muted-foreground">
              {monthDay(since)}부터 이 폰에 쌓은 기록이에요. 점선은 기록이 없는 달이에요.
            </p>
          )}
        </div>
      )}
    </section>
  );

  return (
    <>
      <UsageCard rows={card} onOpen={() => setSheetOpen(true)} />
      <AppSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="구독 사용 현황">
        {detail}
      </AppSheet>
    </>
  );
}
