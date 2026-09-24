"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { type Subscription, formatCurrency, getMyMonthlyShareAmount } from "@subslash/shared";
import { useStore } from "@lib/store";
import { ServiceLogo } from "../ServiceLogo";
import { DialogDescription, DialogTitle } from "../../ui/dialog";
import { APP_CHECK_IN_QUESTION, AppUsageCountPicker } from "./AppUsageCountPicker";

/** '₩ 17,000'처럼 기호 뒤를 한 칸 띄운다(계산서와 같은 표기). */
function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/**
 * 앱에서 구독을 하나 등록한 직후, 같은 창에서 '이번 달 대략 몇 번 썼는지'를 묻는다.
 * 등록 폼에 칸을 늘리지 않고 저장 뒤 한 단계만 더 묻고, 언제든 건너뛸 수 있다.
 *
 * 입력은 앱의 다른 체크인과 같은 AppUsageCountPicker(0~10 단계 막대, 10보다 많으면 직접 입력)다.
 * 고른 횟수 그대로 체크인(checkIn)으로 저장한다. 막 가입했으면(최근에 가입했어요) 기록하지 않는다.
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

  const monthly = getMyMonthlyShareAmount(subscription);

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
        {APP_CHECK_IN_QUESTION}
      </DialogTitle>
      <DialogDescription className="mt-1 text-xs text-muted-foreground">
        가성비 계산서에 바로 들어가요. 나중에 고칠 수 있어요.
      </DialogDescription>

      <div className="mt-3">
        <AppUsageCountPicker subscription={subscription} value={count} onChange={setCount} />
      </div>

      <div className="mt-3 flex justify-center text-xs text-muted-foreground">
        <button type="button" onClick={() => onDone()} className="underline underline-offset-4">
          최근에 가입했어요
        </button>
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
