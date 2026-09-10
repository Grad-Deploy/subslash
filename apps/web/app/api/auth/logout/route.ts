import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import { SESSION_COOKIE, destroySession } from "@lib/auth-server";

/**
 * 로그아웃.
 *
 * 쿠키만 지우면 브라우저에서만 사라지고 서버의 세션은 살아있다. 그래서
 * 서버 쪽 세션 줄을 먼저 지우고, 쿠키도 함께 만료시킨다.
 */
export async function POST(request: NextRequest) {
  try {
    // DB가 없으면 지울 서버 세션도 없다. 쿠키만 지우면 로그아웃은 완결된다.
    if (isDatabaseConfigured()) {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      await destroySession(token);
    }
  } catch (error) {
    console.error("[api/auth/logout]", error);
    // 세션 삭제가 실패해도 브라우저 쿠키는 반드시 지운다.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
