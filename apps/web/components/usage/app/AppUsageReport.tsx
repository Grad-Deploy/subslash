"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";
import { type Subscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { subscriptionDetailHref } from "@lib/routes";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { firstRecordedDay, formatDuration, monthlyTotals } from "@lib/usage/history";
import { ALL_USAGE_PACKAGES, packageBreakdown, packagesFor } from "@lib/usage/packages";
import {
  LEVEL_STYLE,
  RANGE_DAYS,
  rangeDates,
  subUsage,
  type SubUsage,
  type UsageRange,
} from "@lib/usage/value";
import { Button } from "../../ui/button";
import { AppSheet } from "../../settings/app/AppSheet";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { RangeTabs, StatTile, SubLogo, monthDay, won } from "./parts";

type SortKey = "hourly" | "time" | "opens";

const SORT_LABEL: Record<SortKey, string> = {
  hourly: "시간당 단가",
  time: "사용 시간",
  opens: "쓴 횟수",
};

/** 잰 것 → 안 쓴 것 → 앱 없음/기록 없음 순. 같은 무리 안에서는 고른 기준으로. */
function compare(sort: SortKey) {
  const group = (u: SubUsage) =>
    u.state !== "measured" ? 2 : u.totals.opens === 0 && u.totals.usedMs === 0 ? 1 : 0;
  return (a: SubUsage, b: SubUsage) => {
    const g = group(a) - group(b);
    if (g !== 0) return g;
    if (sort === "time") return b.totals.usedMs - a.totals.usedMs;
    if (sort === "opens") return b.totals.opens - a.totals.opens;
    return (b.hourlyKRW ?? -1) - (a.hourlyKRW ?? -1);
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
  const [sort, setSort] = useState<SortKey>("hourly");
  const [accessOpen, setAccessOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const mapped = useMemo(() => active.filter((sub) => packagesFor(sub)), [active]);

  const now = useMemo(() => new Date(), []);
  const usages = useMemo(() => {
    const dates = rangeDates(range, now);
    return mapped.map((sub) => subUsage(sub, history, installed, dates, rate)).sort(compare(sort));
  }, [mapped, history, installed, range, sort, rate, now]);

  const months = useMemo(() => {
    const packages = [...new Set(mapped.flatMap((sub) => packagesFor(sub) ?? []))];
    return monthlyTotals(history, packages.length > 0 ? packages : ALL_USAGE_PACKAGES, now);
  }, [mapped, history, now]);

  // 카드는 기간 탭과 관계없이 늘 최근 30일이다(체크인과 같은 기준).
  const card = useMemo(() => {
    const dates = rangeDates("month", now);
    return mapped
      .map((sub) => subUsage(sub, history, installed, dates, rate))
      .filter((u) => u.state === "measured");
  }, [mapped, history, installed, rate, now]);

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
  const maxMs = Math.max(1, ...measured.map((u) => u.totals.usedMs));
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

          <ul className="divide-y rounded-2xl border">
            {usages.map((u) => (
              <li key={u.sub.id}>
                <Link
                  href={subscriptionDetailHref(u.sub.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <SubLogo sub={u.sub} size={32} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-bold">{u.sub.name}</p>
                      <UsageValue usage={u} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.state === "not-installed"
                        ? "이 폰에 앱이 없어요"
                        : u.state === "no-data"
                          ? "이 기간에는 기록이 없어요"
                          : u.totals.opens === 0 && u.totals.usedMs === 0
                            ? "0회 · 이 폰에서는 안 열었어요"
                            : `${u.totals.opens}회 · ${formatDuration(u.totals.usedMs)}`}
                    </p>
                    {u.state === "measured" &&
                      packageBreakdown(packagesFor(u.sub) ?? [], u.totals.byPackage).length > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          {packageBreakdown(packagesFor(u.sub) ?? [], u.totals.byPackage)
                            .map((row) => `${row.label} ${formatDuration(row.usedMs)}`)
                            .join(" · ")}
                        </p>
                      )}
                    {u.state === "measured" && u.totals.usedMs > 0 && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            u.level ? LEVEL_STYLE[u.level].bar : "bg-muted-foreground/40",
                          )}
                          style={{ width: `${Math.max(3, (u.totals.usedMs / maxMs) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground">
            막대 길이는 사용 시간, 색은 체크인과 같은 기준의 돈값이에요. TV·PC에서 본 건 빠져
            있어요.
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
      <UsageCard usages={card} onOpen={() => setSheetOpen(true)} />
      <AppSheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="구독 사용 현황">
        {detail}
      </AppSheet>
    </>
  );
}

/**
 * 리포트에 펼쳐 두는 요약 카드. 최근 30일 사용 시간·쓴 횟수와 많이 쓴 구독 세 개의 짧은 막대, 비쌈·안 씀
 * 개수만 보여 주고, 누르면 전체(기간 탭·정렬·목록·1년 추이)를 시트로 연다 — 리포트 스크롤을 늘리지 않게.
 */
function UsageCard({ usages, onOpen }: { usages: SubUsage[]; onOpen: () => void }) {
  const covered = Math.max(0, ...usages.map((u) => u.totals.coveredDays));
  const totalMs = usages.reduce((sum, u) => sum + u.totals.usedMs, 0);
  const totalOpens = usages.reduce((sum, u) => sum + u.totals.opens, 0);
  const top = [...usages].sort((a, b) => b.totals.usedMs - a.totals.usedMs).slice(0, 3);
  const maxMs = Math.max(1, ...top.map((u) => u.totals.usedMs));
  const pricey = usages.filter((u) => u.level === "red" && u.totals.usedMs > 0).length;
  const unused = usages.filter((u) => u.totals.opens === 0 && u.totals.usedMs === 0).length;

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

      {covered === 0 ? (
        <span className="mt-2 block text-sm text-muted-foreground">
          오늘부터 이 폰의 사용 기록을 쌓는 중이에요.
        </span>
      ) : (
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

          {top.some((u) => u.totals.usedMs > 0) && (
            <span className="mt-3 grid gap-2">
              {top.map((u) => (
                <span
                  key={u.sub.id}
                  className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs"
                >
                  <span className="truncate font-semibold">{u.sub.name}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        u.level ? LEVEL_STYLE[u.level].bar : "bg-muted-foreground/40",
                      )}
                      style={{
                        width: `${u.totals.usedMs > 0 ? Math.max(3, (u.totals.usedMs / maxMs) * 100) : 0}%`,
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      u.level && u.totals.usedMs > 0
                        ? LEVEL_STYLE[u.level].text
                        : "text-muted-foreground",
                    )}
                  >
                    {u.totals.usedMs === 0 && u.totals.opens === 0
                      ? "안 씀"
                      : u.level
                        ? LEVEL_STYLE[u.level].label
                        : "—"}
                  </span>
                </span>
              ))}
            </span>
          )}
        </>
      )}

      <span className="mt-3 flex items-center justify-between border-t border-dashed pt-2.5 text-xs">
        <span className="flex gap-1.5">
          {covered > 0 && (
            <>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-red-700 dark:text-red-400">
                비쌈 {pricey}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">
                안 씀 {unused}
              </span>
            </>
          )}
        </span>
        <span className="flex items-center gap-0.5 font-bold">
          자세히 보기 <ChevronRight className="size-3.5" aria-hidden />
        </span>
      </span>
    </button>
  );
}

function UsageValue({ usage }: { usage: SubUsage }) {
  if (usage.state !== "measured") return null;
  if (usage.totals.opens === 0 && usage.totals.usedMs === 0) {
    return <span className="shrink-0 text-xs font-semibold text-muted-foreground">안 씀</span>;
  }
  return (
    <span className="shrink-0 text-right">
      {usage.hourlyKRW !== null && (
        <span className="font-mono text-sm font-black tabular-nums">{won(usage.hourlyKRW)}</span>
      )}
      <span
        className={cn(
          "ml-1 text-[11px] font-semibold",
          usage.level ? LEVEL_STYLE[usage.level].text : "text-muted-foreground",
        )}
      >
        {usage.hourlyKRW !== null ? "시간당" : "1분 미만"}
        {usage.level && ` · ${LEVEL_STYLE[usage.level].label}`}
      </span>
    </span>
  );
}
