import { useEffect, useRef } from "react";
import { DEFAULT_EXCHANGE_RATE } from "@subslash/shared";
import { realRecords, useStore } from "../lib/store";
import { isAnonymousStatsOpen } from "../lib/privacy";
import { buildContribution } from "../lib/stats";
import { sendContribution, useStatsSharing } from "../lib/stats-client";

const DEBOUNCE_MS = 2000;

/**
 * 익명 통계에 참여한 기기에서, 구독 기록이 바뀌면 요약을 다시 보낸다. 알림 미러(useMirrorSync)처럼
 * 헤더에 붙어 모든 화면에서 돌고, 화면을 다시 그리지 않게 저장소를 직접 구독한다.
 *
 * 샘플 체험 중에도 실제 기록만 보낸다(realRecords). 보낸 요약이 전과 같으면 보내지 않는다.
 */
export function useStatsContribution() {
  const lastPayload = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAnonymousStatsOpen()) return;

    const evaluate = () => {
      const sharing = useStatsSharing.getState();
      if (!sharing.enabled) {
        lastPayload.current = null;
        return;
      }
      const state = useStore.getState();
      const records = realRecords(state);
      const contribution = buildContribution(
        records.subscriptions,
        records.usageLogs,
        state.exchangeRate.rate ?? DEFAULT_EXCHANGE_RATE,
      );
      const payload = JSON.stringify(contribution);
      if (payload === lastPayload.current && sharing.token) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        // 기다리는 사이 참여를 그만뒀으면 보내지 않는다.
        if (!useStatsSharing.getState().enabled) return;
        try {
          const token = await sendContribution(useStatsSharing.getState().token, contribution);
          lastPayload.current = payload;
          useStatsSharing.getState().setToken(token);
          useStatsSharing.getState().markSent();
        } catch (error) {
          // 통계는 급하지 않다. 다음에 기록이 바뀔 때 다시 보낸다.
          console.error("[stats] 요약을 보내지 못했습니다", error);
        }
      }, DEBOUNCE_MS);
    };

    evaluate();
    const offRecords = useStore.subscribe(evaluate);
    const offSharing = useStatsSharing.subscribe(evaluate);
    return () => {
      offRecords();
      offSharing();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
}
