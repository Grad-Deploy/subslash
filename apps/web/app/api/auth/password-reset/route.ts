import { NextRequest, NextResponse } from "next/server";
import { normalizeEmailAddress, validateEmail } from "@subslash/shared";
import { databaseUnavailableResponse } from "@lib/db";
import { findAccountByEmail } from "@lib/account-verification";
import { describeResetOutcome, sendPasswordReset } from "@lib/password-reset";

/**
 * 비밀번호 재설정 메일 요청. 본문: `{ email }`
 *
 * 메일은 계정에 적힌 주소로만 간다. 요청한 사람이 받을 곳을 정할 수 없으므로, 남의
 * 주소를 넣으면 그 주인에게 재설정 링크가 갈 뿐 요청한 사람은 아무것도 얻지 못한다.
 * 그마저 주소마다 횟수가 제한된다(가입 확인 메일과 합산).
 *
 * 가입된 주소가 아니면 그렇다고 말한다. 가입 폼이 이미 "이미 가입된 이메일"을 알려주므로
 * 여기서 숨겨도 가입 여부는 감춰지지 않고, 주소를 잘못 적은 사람만 오지 않을 메일을
 * 기다리게 된다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    const email = body && typeof body.email === "string" ? normalizeEmailAddress(body.email) : "";

    const formatError = validateEmail(email);
    if (formatError) {
      return NextResponse.json(
        { error: formatError, fieldErrors: { email: formatError } },
        { status: 400 },
      );
    }

    const account = await findAccountByEmail(email);
    if (!account) {
      return NextResponse.json(
        { status: "no_account", message: "이 이메일로 가입한 계정이 없습니다." },
        { status: 404 },
      );
    }

    const outcome = await sendPasswordReset(account);
    const httpStatus =
      outcome.status === "sent"
        ? 200
        : outcome.status === "rate_limited"
          ? 429
          : outcome.reason === "not_configured"
            ? 503
            : 502;
    return NextResponse.json(
      { status: outcome.status, message: describeResetOutcome(outcome, account.email) },
      { status: httpStatus },
    );
  } catch (error) {
    console.error("[api/auth/password-reset]", error);
    return NextResponse.json({ error: "재설정 메일을 보내지 못했습니다." }, { status: 500 });
  }
}
