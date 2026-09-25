"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  type Subscription,
  calculateCostPerUse,
  formatCurrency,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { cn } from "@lib/utils";

const MAX_STEP = 10;

/** 앱의 체크인 질문. 체크인은 최근 30일 동안의 횟수로 계산하므로(store.checkIn) 어디서나 이 말로 묻는다. */
export const APP_CHECK_IN_QUESTION = "최근 30일 동안 몇 번 썼어요?";

/** '₩ 17,000'처럼 기호 뒤를 한 칸 띄운다(계산서와 같은 표기). */
function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/**
 * 앱의 체크인 입력. 등록 직후·첫 체크인 카드·체크인 창이 모두 이것을 쓴다.
 *
 * 큰 숫자와 회당 단가, 0~10을 1회씩 고르는 단계 막대(누르기·끌기·키보드 화살표, 화면 낭독기는
 * 슬라이더)를 보여준다. 10보다 많으면 '직접 입력'으로 숫자를 친다. value가 null이면 아직 고르지 않은
 * 상태라 숫자를 흐리게 둔다.
 */
export function AppUsageCountPicker({
  subscription,
  value,
  onChange,
}: {
  subscription: Subscription;
  value: number | null;
  onChange: (count: number) => void;
}) {
  const [exact, setExact] = useState((value ?? 0) > MAX_STEP);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = value ?? 0;
  const monthly = getMyMonthlyShareAmount(subscription);

  const pick = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * MAX_STEP));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = Math.min(count, MAX_STEP);
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(MAX_STEP, step + 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(0, step - 1));
    else if (e.key === "Home") onChange(0);
    else if (e.key === "End") onChange(MAX_STEP);
    else return;
    e.preventDefault();
  };

  const shown = Math.min(count, MAX_STEP);

  return (
    <div>
      <div className="text-center" aria-live="polite">
        <p
          className={cn(
            "text-[40px] leading-tight font-black tracking-tight tabular-nums",
            value === null && "text-muted-foreground/50",
          )}
        >
          {!exact && count >= MAX_STEP ? "10+" : count}
          <span className="ml-0.5 text-[15px] font-extrabold">회</span>
        </p>
        <p className="min-h-4 text-xs text-muted-foreground">
          {value === null
            ? "막대를 눌러 골라 주세요"
            : count === 0
              ? "안 썼어요"
              : `회당 ${spaced(formatCurrency(calculateCostPerUse(monthly, count), subscription.currency))}`}
        </p>
      </div>

      {exact ? (
        <label className="mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
          <input
            inputMode="numeric"
            autoFocus
            value={count ? String(count) : ""}
            onChange={(e) =>
              onChange(Math.min(999, Number(e.target.value.replace(/[^0-9]/g, "")) || 0))
            }
            placeholder="0"
            aria-label="사용 횟수"
            className="min-w-0 flex-1 bg-transparent text-xl font-black tabular-nums outline-none placeholder:text-muted-foreground"
          />
          <span className="text-sm font-bold text-muted-foreground">회</span>
        </label>
      ) : (
        <>
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="사용 횟수"
            aria-valuemin={0}
            aria-valuemax={MAX_STEP}
            aria-valuenow={shown}
            aria-valuetext={shown === MAX_STEP ? "10회 이상" : `${shown}회`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onKeyDown={onKeyDown}
            className="relative mx-3 mt-3 h-11 touch-none select-none focus-visible:outline-none"
          >
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-secondary" />
            <span
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: `${value === null ? 0 : (shown / MAX_STEP) * 100}%` }}
            />
            {Array.from({ length: MAX_STEP + 1 }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                  value !== null && i === shown
                    ? "size-[22px] border-4 border-background bg-primary ring-2 ring-primary"
                    : value !== null && i < shown
                      ? "size-2.5 bg-primary"
                      : "size-2.5 border-2 border-border bg-card",
                )}
                style={{ left: `${(i / MAX_STEP) * 100}%` }}
              />
            ))}
          </div>
          <div
            className="mx-3 flex justify-between text-[10.5px] text-muted-foreground"
            aria-hidden
          >
            <span className="w-6 -translate-x-1/2 text-center">0</span>
            <span className="w-6 text-center">5</span>
            <span className="w-6 translate-x-1/2 text-center">10+</span>
          </div>
        </>
      )}

      {!exact && (
        <button
          type="button"
          onClick={() => setExact(true)}
          className="mx-auto mt-2 block text-xs text-muted-foreground underline underline-offset-4"
        >
          10번 넘게 썼다면 직접 입력
        </button>
      )}
    </div>
  );
}
