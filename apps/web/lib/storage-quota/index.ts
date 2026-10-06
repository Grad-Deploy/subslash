import {
  clampQuantity,
  findPresetForSubscription,
  storagePlanFit,
  type Subscription,
} from "@subslash/shared";

/**
 * 구글 원 저장 공간 체크인의 '사용량 측정'.
 *
 * SubSlash 소유의 Apps Script 웹 앱(`web-app.ts`)이 접속한 사람의 권한으로 계정 저장 용량을 읽어, SubSlash
 * 서버를 거치지 않고 연 사람의 화면으로 돌려준다 — 앱은 돌아오는 주소(`leaveForExternal`의 결과), 웹은 새 탭의
 * 끝 화면(`/storage-quota/done#…`)이 이 기기의 저장소에 남기면 체크인 창이 받는다. 체크인 칸을 채우기만
 * 하고, 등록은 사용자가 체크인 버튼을 눌러야 한다.
 *
 * 채우지 않는 경우: 한도가 없을 때, 한도가 등록한 요금제 용량과 다를 때(가족 요금제의 다른 구성원·회사 계정),
 * 가족과 나누는 구독일 때(이 계정의 사용량은 내 몫뿐이라 요금제 전체의 비율이 아니다) — 그대로 채우면 '더
 * 작은 요금제로 충분해요'라는 틀린 권유가 된다.
 *
 * 웹 앱 주소(`NEXT_PUBLIC_STORAGE_QUOTA_WEB_APP_URL`)는 운영자가 배포한 뒤 정한다. 없으면 버튼이 없다.
 */

const WEB_APP_URL = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
const GIB = 1024 ** 3;

/** 배포한 웹 앱 주소. Apps Script 웹 앱 주소가 아니면 null — 다른 사이트로 보내지 않는다. */
export function storageQuotaWebAppUrl(
  value: string | undefined = process.env.NEXT_PUBLIC_STORAGE_QUOTA_WEB_APP_URL,
): string | null {
  const url = value?.trim();
  return url && WEB_APP_URL.test(url) ? url : null;
}

/** 이 구독의 용량을 이 웹 앱으로 확인할 수 있는지. 구글 원만 Google 계정 용량이 곧 요금제 용량이다. */
export function canCheckGoogleStorage(sub: Pick<Subscription, "name" | "cancelUrl">): boolean {
  return findPresetForSubscription(sub)?.id === "google-one";
}

/** 웹 앱을 열 주소. `origin`은 웹이 돌아올 SubSlash 주소, `scheme`은 앱이 돌아올 앱 ID다. */
export function storageQuotaCheckUrl(
  base: string,
  options: { state: string; origin?: string; scheme?: string | null },
): string {
  const params = new URLSearchParams({ state: options.state });
  if (options.scheme) {
    params.set("client", "app");
    params.set("return", options.scheme);
  } else if (options.origin) {
    params.set("origin", options.origin);
  }
  return `${base}?${params}`;
}

/** 측정 하나를 가리키는 값. 웹 앱이 그대로 돌려준다. */
export function newMeasureState(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type StorageQuotaResult =
  { state: string; ok: true; usage: number; limit: number | null } | { state: string; ok: false };

function bytes(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

/** 웹 앱이 돌려준 값(`flow=storage&state=…&usage=…&limit=…`). 측정 결과가 아니면 null. */
export function parseStorageQuotaResult(params: URLSearchParams | null): StorageQuotaResult | null {
  if (!params || params.get("flow") !== "storage") return null;
  const state = params.get("state") ?? "";
  if (params.has("error")) return { state, ok: false };
  const usage = bytes(params.get("usage"));
  if (usage === null) return null;
  return { state, ok: true, usage, limit: bytes(params.get("limit")) };
}

/** Google은 1024 단위로 센다(5TB 요금제의 한도가 5,120GB로 나온다). */
export function formatQuotaBytes(value: number): string {
  const gb = value / GIB;
  if (gb >= 1024) return `${Math.round((gb / 1024) * 10) / 10}TB`;
  if (gb >= 10) return `${Math.round(gb)}GB`;
  return `${Math.round(gb * 100) / 100}GB`;
}

export interface StorageCheckIn {
  /** 체크인 칸에 채울 비율(%). 채우지 않으면 null. */
  quantity: number | null;
  /** 칸 아래에 보일 문장. 채웠으면 근거, 아니면 채우지 않은 이유. */
  message: string;
}

/**
 * 측정한 한도·사용량을 체크인 값으로. 요금제 이름의 용량(1TB = 1,000GB)과 Google의 한도(1024 단위)는 단위가
 * 달라 5TB 요금제가 5,120GB로 나오므로 10% 안쪽 차이는 같은 요금제로 본다.
 */
export function storageCheckInFrom(
  sub: Pick<Subscription, "name" | "cancelUrl" | "planId" | "sharingCount">,
  result: StorageQuotaResult,
): StorageCheckIn {
  if (!result.ok) {
    return {
      quantity: null,
      message: "Google에서 용량을 받지 못했어요. 잠시 뒤 다시 측정해 주세요.",
    };
  }
  const { usage, limit } = result;
  if (!limit) {
    return {
      quantity: null,
      message: "이 Google 계정은 한도가 정해져 있지 않아 비율을 셀 수 없어요. 직접 적어 주세요.",
    };
  }
  const measured = `Google 계정 한도 ${formatQuotaBytes(limit)} 중 ${formatQuotaBytes(usage)}를 쓰고 있어요.`;
  if ((sub.sharingCount ?? 1) > 1) {
    return {
      quantity: null,
      message: `${measured} 가족과 나누는 구독이라 이 계정의 사용량만으로는 요금제 전체의 비율을 알 수 없어 채우지 않았어요.`,
    };
  }
  const plan = storagePlanFit(sub, 0);
  if (plan) {
    const ratio = limit / GIB / plan.capacityGB;
    if (ratio < 0.9 || ratio > 1.1) {
      return {
        quantity: null,
        message: `${measured} 등록한 요금제(${plan.planName})와 한도가 달라 채우지 않았어요. 다른 계정이거나 가족·회사 계정의 한도일 수 있어요.`,
      };
    }
  }
  const percent = (usage / limit) * 100;
  // 0%는 '아무것도 두지 않음'이다. 조금이라도 쓰면 1% 이상으로 적는다.
  const quantity = usage > 0 ? Math.max(1, clampQuantity("storage", percent)) : 0;
  const note = usage > 0 && percent < 1 ? " 1% 미만이라 1%로 채웠어요." : "";
  const unknownPlan = plan ? "" : " 요금제를 골라 두면 한도가 요금제와 맞는지 확인해요.";
  return { quantity, message: `${measured}${note}${unknownPlan}` };
}

/**
 * 웹: 새 탭의 끝 화면이 결과를 이 키에 남기면, 체크인 창이 `storage` 이벤트로 받는다. 기기의 다른 기록과
 * 섞이지 않는 임시 칸이고, 받으면 지운다.
 */
export const STORAGE_QUOTA_RESULT_KEY = "subslash-storage-quota-result";
