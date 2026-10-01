import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * 결제 알림 메일과 캘린더 피드를 그만둔 뒤의 하루 크론. 남은 알림 기록(이메일·구독 사본·발송 기록)을
 * 지우고, 메일은 보내지 않는다. 실제 SQLite에 모든 마이그레이션을 적용해 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
process.env.CRON_SECRET = "test-cron-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { notificationSubscribers, mirroredSubscriptions, notificationLog } =
  await import("../../lib/schema");
const { GET: cronRoute } = await import("../../app/api/cron/notify/route");

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

function cronRequest(authorization?: string) {
  const url = "http://localhost:3000/api/cron/notify";
  const req = new Request(url, {
    headers: authorization ? { Authorization: authorization } : {},
  }) as Request & { nextUrl: URL };
  req.nextUrl = new URL(url);
  return req as never;
}

/** 그만두기 전에 알림을 켜 둔 사람의 기록 — 확인된 구독자, 구독 사본, 발송 기록. */
async function seedRetiredNotifyData() {
  const db = getDb();
  const [subscriber] = await db
    .insert(notificationSubscribers)
    .values({
      email: "me@example.com",
      syncTokenHash: "sync-hash",
      verifiedAt: "2026-09-01T00:00:00.000Z",
      calendarTokenHash: "calendar-hash",
    })
    .returning();
  await db.insert(mirroredSubscriptions).values({
    userId: subscriber.id,
    clientId: "sub-1",
    name: "넷플릭스",
    amount: 17000,
    billingDay: 15,
  });
  await db.insert(notificationLog).values({
    userId: subscriber.id,
    clientId: "sub-1",
    billingDate: "2026-09-15",
  });
  // 확인 링크를 누르지 않은 신청도 지운다.
  await db.insert(notificationSubscribers).values({
    email: "pending@example.com",
    syncTokenHash: "pending-hash",
  });
}

describe("알림을 그만둔 뒤의 하루 크론", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  it("남은 알림 기록을 모두 지우고 메일은 보내지 않는다", async () => {
    await seedRetiredNotifyData();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await cronRoute(cronRequest("Bearer test-cron-secret"));
    expect(response.status).toBe(200);
    expect((await response.json()).purgedNotify).toBe(2);

    const db = getDb();
    expect(await db.select().from(notificationSubscribers)).toEqual([]);
    expect(await db.select().from(mirroredSubscriptions)).toEqual([]);
    expect(await db.select().from(notificationLog)).toEqual([]);
    // 결제 알림 메일(Resend)을 부르지 않는다.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("지울 것이 없어도 그대로 끝난다", async () => {
    const response = await cronRoute(cronRequest("Bearer test-cron-secret"));
    expect(response.status).toBe(200);
    expect((await response.json()).purgedNotify).toBe(0);
  });

  it("비밀값이 다르면 아무것도 지우지 않는다", async () => {
    await seedRetiredNotifyData();
    const response = await cronRoute(cronRequest("Bearer wrong"));
    expect(response.status).toBe(401);
    expect(await getDb().select().from(notificationSubscribers)).toHaveLength(2);
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
