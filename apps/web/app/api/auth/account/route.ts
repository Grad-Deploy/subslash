import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import {
  SESSION_COOKIE,
  deleteAccount,
  getAccountBySessionToken,
  readSessionToken,
} from "@lib/auth-server";
import { verifyPassword } from "@lib/password";
import {
  hit,
  retryAfterSeconds,
  tooManyRequestsMessage,
  type RateLimitRule,
} from "@lib/rate-limit";

/**
 * 로그인한 세션으로 지금 비밀번호를 거듭 대입하지 못하게 한다(자리를 비운 사이 누가 쓰는 경우).
 * 비밀번호 변경·회원 탈퇴가 같은 칸을 나눠 센다.
 */
const PASSWORD_CHECK_FAILURES: RateLimitRule = { limit: 10, windowMs: 15 * 60 * 1000 };

/**
 * 회원 탈퇴.
 *
 * 지울 계정은 요청 본문이 아니라 로그인 세션으로만 정하고, 비밀번호를 한 번 더 받는다.
 * 로그인한 채 자리를 비운 사이 다른 사람이 누르는 것을 막기 위해서다.
 *
 * 브라우저에 있는 구독 기록은 서버가 지울 수 없다 — 화면이 그렇다고 알린다.
 */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json(
        {
          error: "비밀번호를 입력해주세요.",
          fieldErrors: { password: "비밀번호를 입력해주세요." },
        },
        { status: 400 },
      );
    }

    const checkKey = `password-check:${account.id}`;
    const wait = retryAfterSeconds(checkKey, PASSWORD_CHECK_FAILURES);
    if (wait > 0) {
      return NextResponse.json(
        { error: tooManyRequestsMessage(wait) },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }
    if (!(await verifyPassword(password, account.passwordHash))) {
      hit(checkKey, PASSWORD_CHECK_FAILURES);
      return NextResponse.json(
        {
          error: "비밀번호가 맞지 않습니다.",
          fieldErrors: { password: "비밀번호가 맞지 않습니다." },
        },
        { status: 403 },
      );
    }

    await deleteAccount(account.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[api/auth/account]", error);
    return NextResponse.json(
      { error: "탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
