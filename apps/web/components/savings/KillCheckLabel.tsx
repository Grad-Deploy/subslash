"use client";

import React from "react";
import Link from "next/link";
import { Subscription, formatKillCheckDate, getKillCheckStatus } from "@subslash/shared";

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
  const check = getKillCheckStatus(subscription, now);
  if (!check) return null;

  switch (check.state) {
    case "verified":
      return (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
          ✅ 해지 후 결제가 멈춘 것을 확인했습니다
        </p>
      );
    case "due":
      return (
        <p className="text-[11px] text-amber-700 dark:text-amber-300">
          ⚠️ {formatKillCheckDate(check.billingDate, now)}에 결제가 됐는지 아직 확인하지 않았습니다
          ·{" "}
          <Link href="/dashboard" className="underline underline-offset-2">
            대시보드에서 답하기
          </Link>
        </p>
      );
    case "waiting":
      return (
        <p className="text-[11px] text-muted-foreground">
          해지 후 첫 결제일({formatKillCheckDate(check.billingDate, now)})이 지나면 결제가 멈췄는지
          확인합니다
        </p>
      );
    case "unknown":
      return (
        <p className="text-[11px] text-muted-foreground">
          해지 날짜나 결제 월을 몰라, 결제가 멈췄는지 확인할 날짜를 정할 수 없습니다
        </p>
      );
  }
}
