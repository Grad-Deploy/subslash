import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { validateLogin } from "@subslash/shared";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { accounts } from "@lib/schema";
import { hashPassword, needsRehash, verifyPassword } from "@lib/password";
import {
  SESSION_COOKIE,
  createSession,
  findAccountByIdentifier,
  pruneExpiredSessions,
  sessionCookieOptions,
  sessionTokenForApp,
  toPublicAccount,
} from "@lib/auth-server";
import {
  clientIp,
  hit,
  reset,
  retryAfterSeconds,
  tooManyRequestsMessage,
  type RateLimitRule,
} from "@lib/rate-limit";
import { logError } from "@lib/log";

/**
 * 비밀번호 대입을 늦춘다. 실패만 센다 — 제대로 로그인하는 사람은 막히지 않는다. 아이디 기준은 한
 * 계정을 노리는 것을, IP 기준은 여러 계정을 번갈아 노리는 것을 막는다. 계정을 잠그지 않고 잠시
 * 기다리게 할 뿐이라, 남이 일부러 틀려도 주인은 곧 다시 들어올 수 있다.
 */
const FAILURES_PER_ACCOUNT: RateLimitRule = { limit: 10, windowMs: 15 * 60 * 1000 };
const FAILURES_PER_IP: RateLimitRule = { limit: 30, windowMs: 15 * 60 * 1000 };

/**
 * 아이디(또는 이메일) + 비밀번호로 로그인.
 *
 * 실패 메시지는 언제나 같다. "그런 아이디는 없습니다"와 "비밀번호가 틀렸습니다"
 * 를 나눠 알려주면, 그것만으로 어떤 아이디가 가입돼 있는지 훑어낼 수 있다.
 *
 * 저장된 값은 단방향 해시라 되돌릴 수 없다. 확인은 입력한 비밀번호를 같은
 * 방식으로 해시해 비교하는 방향으로만 이뤄진다.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }

    const { errors, value } = validateLogin(body);
    if (!value) {
      return NextResponse.json(
        { error: "입력값을 확인해주세요.", fieldErrors: errors },
        { status: 400 },
      );
    }

    const accountKey = `login:account:${value.identifier.trim().toLowerCase()}`;
    const ipKey = `login:ip:${clientIp(request.headers)}`;
    const wait = Math.max(
      retryAfterSeconds(accountKey, FAILURES_PER_ACCOUNT),
      retryAfterSeconds(ipKey, FAILURES_PER_IP),
    );
    if (wait > 0) {
      return NextResponse.json(
        { error: tooManyRequestsMessage(wait) },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }

    const account = await findAccountByIdentifier(value.identifier);

    // 계정이 없어도 해시 계산을 한 번 수행한다. 없는 아이디만 빨리 실패하면
    // 응답 시간 차이로 가입 여부가 드러난다.
    const storedHash =
      account?.passwordHash ??
      "scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const ok = await verifyPassword(value.password, storedHash);

    if (!account || !ok) {
      hit(accountKey, FAILURES_PER_ACCOUNT);
      hit(ipKey, FAILURES_PER_IP);
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    reset(accountKey);
    const db = getDb();

    // 해시 비용을 올린 뒤라면, 평문을 손에 쥔 이 순간이 다시 해시할 유일한 기회다.
    if (needsRehash(account.passwordHash)) {
      const upgraded = await hashPassword(value.password);
      await db.update(accounts).set({ passwordHash: upgraded }).where(eq(accounts.id, account.id));
    }

    await db
      .update(accounts)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(accounts.id, account.id));

    await pruneExpiredSessions().catch(() => {
      // 청소가 실패해도 로그인은 막지 않는다.
    });

    const session = await createSession(account.id);
    // 앱에서 온 요청이면 본문에도 토큰을 싣는다(sessionTokenForApp). 웹은 쿠키만 받는다.
    const response = NextResponse.json({
      account: toPublicAccount(account),
      ...sessionTokenForApp(request, session),
    });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    logError("api/auth/login", error);
    return NextResponse.json({ error: "로그인을 처리하지 못했습니다." }, { status: 500 });
  }
}
