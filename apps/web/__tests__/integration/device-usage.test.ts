import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 기기 간 사용 측정을 실제 SQLite에 대고 돌린다: 두 기기가 올린 구간이 계정 하나로 이어지는지,
 * 같은 기간을 다시 올려도 두 번 세지 않는지, 다른 계정에는 닿지 않는지, 탈퇴·정리로 지워지는지.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
process.env.NEXT_PUBLIC_DEVICE_USAGE_TEST_OPEN = "true";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, usageDevices, usageIntervals } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession, deleteAccount } = await import("../../lib/auth-server");
const { resetAllRateLimits } = await import("../../lib/rate-limit");
const { pruneDeviceUsage } = await import("../../lib/device-usage-server");
const { GET, POST, DELETE } = await import("../../app/api/usage/route");

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

const URL_BASE = "http://localhost/api/usage";
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const PHONE = "11111111-1111-4111-8111-111111111111";
const TABLET = "22222222-2222-4222-8222-222222222222";

async function login(username: string) {
  const [account] = await getDb()
    .insert(accounts)
    .values({
      username,
      email: `${username}@gmail.com`,
      passwordHash: "scrypt$0$0$0$unused$unused",
      emailVerifiedAt: new Date().toISOString(),
    })
    .returning();
  const session = await createSession(account.id);
  return { account, cookie: `${SESSION_COOKIE}=${session.token}` };
}

function upload(
  cookie: string,
  deviceKey: string,
  from: number,
  until: number,
  intervals: { serviceId: string; start: number; end: number }[],
) {
  return POST(
    request(URL_BASE, {
      method: "POST",
      cookie,
      body: JSON.stringify({ deviceKey, platform: "android", from, until, intervals }),
    }),
  );
}

async function summary(cookie: string, days = 1) {
  const response = await GET(request(`${URL_BASE}?days=${days}`, { cookie }));
  expect(response.status).toBe(200);
  return response.json();
}

beforeEach(async () => {
  await resetDatabase();
  resetAllRateLimits();
});

afterAll(() => closeDb());

describe("/api/usage", () => {
  it("로그인하지 않으면 올리지도 읽지도 못한다", async () => {
    const now = Date.now();
    expect((await upload("", PHONE, now - HOUR, now, [])).status).toBe(401);
    expect((await GET(request(URL_BASE))).status).toBe(401);
  });

  it("휴대폰에서 보다가 태블릿에서 이어 본 것을 한 번으로 센다", async () => {
    const { cookie } = await login("viewer");
    const now = Date.now();
    const from = now - 6 * HOUR;
    await upload(cookie, PHONE, from, now, [
      { serviceId: "netflix", start: now - 5 * HOUR, end: now - 5 * HOUR + 40 * MIN },
    ]);
    await upload(cookie, TABLET, from, now, [
      { serviceId: "netflix", start: now - 5 * HOUR + 50 * MIN, end: now - 4 * HOUR + 30 * MIN },
    ]);

    const body = await summary(cookie);
    expect(body.devices).toHaveLength(2);
    expect(body.summary.measuredDeviceCount).toBe(2);
    expect(body.summary.services).toEqual([
      { serviceId: "netflix", sessionCount: 1, activeMinutes: 80, handoffCount: 1, deviceCount: 2 },
    ]);
  });

  it("같은 기간을 다시 올리면 바꿔 쓴다 — 두 번 세지 않는다", async () => {
    const { cookie } = await login("retry");
    const now = Date.now();
    const intervals = [{ serviceId: "spotify", start: now - 2 * HOUR, end: now - HOUR }];
    await upload(cookie, PHONE, now - 3 * HOUR, now, intervals);
    await upload(cookie, PHONE, now - 3 * HOUR, now, intervals);
    expect(await getDb().select().from(usageIntervals)).toHaveLength(1);
  });

  it("서비스 목록에 없는 앱과 기간 밖 구간은 버린다", async () => {
    const { cookie } = await login("filter");
    const now = Date.now();
    const response = await upload(cookie, PHONE, now - HOUR, now, [
      { serviceId: "some-unknown-app", start: now - 30 * MIN, end: now - 10 * MIN },
      { serviceId: "netflix", start: now - 2 * HOUR, end: now - 30 * MIN },
      { serviceId: "netflix", start: now - 20 * MIN, end: now - 5 * MIN },
    ]);
    expect(await response.json()).toMatchObject({ stored: 1 });
  });

  it("미래나 보관 기간보다 오래된 기간은 거절한다", async () => {
    const { cookie } = await login("range");
    const now = Date.now();
    expect((await upload(cookie, PHONE, now, now + HOUR, [])).status).toBe(400);
    expect((await upload(cookie, PHONE, now - 41 * 24 * HOUR, now, [])).status).toBe(400);
  });

  it("다른 계정의 기기는 섞이지 않는다", async () => {
    const a = await login("alice");
    const b = await login("bob");
    const now = Date.now();
    await upload(a.cookie, PHONE, now - HOUR, now, [
      { serviceId: "netflix", start: now - 50 * MIN, end: now - 10 * MIN },
    ]);
    // 기기 키가 같아도 계정이 다르면 다른 기기다.
    await upload(b.cookie, PHONE, now - HOUR, now, []);
    expect((await summary(b.cookie)).summary.services).toEqual([]);
    expect((await summary(a.cookie)).summary.services).toHaveLength(1);
  });

  it("지난번 끝과 이번 시작 사이가 비면 측정 기간을 이어 붙이지 않는다", async () => {
    const { cookie } = await login("gap");
    const now = Date.now();
    await upload(cookie, PHONE, now - 10 * HOUR, now - 8 * HOUR, []);
    await upload(cookie, PHONE, now - 2 * HOUR, now, []);
    const [device] = await getDb().select().from(usageDevices);
    expect(device.measuredFrom).toBe(now - 2 * HOUR);
  });

  it("한 기기를 지우면 그 기기의 구간만 지운다", async () => {
    const { cookie } = await login("stop");
    const now = Date.now();
    const intervals = [{ serviceId: "netflix", start: now - 50 * MIN, end: now - 10 * MIN }];
    await upload(cookie, PHONE, now - HOUR, now, intervals);
    await upload(cookie, TABLET, now - HOUR, now, intervals);
    const response = await DELETE(
      request(URL_BASE, { method: "DELETE", cookie, body: JSON.stringify({ deviceKey: PHONE }) }),
    );
    expect(response.status).toBe(200);
    expect(await getDb().select().from(usageDevices)).toHaveLength(1);
    expect(await getDb().select().from(usageIntervals)).toHaveLength(1);
  });

  it("회원 탈퇴하면 모든 기기의 기록을 지운다", async () => {
    const { account, cookie } = await login("leaver");
    const now = Date.now();
    await upload(cookie, PHONE, now - HOUR, now, [
      { serviceId: "netflix", start: now - 50 * MIN, end: now - 10 * MIN },
    ]);
    await deleteAccount(account.id);
    expect(await getDb().select().from(usageDevices)).toHaveLength(0);
    expect(await getDb().select().from(usageIntervals)).toHaveLength(0);
  });

  it("보관 기간이 지난 구간과 기기를 정리한다", async () => {
    const { cookie } = await login("old");
    const now = Date.now();
    await upload(cookie, PHONE, now - HOUR, now, [
      { serviceId: "netflix", start: now - 50 * MIN, end: now - 10 * MIN },
    ]);
    expect(await pruneDeviceUsage(now + 41 * 24 * HOUR)).toBe(1);
    expect(await getDb().select().from(usageDevices)).toHaveLength(0);
  });
});
