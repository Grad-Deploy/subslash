"use client";

import React, { useEffect, useState } from "react";
import {
  getDaysUntilBillingFor,
  getNextBillingDateFor,
  type BillingSchedule,
} from "@subslash/shared";
import { cn } from "@lib/utils";

/**
 * Uses the shared billing-date helpers so the badge always agrees with the
 * D-Day ordering the dashboard applies to the same list.
 */
function useLocalDday(schedule: BillingSchedule) {
  const [dDay, setDDay] = useState<number | null>(() => getDaysUntilBillingFor(schedule));
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const { billingDay, billingCycle, billingMonth } = schedule;

  useEffect(() => {
    const current = { billingDay, billingCycle, billingMonth };
    const updateTime = () => {
      const now = new Date();
      const days = getDaysUntilBillingFor(current, now);
      setDDay(days);

      if (days !== null && days <= 1) {
        const next = getNextBillingDateFor(current, now);
        const diffMs = next ? next.getTime() - now.getTime() : 0;
        const clamped = Math.max(0, diffMs);
        const hours = Math.floor((clamped % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((clamped % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((clamped % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [billingDay, billingCycle, billingMonth]);

  return { dDay, timeLeft };
}

export function DdayCountdown({
  subscription,
  className,
}: {
  subscription: BillingSchedule;
  className?: string;
}) {
  const { dDay, timeLeft } = useLocalDday(subscription);

  // A yearly plan with no billing month has no date to count down to. Showing
  // a number here would be inventing one.
  if (dDay === null) {
    return (
      <div className={cn("flex flex-col items-end", className)}>
        <div className="text-xs font-semibold text-muted-foreground">결제 월 미설정</div>
        <div className="text-[10px] text-muted-foreground opacity-80">연간 결제일을 알려주세요</div>
      </div>
    );
  }

  const isDanger = dDay <= 1;
  const isWarning = dDay === 2 || dDay === 3;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "text-2xl font-bold transition-all",
          isDanger
            ? "text-red-500 animate-pulse"
            : isWarning
              ? "text-yellow-500"
              : "text-green-500",
        )}
      >
        {dDay === 0 ? "D-Day" : `D-${dDay}`}
      </div>
      {isDanger && <div className="text-xs font-mono text-red-500 mt-1">{timeLeft}</div>}
    </div>
  );
}
