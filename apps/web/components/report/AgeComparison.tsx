"use client";

import React from "react";
import { formatKRW } from "@subslash/shared";
import { AGE_BANDS, STATS_MIN_PER_AGE_BAND, type AgeBand, type AgeBandStats } from "@lib/stats";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";

/**
 * 연령대별 한 달 구독 지출(가운데 값)을 가로 막대로 보여 주고, 내 연령대를 강조한 뒤 내 지출을 한 줄 더
 * 놓는다. 참여자가 모자란 연령대는 막대 대신 몇 명이 모였는지만 적는다 — 몇 명뿐인 가운데 값을
 * '보통'이라고 부르지 않는다(lib/stats).
 *
 * 계열이 하나(연령대별 가운데 값)라 범례를 두지 않고 값을 막대 옆에 적는다. 색은 내 연령대만 강조색,
 * 나머지는 흐린 색이고, 글자는 막대 색이 아니라 본문 색을 쓴다.
 */
export function AgeComparison({
  byAge,
  myBand,
  onPickBand,
  monthly,
  hasSubscriptions,
}: {
  byAge: AgeBandStats[];
  myBand: AgeBand | null;
  onPickBand: (band: AgeBand) => void;
  monthly: number;
  hasSubscriptions: boolean;
}) {
  const a = useT().reportPage.age;
  const mine = myBand ? byAge.find((row) => row.ageBand === myBand) : undefined;
  const max = Math.max(
    1,
    hasSubscriptions ? monthly : 0,
    ...byAge.map((row) => row.medianMonthlyKRW ?? 0),
  );
  const typical = mine?.medianMonthlyKRW ?? null;
  const diff = typical === null ? null : monthly - typical;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{a.pickNote}</p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={a.myBand}>
          {AGE_BANDS.map((band) => (
            <button
              key={band}
              type="button"
              role="radio"
              aria-checked={myBand === band}
              onClick={() => onPickBand(band)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                myBand === band
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {a.labels[band]}
            </button>
          ))}
        </div>
      </div>

      <figure className="space-y-2">
        <figcaption className="text-sm font-semibold">{a.caption}</figcaption>
        <ul className="space-y-1.5">
          {byAge.map((row) => {
            const isMine = row.ageBand === myBand;
            return (
              <li
                key={row.ageBand}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 text-xs"
              >
                <span className={cn(isMine ? "font-bold" : "text-muted-foreground")}>
                  {a.labels[row.ageBand]}
                </span>
                {row.medianMonthlyKRW === null ? (
                  <span className="col-span-2 text-muted-foreground">
                    {a.notEnough(row.participants, STATS_MIN_PER_AGE_BAND)}
                  </span>
                ) : (
                  <>
                    <span className="h-3 rounded-r bg-muted" aria-hidden>
                      <span
                        className={cn(
                          "block h-full rounded-r",
                          isMine ? "bg-primary" : "bg-muted-foreground/35",
                        )}
                        style={{ width: `${(row.medianMonthlyKRW / max) * 100}%` }}
                      />
                    </span>
                    <span className={cn("tabular-nums", isMine && "font-bold")}>
                      {formatKRW(row.medianMonthlyKRW)}
                    </span>
                  </>
                )}
              </li>
            );
          })}
          {hasSubscriptions && (
            <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-2 border-t pt-2 text-xs">
              <span className="font-bold">{a.me}</span>
              <span className="h-3 rounded-r bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-r bg-foreground"
                  style={{ width: `${(monthly / max) * 100}%` }}
                />
              </span>
              <span className="font-bold tabular-nums">{formatKRW(monthly)}</span>
            </li>
          )}
        </ul>
      </figure>

      {hasSubscriptions && myBand && (
        <p className="rounded-xl bg-muted/50 p-3 text-sm">
          {diff === null
            ? a.tooFew(a.labels[myBand], mine?.participants ?? 0)
            : diff > 0
              ? a.more(a.labels[myBand], formatKRW(diff), formatKRW(diff * 12))
              : diff < 0
                ? a.less(a.labels[myBand], formatKRW(-diff))
                : a.same(a.labels[myBand])}
        </p>
      )}
    </div>
  );
}
