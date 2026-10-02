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
process.env.EMAIL_LINK_SECRET = "test-link-secret";
process.env.GOOGLE_OAUTH_CLIENT_ID = "gid";
process.env.GOOGLE_OAUTH_CLIENT_SECRET = "gsecret";
process.env.KAKAO_OAUTH_CLIENT_ID = "kid";

const { getDb, closeDb } = await import("../../lib/db");
const { accounts } = await import("../../lib/schema");
const { deleteAccount, createSession, SESSION_COOKIE } = await import("../../lib/auth-server");
const {
  resolveOAuthAccount,
  storeAppClaim,
  consumeAppClaim,
  linkedProviders,
  createLinkCode,
  verifyLinkCode,
  linkOAuthIdentity,
  unlinkOAuthIdentity,
} = await import("../../lib/oauth-accounts");
const { OAuthError, OAUTH_COOKIE, decodeFlow, s256 } = await import("../../lib/oauth");
const linkRoute = await import("../../app/api/auth/oauth/link/route");
const { GET: startRoute } = await import("../../app/api/auth/oauth/[provider]/start/route");
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

  it("거절할 때 제공자가 확인한 이메일이면 그 계정이 로그인하는 방법을 알려 준다", async () => {
    await resolveOAuthAccount("google", GOOGLE, { over14: true });
    const viaOf = async (profile: typeof GOOGLE) => {
      try {
        await resolveOAuthAccount("kakao", profile, { over14: true });
        return null;
      } catch (error) {
        return error instanceof OAuthError ? [error.code, ...error.via] : null;
      }
    };
    // 비밀번호가 없는 구글 가입 계정. "아이디와 비밀번호로 로그인"은 따를 수 없는 말이었다.
    expect(await viaOf({ ...GOOGLE, subject: "k-1" })).toEqual(["email-taken", "google"]);
    // 확인하지 않은 주소(네이버 등)로는 남의 주소가 어디로 가입했는지 알려 주지 않는다.
    expect(await viaOf({ ...GOOGLE, subject: "k-1", emailVerified: false })).toEqual([
      "email-taken",
    ]);
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

describe("로그인 방법 잇기", () => {
  async function passwordAccount() {
    const [account] = await getDb()
      .insert(accounts)
      .values({ username: "owner", email: "someone@gmail.com", passwordHash: "scrypt$x" })
      .returning();
    return account;
  }

  it("같은 이메일로 막혔던 제공자를 로그인한 계정에 이으면, 다음부터 그 제공자로 같은 계정에 들어간다", async () => {
    const owner = await passwordAccount();
    expect(await codeOf(resolveOAuthAccount("google", GOOGLE, { over14: true }))).toBe(
      "email-taken",
    );
    await linkOAuthIdentity(owner.id, "google", GOOGLE);
    const again = await resolveOAuthAccount("google", GOOGLE, { over14: false });
    expect(again.account.id).toBe(owner.id);
    expect(again.created).toBe(false);
    // 다른 이메일의 제공자 계정도 잇는다. 계정 이메일은 바뀌지 않는다.
    await linkOAuthIdentity(owner.id, "kakao", { subject: "k-9" });
    expect((await linkedProviders(owner.id)).sort()).toEqual(["google", "kakao"]);
  });

  it("다른 계정에 이어진 제공자 계정이나, 같은 회사의 두 번째 계정은 잇지 않는다", async () => {
    const owner = await passwordAccount();
    const { account: other } = await resolveOAuthAccount(
      "google",
      { subject: "g-other", email: "other@gmail.com", emailVerified: true },
      { over14: true },
    );
    expect(await codeOf(linkOAuthIdentity(owner.id, "google", { subject: "g-other" }))).toBe(
      "identity-taken",
    );
    expect(await linkedProviders(other.id)).toEqual(["google"]);

    await linkOAuthIdentity(owner.id, "google", GOOGLE);
    // 같은 계정을 다시 이으면 그대로 둔다.
    await linkOAuthIdentity(owner.id, "google", GOOGLE);
    expect(await codeOf(linkOAuthIdentity(owner.id, "google", { subject: "g-second" }))).toBe(
      "provider-linked",
    );
  });

  it("연결 코드는 그 제공자에만, 연결 상태가 바뀌기 전까지만 쓴다", async () => {
    const owner = await passwordAccount();
    const code = await createLinkCode(owner.id, "google");
    expect(await verifyLinkCode(code, "kakao")).toBeNull();
    expect(await verifyLinkCode(code, "google")).toBe(owner.id);
    await linkOAuthIdentity(owner.id, "google", GOOGLE);
    expect(await verifyLinkCode(code, "google")).toBeNull();
    expect(await verifyLinkCode(`${code}x`, "google")).toBeNull();
  });

  it("로그인할 방법이 하나뿐이면 끊지 않는다", async () => {
    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    expect(await unlinkOAuthIdentity(account.id, "google")).toBe("last-method");
    expect(await unlinkOAuthIdentity(account.id, "kakao")).toBe("not-linked");
    await linkOAuthIdentity(account.id, "kakao", { subject: "k-1" });
    expect(await unlinkOAuthIdentity(account.id, "google")).toBe("ok");
    expect(await linkedProviders(account.id)).toEqual(["kakao"]);

    const [owner] = await getDb()
      .insert(accounts)
      .values({ username: "owner2", email: "owner2@example.com", passwordHash: "scrypt$x" })
      .returning();
    await linkOAuthIdentity(owner.id, "google", { subject: "g-owner" });
    // 비밀번호가 있으면 마지막 제공자도 끊는다.
    expect(await unlinkOAuthIdentity(owner.id, "google")).toBe("ok");
  });

  it("웹에서는 이 브라우저에 로그인한 계정의 코드로만 연결을 시작한다", async () => {
    const owner = await passwordAccount();
    const session = await createSession(owner.id);
    const cookie = `${SESSION_COOKIE}=${session.token}`;
    const start = await linkRoute.POST(
      new NextRequest("http://localhost/api/auth/oauth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify({ provider: "google" }),
      }),
    );
    expect(start.status).toBe(200);
    const { path } = (await start.json()) as { path: string };
    const startUrl = `http://localhost${path}`;
    const params = () => ({ params: Promise.resolve({ provider: "google" }) });

    const signedIn = await startRoute(
      new NextRequest(startUrl, { headers: { Cookie: cookie } }),
      params(),
    );
    expect(signedIn.headers.get("location")).toContain("accounts.google.com");
    const flow = decodeFlow(signedIn.cookies.get(OAUTH_COOKIE)?.value);
    expect(flow?.link).toEqual({ accountId: owner.id, fromApp: false });

    // 남이 보낸 주소를 다른 계정(또는 로그아웃)으로 열면 시작하지 않는다.
    const stranger = await startRoute(new NextRequest(startUrl), params());
    expect(stranger.headers.get("location")).toContain("/me?oauthError=state");

    // 앱은 인앱 브라우저라 쿠키가 없다. 코드만 본다.
    const app = await startRoute(new NextRequest(`${startUrl}&client=app`), params());
    expect(decodeFlow(app.cookies.get(OAUTH_COOKIE)?.value)?.link).toEqual({
      accountId: owner.id,
      fromApp: true,
    });
  });

  it("목록은 로그인해야 보이고, 하나뿐인 방법은 끊기를 거절한다", async () => {
    const anonymous = await linkRoute.GET(new NextRequest("http://localhost/api/auth/oauth/link"));
    expect(anonymous.status).toBe(401);

    const { account } = await resolveOAuthAccount("google", GOOGLE, { over14: true });
    const session = await createSession(account.id);
    const cookie = { Cookie: `${SESSION_COOKIE}=${session.token}` };
    const list = await linkRoute.GET(
      new NextRequest("http://localhost/api/auth/oauth/link", { headers: cookie }),
    );
    expect(await list.json()).toMatchObject({ linked: ["google"], hasPassword: false });
    const unlink = await linkRoute.DELETE(
      new NextRequest("http://localhost/api/auth/oauth/link", {
        method: "DELETE",
        headers: { ...cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      }),
    );
    expect(unlink.status).toBe(409);
  });
});

describe("앱으로 돌아오기", () => {
  const params = (provider = "google") => ({ params: Promise.resolve({ provider }) });
  const CHALLENGE = s256("v".repeat(43));

  it("앱이 보낸 스킴을 흐름에 적고, 목록에 없는 스킴은 버린다", async () => {
    const start = (scheme: string) =>
      startRoute(
        new NextRequest(
          `http://localhost/api/auth/oauth/google/start?client=app&challenge=${CHALLENGE}&return=${scheme}`,
        ),
        params(),
      );
    const ours = await start("com.subslash.app.dev");
    expect(decodeFlow(ours.cookies.get(OAUTH_COOKIE)?.value)?.appReturn).toBe(
      "com.subslash.app.dev",
    );
    const theirs = await start("evil.app");
    expect(decodeFlow(theirs.cookies.get(OAUTH_COOKIE)?.value)?.appReturn).toBeNull();
  });

  it("앱에서 시작하자마자 실패해도 끝 화면에 돌아갈 앱을 싣는다", async () => {
    const res = await startRoute(
      new NextRequest(
        "http://localhost/api/auth/oauth/google/start?client=app&challenge=short&return=com.subslash.app",
      ),
      params(),
    );
    const location = new URL(res.headers.get("location") ?? "");
    expect(location.pathname).toBe("/oauth/done");
    expect(location.searchParams.get("oauthError")).toBe("state");
    expect(location.searchParams.get("app")).toBe("com.subslash.app");
  });
});
