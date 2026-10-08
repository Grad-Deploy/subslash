"use client";

import React from "react";
import Link from "next/link";
import { Subscription, getKillCheckStatus } from "@subslash/shared";
import { useT } from "@lib/i18n";

interface KillCheckLabelProps {
  subscription: Subscription;
  now: Date;
}

/**
 * 해지한 구독 한 줄에 붙는 결제 확인 상태.
 *
 * 절약 금액 옆에 "이 해지가 정말 결제를 멈췄는지"를 함께 적는다. 확인하지
 * 않은 해지를 확인된 것처럼 보여주지 않기 위해서다.
 */
export function KillCheckLabel({ subscription, now }: KillCheckLabelProps) {
  const t = useT();
  const k = t.savings.killCheck;
  const dateText = (date: Date) =>
    t.dashboard.reason.killCheckDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getFullYear() === now.getFullYear(),
    );
  const check = getKillCheckStatus(subscription, now);
  if (!check) return null;

  switch (check.state) {
    case "verified":
      return <p className="text-[11px] text-emerald-700 dark:text-emerald-300">{k.verified}</p>;
    case "due":
      return (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          {k.due(dateText(check.billingDate))}
          <Link href="/dashboard" className="underline underline-offset-2">
            {k.dueLink}
          </Link>
        </p>
      );
    case "waiting":
      return (
        <p className="text-[11px] text-muted-foreground">
          {k.waiting(dateText(check.billingDate))}
        </p>
      );
    case "unknown":
      return <p className="text-[11px] text-muted-foreground">{k.unknown}</p>;
  }
}
