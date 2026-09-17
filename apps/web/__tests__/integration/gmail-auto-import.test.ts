import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Gmail 자동 가져오기를 실제 SQLite(마이그레이션 전부 적용)에 대고 돌린다. 연결 토큰으로만 메일을
 * 받는지, 메일 제목·본문 없이 파싱 결과만 남는지, 다른 계정의 후보에 닿지 않는지, 끊기·탈퇴가
 * 남김없이 지우는지, 시작일 전에는 열리지 않는지 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;
process.env.NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN = "true";

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, gmailDiscoveries, gmailImportLinks } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession, deleteAccount } = await import("../../lib/auth-server");
const { deleteUnverifiedAccount } = await import("../../lib/account-verification");
const linkRoute = await import("../../app/api/gmail/link/route");
const ingestRoute = await import("../../app/api/gmail/ingest/route");
const discoveriesRoute = await import("../../app/api/gmail/discoveries/route");

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

function request(url: string, init: RequestInit & { cookie?: string; bearer?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.bearer) headers.set("authorization", `Bearer ${init.bearer}`);
  const req = new Request(url, { ...init, headers }) as Request & {
    nextUrl: URL;
    cookies: { get(name: string): { value: string } | undefined };
  };
  req.nextUrl = new URL(url);
  const jar = new Map<string, string>();
  for (const part of (init.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) jar.set(name, rest.join("="));
  }
  req.cookies = { get: (name) => (jar.has(name) ? { value: jar.get(name)! } : undefined) };
  return req as never;
}

const BASE = "http://localhost/api/gmail";

async function loggedIn(username: string, emailVerifiedAt: string | null = null) {
  const [account] = await getDb()
    .insert(accounts)
    .values({
      username,
      email: `${username}@gmail.com`,
      passwordHash: "scrypt$0$0$0$unused$unused",
      emailVerifiedAt,
    })
    .returning();
  const session = await createSession(account.id);
  return { account, cookie: `${SESSION_COOKIE}=${session.token}` };
}

async function issueToken(cookie: string): Promise<string> {
  const response = await linkRoute.POST(request(`${BASE}/link`, { method: "POST", cookie }));
  expect(response.status).toBe(200);
  return ((await response.json()) as { token: string }).token;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

function ingest(token: string | undefined, emails: unknown[]) {
  return ingestRoute.POST(
    request(`${BASE}/ingest`, {
      method: "POST",
      bearer: token,
      body: JSON.stringify({ v: 1, emails }),
    }),
  );
}

async function discoveries(cookie: string) {
  const response = await discoveriesRoute.GET(request(`${BASE}/discoveries`, { cookie }));
  return ((await response.json()) as { discoveries: Array<Record<string, unknown>> }).discoveries;
}

const NETFLIX = {
  from: "Netflix <info@account.netflix.com>",
  subject: "홍길동님, 넷플릭스 결제 안내",
  date: daysAgo(3),
  body: "결제 금액 : 17,000원\n회원님의 카드 끝자리 1234",
};
const UNKNOWN = {
  from: "Some Shop <billing@shop.example>",
  subject: "Your receipt",
  date: daysAgo(5),
  body: "Thanks for your payment ₩8,900",
};
const OLD_TVING = {
  from: "TVING <noreply@tving.com>",
  subject: "티빙 정기결제 안내",
  date: daysAgo(90),
  body: "결제금액 : 13,900원",
};
const CANCELED = {
  from: "Watcha <noreply@watcha.com>",
  subject: "왓챠 구독 해지 완료",
  date: daysAgo(2),
  body: "결제금액 : 7,900원",
};

beforeEach(async () => {
  process.env.NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN = "true";
  await resetDatabase();
});

afterAll(() => closeDb());

describe("Gmail 자동 가져오기", () => {
  it("로그인하지 않으면 연결 토큰을 받거나 후보를 읽을 수 없다", async () => {
    expect((await linkRoute.POST(request(`${BASE}/link`, { method: "POST" }))).status).toBe(401);
    expect((await discoveriesRoute.GET(request(`${BASE}/discoveries`))).status).toBe(401);
  });

  it("연결 토큰이 없거나 틀리면 메일을 받지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    await issueToken(cookie);

    expect((await ingest(undefined, [NETFLIX])).status).toBe(401);
    expect((await ingest("wrong-token", [NETFLIX])).status).toBe(401);
    expect(await getDb().select().from(gmailDiscoveries)).toHaveLength(0);
  });

  it("받은 메일에서 확실한 것과 확인할 것만 남기고, 메일 제목·본문은 저장하지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    const token = await issueToken(cookie);

    const response = await ingest(token, [NETFLIX, UNKNOWN, OLD_TVING, CANCELED]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: 4, candidates: 2 });

    const found = await discoveries(cookie);
    expect(found.map((d) => [d.name, d.amount, d.tier]).sort()).toEqual([
      ["넷플릭스", 17000, "auto"],
      ["알 수 없는 결제 (₩8,900)", 8900, "review"],
    ]);

    // 표에 남은 모든 칸을 이어 붙여도 메일 제목·본문의 흔적이 없다.
    const stored = JSON.stringify(await getDb().select().from(gmailDiscoveries));
    for (const fragment of ["홍길동", "카드 끝자리", "Your receipt", "Thanks for your payment"]) {
      expect(stored).not.toContain(fragment);
    }

    const [link] = await getDb().select().from(gmailImportLinks);
    expect(link.lastEmailCount).toBe(4);
    expect(link.lastIngestAt).not.toBeNull();
  });

  it("같은 서비스는 한 줄로 두고, 늦게 온 옛 메일이 최근 결과를 덮지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    const token = await issueToken(cookie);

    await ingest(token, [NETFLIX]);
    await ingest(token, [{ ...NETFLIX, date: daysAgo(20), body: "결제 금액 : 13,500원" }]);
    expect((await discoveries(cookie)).map((d) => d.amount)).toEqual([17000]);

    await ingest(token, [{ ...NETFLIX, date: daysAgo(1), body: "결제 금액 : 20,000원" }]);
    expect((await discoveries(cookie)).map((d) => d.amount)).toEqual([20000]);
  });

  it("받은 후보를 지우고, 다른 계정의 후보는 읽지도 지우지도 못한다", async () => {
    const sean = await loggedIn("sean");
    const other = await loggedIn("other");
    await ingest(await issueToken(sean.cookie), [NETFLIX, UNKNOWN]);

    expect(await discoveries(other.cookie)).toEqual([]);
    const ids = (await discoveries(sean.cookie)).map((d) => d.id as string);

    const foreign = await discoveriesRoute.DELETE(
      request(`${BASE}/discoveries`, {
        method: "DELETE",
        cookie: other.cookie,
        body: JSON.stringify({ ids }),
      }),
    );
    expect(await foreign.json()).toEqual({ deleted: 0 });

    const own = await discoveriesRoute.DELETE(
      request(`${BASE}/discoveries`, {
        method: "DELETE",
        cookie: sean.cookie,
        body: JSON.stringify({ ids: [ids[0]] }),
      }),
    );
    expect(await own.json()).toEqual({ deleted: 1 });
    expect(await discoveries(sean.cookie)).toHaveLength(1);
  });

  it("스크립트를 새로 받으면 예전 토큰은 거절된다", async () => {
    const { cookie } = await loggedIn("sean");
    const first = await issueToken(cookie);
    const second = await issueToken(cookie);

    expect((await ingest(first, [NETFLIX])).status).toBe(401);
    expect((await ingest(second, [NETFLIX])).status).toBe(200);
  });

  it("연결을 끊으면 후보까지 지우고, 그 뒤로 오는 메일은 거절한다", async () => {
    const { account, cookie } = await loggedIn("sean");
    const token = await issueToken(cookie);
    await ingest(token, [NETFLIX]);

    const response = await linkRoute.DELETE(request(`${BASE}/link`, { method: "DELETE", cookie }));
    expect(await response.json()).toEqual({ status: "deleted" });
    expect(await getDb().select().from(gmailDiscoveries)).toHaveLength(0);
    expect((await ingest(token, [NETFLIX])).status).toBe(401);

    const status = await linkRoute.GET(request(`${BASE}/link`, { cookie }));
    expect(await status.json()).toEqual({ open: true, linked: false });
    expect(account.id).toBeTruthy();
  });

  it("회원 탈퇴(두 경로 모두)는 연결과 후보를 직접 지운다", async () => {
    const verified = await loggedIn("sean", "2026-09-01T00:00:00.000Z");
    await ingest(await issueToken(verified.cookie), [NETFLIX]);
    expect(await deleteAccount(verified.account.id)).toBe(true);

    const unverified = await loggedIn("newbie");
    await ingest(await issueToken(unverified.cookie), [NETFLIX]);
    expect(await deleteUnverifiedAccount(unverified.account.id)).toBe(true);

    // PRAGMA foreign_keys에 기대지 않고 지웠는지 본다.
    await getDb().run(`PRAGMA foreign_keys = OFF` as never);
    expect(await getDb().select().from(gmailImportLinks)).toHaveLength(0);
    expect(await getDb().select().from(gmailDiscoveries)).toHaveLength(0);
  });

  it("형식이 틀린 본문은 400이고 아무것도 남기지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    const token = await issueToken(cookie);
    const bad = await ingestRoute.POST(
      request(`${BASE}/ingest`, { method: "POST", bearer: token, body: "{not json" }),
    );
    expect(bad.status).toBe(400);
    expect((await ingest(token, "nope" as unknown as unknown[])).status).toBe(400);
    expect(await getDb().select().from(gmailDiscoveries)).toHaveLength(0);
  });

  it("시작일 전에는 토큰 발급과 메일 받기가 닫혀 있고, 상태는 닫혔다고만 알린다", async () => {
    const { cookie } = await loggedIn("sean");
    const token = await issueToken(cookie);
    delete process.env.NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN;

    expect((await linkRoute.POST(request(`${BASE}/link`, { method: "POST", cookie }))).status).toBe(
      403,
    );
    expect((await ingest(token, [NETFLIX])).status).toBe(403);
    const status = await linkRoute.GET(request(`${BASE}/link`, { cookie }));
    expect(await status.json()).toEqual({ open: false });
    // 끊기는 시작일과 상관없이 된다.
    const disconnect = await linkRoute.DELETE(
      request(`${BASE}/link`, { method: "DELETE", cookie }),
    );
    expect(await disconnect.json()).toEqual({ status: "deleted" });
  });
});
