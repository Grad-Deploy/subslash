"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { findBundleOverlaps, isInTrial, sumMyAnnualKRW, sumMyMonthlyKRW } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { isAnonymousStatsOpen, isAiAskOpen } from "@lib/privacy";
import { IS_APP_BUILD } from "@lib/platform";
import { MeasuredUsageSection } from "@components/usage/MeasuredUsage";
import { buildOtherMetricRows, buildValueRows } from "@components/report/valueRows";
import {
  BundleOverlapNotice,
  ReceiptLinks,
  SpendSummary,
} from "@components/report/sections/SummarySections";
import { CostPerUseRanking, OtherMetricList } from "@components/report/sections/ValueSections";
import { PeerComparison } from "@components/report/sections/PeerComparison";
import { AskReport } from "@components/report/sections/AskReport";
import { Spinner } from "../../components/ui/spinner";
import { useT } from "@lib/i18n";

// 폰 사용 기록(안드로이드 앱 전용). 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppUsageReport = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/usage/app/AppUsageReport").then((m) => m.AppUsageReport),
      { ssr: false },
    )
  : null;

/**
 * 구독 리포트. 해지하기 전에도 볼 것이 있어야 한다 — 예전 '절약 현황'은 해지한 구독이 없으면 빈 화면
 * 이었다. 여기서는 지금 내는 돈과 1회 단가를 먼저 보여 주고, 그 아래에 다른 사람들과의 비교(익명 통계)를
 * 둔다. 해지로 지킨 돈(/savings)은 앱과 같게 리포트에 두지 않는다 — 웹은 대시보드에서 들어간다.
 * 칸마다의 모양은 components/report/sections에, 순위 계산은 components/report/valueRows에 있다.
 */
export default function ReportPage() {
  const mounted = useIsClient();
  const t = useT().reportPage;
  const rate = useExchangeRate();
  const subscriptions = useStore((state) => state.subscriptions);
  const usageLogs = useStore((state) => state.usageLogs);

  const now = useMemo(() => new Date(), []);
  // 체험 중인 구독은 카드에서 나가는 돈이 없으므로 넣지 않는다.
  const active = useMemo(
    () => subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now)),
    [subscriptions, now],
  );
  const overlaps = useMemo(() => findBundleOverlaps(subscriptions), [subscriptions]);
  const rows = useMemo(
    () => buildValueRows(active, usageLogs, rate, now),
    [active, usageLogs, rate, now],
  );
  const otherRows = useMemo(
    () => buildOtherMetricRows(active, usageLogs, now),
    [active, usageLogs, now],
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const monthly = sumMyMonthlyKRW(active, rate);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* 매달 1일 앱 알림이 여는 지난달 영수증. 구독이 없어도 해지한 기록이 있으면 볼 것이 있다. */}
      {subscriptions.length > 0 && <ReceiptLinks now={now} />}

      {active.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
          <BarChart3 className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-bold">{t.emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{t.emptyHint}</p>
          <Link
            href="/dashboard"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            {t.register}
          </Link>
        </section>
      ) : (
        <>
          <BundleOverlapNotice overlaps={overlaps} />
          <SpendSummary
            monthly={monthly}
            annual={sumMyAnnualKRW(active, rate)}
            count={active.length}
          />
          {/* AI는 질문에 맞는 계산만 고르고, 숫자는 이 기기의 기록으로 계산한다(lib/ask). */}
          {isAiAskOpen() && (
            <AskReport subscriptions={subscriptions} usageLogs={usageLogs} rate={rate} now={now} />
          )}
          {/* 폰 사용 기록 요약 카드(안드로이드 앱). 누르면 전체를 시트로 연다. */}
          {AppUsageReport && <AppUsageReport active={active} />}
          <CostPerUseRanking rows={rows} />
          <OtherMetricList rows={otherRows} />
          <MeasuredUsageSection subscriptions={active} />
        </>
      )}

      {isAnonymousStatsOpen() ? (
        <PeerComparison active={active} rows={rows} monthly={monthly} />
      ) : (
        <section className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          {t.peerSoon}
        </section>
      )}
    </div>
  );
}
