"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";
import { metricForSubscription, type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { firstRecordedDay } from "@lib/usage/history";
import { useT } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";
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

const SORT_KEYS: SortKey[] = ["value", "time", "opens"];

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
  const t = useT();
  const u = t.usageApp;
  const r = u.report;
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
    return monthBars(t, history, packages.length > 0 ? packages : MEASURED_USAGE_PACKAGES, now);
  }, [t, mapped, history, now]);

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
            <h2 className="text-base font-bold">{u.title}</h2>
            <p className="text-sm text-muted-foreground">{r.offBody}</p>
          </div>
        </div>
        <Button className="w-full" onClick={() => setAccessOpen(true)}>
          {u.connect}
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
          {u.title}
        </h2>
        <span className="text-xs text-muted-foreground">
          {u.thisPhone}
          {covered > 0 && covered < RANGE_DAYS[range] && r.recordedSuffix(covered)}
        </span>
      </div>

      <RangeTabs value={range} onChange={setRange} label={u.rangeLabel} />

      <div className="grid grid-cols-2 gap-2">
        <StatTile label={r.totalTime} value={formatDurationText(t, totalMs)} />
        <StatTile
          label={r.totalOpens}
          value={totalOpens.toLocaleString("ko-KR")}
          unit={u.timesUnit}
        />
      </div>

      {covered === 0 ? (
        <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">{r.empty}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={r.sortLabel}>
            {SORT_KEYS.map((key) => (
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
                {r.sort[key]}
              </button>
            ))}
          </div>

          {sort === "value" && range !== "month" && (
            <p className="text-xs text-muted-foreground">{r.valueRecent}</p>
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
            {sort === "value" ? r.legendValue : r.legendShare} {r.tvMissing}
            {unmappedCount > 0 && r.unmapped(unmappedCount)}
          </p>
        </>
      )}

      {hasYear && (
        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-bold">{r.yearTitle}</h3>
            <span className="text-xs text-muted-foreground">{r.yearSub}</span>
          </div>
          <UsageBarChart bars={months} />
          {since && <p className="text-xs text-muted-foreground">{r.since(monthDay(t, since))}</p>}
        </div>
      )}
    </section>
  );

  return (
    <>
      <UsageCard rows={card} onOpen={() => setSheetOpen(true)} />
      <AppSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label={u.title}>
        {detail}
      </AppSheet>
    </>
  );
}
