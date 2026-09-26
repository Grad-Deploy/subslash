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

/** 앱이 만든 challenge 모양(S256 base64url, 43자). */
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * 소셜 로그인 시작. 브라우저(앱은 인앱 브라우저)가 이 주소로 와서 제공자의 로그인 화면으로 간다.
 *
 * 쿼리: `client=app&challenge=…`(앱에서 시작), `over14=1`(가입 화면에서 만 14세 이상 확인),
 * `next=/경로`(로그인 뒤 갈 화면). 할 일은 httpOnly 쿠키에 적어 두고, 제공자에게는 state만 보낸다.
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

  const fail = (code: string) => {
    const target = fromApp ? "/oauth/done" : "/login";
    return NextResponse.redirect(new URL(`${target}?oauthError=${code}`, origin));
  };

  if (!isOAuthProviderId(provider) || !isSocialLoginOpen() || !isDatabaseConfigured()) {
    return fail("unavailable");
  }
  if (fromApp && (!challenge || !CHALLENGE_PATTERN.test(challenge))) return fail("state");

  const flow: OAuthFlow = {
    provider,
    state: randomToken(),
    verifier: randomToken(),
    appChallenge: fromApp ? challenge : null,
    over14: params.get("over14") === "1",
    next: safeNextPath(params.get("next")),
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
