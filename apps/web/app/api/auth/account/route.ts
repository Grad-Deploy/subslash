import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { SESSION_COOKIE, deleteAccount, getAccountBySessionToken } from "@lib/auth-server";
import { verifyPassword } from "@lib/password";

/**
 * 회원 탈퇴.
 *
 * 지울 계정은 요청 본문이 아니라 세션 쿠키로만 정하고, 비밀번호를 한 번 더 받는다.
 * 로그인한 채 자리를 비운 사이 다른 사람이 누르는 것을 막기 위해서다.
 *
 * 브라우저에 있는 구독 기록은 서버가 지울 수 없다 — 화면이 그렇다고 알린다.
 */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
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

    if (!(await verifyPassword(password, account.passwordHash))) {
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
