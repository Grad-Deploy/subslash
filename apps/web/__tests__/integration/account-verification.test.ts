import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

/**
 * 가입 이메일 확인을 실제 SQLite에 대고 돌린다.
 *
 * Resend 호출은 fetch를 가로채 받은편지함(outbox)에 쌓는다. 그래서 "보냈다"는
 * 응답이 실제 발송 요청과 짝지어지는지, 링크를 여는 것만으로 무엇이 바뀌지는
 * 않는지, 같은 주소로 메일이 몇 통까지 나가는지를 볼 수 있다.
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
let resendStatus = 200;

vi.stubGlobal(
  "fetch",
  vi.fn(async (_url: unknown, init?: RequestInit) => {
    outbox.push(JSON.parse(String(init?.body)));
    return new Response(resendStatus === 200 ? '{"id":"mail"}' : "rejected", {
      status: resendStatus,
    });
  }),
);

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, sessions, verificationMailLog } = await import("../../lib/schema");
const { SESSION_COOKIE } = await import("../../lib/auth-server");
const { signLink, emailFingerprint } = await import("../../lib/tokens");

const { POST: signupRoute } = await import("../../app/api/auth/signup/route");
const { GET: meRoute } = await import("../../app/api/auth/me/route");
const { GET: linkStateRoute, POST: decideRoute } =
  await import("../../app/api/auth/verify-email/route");
const { POST: resendRoute } = await import("../../app/api/auth/verification-email/route");

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

function post(url: string, body: unknown, cookie?: string) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cookie,
  });
}

/** scrypt는 일부러 느리다. 가입을 여러 번 하는 테스트에만 시간을 넉넉히 준다. */
const SCRYPT_TIMEOUT_MS = 60_000;

const VALID_SIGNUP = {
  username: "sean_lee",
  email: "sean@gmail.com",
  password: "subslash-2026!",
  passwordConfirm: "subslash-2026!",
  isOver14: true,
};

async function signup(overrides: Record<string, unknown> = {}) {
  const res = await signupRoute(
    post("http://localhost/api/auth/signup", { ...VALID_SIGNUP, ...overrides }),
  );
  const raw = res.headers.get("set-cookie") ?? "";
  const token = raw.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`))?.[1] ?? "";
  return { res, body: await res.json(), cookie: `${SESSION_COOKIE}=${token}` };
}

/** 가장 최근 확인 메일에 든 링크의 토큰. */
function lastLinkToken(): string {
  const text = outbox.at(-1)?.text ?? "";
  const match = text.match(/\/verify-email\?token=(\S+)/);
  if (!match) throw new Error("확인 메일에 링크가 없습니다.");
  return decodeURIComponent(match[1]);
}

function linkState(token: string) {
  return linkStateRoute(
    request(`http://localhost/api/auth/verify-email?token=${encodeURIComponent(token)}`),
  );
}

function decide(token: string, decision: "confirm" | "decline") {
  return decideRoute(post("http://localhost/api/auth/verify-email", { token, decision }));
}

function resend(body: unknown, cookie?: string) {
  return resendRoute(post("http://localhost/api/auth/verification-email", body, cookie));
}

async function onlyAccount() {
  const rows = await getDb().select().from(accounts);
  expect(rows).toHaveLength(1);
  return rows[0];
}

/** 확인 메일 발송 기록을 `ms`만큼 과거로 민다. 쿨다운을 기다리지 않고 넘기기 위해서다. */
async function ageMailLog(ms: number) {
  const db = getDb();
  for (const row of await db.select().from(verificationMailLog)) {
    await db
      .update(verificationMailLog)
      .set({ sentAt: new Date(Date.parse(row.sentAt) - ms).toISOString() })
      .where(eq(verificationMailLog.id, row.id));
  }
}

async function withEnv<T>(changes: Record<string, string | undefined>, run: () => Promise<T>) {
  const saved = Object.fromEntries(Object.keys(changes).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

beforeEach(async () => {
  outbox.length = 0;
  resendStatus = 200;
  await resetDatabase();
});

afterAll(() => {
  closeDb();
  vi.unstubAllGlobals();
});

describe("가입하면 확인 메일을 보낸다", () => {
  it("계정 주소로 보내고, 계정은 미확인으로 시작한다", async () => {
    const { res, body } = await signup();

    expect(res.status).toBe(201);
    expect(body.account.emailVerified).toBe(false);
    expect(body.emailVerification.status).toBe("sent");
    expect(body.emailVerification.message).toContain("sean@gmail.com");
    expect(body.emailVerification.message).toContain("스팸함");

    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toEqual(["sean@gmail.com"]);
    // 받는 사람이 무엇을 확인해주는지 알 수 있게 아이디를 보여준다.
    expect(outbox[0].text).toContain("sean_lee");
    expect((await onlyAccount()).emailVerifiedAt).toBeNull();
  });

  it("Resend 키가 없으면 가입은 되고, 보내지 못했다고 알린다", async () => {
    const { res, body } = await withEnv({ RESEND_API_KEY: undefined }, () => signup());

    expect(res.status).toBe(201);
    expect(body.emailVerification.status).toBe("not_sent");
    expect(body.emailVerification.message).toContain("설정돼 있지 않아");
    expect(outbox).toHaveLength(0);
  });

  it("서명 키가 없어도 가입이 500이 되지 않는다", async () => {
    // 알림을 쓰지 않는 배포에서는 EMAIL_LINK_SECRET·CRON_SECRET이 모두 선택 사항이다.
    const { res, body } = await withEnv({ EMAIL_LINK_SECRET: undefined }, () => signup());

    expect(res.status).toBe(201);
    expect(body.emailVerification.status).toBe("not_sent");
    expect(outbox).toHaveLength(0);
  });

  it("Resend가 거절하면 보냈다고 하지 않고, 발송 횟수에도 세지 않는다", async () => {
    resendStatus = 422;
    const { res, body } = await signup();

    expect(res.status).toBe(201);
    expect(body.emailVerification.status).toBe("not_sent");
    expect(body.emailVerification.message).toContain("보내지 못했습니다");
    expect(await getDb().select().from(verificationMailLog)).toHaveLength(0);
  });
});

describe("확인 링크", () => {
  it("링크를 여는 것만으로는 확인되지 않는다", async () => {
    // 메일 검사기가 링크를 먼저 열어봐도 결정이 나지 않아야 한다.
    await signup();
    const res = await linkState(lastLinkToken());

    expect(await res.json()).toEqual({
      status: "pending",
      username: "sean_lee",
      email: "sean@gmail.com",
    });
    expect((await onlyAccount()).emailVerifiedAt).toBeNull();
  });

  it("'맞아요'를 누르면 확인되고, 현재 계정 조회에 보인다", async () => {
    const { cookie } = await signup();

    const res = await decide(lastLinkToken(), "confirm");
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("verified");

    const me = await meRoute(request("http://localhost/api/auth/me", { cookie }));
    expect((await me.json()).account.emailVerified).toBe(true);
  });

  it("'제가 가입하지 않았어요'를 누르면 계정과 로그인이 모두 지워진다", async () => {
    const { cookie } = await signup();
    const token = lastLinkToken();

    const res = await decide(token, "decline");
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("declined");

    expect(await getDb().select().from(accounts)).toHaveLength(0);
    expect(await getDb().select().from(sessions)).toHaveLength(0);
    const me = await meRoute(request("http://localhost/api/auth/me", { cookie }));
    expect((await me.json()).account).toBeNull();

    // 같은 링크를 다시 열면 계정이 없다고 말한다.
    expect((await (await linkState(token)).json()).status).toBe("gone");
  });

  it("확인된 계정은 남아 있던 링크로 지울 수 없다", async () => {
    await signup();
    const token = lastLinkToken();
    await decide(token, "confirm");

    const res = await decide(token, "decline");
    expect(res.status).toBe(409);
    expect((await onlyAccount()).emailVerifiedAt).not.toBeNull();
  });

  it("알림용 확인 링크로는 같은 id의 계정이 확인되지 않는다", async () => {
    await signup();
    const account = await onlyAccount();
    const notifyToken = signLink({ uid: account.id, act: "verify" }, 3600);

    const res = await decide(notifyToken, "confirm");
    expect(res.status).toBe(400);
    expect((await onlyAccount()).emailVerifiedAt).toBeNull();
  });

  it("서명이 틀리거나 만료된 링크는 거부한다", async () => {
    await signup();
    const account = await onlyAccount();
    const expired = signLink(
      { uid: account.id, act: "verify-account", em: emailFingerprint(account.email) },
      -1,
    );

    for (const token of ["forged.signature", expired]) {
      const res = await decide(token, "confirm");
      expect(res.status).toBe(400);
      expect((await res.json()).status).toBe("invalid");
    }
    expect((await onlyAccount()).emailVerifiedAt).toBeNull();
  });

  it("주소가 바뀐 뒤에는 옛 주소로 보낸 링크가 새 주소를 확인하지 못한다", async () => {
    await signup();
    const token = lastLinkToken();
    await getDb().update(accounts).set({ email: "changed@naver.com" });

    const res = await decide(token, "confirm");
    expect(res.status).toBe(400);
    expect((await onlyAccount()).emailVerifiedAt).toBeNull();
  });
});

describe("같은 주소로 보내는 확인 메일 수", () => {
  it("1분 안에는 다시 보내지 않는다", async () => {
    const { cookie } = await signup();

    const res = await resend({}, cookie);
    expect(res.status).toBe(429);
    // 막 보낸 직후라 남은 시간은 60초 안팎이다 — "59초 뒤" 또는 "1분 뒤".
    expect((await res.json()).message).toMatch(/(\d+초|1분) 뒤/);
    expect(outbox).toHaveLength(1);

    await ageMailLog(2 * 60 * 1000);
    const later = await resend({}, cookie);
    expect(later.status).toBe(200);
    expect(outbox).toHaveLength(2);
  });

  it("24시간 동안 5통을 넘기지 않는다", async () => {
    const { cookie } = await signup();
    const db = getDb();
    await ageMailLog(2 * 60 * 60 * 1000);
    for (const hoursAgo of [3, 4, 5, 6]) {
      await db.insert(verificationMailLog).values({
        email: "sean@gmail.com",
        sentAt: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
      });
    }

    const res = await resend({}, cookie);
    expect(res.status).toBe(429);
    expect((await res.json()).message).toMatch(/\d+시간 뒤/);

    // 가장 오래된 한 통이 24시간 창을 벗어나면 다시 보낼 수 있다.
    await ageMailLog(20 * 60 * 60 * 1000);
    const later = await resend({}, cookie);
    expect(later.status).toBe(200);
  });

  it(
    "지워진 계정을 곧바로 다시 만들어 같은 주소로 메일을 거듭 보낼 수 없다",
    async () => {
      await signup();
      await decide(lastLinkToken(), "decline");

      const again = await signup();
      expect(again.res.status).toBe(429);
      expect(again.body.fieldErrors.email).toMatch(/뒤에 다시 보낼 수 있습니다/);
      expect(await getDb().select().from(accounts)).toHaveLength(0);
      expect(outbox).toHaveLength(1);

      await ageMailLog(2 * 60 * 1000);
      const later = await signup();
      expect(later.res.status).toBe(201);
      expect(outbox).toHaveLength(2);
    },
    SCRYPT_TIMEOUT_MS,
  );
});

describe("가입하려는 주소를 확인 전인 계정이 쥐고 있을 때", () => {
  it(
    "그렇다고 알리고, 그 주소로 확인 메일을 받아 계정을 지운 뒤 가입할 수 있다",
    async () => {
      await signup();
      await ageMailLog(2 * 60 * 1000);

      const blocked = await signup({ username: "real_owner" });
      expect(blocked.res.status).toBe(409);
      expect(blocked.body.emailPending).toBe(true);
      expect(blocked.body.fieldErrors.email).toContain("확인을 기다리는");

      // 로그인하지 않은 사람이 주소를 대고 요청해도, 메일은 계정에 적힌 주소로만 간다.
      const res = await resend({ email: "SEAN@gmail.com" });
      expect(res.status).toBe(200);
      expect(outbox.at(-1)?.to).toEqual(["sean@gmail.com"]);
      // 누가 이 주소를 썼는지(먼저 가입한 아이디)를 보여준다.
      expect(outbox.at(-1)?.text).toContain("sean_lee");

      await decide(lastLinkToken(), "decline");
      await ageMailLog(2 * 60 * 1000);
      const owner = await signup({ username: "real_owner" });
      expect(owner.res.status).toBe(201);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "확인된 계정의 주소면 확인 메일을 보내지 않는다",
    async () => {
      await signup();
      await decide(lastLinkToken(), "confirm");

      const blocked = await signup({ username: "someone_else" });
      expect(blocked.res.status).toBe(409);
      expect(blocked.body.emailPending).toBe(false);
      expect(blocked.body.fieldErrors.email).toBe("이미 가입된 이메일입니다.");

      const res = await resend({ email: "sean@gmail.com" });
      expect(res.status).toBe(409);
      expect(outbox).toHaveLength(1);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("가입된 계정이 없는 주소로는 보내지 않는다", async () => {
    const res = await resend({ email: "nobody@gmail.com" });
    expect(res.status).toBe(404);
    expect(outbox).toHaveLength(0);
  });

  it("주소도 로그인도 없으면 401이다", async () => {
    const res = await resend({});
    expect(res.status).toBe(401);
  });
});
