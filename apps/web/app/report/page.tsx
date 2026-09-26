"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";
import {
  POPULAR_SERVICES,
  calculateCostPerUse,
  findPresetForSubscription,
  formatKRW,
  getMyMonthlyAmountKRW,
  getSavingsTiers,
  isInTrial,
  sumMyAnnualKRW,
  sumMyMonthlyKRW,
  type Subscription,
  describeCheckIn,
  metricForSubscription,
  type UsageLog,
  findBundleOverlaps,
  serviceNameOf,
} from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { isAnonymousStatsOpen } from "@lib/privacy";
import { fetchStatsSummary, useStatsSharing, withdrawContribution } from "@lib/stats-client";
import {
  STATS_MIN_PARTICIPANTS,
  latestFreshUsage,
  type ServiceStats,
  type StatsSummary,
  latestFreshLog,
} from "@lib/stats";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { MeasuredUsageSection } from "@components/usage/MeasuredUsage";
import { subscriptionDetailHref } from "@lib/routes";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { IS_APP_BUILD } from "@lib/platform";
import dynamic from "next/dynamic";

// 폰 사용 기록(안드로이드 앱 전용). 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppUsageReport = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/usage/app/AppUsageReport").then((m) => m.AppUsageReport),
      { ssr: false },
    )
  : null;

// 요약 칸의 금액을 칸에 맞춰 줄인다(앱 전용). 웹은 지금처럼 자른다.
const AppFitText = IS_APP_BUILD
  ? dynamic(() => import("../../components/report/app/AppFitText").then((m) => m.AppFitText), {
      ssr: false,
    })
  : null;

interface ValueRow {
  sub: Subscription;
  monthlyKRW: number;
  usageCount: number | null;
  costPerUse: number | null;
}

/**
 * 순위의 기준. 한 번도 쓰지 않은 구독이 가장 아깝다 — calculateCostPerUse는 0회에 한 달 요금을
 * 돌려줘서, 그대로 두면 1번 쓴 더 비싼 구독보다 뒤로 밀렸다. 모르는 것(체크인 전)은 맨 뒤다.
 */
function rankKey(row: ValueRow): number {
  if (row.usageCount === 0) return Number.POSITIVE_INFINITY;
  return row.costPerUse ?? -1;
}

/** 빨강이 먼저, 체크인 전은 맨 뒤. */
function levelRank(log: UsageLog | null): number {
  if (!log) return -1;
  return log.riskLevel === "red" ? 2 : log.riskLevel === "yellow" ? 1 : 0;
}

/** 색만으로 말하지 않게 글자를 붙인다(계산서와 같은 말). */
const LEVEL_TEXT = {
  red: { label: "쉬어가도 될 구독", className: "text-destructive" },
  yellow: { label: "애매해요", className: "text-amber-700 dark:text-amber-400" },
  green: { label: "뽕 뽑는 중", className: "text-emerald-700 dark:text-emerald-400" },
} as const;

function presetName(presetId: string): string {
  const preset = POPULAR_SERVICES.find((service) => service.id === presetId);
  return preset?.nameKo ?? preset?.name ?? presetId;
}

/**
 * 구독 리포트. 해지하기 전에도 볼 것이 있어야 한다 — 예전 '절약 현황'은 해지한 구독이 없으면 빈 화면
 * 이었다. 여기서는 지금 내는 돈과 1회 단가를 먼저 보여 주고, 다른 사람들과의 비교(익명 통계), 해지로
 * 지킨 돈을 그 아래에 둔다.
 */
export default function ReportPage() {
  const mounted = useIsClient();
  const rate = useExchangeRate();
  const subscriptions = useStore((state) => state.subscriptions);
  const usageLogs = useStore((state) => state.usageLogs);

  const now = useMemo(() => new Date(), []);
  const active = useMemo(
    () => subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now)),
    [subscriptions, now],
  );
  const killed = useMemo(
    () => subscriptions.filter((sub) => sub.status === "killed"),
    [subscriptions],
  );

  // 횟수가 아닌 것(시간·쓴 날·혜택·용량)으로 재는 구독은 1회 단가 순위에 넣지 않는다. 시간당 ₩500과
  // 1회 ₩500은 같은 줄에 세울 수 없다. 대신 색(돈값 기준 — utils/valueMetric)으로 따로 줄 세운다.
  const overlaps = useMemo(() => findBundleOverlaps(subscriptions), [subscriptions]);

  const otherRows = useMemo(
    () =>
      active
        .filter((sub) => metricForSubscription(sub) !== "uses")
        .map((sub) => ({ sub, log: latestFreshLog(usageLogs, sub.id, now) }))
        .sort((a, b) => levelRank(b.log) - levelRank(a.log)),
    [active, usageLogs, now],
  );

  const rows: ValueRow[] = useMemo(
    () =>
      active
        .filter((sub) => metricForSubscription(sub) === "uses")
        .map((sub) => {
          const monthlyKRW = getMyMonthlyAmountKRW(sub, rate);
          const usageCount = latestFreshUsage(usageLogs, sub.id, now);
          return {
            sub,
            monthlyKRW,
            usageCount,
            costPerUse: usageCount === null ? null : calculateCostPerUse(monthlyKRW, usageCount),
          };
        })
        // 1회 단가가 비싼 것부터. 모르는 것은 뒤로 — 모름을 싸다고 읽지 않는다.
        .sort((a, b) => rankKey(b) - rankKey(a)),
    [active, usageLogs, rate, now],
  );

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const monthly = sumMyMonthlyKRW(active, rate);
  const annual = sumMyAnnualKRW(active, rate);
  const confirmedSaved = killed.length > 0 ? getSavingsTiers(killed, now, rate).confirmed : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">구독 리포트</h1>
        <p className="text-sm text-muted-foreground">지금 내는 돈과, 제값을 하는지 한눈에.</p>
      </header>

      {active.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
          <BarChart3 className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-bold">아직 등록한 구독이 없어요</p>
          <p className="text-sm text-muted-foreground">구독을 등록하면 여기서 정리해 드려요.</p>
          <Link
            href="/dashboard"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
          >
            구독 등록하러 가기
          </Link>
        </section>
      ) : (
        <>
          {/* 결합 상품에 든 서비스를 따로도 내고 있으면 먼저 알린다 — 증거가 있는 절약 기회다. */}
          {overlaps.length > 0 && (
            <section
              aria-label="결합 상품과 겹치는 구독"
              className="space-y-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
            >
              <p className="font-bold">두 번 내고 있을 수 있어요</p>
              {overlaps.map(({ bundle, other, serviceIds }) => (
                <p key={`${bundle.id}-${other.id}`} className="text-xs leading-relaxed">
                  <b>{bundle.name}</b>에 {serviceIds.map(serviceNameOf).join(", ")}이(가) 들어
                  있는데 <b>{other.name}</b>도 따로 구독 중이에요. 다른 계정으로 쓰는 게 아니라면 한
                  쪽을 해지해도 돼요.
                </p>
              ))}
            </section>
          )}

          {/* 앱은 '구독 N개' 칸을 내용만큼만 두고 금액 두 칸을 넓힌다. */}
          <section
            aria-label="지출 요약"
            className={
              IS_APP_BUILD
                ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
                : "grid grid-cols-3 gap-2"
            }
          >
            <SummaryTile label="한 달" value={formatKRW(monthly)} />
            <SummaryTile label="1년이면" value={formatKRW(annual)} />
            <SummaryTile label="구독" value={`${active.length}개`} />
          </section>

          {/* 폰 사용 기록 요약 카드(안드로이드 앱). 누르면 전체를 시트로 연다. */}
          {AppUsageReport && <AppUsageReport active={active} />}

          <section className="space-y-3">
            <h2 className="text-base font-bold">1회 단가 순위</h2>
            <ul className="divide-y rounded-2xl border">
              {rows.map((row) => (
                <li key={row.sub.id}>
                  <Link
                    href={subscriptionDetailHref(row.sub.id)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                  >
                    <ServiceLogo
                      name={row.sub.name}
                      cancelUrl={row.sub.cancelUrl}
                      fallbackEmoji={row.sub.iconUrl}
                      fallbackColor={row.sub.iconColor}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{row.sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        한 달 {formatKRW(row.monthlyKRW)}
                        {row.usageCount !== null && ` · ${row.usageCount}번 사용`}
                      </p>
                    </div>
                    <div className="text-right">
                      {row.costPerUse === null ? (
                        <span className="text-xs text-muted-foreground">체크인 전</span>
                      ) : row.usageCount === 0 ? (
                        // 0번 쓴 구독에 '1회 ₩17,000'을 적으면 한 번은 쓴 것처럼 읽힌다.
                        <span className="text-xs font-bold text-destructive">안 썼어요</span>
                      ) : (
                        <>
                          <p className="font-bold tabular-nums">{formatKRW(row.costPerUse)}</p>
                          <p className="text-[11px] text-muted-foreground">1회</p>
                        </>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
            {rows.some((row) => row.costPerUse === null) && (
              <p className="text-xs text-muted-foreground">
                &lsquo;체크인 전&rsquo;인 구독은 대시보드에서 이번 달 사용 횟수를 알려 주면 1회
                단가가 나와요.
              </p>
            )}
          </section>

          {otherRows.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold">횟수 말고 다른 기준으로 재는 구독</h2>
              <p className="text-xs text-muted-foreground">
                음악은 들은 시간, AI·업무 도구는 쓴 날, 멤버십은 받은 혜택, 저장 공간은 쓰는
                용량으로 봐요.
              </p>
              <ul className="divide-y rounded-2xl border">
                {otherRows.map(({ sub, log }) => (
                  <li key={sub.id}>
                    <Link
                      href={subscriptionDetailHref(sub.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <ServiceLogo
                        name={sub.name}
                        cancelUrl={sub.cancelUrl}
                        fallbackEmoji={sub.iconUrl}
                        fallbackColor={sub.iconColor}
                        size={32}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {log ? describeCheckIn(log, sub.currency) : "체크인 전"}
                        </p>
                      </div>
                      {log && (
                        <span
                          className={`text-xs font-bold ${LEVEL_TEXT[log.riskLevel].className}`}
                        >
                          {LEVEL_TEXT[log.riskLevel].label}
                        </span>
                      )}
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <MeasuredUsageSection subscriptions={active} />
        </>
      )}

      {isAnonymousStatsOpen() ? (
        <PeerComparison active={active} rows={rows} monthly={monthly} />
      ) : (
        <section className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          다른 사용자와의 비교는 준비 중이에요.
        </section>
      )}

      {/* 앱은 지킨 돈을 대시보드 계산서 카드와 해지 완료 탭에서 보여서 여기서는 뺀다. */}
      {!IS_APP_BUILD && killed.length > 0 && (
        <Link
          href="/savings"
          className="flex items-center justify-between gap-3 rounded-2xl border p-4 hover:bg-muted/50"
        >
          <div>
            <p className="text-xs text-muted-foreground">해지로 지킨 돈</p>
            <p className="text-lg font-black tabular-nums">{formatKRW(confirmedSaved)}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold">
            절약 기록 보기 <ChevronRight className="size-4" aria-hidden />
          </span>
        </Link>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {AppFitText ? (
        <AppFitText text={value} className="font-black leading-7 tabular-nums" />
      ) : (
        <p className="truncate text-lg font-black tabular-nums">{value}</p>
      )}
    </div>
  );
}

/**
 * 다른 사용자와의 비교. 요약은 참여하지 않아도 볼 수 있다 — 먼저 보여 줘야 참여할 이유가 생긴다.
 * 모인 사람이 모자라면 숫자 대신 몇 명이 모였는지만 말한다(lib/stats).
 */
function PeerComparison({
  active,
  rows,
  monthly,
}: {
  active: Subscription[];
  rows: ValueRow[];
  monthly: number;
}) {
  const enabled = useStatsSharing((state) => state.enabled);
  const token = useStatsSharing((state) => state.token);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStatsSummary()
      .then(setSummary)
      .catch(() => setError("비교 통계를 불러오지 못했어요."));
  }, []);

  const join = () => useStatsSharing.getState().setEnabled(true);
  const leave = async () => {
    setBusy(true);
    setError(null);
    // 먼저 끈다. 지우는 사이 요약을 보내면(useStatsContribution) 지운 기록이 새 참여자로 되살아난다.
    useStatsSharing.getState().setEnabled(false);
    try {
      if (token) await withdrawContribution(token);
      useStatsSharing.getState().setToken(null);
    } catch {
      // 서버에 기록이 남았다. 참여 중으로 되돌려 다시 누를 수 있게 한다.
      useStatsSharing.getState().setEnabled(true);
      setError("참여를 그만두지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  // 내 구독 중 비교할 수 있는 서비스.
  const myServices: { row: ValueRow; stats: ServiceStats }[] = [];
  for (const row of rows) {
    const presetId = findPresetForSubscription(row.sub)?.id;
    const stats = summary?.services.find((service) => service.presetId === presetId);
    if (stats) myServices.push({ row, stats });
  }

  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">다른 사용자와 비교</h2>
          <p className="text-xs text-muted-foreground">
            참여한 사용자의 익명 통계예요.{" "}
            <Link href="/privacy#anonymous-stats" className="underline underline-offset-2">
              무엇을 모으나요?
            </Link>
          </p>
        </div>
        {summary && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
            {summary.participants}명 참여
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {!summary ? (
        !error && <Spinner className="size-5" />
      ) : (
        <>
          {summary.overall ? (
            active.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm">
                  참여자의 한 달 구독 지출은 보통{" "}
                  <b className="tabular-nums">{formatKRW(summary.overall.medianMonthlyKRW)}</b>
                  {" · "}나는 <b className="tabular-nums">{formatKRW(monthly)}</b>
                </p>
                <ComparisonBar mine={monthly} typical={summary.overall.medianMonthlyKRW} />
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              {STATS_MIN_PARTICIPANTS}명이 모이면 비교를 보여 드려요. 지금 {summary.participants}
              명이 참여했어요.
            </p>
          )}

          {myServices.length > 0 && (
            <ul className="space-y-2">
              {myServices.map(({ row, stats }) => (
                <li key={row.sub.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{presetName(stats.presetId)}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {stats.medianUsage === null
                      ? `보통 ${formatKRW(stats.medianMonthlyKRW)}`
                      : `보통 ${stats.medianUsage}번`}
                    {" · "}
                    <b className="text-foreground">
                      {stats.medianUsage === null
                        ? `나 ${formatKRW(row.monthlyKRW)}`
                        : row.usageCount === null
                          ? "나 체크인 전"
                          : `나 ${row.usageCount}번`}
                    </b>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {enabled ? (
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
          <span>내 구독 요약을 익명으로 보태는 중이에요.</span>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void leave()}>
            그만두기
          </Button>
        </div>
      ) : (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            서비스·금액·사용 횟수만 이름 없이 보태요. 언제든 그만두면 바로 지워져요.
          </p>
          <Button size="sm" onClick={join}>
            익명으로 참여하기
          </Button>
        </div>
      )}
    </section>
  );
}

/** 나와 보통 사람을 한 막대 위에 놓는다. 둘 중 큰 쪽을 끝으로 잡는다. */
function ComparisonBar({ mine, typical }: { mine: number; typical: number }) {
  const max = Math.max(mine, typical, 1);
  const diff = mine - typical;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="relative h-2 rounded-full bg-background">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${(mine / max) * 100}%` }}
        />
        <div
          className="absolute inset-y-[-3px] w-0.5 bg-foreground"
          style={{ left: `${(typical / max) * 100}%` }}
          aria-hidden
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {diff > 0
          ? `보통보다 한 달 ${formatKRW(diff)} 더 내요. 1년이면 ${formatKRW(diff * 12)}.`
          : diff < 0
            ? `보통보다 한 달 ${formatKRW(-diff)} 덜 내요.`
            : "보통과 같아요."}
      </p>
    </div>
  );
}
