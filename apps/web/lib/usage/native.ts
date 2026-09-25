/**
 * 안드로이드 사용 기록 플러그인(apps/mobile의 UsageStatsPlugin)을 부른다.
 *
 * 앱 빌드의 안드로이드에서만 동작한다. 웹과 iOS에서는 지원하지 않는다고 답하고 플러그인을 부르지
 * 않는다 — iOS에서 부르면 "not implemented"로 거절당해 경고만 쌓인다(lib/native의 syncSystemBars와
 * 같은 이유). 플러그인은 동적으로 불러와 웹 번들에 들어가지 않는다.
 */
import { IS_APP_BUILD } from "../platform";

export interface NativeUsageDay {
  /** 이 폰의 시간대 기준 날짜(YYYY-MM-DD). */
  date: string;
  pkg: string;
  foregroundMs: number;
  opens: number;
}

export interface NativeUsageResult {
  /** 요청한 시작(그날 자정, ms). */
  from: number;
  /** 받은 기록 중 가장 이른 시각. from보다 늦으면 그 앞은 운영체제가 지운 것이다. */
  dataFrom: number | null;
  days: NativeUsageDay[];
}

interface UsageStatsPlugin {
  status(): Promise<{ granted: boolean }>;
  openSettings(): Promise<void>;
  installed(options: { packages: string[] }): Promise<{ packages: string[] }>;
  query(options: { packages: string[]; days: number }): Promise<NativeUsageResult>;
}

// 플러그인 프록시는 { plugin }으로 한 번 감싸서 넘긴다. Capacitor 플러그인 프록시는 어떤 속성이든
// 네이티브 메서드로 답해서 `then`도 있는 것처럼 보인다. 프록시를 그대로 Promise의 결과로 넘기면
// Promise가 그것을 thenable로 여겨 네이티브 'then'을 부르고, 영영 끝나지 않는다(화면이 계속
// '확인 중'에 머물러 사용 현황이 아무 데도 뜨지 않았다).
let plugin: Promise<{ plugin: UsageStatsPlugin } | null> | null = null;

// load()도 프록시가 아니라 감싼 것을 돌려준다(async 함수의 반환값도 같은 이유로 풀린다).
function load(): Promise<{ plugin: UsageStatsPlugin } | null> {
  if (!IS_APP_BUILD) return Promise.resolve(null);
  plugin ??= import("@capacitor/core")
    .then(({ Capacitor, registerPlugin }) =>
      Capacitor.getPlatform() === "android"
        ? { plugin: registerPlugin<UsageStatsPlugin>("UsageStats") }
        : null,
    )
    .catch(() => null);
  return plugin;
}

/** 이 기기에서 폰 사용 기록을 쓸 수 있는지(안드로이드 앱인지). */
export async function isUsageSupported(): Promise<boolean> {
  return (await load()) !== null;
}

export async function isUsageGranted(): Promise<boolean> {
  const p = (await load())?.plugin;
  if (!p) return false;
  try {
    return (await p.status()).granted;
  } catch {
    return false;
  }
}

/** '사용 기록 액세스' 설정 화면을 연다. 사용자가 직접 켜고 돌아와야 한다. */
export async function openUsageSettings(): Promise<boolean> {
  const p = (await load())?.plugin;
  if (!p) return false;
  try {
    await p.openSettings();
    return true;
  } catch {
    return false;
  }
}

export async function installedPackages(packages: readonly string[]): Promise<string[] | null> {
  const p = (await load())?.plugin;
  if (!p) return null;
  try {
    return (await p.installed({ packages: [...packages] })).packages;
  } catch {
    return null;
  }
}

export async function queryUsage(
  packages: readonly string[],
  days: number,
): Promise<NativeUsageResult | null> {
  const p = (await load())?.plugin;
  if (!p) return null;
  try {
    return await p.query({ packages: [...packages], days });
  } catch (error) {
    console.warn("[usage] 사용 기록을 읽지 못했습니다", error);
    return null;
  }
}
