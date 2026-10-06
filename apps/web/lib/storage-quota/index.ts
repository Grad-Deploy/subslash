import { findPresetForSubscription, type Subscription } from "@subslash/shared";

/**
 * 'Google 계정 용량 확인'(구글 원 저장 공간 체크인).
 *
 * SubSlash 소유의 Apps Script 웹 앱(`web-app.ts`)이 접속한 사람의 권한으로 계정 저장 용량을 읽어 그 화면에만
 * 보여 주고, 사용자가 본 비율을 체크인에 적는다. 값을 앱으로 되돌려 받지 않는다 — 받으면 서버나 돌아오는
 * 주소를 거쳐야 하고, 가족·회사 계정의 한도처럼 내 요금제와 다른 숫자를 확인 없이 적게 된다.
 *
 * 웹 앱 주소(`NEXT_PUBLIC_STORAGE_QUOTA_WEB_APP_URL`)는 운영자가 배포한 뒤 정한다. 없으면 버튼을 띄우지 않는다.
 */

const WEB_APP_URL = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;

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

/** 웹 앱을 열 주소. 앱에서 열면 '창을 닫으면 앱으로 돌아갑니다'를 띄우게 표시한다. */
export function storageQuotaCheckUrl(base: string, fromApp: boolean): string {
  return fromApp ? `${base}?client=app` : base;
}
