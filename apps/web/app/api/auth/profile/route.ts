import { NextRequest, NextResponse } from "next/server";
import { validateProfile } from "@subslash/shared";
import { databaseUnavailableResponse } from "@lib/db";
import {
  SESSION_COOKIE,
  getAccountBySessionToken,
  toPublicAccount,
  updateAccountProfile,
} from "@lib/auth-server";

/**
 * '내 정보' 저장. 나이·성별 두 값을 통째로 바꾼다 — 비워서 보내면 지운다.
 *
 * 둘 다 선택 항목이라, 가입 때 묻지 않는 대신 여기서 원할 때만 적는다.
 * 바꿀 계정은 요청 본문이 아니라 세션 쿠키로만 정한다. 본문에 다른 계정의
 * id를 넣어도 그 계정에는 닿지 않는다.
 */
export async function PUT(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!account) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }

    const { errors, value } = validateProfile(body);
    if (!value) {
      return NextResponse.json(
        { error: "입력값을 확인해주세요.", fieldErrors: errors },
        { status: 400 },
      );
    }

    const updated = await updateAccountProfile(account.id, value);
    if (!updated) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    return NextResponse.json({ account: toPublicAccount(updated) });
  } catch (error) {
    console.error("[api/auth/profile]", error);
    return NextResponse.json({ error: "내 정보를 저장하지 못했습니다." }, { status: 500 });
  }
}
