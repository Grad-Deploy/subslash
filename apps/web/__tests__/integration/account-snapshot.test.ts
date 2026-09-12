import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 계정에 저장한 기록을 실제 SQLite에 대고 돌린다. 로그인해야만 닿는지, 틀린 기록을
 * 받지 않는지, 다른 계정의 기록에는 닿지 않는지, 계정이 지워지면 기록도 지워지는지 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, accountSnapshots } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession } = await import("../../lib/auth-server");
const { createBackup } = await import("../../lib/backup");
const { DEFAULT_EXCHANGE_RATE_SETTING } = await import("../../lib/exchange-rate");
const { MAX_SNAPSHOT_BYTES } = await import("../../lib/account-snapshot");
const { deleteUnverifiedAccount } = await import("../../lib/account-verification");
const { GET, PUT, DELETE } = await import("../../app/api/account/snapshot/route");

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

/** Next 라우트가 읽는 것은 url·headers·cookies·본문 뿐이다. */
function request(url: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
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

const URL_BASE = "http://localhost/api/account/snapshot";

function put(body: string, cookie?: string) {
  return PUT(request(URL_BASE, { method: "PUT", body, cookie }));
}

function get(cookie?: string, summary = false) {
  return GET(request(summary ? `${URL_BASE}?summary=1` : URL_BASE, { cookie }));
}

function del(cookie?: string) {
  return DELETE(request(URL_BASE, { method: "DELETE", cookie }));
}

function subscription(id: string, status: "active" | "killed" = "active") {
  return {
    id,
    name: `구독 ${id}`,
    amount: 17000,
    currency: "KRW" as const,
    billingDay: 15,
    billingCycle: "monthly" as const,
    category: "ott" as const,
    status,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...(status === "killed" ? { killedAt: "2026-05-01T00:00:00.000Z" } : {}),
  };
}

function backupText(subscriptionIds: string[], killedIds: string[] = []) {
  return JSON.stringify(
    createBackup({
      subscriptions: [
        ...subscriptionIds.map((id) => subscription(id)),
        ...killedIds.map((id) => subscription(id, "killed")),
      ],
      usageLogs: [
        {
          id: "log-1",
          subscriptionId: subscriptionIds[0] ?? "none",
          month: "2026-09",
          usageCount: 3,
          costPerUse: 5666,
          riskLevel: "yellow",
          checkedAt: "2026-09-01T00:00:00.000Z",
        },
      ],
      accounts: [],
      exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
    }),
  );
}

/** 계정을 만들고 그 계정으로 로그인한 쿠키를 돌려준다. 비밀번호 해시는 쓰지 않는 값이다. */
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

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => closeDb());

describe("계정에 저장한 기록", () => {
  it("로그인하지 않으면 읽지도, 쓰지도, 지우지도 못한다", async () => {
    expect((await get()).status).toBe(401);
    expect((await put(backupText(["a"]))).status).toBe(401);
    expect((await del()).status).toBe(401);
    expect(await getDb().select().from(accountSnapshots)).toHaveLength(0);
  });

  it("저장하면 요약을 돌려주고, 불러오면 같은 기록이 돌아온다", async () => {
    const { cookie } = await loggedIn("sean");
    const saved = await put(backupText(["a", "b"], ["c"]), cookie);
    expect(saved.status).toBe(200);
    expect((await saved.json()).summary).toMatchObject({
      subscriptionCount: 3,
      killedCount: 1,
      usageLogCount: 1,
      linkedAccountCount: 0,
    });

    const summaryOnly = await (await get(cookie, true)).json();
    expect(summaryOnly.summary.subscriptionCount).toBe(3);
    expect(summaryOnly.backup).toBeUndefined();

    const full = await (await get(cookie)).json();
    expect(full.backup.app).toBe("subslash");
    expect(full.backup.data.subscriptions.map((sub: { id: string }) => sub.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("저장된 기록이 없으면 404로 알린다", async () => {
    const { cookie } = await loggedIn("sean");
    const res = await get(cookie, true);
    expect(res.status).toBe(404);
    expect((await res.json()).status).toBe("none");
  });

  it("틀린 기록은 저장하지 않고, 전에 저장한 기록도 건드리지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    await put(backupText(["a"]), cookie);

    const notJson = await put("이건 JSON이 아니다", cookie);
    expect(notJson.status).toBe(400);

    const broken = JSON.parse(backupText(["b"]));
    broken.data.subscriptions[0].currency = "EUR";
    const wrongField = await put(JSON.stringify(broken), cookie);
    expect(wrongField.status).toBe(400);
    expect((await wrongField.json()).error).toContain("통화");

    const kept = await (await get(cookie, true)).json();
    expect(kept.summary.subscriptionCount).toBe(1);
  });

  it("너무 큰 기록은 저장하지 않는다", async () => {
    const { cookie } = await loggedIn("sean");
    const huge = JSON.parse(backupText(["a"]));
    huge.data.subscriptions[0].accountMemo = "가".repeat(MAX_SNAPSHOT_BYTES);
    const res = await put(JSON.stringify(huge), cookie);
    expect(res.status).toBe(413);
    expect(await getDb().select().from(accountSnapshots)).toHaveLength(0);
  });

  it("다시 저장하면 합치지 않고 통째로 바꾼다", async () => {
    const { cookie } = await loggedIn("sean");
    await put(backupText(["a", "b", "c"]), cookie);
    await put(backupText(["z"]), cookie);

    const full = await (await get(cookie)).json();
    expect(full.backup.data.subscriptions.map((sub: { id: string }) => sub.id)).toEqual(["z"]);
    expect(await getDb().select().from(accountSnapshots)).toHaveLength(1);
  });

  it("지우면 더 이상 불러올 수 없다", async () => {
    const { cookie } = await loggedIn("sean");
    await put(backupText(["a"]), cookie);

    expect(await (await del(cookie)).json()).toEqual({ status: "deleted" });
    expect((await get(cookie)).status).toBe(404);
    expect(await (await del(cookie)).json()).toEqual({ status: "none" });
  });

  it("다른 계정의 기록에는 닿지 않는다", async () => {
    const sean = await loggedIn("sean");
    const other = await loggedIn("other");
    await put(backupText(["seans-only"]), sean.cookie);

    expect((await get(other.cookie)).status).toBe(404);
    await del(other.cookie);
    expect((await get(sean.cookie, true)).status).toBe(200);
  });

  it("'제가 가입하지 않았어요'로 지운 계정의 기록도 함께 지운다", async () => {
    const { account, cookie } = await loggedIn("sean");
    await put(backupText(["a"]), cookie);

    expect(await deleteUnverifiedAccount(account.id)).toBe(true);
    expect(await getDb().select().from(accountSnapshots)).toHaveLength(0);
  });
});
