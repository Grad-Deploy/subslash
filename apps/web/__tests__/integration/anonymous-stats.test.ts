import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join as joinPath } from "path";

/**
 * 익명 구독 통계를 실제 SQLite로 돌린다: 참여 → 갱신 → 요약 → 그만두기 → 오래된 기록 정리.
 * 보내기는 로그인한 사람만 된다.
 */
process.env.TURSO_DATABASE_URL = ":memory:";
process.env.NEXT_PUBLIC_ANONYMOUS_STATS_TEST_OPEN = "true";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, statsContributors, statsItems } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession } = await import("../../lib/auth-server");
const { resetAllRateLimits } = await import("../../lib/rate-limit");
const { pruneStaleContributions } = await import("../../lib/stats-server");
const { STATS_MIN_PARTICIPANTS, STATS_MIN_PER_SERVICE } = await import("../../lib/stats");
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

async function participate(body: unknown, ip = "10.0.0.1"): Promise<string> {
  const response = await contributionRoute.POST(request("POST", body, undefined, ip));
  expect(response.status).toBe(201);
  return ((await response.json()) as { token: string }).token;
}

async function summary() {
  const response = await summaryRoute();
  expect(response.status).toBe(200);
  return response.json();
}

beforeEach(async () => {
  await resetDatabase();
  resetAllRateLimits();
  cookie = null;
  await login();
});

afterAll(() => closeDb());

describe("익명 구독 통계", () => {
  it("참여하면 토큰을 주고, 서버에는 토큰의 해시만 남는다", async () => {
    const token = await participate(contribution(30000));
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const [row] = await getDb().select().from(statsContributors);
    expect(row.tokenHash).not.toBe(token);
    expect(row.totalMonthlyKrw).toBe(30000);
    expect(await getDb().select().from(statsItems)).toHaveLength(1);
  });

  it("같은 토큰으로 보내면 기록을 통째로 바꾸고, 모르는 토큰은 401", async () => {
    const token = await participate(contribution(30000));
    const updated = await contributionRoute.POST(
      request("POST", { ...contribution(52000), items: [] }, token),
    );
    expect(updated.status).toBe(200);
    const [row] = await getDb().select().from(statsContributors);
    expect(row.totalMonthlyKrw).toBe(52000);
    expect(await getDb().select().from(statsItems)).toHaveLength(0);

    const unknown = await contributionRoute.POST(
      request("POST", contribution(1000), "a".repeat(64)),
    );
    expect(unknown.status).toBe(401);
  });

  it("모양이 틀리거나 목록에 없는 서비스·지어낸 이름은 받지 않는다", async () => {
    const bads = [
      { ...contribution(1000), v: 2 },
      { ...contribution(1000), totalMonthlyKRW: -1 },
      {
        ...contribution(1000),
        items: [{ presetId: "my-secret-club", monthlyKRW: 1000, usageCount: 1 }],
      },
      { ...contribution(1000), items: [{ presetId: "netflix", monthlyKRW: 1.5, usageCount: 1 }] },
    ];
    for (const bad of bads) {
      expect((await contributionRoute.POST(request("POST", bad))).status).toBe(400);
    }
    expect(await getDb().select().from(statsContributors)).toHaveLength(0);
  });

  it("모인 사람이 모자라면 숫자 대신 비워 두고, 충분하면 가운데 값을 보여준다", async () => {
    for (let i = 0; i < STATS_MIN_PER_SERVICE; i++) {
      await participate(contribution(10000 * (i + 1), i), `10.0.1.${i}`);
    }
    const partial = await summary();
    expect(partial.participants).toBe(STATS_MIN_PER_SERVICE);
    expect(partial.overall).toBeNull();
    expect(partial.services).toEqual([
      expect.objectContaining({ presetId: "netflix", participants: STATS_MIN_PER_SERVICE }),
    ]);

    for (let i = STATS_MIN_PER_SERVICE; i < STATS_MIN_PARTICIPANTS; i++) {
      await participate({ ...contribution(10000 * (i + 1)), items: [] }, `10.0.2.${i}`);
    }
    const full = await summary();
    expect(full.overall).not.toBeNull();
    expect(full.overall.medianMonthlyKRW).toBe(105000);
  });

  it("새 참여자는 한 IP에서 한 시간에 5명까지만 받는다", async () => {
    for (let i = 0; i < 5; i++) await participate(contribution(1000), "10.9.9.9");
    const blocked = await contributionRoute.POST(
      request("POST", contribution(1000), undefined, "10.9.9.9"),
    );
    expect(blocked.status).toBe(429);
  });

  it("그만두면 기록과 항목을 모두 지운다", async () => {
    const token = await participate(contribution(30000));
    const response = await contributionRoute.DELETE(request("DELETE", undefined, token));
    expect(response.status).toBe(200);
    expect(await getDb().select().from(statsContributors)).toHaveLength(0);
    expect(await getDb().select().from(statsItems)).toHaveLength(0);
  });

  it("180일 동안 갱신되지 않은 기록은 크론이 지운다", async () => {
    await participate(contribution(30000));
    const later = new Date(Date.now() + 181 * 24 * 60 * 60 * 1000);
    expect(await pruneStaleContributions(later)).toBe(1);
    expect(await getDb().select().from(statsItems)).toHaveLength(0);
  });

  it("로그인하지 않으면 새로 참여하지도, 기록을 바꾸지도 못한다", async () => {
    const token = await participate(contribution(30000));
    cookie = null;
    const fresh = await contributionRoute.POST(request("POST", contribution(1000)));
    expect(fresh.status).toBe(403);
    expect(await fresh.json()).toMatchObject({ code: "login-required" });
    const update = await contributionRoute.POST(request("POST", contribution(1000), token));
    expect(update.status).toBe(403);

    const rows = await getDb().select().from(statsContributors);
    expect(rows).toHaveLength(1);
    expect(rows[0].totalMonthlyKrw).toBe(30000);
  });

  it("로그인하지 않아도 자기 기록은 지울 수 있다", async () => {
    const token = await participate(contribution(30000));
    cookie = null;
    const response = await contributionRoute.DELETE(request("DELETE", undefined, token));
    expect(response.status).toBe(200);
    expect(await getDb().select().from(statsContributors)).toHaveLength(0);
  });

  it("앱처럼 세션을 Authorization에 실어도 통계 토큰과 섞이지 않는다", async () => {
    const token = await participate(contribution(30000));
    const sessionToken = cookie!.slice(`${SESSION_COOKIE}=`.length);
    cookie = null;
    const headers = new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${sessionToken}`,
      "x-stats-token": token,
    });
    const req = new Request("http://localhost/api/stats/contribution", {
      method: "POST",
      headers,
      body: JSON.stringify(contribution(52000)),
    }) as Request & { cookies: { get(name: string): undefined } };
    req.cookies = { get: () => undefined };
    expect((await contributionRoute.POST(req as never)).status).toBe(200);

    const rows = await getDb().select().from(statsContributors);
    expect(rows).toHaveLength(1);
    expect(rows[0].totalMonthlyKrw).toBe(52000);
  });

  it("예전 웹 화면이 Authorization에 실은 통계 토큰도 그 기록을 바꾼다", async () => {
    const token = await participate(contribution(30000));
    const response = await contributionRoute.POST(
      request("POST", contribution(52000), token, "10.0.0.1", "authorization"),
    );
    expect(response.status).toBe(200);
    expect(await getDb().select().from(statsContributors)).toHaveLength(1);
  });
});
