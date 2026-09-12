import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { createClient, type Client } from "@libsql/client";

/**
 * 0006은 알림 테이블 `users`를 `notification_subscribers`로 바꾼다.
 *
 * 다른 통합 테스트는 빈 DB에 마이그레이션을 전부 적용하므로, 이미 행이 있는 배포
 * DB에서 무슨 일이 생기는지는 보지 못한다. 여기서는 0005까지의 스키마에 알림을
 * 켠 사람과 그 미러·발송 기록을 넣어 둔 뒤 0006을 적용해, 행과 외래키와 인덱스가
 * 그대로 살아 있는지 확인한다.
 */

const migrationsDir = join(process.cwd(), "drizzle");
const files = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();
const RENAME = "0006_rename_notification_subscribers.sql";

async function apply(client: Client, file: string) {
  const text = readFileSync(join(migrationsDir, file), "utf-8");
  for (const statement of text.split("--> statement-breakpoint")) {
    const sql = statement.trim();
    if (sql) await client.execute(sql);
  }
}

async function names(client: Client, type: "table" | "index"): Promise<string[]> {
  const rs = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type = ? AND name NOT LIKE 'sqlite_%' ORDER BY name",
    args: [type],
  });
  return rs.rows.map((row) => String(row.name));
}

async function count(client: Client, table: string): Promise<number> {
  const rs = await client.execute(`SELECT count(*) AS n FROM ${table}`);
  return Number(rs.rows[0].n);
}

describe("0006: users → notification_subscribers", () => {
  let client: Client;

  beforeAll(async () => {
    client = createClient({ url: ":memory:" });
    await client.execute("PRAGMA foreign_keys = ON");

    const renameAt = files.indexOf(RENAME);
    expect(renameAt).toBeGreaterThan(0);
    for (const file of files.slice(0, renameAt)) await apply(client, file);

    await client.execute({
      sql: `INSERT INTO users (id, email, sync_token_hash, verified_at, calendar_token_hash)
            VALUES (?, ?, ?, ?, ?)`,
      args: ["sub-1", "reader@example.com", "sync-hash", "2026-09-01 00:00:00", "cal-hash"],
    });
    await client.execute({
      sql: `INSERT INTO mirrored_subscriptions (id, user_id, client_id, name, amount, billing_day)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ["m-1", "sub-1", "c-1", "넷플릭스", 17000, 15],
    });
    await client.execute({
      sql: `INSERT INTO notification_log (id, user_id, client_id, billing_date) VALUES (?, ?, ?, ?)`,
      args: ["l-1", "sub-1", "c-1", "2026-09-15"],
    });

    for (const file of files.slice(renameAt)) await apply(client, file);
  });

  afterAll(() => client.close());

  it("keeps the people who turned reminders on, under the new name", async () => {
    const tables = await names(client, "table");
    expect(tables).toContain("notification_subscribers");
    expect(tables).not.toContain("users");

    const rs = await client.execute(
      "SELECT id, email, sync_token_hash, verified_at, calendar_token_hash FROM notification_subscribers",
    );
    expect(rs.rows).toHaveLength(1);
    const row = rs.rows[0];
    expect([
      row.id,
      row.email,
      row.sync_token_hash,
      row.verified_at,
      row.calendar_token_hash,
    ]).toEqual(["sub-1", "reader@example.com", "sync-hash", "2026-09-01 00:00:00", "cal-hash"]);
    expect(await count(client, "mirrored_subscriptions")).toBe(1);
    expect(await count(client, "notification_log")).toBe(1);
  });

  it("points the mirror and the log at the renamed table", async () => {
    for (const table of ["mirrored_subscriptions", "notification_log"]) {
      const rs = await client.execute(`PRAGMA foreign_key_list(${table})`);
      expect(rs.rows.map((row) => row.table)).toEqual(["notification_subscribers"]);
    }
  });

  it("renames the unique indexes and still enforces them", async () => {
    const indexes = await names(client, "index");
    expect(indexes.filter((name) => name.startsWith("users_"))).toEqual([]);
    expect(indexes).toEqual(
      expect.arrayContaining([
        "notification_subscribers_email_idx",
        "notification_subscribers_sync_token_idx",
        "notification_subscribers_calendar_token_idx",
      ]),
    );

    await expect(
      client.execute({
        sql: "INSERT INTO notification_subscribers (id, email, sync_token_hash) VALUES (?, ?, ?)",
        args: ["sub-2", "reader@example.com", "other-hash"],
      }),
    ).rejects.toThrow(/UNIQUE/);
  });

  it("still clears the mirror and the log when someone unsubscribes", async () => {
    await client.execute("DELETE FROM notification_subscribers WHERE id = 'sub-1'");
    expect(await count(client, "mirrored_subscriptions")).toBe(0);
    expect(await count(client, "notification_log")).toBe(0);
  });
});
