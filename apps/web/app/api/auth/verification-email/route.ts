import { NextRequest, NextResponse } from "next/server";
import { normalizeEmailAddress, validateEmail } from "@subslash/shared";
import { databaseUnavailableResponse } from "@lib/db";
import { SESSION_COOKIE, getAccountBySessionToken } from "@lib/auth-server";
import {
  describeSendOutcome,
  findAccountByEmail,
  sendAccountVerification,
} from "@lib/account-verification";

/**
 * 확인 메일 다시 보내기.
 *
 * 두 곳에서 부른다.
 * - '내 정보': 본문 없이 부르면 로그인한 계정의 주소로 보낸다.
 * - 가입 폼: 확인 전인 계정이 주소를 쥐고 있을 때 `{ email }`로 부른다. 주소의
 *   주인이 메일을 받아 '제가 가입하지 않았어요'로 그 계정을 지울 수 있게 한다.
 *
 * 어느 쪽이든 메일은 계정에 적힌 주소로만 간다. 요청한 사람이 받을 곳을 정할 수
 * 없으므로, 남에게 메일을 보내는 데 쓰려면 그 주소로 가입된 미확인 계정이 있어야
 * 하고, 그마저 주소마다 횟수가 제한된다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    const requestedEmail =
      body && typeof body.email === "string" ? normalizeEmailAddress(body.email) : "";

    let account;
    if (requestedEmail) {
      if (validateEmail(requestedEmail)) {
        return NextResponse.json({ error: "이메일 형식을 확인해주세요." }, { status: 400 });
      }
      account = await findAccountByEmail(requestedEmail);
      if (!account) {
        return NextResponse.json(
          { status: "no_account", message: "이 이메일로 가입한 계정이 없습니다." },
          { status: 404 },
        );
      }
    } else {
      account = await getAccountBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
      if (!account) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
      }
    }

    if (account.emailVerifiedAt) {
      return NextResponse.json(
        { status: "already_verified", message: "이미 확인된 이메일입니다." },
        { status: 409 },
      );
    }

    const outcome = await sendAccountVerification(account);
    const httpStatus =
      outcome.status === "sent"
        ? 200
        : outcome.status === "rate_limited"
          ? 429
          : outcome.reason === "not_configured"
            ? 503
            : 502;
    return NextResponse.json(
      { status: outcome.status, message: describeSendOutcome(outcome, account.email) },
      { status: httpStatus },
    );
  } catch (error) {
    console.error("[api/auth/verification-email]", error);
    return NextResponse.json({ error: "확인 메일을 보내지 못했습니다." }, { status: 500 });
  }
}
