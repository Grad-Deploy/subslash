"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { IS_APP_BUILD } from "@lib/platform";
import { ownerScopedKey, readOwnerScoped } from "@lib/owner-scoped";
import { realRecords, useStore } from "@lib/store";
import { planAllReminders } from "@lib/local-reminders";
import { checkReminderPermission, replaceScheduledReminders } from "@lib/native-reminders";

/**
 * 앱의 로컬 결제 알림 설정. 이 기기에만 해당하므로 구독 기록(스토어·백업·계정 동기화)에 넣지
 * 않고 따로 둔다.
 *
 * 기록 주인(비로그인·계정)마다 따로 둔다(lib/owner-scoped). 로그인해 켠 알림이 로그아웃한 뒤에도 켜진 것으로
 * 남아 '시작하기'가 로그인한 동안의 진행을 보였다. 알림은 그 주인의 구독으로만 걸리므로, 로그아웃하면
 * 비로그인의 설정으로 다시 걸고(꺼져 있으면 지운다), 다시 로그인하면 그 계정의 설정으로 돌아온다.
 */
export interface LocalReminderSettings {
  enabled: boolean;
  /** 결제일 며칠 전에 알릴지. 0이면 당일. */
  daysBefore: number;
}

export const REMINDER_DAY_CHOICES = [0, 1, 3, 7] as const;

const KEY = "subslash-local-reminders";
const EVENT = "subslash:local-reminders";
const DEFAULT_SETTINGS: LocalReminderSettings = { enabled: false, daysBefore: 3 };

let cachedRaw: string | null | undefined;
let cachedKey: string | undefined;
let cached: LocalReminderSettings = DEFAULT_SETTINGS;

function read(): LocalReminderSettings {
  let raw: string | null = null;
  const key = ownerScopedKey(KEY);
  try {
    raw = readOwnerScoped(localStorage, KEY);
  } catch {
    return DEFAULT_SETTINGS;
  }
  // useSyncExternalStore는 같은 값이면 같은 객체를 받아야 다시 그리지 않는다.
  if (raw === cachedRaw && key === cachedKey) return cached;
  cachedRaw = raw;
  cachedKey = key;
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<LocalReminderSettings>) : {};
    cached = {
      enabled: parsed.enabled === true,
      daysBefore: REMINDER_DAY_CHOICES.includes(parsed.daysBefore as 0 | 1 | 3 | 7)
        ? (parsed.daysBefore as number)
        : DEFAULT_SETTINGS.daysBefore,
    };
  } catch {
    cached = DEFAULT_SETTINGS;
  }
  return cached;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  // 로그인·로그아웃으로 기록 주인이 바뀌면 그 주인의 설정을 다시 읽는다.
  const unsubscribeOwner = useStore.subscribe((state, previous) => {
    if (state.recordsOwner !== previous.recordsOwner) onChange();
  });
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
    unsubscribeOwner();
  };
}

export function useLocalReminderSettings() {
  const settings = useSyncExternalStore(subscribe, read, () => DEFAULT_SETTINGS);
  const update = useCallback((next: Partial<LocalReminderSettings>) => {
    try {
      localStorage.setItem(ownerScopedKey(KEY), JSON.stringify({ ...read(), ...next }));
    } catch {}
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [settings, update] as const;
}

/** 지금 설정과 기록으로 걸 알림 목록. 화면에 개수를 보여줄 때도 쓴다. */
export function currentPlan(settings: LocalReminderSettings) {
  return planAllReminders(realRecords(useStore.getState()).subscriptions, settings.daysBefore);
}

const DEBOUNCE_MS = 1000;

/**
 * 켜 두었으면 구독이 바뀔 때마다 기기의 알림을 다시 건다. 앱에서만 돈다(NativeAppEffects).
 *
 * 체험 중이면 실제 기록으로 건다 — 샘플 구독의 결제 알림이 가면 안 된다. 권한이 없으면 걸지
 * 않는다(설정에서 권한을 끈 경우). 끄면 걸어 둔 알림을 지운다.
 */
export function useLocalReminderSync() {
  const [settings] = useLocalReminderSettings();

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSignature: string | null = null;

    const apply = async () => {
      try {
        if (!settings.enabled) {
          if (lastSignature !== "off") await replaceScheduledReminders([]);
          lastSignature = "off";
          return;
        }
        if ((await checkReminderPermission()) !== "granted") return;
        const plan = currentPlan(settings);
        const signature = JSON.stringify(plan.map((r) => [r.id, r.at.getTime(), r.body]));
        if (signature === lastSignature) return;
        await replaceScheduledReminders(plan);
        lastSignature = signature;
      } catch (error) {
        console.warn("[local-reminders] 알림을 다시 걸지 못했습니다", error);
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void apply(), DEBOUNCE_MS);
    };

    void apply();
    const unsubscribe = useStore.subscribe(schedule);
    // 앱으로 돌아올 때도 다시 건다. 설정에서 권한을 켜고 돌아온 경우, 날짜가 바뀐 경우.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastSignature = null;
        schedule();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
    };
  }, [settings]);
}
