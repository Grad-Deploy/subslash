import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { OAUTH_PROVIDER_LABEL, enabledProviders, isOAuthProviderId } from "@lib/oauth";
import { createLinkCode, linkedProviders, unlinkOAuthIdentity } from "@lib/oauth-accounts";
import { hasPassword } from "@lib/password";
import { isSocialLoginOpen } from "@lib/privacy";
import { canSignLinks } from "@lib/tokens";
import { logError } from "@lib/log";

/**
 * '내 정보'의 로그인 방법: 계정에 구글·카카오·네이버를 잇고 끊는다. 모두 로그인 세션으로만 계정을 정한다.
 *
 * 같은 이메일로 간편 로그인을 하면 계정을 잇지 않고 거절하므로(`email-taken`), 한 사람이 여러 방법으로
 * 로그인하려면 처음 가입한 방법으로 로그인한 뒤 여기서 잇는다.
 */

async function signedInAccount(request: NextRequest) {
  return getAccountBySessionToken(readSessionToken(request));
}

function unauthorized() {
  return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
}

/** 잇거나 끊을 수 있는 제공자와 지금 이어 둔 제공자. 소셜 로그인이 닫혀 있으면 고를 제공자가 없다. */
export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await signedInAccount(request);
    if (!account) return unauthorized();
    const providers =
      isSocialLoginOpen() && canSignLinks()
        ? enabledProviders().map((id) => ({ id, label: OAUTH_PROVIDER_LABEL[id] }))
        : [];
    return NextResponse.json(
      {
        providers,
        linked: await linkedProviders(account.id),
        hasPassword: hasPassword(account.passwordHash),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logError("api/auth/oauth/link GET", error);
    return NextResponse.json({ error: "로그인 방법을 불러오지 못했습니다." }, { status: 500 });
  }
}

async function readProvider(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { provider?: unknown } | null;
  return isOAuthProviderId(body?.provider) ? body.provider : null;
}

/**
 * 잇기 시작. 본문: `{ provider }`. 화면이 열 시작 주소(경로)를 돌려준다 — 주소에는 세션 토큰이 아니라
 * 10분짜리 연결 코드만 싣는다(`createLinkCode`). 앱은 인앱 브라우저로 열고 `client=app`을 붙인다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await signedInAccount(request);
    if (!account) return unauthorized();
    const provider = await readProvider(request);
    if (!provider || !isSocialLoginOpen() || !canSignLinks()) {
      return NextResponse.json({ error: "지금은 연결할 수 없어요." }, { status: 400 });
    }
    if (!enabledProviders().includes(provider)) {
      return NextResponse.json({ error: "지금은 연결할 수 없어요." }, { status: 400 });
    }
    if ((await linkedProviders(account.id)).includes(provider)) {
      return NextResponse.json({ error: "이미 연결돼 있어요." }, { status: 409 });
    }
    const code = await createLinkCode(account.id, provider);
    const params = new URLSearchParams({ link: code });
    return NextResponse.json({ path: `/api/auth/oauth/${provider}/start?${params}` });
  } catch (error) {
    logError("api/auth/oauth/link POST", error);
    return NextResponse.json({ error: "연결을 시작하지 못했습니다." }, { status: 500 });
  }
}

/** 끊기. 본문: `{ provider }`. 로그인할 방법이 남지 않으면 끊지 않는다. */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await signedInAccount(request);
    if (!account) return unauthorized();
    const provider = await readProvider(request);
    if (!provider) {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }
    const result = await unlinkOAuthIdentity(account.id, provider);
    if (result === "last-method") {
      return NextResponse.json(
        {
          error:
            "로그인할 방법이 하나뿐이라 끊을 수 없어요. 비밀번호를 만들거나 다른 계정을 먼저 연결해 주세요.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, linked: await linkedProviders(account.id) });
  } catch (error) {
    logError("api/auth/oauth/link DELETE", error);
    return NextResponse.json({ error: "연결을 끊지 못했습니다." }, { status: 500 });
  }
}
