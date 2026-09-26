import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { accounts } from "@lib/schema";
import { createSession, sessionTokenForApp, toPublicAccount } from "@lib/auth-server";
import { isAppOrigin } from "@lib/app-origins";
import { consumeAppClaim } from "@lib/oauth-accounts";
import { logError } from "@lib/log";

const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

/**
 * 앱이 인앱 브라우저에서 마친 소셜 로그인을 받아 간다. 본문: `{ verifier }`.
 *
 * 앱 출처에서 온 요청에만 답한다 — 세션 토큰을 본문에 싣는 곳이라, 웹 페이지가 받아 가면 쿠키를
 * httpOnly로 둔 의미가 없다(sessionTokenForApp과 같은 규칙). 한 번 받아 가면 지워진다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  if (!isAppOrigin(request.headers.get("origin"))) {
    return NextResponse.json({ error: "앱에서만 쓸 수 있습니다." }, { status: 403 });
  }
  try {
    const body = (await request.json().catch(() => null)) as { verifier?: unknown } | null;
    const verifier = typeof body?.verifier === "string" ? body.verifier : "";
    if (!VERIFIER_PATTERN.test(verifier)) {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }
    const accountId = await consumeAppClaim(verifier);
    if (!accountId) {
      return NextResponse.json({ error: "로그인이 끝나지 않았어요." }, { status: 404 });
    }
    const rows = await getDb()
      .update(accounts)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(accounts.id, accountId))
      .returning();
    const account = rows[0];
    if (!account) {
      return NextResponse.json({ error: "로그인이 끝나지 않았어요." }, { status: 404 });
    }
    const session = await createSession(account.id);
    return NextResponse.json({
      account: toPublicAccount(account),
      ...sessionTokenForApp(request, session),
    });
  } catch (error) {
    logError("api/auth/oauth/claim", error);
    return NextResponse.json({ error: "로그인을 처리하지 못했습니다." }, { status: 500 });
  }
}
