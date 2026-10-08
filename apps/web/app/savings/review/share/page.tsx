"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatKRW } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { describeSpendingTypeText } from "@lib/i18n/savings-text";
import { Button } from "@components/ui/button";
import { readSharedReview } from "@lib/share-review";
import { Spinner } from "../../../../components/ui/spinner";
import { KilledServicesCard } from "@components/savings/KilledServicesCard";

/**
 * 링크만으로 열리는 연말 결산 카드. 보는 사람의 브라우저에는 공유한 사람의 기록이
 * 없으므로, 링크에 담긴 숫자만 보여준다. 문구는 모두 여기서 숫자로 다시 만든다.
 */
function SharedReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useT();
  const s = t.savings.sharedReview;
  const shared = readSharedReview(searchParams);

  if (!shared) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-4 text-center">
        <p className="text-lg font-black">{s.invalidTitle}</p>
        <p className="text-sm text-muted-foreground">{s.invalidBody}</p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          {t.savings.sharedPage.home}
        </Link>
      </div>
    );
  }

  const scope = shared.isComplete
    ? t.savings.review.scopeFull(shared.year)
    : t.savings.review.scopeSoFar(shared.year);
  const type = shared.spendingType ? describeSpendingTypeText(t, shared.spendingType) : null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
        {s.badge(shared.year)}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-lg space-y-6">
        <div className="py-6 px-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {t.savings.review.defendedTitle(scope)}
          </div>
          <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatKRW(shared.blocked)}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
            {s.confirmed(formatKRW(shared.confirmed))}
          </p>
        </div>

        <KilledServicesCard
          label={s.killedLabel(scope)}
          count={shared.killedCount}
          names={shared.names}
        />

        {type && (
          <div className="text-left p-4 rounded-2xl border bg-card space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground">{s.typeLabel}</div>
            <div className="text-lg font-black text-foreground">{type.title}</div>
            <p className="text-xs text-muted-foreground">{type.detail}</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-3xl bg-secondary/80 border space-y-4 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-black">{s.ctaTitle}</h3>
          <p className="text-xs text-muted-foreground">{t.savings.sharedPage.ctaBody}</p>
        </div>
        <Button
          size="lg"
          className="w-full h-13 text-base font-bold shadow-md rounded-xl"
          onClick={() => router.push("/")}
        >
          {s.ctaButton}
        </Button>
        <p className="text-[11px] text-muted-foreground">{t.savings.sharedPage.noSignup}</p>
      </div>
    </div>
  );
}

export default function SharedReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-8" />
        </div>
      }
    >
      <SharedReviewContent />
    </Suspense>
  );
}
