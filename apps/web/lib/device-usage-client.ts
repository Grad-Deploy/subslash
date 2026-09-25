import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiFetch } from "./api";
import { IS_APP_BUILD } from "./platform";
import {
  ANDROID_PACKAGES,
  USAGE_RETENTION_DAYS,
  serviceIdForPackage,
  type UsageUpload,
} from "./device-usage";
import type { DeviceUsageView } from "./device-usage-server";

/**
 * 기기 간 사용 측정의 기기 쪽. 켜짐 여부·기기 키·마지막으로 올린 시각은 **이 기기**의 것이라 구독 기록
 * 저장소·백업·계정 동기화에 넣지 않는다(익명 통계·로컬 알림 설정과 같다). 기기 키는 계정 안에서 이
 * 기기를 가리키는 무작위 값일 뿐이고, 잃으면 새 기기로 올라간다(옛 기기는 보관 기간이 지나면 지워진다).
 */
interface DeviceUsageState {
  enabled: boolean;
  deviceKey: string | null;
  /** 서버에 올린 마지막 기간의 끝(epoch ms). 다음에는 여기서부터 잰다. */
  uploadedUntil: number | null;
  setEnabled: (enabled: boolean) => void;
  ensureDeviceKey: () => string;
  markUploaded: (until: number | null) => void;
}

export const useDeviceUsage = create<DeviceUsageState>()(
  persist(
    (set, get) => ({
      enabled: false,
      deviceKey: null,
      uploadedUntil: null,
      setEnabled: (enabled) => set({ enabled }),
      ensureDeviceKey: () => {
        const existing = get().deviceKey;
        if (existing) return existing;
        const deviceKey = crypto.randomUUID();
        set({ deviceKey });
        return deviceKey;
      },
      markUploaded: (uploadedUntil) => set({ uploadedUntil }),
    }),
    {
      name: "subslash-device-usage",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ enabled, deviceKey, uploadedUntil }) => ({
        enabled,
        deviceKey,
        uploadedUntil,
      }),
    },
  ),
);

interface DeviceUsagePlugin {
  hasAccess(): Promise<{ granted: boolean }>;
  openAccessSettings(): Promise<void>;
  queryForeground(options: { from: number; to: number; packages: string[] }): Promise<{
    intervals: { packageName: string; start: number; end: number }[];
    firstEventAt: number | null;
  }>;
}

let plugin: DeviceUsagePlugin | null = null;

/**
 * 네이티브 플러그인. 안드로이드 앱에서만 있다 — iOS는 다른 앱의 사용 시간을 앱 밖으로 내주지 않고
 * (Screen Time 보고서는 화면에 그리기만 한다), 웹은 다른 앱을 볼 수 없다.
 */
async function loadPlugin(): Promise<DeviceUsagePlugin | null> {
  if (!IS_APP_BUILD) return null;
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  if (Capacitor.getPlatform() !== "android") return null;
  plugin ??= registerPlugin<DeviceUsagePlugin>("DeviceUsage");
  return plugin;
}

/** 이 기기에서 잴 수 있는지(안드로이드 앱). 화면이 측정 켜기를 보여 줄지 정한다. */
export async function canMeasureOnThisDevice(): Promise<boolean> {
  return (await loadPlugin()) !== null;
}

export async function hasUsageAccess(): Promise<boolean> {
  const native = await loadPlugin();
  return native ? (await native.hasAccess()).granted : false;
}

export async function openUsageAccessSettings(): Promise<void> {
  await (await loadPlugin())?.openAccessSettings();
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 운영체제가 남긴 사용 이벤트를 읽어 한 번의 업로드로 만든다. 지난번 끝에서 이어 재되, 너무 오래
 * 쉬었으면 보관 기간 안에서만 잰다. 운영체제가 그보다 짧게 남겼으면(firstEventAt) 거기서부터가 잰
 * 기간이다 — 비어 있는 앞부분을 '안 썼다'로 올리지 않는다.
 */
export async function collectUpload(now: number = Date.now()): Promise<UsageUpload | null> {
  const native = await loadPlugin();
  if (!native || !(await native.hasAccess()).granted) return null;
  const state = useDeviceUsage.getState();
  const earliest = now - (USAGE_RETENTION_DAYS - 1) * DAY_MS;
  let from = Math.max(state.uploadedUntil ?? earliest, earliest);
  if (from >= now) return null;

  const { intervals, firstEventAt } = await native.queryForeground({
    from,
    to: now,
    packages: Object.values(ANDROID_PACKAGES).flat(),
  });
  if (firstEventAt !== null && firstEventAt > from) from = firstEventAt;

  return {
    deviceKey: state.ensureDeviceKey(),
    platform: "android",
    label: null,
    from,
    until: now,
    intervals: intervals.flatMap((interval) => {
      const serviceId = serviceIdForPackage(interval.packageName);
      if (!serviceId) return [];
      const start = Math.max(interval.start, from);
      return interval.end > start ? [{ serviceId, start, end: interval.end }] : [];
    }),
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/** 이 기기가 잰 것을 계정에 올린다. 잴 수 없거나 꺼져 있으면 아무것도 하지 않고 false. */
export async function uploadThisDevice(): Promise<boolean> {
  if (!useDeviceUsage.getState().enabled) return false;
  const upload = await collectUpload();
  if (!upload) return false;
  const response = await apiFetch("/api/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upload),
  });
  if (!response.ok) throw new Error(await readError(response, "사용 기록을 올리지 못했습니다."));
  useDeviceUsage.getState().markUploaded(upload.until);
  return true;
}

/** 계정의 모든 기기를 모아 센 최근 `days`일. */
export async function fetchDeviceUsage(days = 30): Promise<DeviceUsageView> {
  const response = await apiFetch(`/api/usage?days=${days}`);
  if (!response.ok) throw new Error(await readError(response, "사용 기록을 읽지 못했습니다."));
  return (await response.json()) as DeviceUsageView;
}

/** 이 기기의 측정을 끄고 서버에 올린 이 기기 기록을 지운다. */
export async function stopMeasuringThisDevice(): Promise<void> {
  const { deviceKey } = useDeviceUsage.getState();
  if (deviceKey) {
    const response = await apiFetch("/api/usage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceKey }),
    });
    if (!response.ok) throw new Error(await readError(response, "사용 기록을 지우지 못했습니다."));
  }
  useDeviceUsage.setState({ enabled: false, uploadedUntil: null });
}
