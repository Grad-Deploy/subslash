/**
 * 소셜 로그인 실패 이유와 화면 문구. 서버(lib/oauth)가 `?oauthError=`로 넘기고 화면이 읽는다. 화면에서도
 * 가져오므로 서버 모듈(crypto)을 끌어오지 않게 따로 둔다.
 */
import { OAUTH_PROVIDER_LABEL, isOAuthProviderId, type OAuthProviderId } from "./oauth-providers";

export type OAuthErrorCode =
  | "unavailable"
  | "cancelled"
  | "state"
  | "provider"
  | "no-email"
  | "email-taken"
  | "need-age"
  | "identity-taken"
  | "provider-linked"
  | "server";

export const OAUTH_ERROR_MESSAGE: Record<OAuthErrorCode, string> = {
  unavailable: "지금은 이 방법으로 로그인할 수 없어요.",
  cancelled: "로그인을 취소했어요.",
  state: "로그인 시간이 지났거나 다른 창에서 시작한 로그인이에요. 다시 눌러 주세요.",
  provider: "로그인 서비스에서 정보를 받아 오지 못했어요. 잠시 후 다시 시도해 주세요.",
  "no-email": "이메일 제공에 동의해야 가입할 수 있어요. 다시 누르고 이메일에 동의해 주세요.",
  "email-taken":
    "이 이메일로 이미 가입한 계정이 있어요. 처음 가입한 방법(이메일과 비밀번호, 또는 구글·카카오·네이버)으로 로그인한 뒤 '내 정보'의 로그인 방법에서 이 계정을 연결하면 다음부터 이것으로도 로그인할 수 있어요.",
  "need-age": "처음 가입하시네요. 아래에서 만 14세 이상인지 확인한 뒤 다시 눌러 주세요.",
  "identity-taken":
    "이 계정은 이미 다른 SubSlash 계정에 연결돼 있어요. 그 계정으로 로그인해 연결을 끊은 뒤 다시 시도해 주세요.",
  "provider-linked":
    "이미 같은 회사의 다른 계정이 연결돼 있어요. 연결을 끊은 뒤 다시 연결해 주세요.",
  server: "로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
};

/** 목적격 조사까지 붙인 이름. 구글만 받침이 있다. */
const PROVIDER_OBJECT: Record<OAuthProviderId, string> = {
  google: "구글을",
  kakao: "카카오를",
  naver: "네이버를",
};

/**
 * `email-taken`의 문구. 서버가 그 계정의 로그인 방법(`oauthVia`)과 지금 누른 제공자(`oauthProvider`)를
 * 넘기면 "구글로 로그인한 뒤 카카오를 연결하세요"처럼 그 계정에 맞는 말을 한다. 예전에는 늘 "아이디와
 * 비밀번호로 로그인"이라고 해, 간편 로그인으로 가입해 비밀번호가 없는 사람은 따를 수 없었다.
 */
function emailTakenMessage(via: string[], provider: string | null): string {
  const ways = [
    ...(via.includes("password") ? ["이메일(또는 아이디)과 비밀번호"] : []),
    ...via.filter(isOAuthProviderId).map((id) => OAUTH_PROVIDER_LABEL[id]),
  ];
  if (ways.length === 0 || !isOAuthProviderId(provider)) {
    return OAUTH_ERROR_MESSAGE["email-taken"];
  }
  return `이 이메일은 이미 ${ways.join(" 또는 ")}로 가입돼 있어요. 그 방법으로 로그인한 뒤 '내 정보'의 로그인 방법에서 ${PROVIDER_OBJECT[provider]} 연결하면 다음부터 ${OAUTH_PROVIDER_LABEL[provider]}로도 로그인할 수 있어요.`;
}

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return (OAUTH_ERROR_MESSAGE as Record<string, string>)[code] ?? OAUTH_ERROR_MESSAGE.server;
}

/** 서버가 돌려보낸 주소(`?oauthError=…&oauthVia=…&oauthProvider=…`)의 실패 문구. 실패가 아니면 null. */
export function oauthErrorMessageFrom(search: URLSearchParams): string | null {
  const code = search.get("oauthError");
  if (code === "email-taken") {
    const via = (search.get("oauthVia") ?? "").split(",").filter(Boolean);
    return emailTakenMessage(via, search.get("oauthProvider"));
  }
  return oauthErrorMessage(code);
}
