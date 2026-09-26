"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";
import { metricForSubscription, sumMyMonthlyKRW, type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { firstRecordedDay, formatDuration, monthlyTotals } from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, packageBreakdown, packagesFor } from "@lib/usage/packages";
import {
  LEVEL_STYLE,
  RANGE_DAYS,
  compareValue,
  metricView,
  rangeDates,
  subUsage,
  type MetricView,
  type SubUsage,
  type UsageRange,
} from "@lib/usage/value";
import { Button } from "../../ui/button";
import { AppSheet } from "../../settings/app/AppSheet";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { RangeTabs, StatTile, SubLogo, monthDay, won } from "./parts";

type SortKey = "value" | "time" | "opens";

const SORT_LABEL: Record<SortKey, string> = {
  value: "가성비",
  time: "사용 시간",
  opens: "쓴 횟수",
};

/** 구독 하나의 줄: 고른 기간의 사용량(시간·횟수 칩)과 최근 30일의 가성비(가성비 칩). */
interface Line {
  period: SubUsage;
  month: SubUsage;
  view: MetricView | null;
}

const isUnused = (u: SubUsage) => u.totals.opens === 0 && u.totals.usedMs === 0;

/**
 * 잰 것이 앞, 앱 없음·기록 없음이 뒤. 가성비는 안 쓴 것 → 비쌈 → 애매 → 잘 씀(평가 전이면 '잘 씀'까지 먼 순),
 * 시간·횟수는 많은 순(안 쓴 것은 뒤).
 */
function compare(sort: SortKey) {
  const group = (line: Line) => (line.period.state === "measured" && line.view ? 0 : 1);
  return (a: Line, b: Line) => {
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
 * 평가 글자와 색. 평가 전이면 남은 날을 회색으로. 한 번도 안 연 것은 평가가 아니라 관측이라 평가 전에도
 * 그대로 말한다('9일 동안 안 열었어요') — 바로 알고 싶은 것은 대개 이것이다.
 */
function verdictOf(
  view: MetricView,
  unused: boolean,
  covered: number,
): { text: string; className: string } {
  if (unused && view.pendingDays > 0) {
    return { text: `${covered}일 동안 안 열었어요`, className: LEVEL_STYLE.red.text };
  }
  if (view.pendingDays > 0) {
    return { text: `평가까지 ${view.pendingDays}일`, className: "text-muted-foreground" };
  }
  if (unused) return { text: "안 씀", className: LEVEL_STYLE.red.text };
  const level = view.level ?? "red";
  return { text: LEVEL_STYLE[level].label, className: LEVEL_STYLE[level].text };
}

/** '6일 사용' · '4회' · '2시간 10분' — 가성비 지표로 잰 양. */
function amountText(view: MetricView, usage: SubUsage): string {
  if (view.metric === "uses") return `${usage.totals.opens}회`;
  if (view.metric === "days") return `${usage.totals.activeDays}일 사용`;
  return formatDuration(usage.totals.usedMs);
}

function formatGoalAmount(value: number, unit: string): string {
  const rounded = unit === "시간" ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded}${unit}`;
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
      .map((sub): Line => {
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
    return monthlyTotals(history, packages.length > 0 ? packages : ALL_USAGE_PACKAGES, now);
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
  const hasYear = months.some((m) => m.totals.coveredDays > 0);
  const maxMonthMs = Math.max(1, ...months.map((m) => m.totals.usedMs));

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
          <div className="flex h-28 items-end gap-1" aria-hidden>
            {months.map((m) => (
              <div
                key={m.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                {m.totals.coveredDays > 0 ? (
                  <div
                    className="w-full rounded-t-md bg-foreground/80"
                    style={{ height: `${Math.max(2, (m.totals.usedMs / maxMonthMs) * 100)}%` }}
                  />
                ) : (
                  <div className="h-1 w-full rounded-full border border-dashed border-border" />
                )}
                <span className="text-[9.5px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
          <ul className="sr-only">
            {months.map((m) => (
              <li key={m.month}>
                {m.label}:{" "}
                {m.totals.coveredDays > 0 ? formatDuration(m.totals.usedMs) : "기록 없음"}
              </li>
            ))}
          </ul>
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

/** 목록 한 줄의 가운데: 이름·오른쪽 값·아랫줄·막대. 고른 칩에 따라 값과 막대가 바뀐다. */
function UsageLine({
  line,
  sort,
  totalMs,
  totalOpens,
}: {
  line: Line;
  sort: SortKey;
  totalMs: number;
  totalOpens: number;
}) {
  const { period, month, view } = line;
  const packages = packagesFor(period.sub) ?? [];
  const breakdown =
    period.state === "measured" ? packageBreakdown(packages, period.totals.byPackage) : [];

  if (period.state !== "measured" || !view) {
    return (
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-bold">{period.sub.name}</p>
        <p className="text-xs text-muted-foreground">
          {period.state === "not-installed" ? "이 폰에 앱이 없어요" : "이 기간에는 기록이 없어요"}
        </p>
      </div>
    );
  }

  const unused = isUnused(month);
  const verdict = verdictOf(view, unused, month.totals.coveredDays);
  const barColor =
    view.pendingDays > 0 || !view.level
      ? "bg-foreground/70"
      : LEVEL_STYLE[unused ? "red" : view.level].bar;

  let value: React.ReactNode;
  let detail: React.ReactNode;
  let width: number;
  let caption: string;
  if (sort === "value") {
    value = unused ? (
      <span className={cn("text-xs font-semibold", LEVEL_STYLE.red.text)}>안 씀</span>
    ) : view.short ? (
      <>
        <span className="text-sm font-black tabular-nums">{won(month.periodCostKRW)}</span>
        <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
          {formatDuration(month.totals.usedMs)}에
        </span>
      </>
    ) : (
      <>
        <span className="text-sm font-black tabular-nums">
          {view.unitKRW === null ? "—" : won(view.unitKRW)}
        </span>
        <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
          {view.perLabel}
        </span>
      </>
    );
    detail = unused ? (
      <span className={LEVEL_STYLE.red.text}>
        {month.totals.coveredDays}일 동안 이 폰에서 한 번도 안 열었어요
      </span>
    ) : (
      <>
        <span className={cn("font-semibold", verdict.className)}>{verdict.text}</span> ·{" "}
        {amountText(view, month)}
      </>
    );
    // 평가 전에는 늘리지 않은 양을 30일 목표에 대 본다 — 며칠 치를 30일로 늘려 꽉 채우지 않게.
    const have = view.pendingDays > 0 ? view.have : view.have30;
    width = Math.min(100, (have / view.goal) * 100);
    caption =
      view.pendingDays > 0
        ? `${month.totals.coveredDays}일 동안 ${formatGoalAmount(view.have, view.goalUnit)} · 잘 씀 기준은 30일에 ${view.goal}${view.goalUnit}`
        : `한 달에 ${formatGoalAmount(view.have30, view.goalUnit)} · 잘 씀 기준 ${view.goal}${view.goalUnit}`;
  } else if (sort === "time") {
    value = (
      <span className="text-sm font-black tabular-nums">
        {formatDuration(period.totals.usedMs)}
      </span>
    );
    detail = (
      <>
        {period.totals.opens}회 · <span className={verdict.className}>{verdict.text}</span>
      </>
    );
    width = totalMs > 0 ? (period.totals.usedMs / totalMs) * 100 : 0;
    caption = `구독 앱 전체 사용 시간의 ${Math.round(width)}%`;
  } else {
    value = (
      <span className="text-sm font-black tabular-nums">
        {period.totals.opens}
        <span className="ml-0.5 text-[11px] font-bold">회</span>
      </span>
    );
    detail = (
      <>
        {formatDuration(period.totals.usedMs)} ·{" "}
        <span className={verdict.className}>{verdict.text}</span>
      </>
    );
    width = totalOpens > 0 ? (period.totals.opens / totalOpens) * 100 : 0;
    caption = `구독 앱 전체 쓴 횟수의 ${Math.round(width)}%`;
  }

  return (
    <div className="min-w-0 flex-1 space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-sm font-bold">{period.sub.name}</p>
        <span className="shrink-0 text-right">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{detail}</p>
      {breakdown.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {breakdown.map((row) => `${row.label} ${formatDuration(row.usedMs)}`).join(" · ")}
        </p>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", barColor)}
          style={{ width: `${width > 0 ? Math.max(3, width) : 0}%` }}
        />
      </div>
      <p className="text-[10.5px] text-muted-foreground">{caption}</p>
    </div>
  );
}

/**
 * 리포트에 펼쳐 두는 요약 카드(최근 30일). 누르면 전체(기간 탭·정렬·목록·1년 추이)를 시트로 연다.
 *
 * 평가 전(기록 30일 전)에는 사실만 보인다 — 얼마나 썼고 어디에 몰렸는지. 평가가 나오면 '아까운 구독'을 맨
 * 위에 두고, 세 줄은 가성비가 나쁜 순으로 '잘 씀' 기준 막대를 보인다.
 */
function UsageCard({
  rows,
  onOpen,
}: {
  rows: { usage: SubUsage; view: MetricView }[];
  onOpen: () => void;
}) {
  const rate = useExchangeRate();
  const covered = Math.max(0, ...rows.map((row) => row.usage.totals.coveredDays));
  const totalMs = rows.reduce((sum, row) => sum + row.usage.totals.usedMs, 0);
  const totalOpens = rows.reduce((sum, row) => sum + row.usage.totals.opens, 0);
  const pendingDays = Math.max(0, ...rows.map((row) => row.view.pendingDays));
  const unusedRows = rows.filter((row) => isUnused(row.usage));

  let body: React.ReactNode;
  if (covered === 0) {
    body = (
      <span className="mt-2 block text-sm text-muted-foreground">
        오늘부터 이 폰의 사용 기록을 쌓는 중이에요.
      </span>
    );
  } else if (pendingDays > 0) {
    const top = [...rows]
      .sort((a, b) => b.usage.totals.usedMs - a.usage.totals.usedMs)
      .slice(0, 3)
      .filter((row) => row.usage.totals.usedMs > 0);
    body = (
      <>
        <span className="mt-2.5 flex gap-5">
          <span>
            <span className="block text-[11px] text-muted-foreground">사용 시간</span>
            <span className="text-xl font-black tracking-tight tabular-nums">
              {formatDuration(totalMs)}
            </span>
          </span>
          <span>
            <span className="block text-[11px] text-muted-foreground">쓴 횟수</span>
            <span className="text-xl font-black tracking-tight tabular-nums">
              {totalOpens.toLocaleString("ko-KR")}
              <span className="ml-0.5 text-xs font-bold">회</span>
            </span>
          </span>
        </span>
        {top.length > 0 && (
          <span className="mt-3 grid gap-2">
            {top.map((row) => (
              <span
                key={row.usage.sub.id}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="truncate font-semibold">{row.usage.sub.name}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full rounded-full bg-foreground/70"
                    style={{ width: `${Math.max(3, (row.usage.totals.usedMs / totalMs) * 100)}%` }}
                  />
                </span>
                <span className="text-[11px] font-semibold tabular-nums">
                  {formatDuration(row.usage.totals.usedMs)}
                </span>
              </span>
            ))}
            <span className="text-[11px] text-muted-foreground">
              막대는 전체 사용 시간 중 차지하는 몫이에요.
            </span>
          </span>
        )}
        {unusedRows.length > 0 && (
          <span className={cn("mt-2 block text-xs font-semibold", LEVEL_STYLE.red.text)}>
            {covered}일 동안 한 번도 안 연 구독:{" "}
            {unusedRows.map((row) => row.usage.sub.name).join(" · ")}
          </span>
        )}
      </>
    );
  } else {
    const sorted = [...rows].sort(
      (a, b) =>
        (isUnused(a.usage) ? 0 : 1) - (isUnused(b.usage) ? 0 : 1) || compareValue(a.view, b.view),
    );
    const pricey = sorted.filter((row) => isUnused(row.usage) || row.view.level === "red");
    body = (
      <>
        {pricey.length > 0 ? (
          <span className="mt-2 block">
            <span className="block text-xl font-black tracking-tight">
              아까운 구독 <span className={LEVEL_STYLE.red.text}>{pricey.length}개</span>
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {pricey.map((row) => row.usage.sub.name).join(" · ")} — 한 달{" "}
              {won(
                sumMyMonthlyKRW(
                  pricey.map((row) => row.usage.sub),
                  rate,
                ),
              )}
            </span>
          </span>
        ) : (
          <span className="mt-2 block">
            <span className="block text-xl font-black tracking-tight">모두 제값을 하고 있어요</span>
            <span className="block text-xs text-muted-foreground">이 폰에서 잰 것 기준이에요</span>
          </span>
        )}
        <span className="mt-3 grid gap-2">
          {sorted.slice(0, 3).map((row) => {
            const unused = isUnused(row.usage);
            const level = unused ? "red" : (row.view.level ?? "red");
            return (
              <span
                key={row.usage.sub.id}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="truncate font-semibold">{row.usage.sub.name}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={cn("block h-full rounded-full", LEVEL_STYLE[level].bar)}
                    style={{
                      width: `${unused ? 0 : Math.max(3, Math.min(100, (row.view.have30 / row.view.goal) * 100))}%`,
                    }}
                  />
                </span>
                <span className={cn("text-[11px] font-semibold", LEVEL_STYLE[level].text)}>
                  {unused ? "안 씀" : LEVEL_STYLE[level].label}
                </span>
              </span>
            );
          })}
          <span className="text-[11px] text-muted-foreground">
            막대가 꽉 차면 &lsquo;잘 씀&rsquo;이에요.
          </span>
        </span>
      </>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-2xl border p-4 text-left hover:bg-muted/50"
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-base font-bold">구독 사용 현황</span>
        <span className="text-xs text-muted-foreground">
          이 폰 · {covered > 0 && covered < 30 ? `기록 ${covered}일` : "최근 30일"}
        </span>
      </span>
      {body}
      <span className="mt-3 flex items-center justify-between border-t border-dashed pt-2.5 text-xs">
        <span
          className={cn(
            pendingDays > 0 ? "font-semibold text-muted-foreground" : "text-muted-foreground",
          )}
        >
          {covered === 0
            ? ""
            : pendingDays > 0
              ? `가성비 평가까지 ${pendingDays}일`
              : `사용 ${formatDuration(totalMs)} · ${totalOpens.toLocaleString("ko-KR")}회`}
        </span>
        <span className="flex items-center gap-0.5 font-bold">
          자세히 보기 <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}
