"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { formatKRW, getDetoxLevel, getSavingsEquivalents } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { rewardHeadline } from "@lib/i18n/savings-text";
import { readSharedSavings } from "../../../lib/share-savings";
import { Spinner } from "../../../components/ui/spinner";
import { PiggyBank } from "lucide-react";
import { KilledServicesCard } from "@components/savings/KilledServicesCard";

function SharedSavingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useT();
  const s = t.savings.sharedPage;

  const shared = readSharedSavings(searchParams);
  const annual = shared.annual ?? 0;
  // 환산은 1년치 요금에서 한다. 보상 제목도 "1년 동안 아끼면"이다.
  const headlineEquivalent = rewardHeadline(t, annual);
  const equivalents = getSavingsEquivalents(annual);

  // 머리 숫자는 지킨 돈이다. 아직 지킨 돈이 없거나 예전 링크면 1년치 예상액을
  // '예상'이라고 적어 보여준다.
  const showConfirmed = shared.format === "confirmed" && shared.confirmed > 0;
  // 레벨은 지킨 돈으로 매긴다. 예전 링크에는 지킨 돈이 없으므로 레벨을 짐작하지 않는다.
  const detoxLevel =
    shared.format === "confirmed" ? getDetoxLevel(shared.confirmed, shared.count) : null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8 text-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
        {s.badge}
      </div>

      {/* Main Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-lg space-y-6 relative overflow-hidden">
        <PiggyBank className="mx-auto size-12 text-muted-foreground" aria-hidden />

        {/* Detox level & title */}
        {detoxLevel && (
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
              <span>
                {detoxLevel.levelLabel}{" "}
                {t.value.detoxTitle[detoxLevel.level as 0 | 1 | 2 | 3 | 4 | 5]}
              </span>
            </span>
            {detoxLevel.nextThreshold !== null && (
              <span className="text-[11px] text-muted-foreground">
                {s.nextLevel(
                  t.value.detoxTitle[(detoxLevel.level + 1) as 0 | 1 | 2 | 3 | 4 | 5],
                  formatKRW(detoxLevel.remainingToNext ?? 0),
                )}
              </span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{s.heroTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{s.heroSub}</p>
        </div>

        {/* Savings Amount Box */}
        <div className="py-6 px-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-1">
          {showConfirmed && shared.format === "confirmed" ? (
            <>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                {s.kept}
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatKRW(shared.confirmed)}
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                {s.keptNote(shared.verifiedCount)}
              </p>
              {shared.annual !== null && (
                <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 pt-2">
                  {s.keepAnnual(formatKRW(shared.annual), headlineEquivalent)}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                {s.expected}
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatKRW(annual)}
              </div>
              {headlineEquivalent && (
                <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 pt-1">
                  {headlineEquivalent}
                </p>
              )}
            </>
          )}
        </div>

        {shared.format === "legacy" && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{s.legacy}</p>
        )}

        {/* Defended count & services */}
        <KilledServicesCard label={s.killedLabel} count={shared.count} names={shared.names} />

        {/* Equivalents Cards */}
        {equivalents.length > 0 && (
          <div className="space-y-2.5 text-left pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {s.rewardsTitle}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {equivalents.slice(0, 4).map((item) => (
                <div key={item.key} className="p-3 border rounded-xl bg-card space-y-0.5">
                  <div className="text-[11px] text-muted-foreground">
                    {t.savings.rewardNames[item.key]}
                  </div>
                  <div className="text-sm font-bold text-foreground">
                    {t.value.reward[item.key](item.count)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action for Visitors */}
      <div className="p-6 rounded-3xl bg-secondary/80 border space-y-4 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-black">{s.ctaTitle}</h3>
          <p className="text-xs text-muted-foreground">{s.ctaBody}</p>
        </div>

        <Button
          size="lg"
          className="w-full h-13 text-base font-bold shadow-md rounded-xl"
          onClick={() => router.push("/")}
        >
          {s.ctaButton}
        </Button>

        <p className="text-[11px] text-muted-foreground">{s.noSignup}</p>
      </div>

      <div>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          {s.home}
        </Link>
      </div>
    </div>
  );
}

export default function SharedSavingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-8" />
        </div>
      }
    >
      <SharedSavingsContent />
    </Suspense>
  );
}
