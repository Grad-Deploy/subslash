import { create } from "zustand";

/**
 * 해지를 기록했을 때 뜨는 축하 화면(`KillCelebration`)의 상태. 해지는 대시보드·내 구독·구독 상세·체크인
 * 여러 곳에서 하고, 체크인은 해지하자마자 다른 화면(/savings)으로 옮기므로 축하 화면은 페이지가 아니라
 * 레이아웃에 한 번 두고(`KillCelebrationHost`) 어디서든 이 상태로 띄운다. 기록과 섞지 않는다(저장하지 않음).
 */
type KillCelebrationState = {
  /** `id`는 띄울 때마다 바뀐다 — 연달아 띄우면 화면을 처음부터 다시 그린다. */
  celebration: { id: number; count: number; monthlyKRW: number } | null;
  /** 이번에 해지한 구독 수와 그 구독들의 월 내 몫 합계로 축하 화면을 띄운다. */
  celebrate: (count: number, monthlyKRW: number) => void;
  dismiss: () => void;
};

let nextId = 0;

export const useKillCelebration = create<KillCelebrationState>()((set) => ({
  celebration: null,
  celebrate: (count, monthlyKRW) => set({ celebration: { id: ++nextId, count, monthlyKRW } }),
  dismiss: () => set({ celebration: null }),
}));
