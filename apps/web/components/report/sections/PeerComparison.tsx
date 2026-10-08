"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { findPresetForSubscription, formatKRW, type Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { isStatsAgeBandOpen } from "@lib/privacy";
import { fetchStatsSummary, useStatsSharing, withdrawContribution } from "@lib/stats-client";
import { STATS_SAMPLE_ENABLED, sampleStatsSummary } from "@lib/stats-sample";
import { STATS_MIN_PARTICIPANTS, type ServiceStats, type StatsSummary } from "@lib/stats";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { useLatestT, useServiceNames, useT } from "@lib/i18n";
import { AgeComparison } from "../AgeComparison";
import type { ValueRow } from "../valueRows";

/**
 * 다른 사용자와의 비교. 요약은 참여하지 않아도 볼 수 있다 — 먼저 보여 줘야 참여할 이유가 생긴다.
 * 모인 사람이 모자라면 숫자 대신 몇 명이 모였는지만 말한다(lib/stats).
 */
export function PeerComparison({
  active,
  rows,
  monthly,
}: {
  active: Subscription[];
  rows: ValueRow[];
  monthly: number;
}) {
  const p = useT().reportPage.peer;
  const names = useServiceNames();
  const presetName = names.id;
  const tRef = useLatestT();
  const enabled = useStatsSharing((state) => state.enabled);
  const token = useStatsSharing((state) => state.token);
  const ageBand = useStatsSharing((state) => state.ageBand);
  // 로그인한 동안에만 보탠다(useStatsContribution). 로그인 여부는 기록의 주인으로 본다.
  const signedIn = useStore((state) => state.recordsOwner !== null);
  // 테스트 빌드: 서버 통계 대신 가상 참여자로 만든 요약을 보여 준다(lib/stats-sample).
  const [summary, setSummary] = useState<StatsSummary | null>(() =>
    STATS_SAMPLE_ENABLED ? sampleStatsSummary() : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 연령대로 나눠 비교한다. 테스트 빌드의 가상 데이터는 늘, 실제 통계는 방침에 연령대를 게시한 뒤부터.
  const byAge = STATS_SAMPLE_ENABLED || isStatsAgeBandOpen() ? summary?.byAge : undefined;

  useEffect(() => {
    if (STATS_SAMPLE_ENABLED) return;
    fetchStatsSummary()
      .then(setSummary)
      .catch(() => setError(tRef.current.reportPage.peer.loadFailed));
  }, [tRef]);

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
      setError(tRef.current.reportPage.peer.leaveFailed);
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
          <h2 className="text-base font-bold">{p.title}</h2>
          <p className="text-xs text-muted-foreground">
            {STATS_SAMPLE_ENABLED ? p.sample : p.real}{" "}
            <Link href="/privacy#anonymous-stats" className="underline underline-offset-2">
              {p.whatDoWeCollect}
            </Link>
          </p>
        </div>
        {summary && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
            {STATS_SAMPLE_ENABLED
              ? p.sampleCount(summary.participants)
              : p.realCount(summary.participants)}
          </span>
        )}
      </div>

      {STATS_SAMPLE_ENABLED && (
        <p className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
          {p.sampleNote(summary?.participants ?? 0)}
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {!summary ? (
        !error && <Spinner className="size-5" />
      ) : (
        <>
          {byAge ? (
            <AgeComparison
              byAge={byAge}
              myBand={ageBand}
              onPickBand={(band) => useStatsSharing.getState().setAgeBand(band)}
              monthly={monthly}
              hasSubscriptions={active.length > 0}
            />
          ) : summary.overall ? (
            active.length > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-sm">
                  {p.typicalBefore}
                  <b className="tabular-nums">{formatKRW(summary.overall.medianMonthlyKRW)}</b>
                  {p.typicalMid}
                  <b className="tabular-nums">{formatKRW(monthly)}</b>
                </p>
                <ComparisonBar mine={monthly} typical={summary.overall.medianMonthlyKRW} />
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              {p.gathering(STATS_MIN_PARTICIPANTS, summary.participants)}
            </p>
          )}

          {myServices.length > 0 && (
            <ul className="space-y-2">
              {myServices.map(({ row, stats }) => (
                <li key={row.sub.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{presetName(stats.presetId)}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {stats.medianUsage === null
                      ? p.typicalAmount(formatKRW(stats.medianMonthlyKRW))
                      : p.typicalUses(stats.medianUsage)}
                    {" · "}
                    <b className="text-foreground">
                      {stats.medianUsage === null
                        ? p.meAmount(formatKRW(row.monthlyKRW))
                        : row.usageCount === null
                          ? p.meBeforeCheckIn
                          : p.meUses(row.usageCount)}
                    </b>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {enabled && signedIn ? (
        <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
          <span>{p.contributing}</span>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void leave()}>
            {p.leave}
          </Button>
        </div>
      ) : enabled && !signedIn ? (
        // 로그아웃하면 서버의 기록은 useStatsContribution이 이미 지웠다 — 이 기기는 비교에 들어 있지 않다.
        // 남은 것은 '다시 로그인하면 이어 보탠다'는 이 기기의 선택뿐이라, 참여·그만두기 버튼을 두지 않는다.
        // 그만두기는 로그인한 뒤에 한다.
        <p className="border-t pt-3 text-xs text-muted-foreground">
          {p.signedOutBefore}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            {p.login}
          </Link>
          {p.signedOutAfter}
        </p>
      ) : signedIn ? (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">{p.joinNote}</p>
          <Button size="sm" onClick={join}>
            {p.join}
          </Button>
        </div>
      ) : (
        <p className="border-t pt-3 text-xs text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            {p.login}
          </Link>
          {p.loginInviteAfter}
        </p>
      )}
    </section>
  );
}

/** 나와 보통 사람을 한 막대 위에 놓는다. 둘 중 큰 쪽을 끝으로 잡는다. */
function ComparisonBar({ mine, typical }: { mine: number; typical: number }) {
  const p = useT().reportPage.peer;
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
          ? p.barMore(formatKRW(diff), formatKRW(diff * 12))
          : diff < 0
            ? p.barLess(formatKRW(-diff))
            : p.barSame}
      </p>
    </div>
  );
}
