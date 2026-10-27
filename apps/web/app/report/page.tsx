"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BarChart3 } from "lucide-react";
import { findBundleOverlaps, isPaying, sumMyAnnualKRW, sumMyMonthlyKRW } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { isAiAskOpen } from "@lib/privacy";
import { IS_APP_BUILD } from "@lib/platform";
import { defaultReceiptMonth } from "@lib/receipt-view";
import {
  buildCheckInBars,
  buildOtherMetricRows,
  buildValueRows,
} from "@components/report/valueRows";
import {
  BundleOverlapNotice,
  ReceiptLinks,
  SpendSummary,
} from "@components/report/sections/SummarySections";
import { CostPerUseRanking, OtherMetricList } from "@components/report/sections/ValueSections";
import { AskReport } from "@components/report/sections/AskReport";
import { CheckInUsageChart } from "@components/report/sections/CheckInUsageChart";
import { PageSpinner } from "../../components/ui/spinner";
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
 * 이었다. 여기서는 지금 내는 돈과 1회 단가, 그리고 구독별 막대그래프 — 앱은 사용 시간(폰 기록), 웹은 체크인한
 * 사용량 — 를 보여 준다. 다른
 * 사용자와의 비교(익명 통계)와 여러 기기 사용 측정 칸은 걷었다 — 통계는 그만뒀고(ANONYMOUS_STATS_ENDED_ON), 기기
 * 측정은 구독 상세의 한 줄과 설정에 남아 있다. 해지로 지킨 돈(/savings)은 앱과 같게 리포트에 두지 않는다 — 웹은 대시보드에서 들어간다.
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
    () => subscriptions.filter((sub) => isPaying(sub, now)),
    [subscriptions, now],
  );
  const overlaps = useMemo(() => findBundleOverlaps(subscriptions), [subscriptions]);
  const receiptMonth = useMemo(
    () => defaultReceiptMonth(subscriptions, usageLogs, rate, now),
    [subscriptions, usageLogs, rate, now],
  );
  const rows = useMemo(
    () => buildValueRows(active, usageLogs, rate, now),
    [active, usageLogs, rate, now],
  );
  // 웹에는 폰 사용 기록이 없어 체크인으로 그린다. 앱은 폰 기록으로 그린다(AppUsageReport).
  const checkInBars = useMemo(
    () => (AppUsageReport ? null : buildCheckInBars(active, usageLogs, now)),
    [active, usageLogs, now],
  );
  const otherRows = useMemo(
    () => buildOtherMetricRows(active, usageLogs, now),
    [active, usageLogs, now],
  );

  if (!mounted) {
    return <PageSpinner />;
  }

  const monthly = sumMyMonthlyKRW(active, rate);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </header>

      {/* 매달 1일 앱 알림이 여는 지난달 영수증. 구독이 없어도 해지한 기록이 있으면 볼 것이 있다. */}
      {subscriptions.length > 0 && <ReceiptLinks now={now} month={receiptMonth} />}

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
          {/* 숫자는 이 기기의 기록으로 계산한다(lib/ask). AI가 닫혀 있으면 추천 질문과 기기 규칙으로만 답하고
              아무것도 서버로 보내지 않는다. */}
          <AskReport
            subscriptions={subscriptions}
            usageLogs={usageLogs}
            rate={rate}
            now={now}
            aiOpen={isAiAskOpen()}
          />
          {/* 구독별 사용 시간 막대그래프(안드로이드 앱의 폰 기록). '자세히 보기'는 전체를 시트로 연다. */}
          {AppUsageReport && <AppUsageReport active={active} />}
          {checkInBars && <CheckInUsageChart {...checkInBars} />}
          <CostPerUseRanking rows={rows} />
          <OtherMetricList rows={otherRows} />
        </>
      )}
    </div>
  );
}
