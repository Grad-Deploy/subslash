import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

/**
 * 로그인한 계정의 AI 질문 횟수를 실제 SQLite에 대고 센다(방침의 'AI 질문 횟수').
 *
 * 확인하려는 것:
 * 1. 계정·한국 날짜·기능마다 세고, 한도에 닿으면 세지 않고 막는다.
 * 2. 로그인한 요청은 남은 횟수를 받고, 하루 한도는 한국 자정까지 기다리게 한다.
 * 3. 지난 날은 크론이 지우고, 회원 탈퇴는 그 계정의 횟수를 곧바로 지운다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, askDailyCounts } = await import("../../lib/schema");
const { createSession, deleteAccount } = await import("../../lib/auth-server");
const { koreaDay, pruneAskDailyCounts, secondsUntilKoreaMidnight, takeAskQuota } =
  await import("../../lib/ask/daily-count");
const { limitAiRequest } = await import("../../lib/ask/guard");
const { resetAllRateLimits } = await import("../../lib/rate-limit");

const migrations = readdirSync(join(process.cwd(), "drizzle"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(process.cwd(), "drizzle", file), "utf-8"));

async function resetDatabase() {
  const db = getDb();
  const existing = (await db.all(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'` as never,
  )) as unknown as Array<{ name: string }>;
  await db.run(`PRAGMA foreign_keys = OFF` as never);
  for (const { name } of existing) await db.run(`DROP TABLE IF EXISTS "${name}"` as never);
  for (const migration of migrations) {
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await db.run(sql as never);
    }
  }
}

async function makeAccount(id: string) {
  await getDb()
    .insert(accounts)
    .values({ id, username: id, email: `${id}@example.com`, passwordHash: "x" });
  return (await createSession(id)).token;
}

const rows = () => getDb().select().from(askDailyCounts);

function askRequest(token?: string, ip = "1.2.3.4") {
  return new NextRequest("http://localhost/api/ask", {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
}

beforeEach(async () => {
  await resetDatabase();
  resetAllRateLimits();
  vi.stubEnv("NEXT_PUBLIC_AI_ASK_DAILY_COUNT_TEST_OPEN", "true");
});

afterAll(() => {
  vi.unstubAllEnvs();
  closeDb();
});

describe("AI 질문 횟수(DB)", () => {
  it("계정·한국 날짜·기능마다 세고, 한도에 닿으면 세지 않고 막는다", async () => {
    await makeAccount("a");
    const now = new Date("2026-10-25T15:30:00Z"); // 한국 10월 26일 0시 30분
    expect(koreaDay(now)).toBe("2026-10-26");

    expect(await takeAskQuota("a", "ask", 2, now)).toEqual({ allowed: true, remaining: 1 });
    expect(await takeAskQuota("a", "ask", 2, now)).toEqual({ allowed: true, remaining: 0 });
    expect(await takeAskQuota("a", "ask", 2, now)).toEqual({ allowed: false, remaining: 0 });
    // 기능이 다르면 따로 센다
    expect(await takeAskQuota("a", "help-ask", 2, now)).toEqual({ allowed: true, remaining: 1 });

    // 질문 문장 없이 계정·날짜·기능·횟수만 있다. 막힌 요청은 세지 않았다.
    expect(await rows()).toEqual(
      expect.arrayContaining([
        { accountId: "a", day: "2026-10-26", scope: "ask", count: 2 },
        { accountId: "a", day: "2026-10-26", scope: "help-ask", count: 1 },
      ]),
    );
  });

  it("로그인한 요청은 남은 횟수를 받고, 하루 한도는 한국 자정까지 기다리게 한다", async () => {
    const token = await makeAccount("a");
    const now = new Date("2026-10-25T03:00:00Z"); // 한국 정오

    expect(await limitAiRequest(askRequest(token), "ask", now)).toEqual({ remaining: 49 });
    // 비로그인은 메모리로 세고 남은 횟수가 없다
    expect(await limitAiRequest(askRequest(undefined, "5.6.7.8"), "ask", now)).toEqual({});

    await getDb().update(askDailyCounts).set({ count: 50 }).execute();
    const blocked = await limitAiRequest(askRequest(token), "ask", now);
    expect("blocked" in blocked && blocked.blocked.status).toBe(429);
    const retryAfter = "blocked" in blocked ? blocked.blocked.headers.get("Retry-After") : null;
    expect(Number(retryAfter)).toBe(secondsUntilKoreaMidnight(now));
    expect(secondsUntilKoreaMidnight(now)).toBe(12 * 60 * 60);
  });

  it("열리기 전에는 DB에 쓰지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_ASK_DAILY_COUNT_TEST_OPEN", "");
    const token = await makeAccount("a");
    expect(
      await limitAiRequest(askRequest(token), "ask", new Date("2026-10-19T03:00:00Z")),
    ).toEqual({});
    expect(await rows()).toEqual([]);
  });

  it("지난 날은 크론이 지우고, 회원 탈퇴는 그 계정의 횟수를 곧바로 지운다", async () => {
    await makeAccount("a");
    await makeAccount("b");
    const yesterday = new Date("2026-10-24T03:00:00Z");
    const today = new Date("2026-10-25T03:00:00Z");
    await takeAskQuota("a", "ask", 50, yesterday);
    await takeAskQuota("a", "ask", 50, today);
    await takeAskQuota("b", "ask", 50, today);

    await pruneAskDailyCounts(today);
    expect((await rows()).map((r) => `${r.accountId}:${r.day}`).sort()).toEqual([
      "a:2026-10-25",
      "b:2026-10-25",
    ]);

    expect(await deleteAccount("a")).toBe(true);
    expect((await rows()).map((r) => r.accountId)).toEqual(["b"]);
  });
});
