import { createHash, randomBytes } from "crypto";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { getDb } from "./db";
import { accounts, sessions, type Account } from "./schema";

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
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 로그인한 사람에게 돌려줄 수 있는 정보. 해시는 절대 포함하지 않는다. */
export interface PublicAccount {
  id: string;
  username: string;
  email: string;
  /** 선택 항목. 적지 않았으면 null. */
  age: number | null;
  /** 선택 항목. 적지 않았으면 null. */
  gender: string | null;
  createdAt: string;
}

export function toPublicAccount(account: Account): PublicAccount {
  return {
    id: account.id,
    username: account.username,
    email: account.email,
    age: account.age,
    gender: account.gender,
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
    tokenHash: hashSessionToken(token),
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
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, now)))
    .limit(1);

  return rows[0]?.account ?? null;
}

/** 로그아웃. 해당 세션 한 줄만 지운다 — 다른 기기의 로그인은 남는다. */
export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

/** 만료된 세션 정리. 실패해도 로그인 자체를 막지는 않는다. */
export async function pruneExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
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
 * '내 정보'의 선택 항목을 바꾼다. null을 넘기면 적지 않은 상태로 되돌린다.
 * 계정이 그사이 사라졌으면 `null`.
 */
export async function updateAccountProfile(
  accountId: string,
  profile: { age: number | null; gender: string | null },
): Promise<Account | null> {
  const db = getDb();
  const rows = await db
    .update(accounts)
    .set({ age: profile.age, gender: profile.gender })
    .where(eq(accounts.id, accountId))
    .returning();
  return rows[0] ?? null;
}

/** 이미 쓰이고 있는 아이디·이메일인지. 어느 쪽이 겹쳤는지까지 돌려준다. */
export async function findConflicts(
  username: string,
  email: string,
): Promise<{ username: boolean; email: boolean }> {
  const db = getDb();
  const rows = await db
    .select({ username: accounts.username, email: accounts.email })
    .from(accounts)
    .where(or(eq(accounts.username, username), eq(accounts.email, email)))
    .limit(2);

  return {
    username: rows.some((row) => row.username === username),
    email: rows.some((row) => row.email === email),
  };
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
