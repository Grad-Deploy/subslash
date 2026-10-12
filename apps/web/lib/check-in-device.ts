import type { CheckInDevice } from "@subslash/shared";
import { IS_APP_BUILD } from "./platform";

/**
 * 체크인한 기기(`UsageLog.device`). 로그인한 기기끼리 기록을 맞추면 여러 기기의 체크인이 한 목록에 섞여, 어디서 센
 * 숫자인지 알아볼 수 있게 남긴다.
 *
 * 기기를 알아보는 값은 남기지 않는다. 종류(앱·웹, 운영체제, 휴대폰인지)는 브라우저가 알려 주는 것만 쓰고, `id`는 이
 * 브라우저·앱 설치마다 처음 한 번 만든 무작위 값이다 — 같은 기기인지만 견줄 수 있다. 안드로이드의 기기 식별값
 * (`ANDROID_ID`)을 쓰는 여러 기기 측정과 달리 계정과 섞지도 않는다. 이 값은 기기의 것이라 구독 기록 저장소·백업에
 * 따로 넣지 않는다(체크인 줄에 적힌 것만 기록과 함께 간다).
 */
export const DEVICE_ID_KEY = "subslash-device-id";

/** 저장소를 쓸 수 없을 때(사생활 보호 모드 등) 이 실행 동안 쓰는 값. */
let sessionId: string | null = null;

function deviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    sessionId ??= crypto.randomUUID();
    return sessionId;
  }
}

interface UserAgentData {
  platform?: string;
  mobile?: boolean;
}

/** 브라우저가 알려 주는 운영체제·휴대폰 여부. 알아보지 못하면 `other`. */
export function detectDevice(
  userAgent: string,
  hints?: UserAgentData,
): Pick<CheckInDevice, "os" | "mobile"> {
  const platform = (hints?.platform ?? "").toLowerCase();
  const ua = userAgent;
  const os: CheckInDevice["os"] =
    platform === "android" || /Android/i.test(ua)
      ? "android"
      : platform === "ios" || /iPhone|iPad|iPod/i.test(ua)
        ? "ios"
        : platform === "chrome os" || platform === "chromeos" || /CrOS/i.test(ua)
          ? "chromeos"
          : platform === "windows" || /Windows/i.test(ua)
            ? "windows"
            : platform === "macos" || /Macintosh|Mac OS X/i.test(ua)
              ? "mac"
              : platform === "linux" || /Linux/i.test(ua)
                ? "linux"
                : "other";
  const mobile =
    hints?.mobile ?? (/Mobi|iPhone|iPod/i.test(ua) || os === "android" || /iPad/i.test(ua));
  return { os, mobile };
}

/** 지금 이 기기. 서버 렌더링 중이면(브라우저가 없으면) 모르므로 null. */
export function checkInDevice(): CheckInDevice | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") return null;
  const hints = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  const { os, mobile } = detectDevice(navigator.userAgent, hints);
  const app: CheckInDevice["app"] = IS_APP_BUILD ? (os === "ios" ? "ios" : "android") : "web";
  return { app, os, mobile, id: deviceId() };
}

/** 이 기기에서 적은 체크인인지. */
export function isThisDevice(device: CheckInDevice | undefined): boolean {
  if (!device || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DEVICE_ID_KEY) === device.id;
  } catch {
    return device.id === sessionId;
  }
}
