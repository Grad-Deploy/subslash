/**
 * 폰 사용 기록과 알림 미루기는 **이 기기의 것**이다. 구독 기록 저장소·백업·계정 동기화·익명 통계에
 * 넣지 않고 서버로 보내지 않는다(개인정보처리방침의 '기기에서만 읽는다').
 *
 * 앱에서는 localStorage에 쓰면서 기기 저장소(Preferences)에도 사본을 적고, localStorage가
 * 비었으면 사본으로 되살린다(lib/mirrored-storage와 같은 이유 — 운영체제가 웹뷰 저장소를 비우면
 * 1년 동안 쌓은 기록이 사라진다).
 */
import { IS_APP_BUILD } from "../platform";

export const HISTORY_KEY = "subslash-phone-usage";
export const SNOOZE_KEY = "subslash-usage-snooze";
export const CONNECT_DISMISSED_KEY = "subslash-usage-connect-dismissed";

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

type PreferencesPlugin = typeof import("@capacitor/preferences").Preferences;

// 플러그인 프록시는 { prefs }로 감싸서 넘긴다. 프록시를 async 함수가 그대로 돌려주면 Promise가 그것을
// thenable로 여겨 네이티브 'then'을 부르고 끝나지 않는다(lib/usage/native.ts와 같은 이유).
async function preferences(): Promise<{ prefs: PreferencesPlugin } | null> {
  if (!IS_APP_BUILD) return null;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    return { prefs: Preferences };
  } catch {
    return null;
  }
}

export async function readDeviceValue(key: string): Promise<string | null> {
  const local = readLocal(key);
  if (local !== null) return local;
  const prefs = (await preferences())?.prefs;
  if (!prefs) return null;
  try {
    const { value } = await prefs.get({ key });
    if (value !== null) {
      try {
        localStorage.setItem(key, value);
      } catch {
        // 되살리지 못해도 이번에는 사본 값을 쓴다
      }
    }
    return value;
  } catch {
    return null;
  }
}

export function writeDeviceValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장소가 막혀도 화면은 이번 값으로 그린다
  }
  void preferences().then((loaded) =>
    loaded?.prefs
      .set({ key, value })
      .catch((error: unknown) =>
        console.warn("[usage] 기기 저장소에 사본을 적지 못했습니다", error),
      ),
  );
}

/** 구독 id → 이 날(YYYY-MM-DD)까지 묻지 않는다. */
export type SnoozeMap = Record<string, string>;

export function readSnooze(): SnoozeMap {
  try {
    const parsed = JSON.parse(readLocal(SNOOZE_KEY) ?? "{}") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as SnoozeMap) : {};
  } catch {
    return {};
  }
}

export const AUTO_CHECKIN_KEY = "subslash-usage-auto-checkin";

/**
 * 폰 기록으로 자동 체크인할지. 기기마다 다르다(폰 기록이 이 기기의 것이라). 켜 두는 것이 기본이다 —
 * '사용 기록 액세스'를 허용한 것이 이미 폰 기록을 쓰겠다는 뜻이고, 적는 숫자는 기기 안의 체크인
 * 기록에만 들어간다.
 */
export function readAutoCheckIn(): boolean {
  return readLocal(AUTO_CHECKIN_KEY) !== "off";
}

export function writeAutoCheckIn(on: boolean): void {
  writeDeviceValue(AUTO_CHECKIN_KEY, on ? "on" : "off");
}
