"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatKRW, getSavingsTiers } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useStore } from "@lib/store";
import { useExchangeRate } from "@hooks/useExchangeRate";

/**
 * 절약 현황(`/savings`)으로 가는 한 줄(앱). 앱은 하단 탭에 절약이 없고 리포트 맨 아래 링크로만 들어가서,
 * 해지해 지킨 돈을 못 보고 지나치기 쉬웠다. 그래서 자주 보는 자리 세 곳에 같은 숫자를 둔다.
 * - `card`: 대시보드 가성비 계산서 카드 안(구독 중인 게 없으면 `standalone`으로 혼자 카드가 된다)
 * - `receipt`: 계산서 시트 맨 아래
 * - `banner`: 구독 관리 › 해지 완료 탭 맨 위
 *
 * 숫자는 절약 현황의 '지금까지 지킨 돈'과 같다(결제가 멈춘 것을 확인한 돈). 계산서의 '아낄 수 있는 돈'(앞으로
 * 끊으면 아낄 돈)과 섞이지 않게 '지킨 돈'이라고만 부르고 초록으로 적는다. 해지한 구독이 없으면 두지 않는다.
 */
export function AppSavingsLink({
  variant,
  standalone = false,
}: {
  variant: "card" | "receipt" | "banner";
  standalone?: boolean;
}) {
  const subscriptions = useStore((state) => state.subscriptions);
  const rate = useExchangeRate();

  // 숨긴 해지도 절약 현황에는 남으므로 함께 센다.
  const killed = subscriptions.filter((sub) => sub.status === "killed");
  if (killed.length === 0) return null;

  const now = new Date();
  const tiers = getSavingsTiers(killed, now, rate);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = getSavingsTiers(killed, now, rate, { from: monthStart, to: now }).confirmed;

  // 지킨 돈이 아직 없을 때: 결제일이 지나 확인을 기다리는 돈이 있으면 그걸, 아니면 언제 쌓이는지 적는다.
  const detail =
    tiers.confirmed === 0 && tiers.pending > 0
      ? `확인 대기 ${formatKRW(tiers.pending)}`
      : tiers.confirmed === 0
        ? "결제일이 지나면 쌓여요"
        : thisMonth > 0
          ? `이번 달 +${formatKRW(thisMonth)}`
          : null;
  const amount = (
    <b className="text-emerald-600 tabular-nums dark:text-emerald-400">
      {formatKRW(tiers.confirmed)}
    </b>
  );
  const go = (
    <span className="flex shrink-0 items-center text-xs font-bold text-muted-foreground">
      절약 현황
      <ChevronRight className="size-3.5" aria-hidden />
    </span>
  );

  if (variant === "banner") {
    return (
      <Link
        href="/savings"
        className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5"
      >
        <span className="min-w-0 text-[13px] font-bold break-keep">
          {tiers.confirmed > 0 ? (
            <>해지해서 {amount} 지켰어요</>
          ) : (
            <>
              해지 {killed.length}개 · <span className="text-muted-foreground">{detail}</span>
            </>
          )}
        </span>
        {go}
      </Link>
    );
  }

  if (variant === "receipt") {
    return (
      <>
        <hr className="my-3 border-t-[1.5px] border-dashed" />
        <Link
          href="/savings"
          className="-mx-1 flex items-center justify-between gap-3 rounded-xl bg-secondary px-3 py-2.5"
        >
          <span className="min-w-0">
            <span className="block text-[12.5px] font-extrabold">해지로 지킨 돈</span>
            <span className="block text-[11px] text-muted-foreground">
              해지 {killed.length}개{detail && ` · ${detail}`}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end">
            <span className="text-[17px] font-black">{amount}</span>
            {go}
          </span>
        </Link>
      </>
    );
  }

  return (
    <Link
      href="/savings"
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-2.5 py-2",
        standalone ? "rounded-2xl border bg-card p-4" : "mt-2 border border-dashed",
      )}
    >
      <span className="min-w-0 text-xs font-bold">
        해지로 지킨 돈 <span className="ml-1 text-sm font-black">{amount}</span>
        {tiers.confirmed === 0 && detail && (
          <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
      {go}
    </Link>
  );
}
