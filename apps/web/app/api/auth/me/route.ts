import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import { getRequestAccount, toPublicAccount } from "@lib/auth-server";
import { serverErrorResponse } from "@lib/route-error";

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
    const account = await getRequestAccount(request);
    return NextResponse.json({ account: account ? toPublicAccount(account) : null });
  } catch (error) {
    // 계정 없음(200)으로 답하지 않는다. 화면은 그 답을 로그아웃으로 받아 기록을 비로그인 칸으로 바꾼다 —
    // DB가 잠깐 아플 때 로그인한 사람의 기록이 화면에서 사라졌다.
    // 세션 확인을 막은 것(없는 토큰을 많이 내민 IP)은 429다 — 어느 쪽이든 화면은 알던 상태를 그대로 둔다.
    return serverErrorResponse("api/auth/me", error, "database_unavailable", 503);
  }
}
