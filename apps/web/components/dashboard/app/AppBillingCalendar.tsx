"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronRight } from "lucide-react";
import { formatDday, getDaysUntilBillingFor, isInTrial, type Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";
import { AppSheet } from "../../settings/app/AppSheet";
import { BillingCalendar } from "../BillingCalendar";

/** 이 안에 결제가 있으면 상단 달력 아이콘에 점을 찍는다. */
const SOON_DAYS = 7;

/**
 * 다음 결제(가장 가까운 것)와 이번 달 남은 결제 수. 체험 중인 구독과 결제 월을 모르는 연간 구독은 뺀다
 * (나가는 돈이 없거나 날짜를 모른다 — BillingCalendar와 같은 규칙).
 */
function useUpcoming(now: Date) {
  const subscriptions = useStore((state) => state.subscriptions);
  return useMemo(() => {
    const active = subscriptions.filter((sub) => sub.status === "active");
    const dated = active
      .filter((sub) => !isInTrial(sub, now))
      .map((sub) => ({ sub, days: getDaysUntilBillingFor(sub, now) }))
      .filter(
        (row): row is { sub: Subscription; days: number } => row.days !== null && row.days >= 0,
      )
      .sort((a, b) => a.days - b.days);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const leftThisMonth = dated.filter((row) => now.getDate() + row.days <= lastDay).length;
    return { active, next: dated[0] ?? null, leftThisMonth };
  }, [subscriptions, now]);
}

function CalendarSheet({
  open,
  onClose,
  active,
  now,
}: {
  open: boolean;
  onClose: () => void;
  active: Subscription[];
  now: Date;
}) {
  return (
    <AppSheet open={open} onClose={onClose} label="결제 달력">
      <div className="pt-1">
        <BillingCalendar subscriptions={active} now={now} />
      </div>
    </AppSheet>
  );
}

/**
 * 상단 바의 결제 달력 아이콘(앱). 예전에는 대시보드 한가운데 달력이 있어 할 일과 계산서 사이를 막았다.
 * 7일 안에 결제가 있으면 점을 찍어, 열어 보지 않아도 곧 결제가 있다는 것을 알린다.
 */
export function AppCalendarButton() {
  const now = useMemo(() => new Date(), []);
  const { active, next } = useUpcoming(now);
  const [open, setOpen] = useState(false);
  const soon = next !== null && next.days <= SOON_DAYS;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={soon ? `결제 달력 · ${SOON_DAYS}일 안에 결제 있음` : "결제 달력"}
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <CalendarDays className="size-5" aria-hidden />
        {soon && (
          <span
            className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background"
            aria-hidden
          />
        )}
      </button>
      <CalendarSheet open={open} onClose={() => setOpen(false)} active={active} now={now} />
    </>
  );
}

/**
 * 대시보드의 '다음 결제' 한 줄(앱). 달력을 아이콘으로 옮기면 처음 쓰는 사람은 달력이 있는지 모르므로, 가장
 * 가까운 결제를 한 줄로 남기고 누르면 같은 달력을 연다.
 */
export function AppNextBilling() {
  const now = useMemo(() => new Date(), []);
  const { active, next, leftThisMonth } = useUpcoming(now);
  const [open, setOpen] = useState(false);
  if (active.length === 0) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-left hover:bg-muted/50"
      >
        <CalendarDays className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            {next ? (
              <>
                다음 결제 · {next.sub.name}{" "}
                <span
                  className={cn(
                    next.days <= SOON_DAYS ? "text-destructive" : "text-muted-foreground",
                    "font-black",
                  )}
                >
                  {formatDday(next.days)}
                </span>
              </>
            ) : (
              "결제일을 아는 구독이 없어요"
            )}
          </span>
          <span className="block text-xs text-muted-foreground">
            {leftThisMonth > 0 ? `이번 달 남은 결제 ${leftThisMonth}건 · ` : ""}달력 보기
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <CalendarSheet open={open} onClose={() => setOpen(false)} active={active} now={now} />
    </>
  );
}
