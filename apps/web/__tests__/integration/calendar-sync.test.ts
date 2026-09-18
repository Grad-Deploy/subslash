import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

/**
 * '구글 캘린더에 결제일 등록'을 실제 SQLite(마이그레이션 전부 적용)에 대고 돌린다.
 *
 * 구독 이름·금액이 주소에 실리지 않는지, 맡긴 계획을 한 번만 받아 갈 수 있는지, 받아 간 뒤에는
 * 서버에 남지 않는지, 탈퇴가 남김없이 지우는지를 본다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;
process.env.NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN = "true";
process.env.EMAIL_LINK_SECRET = "calendar-sync-test-secret";
process.env.NEXT_PUBLIC_APP_URL = "https://subslash.test";
const WEB_APP_URL = "https://script.google.com/macros/s/TEST_DEPLOYMENT/exec";
process.env.GMAIL_CONNECT_WEB_APP_URL = WEB_APP_URL;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts } = await import("../../lib/schema");
const { SESSION_COOKIE, createSession, deleteAccount } = await import("../../lib/auth-server");
const { countCalendarSyncPlans, claimCalendarSyncPlan, createCalendarSyncPlan } =
  await import("../../lib/calendar-sync");
const startRoute = await import("../../app/api/calendar-sync/route");
const claimRoute = await import("../../app/api/calendar-sync/claim/route");

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

const BASE = "http://localhost/api/calendar-sync";

async function loggedIn(username: string) {
  const [account] = await getDb()
    .insert(accounts)
    .values({
      username,
      email: `${username}@gmail.com`,
      passwordHash: "scrypt$0$0$0$unused$unused",
    })
    .returning();
  const session = await createSession(account.id);
  return { account, cookie: `${SESSION_COOKIE}=${session.token}` };
}

const NETFLIX = {
  clientId: "sub-netflix",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 25,
  billingCycle: "monthly",
  billingMonth: null,
};
const UNDATED_YEARLY = {
  clientId: "sub-yearly",
  name: "노션",
  amount: 120000,
  currency: "KRW",
  billingDay: 3,
  billingCycle: "yearly",
  billingMonth: null,
};

function start(cookie: string | undefined, body: unknown) {
  return startRoute.POST(request(BASE, { method: "POST", cookie, body: JSON.stringify(body) }));
}

function claim(code: unknown) {
  return claimRoute.POST(
    request(`${BASE}/claim`, { method: "POST", body: JSON.stringify({ code }) }),
  );
}

beforeEach(resetDatabase);
afterAll(() => closeDb());

describe("구글 캘린더에 결제일 등록", () => {
  it("로그인해야 시작할 수 있다", async () => {
    const response = await start(undefined, { entries: [NETFLIX], reminderDays: 3 });
    expect(response.status).toBe(401);
  });

  it("웹 앱 주소에 코드만 싣고 구독 이름·금액은 싣지 않는다", async () => {
    const { cookie } = await loggedIn("owner");
    const response = await start(cookie, { entries: [NETFLIX], reminderDays: 3 });
    expect(response.status).toBe(200);

    const { url } = (await response.json()) as { url: string };
    expect(url.startsWith(WEB_APP_URL)).toBe(true);
    expect(url).not.toContain("넷플릭스");
    expect(url).not.toContain("17000");

    const params = new URL(url).searchParams;
    expect(params.get("action")).toBe("calendar");
    expect(params.get("origin")).toBe("https://subslash.test");
    expect(params.get("code")).toBeTruthy();
  });

  it("올릴 구독이 없으면 시작하지 않는다 — 빈 캘린더를 만들지 않는다", async () => {
    const { cookie } = await loggedIn("empty");
    expect((await start(cookie, { entries: [] })).status).toBe(400);
  });

  it("웹 앱이 코드로 결제일을 받아 가고, 받아 간 뒤에는 서버에 남지 않는다", async () => {
    const { account, cookie } = await loggedIn("claimer");
    const response = await start(cookie, {
      entries: [NETFLIX, UNDATED_YEARLY],
      reminderDays: 3,
    });
    const code = new URL(((await response.json()) as { url: string }).url).searchParams.get(
      "code",
    )!;

    const claimed = await claim(code);
    expect(claimed.status).toBe(200);
    const body = (await claimed.json()) as {
      calendarName: string;
      events: Array<{ uid: string; summary: string; rrule: string; reminderMinutes: number }>;
    };

    expect(body.calendarName).toBe("SubSlash 결제일");
    // 결제 월을 모르는 연간 구독은 빠진다.
    expect(body.events.map((event) => event.uid)).toEqual(["sub-netflix"]);
    expect(body.events[0].rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=25");
    expect(body.events[0].reminderMinutes).toBe(3 * 24 * 60);

    expect(await countCalendarSyncPlans(account.id)).toBe(0);
    // 같은 주소를 다시 열어도 캘린더가 또 채워지지 않는다.
    expect((await claim(code)).status).toBe(400);
  });

  it("다시 누르면 앞서 맡긴 계획은 쓸 수 없다", async () => {
    const { cookie } = await loggedIn("twice");
    const first = await start(cookie, { entries: [NETFLIX] });
    const firstCode = new URL(((await first.json()) as { url: string }).url).searchParams.get(
      "code",
    )!;
    await start(cookie, { entries: [NETFLIX] });

    expect((await claim(firstCode)).status).toBe(400);
  });

  it("10분이 지난 계획은 주지 않는다", async () => {
    const { account } = await loggedIn("expired");
    const old = new Date(Date.now() - 11 * 60 * 1000);
    const code = await createCalendarSyncPlan(
      account.id,
      { entries: [{ ...NETFLIX, currency: "KRW" }], reminderDays: 3 },
      old,
    );

    expect(await claimCalendarSyncPlan(code)).toBeNull();
    expect(await countCalendarSyncPlans(account.id)).toBe(0);
  });

  it("탈퇴하면 맡겨 둔 계획도 함께 지운다", async () => {
    const { account, cookie } = await loggedIn("quitter");
    await start(cookie, { entries: [NETFLIX] });
    expect(await countCalendarSyncPlans(account.id)).toBe(1);

    await deleteAccount(account.id);
    expect(await countCalendarSyncPlans(account.id)).toBe(0);
  });
});
