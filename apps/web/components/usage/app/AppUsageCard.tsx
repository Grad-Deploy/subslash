"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { sumMyMonthlyKRW } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { formatDuration } from "@lib/usage/history";
import { LEVEL_STYLE, compareValue, type MetricView, type SubUsage } from "@lib/usage/value";
import { isUnused } from "./AppUsageLine";
import { won } from "./parts";

/** 카드의 구독 한 줄: 이름 · 막대 · 오른쪽 값. */
function CardBarRow({
  name,
  width,
  barClassName,
  value,
  valueClassName,
}: {
  name: string;
  width: number;
  barClassName: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <span className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-xs">
      <span className="truncate font-semibold">{name}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <span
          className={cn("block h-full rounded-full", barClassName)}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className={cn("text-[11px] font-semibold", valueClassName)}>{value}</span>
    </span>
  );
}

/**
 * 리포트에 펼쳐 두는 요약 카드(최근 30일). 누르면 전체(기간 탭·정렬·목록·1년 추이)를 시트로 연다.
 *
 * 평가 전(기록 30일 전)에는 사실만 보인다 — 얼마나 썼고 어디에 몰렸는지. 평가가 나오면 '아까운 구독'을 맨
 * 위에 두고, 세 줄은 가성비가 나쁜 순으로 '잘 씀' 기준 막대를 보인다.
 */
export function UsageCard({
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
              <CardBarRow
                key={row.usage.sub.id}
                name={row.usage.sub.name}
                width={Math.max(3, (row.usage.totals.usedMs / totalMs) * 100)}
                barClassName="bg-foreground/70"
                value={formatDuration(row.usage.totals.usedMs)}
                valueClassName="tabular-nums"
              />
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
              <CardBarRow
                key={row.usage.sub.id}
                name={row.usage.sub.name}
                width={
                  unused ? 0 : Math.max(3, Math.min(100, (row.view.have30 / row.view.goal) * 100))
                }
                barClassName={LEVEL_STYLE[level].bar}
                value={unused ? "안 씀" : LEVEL_STYLE[level].label}
                valueClassName={LEVEL_STYLE[level].text}
              />
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
