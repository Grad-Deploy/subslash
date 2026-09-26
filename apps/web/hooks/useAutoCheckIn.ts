"use client";

import { useEffect } from "react";
import { useStore } from "@lib/store";
import { IS_APP_BUILD } from "@lib/platform";
import { planAutoCheckIns } from "@lib/usage/auto-checkin";
import { readAutoCheckIn } from "@lib/usage/storage";
import { startPhoneUsage, usePhoneUsageStore } from "@hooks/usePhoneUsage";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useAccountSyncRound } from "@hooks/useAccountSync";

/**
 * 폰 사용 기록으로 체크인을 자동으로 적는다(안드로이드 앱). 헤더에 붙어 앱을 열 때와 돌아올 때 폰
 * 기록이 새로 읽히면 돈다. 무엇을 적을지는 planAutoCheckIns가 정한다 — 30일을 온전히 덮고, 이 폰에서
 * 한 번 이상 열었을 때만.
 *
 * 샘플 체험 중에는 적지 않는다. 체험 중 화면의 목록은 샘플이라, 적으면 샘플에 체크인이 쌓인다.
 *
 * 로그인해 자동 동기화를 켠 기기는 이번에 앱을 연 뒤 계정과 한 번 맞춘 다음에 적는다. 받아 오기 전에
 * 적으면 다른 기기가 올린 기록과 '양쪽이 따로 바뀜'이 되어, 사용자가 한 적 없는 변경 때문에 어느 쪽을
 * 쓸지 묻게 된다.
 */
export function useAutoCheckIn() {
  const rate = useExchangeRate();
  const status = usePhoneUsageStore((state) => state.status);
  const history = usePhoneUsageStore((state) => state.history);
  const installed = usePhoneUsageStore((state) => state.installed);
  const syncSettledAt = useAccountSyncRound((state) => state.settledAt);

  useEffect(() => {
    if (IS_APP_BUILD) startPhoneUsage();
  }, []);

  useEffect(() => {
    if (!IS_APP_BUILD || status !== "on" || !readAutoCheckIn()) return;
    const store = useStore.getState();
    if (store.demo) return;
    const waitsForSync = store.recordsOwner !== null && store.accountSync.enabled;
    if (waitsForSync && syncSettledAt === null) return;
    const plans = planAutoCheckIns(
      store.subscriptions,
      store.usageLogs,
      history,
      installed,
      new Date(),
      rate,
    );
    for (const plan of plans) {
      try {
        store.checkIn(plan.subscriptionId, plan.opens, {
          source: "phone",
          replaceLogId: plan.replaceLogId,
        });
      } catch (error) {
        // 그사이 구독이 지워졌다. 다음 번에 다시 계획한다.
        console.warn("[usage] 자동 체크인을 적지 못했습니다", error);
      }
    }
  }, [status, history, installed, rate, syncSettledAt]);
}
