import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiFetch, readApiError } from "./api";
import {
  isUsageGranted,
  isUsageSupported,
  openUsageSettings,
  queryForeground,
} from "./usage/native";
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
 *
 * 켠 계정(`accountId`)을 함께 적는다. 켜짐만 기억하면, 같은 기기에 다른 사람이 로그인했을 때 그
 * 사람은 켠 적이 없는데 이 기기의 사용이 그 계정으로 올라간다.
 */
interface DeviceUsageState {
  enabled: boolean;
  /** 측정을 켠 계정. 지금 로그인한 계정과 다르면 올리지 않는다. */
  accountId: string | null;
  deviceKey: string | null;
  /** 서버에 올린 마지막 기간의 끝(epoch ms). 다음에는 여기서부터 잰다. */
  uploadedUntil: number | null;
  /** 이 계정으로 측정을 켠다. 다른 계정이 켜 두었던 것이면 처음부터 잰다. */
  enableFor: (accountId: string) => void;
  ensureDeviceKey: () => string;
  markUploaded: (until: number | null) => void;
}

export const useDeviceUsage = create<DeviceUsageState>()(
  persist(
    (set, get) => ({
      enabled: false,
      accountId: null,
      deviceKey: null,
      uploadedUntil: null,
      enableFor: (accountId) =>
        set((state) => ({
          enabled: true,
          accountId,
          uploadedUntil: state.accountId === accountId ? state.uploadedUntil : null,
        })),
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
      partialize: ({ enabled, accountId, deviceKey, uploadedUntil }) => ({
        enabled,
        accountId,
        deviceKey,
        uploadedUntil,
      }),
    },
  ),
);

/** 이 기기가 지금 로그인한 계정으로 재고 있는지. */
export function isMeasuringFor(
  state: Pick<DeviceUsageState, "enabled" | "accountId">,
  accountId: string | null,
): boolean {
  return Boolean(accountId) && state.enabled && state.accountId === accountId;
}

/**
 * 잴 수 있는 곳은 안드로이드 앱뿐이다 — iOS는 다른 앱의 사용 시간을 앱 밖으로 내주지 않고(Screen Time
 * 보고서는 화면에 그리기만 한다), 웹은 다른 앱을 볼 수 없다. 네이티브는 폰 사용 기록과 같은
 * 플러그인(lib/usage/native, UsageStatsPlugin)을 쓴다.
 */
export async function canMeasureOnThisDevice(): Promise<boolean> {
  return isUsageSupported();
}

export async function hasUsageAccess(): Promise<boolean> {
  return isUsageGranted();
}

export async function openUsageAccessSettings(): Promise<void> {
  if (!(await openUsageSettings())) throw new Error("사용 정보 접근 설정을 열지 못했습니다.");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 운영체제가 남긴 사용 이벤트를 읽어 한 번의 업로드로 만든다. 지난번 끝에서 이어 재되, 너무 오래
 * 쉬었으면 보관 기간 안에서만 잰다. 운영체제가 그보다 짧게 남겼으면(firstEventAt) 거기서부터가 잰
 * 기간이다 — 비어 있는 앞부분을 '안 썼다'로 올리지 않는다.
 */
export async function collectUpload(now: number = Date.now()): Promise<UsageUpload | null> {
  if (!(await isUsageGranted())) return null;
  const state = useDeviceUsage.getState();
  const earliest = now - (USAGE_RETENTION_DAYS - 1) * DAY_MS;
  let from = Math.max(state.uploadedUntil ?? earliest, earliest);
  if (from >= now) return null;

  const result = await queryForeground(Object.values(ANDROID_PACKAGES).flat(), from, now);
  // 읽지 못했으면 올리지 않는다. 빈 구간으로 올리면 그 기간을 '안 썼다'로 적는다.
  if (!result) return null;
  const { intervals, firstEventAt } = result;
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

/**
 * 이 기기가 잰 것을 `accountId` 계정에 올린다. 그 계정으로 켜 두지 않았거나 잴 수 없으면 아무것도
 * 하지 않고 false.
 */
export async function uploadThisDevice(accountId: string): Promise<boolean> {
  if (!isMeasuringFor(useDeviceUsage.getState(), accountId)) return false;
  const upload = await collectUpload();
  if (!upload) return false;
  const response = await apiFetch("/api/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(upload),
  });
  if (!response.ok) throw new Error(await readApiError(response, "사용 기록을 올리지 못했습니다."));
  // 올리는 사이 측정을 껐거나 계정이 바뀌었으면 이어 잴 자리를 적지 않는다.
  if (isMeasuringFor(useDeviceUsage.getState(), accountId)) {
    useDeviceUsage.getState().markUploaded(upload.until);
  }
  return true;
}

/** 계정의 모든 기기를 모아 센 최근 `days`일. */
export async function fetchDeviceUsage(days = 30): Promise<DeviceUsageView> {
  const response = await apiFetch(`/api/usage?days=${days}`);
  if (!response.ok) throw new Error(await readApiError(response, "사용 기록을 읽지 못했습니다."));
  return (await response.json()) as DeviceUsageView;
}

async function deleteOnServer(body: { deviceKey: string } | { all: true }): Promise<void> {
  const response = await apiFetch("/api/usage", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readApiError(response, "사용 기록을 지우지 못했습니다."));
}

/**
 * 이 기기의 측정을 끄고 서버에 올린 이 기기 기록을 지운다. 지우는 사이 올리지 않도록 먼저 끄고,
 * 지우지 못하면 되돌린다(익명 통계의 참여 그만두기와 같다).
 */
export async function stopMeasuringThisDevice(): Promise<void> {
  const before = useDeviceUsage.getState();
  const { deviceKey, accountId } = before;
  useDeviceUsage.setState({ enabled: false, uploadedUntil: null });
  try {
    if (deviceKey) await deleteOnServer({ deviceKey });
    useDeviceUsage.setState({ accountId: null });
  } catch (error) {
    useDeviceUsage.setState({
      enabled: before.enabled,
      accountId,
      uploadedUntil: before.uploadedUntil,
    });
    throw error;
  }
}

/** 로그인한 계정의 모든 기기 기록을 지운다. 이 기기가 이 계정으로 재고 있었으면 함께 끈다. */
export async function deleteAllDeviceUsage(accountId: string): Promise<void> {
  const before = useDeviceUsage.getState();
  const wasMeasuring = isMeasuringFor(before, accountId);
  if (wasMeasuring) useDeviceUsage.setState({ enabled: false, uploadedUntil: null });
  try {
    await deleteOnServer({ all: true });
    if (wasMeasuring) useDeviceUsage.setState({ accountId: null });
  } catch (error) {
    if (wasMeasuring) {
      useDeviceUsage.setState({ enabled: true, uploadedUntil: before.uploadedUntil });
    }
    throw error;
  }
}

/** 화면에서 쓰는 조회 결과를 다시 받을 간격. 기기가 올리는 간격(useDeviceUsageUpload)과 맞춘다. */
export const VIEW_STALE_MS = 5 * 60 * 1000;

/**
 * 계정의 기기 간 사용 조회 결과. 리포트·구독 상세·설정이 함께 쓰므로 한 곳에 둔다. 저장하지 않는다 —
 * 서버가 원본이고, 로그아웃한 기기에 다른 계정의 결과가 남으면 안 된다.
 */
interface DeviceUsageViewState {
  accountId: string | null;
  view: DeviceUsageView | null;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
}

export const useDeviceUsageView = create<DeviceUsageViewState>()(() => ({
  accountId: null,
  view: null,
  fetchedAt: null,
  loading: false,
  error: null,
}));

let inFlight: { accountId: string; promise: Promise<void> } | null = null;

/** 조회 결과를 새로 받는다. 받은 지 오래되지 않았으면 `force`가 아닐 때 건너뛴다. */
export function refreshDeviceUsageView(
  accountId: string,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  const current = useDeviceUsageView.getState();
  if (current.accountId !== accountId) {
    // 다른 계정의 결과를 잠깐이라도 보여 주지 않는다.
    useDeviceUsageView.setState({ accountId, view: null, fetchedAt: null, error: null });
  } else if (
    !force &&
    current.fetchedAt !== null &&
    Date.now() - current.fetchedAt < VIEW_STALE_MS
  ) {
    return Promise.resolve();
  }
  if (inFlight?.accountId === accountId && !force) return inFlight.promise;

  useDeviceUsageView.setState({ loading: true });
  const promise = fetchDeviceUsage(30)
    .then((view) => {
      if (useDeviceUsageView.getState().accountId !== accountId) return;
      useDeviceUsageView.setState({ view, fetchedAt: Date.now(), loading: false, error: null });
    })
    .catch((error: unknown) => {
      if (useDeviceUsageView.getState().accountId !== accountId) return;
      useDeviceUsageView.setState({
        loading: false,
        error: error instanceof Error ? error.message : "사용 기록을 읽지 못했습니다.",
      });
    })
    .finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
  inFlight = { accountId, promise };
  return promise;
}
