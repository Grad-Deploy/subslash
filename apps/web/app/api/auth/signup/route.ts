import { NextRequest, NextResponse } from "next/server";
import { getEmailDomain, validateSignup } from "@subslash/shared";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { checkEmailDomain, emailDomainMessage } from "@lib/email-domain";
import { accounts } from "@lib/schema";
import { hashPassword } from "@lib/password";
import {
  SESSION_COOKIE,
  createSession,
  findConflicts,
  sessionCookieOptions,
  toPublicAccount,
} from "@lib/auth-server";

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

    // 형식만 맞으면 없는 도메인으로도 가입이 됐다. 오타 난 주소로 가입하면 그
    // 주소로는 아무것도 받을 수 없는데, 사용자는 그 사실을 알 방법이 없다.
    const domain = getEmailDomain(value.email);
    const domainCheck = await checkEmailDomain(domain);
    if (!domainCheck.ok) {
      const message = emailDomainMessage(domain, domainCheck.reason);
      if (domainCheck.reason === "unverifiable") {
        // 도메인이 틀렸다는 증거가 아니라 조회가 안 된 것이다. 입력 오류(400)가
        // 아니라 503으로 답하고, 원인은 로그에 남긴다.
        console.warn(`[api/auth/signup] 이메일 도메인 조회 실패 (${domainCheck.detail})`);
        return NextResponse.json(
          {
            error: "이메일 도메인을 확인하지 못해 가입을 멈췄습니다.",
            fieldErrors: { email: message },
          },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "입력값을 확인해주세요.", fieldErrors: { email: message } },
        { status: 400 },
      );
    }

    const conflicts = await findConflicts(value.username, value.email);
    if (conflicts.username || conflicts.email) {
      return NextResponse.json(
        {
          error: "이미 사용 중인 정보가 있습니다.",
          fieldErrors: {
            ...(conflicts.username ? { username: "이미 사용 중인 아이디입니다." } : {}),
            ...(conflicts.email ? { email: "이미 가입된 이메일입니다." } : {}),
          },
        },
        { status: 409 },
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

    const response = NextResponse.json({ account: toPublicAccount(account) }, { status: 201 });
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
