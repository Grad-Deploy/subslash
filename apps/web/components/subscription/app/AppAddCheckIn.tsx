"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Check } from "lucide-react";
import {
  type Subscription,
  calculateCostPerUse,
  formatCurrency,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";
import { ServiceLogo } from "../ServiceLogo";
import { DialogDescription, DialogTitle } from "../../ui/dialog";

const MAX_STEP = 10;

/** '₩ 17,000'처럼 기호 뒤를 한 칸 띄운다(계산서와 같은 표기). */
function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/**
 * 앱에서 구독을 하나 등록한 직후, 같은 창에서 '이번 달 대략 몇 번 썼는지'를 묻는다.
 * 등록 폼에 칸을 늘리지 않고 저장 뒤 한 단계만 더 묻고, 언제든 건너뛸 수 있다.
 *
 * 0~10을 1회씩 고르는 단계 막대로 받는다. 고른 횟수 그대로 체크인(checkIn)으로 저장한다 —
 * 구간을 어림해 넣지 않는다. 10보다 많으면 직접 입력한다. 이번 달에 막 가입했으면 기록하지 않는다.
 */
export function AppAddCheckIn({
  subscription,
  onDone,
}: {
  subscription: Subscription;
  /** 창을 닫는다. recorded는 체크인을 저장했을 때의 횟수. */
  onDone: (recorded?: number) => void;
}) {
  const checkIn = useStore((s) => s.checkIn);
  const [count, setCount] = useState(0);
  const [exact, setExact] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const monthly = getMyMonthlyShareAmount(subscription);
  const perUse =
    count > 0
      ? spaced(formatCurrency(calculateCostPerUse(monthly, count), subscription.currency))
      : null;

  const pick = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setCount(Math.round(ratio * MAX_STEP));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e.clientX);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setCount((c) => Math.min(MAX_STEP, c + 1));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setCount((c) => Math.max(0, c - 1));
    else if (e.key === "Home") setCount(0);
    else if (e.key === "End") setCount(MAX_STEP);
    else return;
    e.preventDefault();
  };

  const save = () => {
    checkIn(subscription.id, count);
    onDone(count);
  };

  return (
    <div>
      <div className="flex items-center gap-3 pr-6">
        <ServiceLogo
          name={subscription.name}
          cancelUrl={subscription.cancelUrl}
          fallbackEmoji={subscription.iconUrl}
          fallbackColor={subscription.iconColor}
          size={40}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
            <Check className="size-3.5" aria-hidden />
            등록했어요
          </p>
          <p className="truncate text-base font-black tracking-tight">{subscription.name}</p>
        </div>
        <p className="ml-auto shrink-0 text-[13px] font-extrabold tabular-nums">
          {spaced(formatCurrency(monthly, subscription.currency))}
          <span className="text-[11px] font-semibold text-muted-foreground">/월</span>
        </p>
      </div>

      <hr className="my-4" />

      <DialogTitle className="text-[17px] font-black tracking-tight">
        이번 달 대략 몇 번 썼어요?
      </DialogTitle>
      <DialogDescription className="mt-1 text-xs text-muted-foreground">
        가성비 계산서에 바로 들어가요. 나중에 고칠 수 있어요.
      </DialogDescription>

      <div className="mt-3 text-center" aria-live="polite">
        <p className="text-[40px] leading-tight font-black tracking-tight tabular-nums">
          {!exact && count === MAX_STEP ? "10+" : count}
          <span className="ml-0.5 text-[15px] font-extrabold">회</span>
        </p>
        <p className="min-h-4 text-xs text-muted-foreground">
          {perUse ? `회당 ${perUse}` : "안 썼어요"}
        </p>
      </div>

      {exact ? (
        <label className="mt-3 flex items-center gap-2 rounded-2xl border px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
          <input
            inputMode="numeric"
            autoFocus
            value={count ? String(count) : ""}
            onChange={(e) =>
              setCount(Math.min(999, Number(e.target.value.replace(/[^0-9]/g, "")) || 0))
            }
            placeholder="0"
            aria-label="이번 달 사용 횟수"
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
            aria-label="이번 달 사용 횟수"
            aria-valuemin={0}
            aria-valuemax={MAX_STEP}
            aria-valuenow={count}
            aria-valuetext={count === MAX_STEP ? "10회 이상" : `${count}회`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onKeyDown={onKeyDown}
            className="relative mx-3 mt-3 h-11 touch-none select-none focus-visible:outline-none"
          >
            <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-secondary" />
            <span
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary"
              style={{ width: `${(count / MAX_STEP) * 100}%` }}
            />
            {Array.from({ length: MAX_STEP + 1 }, (_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                  i === count
                    ? "size-[22px] border-4 border-background bg-primary ring-2 ring-primary"
                    : i < count
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

      <div className="mt-3 flex justify-between gap-3 text-xs text-muted-foreground">
        <button type="button" onClick={() => onDone()} className="underline underline-offset-4">
          이번 달에 가입했어요
        </button>
        {!exact && (
          <button
            type="button"
            onClick={() => setExact(true)}
            className="underline underline-offset-4"
          >
            10번 넘게 썼다면 직접 입력
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
      >
        완료
      </button>
      <button
        type="button"
        onClick={() => onDone()}
        className="mt-1 h-9 w-full text-[12.5px] font-semibold text-muted-foreground"
      >
        나중에 할게요
      </button>
    </div>
  );
}
