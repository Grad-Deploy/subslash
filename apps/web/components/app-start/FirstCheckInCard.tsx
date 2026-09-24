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
import { cn } from "@lib/utils";

/** 체크인 창(CheckInModal)과 같은 빠른 선택. 0회는 −로 내리거나 직접 적는다. */
const QUICK_COUNTS = [1, 3, 5, 10, 20, 30];

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

  const setSafe = (n: number) => setCount(Math.max(0, Math.min(999, n)));

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

      <p className="mt-3 mb-2 text-[13px] font-bold">지난 30일 동안 몇 번 썼나요?</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="줄이기"
          onClick={() => setSafe((count ?? 1) - 1)}
          className="grid size-10 shrink-0 place-items-center rounded-xl border bg-background text-lg font-bold"
        >
          −
        </button>
        <div className="relative min-w-0 flex-1">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            aria-label="사용 횟수"
            value={count ?? ""}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setCount(Number.isNaN(n) ? null : Math.max(0, Math.min(999, n)));
            }}
            className="h-10 w-full rounded-xl border bg-background pr-8 text-center text-xl font-black tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold text-muted-foreground">
            번
          </span>
        </div>
        <button
          type="button"
          aria-label="늘리기"
          onClick={() => setSafe((count ?? 0) + 1)}
          className="grid size-10 shrink-0 place-items-center rounded-xl border bg-background text-lg font-bold"
        >
          +
        </button>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {QUICK_COUNTS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={count === n}
            onClick={() => setCount(n)}
            className={cn(
              "rounded-lg border py-1.5 text-[11.5px] font-bold tabular-nums transition-colors",
              count === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {n}회
          </button>
        ))}
      </div>

      {count !== null && risk && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
          <div>
            <p className="text-[11px] text-muted-foreground">1회당 실제 단가</p>
            <p className="text-lg font-black tracking-tight tabular-nums">
              {count === 0
                ? "한 번도 안 씀"
                : formatCurrency(calculateCostPerUse(monthly, count), subscription.currency)}
            </p>
          </div>
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
