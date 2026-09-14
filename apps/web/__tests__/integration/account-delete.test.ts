import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

/**
 * 회원 탈퇴를 실제 SQLite에 대고 돌린다.
 *
 * 확인하려는 것:
 * 1. 세션과 비밀번호가 모두 맞아야 지운다.
 * 2. 계정과 딸린 행(세션·계정에 저장한 기록)을 직접 지운다 — ON DELETE CASCADE는
 *    PRAGMA foreign_keys가 꺼져 있으면 동작하지 않는다.
 * 3. 다른 계정은 건드리지 않는다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accountSnapshots, accounts, sessions } = await import("../../lib/schema");
const { SESSION_COOKIE } = await import("../../lib/auth-server");

const { POST: signupRoute } = await import("../../app/api/auth/signup/route");
const { GET: meRoute } = await import("../../app/api/auth/me/route");
const { DELETE: deleteRoute } = await import("../../app/api/auth/account/route");

const migrationsDir = join(process.cwd(), "drizzle");
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), "utf-8"));

async function resetDatabase() {
  const db = getDb();
  const existing = (await db.all(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'` as never,
  )) as unknown as Array<{ name: string }>;
  await db.run(`PRAGMA foreign_keys = OFF` as never);
  for (const { name } of existing) {
    await db.run(`DROP TABLE IF EXISTS "${name}"` as never);
  }
  for (const migration of migrations) {
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await db.run(sql as never);
    }
  }
  // 운영 DB처럼 외래키를 꺼 둔 채로 둔다. 딸린 행을 직접 지우는지 보려는 것이다.
}

/** Next 라우트가 읽는 것은 url·headers·cookies·json 뿐이다. */
function request(url: string, init?: RequestInit & { cookie?: string }) {
  const headers = new Headers(init?.headers);
  if (init?.cookie) headers.set("cookie", init.cookie);
  const req = new Request(url, { ...init, headers }) as Request & {
    nextUrl: URL;
    cookies: { get(name: string): { value: string } | undefined };
  };
  req.nextUrl = new URL(url);
  const jar = new Map<string, string>();
  for (const part of (init?.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) jar.set(name, rest.join("="));
  }
  req.cookies = { get: (name) => (jar.has(name) ? { value: jar.get(name)! } : undefined) };
  return req as never;
}

const SCRYPT_TIMEOUT_MS = 60_000;

async function signup(username: string, email: string) {
  const res = await signupRoute(
    request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: "subslash-2026!",
        passwordConfirm: "subslash-2026!",
        isOver14: true,
      }),
    }),
  );
  expect(res.status).toBe(201);
  const raw = res.headers.get("set-cookie") ?? "";
  const token = raw.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`))?.[1] ?? "";
  const body = await res.json();
  return { id: body.account.id as string, cookie: `${SESSION_COOKIE}=${token}` };
}

function deleteAccountRequest(password: unknown, cookie?: string) {
  return deleteRoute(
    request("http://localhost/api/auth/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cookie,
    }),
  );
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => {
  closeDb();
});

describe("회원 탈퇴", () => {
  it("로그인하지 않으면 지우지 않는다", async () => {
    const res = await deleteAccountRequest("subslash-2026!");
    expect(res.status).toBe(401);
  });

  it(
    "비밀번호가 비었거나 틀리면 지우지 않는다",
    async () => {
      const me = await signup("sean_lee", "sean@gmail.com");

      expect((await deleteAccountRequest("", me.cookie)).status).toBe(400);
      expect((await deleteAccountRequest("wrong-password-1!", me.cookie)).status).toBe(403);

      const rows = await getDb().select().from(accounts).where(eq(accounts.id, me.id));
      expect(rows).toHaveLength(1);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "계정과 세션·계정에 저장한 기록을 지우고, 다른 계정은 그대로 둔다",
    async () => {
      const me = await signup("sean_lee", "sean@gmail.com");
      const other = await signup("other_one", "other@gmail.com");
      const db = getDb();
      for (const accountId of [me.id, other.id]) {
        await db.insert(accountSnapshots).values({
          accountId,
          payload: "{}",
          subscriptionCount: 0,
          savedAt: new Date().toISOString(),
        });
      }

      const res = await deleteAccountRequest("subslash-2026!", me.cookie);
      expect(res.status).toBe(200);
      // 쿠키도 함께 만료시킨다.
      expect(res.headers.get("set-cookie") ?? "").toMatch(new RegExp(`${SESSION_COOKIE}=;`));

      expect(await db.select().from(accounts).where(eq(accounts.id, me.id))).toHaveLength(0);
      expect(await db.select().from(sessions).where(eq(sessions.accountId, me.id))).toHaveLength(0);
      expect(
        await db.select().from(accountSnapshots).where(eq(accountSnapshots.accountId, me.id)),
      ).toHaveLength(0);

      // 지운 계정의 옛 쿠키로는 더 이상 로그인 상태가 아니다.
      const meRes = await meRoute(request("http://localhost/api/auth/me", { cookie: me.cookie }));
      expect((await meRes.json()).account).toBeNull();

      // 다른 계정은 그대로다.
      expect(await db.select().from(accounts).where(eq(accounts.id, other.id))).toHaveLength(1);
      expect(await db.select().from(sessions).where(eq(sessions.accountId, other.id))).toHaveLength(
        1,
      );
      expect(
        await db.select().from(accountSnapshots).where(eq(accountSnapshots.accountId, other.id)),
      ).toHaveLength(1);
    },
    SCRYPT_TIMEOUT_MS * 2,
  );
});
