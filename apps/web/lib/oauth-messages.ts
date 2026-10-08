/**
 * 소셜 로그인 실패 이유와 화면 문구. 서버(lib/oauth)가 `?oauthError=`로 넘기고 화면이 읽는다. 화면에서도
 * 가져오므로 서버 모듈(crypto)을 끌어오지 않게 따로 둔다.
 *
 * 문구는 화면 언어의 것을 받는다(`useT().oauth`, lib/i18n/messages/oauth). 기본값을 두지 않는다 — 넘기기를
 * 잊으면 영어 화면에 한국어가 섞여도 타입이 잡아 주지 못한다.
 */
import { isOAuthProviderId } from "./oauth-providers";
import type { Messages } from "./i18n/messages";

export type OAuthErrorCode = keyof Messages["oauth"]["errors"];

type OAuthMessages = Messages["oauth"];

/**
 * `email-taken`의 문구. 서버가 그 계정의 로그인 방법(`oauthVia`)과 지금 누른 제공자(`oauthProvider`)를
 * 넘기면 "구글로 로그인한 뒤 카카오를 연결하세요"처럼 그 계정에 맞는 말을 한다. 예전에는 늘 "아이디와
 * 비밀번호로 로그인"이라고 해, 간편 로그인으로 가입해 비밀번호가 없는 사람은 따를 수 없었다.
 */
function emailTakenMessage(via: string[], provider: string | null, t: OAuthMessages): string {
  const ways = [
    ...(via.includes("password") ? [t.password] : []),
    ...via.filter(isOAuthProviderId).map((id) => t.providers[id]),
  ];
  if (ways.length === 0 || !isOAuthProviderId(provider)) {
    return t.errors["email-taken"];
  }
  return t.emailTaken(ways.join(t.or), t.providerObject[provider], t.providers[provider]);
}

export function oauthErrorMessage(code: string | null, t: OAuthMessages): string | null {
  if (!code) return null;
  return (t.errors as Record<string, string>)[code] ?? t.errors.server;
}

/** 서버가 돌려보낸 주소(`?oauthError=…&oauthVia=…&oauthProvider=…`)의 실패 문구. 실패가 아니면 null. */
export function oauthErrorMessageFrom(search: URLSearchParams, t: OAuthMessages): string | null {
  const code = search.get("oauthError");
  if (code === "email-taken") {
    const via = (search.get("oauthVia") ?? "").split(",").filter(Boolean);
    return emailTakenMessage(via, search.get("oauthProvider"), t);
  }
  return oauthErrorMessage(code, t);
}
