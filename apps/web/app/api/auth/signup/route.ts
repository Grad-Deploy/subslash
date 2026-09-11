import { NextRequest, NextResponse } from "next/server";
import { validateSignup } from "@subslash/shared";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { accounts } from "@lib/schema";
import { hashPassword } from "@lib/password";
import {
  SESSION_COOKIE,
  createSession,
  findConflicts,
  sessionCookieOptions,
  toPublicAccount,
} from "@lib/auth-server";
import {
  describeSendOutcome,
  sendAccountVerification,
  verificationWaitSeconds,
} from "@lib/account-verification";

/**
 * 회원가입.
 *
 * 화면에서 이미 검사한 값이라도 서버가 다시 전부 검사한다. 폼을 거치지 않고
 * 이 엔드포인트를 직접 부르는 요청이 있기 때문이다. 저장에 쓰는 값은
 * `validateSignup`이 돌려준 정규화된 것뿐이고, 요청 본문의 문자열이 DB로
 * 곧장 흘러가는 경로는 없다.
 *
 * 모든 조회·삽입은 Drizzle 쿼리 빌더로만 나간다. 값은 SQL 문자열에 이어
 * 붙지 않고 파라미터로 분리돼 전달되므로, 입력에 따옴표나 `--`, `DROP TABLE`
 * 이 들어있어도 그것은 한 칸의 데이터로 저장될 뿐 명령이 되지 않는다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }

    const { errors, value } = validateSignup(body);
    if (!value) {
      return NextResponse.json(
        { error: "입력값을 확인해주세요.", fieldErrors: errors },
        { status: 400 },
      );
    }

    // 이메일 도메인은 validateSignup이 자주 쓰는 메일 서비스 목록으로 거른다.
    // 예전에는 DNS로 "메일을 받는 도메인"인지만 봐서 `exampl.com` 같은 오타가
    // 통과했고, DNS 조회가 흔들리면 멀쩡한 gmail 가입까지 503으로 막혔다.

    const conflicts = await findConflicts(value.username, value.email);
    if (conflicts.username || conflicts.email) {
      return NextResponse.json(
        {
          error: "이미 사용 중인 정보가 있습니다.",
          fieldErrors: {
            ...(conflicts.username ? { username: "이미 사용 중인 아이디입니다." } : {}),
            ...(conflicts.email
              ? {
                  email: conflicts.emailPending
                    ? "확인을 기다리는 계정이 있는 이메일입니다."
                    : "이미 가입된 이메일입니다.",
                }
              : {}),
          },
          // 확인 전인 계정이 이 주소를 쥐고 있다. 주소의 주인이라면 확인 메일을 받아
          // '제가 가입하지 않았어요'로 그 계정을 지우고 가입할 수 있다.
          emailPending: conflicts.emailPending,
        },
        { status: 409 },
      );
    }

    // 이 주소로 확인 메일이 방금 나갔다면 가입부터 멈춘다. '제가 가입하지
    // 않았어요'로 지워진 계정을 곧바로 다시 만들어, 주소의 주인에게 확인 메일을
    // 거듭 보내는 일을 막는다.
    const wait = await verificationWaitSeconds(value.email);
    if (wait > 0) {
      const message = describeSendOutcome(
        { status: "rate_limited", retryAfterSeconds: wait },
        value.email,
      );
      return NextResponse.json(
        { error: message, fieldErrors: { email: message } },
        { status: 429 },
      );
    }

    // 평문 비밀번호는 여기서 해시로 바뀌고, 그 뒤로는 어디에도 남지 않는다.
    const passwordHash = await hashPassword(value.password);

    // 나이·성별은 가입 때 받지 않는다. 가입 뒤 '내 정보'에서 원할 때만 적는다.
    const db = getDb();
    const inserted = await db
      .insert(accounts)
      .values({
        username: value.username,
        email: value.email,
        passwordHash,
      })
      .returning();

    const account = inserted[0];
    const session = await createSession(account.id);

    // 확인 메일은 가입이 끝난 뒤에 보낸다. 보내지 못해도 가입은 되돌리지 않고,
    // 보냈는지를 그대로 알린다 — 오지 않을 메일을 기다리게 하지 않기 위해서다.
    const outcome = await sendAccountVerification(account);

    const response = NextResponse.json(
      {
        account: toPublicAccount(account),
        emailVerification: {
          status: outcome.status,
          message: describeSendOutcome(outcome, account.email),
        },
      },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    // 유니크 인덱스가 막은 경우 — 동시에 같은 아이디로 두 번 가입한 상황이다.
    if (error instanceof Error && /UNIQUE constraint failed/i.test(error.message)) {
      return NextResponse.json({ error: "이미 사용 중인 정보가 있습니다." }, { status: 409 });
    }
    console.error("[api/auth/signup]", error);
    return NextResponse.json({ error: "가입을 처리하지 못했습니다." }, { status: 500 });
  }
}
