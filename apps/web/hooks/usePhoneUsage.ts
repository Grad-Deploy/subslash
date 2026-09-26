"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  EMPTY_HISTORY,
  daysToQuery,
  mergeUsage,
  parseHistory,
  type UsageHistory,
} from "@lib/usage/history";
import {
  installedPackages,
  isUsageGranted,
  isUsageSupported,
  openUsageSettings,
  queryUsage,
} from "@lib/usage/native";
import { ALL_USAGE_PACKAGES } from "@lib/usage/packages";
import {
  HISTORY_KEY,
  SNOOZE_KEY,
  readDeviceValue,
  readSnooze,
  writeDeviceValue,
  type SnoozeMap,
} from "@lib/usage/storage";

export type PhoneUsageStatus =
  /** 아직 확인 중 */
  | "loading"
  /** 웹·iOS — 폰 기록을 쓰지 않는다 */
  | "unsupported"
  /** 안드로이드 앱이지만 '사용 기록 액세스'가 꺼져 있다 */
  | "off"
  | "on";

interface PhoneUsageState {
  status: PhoneUsageStatus;
  history: UsageHistory;
  /** 연결표의 앱 중 이 폰에 설치된 것. 모르면 null. */
  installed: string[] | null;
  snooze: SnoozeMap;
  refreshing: boolean;
  lastCheckedAt: number;
  refresh: (force?: boolean) => Promise<void>;
  snoozeUntil: (subscriptionId: string, until: string) => void;
}

let started = false;
let historyLoaded = false;

/**
 * 폰 사용 기록(안드로이드). 화면 여러 곳(리포트·구독 상세·체크인·대시보드)이 같은 기록을 본다.
 *
 * 기록은 앱을 열 때와 앱으로 돌아올 때 읽는다 — 설정에서 '사용 기록 액세스'를 켜고 돌아오면
 * 곧바로 켜진 것으로 바뀐다. 읽은 결과는 날짜별로 기기에 쌓는다(lib/usage/history).
 */
export const usePhoneUsageStore = create<PhoneUsageState>((set, get) => ({
  status: "loading",
  history: EMPTY_HISTORY,
  installed: null,
  snooze: {},
  refreshing: false,
  lastCheckedAt: 0,

  refresh: async (force = false) => {
    const state = get();
    if (state.refreshing) return;
    // 화면 전환마다 다시 읽지 않는다. 꺼져 있으면 설정에서 돌아온 것일 수 있어 늘 다시 본다.
    if (!force && state.status === "on" && Date.now() - state.lastCheckedAt < 60_000) return;
    set({ refreshing: true });
    try {
      if (!(await isUsageSupported())) {
        set({ status: "unsupported" });
        return;
      }
      let history = get().history;
      if (!historyLoaded) {
        history = parseHistory(await readDeviceValue(HISTORY_KEY));
        historyLoaded = true;
        set({ history, snooze: readSnooze() });
      }
      if (!(await isUsageGranted())) {
        set({ status: "off" });
        return;
      }
      const now = new Date();
      const days = daysToQuery(history, now);
      const [result, installed] = await Promise.all([
        queryUsage(ALL_USAGE_PACKAGES, days),
        installedPackages(ALL_USAGE_PACKAGES),
      ]);
      if (result) {
        history = mergeUsage(history, result, days, now);
        writeDeviceValue(HISTORY_KEY, JSON.stringify(history));
      }
      set({ status: "on", history, installed, lastCheckedAt: Date.now() });
    } catch (error) {
      // 읽다가 실패해도 '확인 중'에 머물지 않게 한다 — 그러면 연결 버튼조차 뜨지 않는다.
      console.warn("[usage] 폰 사용 기록을 확인하지 못했습니다", error);
      if (get().status === "loading") set({ status: "off" });
    } finally {
      set({ refreshing: false });
    }
  },

  snoozeUntil: (subscriptionId, until) => {
    const snooze = { ...get().snooze, [subscriptionId]: until };
    writeDeviceValue(SNOOZE_KEY, JSON.stringify(snooze));
    set({ snooze });
  },
}));

/** 폰 기록을 쓰는 화면에서 부른다. 처음 한 번 읽고, 앱으로 돌아올 때마다 다시 확인한다. */
export function usePhoneUsage(): PhoneUsageState {
  const state = usePhoneUsageStore();
  useEffect(() => {
    startPhoneUsage();
  }, []);
  return state;
}

/** 처음 한 번 읽고, 앱으로 돌아올 때마다 다시 확인하게 건다. 여러 번 불러도 한 번만 건다. */
export function startPhoneUsage(): void {
  if (started) return;
  started = true;
  void usePhoneUsageStore.getState().refresh(true);
  const onVisible = () => {
    if (document.visibilityState === "visible") void usePhoneUsageStore.getState().refresh();
  };
  document.addEventListener("visibilitychange", onVisible);
  // Capacitor는 앱이 앞으로 돌아올 때 document에 'resume'도 보낸다. 웹뷰에 따라 visibilitychange가
  // 늦거나 오지 않아도 설정에서 돌아온 것을 알아채게 둘 다 듣는다(60초 안의 중복은 refresh가 거른다).
  document.addEventListener("resume", onVisible);
}

/** 설정 화면을 연다. 돌아오면 visibilitychange가 다시 확인한다. */
export function openPhoneUsageSettings(): Promise<boolean> {
  return openUsageSettings();
}
