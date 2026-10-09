"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  formatCurrency,
  formatUSD,
  getMyMonthlyShareAmount,
  metricForSubscription,
  type CheckInResponse,
  type Subscription,
} from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useStore } from "@lib/store";
import { useLocale, useServiceNames, useT } from "@lib/i18n";
import {
  apiValueRatio,
  formatRatio,
  formatTokenCount,
  matchPcUsageSubscription,
  type PcUsageServiceId,
} from "@lib/pc-usage";
import { CheckInModal } from "../subscription/CheckInModal";
import { ServiceLogo } from "../subscription/ServiceLogo";
import { Button } from "../ui/button";

/**
 * PC 기록으로 센 쓴 날을 그 서비스 구독의 체크인 창에 채워 보여 주는 줄. 저장은 사용자가 확인을 눌러야
 * 된다 — PC에서 쓴 날만 셌으므로 웹·폰에서 쓴 날을 더할 수 있어야 한다. 링크(`#pc=…`)와 'PC 기록 읽기'가 함께 쓴다.
 */
export function PcUsageRow({
  serviceId,
  days,
  apiUsd = null,
  tokens = null,
  subscriptions,
}: {
  serviceId: PcUsageServiceId;
  days: number;
  /** 그 PC에서 구독으로 쓴 토큰을 API 요금표로 환산한 금액(USD). 모르면 null. */
  apiUsd?: number | null;
  /** 그 PC에서 구독으로 쓴 토큰 수. 모르면 null. */
  tokens?: number | null;
  subscriptions: readonly Subscription[];
}) {
  const t = useT().pcUsage;
  const names = useServiceNames();
  const checkIn = useStore((state) => state.checkIn);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CheckInResponse | undefined>();
  const [done, setDone] = useState(false);
  const exchangeRate = useExchangeRate();
  const locale = useLocale();

  const match = matchPcUsageSubscription(serviceId, subscriptions);
  const subscription = match.kind === "match" ? match.subscription : null;
  // 이 화면이 채우는 숫자는 '쓴 날'이다. 다른 기준으로 재는 구독에 넣으면 사용자가 답하지 않은 숫자가 된다.
  const sameMetric = subscription ? metricForSubscription(subscription) === "days" : false;

  // 구독으로 얼마나 뽑아 썼는지: API로 냈다면 든 금액을 내 몫 한 달 구독료와 견준다. 쓴 날 체크인은 그대로 두고
  // 근거로만 보인다 — PC 기록이라 웹·앱 사용은 빠진 값이다.
  const ratio =
    subscription && apiUsd !== null ? apiValueRatio(subscription, apiUsd, exchangeRate) : null;

  // 하루당 가격: 내 몫 한 달 구독료 ÷ PC 기록으로 센 쓴 날(체크인 결과의 하루 단가와 같은 셈).
  const perDay = subscription && days > 0 ? getMyMonthlyShareAmount(subscription) / days : null;

  const problem =
    match.kind === "none"
      ? t.none
      : match.kind === "ambiguous"
        ? t.ambiguous(match.count)
        : !sameMetric
          ? t.otherMetric
          : null;

  return (
    <li className="space-y-2 rounded-2xl border p-3">
      <div className="flex items-center gap-3">
        <ServiceLogo presetId={serviceId} name={names.id(serviceId)} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {subscription ? names.sub(subscription) : names.id(serviceId)}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.tool[serviceId]} · {t.days(days)}
            {perDay !== null &&
              subscription &&
              ` · ${t.perDay(formatCurrency(perDay, subscription.currency))}`}
            {tokens !== null && ` · ${t.tokens(formatTokenCount(tokens, locale))}`}
          </p>
        </div>
        {subscription && sameMetric && (
          <Button size="sm" variant={done ? "outline" : "default"} onClick={() => setOpen(true)}>
            {done ? t.done : t.checkIn}
          </Button>
        )}
      </div>
      {apiUsd !== null && (
        <div className="space-y-0.5 rounded-xl bg-secondary/60 px-2.5 py-2 text-xs">
          <p className="font-semibold">{t.apiValue(formatUSD(apiUsd))}</p>
          {ratio !== null && (
            <p className="text-muted-foreground">
              {ratio >= 1 ? t.ratioOver(formatRatio(ratio)) : t.ratioUnder(Math.round(ratio * 100))}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.apiNote}</p>
        </div>
      )}
      {problem && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {problem}{" "}
          <Link href="/subs" className="font-semibold text-foreground underline">
            {t.toSubs}
          </Link>
        </p>
      )}
      {subscription && sameMetric && (
        <CheckInModal
          subscription={subscription}
          isOpen={open}
          initialCount={days}
          result={result}
          onSubmit={(count) => {
            // 토큰 근거를 체크인에 남긴다 — 구독 상세에서 다시 보고, 구독료 이상이면 위험도를 올린다.
            setResult(
              checkIn(
                subscription.id,
                count,
                tokens !== null ? { tokens: { count: tokens, apiUsd } } : undefined,
              ),
            );
            setDone(true);
          }}
          onClose={() => {
            setOpen(false);
            setResult(undefined);
          }}
        />
      )}
    </li>
  );
}
