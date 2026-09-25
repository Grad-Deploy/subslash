"use client";

import React, { useMemo, useState } from "react";
import {
  type Subscription,
  type UsageLog,
  formatCurrency,
  getBilledAmount,
  getDaysUntilBillingFor,
  getNextBillingDateFor,
  isInTrial,
} from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage, usePhoneUsageStore } from "@hooks/usePhoneUsage";
import { addDays, dayKey, formatDuration, lastDays } from "@lib/usage/history";
import { median, subUsage, type SubUsage } from "@lib/usage/value";
import { Button } from "../../ui/button";
import { AppBatchCheckIn } from "./AppBatchCheckIn";
import { SubLogo, won } from "./parts";

/** 이만큼 기록이 쌓여야 '안 열었다'고 말한다. 며칠치로 단정하면 여행·바쁜 주를 해지 권유로 읽는다. */
const MIN_COVERED_DAYS = 14;
/** 결제가 이 안에 있을 때만 '안 열었어요'를 올린다. 멀면 급하지 않다. */
const BILLING_WITHIN_DAYS = 7;
/** 내 다른 구독의 시간당 단가(가운데 값)보다 이만큼 비싸면 참고로 알린다. */
const PRICEY_RATIO = 3;
/** 체크인이 이보다 오래됐으면 '체크인 필요'로 센다(체크인은 최근 30일을 묻는다). */
const CHECK_IN_STALE_DAYS = 30;

interface Alert {
  kind: "unused" | "pricey";
  usage: SubUsage;
  title: string;
  reason: string;
}

/** 다음 결제일 다음 날(없으면 30일 뒤)까지 묻지 않는다. */
function snoozeUntil(sub: Subscription, now: Date): string {
  const next = getNextBillingDateFor(sub, now);
  return dayKey(next ? addDays(next, 1) : addDays(now, 30));
}

/**
 * 대시보드 '지금 결정할 것' 위에 올리는 폰 기록 알림(안드로이드 앱).
 *
 * 1) 기록이 충분히 쌓였는데 한 번도 안 열었고 결제가 7일 안이면 → 해지 안내로 바로.
 * 2) 시간당 단가가 내 다른 구독보다 확 높으면 → 참고용(회색).
 * 3) 체크인이 필요한 구독이 있으면 → 폰 기록으로 한 번에 체크인.
 *
 * TV로만 보는 OTT는 폰에서 늘 0회라, '다른 기기에서 봤어요'·'괜찮아요'를 누르면 그 구독은 다음 결제
 * 주기까지 묻지 않는다. 이 알림은 폰 기록만 보고 체크인 기록을 바꾸지 않는다.
 */
export function AppUnusedAlerts({
  subscriptions,
  usageLogs,
  onCancelGuide,
}: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  onCancelGuide: (subscriptionId: string) => void;
}) {
  const rate = useExchangeRate();
  const { status, history, installed, snooze } = usePhoneUsage();
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchKey, setBatchKey] = useState(0);

  const now = useMemo(() => new Date(), []);
  const today = dayKey(now);

  const { alerts, needCheckIn } = useMemo(() => {
    const dates = lastDays(now, 30);
    const paying = subscriptions.filter((sub) => !isInTrial(sub, now));
    const usages = paying
      .map((sub) => subUsage(sub, history, installed, dates, rate))
      .filter((u) => u.state === "measured" && u.totals.coveredDays >= MIN_COVERED_DAYS);
    const hidden = (id: string) => (snooze[id] ?? "") > today;

    const list: Alert[] = [];
    for (const u of usages) {
      if (hidden(u.sub.id) || u.totals.opens > 0 || u.totals.ms > 0) continue;
      const days = getDaysUntilBillingFor(u.sub, now);
      if (days === null || days < 0 || days > BILLING_WITHIN_DAYS) continue;
      const amount = spacedCurrency(formatCurrency(getBilledAmount(u.sub), u.sub.currency));
      list.push({
        kind: "unused",
        usage: u,
        title: `${u.sub.name} 앱을 ${u.totals.coveredDays}일 동안 안 열었어요`,
        reason: `${days === 0 ? "오늘" : `${days}일 뒤`} ${amount}이 결제돼요. 노트북·태블릿에서도 안 봤다면 쉬어가도 괜찮아요.`,
      });
    }

    const hourly = usages.filter((u) => u.hourlyKRW !== null);
    for (const u of hourly) {
      if (hidden(u.sub.id) || list.some((a) => a.usage.sub.id === u.sub.id)) continue;
      const others = median(
        hourly.filter((o) => o.sub.id !== u.sub.id).map((o) => o.hourlyKRW as number),
      );
      // 비교할 구독이 둘 이상은 있어야 '다른 구독보다'라고 말한다.
      if (others === null || hourly.length < 3 || others <= 0) continue;
      const ratio = (u.hourlyKRW as number) / others;
      if (ratio < PRICEY_RATIO) continue;
      list.push({
        kind: "pricey",
        usage: u,
        title: `${u.sub.name}, 시간당 ${won(u.hourlyKRW as number)}`,
        reason: `최근 ${u.totals.coveredDays}일 ${formatDuration(u.totals.ms)}만 썼어요. 내 다른 구독보다 ${Math.floor(ratio)}배 비싸요.`,
      });
    }

    const staleBefore = now.getTime() - CHECK_IN_STALE_DAYS * 86_400_000;
    const need = usages.filter(
      (u) =>
        !usageLogs.some(
          (log) => log.subscriptionId === u.sub.id && Date.parse(log.checkedAt) >= staleBefore,
        ),
    ).length;

    return { alerts: list, needCheckIn: need };
  }, [subscriptions, usageLogs, history, installed, snooze, rate, now, today]);

  if (status !== "on" || (alerts.length === 0 && needCheckIn === 0)) return null;

  const snoozeSub = (sub: Subscription) =>
    usePhoneUsageStore.getState().snoozeUntil(sub.id, snoozeUntil(sub, now));

  return (
    <section className="space-y-2" aria-label="폰 기록으로 본 구독">
      {alerts.map((alert) => (
        <div
          key={alert.usage.sub.id}
          className={
            alert.kind === "unused"
              ? "space-y-3 rounded-2xl border border-orange-500/40 bg-orange-500/5 p-4"
              : "space-y-3 rounded-2xl border bg-secondary/40 p-4"
          }
        >
          <div className="flex items-start gap-3">
            <SubLogo sub={alert.usage.sub} size={32} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">{alert.title}</span>
                <span className="text-[11px] font-semibold text-muted-foreground">폰 기록</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{alert.reason}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs font-bold"
              variant={alert.kind === "unused" ? "default" : "outline"}
              onClick={() => onCancelGuide(alert.usage.sub.id)}
            >
              해지 안내 보기
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs"
              onClick={() => snoozeSub(alert.usage.sub)}
            >
              {alert.kind === "unused" ? "다른 기기에서 봤어요" : "괜찮아요"}
            </Button>
          </div>
        </div>
      ))}

      {needCheckIn > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
          <div className="min-w-0">
            <p className="text-sm font-bold">폰 기록으로 한 번에 체크인</p>
            <p className="text-xs text-muted-foreground">체크인 필요 {needCheckIn}개를 채워요</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setBatchKey((k) => k + 1);
              setBatchOpen(true);
            }}
          >
            채우기
          </Button>
        </div>
      )}

      {batchOpen && (
        <AppBatchCheckIn
          key={batchKey}
          open={batchOpen}
          onClose={() => setBatchOpen(false)}
          subscriptions={subscriptions.filter((sub) => !isInTrial(sub, now))}
        />
      )}
    </section>
  );
}

function spacedCurrency(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}
