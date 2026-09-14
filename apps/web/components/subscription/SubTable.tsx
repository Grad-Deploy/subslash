"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { subscriptionDetailHref } from "@lib/routes";
import {
  CATEGORY_LABELS,
  STALE_CHECK_IN_DAYS,
  Subscription,
  UsageLog,
  formatCurrency,
  formatDday,
  formatKRW,
  getCheckInEvidence,
  getDaysUntilBillingFor,
  getMyMonthlyAmountKRW,
  getSharingCount,
  isShared,
  sumMyMonthlyKRW,
  toKRW,
  type RiskLevel,
} from "@subslash/shared";
import { Button } from "../ui/button";
import { cn } from "@lib/utils";
import { isWideScreen } from "@lib/wide-screen";
import { useExchangeRate } from "../../hooks/useExchangeRate";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type SortKey = "name" | "myMonthly" | "nextBilling" | "costPerUse" | "killedAt";
type SortDir = "asc" | "desc";

interface Row {
  sub: Subscription;
  myMonthly: number;
  /** 결제일을 모르면(결제 월 없는 연간 구독) null. */
  days: number | null;
  latest: UsageLog | null;
  /** 정렬용. 통화가 섞여 있어도 비교할 수 있게 원화로 맞춘 1회 단가. */
  costPerUseKRW: number | null;
  checkedDaysAgo: number | null;
  killedAtMs: number | null;
}

const RISK_TEXT: Record<RiskLevel, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-amber-600 dark:text-amber-400",
  red: "text-rose-600 dark:text-rose-400",
};

function daysAgoLabel(days: number): string {
  return days <= 0 ? "오늘" : `${days}일 전`;
}

function value(row: Row, key: SortKey): string | number | null {
  switch (key) {
    case "name":
      return row.sub.name;
    case "myMonthly":
      return row.myMonthly;
    case "nextBilling":
      return row.days;
    case "costPerUse":
      return row.costPerUseKRW;
    case "killedAt":
      return row.killedAtMs;
  }
}

interface SubTableProps {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  mode: "active" | "killed";
  onCheckIn?: (id: string) => void;
  onKill?: (id: string) => void;
  onRevive?: (id: string) => void;
  onDelete?: (id: string) => void;
  /** 넓은 화면에서 옆 칸에 열려 있는 구독. */
  selectedId?: string | null;
  /** 넓은 화면에서는 이름을 누르면 페이지를 옮기지 않고 옆 칸에 연다. */
  onSelect?: (id: string) => void;
  /** 지금 정렬된 순서. 옆 칸의 ↑↓가 표에 보이는 순서대로 넘기게 알린다. */
  onOrderChange?: (ids: string[]) => void;
  /**
   * 넓은 화면(xl)에 옆 칸이 있다. 그 폭에서는 요금·동작 열을 숨긴다 — 버튼은
   * 옆 칸에 있고, 여섯 열이 다 들어가지 않는다.
   */
  sidePanel?: boolean;
}

/**
 * 넓은 화면용 구독 표. 카드와 같은 동작을 한 줄에 모은다.
 *
 * 모르는 값은 채우지 않는다 — 체크인이 없으면 1회 단가 대신 '체크인 기록 없음',
 * 결제 월이 없는 연간 구독은 D-day 대신 '결제 월 미설정'. 정렬할 때 이런 줄은
 * 방향과 상관없이 맨 뒤로 보낸다.
 */
export function SubTable({
  subscriptions,
  usageLogs,
  mode,
  onCheckIn,
  onKill,
  onRevive,
  onDelete,
  selectedId = null,
  onSelect,
  onOrderChange,
  sidePanel = false,
}: SubTableProps) {
  const wideHidden = sidePanel ? "xl:hidden" : "";
  const rate = useExchangeRate();
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>(
    mode === "active" ? { key: "nextBilling", dir: "asc" } : { key: "killedAt", dir: "desc" },
  );

  const now = new Date();
  const rows: Row[] = subscriptions.map((sub) => {
    const latest =
      getCheckInEvidence(usageLogs.filter((log) => log.subscriptionId === sub.id))?.latest ?? null;
    const checkedMs = latest ? Date.parse(latest.checkedAt) : Number.NaN;
    const killedMs = sub.killedAt ? Date.parse(sub.killedAt) : Number.NaN;
    return {
      sub,
      myMonthly: getMyMonthlyAmountKRW(sub, rate),
      days: getDaysUntilBillingFor(sub, now),
      latest,
      costPerUseKRW: latest ? toKRW(latest.costPerUse, sub.currency, rate) : null,
      checkedDaysAgo: Number.isNaN(checkedMs)
        ? null
        : Math.floor((now.getTime() - checkedMs) / MS_PER_DAY),
      killedAtMs: Number.isNaN(killedMs) ? null : killedMs,
    };
  });

  const sorted = [...rows].sort((a, b) => {
    const left = value(a, sort.key);
    const right = value(b, sort.key);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    const cmp =
      typeof left === "string" && typeof right === "string"
        ? left.localeCompare(right, "ko")
        : Number(left) - Number(right);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  const orderKey = sorted.map((row) => row.sub.id).join("|");
  useEffect(() => {
    onOrderChange?.(orderKey ? orderKey.split("|") : []);
  }, [orderKey, onOrderChange]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );

  // 컴포넌트가 아니라 함수로 그린다. 렌더마다 새 컴포넌트를 만들면 머리글 버튼이
  // 다시 만들어져, 정렬을 누른 뒤 키보드 초점이 사라진다.
  const sortHeader = (sortKey: SortKey, label: string, align: "left" | "right" = "right") => {
    const active = sort.key === sortKey;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        className={cn("px-4 py-2.5 font-medium", align === "right" ? "text-right" : "text-left")}
      >
        <button
          type="button"
          onClick={() => toggleSort(sortKey)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground",
            active && "text-foreground",
          )}
        >
          {label}
          <span aria-hidden="true" className="text-[10px]">
            {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            {sortHeader("name", "서비스", "left")}
            <th scope="col" className={cn("px-4 py-2.5 text-right font-medium", wideHidden)}>
              요금
            </th>
            {sortHeader("myMonthly", "내 몫(월)")}
            {mode === "active" ? (
              <>
                {sortHeader("nextBilling", "다음 결제")}
                {sortHeader("costPerUse", "1회 단가")}
              </>
            ) : (
              sortHeader("killedAt", "해지일")
            )}
            <th scope="col" className={cn("px-4 py-2.5 text-right font-medium", wideHidden)}>
              <span className="sr-only">동작</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ sub, myMonthly, days, latest, checkedDaysAgo, killedAtMs }) => (
            <tr
              key={sub.id}
              className={cn(
                "border-t align-middle hover:bg-muted/30",
                selectedId === sub.id && "bg-primary/5",
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">
                    {sub.iconUrl || "📦"}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={subscriptionDetailHref(sub.id)}
                      aria-current={selectedId === sub.id ? "true" : undefined}
                      onClick={(e) => {
                        if (onSelect && isWideScreen()) {
                          e.preventDefault();
                          onSelect(sub.id);
                        }
                      }}
                      className={cn(
                        "font-semibold hover:underline",
                        mode === "killed" && "line-through text-muted-foreground",
                      )}
                    >
                      {sub.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABELS[sub.category] ?? sub.category}
                    </p>
                  </div>
                </div>
              </td>
              <td className={cn("px-4 py-3 text-right tabular-nums whitespace-nowrap", wideHidden)}>
                {sub.billingCycle === "yearly" ? "연 " : "월 "}
                {formatCurrency(sub.amount, sub.currency)}
                {isShared(sub) && (
                  <p className="text-[11px] text-muted-foreground">
                    👥 {getSharingCount(sub)}명이서 나눔
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                {formatKRW(myMonthly)}
              </td>
              {mode === "active" ? (
                <>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {days === null ? (
                      <span className="text-xs text-muted-foreground">결제 월 미설정</span>
                    ) : (
                      <span
                        className={cn(
                          "font-mono font-bold",
                          days <= 3 && "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {formatDday(days)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {latest ? (
                      <>
                        <span
                          className={cn("font-semibold tabular-nums", RISK_TEXT[latest.riskLevel])}
                        >
                          {formatCurrency(latest.costPerUse, sub.currency)}
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          {latest.usageCount}회
                          {checkedDaysAgo !== null && ` · ${daysAgoLabel(checkedDaysAgo)}`}
                          {checkedDaysAgo !== null && checkedDaysAgo > STALE_CHECK_IN_DAYS && (
                            <span className="text-amber-600 dark:text-amber-400">
                              {" "}
                              · 다시 체크인
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">체크인 기록 없음</span>
                    )}
                  </td>
                </>
              ) : (
                <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                  {killedAtMs === null
                    ? "날짜 모름"
                    : new Date(killedAtMs).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                </td>
              )}
              <td className={cn("px-4 py-3", wideHidden)}>
                <div className="flex justify-end gap-2">
                  {mode === "active" ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onCheckIn?.(sub.id)}>
                        체크인
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onKill?.(sub.id)}>
                        해지하기
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => onRevive?.(sub.id)}>
                        다시 살리기
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(sub.id)}
                        >
                          삭제
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        {mode === "active" && (
          <tfoot className="border-t bg-muted/30 text-xs">
            <tr>
              <td className="px-4 py-2.5 font-medium text-muted-foreground" colSpan={2}>
                합계 {subscriptions.length}건
              </td>
              <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                {formatKRW(sumMyMonthlyKRW(subscriptions, rate))}
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
