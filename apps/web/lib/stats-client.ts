import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiUrl } from "./api";
import type { StatsContribution, StatsSummary } from "./stats";

/**
 * 익명 구독 통계의 브라우저 쪽. 참여 여부와 토큰은 **이 기기**의 것이라 구독 기록 저장소·백업·계정
 * 동기화에 넣지 않는다(알림 설정과 같다). 토큰을 잃어도 새로 참여하면 되고, 예전 기록은 보관 기간이
 * 지나면 서버에서 지워진다.
 */
interface StatsSharingState {
  enabled: boolean;
  token: string | null;
  lastSentAt: string | null;
  setEnabled: (enabled: boolean) => void;
  setToken: (token: string | null) => void;
  markSent: () => void;
}

export const useStatsSharing = create<StatsSharingState>()(
  persist(
    (set) => ({
      enabled: false,
      token: null,
      lastSentAt: null,
      setEnabled: (enabled) => set({ enabled }),
      setToken: (token) => set({ token }),
      markSent: () => set({ lastSentAt: new Date().toISOString() }),
    }),
    {
      name: "subslash-stats-sharing",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ enabled, token, lastSentAt }) => ({ enabled, token, lastSentAt }),
    },
  ),
);

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/** 요약을 보낸다. 새 참여자면 서버가 만든 토큰을, 기존 참여자면 그 토큰을 돌려준다. */
export async function sendContribution(
  token: string | null,
  contribution: StatsContribution,
): Promise<string> {
  const response = await fetch(apiUrl("/api/stats/contribution"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(contribution),
  });
  // 서버에서 기록이 지워졌다. 토큰 없이 새로 참여한다.
  if (response.status === 401 && token) return sendContribution(null, contribution);
  if (!response.ok) throw new Error(await readError(response, "통계에 보내지 못했습니다."));
  if (token) return token;
  return ((await response.json()) as { token: string }).token;
}

/** 참여를 그만두고 서버의 기록을 지운다. */
export async function withdrawContribution(token: string): Promise<void> {
  const response = await fetch(apiUrl("/api/stats/contribution"), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readError(response, "기록을 지우지 못했습니다."));
  }
}

export async function fetchStatsSummary(): Promise<StatsSummary> {
  const response = await fetch(apiUrl("/api/stats/summary"));
  if (!response.ok) throw new Error(await readError(response, "통계를 읽지 못했습니다."));
  return (await response.json()) as StatsSummary;
}
