"use client";

import { getMyMonthlyAmountKRW, type Subscription } from "@subslash/shared";
import { useKillCelebration } from "@lib/kill-celebration";
import { useExchangeRate } from "./useExchangeRate";

/**
 * 해지를 기록한 곳이 부르는 축하. 해지하는 곳마다 같은 화면(`KillCelebration`)과 같은 셈(구독들의 월 내 몫 합계,
 * 지출·절약 수치와 같은 `getMyMonthlyAmountKRW`)을 쓰게 한 곳에 둔다.
 */
export function useCelebrateKill() {
  const rate = useExchangeRate();
  const celebrate = useKillCelebration((s) => s.celebrate);
  return (killed: Subscription | Subscription[]) => {
    const subs = Array.isArray(killed) ? killed : [killed];
    if (subs.length === 0) return;
    celebrate(
      subs.length,
      subs.reduce((sum, sub) => sum + getMyMonthlyAmountKRW(sub, rate), 0),
    );
  };
}
