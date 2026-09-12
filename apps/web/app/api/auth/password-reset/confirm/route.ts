import { NextRequest, NextResponse } from "next/server";
import { validatePassword } from "@subslash/shared";
import { databaseUnavailableResponse } from "@lib/db";
import { hashPassword } from "@lib/password";
import { SESSION_COOKIE, createSession, sessionCookieOptions } from "@lib/auth-server";
import { applyPasswordReset, resolveResetLink } from "@lib/password-reset";

/**
 * 재설정 메일의 링크가 여는 `/reset-password` 페이지가 부르는 곳.
 *
 * GET은 링크가 어느 계정의 것인지만 알려준다. 메일 검사기는 메일 속 링크를 사람보다
 * 먼저 열어본다. 비밀번호는 사람이 새 비밀번호를 적어 보내는 POST로만 바뀐다.
 */
export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const state = await resolveResetLink(request.nextUrl.searchParams.get("token"));
    if (state.kind === "invalid") return NextResponse.json({ status: "invalid" });
    return NextResponse.json({
      status: "valid",
      username: state.account.username,
      email: state.account.email,
    });
  } catch (error) {
    console.error("[api/auth/password-reset/confirm]", error);
    return NextResponse.json({ error: "재설정 링크를 처리하지 못했습니다." }, { status: 500 });
  }
}

/**
 * 본문: `{ token, password, passwordConfirm }`
 *
 * 바꾸고 나면 모든 기기의 로그인을 끊고, 이 브라우저는 새 세션으로 로그인시킨다.
 * 새 비밀번호를 방금 정한 사람에게 그 비밀번호를 한 번 더 치게 할 이유가 없다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }

    // 링크부터 본다. 만료된 링크에 비밀번호 규칙을 먼저 알려주면, 고쳐 보내도
    // 결국 바꿀 수 없다는 것을 한 번 더 제출한 뒤에야 알게 된다.
    const state = await resolveResetLink(typeof body.token === "string" ? body.token : null);
    if (state.kind === "invalid") return NextResponse.json({ status: "invalid" }, { status: 400 });

    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";
    const fieldErrors: { password?: string; passwordConfirm?: string } = {};
    const passwordError = validatePassword(password);
    if (passwordError) fieldErrors.password = passwordError;
    if (!passwordConfirm) fieldErrors.passwordConfirm = "비밀번호를 한 번 더 입력해주세요.";
    else if (password !== passwordConfirm)
      fieldErrors.passwordConfirm = "비밀번호가 서로 다릅니다.";
    if (fieldErrors.password || fieldErrors.passwordConfirm) {
      return NextResponse.json({ error: "입력값을 확인해주세요.", fieldErrors }, { status: 400 });
    }

    const changed = await applyPasswordReset(state.account, await hashPassword(password));
    // 링크를 확인한 사이 다른 창에서 먼저 바꿨다. 이 링크는 이제 쓸 수 없다.
    if (!changed) return NextResponse.json({ status: "invalid" }, { status: 400 });

    const session = await createSession(state.account.id);
    const response = NextResponse.json({ status: "reset", username: state.account.username });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    console.error("[api/auth/password-reset/confirm]", error);
    return NextResponse.json({ error: "비밀번호를 바꾸지 못했습니다." }, { status: 500 });
  }
}
