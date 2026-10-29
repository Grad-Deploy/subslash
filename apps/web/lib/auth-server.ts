import { DAY_MS } from "@subslash/shared";
import { randomBytes } from "crypto";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { getDb } from "./db";
import { sha256Hex } from "./tokens";
import { accounts, sessions, type Account } from "./schema";
import { NextResponse, type NextRequest } from "next/server";
import { isAppOrigin } from "./app-origins";
import { deleteAccountRecords } from "./account-data";
import { hasPassword } from "./password";

/**
 * 로그인 세션.
 *
 * 토큰은 브라우저 쿠키에만 있고 서버에는 SHA-256만 남는다. 알림 동기화
 * 토큰과 같은 규칙이다 — DB가 새더라도 거기 있는 값으로는 로그인할 수 없다.
 *
 * 이 파일의 모든 조회는 Drizzle 쿼리 빌더를 통해서만 나간다. 빌더는 값을
 * SQL 문자열에 이어 붙이지 않고 파라미터로 따로 보내므로, 입력에 무엇이
 * 들어있든 그것은 데이터일 뿐 실행되는 명령이 되지 않는다. 이 파일에
 * `sql.raw`나 문자열 조합으로 만든 쿼리를 추가하면 그 보장이 깨진다.
 */

export const SESSION_COOKIE = "subslash_session";
const SESSION_TTL_DAYS = 30;
const SESSION_TTL_MS = SESSION_TTL_DAYS * DAY_MS;

/** 로그인한 사람에게 돌려줄 수 있는 정보. 해시는 절대 포함하지 않는다. */
export interface PublicAccount {
  id: string;
  username: string;
  email: string;
  /** 확인 메일에서 본인이 맞다고 답했는지. 이 기능 전에 가입한 계정은 false다. */
  emailVerified: boolean;
  /**
   * 비밀번호로 로그인할 수 있는지. 소셜 로그인으로 가입한 계정은 비밀번호 재설정 메일로 만들기 전까지
   * false다 — 화면은 비밀번호 변경 대신 만드는 방법을, 회원 탈퇴에는 비밀번호 대신 확인 글자를 받는다.
   */
  hasPassword: boolean;
  createdAt: string;
}

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    emailVerified: account.emailVerifiedAt !== null,
    hasPassword: hasPassword(account.passwordHash),
    createdAt: account.createdAt,
  };
}

export interface IssuedSession {
  token: string;
  expiresAt: Date;
}

/** 새 세션을 만들고, 브라우저에 내려줄 토큰을 돌려준다. */
export async function createSession(accountId: string): Promise<IssuedSession> {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    accountId,
    tokenHash: sha256Hex(token),
    expiresAt: expiresAt.toISOString(),
  });

  return { token, expiresAt };
}

/**
 * 쿠키의 토큰으로 계정을 찾는다. 없거나 만료됐으면 `null`.
 *
 * 만료 판정은 DB에 맡긴다. 조회한 뒤 코드에서 비교하면, 만료된 세션이
 * 잠깐이라도 유효한 것처럼 통과할 여지가 생긴다.
 */
export async function getAccountBySessionToken(token: string | undefined): Promise<Account | null> {
  if (!token) return null;
  const db = getDb();
  const now = new Date().toISOString();

  const rows = await db
    .select({ account: accounts })
    .from(sessions)
    .innerJoin(accounts, eq(sessions.accountId, accounts.id))
    .where(and(eq(sessions.tokenHash, sha256Hex(token)), gt(sessions.expiresAt, now)))
    .limit(1);

  return rows[0]?.account ?? null;
}

/** 로그아웃. 해당 세션 한 줄만 지운다 — 다른 기기의 로그인은 남는다. */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, sha256Hex(token)));
}

/**
 * 비밀번호를 바꾸고, 이 계정으로 들어와 있던 기기를 모두 내보낸다. 확인할 때 본 해시가
 * 그사이 바뀌었으면(다른 창에서 먼저 바꿈) 아무것도 하지 않고 `false`.
 *
 * 해시가 그대로일 때만 바꾸므로 두 창에서 동시에 제출해도 한 번만 바뀐다. 세션을 모두
 * 지우는 이유는 비밀번호를 바꾸는 이유가 잊어서만은 아니기 때문이다 — 누가 알아냈을까
 * 봐 바꾸는 경우도 있다. 바꾼 사람의 기기는 부르는 쪽이 새 세션으로 이어 준다.
 */
export async function replacePassword(account: Account, newHash: string): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(accounts)
    .set({ passwordHash: newHash })
    .where(and(eq(accounts.id, account.id), eq(accounts.passwordHash, account.passwordHash)))
    .returning({ id: accounts.id });
  if (updated.length === 0) return false;
  await db.delete(sessions).where(eq(sessions.accountId, account.id));
  return true;
}

/**
 * 회원 탈퇴. 딸린 기록(`deleteAccountRecords`)을 먼저 지우고 계정을 지운다. 계정이 없었으면 `false`.
 */
export async function deleteAccount(accountId: string): Promise<boolean> {
  await deleteAccountRecords(accountId);
  const deleted = await getDb()
    .delete(accounts)
    .where(eq(accounts.id, accountId))
    .returning({ id: accounts.id });
  return deleted.length > 0;
}

/** 만료된 세션 정리. 실패해도 로그인 자체를 막지는 않는다. */
export async function pruneExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}

/**
 * 로그인을 마친 계정에 새 세션을 준다. 마지막 로그인 시각을 적고, 그 김에 만료된 세션을 치운다(청소가
 * 실패해도 로그인은 막지 않는다). 아이디·간편 로그인·카카오톡·앱 넘겨받기가 모두 이것으로 끝난다.
 * 계정이 그사이 지워졌으면 `null`.
 */
export async function startLoginSession(
  accountId: string,
): Promise<{ account: Account; session: IssuedSession } | null> {
  const [account] = await getDb()
    .update(accounts)
    .set({ lastLoginAt: new Date().toISOString() })
    .where(eq(accounts.id, accountId))
    .returning();
  if (!account) return null;
  await pruneExpiredSessions().catch(() => undefined);
  return { account, session: await createSession(account.id) };
}

/**
 * 아이디 또는 이메일로 계정을 찾는다.
 *
 * 두 값 모두 소문자로 정규화해 저장하므로, 찾을 때도 정규화된 값을 넘겨야 한다.
 */
export async function findAccountByIdentifier(identifier: string): Promise<Account | null> {
  if (!identifier) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(accounts)
    .where(or(eq(accounts.username, identifier), eq(accounts.email, identifier)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * 이미 쓰이고 있는 아이디·이메일인지. 어느 쪽이 겹쳤는지까지 돌려준다.
 *
 * 이메일이 겹친 계정이 아직 확인 전이면 `emailPending`이다. 그 주소의 주인이
 * 가입한 적이 없다면, 확인 메일을 받아 그 계정을 지우고 가입할 수 있다.
 */
export async function findConflicts(
  username: string,
  email: string,
): Promise<{ username: boolean; email: boolean; emailPending: boolean }> {
  const db = getDb();
  const rows = await db
    .select({
      username: accounts.username,
      email: accounts.email,
      emailVerifiedAt: accounts.emailVerifiedAt,
    })
    .from(accounts)
    .where(or(eq(accounts.username, username), eq(accounts.email, email)))
    .limit(2);

  const emailRow = rows.find((row) => row.email === email);
  return {
    username: rows.some((row) => row.username === username),
    email: Boolean(emailRow),
    emailPending: Boolean(emailRow) && emailRow?.emailVerifiedAt === null,
  };
}

/**
 * 요청에 실린 세션 토큰. 웹은 httpOnly 쿠키로, 앱(Capacitor)은 `Authorization: Bearer` 헤더로
 * 보낸다 — 앱의 화면은 다른 출처(https://localhost)에서 돌아 쿠키가 실리지 않는다. 둘 다
 * 있으면 쿠키를 쓴다.
 */
export function readSessionToken(request: NextRequest): string | undefined {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim() || undefined;
}

/** 요청을 보낸 계정. 로그인하지 않았거나 세션이 끝났으면 null이다. */
export function getRequestAccount(request: NextRequest): Promise<Account | null> {
  return getAccountBySessionToken(readSessionToken(request));
}

/** 로그인이 필요한 API가 로그인하지 않은 요청에 돌려주는 응답. */
export function loginRequiredResponse() {
  return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
}

/**
 * 앱에서 온 요청이면 응답 본문에 실을 세션 토큰. 웹 요청에는 빈 객체다 — 웹의 토큰은
 * 자바스크립트가 읽을 수 없는 쿠키에만 둔다. 출처(Origin) 헤더는 페이지의 스크립트가 바꿀 수
 * 없으므로, 웹 페이지가 앱인 척 토큰을 받아 갈 수 없다.
 */
export function sessionTokenForApp(
  request: NextRequest,
  session: IssuedSession,
): { sessionToken?: string; sessionExpiresAt?: string } {
  if (!isAppOrigin(request.headers.get("origin"))) return {};
  return { sessionToken: session.token, sessionExpiresAt: session.expiresAt.toISOString() };
}

/** 세션 쿠키의 공통 속성. 자바스크립트가 읽지 못하게 하고 교차 사이트 전송을 막는다. */
export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

/** 새 세션을 응답의 쿠키에 싣는다. 웹은 이 쿠키만으로 로그인한다. */
export function withSessionCookie<T extends NextResponse>(response: T, session: IssuedSession): T {
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return response;
}

/**
 * 로그인을 이어 주는 JSON 응답. 쿠키에 세션을 싣고, 앱에서 온 요청이면 본문에도 토큰을 싣는다
 * (`sessionTokenForApp`). 웹은 쿠키만 받는다.
 */
export function sessionJsonResponse(
  request: NextRequest,
  session: IssuedSession,
  body: Record<string, unknown>,
  init?: ResponseInit,
): NextResponse {
  return withSessionCookie(
    NextResponse.json({ ...body, ...sessionTokenForApp(request, session) }, init),
    session,
  );
}
