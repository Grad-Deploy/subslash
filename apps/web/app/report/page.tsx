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
  type UsageLog,
} from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { isAnonymousStatsOpen } from "@lib/privacy";
import { fetchStatsSummary, useStatsSharing, withdrawContribution } from "@lib/stats-client";
import { STATS_MIN_PARTICIPANTS, type StatsSummary } from "@lib/stats";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { subscriptionDetailHref } from "@lib/routes";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";

/** 체크인이 이보다 오래됐으면 1회 단가를 모른다고 본다(일). 통계에 보내는 기준과 같다. */
const USAGE_FRESH_DAYS = 45;

interface ValueRow {
  sub: Subscription;
  monthlyKRW: number;
  usageCount: number | null;
  costPerUse: number | null;
}

function latestUsage(logs: UsageLog[], subId: string, now: Date): number | null {
  const freshAfter = now.getTime() - USAGE_FRESH_DAYS * 24 * 60 * 60 * 1000;
  const latest = logs
    .filter((log) => log.subscriptionId === subId && Date.parse(log.checkedAt) >= freshAfter)
    .sort((a, b) => Date.parse(b.checkedAt) - Date.parse(a.checkedAt))[0];
  return latest ? latest.usageCount : null;
}

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

  const rows: ValueRow[] = useMemo(
    () =>
      active
        .map((sub) => {
          const monthlyKRW = getMyMonthlyAmountKRW(sub, rate);
          const usageCount = latestUsage(usageLogs, sub.id, now);
          return {
            sub,
            monthlyKRW,
            usageCount,
            costPerUse: usageCount === null ? null : calculateCostPerUse(monthlyKRW, usageCount),
          };
        })
        // 1회 단가가 비싼 것부터. 모르는 것은 뒤로 — 모름을 싸다고 읽지 않는다.
        .sort((a, b) => (b.costPerUse ?? -1) - (a.costPerUse ?? -1)),
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
          <section aria-label="지출 요약" className="grid grid-cols-3 gap-2">
            <SummaryTile label="한 달" value={formatKRW(monthly)} />
            <SummaryTile label="1년이면" value={formatKRW(annual)} />
            <SummaryTile label="구독" value={`${active.length}개`} />
          </section>

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
        </>
      )}

      {isAnonymousStatsOpen() ? (
        <PeerComparison active={active} rows={rows} monthly={monthly} />
      ) : (
        <section className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          다른 사용자와의 비교는 준비 중이에요.
        </section>
      )}

      {killed.length > 0 && (
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
      <p className="truncate text-lg font-black tabular-nums">{value}</p>
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
    try {
      if (token) await withdrawContribution(token);
      useStatsSharing.getState().setEnabled(false);
      useStatsSharing.getState().setToken(null);
    } catch {
      setError("참여를 그만두지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  // 내 구독 중 비교할 수 있는 서비스.
  const myServices = rows
    .map((row) => ({ row, preset: findPresetForSubscription(row.sub) }))
    .filter((entry): entry is { row: ValueRow; preset: NonNullable<typeof entry.preset> } =>
      Boolean(entry.preset),
    )
    .map(({ row, preset }) => ({
      row,
      stats: summary?.services.find((service) => service.presetId === preset.id) ?? null,
    }))
    .filter((entry) => entry.stats);

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
                  <span className="truncate">{presetName(stats!.presetId)}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {stats!.medianUsage === null
                      ? `보통 ${formatKRW(stats!.medianMonthlyKRW)}`
                      : `보통 ${stats!.medianUsage}번`}
                    {" · "}
                    <b className="text-foreground">
                      {stats!.medianUsage === null
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
