import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

/**
 * 비밀번호 재설정을 실제 SQLite에 대고 돌린다.
 *
 * Resend 호출은 fetch를 가로채 받은편지함(outbox)에 쌓는다. 링크를 여는 것만으로
 * 무엇이 바뀌지 않는지, 한 번 쓴 링크가 다시 통하지 않는지, 옛 비밀번호와 옛 세션이
 * 정말 끊기는지를 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
process.env.EMAIL_LINK_SECRET = "test-link-secret";
process.env.RESEND_API_KEY = "re_test_key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
delete process.env.CRON_SECRET;
delete process.env.TURSO_AUTH_TOKEN;

interface SentMail {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

const outbox: SentMail[] = [];

vi.stubGlobal(
  "fetch",
  vi.fn(async (_url: unknown, init?: RequestInit) => {
    outbox.push(JSON.parse(String(init?.body)));
    return new Response('{"id":"mail"}', { status: 200 });
  }),
);

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, sessions, verificationMailLog } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession, getAccountBySessionToken } =
  await import("../../lib/auth-server");
const { hashPassword } = await import("../../lib/password");
const { signLink, emailFingerprint, passwordFingerprint } = await import("../../lib/tokens");

const { POST: requestRoute } = await import("../../app/api/auth/password-reset/route");
const { GET: linkStateRoute, POST: confirmRoute } =
  await import("../../app/api/auth/password-reset/confirm/route");
const { POST: loginRoute } = await import("../../app/api/auth/login/route");

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
  await db.run(`PRAGMA foreign_keys = ON` as never);

  for (const migration of migrations) {
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await db.run(sql as never);
    }
  }
}

/** Next 라우트가 읽는 것은 url·headers·cookies·json 뿐이다. */
function request(url: string, init?: RequestInit) {
  const req = new Request(url, init) as Request & {
    nextUrl: URL;
    cookies: { get(name: string): { value: string } | undefined };
  };
  req.nextUrl = new URL(url);
  req.cookies = { get: () => undefined };
  return req as never;
}

function post(url: string, body: unknown) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** scrypt는 일부러 느리다. 비밀번호를 여러 번 해시하는 테스트에 시간을 넉넉히 준다. */
const SCRYPT_TIMEOUT_MS = 60_000;

const USERNAME = "sean_lee";
const EMAIL = "sean@gmail.com";
const OLD_PASSWORD = "old-password-2026";
const NEW_PASSWORD = "new-password-2026";

/** 가입 라우트를 거치지 않고 만든다. 가입은 확인 메일을 보내 주소별 한도를 쓴다. */
async function createAccount() {
  const [row] = await getDb()
    .insert(accounts)
    .values({ username: USERNAME, email: EMAIL, passwordHash: await hashPassword(OLD_PASSWORD) })
    .returning();
  return row;
}

function requestReset(email: unknown) {
  return requestRoute(post("http://localhost/api/auth/password-reset", { email }));
}

/** 가장 최근 재설정 메일에 든 링크의 토큰. */
function lastResetToken(): string {
  const text = outbox.at(-1)?.text ?? "";
  const match = text.match(/\/reset-password\?token=(\S+)/);
  if (!match) throw new Error("재설정 메일에 링크가 없습니다.");
  return decodeURIComponent(match[1]);
}

async function linkState(token: string) {
  const res = await linkStateRoute(
    request(`http://localhost/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`),
  );
  return res.json();
}

function confirm(token: string, password = NEW_PASSWORD, passwordConfirm = password) {
  return confirmRoute(
    post("http://localhost/api/auth/password-reset/confirm", { token, password, passwordConfirm }),
  );
}

async function loginStatus(password: string): Promise<number> {
  const res = await loginRoute(
    post("http://localhost/api/auth/login", { identifier: USERNAME, password }),
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
  outbox.length = 0;
  process.env.RESEND_API_KEY = "re_test_key";
  await resetDatabase();
});

afterAll(() => closeDb());

describe("재설정 메일 요청", () => {
  it(
    "계정에 적힌 주소로 보내고, 링크는 /reset-password를 연다",
    async () => {
      await createAccount();
      const res = await requestReset(EMAIL);
      expect(res.status).toBe(200);
      expect((await res.json()).status).toBe("sent");

      expect(outbox).toHaveLength(1);
      expect(outbox[0].to).toEqual([EMAIL]);
      expect(outbox[0].subject).toContain("비밀번호");
      expect(outbox[0].text).toContain(USERNAME);
      expect(lastResetToken()).toBeTruthy();
      expect(await getDb().select().from(verificationMailLog)).toHaveLength(1);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("가입하지 않은 주소면 보내지 않고, 그렇다고 알린다", async () => {
    const res = await requestReset("nobody@gmail.com");
    expect(res.status).toBe(404);
    expect((await res.json()).status).toBe("no_account");
    expect(outbox).toHaveLength(0);
  });

  it("형식이 틀린 주소는 조회하지 않는다", async () => {
    const res = await requestReset("not-an-email");
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.email).toBeTruthy();
    expect(outbox).toHaveLength(0);
  });

  it(
    "가입 확인 메일과 한도를 함께 쓴다 — 방금 확인 메일을 보낸 주소로는 1분 안에 보내지 않는다",
    async () => {
      await createAccount();
      await getDb()
        .insert(verificationMailLog)
        .values({ email: EMAIL, sentAt: new Date().toISOString() });

      const res = await requestReset(EMAIL);
      expect(res.status).toBe(429);
      expect((await res.json()).status).toBe("rate_limited");
      expect(outbox).toHaveLength(0);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "메일 발송이 설정되지 않은 서버는 보냈다고 하지 않고, 한도 기록도 남기지 않는다",
    async () => {
      await createAccount();
      delete process.env.RESEND_API_KEY;

      const res = await requestReset(EMAIL);
      expect(res.status).toBe(503);
      expect((await res.json()).status).toBe("not_sent");
      expect(await getDb().select().from(verificationMailLog)).toHaveLength(0);
    },
    SCRYPT_TIMEOUT_MS,
  );
});

describe("재설정 링크", () => {
  it(
    "여는 것만으로는 아무것도 바꾸지 않는다",
    async () => {
      await createAccount();
      await requestReset(EMAIL);
      const before = await storedHash();

      expect(await linkState(lastResetToken())).toEqual({
        status: "valid",
        username: USERNAME,
        email: EMAIL,
      });
      expect(await storedHash()).toBe(before);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "새 비밀번호로 바꾸면 옛 비밀번호와 다른 기기의 로그인이 끊기고, 이메일이 확인된다",
    async () => {
      const account = await createAccount();
      const otherDevice = await createSession(account.id);
      await requestReset(EMAIL);

      const res = await confirm(lastResetToken());
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: "reset", username: USERNAME });
      // 바꾼 브라우저는 새 세션으로 로그인된다.
      expect(res.headers.get("set-cookie") ?? "").toContain(`${SESSION_COOKIE}=`);

      expect(await getAccountBySessionToken(otherDevice.token)).toBeNull();
      expect(
        await getDb().select().from(sessions).where(eq(sessions.accountId, account.id)),
      ).toHaveLength(1);

      const [after] = await getDb().select().from(accounts).where(eq(accounts.id, account.id));
      expect(after.emailVerifiedAt).not.toBeNull();

      expect(await loginStatus(OLD_PASSWORD)).toBe(401);
      expect(await loginStatus(NEW_PASSWORD)).toBe(200);
    },
    SCRYPT_TIMEOUT_MS * 2,
  );

  it(
    "한 번 쓴 링크는 다시 쓸 수 없다",
    async () => {
      await createAccount();
      await requestReset(EMAIL);
      const token = lastResetToken();

      expect((await confirm(token)).status).toBe(200);
      expect(await linkState(token)).toEqual({ status: "invalid" });

      const again = await confirm(token, "another-password-1");
      expect(again.status).toBe(400);
      expect(await again.json()).toEqual({ status: "invalid" });
      expect(await loginStatus("another-password-1")).toBe(401);
    },
    SCRYPT_TIMEOUT_MS * 3,
  );

  it(
    "비밀번호 규칙이나 확인 칸이 맞지 않으면 바꾸지 않고, 링크는 계속 쓸 수 있다",
    async () => {
      await createAccount();
      await requestReset(EMAIL);
      const token = lastResetToken();
      const before = await storedHash();

      const short = await confirm(token, "short");
      expect(short.status).toBe(400);
      expect((await short.json()).fieldErrors.password).toBeTruthy();

      const mismatch = await confirm(token, NEW_PASSWORD, "different-password-2026");
      expect(mismatch.status).toBe(400);
      expect((await mismatch.json()).fieldErrors.passwordConfirm).toBeTruthy();

      expect(await storedHash()).toBe(before);
      expect((await linkState(token)).status).toBe("valid");
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "다른 용도의 링크, 만료된 링크, 위조된 링크는 받지 않는다",
    async () => {
      const account = await createAccount();
      const resetPayload = {
        uid: account.id,
        act: "reset-password" as const,
        em: emailFingerprint(EMAIL),
        pw: passwordFingerprint(account.passwordHash),
      };
      const verifyAccount = signLink(
        { uid: account.id, act: "verify-account", em: emailFingerprint(EMAIL) },
        3600,
      );
      const expired = signLink(resetPayload, -10);
      const valid = signLink(resetPayload, 3600);
      const forged = valid.slice(0, -1) + (valid.endsWith("A") ? "B" : "A");

      for (const token of [verifyAccount, expired, forged, "garbage"]) {
        expect(await linkState(token)).toEqual({ status: "invalid" });
      }
      expect((await confirm(verifyAccount)).status).toBe(400);
      expect(await loginStatus(OLD_PASSWORD)).toBe(200);
      // 같은 값으로 제대로 서명한 링크는 통한다 — 위의 거절이 서명·용도·만료 때문임을 보인다.
      expect((await linkState(valid)).status).toBe("valid");
    },
    SCRYPT_TIMEOUT_MS * 2,
  );

  it(
    "링크를 보낸 뒤 계정의 주소가 바뀌었으면 받지 않는다",
    async () => {
      const account = await createAccount();
      await requestReset(EMAIL);
      const token = lastResetToken();

      await getDb()
        .update(accounts)
        .set({ email: "other@gmail.com" })
        .where(eq(accounts.id, account.id));
      expect(await linkState(token)).toEqual({ status: "invalid" });
    },
    SCRYPT_TIMEOUT_MS,
  );
});
