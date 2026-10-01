import { useEffect, useRef } from "react";
import { realRecords, useStore } from "../lib/store";
import { isAnonymousStatsOpen, isStatsAgeBandOpen } from "../lib/privacy";
import { buildContribution } from "../lib/stats";
import {
  sendContribution,
  StatsLoginRequiredError,
  useStatsSharing,
  withdrawContribution,
} from "../lib/stats-client";

const DEBOUNCE_MS = 2000;

/**
 * 익명 통계에 참여한 기기에서, 구독 기록이 바뀌면 요약을 다시 보낸다. 헤더에 붙어 모든 화면에서
 * 돌고, 화면을 다시 그리지 않게 저장소를 직접 구독한다.
 *
 * 샘플 체험 중에도 실제 기록만 보낸다(realRecords). 보낸 요약이 전과 같으면 보내지 않는다.
 *
 * 로그인한 동안에만 보낸다. 로그인 여부는 기록의 주인(recordsOwner)으로 본다 — 서버가 답한 로그인
 * 상태로만 바뀌므로 네트워크 오류를 로그아웃으로 읽지 않는다. 로그인하지 않은 기기에 서버 기록이
 * 있으면(로그아웃했거나, 로그인 없이 참여하던 때 만든 기록) 지운다. 참여하겠다는 선택(enabled)은
 * 남겨 두어, 다시 로그인하면 새 기록으로 이어 보탠다.
 */
export function useStatsContribution() {
  const lastPayload = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const withdrawing = useRef(false);

  useEffect(() => {
    if (!isAnonymousStatsOpen()) return;

    const evaluate = () => {
      const sharing = useStatsSharing.getState();
      if (!sharing.enabled) {
        lastPayload.current = null;
        return;
      }
      const state = useStore.getState();
      if (state.recordsOwner === null) {
        if (timer.current) clearTimeout(timer.current);
        lastPayload.current = null;
        const token = sharing.token;
        if (token && !withdrawing.current) {
          withdrawing.current = true;
          withdrawContribution(token)
            .then(() => {
              // 지우는 사이 다시 로그인해 새 토큰을 받았으면 그 토큰은 두고 간다.
              if (useStatsSharing.getState().token === token) {
                useStatsSharing.getState().setToken(null);
              }
            })
            // 다음에 기록이나 참여 설정이 바뀔 때 다시 지운다.
            .catch((error) =>
              console.error("[stats] 로그아웃한 기기의 기록을 지우지 못했습니다", error),
            )
            .finally(() => {
              withdrawing.current = false;
            });
        }
        return;
      }
      const records = realRecords(state);
      const contribution = buildContribution(
        records.subscriptions,
        records.usageLogs,
        state.getExchangeRate(),
        new Date(),
        // 방침에 연령대를 게시하기 전에는 고른 연령대도 보내지 않는다.
        isStatsAgeBandOpen() ? sharing.ageBand : null,
      );
      const payload = JSON.stringify(contribution);
      if (payload === lastPayload.current && sharing.token) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        // 기다리는 사이 참여를 그만뒀거나 로그아웃했으면 보내지 않는다.
        if (!useStatsSharing.getState().enabled || useStore.getState().recordsOwner === null)
          return;
        try {
          const token = await sendContribution(useStatsSharing.getState().token, contribution);
          if (!useStatsSharing.getState().enabled) {
            // 보내는 사이 참여를 그만뒀다. 그만두기가 지운 뒤에 도착했으면 이 요청이 기록을 새로
            // 만들었을 수 있으니 한 번 더 지운다.
            await withdrawContribution(token).catch(() => undefined);
            return;
          }
          lastPayload.current = payload;
          useStatsSharing.getState().setToken(token);
          useStatsSharing.getState().markSent();
        } catch (error) {
          // 세션이 끝났다. 로그인하면 기록의 주인이 다시 정해지며 이어 보낸다.
          if (error instanceof StatsLoginRequiredError) return;
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
