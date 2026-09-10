import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import { SESSION_COOKIE, getAccountBySessionToken, toPublicAccount } from "@lib/auth-server";

/**
 * 지금 로그인된 계정.
 *
 * 로그인은 선택 기능이라, 계정이 없는 것은 오류가 아니다. 401 대신
 * `account: null`을 200으로 돌려주어 화면이 "로그인 안 됨"을 평범한
 * 상태로 다루게 한다.
 */
export async function GET(request: NextRequest) {
  // DB가 없는 배포에서는 계정이라는 개념 자체가 없다. 503으로 실패시키면
  // 헤더가 오류 상태가 되는데, 실제로는 그냥 "로그인 안 됨"이 맞다.
  if (!isDatabaseConfigured()) return NextResponse.json({ account: null });

  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const account = await getAccountBySessionToken(token);
    return NextResponse.json({ account: account ? toPublicAccount(account) : null });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return NextResponse.json({ account: null });
  }
}
