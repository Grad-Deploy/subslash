"use client";

import React, { useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { metricForSubscription, type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useT, type Messages } from "@lib/i18n";
import { formatDurationPreciseText, formatDurationText } from "@lib/i18n/duration";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { lastDays, totalsFor, type UsageHistory } from "@lib/usage/history";
import { packageBreakdown, packagesFor } from "@lib/usage/packages";
import {
  LEVEL_STYLE,
  RANGE_DAYS,
  metricView,
  subUsage,
  type MetricView,
  type SubUsage,
  type UsageRange,
} from "@lib/usage/value";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { RangeTabs, StatTile, UsageBarChart, monthBars, won, type UsageBar } from "./parts";

function bars(
  t: Messages,
  range: UsageRange,
  history: UsageHistory,
  packages: readonly string[],
  now: Date,
): UsageBar[] {
  if (range === "year") return monthBars(t, history, packages, now);
  const dates = lastDays(now, RANGE_DAYS[range]);
  return dates.map((date, i) => {
    const [y, m, d] = date.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    const totals = totalsFor(history, packages, [date]);
    return {
      key: date,
      label: range === "week" ? t.usageApp.weekdays[day.getDay()] : `${m}/${d}`,
      showLabel: range === "week" || i === 0 || i === dates.length - 1 || i === 14,
      ms: totals.coveredDays > 0 ? totals.usedMs : null,
      spoken: t.usageApp.monthDay(m, d),
    };
  });
}

/**
 * 구독 상세 › 이 구독의 사용 현황(안드로이드 앱). 리포트가 '전체 비교'라면 여기는 '이 구독 하나'다.
 * 1주는 날별, 1달은 날별(30칸), 1년은 달별 막대. 가성비는 체크인과 같게 최근 30일 기준이다.
 */
export function AppUsageDetail({ subscription }: { subscription: Subscription }) {
  const t = useT();
  const u = t.usageApp;
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [range, setRange] = useState<UsageRange>("week");
  const [accessOpen, setAccessOpen] = useState(false);
  const packages = packagesFor(subscription);
  const now = useMemo(() => new Date(), []);

  const series = useMemo(
    () => (packages ? bars(t, range, history, packages, now) : []),
    [t, range, history, packages, now],
  );

  if (!packages || status === "loading" || status === "unsupported") return null;

  if (status === "off") {
    return (
      <>
        <button
          type="button"
          onClick={() => setAccessOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left hover:bg-muted/50"
        >
          <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">{u.connect}</span>
            <span className="block text-xs text-muted-foreground">{u.detail.connectBody}</span>
          </span>
        </button>
        <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
      </>
    );
  }

  const periodDates = lastDays(now, RANGE_DAYS[range]);
  const period = subUsage(subscription, history, installed, periodDates, rate);
  const month = subUsage(subscription, history, installed, lastDays(now, 30), rate);

  return (
    <section className="space-y-4 rounded-2xl border p-4" aria-labelledby="sub-usage-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="sub-usage-heading" className="text-lg font-bold">
          {u.detail.title}
        </h3>
        <span className="text-xs text-muted-foreground">{u.thisPhone}</span>
      </div>

      {period.state === "not-installed" ? (
        <p className="text-sm text-muted-foreground">{u.detail.notInstalled}</p>
      ) : (
        <>
          <RangeTabs value={range} onChange={setRange} label={u.rangeLabel} />

          <div className="grid grid-cols-2 gap-2">
            <StatTile label={u.usedTime} value={formatDurationText(t, period.totals.usedMs)} />
            <StatTile label={u.opens} value={String(period.totals.opens)} unit={u.timesUnit} />
          </div>

          {/* 앱이 여럿인 구독(유튜브 프리미엄 = 유튜브 + 유튜브 뮤직)은 앱마다 나눠 보여 준다. */}
          {packageBreakdown(packages, period.totals.byPackage).length > 0 && (
            <ul className="space-y-1 rounded-xl bg-secondary/50 px-3 py-2 text-xs">
              {packageBreakdown(packages, period.totals.byPackage).map((row) => (
                <li key={row.pkg} className="flex justify-between gap-3">
                  <span className="font-semibold">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatDurationText(t, row.usedMs)} · {u.times(row.opens)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {period.totals.listenMs !== null && (
            <p className="text-[11px] text-muted-foreground">{u.detail.listenNote}</p>
          )}

          <div>
            <UsageBarChart bars={series} />
            {series.some((bar) => bar.ms === null) && (
              <p className="mt-2 text-xs text-muted-foreground">{u.detail.dashed}</p>
            )}
          </div>

          {month.state === "measured" && (
            <ValueTiles
              view={metricView(month, metricForSubscription(subscription))}
              usage={month}
            />
          )}
        </>
      )}
    </section>
  );
}

/**
 * 이 구독의 가성비(최근 30일, 이 폰). 체크인과 같은 지표로 단가를 말하고, 옆 칸에는 잰 것을 그대로 둔다.
 *
 * 시간으로 재는 구독인데 1시간도 안 썼으면 시간당 금액을 내지 않는다 — 몇 초로 한 달 요금을 나눠 한 시간으로
 * 늘리면 '시간당 5,400만 원'처럼 쓴 적 없는 크기의 숫자가 된다. 그때는 쓴 시간과 그동안 낸 돈을 그대로 보인다.
 */
function ValueTiles({ view, usage }: { view: MetricView; usage: SubUsage }) {
  const t = useT();
  const u = t.usageApp;
  const d = u.detail;
  const days = Math.min(30, usage.totals.coveredDays);
  const style = view.level ? LEVEL_STYLE[view.level] : null;
  const used = formatDurationPreciseText(t, usage.totals.usedMs);
  const measured =
    view.metric === "uses"
      ? d.measuredUses(days, usage.totals.opens)
      : view.metric === "days"
        ? d.measuredDays(days, usage.totals.activeDays)
        : d.measuredHours(days, used);

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold">{d.valueTitle}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            {view.short ? d.shortLabel : u.per[view.metric]}
          </p>
          <p className="text-lg font-black tracking-tight tabular-nums">
            {view.short
              ? won(usage.periodCostKRW)
              : view.unitKRW === null
                ? "—"
                : won(view.unitKRW)}
          </p>
          <p className={cn("text-[11px]", style ? style.text : "text-muted-foreground")}>
            {view.short
              ? d.shortNote(used)
              : view.unitKRW === null
                ? view.metric === "uses"
                  ? d.noneUses(days)
                  : view.metric === "days"
                    ? d.noneDays(days)
                    : d.noneHours(days)
                : measured}
            {view.level && !view.short && view.unitKRW !== null && ` · ${u.level[view.level]}`}
            {view.pendingDays > 0 && ` · ${u.pending(view.pendingDays)}`}
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
          <p className="text-[11px] text-muted-foreground">
            {view.metric === "hours" ? d.activeDays : u.usedTime}
          </p>
          <p className="text-lg font-black tracking-tight tabular-nums">
            {view.metric === "hours" ? d.days(usage.totals.activeDays) : used}
          </p>
          <p className="text-[11px] text-muted-foreground">{d.opened(days, usage.totals.opens)}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{d.tvNote}</p>
    </div>
  );
}
