import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiFetch, apiUrl, readApiError } from "./api";
import type { AgeBand, StatsContribution, StatsSummary } from "./stats";

/**
 * 익명 구독 통계의 브라우저 쪽. 참여 여부와 토큰은 **이 기기**의 것이라 구독 기록 저장소·백업·계정
 * 동기화에 넣지 않는다(알림 설정과 같다). 토큰을 잃어도 새로 참여하면 되고, 예전 기록은 보관 기간이
 * 지나면 서버에서 지워진다.
 */
interface StatsSharingState {
  enabled: boolean;
  token: string | null;
  lastSentAt: string | null;
  /**
   * 고른 연령대. 기기에만 둔다 — 서버로는 연령대를 받기 시작한 뒤(isStatsAgeBandOpen)에, 참여한 기기의
   * 요약에 실어서만 보낸다.
   */
  ageBand: AgeBand | null;
  setEnabled: (enabled: boolean) => void;
  setAgeBand: (ageBand: AgeBand | null) => void;
  setToken: (token: string | null) => void;
  markSent: () => void;
}

export const useStatsSharing = create<StatsSharingState>()(
  persist(
    (set) => ({
      enabled: false,
      token: null,
      lastSentAt: null,
      ageBand: null,
      setEnabled: (enabled) => set({ enabled }),
      setAgeBand: (ageBand) => set({ ageBand }),
      setToken: (token) => set({ token }),
      markSent: () => set({ lastSentAt: new Date().toISOString() }),
    }),
    {
      name: "subslash-stats-sharing",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ enabled, token, lastSentAt, ageBand }) => ({
        enabled,
        token,
        lastSentAt,
        ageBand,
      }),
    },
  ),
);

/** 로그인하지 않아 서버가 요약을 받지 않았다. */
export class StatsLoginRequiredError extends Error {}

/**
 * 요약을 보낸다. 새 참여자면 서버가 만든 토큰을, 기존 참여자면 그 토큰을 돌려준다. 로그인한 사람만
 * 보낼 수 있어 세션을 싣는 apiFetch로 보내고, 통계 토큰은 `X-Stats-Token`에 싣는다(앱은
 * `Authorization`에 세션 토큰을 싣는다).
 */
export async function sendContribution(
  token: string | null,
  contribution: StatsContribution,
): Promise<string> {
  const response = await apiFetch("/api/stats/contribution", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Stats-Token": token } : {}),
    },
    body: JSON.stringify(contribution),
  });
  // 서버에서 기록이 지워졌다. 토큰 없이 새로 참여한다.
  if (response.status === 401 && token) return sendContribution(null, contribution);
  if (response.status === 403) {
    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as { code?: string } | null;
    if (body?.code === "login-required") {
      throw new StatsLoginRequiredError("로그인해야 통계에 참여할 수 있습니다.");
    }
  }
  if (!response.ok) throw new Error(await readApiError(response, "통계에 보내지 못했습니다."));
  if (token) return token;
  return ((await response.json()) as { token: string }).token;
}

/** 참여를 그만두고 서버의 기록을 지운다. 로그인하지 않아도 지울 수 있다. */
export async function withdrawContribution(token: string): Promise<void> {
  const response = await fetch(apiUrl("/api/stats/contribution"), {
    method: "DELETE",
    headers: { "X-Stats-Token": token },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readApiError(response, "기록을 지우지 못했습니다."));
  }
}

export async function fetchStatsSummary(): Promise<StatsSummary> {
  const response = await fetch(apiUrl("/api/stats/summary"));
  if (!response.ok) throw new Error(await readApiError(response, "통계를 읽지 못했습니다."));
  return (await response.json()) as StatsSummary;
}
