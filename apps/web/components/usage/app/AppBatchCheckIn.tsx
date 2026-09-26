"use client";

import React, { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { type Subscription, metricForSubscription } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useStore } from "@lib/store";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { formatDuration, lastDays } from "@lib/usage/history";
import { subUsage } from "@lib/usage/value";
import { AppSheet } from "../../settings/app/AppSheet";
import { Button } from "../../ui/button";
import { SubLogo } from "./parts";

interface Row {
  sub: Subscription;
  opens: number;
  ms: number;
  coveredDays: number;
  kind: "measured" | "not-installed";
}

/**
 * 폰 기록으로 한 번에 체크인. 연결표에 있는 구독을 한 화면에 모아, 최근 30일 동안 이 폰에서 연
 * 횟수를 채워 둔다. 저장은 사용자가 확인한 줄만 한다 — 폰 기록은 TV·PC에서 본 것을 모른다.
 *
 * 0회는 기본으로 체크를 빼고 '다른 기기에서 봤나요?'로 묻는다. 실수로 '안 씀'이 기록되면 해지
 * 권유로 이어진다. 이 폰에 앱이 없는 구독은 고를 수 없게 두고 이유를 적는다.
 */
export function AppBatchCheckIn({
  open,
  onClose,
  subscriptions,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onDone?: (count: number) => void;
}) {
  const rate = useExchangeRate();
  const { history, installed } = usePhoneUsage();
  const checkIn = useStore((state) => state.checkIn);

  const { rows, unmapped } = useMemo(() => {
    const now = new Date();
    const dates = lastDays(now, 30);
    const list: Row[] = [];
    let skipped = 0;
    for (const sub of subscriptions) {
      const usage = subUsage(sub, history, installed, dates, rate);
      // 폰에서 연 횟수는 횟수로 재는 구독에만 넣는다. 음악(시간)·AI(쓴 날)는 구독마다 따로 체크인한다.
      if (
        usage.state === "unmapped" ||
        usage.state === "no-data" ||
        metricForSubscription(sub) !== "uses"
      ) {
        skipped += 1;
        continue;
      }
      list.push({
        sub,
        opens: usage.totals.opens,
        ms: usage.totals.ms,
        coveredDays: usage.totals.coveredDays,
        kind: usage.state === "not-installed" ? "not-installed" : "measured",
      });
    }
    return { rows: list, unmapped: skipped };
  }, [subscriptions, history, installed, rate]);

  // 열 때마다 폰 기록으로 다시 채운다(key로 새로 그린다 — 부모가 open이 바뀔 때 key를 바꾼다).
  const [picks, setPicks] = useState<Record<string, { checked: boolean; count: number }>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.sub.id,
        { checked: row.kind === "measured" && row.opens > 0, count: row.opens },
      ]),
    ),
  );
  const [saved, setSaved] = useState<number | null>(null);

  const chosen = rows.filter((row) => picks[row.sub.id]?.checked);

  const update = (id: string, patch: Partial<{ checked: boolean; count: number }>) =>
    setPicks((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submit = () => {
    let done = 0;
    for (const row of chosen) {
      try {
        checkIn(row.sub.id, picks[row.sub.id].count);
        done += 1;
      } catch (error) {
        console.error(error);
      }
    }
    setSaved(done);
    onDone?.(done);
  };

  const covered = Math.min(30, Math.max(0, ...rows.map((row) => row.coveredDays)));

  return (
    <AppSheet open={open} onClose={onClose} label="폰 기록으로 한 번에 체크인">
      {saved !== null ? (
        <div className="space-y-4 py-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <Check className="size-6" aria-hidden />
          </span>
          <p className="text-lg font-black">{saved}개 체크인했어요</p>
          <Button className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <h2 className="text-lg font-black tracking-tight">폰 기록으로 한 번에 체크인</h2>
            <p className="text-sm text-muted-foreground">
              {covered < 30 ? `기록이 있는 최근 ${covered}일 동안` : "최근 30일 동안"} 이 폰에서 연
              횟수예요. 확인하고 고쳐 주세요.
            </p>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
              폰 기록으로 잴 수 있는 구독이 없어요. 체크인은 구독마다 직접 해 주세요.
            </p>
          ) : (
            <ul className="divide-y rounded-2xl border">
              {rows.map((row) => {
                const pick = picks[row.sub.id] ?? { checked: false, count: 0 };
                const disabled = row.kind === "not-installed";
                return (
                  <li key={row.sub.id} className="flex items-center gap-3 px-3 py-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={pick.checked}
                      aria-label={`${row.sub.name} 체크인에 넣기`}
                      disabled={disabled}
                      onClick={() => update(row.sub.id, { checked: !pick.checked })}
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
                        pick.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                        disabled && "opacity-40",
                      )}
                    >
                      {pick.checked && <Check className="size-4" aria-hidden />}
                    </button>
                    <SubLogo sub={row.sub} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{row.sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {disabled
                          ? "이 폰에 앱이 없어요 · 따로 체크인"
                          : row.opens === 0
                            ? "폰에서는 안 열었어요 · 다른 기기에서 봤나요?"
                            : `${formatDuration(row.ms)} 사용`}
                      </p>
                    </div>
                    {!disabled && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`${row.sub.name} 한 번 빼기`}
                          onClick={() =>
                            update(row.sub.id, {
                              count: Math.max(0, pick.count - 1),
                              checked: true,
                            })
                          }
                          className="flex size-8 items-center justify-center rounded-full bg-secondary"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-base font-black tabular-nums">
                          {pick.count}
                        </span>
                        <button
                          type="button"
                          aria-label={`${row.sub.name} 한 번 더하기`}
                          onClick={() =>
                            update(row.sub.id, {
                              count: Math.min(999, pick.count + 1),
                              checked: true,
                            })
                          }
                          className="flex size-8 items-center justify-center rounded-full bg-secondary"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="text-xs text-muted-foreground">
            TV·PC·태블릿에서 본 건 빠져 있어요. 거기서도 썼다면 + 로 더해 주세요.
            {unmapped > 0 && ` 폰 기록으로 알 수 없는 구독 ${unmapped}개는 따로 체크인해요.`}
          </p>

          <div className="space-y-2">
            <Button className="w-full" size="lg" disabled={chosen.length === 0} onClick={submit}>
              {chosen.length > 0 ? `${chosen.length}개 체크인하기` : "체크인할 구독을 골라 주세요"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              나중에
            </Button>
          </div>
        </div>
      )}
    </AppSheet>
  );
}
