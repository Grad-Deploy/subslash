"use client";

import React, { useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import {
  formatDuration,
  lastDays,
  monthlyTotals,
  totalsFor,
  type UsageHistory,
} from "@lib/usage/history";
import { packageBreakdown, packagesFor } from "@lib/usage/packages";
import { LEVEL_STYLE, RANGE_DAYS, subUsage, type UsageRange } from "@lib/usage/value";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { RangeTabs, StatTile, won } from "./parts";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface Bar {
  key: string;
  label: string;
  /** 축에 글자를 붙일지(1달은 30칸이라 몇 칸에만). */
  showLabel: boolean;
  ms: number | null;
  spoken: string;
}

function bars(
  range: UsageRange,
  history: UsageHistory,
  packages: readonly string[],
  now: Date,
): Bar[] {
  if (range === "year") {
    return monthlyTotals(history, packages, now).map((m) => ({
      key: m.month,
      label: m.label,
      showLabel: true,
      ms: m.totals.coveredDays > 0 ? m.totals.usedMs : null,
      spoken: m.label,
    }));
  }
  const dates = lastDays(now, RANGE_DAYS[range]);
  return dates.map((date, i) => {
    const [y, m, d] = date.split("-").map(Number);
    const day = new Date(y, m - 1, d);
    const totals = totalsFor(history, packages, [date]);
    return {
      key: date,
      label: range === "week" ? WEEKDAYS[day.getDay()] : `${m}/${d}`,
      showLabel: range === "week" || i === 0 || i === dates.length - 1 || i === 14,
      ms: totals.coveredDays > 0 ? totals.usedMs : null,
      spoken: `${m}월 ${d}일`,
    };
  });
}

/**
 * 구독 상세 › 이 구독의 사용 현황(안드로이드 앱). 리포트가 '전체 비교'라면 여기는 '이 구독 하나'다.
 * 1주는 날별, 1달은 날별(30칸), 1년은 달별 막대. 가성비는 체크인과 같게 최근 30일 기준이다.
 */
export function AppUsageDetail({ subscription }: { subscription: Subscription }) {
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [range, setRange] = useState<UsageRange>("week");
  const [accessOpen, setAccessOpen] = useState(false);
  const packages = packagesFor(subscription);
  const now = useMemo(() => new Date(), []);

  const series = useMemo(
    () => (packages ? bars(range, history, packages, now) : []),
    [range, history, packages, now],
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
            <span className="block text-sm font-bold">폰 사용 기록 연결하기</span>
            <span className="block text-xs text-muted-foreground">
              이 구독 앱을 얼마나 썼는지 기간별로 보여 드려요
            </span>
          </span>
        </button>
        <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
      </>
    );
  }

  const periodDates = lastDays(now, RANGE_DAYS[range]);
  const period = subUsage(subscription, history, installed, periodDates, rate);
  const month = subUsage(subscription, history, installed, lastDays(now, 30), rate);
  const maxMs = Math.max(1, ...series.map((b) => b.ms ?? 0));

  return (
    <section className="space-y-4 rounded-2xl border p-4" aria-labelledby="sub-usage-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="sub-usage-heading" className="text-lg font-bold">
          사용 현황
        </h3>
        <span className="text-xs text-muted-foreground">이 폰 기준</span>
      </div>

      {period.state === "not-installed" ? (
        <p className="text-sm text-muted-foreground">
          이 폰에 앱이 없어요. 다른 기기에서 쓴다면 체크인으로 알려 주세요.
        </p>
      ) : (
        <>
          <RangeTabs value={range} onChange={setRange} label="기간" />

          <div className="grid grid-cols-2 gap-2">
            <StatTile label="사용 시간" value={formatDuration(period.totals.usedMs)} />
            <StatTile label="쓴 횟수" value={String(period.totals.opens)} unit="회" />
          </div>

          {/* 앱이 여럿인 구독(유튜브 프리미엄 = 유튜브 + 유튜브 뮤직)은 앱마다 나눠 보여 준다. */}
          {packageBreakdown(packages, period.totals.byPackage).length > 0 && (
            <ul className="space-y-1 rounded-xl bg-secondary/50 px-3 py-2 text-xs">
              {packageBreakdown(packages, period.totals.byPackage).map((row) => (
                <li key={row.pkg} className="flex justify-between gap-3">
                  <span className="font-semibold">{row.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatDuration(row.usedMs)} · {row.opens}회
                  </span>
                </li>
              ))}
            </ul>
          )}
          {period.totals.listenMs !== null && (
            <p className="text-[11px] text-muted-foreground">
              사용 시간에는 화면을 끄고 들은 재생 시간(재생 알림이 떠 있던 시간)도 들어가요.
              일시정지 시간이 섞일 수 있어요.
            </p>
          )}

          <div>
            <div className="flex h-28 items-end gap-[3px]" aria-hidden>
              {series.map((bar) => (
                <div key={bar.key} className="flex h-full flex-1 flex-col justify-end">
                  {bar.ms === null ? (
                    <div className="h-1 w-full rounded-full border border-dashed border-border" />
                  ) : (
                    <div
                      className="w-full rounded-t-sm bg-foreground/80"
                      style={{ height: `${bar.ms > 0 ? Math.max(3, (bar.ms / maxMs) * 100) : 0}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-[3px]" aria-hidden>
              {series.map((bar) => (
                <span
                  key={bar.key}
                  className="flex-1 overflow-visible whitespace-nowrap text-center text-[9.5px] text-muted-foreground"
                >
                  {bar.showLabel ? bar.label : ""}
                </span>
              ))}
            </div>
            <ul className="sr-only">
              {series.map((bar) => (
                <li key={bar.key}>
                  {bar.spoken}: {bar.ms === null ? "기록 없음" : formatDuration(bar.ms)}
                </li>
              ))}
            </ul>
            {series.some((bar) => bar.ms === null) && (
              <p className="mt-2 text-xs text-muted-foreground">점선은 기록이 없는 때예요.</p>
            )}
          </div>

          {month.state === "measured" && (
            <div className="space-y-2">
              <p className="text-sm font-bold">이 구독의 가성비</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">시간당</p>
                  <p className="font-mono text-lg font-black tabular-nums">
                    {month.hourlyKRW === null ? "—" : won(month.hourlyKRW)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    최근 {Math.min(30, month.totals.coveredDays)}일{" "}
                    {formatDuration(month.totals.usedMs)} 기준
                  </p>
                </div>
                <div className="rounded-2xl bg-secondary/60 px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">회당</p>
                  <p className="font-mono text-lg font-black tabular-nums">
                    {month.perOpenKRW === null ? "—" : won(month.perOpenKRW)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px]",
                      month.level ? LEVEL_STYLE[month.level].text : "text-muted-foreground",
                    )}
                  >
                    최근 {Math.min(30, month.totals.coveredDays)}일 {month.totals.opens}회
                    {month.level && ` · ${LEVEL_STYLE[month.level].label}`}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                TV·PC에서 본 건 빠져 있어요. 체크인은 이 숫자를 채워 두고 고칠 수 있게 해요.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
