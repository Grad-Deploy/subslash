import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

/**
 * 구글·카카오·네이버로 로그인을 실제 SQLite에 대고 돌린다. 제공자와의 통신(fetchProfile)은 빼고,
 * 받은 프로필로 계정을 찾거나 만드는 규칙과 앱 넘겨받기를 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts } = await import("../../lib/schema");
const { deleteAccount } = await import("../../lib/auth-server");
const { resolveOAuthAccount, storeAppClaim, consumeAppClaim, linkedProviders } =
  await import("../../lib/oauth-accounts");
const { OAuthError, s256 } = await import("../../lib/oauth");
const { POST: loginRoute } = await import("../../app/api/auth/login/route");
const { POST: claimRoute } = await import("../../app/api/auth/oauth/claim/route");
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
  for (const { name } of existing) await db.run(`DROP TABLE IF EXISTS "${name}"` as never);
  await db.run(`PRAGMA foreign_keys = ON` as never);
  for (const migration of migrations) {
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await db.run(sql as never);
    }
  }
}

const GOOGLE = { subject: "g-123", email: "someone@gmail.com", emailVerified: true };

async function codeOf(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof OAuthError ? error.code : String(error);
  }
}

function appRequest(url: string, body: unknown, method = "POST") {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", Origin: "https://localhost" },
    body: JSON.stringify(body),
  });
}

beforeEach(resetDatabase);
afterAll(() => closeDb());

describe("resolveOAuthAccount", () => {
  it("처음이면 만 14세 확인을 받은 뒤 비밀번호 없는 계정을 만들고, 다음에는 같은 계정을 찾는다", async () => {
    expect(await codeOf(resolveOAuthAccount("google", GOOGLE, { over14: false }))).toBe("need-age");

    const first = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    expect(first.created).toBe(true);
    expect(first.account.email).toBe("someone@gmail.com");
    expect(first.account.username).toMatch(/^g_[a-z0-9]{10}$/);
    // 구글이 확인한 이메일이라 확인된 것으로 둔다.
    expect(first.account.emailVerifiedAt).not.toBeNull();
    expect(await linkedProviders(first.account.id)).toEqual(["google"]);

    const again = await resolveOAuthAccount("google", GOOGLE, { over14: false });
    expect(again).toMatchObject({ created: false, account: { id: first.account.id } });
  });

  it("제공자가 확인하지 않은 이메일은 확인 전으로 둔다(모름을 확인으로 읽지 않는다)", async () => {
    const { account } = await resolveOAuthAccount(
      "naver",
      { subject: "n-1", email: "someone@naver.com", emailVerified: false },
      { over14: true },
    );
    expect(account.emailVerifiedAt).toBeNull();
  });

  it("이메일이 없으면 만들지 않고, 같은 이메일의 계정이 있으면 잇지 않고 거절한다", async () => {
    expect(
      await codeOf(resolveOAuthAccount("kakao", { ...GOOGLE, email: null }, { over14: true })),
    ).toBe("no-email");

    await getDb().insert(accounts).values({
      username: "owner",
      email: "someone@gmail.com",
      passwordHash: "scrypt$x",
    });
    expect(await codeOf(resolveOAuthAccount("google", GOOGLE, { over14: true }))).toBe(
      "email-taken",
    );
  });

  it("소셜 로그인 계정에는 어떤 비밀번호로도 아이디 로그인이 되지 않는다", async () => {
    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    const res = await loginRoute(
      new NextRequest("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: account.username, password: "!no-password" }),
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("앱 넘겨받기", () => {
  const verifier = "v".repeat(43);

  it("verifier를 내민 앱 출처에 한 번만 세션을 준다", async () => {
    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    await storeAppClaim(s256(verifier), account.id);

    const web = await claimRoute(
      new NextRequest("http://localhost/api/auth/oauth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost" },
        body: JSON.stringify({ verifier }),
      }),
    );
    expect(web.status).toBe(403);

    const first = await claimRoute(
      appRequest("http://localhost/api/auth/oauth/claim", { verifier }),
    );
    expect(first.status).toBe(200);
    const body = await first.json();
    expect(body.sessionToken).toEqual(expect.any(String));
    expect(body.account.hasPassword).toBe(false);

    const second = await claimRoute(
      appRequest("http://localhost/api/auth/oauth/claim", { verifier }),
    );
    expect(second.status).toBe(404);
  });

  it("다른 verifier로는 가져가지 못한다", async () => {
    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    await storeAppClaim(s256(verifier), account.id);
    expect(await consumeAppClaim("w".repeat(43))).toBeNull();
    expect(await consumeAppClaim(verifier)).toBe(account.id);
  });
});

describe("회원 탈퇴", () => {
  it("비밀번호가 없는 계정은 확인 글자로 탈퇴하고, 연결도 함께 지운다", async () => {
    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    await storeAppClaim(s256("v".repeat(43)), account.id);
    const claim = await claimRoute(
      appRequest("http://localhost/api/auth/oauth/claim", { verifier: "v".repeat(43) }),
    );
    const { sessionToken } = await claim.json();

    const request = (body: unknown) =>
      new NextRequest("http://localhost/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(body),
      });
    expect((await deleteRoute(request({ confirmText: "아니요" }))).status).toBe(400);
    expect((await deleteRoute(request({ confirmText: "탈퇴" }))).status).toBe(200);

    expect(await linkedProviders(account.id)).toEqual([]);
    // 같은 구글 계정으로 다시 오면 새 계정이다.
    const again = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    expect(again.created).toBe(true);
    expect(await deleteAccount(again.account.id)).toBe(true);
  });
});
