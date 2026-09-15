import { NextRequest, NextResponse } from "next/server";
import { validatePassword } from "@subslash/shared";
import { databaseUnavailableResponse } from "@lib/db";
import { hashPassword, verifyPassword } from "@lib/password";
import {
  SESSION_COOKIE,
  createSession,
  getAccountBySessionToken,
  readSessionToken,
  replacePassword,
  sessionCookieOptions,
  sessionTokenForApp,
} from "@lib/auth-server";

type FieldErrors = { currentPassword?: string; password?: string; passwordConfirm?: string };

/**
 * '내 정보'의 비밀번호 변경. 본문: `{ currentPassword, password, passwordConfirm }`
 *
 * 바꿀 계정은 요청 본문이 아니라 로그인 세션으로만 정하고, 지금 비밀번호를 한 번 더 받는다.
 * 로그인한 채 자리를 비운 사이 다른 사람이 바꾸면 주인이 자기 계정에서 쫓겨난다.
 *
 * 바꾸고 나면 재설정과 같이 모든 기기의 로그인을 끊고, 이 브라우저는 새 세션으로 이어 준다.
 * 이메일 확인 여부는 건드리지 않는다 — 재설정과 달리 메일을 거쳐 온 요청이 아니다.
 */
export async function PUT(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";

    if (!currentPassword) {
      const message = "지금 비밀번호를 입력해주세요.";
      return NextResponse.json(
        { error: message, fieldErrors: { currentPassword: message } },
        { status: 400 },
      );
    }
    // 지금 비밀번호부터 본다. 틀린 채로 새 비밀번호 규칙을 먼저 알려주면, 고쳐 보내도
    // 결국 바꿀 수 없다는 것을 한 번 더 제출한 뒤에야 알게 된다.
    if (!(await verifyPassword(currentPassword, account.passwordHash))) {
      const message = "지금 비밀번호가 맞지 않습니다.";
      return NextResponse.json(
        { error: message, fieldErrors: { currentPassword: message } },
        { status: 403 },
      );
    }

    const fieldErrors: FieldErrors = {};
    const passwordError = validatePassword(password);
    if (passwordError) fieldErrors.password = passwordError;
    else if (password === currentPassword)
      fieldErrors.password = "지금 비밀번호와 다른 비밀번호를 정해주세요.";
    if (!passwordConfirm) fieldErrors.passwordConfirm = "비밀번호를 한 번 더 입력해주세요.";
    else if (password !== passwordConfirm)
      fieldErrors.passwordConfirm = "비밀번호가 서로 다릅니다.";
    if (fieldErrors.password || fieldErrors.passwordConfirm) {
      return NextResponse.json({ error: "입력값을 확인해주세요.", fieldErrors }, { status: 400 });
    }

    const changed = await replacePassword(account, await hashPassword(password));
    // 확인한 사이 다른 창에서 먼저 바꿨다. 그때 이 기기의 로그인도 함께 끊겼다.
    if (!changed) {
      return NextResponse.json(
        { error: "다른 곳에서 비밀번호가 먼저 바뀌었습니다. 새 비밀번호로 다시 로그인해주세요." },
        { status: 409 },
      );
    }

    const session = await createSession(account.id);
    // 앱에서 온 요청이면 본문에도 토큰을 싣는다(sessionTokenForApp). 웹은 쿠키만 받는다.
    const response = NextResponse.json({
      status: "changed",
      ...sessionTokenForApp(request, session),
    });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    console.error("[api/auth/password]", error);
    return NextResponse.json(
      { error: "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
