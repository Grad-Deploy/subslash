import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@lib/db";
import { accounts } from "@lib/schema";
import {
  SESSION_COOKIE,
  createSession,
  pruneExpiredSessions,
  sessionCookieOptions,
} from "@lib/auth-server";
import {
  OAUTH_COOKIE,
  OAuthError,
  decodeFlow,
  fetchProfile,
  isOAuthProviderId,
  type OAuthErrorCode,
} from "@lib/oauth";
import { linkOAuthIdentity, resolveOAuthAccount, storeAppClaim } from "@lib/oauth-accounts";
import { isSocialLoginOpen } from "@lib/privacy";
import { logError } from "@lib/log";

function sameState(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * 제공자가 로그인을 마치고 돌려보내는 곳. 쿠키에 적어 둔 state와 같은지 보고, 코드로 프로필을 읽어
 * 계정을 찾거나 만든다(resolveOAuthAccount).
 *
 * 웹이면 세션 쿠키를 주고 원래 가려던 화면으로 보낸다. 앱이면 쿠키를 주지 않는다 — 인앱 브라우저의
 * 쿠키는 앱으로 오지 않고, 웹에 로그인된 채 남으면 안 된다. 대신 앱의 challenge에 계정을 적어 두고
 * '창을 닫으면 앱으로 돌아갑니다' 화면을 띄운다. 앱이 돌아와 verifier로 세션을 받아 간다(claim).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const flow = decodeFlow(request.cookies.get(OAUTH_COOKIE)?.value);
  const fromApp = flow?.appChallenge != null || flow?.link?.fromApp === true;
  // 로그인 방법을 잇는 중이면 끝나고 '내 정보'로 돌아간다(앱은 인앱 브라우저의 끝 화면).
  const linking = flow?.link != null;

  /** 앱의 끝 화면 주소. 앱이 돌아갈 스킴을 보냈으면 싣는다(끝 화면이 그 앱을 연다). */
  const appDone = () => {
    const url = new URL("/oauth/done", origin);
    if (flow?.appReturn) url.searchParams.set("app", flow.appReturn);
    return url;
  };

  const finish = (response: NextResponse) => {
    response.cookies.set(OAUTH_COOKIE, "", { path: "/api/auth/oauth", maxAge: 0 });
    return response;
  };
  const fail = (code: OAuthErrorCode, via: readonly string[] = []) => {
    // 새 계정에 나이 확인이 필요하면 가입 화면으로, 나머지는 시작한 쪽으로.
    const url = fromApp
      ? appDone()
      : new URL(linking ? "/me" : code === "need-age" ? "/signup" : "/login", origin);
    url.searchParams.set("oauthError", code);
    if (linking) url.searchParams.set("oauthLink", "1");
    if (code === "email-taken" && via.length > 0) {
      url.searchParams.set("oauthVia", via.join(","));
      url.searchParams.set("oauthProvider", provider);
    }
    return finish(NextResponse.redirect(url));
  };

  if (!isOAuthProviderId(provider) || !isSocialLoginOpen() || !isDatabaseConfigured()) {
    return fail("unavailable");
  }
  const state = params.get("state");
  if (!flow || flow.provider !== provider || !state || !sameState(state, flow.state)) {
    return fail("state");
  }
  // 제공자 화면에서 '취소'·'동의 안 함'을 누르면 code 없이 error로 돌아온다.
  const code = params.get("code");
  if (!code) return fail("cancelled");

  try {
    const profile = await fetchProfile(provider, origin, code, flow);

    if (flow.link) {
      await linkOAuthIdentity(flow.link.accountId, provider, profile);
      const url = flow.link.fromApp ? appDone() : new URL("/me", origin);
      url.searchParams.set("oauthLinked", provider);
      return finish(NextResponse.redirect(url));
    }

    const { account } = await resolveOAuthAccount(provider, profile, flow);

    if (flow.appChallenge) {
      await storeAppClaim(flow.appChallenge, account.id);
      return finish(NextResponse.redirect(appDone()));
    }

    await getDb()
      .update(accounts)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(accounts.id, account.id));
    await pruneExpiredSessions().catch(() => {
      // 청소가 실패해도 로그인은 막지 않는다.
    });
    const session = await createSession(account.id);
    const response = NextResponse.redirect(new URL(flow.next, origin));
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return finish(response);
  } catch (error) {
    if (error instanceof OAuthError) return fail(error.code, error.via);
    logError(`api/auth/oauth/${provider}/callback`, error);
    return fail("server");
  }
}
