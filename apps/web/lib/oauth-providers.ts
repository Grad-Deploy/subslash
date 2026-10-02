/**
 * 간편 로그인 제공자의 목록과 화면에 쓰는 이름. 서버(lib/oauth)와 화면(로그인 버튼·로그인 방법·끝 화면·
 * 오류 문구)이 함께 쓰므로 서버 모듈(crypto)을 끌어오지 않게 따로 둔다 — 예전에는 화면마다 이름표를 다시
 * 적어 네 벌이 있었다.
 */

export type OAuthProviderId = "google" | "kakao" | "naver";

export const OAUTH_PROVIDER_IDS: readonly OAuthProviderId[] = ["google", "kakao", "naver"];

export const OAUTH_PROVIDER_LABEL: Record<OAuthProviderId, string> = {
  google: "구글",
  kakao: "카카오",
  naver: "네이버",
};

export function isOAuthProviderId(value: unknown): value is OAuthProviderId {
  return typeof value === "string" && (OAUTH_PROVIDER_IDS as readonly string[]).includes(value);
}

/** 주소·응답에서 온 값의 이름. 모르는 값이면 받은 그대로 보인다. */
export function providerLabel(value: string): string {
  return isOAuthProviderId(value) ? OAUTH_PROVIDER_LABEL[value] : value;
}
