import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

/**
 * '내 정보'의 비밀번호 변경을 실제 SQLite에 대고 돌린다.
 *
 * 확인하려는 것:
 * 1. 로그인 세션과 지금 비밀번호가 모두 맞아야 바꾼다.
 * 2. 바꾸면 옛 비밀번호로는 들어올 수 없고, 다른 기기의 로그인은 끊기며, 바꾼 기기만
 *    새 세션으로 이어진다.
 * 3. 재설정과 달리 이메일 확인 여부는 건드리지 않는다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession } = await import("../../lib/auth-server");
const { hashPassword } = await import("../../lib/password");

const { PUT: changeRoute } = await import("../../app/api/auth/password/route");
const { POST: loginRoute } = await import("../../app/api/auth/login/route");
const { GET: meRoute } = await import("../../app/api/auth/me/route");

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

/** scrypt는 일부러 느리다. 비밀번호를 여러 번 해시하는 테스트에 시간을 넉넉히 준다. */
const SCRYPT_TIMEOUT_MS = 60_000;

const USERNAME = "sean_lee";
const OLD_PASSWORD = "old-password-2026";
const NEW_PASSWORD = "new-password-2026";

/** 가입 라우트를 거치지 않고 만든다. 이메일은 확인 전으로 둔다. */
async function createAccount() {
  const [row] = await getDb()
    .insert(accounts)
    .values({
      username: USERNAME,
      email: "sean@gmail.com",
      passwordHash: await hashPassword(OLD_PASSWORD),
    })
    .returning();
  return row;
}

async function loginCookie(accountId: string): Promise<string> {
  const session = await createSession(accountId);
  return `${SESSION_COOKIE}=${session.token}`;
}

function change(
  body: { currentPassword?: unknown; password?: unknown; passwordConfirm?: unknown },
  init?: { cookie?: string; headers?: Record<string, string> },
) {
  return changeRoute(
    request("http://localhost/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: JSON.stringify(body),
      cookie: init?.cookie,
    }),
  );
}

async function accountOf(init: { cookie?: string; headers?: Record<string, string> }) {
  const res = await meRoute(
    request("http://localhost/api/auth/me", { cookie: init.cookie, headers: init.headers }),
  );
  return (await res.json()).account;
}

async function loginStatus(password: string): Promise<number> {
  const res = await loginRoute(
    request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: USERNAME, password }),
    }),
  );
  return res.status;
}

async function storedHash(): Promise<string | undefined> {
  const [row] = await getDb()
    .select({ hash: accounts.passwordHash })
    .from(accounts)
    .where(eq(accounts.username, USERNAME));
  return row?.hash;
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => closeDb());

describe("비밀번호 변경", () => {
  it("로그인하지 않으면 바꾸지 않는다", async () => {
    const res = await change({
      currentPassword: OLD_PASSWORD,
      password: NEW_PASSWORD,
      passwordConfirm: NEW_PASSWORD,
    });
    expect(res.status).toBe(401);
  });

  it(
    "지금 비밀번호가 비었거나 틀리면 바꾸지 않는다",
    async () => {
      const account = await createAccount();
      const cookie = await loginCookie(account.id);
      const before = await storedHash();

      const empty = await change(
        { currentPassword: "", password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD },
        { cookie },
      );
      expect(empty.status).toBe(400);
      expect((await empty.json()).fieldErrors.currentPassword).toBeTruthy();

      const wrong = await change(
        {
          currentPassword: "wrong-password-1",
          password: NEW_PASSWORD,
          passwordConfirm: NEW_PASSWORD,
        },
        { cookie },
      );
      expect(wrong.status).toBe(403);
      expect((await wrong.json()).fieldErrors.currentPassword).toBe(
        "지금 비밀번호가 맞지 않습니다.",
      );

      expect(await storedHash()).toBe(before);
      // 틀렸다고 로그인을 끊지는 않는다.
      expect(await accountOf({ cookie })).not.toBeNull();
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "새 비밀번호가 규칙에 맞지 않거나, 확인이 다르거나, 지금과 같으면 바꾸지 않는다",
    async () => {
      const account = await createAccount();
      const cookie = await loginCookie(account.id);
      const before = await storedHash();

      const short = await change(
        { currentPassword: OLD_PASSWORD, password: "short", passwordConfirm: "short" },
        { cookie },
      );
      expect(short.status).toBe(400);
      expect((await short.json()).fieldErrors.password).toBeTruthy();

      const mismatch = await change(
        {
          currentPassword: OLD_PASSWORD,
          password: NEW_PASSWORD,
          passwordConfirm: "other-password-2026",
        },
        { cookie },
      );
      expect(mismatch.status).toBe(400);
      expect((await mismatch.json()).fieldErrors.passwordConfirm).toBeTruthy();

      const same = await change(
        { currentPassword: OLD_PASSWORD, password: OLD_PASSWORD, passwordConfirm: OLD_PASSWORD },
        { cookie },
      );
      expect(same.status).toBe(400);
      expect((await same.json()).fieldErrors.password).toBe(
        "지금 비밀번호와 다른 비밀번호를 정해주세요.",
      );

      expect(await storedHash()).toBe(before);
    },
    SCRYPT_TIMEOUT_MS * 2,
  );

  it(
    "바꾸면 옛 비밀번호로는 들어올 수 없고, 다른 기기는 로그아웃되고, 이 기기는 새 세션으로 이어진다",
    async () => {
      const account = await createAccount();
      const thisDevice = await loginCookie(account.id);
      const otherDevice = await loginCookie(account.id);

      const res = await change(
        { currentPassword: OLD_PASSWORD, password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD },
        { cookie: thisDevice },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("changed");
      // 웹 요청에는 토큰을 본문에 싣지 않는다. 쿠키로만 받는다.
      expect(body.sessionToken).toBeUndefined();

      const raw = res.headers.get("set-cookie") ?? "";
      const token = raw.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`))?.[1] ?? "";
      expect(token).toBeTruthy();
      const newCookie = `${SESSION_COOKIE}=${token}`;

      // 옛 세션은 이 기기 것까지 모두 지워지고, 새 쿠키만 통한다.
      expect(await accountOf({ cookie: thisDevice })).toBeNull();
      expect(await accountOf({ cookie: otherDevice })).toBeNull();
      const me = await accountOf({ cookie: newCookie });
      expect(me?.username).toBe(USERNAME);
      // 재설정과 달리 메일을 거친 요청이 아니므로 이메일 확인 여부는 그대로다.
      expect(me?.emailVerified).toBe(false);

      expect(await loginStatus(OLD_PASSWORD)).toBe(401);
      expect(await loginStatus(NEW_PASSWORD)).toBe(200);
    },
    SCRYPT_TIMEOUT_MS * 2,
  );

  it(
    "앱에서 헤더 토큰으로 바꾸면 새 세션 토큰을 본문으로 받는다",
    async () => {
      const account = await createAccount();
      const session = await createSession(account.id);
      const appHeaders = {
        Origin: "https://localhost",
        Authorization: `Bearer ${session.token}`,
      };

      const res = await change(
        { currentPassword: OLD_PASSWORD, password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD },
        { headers: appHeaders },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.sessionToken).toBe("string");

      expect(await accountOf({ headers: appHeaders })).toBeNull();
      const me = await accountOf({ headers: { Authorization: `Bearer ${body.sessionToken}` } });
      expect(me?.username).toBe(USERNAME);
    },
    SCRYPT_TIMEOUT_MS * 2,
  );
});
