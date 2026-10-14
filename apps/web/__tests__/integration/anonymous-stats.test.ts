import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join as joinPath } from "path";

/**
 * 그만둔 익명 구독 통계를 실제 SQLite로 돌린다(ANONYMOUS_STATS_ENDED_ON). 새 요약과 요약 읽기는 받지 않고,
 * 참여했던 기기는 자기 기록을 지울 수 있으며, 크론은 남은 기록을 모두 지운다.
 */
process.env.TURSO_DATABASE_URL = ":memory:";
process.env.NEXT_PUBLIC_ANONYMOUS_STATS_TEST_OPEN = "true";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, statsContributors, statsItems } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession } = await import("../../lib/auth-server");
const { resetAllRateLimits } = await import("../../lib/rate-limit");
const { createContribution, deleteAllContributions } = await import("../../lib/stats-server");
const { isAnonymousStatsEnded } = await import("../../lib/privacy");
const contributionRoute = await import("../../app/api/stats/contribution/route");
const { GET: summaryRoute } = await import("../../app/api/stats/summary/route");

const migrationsDir = joinPath(process.cwd(), "drizzle");
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(joinPath(migrationsDir, file), "utf-8"));

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

/** 요청을 보낸 사람. 로그인한 사람의 세션 쿠키, 또는 로그인하지 않았으면 null. */
let cookie: string | null = null;

async function login() {
  const [account] = await getDb()
    .insert(accounts)
    .values({
      username: "stats",
      email: "stats@gmail.com",
      passwordHash: "scrypt$0$0$0$unused$unused",
      emailVerifiedAt: new Date().toISOString(),
    })
    .returning();
  const session = await createSession(account.id);
  cookie = `${SESSION_COOKIE}=${session.token}`;
}

function request(
  method: string,
  body?: unknown,
  token?: string,
  ip = "10.0.0.1",
  tokenHeader = "x-stats-token",
) {
  const headers = new Headers({ "Content-Type": "application/json", "x-forwarded-for": ip });
  if (token) headers.set(tokenHeader, tokenHeader === "authorization" ? `Bearer ${token}` : token);
  if (cookie) headers.set("cookie", cookie);
  const req = new Request("http://localhost/api/stats/contribution", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as Request & { cookies: { get(name: string): { value: string } | undefined } };
  const sessionToken = cookie?.slice(`${SESSION_COOKIE}=`.length);
  req.cookies = {
    get: (name) => (name === SESSION_COOKIE && sessionToken ? { value: sessionToken } : undefined),
  };
  return req as never;
}

const contribution = (monthly: number, usage: number | null = 4) => ({
  v: 1,
  totalMonthlyKRW: monthly,
  activeCount: 2,
  items: [{ presetId: "netflix", monthlyKRW: 17000, usageCount: usage }],
});

beforeEach(async () => {
  await resetDatabase();
  resetAllRateLimits();
  cookie = null;
  await login();
});

afterAll(() => closeDb());

describe("그만둔 익명 구독 통계", () => {
  it("그만둔 날부터는 테스트 스위치가 켜져 있어도 닫혀 있다", () => {
    expect(isAnonymousStatsEnded()).toBe(true);
  });

  it("새 요약과 갱신을 받지 않고, 그만뒀다고 답한다", async () => {
    const token = await createContribution(contribution(30000) as never);
    const fresh = await contributionRoute.POST(request("POST", contribution(30000)));
    expect(fresh.status).toBe(410);
    expect(await fresh.json()).toEqual({ error: "그만둔 기능입니다." });
    const update = await contributionRoute.POST(request("POST", contribution(52000), token));
    expect(update.status).toBe(410);
    const [row] = await getDb().select().from(statsContributors);
    expect(row.totalMonthlyKrw).toBe(30000);
  });

  it("요약도 보여 주지 않는다", async () => {
    const response = await summaryRoute();
    expect(response.status).toBe(410);
  });

  it("참여했던 기기는 로그인하지 않아도 자기 기록을 지울 수 있다", async () => {
    const token = await createContribution(contribution(30000) as never);
    cookie = null;
    const response = await contributionRoute.DELETE(request("DELETE", undefined, token));
    expect(response.status).toBe(200);
    expect(await getDb().select().from(statsContributors)).toHaveLength(0);
    expect(await getDb().select().from(statsItems)).toHaveLength(0);
  });

  it("크론이 남은 기록을 모두 지운다", async () => {
    await createContribution(contribution(30000) as never);
    await createContribution(contribution(12000) as never);
    expect(await deleteAllContributions()).toBe(2);
    expect(await getDb().select().from(statsContributors)).toHaveLength(0);
    expect(await getDb().select().from(statsItems)).toHaveLength(0);
  });
});
