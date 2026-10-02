import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import {
  getAccountBySessionToken,
  readSessionToken,
  sessionTokenForApp,
  startLoginSession,
  toPublicAccount,
} from "@lib/auth-server";
import { isAppOrigin } from "@lib/app-origins";
import { OAuthError, fetchNativeProfile, isOAuthProviderId, nativeProviders } from "@lib/oauth";
import { linkOAuthIdentity, resolveOAuthAccount } from "@lib/oauth-accounts";
import { isSocialLoginOpen } from "@lib/privacy";
import { logError } from "@lib/log";

/** 카카오 액세스 토큰 모양. 길이만 넉넉히 거른다(내용은 카카오가 확인한다). */
const TOKEN_PATTERN = /^[A-Za-z0-9_\-.~+/=]{20,512}$/;

/**
 * 앱이 SDK(카카오톡)로 받은 액세스 토큰으로 로그인하거나, 로그인한 계정에 그 제공자를 잇는다.
 * 본문: `{ provider, accessToken, over14?, link? }`.
 *
 * 인앱 브라우저 로그인(`[provider]/start`·`callback`)과 같은 규칙을 쓴다 — 계정 찾기·만들기는
 * `resolveOAuthAccount`, 잇기는 `linkOAuthIdentity`. 다른 점은 토큰을 앱이 가져온다는 것뿐이라, 그 토큰이
 * 우리 앱에서 발급됐는지 먼저 확인한다(`fetchNativeProfile`의 앱 ID). 앱 출처에만 답한다 — 세션 토큰을
 * 본문에 싣는 곳이다(claim과 같은 규칙).
 *
 * 실패하면 `{ oauthError, oauthVia? }`로 답한다. 화면은 끝 화면과 같은 문구(oauthErrorMessageFrom)로 보인다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  if (!isAppOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "앱에서만 쓸 수 있습니다." }, { status: 403 });
  }
  const fail = (code: string, status = 400, via: readonly string[] = [], provider?: string) =>
    NextResponse.json(
      {
        oauthError: code,
        ...(via.length > 0 ? { oauthVia: via.join(","), oauthProvider: provider } : {}),
      },
      { status },
    );

  const body = (await request.json().catch(() => null)) as {
    provider?: unknown;
    accessToken?: unknown;
    over14?: unknown;
    link?: unknown;
  } | null;
  const provider = body?.provider;
  const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
  if (!isOAuthProviderId(provider) || !TOKEN_PATTERN.test(accessToken)) return fail("state");
  if (!isSocialLoginOpen() || !nativeProviders().includes(provider)) return fail("unavailable");

  try {
    const profile = await fetchNativeProfile(provider, accessToken);

    if (body?.link === true) {
      const signedIn = await getAccountBySessionToken(readSessionToken(request));
      if (!signedIn) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
      await linkOAuthIdentity(signedIn.id, provider, profile);
      return NextResponse.json({ ok: true, linked: provider });
    }

    const { account } = await resolveOAuthAccount(provider, profile, {
      over14: body?.over14 === true,
    });
    const started = await startLoginSession(account.id);
    if (!started) return fail("server", 500);
    const { session } = started;
    return NextResponse.json({
      account: toPublicAccount(started.account),
      ...sessionTokenForApp(request, session),
    });
  } catch (error) {
    if (error instanceof OAuthError) {
      return fail(error.code, error.code === "server" ? 500 : 400, error.via, provider);
    }
    logError("api/auth/oauth/native", error);
    return fail("server", 500);
  }
}
