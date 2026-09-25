"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  calculateCostPerUse,
  formatCurrency,
  getMyMonthlyShareAmount,
  getRiskLevel,
  type RiskLevel,
  type Subscription,
} from "@subslash/shared";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { RiskBadge } from "@components/dashboard/RiskBadge";
import { useStoredFlag } from "@hooks/useStoredFlag";
import {
  APP_CHECK_IN_QUESTION,
  AppUsageCountPicker,
} from "@components/subscription/app/AppUsageCountPicker";

/** 신호 색의 뜻. 색마다 처음 나올 때 한 번만 보여준다(getRiskLevel 기준). */
const HINTS: Record<RiskLevel, string> = {
  red: "빨간색은 요금만큼 쓰지 못했다는 뜻이에요. 다음 달에도 그렇다면 해지를 고민해 볼 때예요.",
  yellow: "노란색은 애매하다는 뜻이에요. 다음 달에도 이 정도라면 다시 생각해 보세요.",
  green: "초록색은 요금만큼 잘 쓰고 있다는 뜻이에요.",
};

interface FirstCheckInCardProps {
  subscription: Subscription;
  onSubmit: (count: number) => void;
}

/**
 * 앱에서 구독을 등록한 직후, 체크인 창으로 보내지 않고 대시보드 카드 안에서 바로 사용 횟수를
 * 묻는다. 계산은 스토어의 checkIn과 같게 한 달치 내 몫(getMyMonthlyShareAmount)으로 나눈다.
 */
export function FirstCheckInCard({ subscription, onSubmit }: FirstCheckInCardProps) {
  const [count, setCount] = useState<number | null>(null);

  const monthly = getMyMonthlyShareAmount(subscription);
  const risk: RiskLevel | null =
    count === null ? null : getRiskLevel(calculateCostPerUse(monthly, count), monthly, count);

  const [hintSeen, markHintSeen] = useStoredFlag(`subslash_app_hint_${risk ?? "none"}`, true);
  const showHint = risk !== null && !hintSeen;

  const planLine = [subscription.planName, `월 ${formatCurrency(monthly, subscription.currency)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className="rounded-2xl border bg-card p-4"
      aria-label={`${subscription.name} 첫 체크인`}
    >
      <div className="flex items-center gap-2.5">
        <ServiceLogo
          name={subscription.name}
          cancelUrl={subscription.cancelUrl}
          fallbackEmoji={subscription.iconUrl}
          fallbackColor={subscription.iconColor}
          size={34}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{subscription.name}</p>
          <p className="text-[11.5px] text-muted-foreground tabular-nums">{planLine}</p>
        </div>
      </div>

      <p className="mt-3 mb-2 text-[13px] font-bold">{APP_CHECK_IN_QUESTION}</p>

      {/* 입력은 앱의 다른 체크인(등록 직후·체크인 창)과 같은 단계 막대다. */}
      <AppUsageCountPicker subscription={subscription} value={count} onChange={setCount} />

      {count !== null && risk && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
          <p className="text-[11.5px] text-muted-foreground">이 정도면</p>
          <RiskBadge level={risk} />
        </div>
      )}

      {showHint && risk && (
        <div className="relative mt-2 rounded-xl bg-foreground py-2 pr-8 pl-3 text-[11.5px] leading-relaxed text-background">
          {HINTS[risk]}
          <button
            type="button"
            onClick={markHintSeen}
            aria-label="안내 닫기"
            className="absolute top-1.5 right-1.5 rounded p-0.5 opacity-70 hover:opacity-100"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={count === null}
        onClick={() => {
          if (count === null) return;
          if (risk) markHintSeen();
          onSubmit(count);
        }}
        className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-40"
      >
        기록하기
      </button>
    </section>
  );
}
