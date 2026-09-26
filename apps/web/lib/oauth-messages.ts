/**
 * 소셜 로그인 실패 이유와 화면 문구. 서버(lib/oauth)가 `?oauthError=`로 넘기고 화면이 읽는다. 화면에서도
 * 가져오므로 서버 모듈(crypto)을 끌어오지 않게 따로 둔다.
 */
export type OAuthErrorCode =
  | "unavailable"
  | "cancelled"
  | "state"
  | "provider"
  | "no-email"
  | "email-taken"
  | "need-age"
  | "server";

export const OAUTH_ERROR_MESSAGE: Record<OAuthErrorCode, string> = {
  unavailable: "지금은 이 방법으로 로그인할 수 없어요.",
  cancelled: "로그인을 취소했어요.",
  state: "로그인 시간이 지났거나 다른 창에서 시작한 로그인이에요. 다시 눌러 주세요.",
  provider: "로그인 서비스에서 정보를 받아 오지 못했어요. 잠시 후 다시 시도해 주세요.",
  "no-email": "이메일 제공에 동의해야 가입할 수 있어요. 다시 누르고 이메일에 동의해 주세요.",
  "email-taken":
    "이 이메일로 이미 가입한 계정이 있어요. 아이디와 비밀번호로 로그인해 주세요. 비밀번호를 잊었다면 '비밀번호를 잊으셨나요?'로 다시 만들 수 있어요.",
  "need-age": "처음 가입하시네요. 아래에서 만 14세 이상인지 확인한 뒤 다시 눌러 주세요.",
  server: "로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return (OAUTH_ERROR_MESSAGE as Record<string, string>)[code] ?? OAUTH_ERROR_MESSAGE.server;
}
