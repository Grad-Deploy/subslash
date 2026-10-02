import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import {
  OAUTH_COOKIE,
  OAUTH_FLOW_TTL_SECONDS,
  authorizeUrl,
  encodeFlow,
  isOAuthProviderId,
  randomToken,
  safeNextPath,
  type OAuthFlow,
} from "@lib/oauth";
import { isSocialLoginOpen } from "@lib/privacy";
import { getAccountBySessionToken, SESSION_COOKIE } from "@lib/auth-server";
import { verifyLinkCode } from "@lib/oauth-accounts";
import { canSignLinks } from "@lib/tokens";
import { isAppReturnScheme } from "@lib/app-return";

/** 앱이 만든 challenge 모양(S256 base64url, 43자). */
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * 소셜 로그인 시작. 브라우저(앱은 인앱 브라우저)가 이 주소로 와서 제공자의 로그인 화면으로 간다.
 *
 * 쿼리: `client=app&challenge=…`(앱에서 시작), `over14=1`(가입 화면에서 만 14세 이상 확인),
 * `next=/경로`(로그인 뒤 갈 화면). 할 일은 httpOnly 쿠키에 적어 두고, 제공자에게는 state만 보낸다.
 *
 * `link=<연결 코드>`이면 로그인이 아니라 '내 정보'에서 로그인 방법을 잇는 것이다(코드는
 * `/api/auth/oauth/link`가 준다). 웹에서는 이 브라우저에 로그인한 계정과 코드의 계정이 같아야 한다 —
 * 남이 자기 코드를 담은 주소를 보내, 받은 사람의 구글 계정을 자기 계정에 잇게 하지 못하게. 앱은 인앱
 * 브라우저라 세션 쿠키가 없어 코드만 본다(`client=app`).
 *
 * 앱은 `return=<앱 ID>`도 보낸다. 끝 화면(`/oauth/done`)이 그 앱을 열어 인앱 브라우저(또는 카카오톡이
 * 돌려보낸 Chrome)에서 앱으로 돌아가게 한다(lib/app-return). 목록에 없는 값은 버린다.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const params = request.nextUrl.searchParams;
  const fromApp = params.get("client") === "app";
  const challenge = params.get("challenge");
  const origin = request.nextUrl.origin;
  const returnParam = params.get("return");
  const appReturn = fromApp && isAppReturnScheme(returnParam) ? returnParam : null;
  /** 앱이면 끝 화면, 웹이면 `webPage`. 앱 끝 화면에는 돌아갈 앱을 싣는다. */
  const failTo = (webPage: string, query: Record<string, string>) => {
    const url = new URL(fromApp ? "/oauth/done" : webPage, origin);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    if (appReturn) url.searchParams.set("app", appReturn);
    return NextResponse.redirect(url);
  };

  const fail = (code: string) => failTo("/login", { oauthError: code });

  if (!isOAuthProviderId(provider) || !isSocialLoginOpen() || !isDatabaseConfigured()) {
    return fail("unavailable");
  }
  const linkCode = params.get("link");
  let link: OAuthFlow["link"] = null;
  if (linkCode !== null) {
    const linkFail = (code: string) => failTo("/me", { oauthError: code, oauthLink: "1" });
    if (!canSignLinks()) return linkFail("unavailable");
    const accountId = await verifyLinkCode(linkCode, provider);
    if (!accountId) return linkFail("state");
    if (!fromApp) {
      const signedIn = await getAccountBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
      if (signedIn?.id !== accountId) return linkFail("state");
    }
    link = { accountId, fromApp };
  } else if (fromApp && (!challenge || !CHALLENGE_PATTERN.test(challenge))) {
    return fail("state");
  }

  const flow: OAuthFlow = {
    provider,
    state: randomToken(),
    verifier: randomToken(),
    appChallenge: fromApp && !link ? challenge : null,
    over14: params.get("over14") === "1",
    next: safeNextPath(params.get("next")),
    link,
    appReturn,
  };
  const target = authorizeUrl(provider, origin, flow);
  if (!target) return fail("unavailable");

  const response = NextResponse.redirect(target);
  response.cookies.set(OAUTH_COOKIE, encodeFlow(flow), {
    httpOnly: true,
    // 제공자에서 돌아오는 것은 최상위 GET 이동이라 lax면 실린다.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/oauth",
    maxAge: OAUTH_FLOW_TTL_SECONDS,
  });
  return response;
}
