"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Subscription,
  formatCurrency,
  getPriceCheckCandidates,
  PRICE_CHECK_INTERVAL_DAYS,
} from "@subslash/shared";
import { Button } from "../ui/button";
import { useStore } from "../../lib/store";

interface PriceCheckBannerProps {
  subscriptions: Subscription[];
}

/**
 * 요금 점검 배너.
 *
 * 앱은 서비스의 현재 요금을 조회하지 않는다. 그래서 "요금이 인상되었습니다"
 * 라고 알리지 않고, 앱이 실제로 아는 것(프리셋에 적힌 기준 요금, 마지막 확인
 * 시점)만 보여주며 사용자에게 확인을 부탁한다.
 */
export function PriceCheckBanner({ subscriptions }: PriceCheckBannerProps) {
  const router = useRouter();
  const confirmSubscriptionPrice = useStore((state) => state.confirmSubscriptionPrice);
  const [dismissed, setDismissed] = useState(false);

  const candidates = getPriceCheckCandidates(subscriptions);

  if (dismissed || candidates.length === 0) return null;

  const target = candidates[0];
  const restCount = candidates.length - 1;

  return (
    <section className="p-4 sm:p-5 border-2 border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-xl leading-none pt-0.5">🏷️</span>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">
              {target.name} 요금, 최근 인상되었나요?
            </h3>
            {target.reason === "preset-mismatch" && target.presetAmount !== null ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                등록된 금액은{" "}
                <strong className="text-foreground">
                  {formatCurrency(target.currentAmount, target.currency)}
                </strong>
                인데, 앱에 실린 {target.name} 기준 요금은{" "}
                <strong className="text-foreground">
                  {formatCurrency(target.presetAmount, target.currency)}
                </strong>
                입니다. 요금제가 다르거나 가격이 바뀌었을 수 있어요. 실제 결제 금액은 앱이 확인할 수
                없으니 직접 확인해주세요.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {target.everChecked ? "마지막으로 요금을 확인한 지" : "등록한 지"}{" "}
                <strong className="text-foreground">{target.daysSinceChecked}일</strong> 지났습니다.
                현재 결제 금액이{" "}
                <strong className="text-foreground">
                  {formatCurrency(target.currentAmount, target.currency)}
                </strong>
                가 맞는지 확인해주세요.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-muted-foreground hover:text-foreground text-xs px-1.5"
          aria-label="요금 점검 배너 닫기"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs bg-background"
          onClick={() => confirmSubscriptionPrice(target.subscriptionId)}
        >
          ✅ 요금 유지
        </Button>
        {target.reason === "preset-mismatch" && target.presetAmount !== null && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs bg-background"
            onClick={() =>
              confirmSubscriptionPrice(target.subscriptionId, target.presetAmount ?? undefined)
            }
          >
            🔄 최신 요금({formatCurrency(target.presetAmount, target.currency)})으로 갱신
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-xs bg-background"
          onClick={() => router.push(`/subs/${target.subscriptionId}`)}
        >
          ✏️ 직접 수정
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        확인해두면 {PRICE_CHECK_INTERVAL_DAYS}일 동안 다시 묻지 않습니다.
        {restCount > 0 && ` · 확인이 필요한 구독이 ${restCount}건 더 있습니다.`}
      </p>
    </section>
  );
}
