import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 결제 알림 메일과 캘린더 피드를 그만둔 뒤 남은 표(이메일·구독 사본·발송 기록)를 0017이 지운다. 하루 크론은
 * 그 표를 더 찾지 않고, 메일도 보내지 않는다. 실제 SQLite에 마이그레이션을 적용해 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
process.env.CRON_SECRET = "test-cron-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { GET: cronRoute } = await import("../../app/api/cron/notify/route");

const RETIRED_TABLES = ["notification_subscribers", "mirrored_subscriptions", "notification_log"];

const migrationsDir = join(process.cwd(), "drizzle");
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const DROP_FILE = "0017_drop_retired_notify.sql";

async function run(file: string) {
  const db = getDb();
  const migration = readFileSync(join(migrationsDir, file), "utf-8");
  for (const statement of migration.split("--> statement-breakpoint")) {
    const sql = statement.trim();
    if (sql) await db.run(sql as never);
  }
}

/** 빈 DB에 `until` 앞까지의 마이그레이션을 적용한다(없으면 전부). */
async function resetDatabase(until?: string) {
  const db = getDb();
  const existing = (await db.all(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'` as never,
  )) as unknown as Array<{ name: string }>;
  await db.run(`PRAGMA foreign_keys = OFF` as never);
  for (const { name } of existing) {
    await db.run(`DROP TABLE IF EXISTS "${name}"` as never);
  }
  await db.run(`PRAGMA foreign_keys = ON` as never);
  for (const file of migrationFiles) {
    if (until && file >= until) break;
    await run(file);
  }
}

async function tableNames(): Promise<string[]> {
  const rows = (await getDb().all(
    `SELECT name FROM sqlite_master WHERE type = 'table'` as never,
  )) as unknown as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

function cronRequest(authorization?: string) {
  const url = "http://localhost:3000/api/cron/notify";
  const req = new Request(url, {
    headers: authorization ? { Authorization: authorization } : {},
  }) as Request & { nextUrl: URL };
  req.nextUrl = new URL(url);
  return req as never;
}

describe("그만둔 결제 알림의 표 지우기(0017)", () => {
  afterAll(() => {
    closeDb();
  });

  it("남은 알림 기록이 있어도 세 표를 지우고, 다른 표의 기록은 그대로 둔다", async () => {
    await resetDatabase(DROP_FILE);
    const db = getDb();
    // 그만두기 전에 알림을 켜 둔 사람의 기록 — 구독자, 구독 사본, 발송 기록.
    await db.run(
      `INSERT INTO notification_subscribers (id, email, sync_token_hash) VALUES ('s1', 'me@example.com', 'h')` as never,
    );
    await db.run(
      `INSERT INTO mirrored_subscriptions (id, user_id, client_id, name, amount, billing_day) VALUES ('m1', 's1', 'sub-1', '넷플릭스', 17000, 15)` as never,
    );
    await db.run(
      `INSERT INTO notification_log (id, user_id, client_id, billing_date) VALUES ('l1', 's1', 'sub-1', '2026-09-15')` as never,
    );
    await db.run(
      `INSERT INTO accounts (id, username, email, password_hash) VALUES ('a1', 'keep', 'keep@example.com', 'x')` as never,
    );

    await run(DROP_FILE);

    const tables = await tableNames();
    for (const table of RETIRED_TABLES) expect(tables).not.toContain(table);
    const accounts = (await db.all(`SELECT username FROM accounts` as never)) as unknown as Array<{
      username: string;
    }>;
    expect(accounts.map((a) => a.username)).toEqual(["keep"]);
  });
});

describe("하루 크론(알림 표를 지운 뒤)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  it("알림 표 없이 정리를 마치고 메일은 보내지 않는다", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await cronRoute(cronRequest("Bearer test-cron-secret"));
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
    // 결제 알림 메일(Resend)을 부르지 않는다.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("비밀값이 다르면 거부한다", async () => {
    const response = await cronRoute(cronRequest("Bearer wrong"));
    expect(response.status).toBe(401);
  });

  it("CRON_SECRET이 없으면 503으로 거부한다", async () => {
    const secret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const response = await cronRoute(cronRequest());
      expect(response.status).toBe(503);
      expect((await response.json()).error).toContain("CRON_SECRET");
    } finally {
      process.env.CRON_SECRET = secret;
    }
  });
});
