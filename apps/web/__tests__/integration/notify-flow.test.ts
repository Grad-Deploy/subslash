import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Exercises the reminder pipeline against a real SQLite database: opt in,
 * verify, mirror sync, cron sweep, opt out.
 *
 * RESEND_API_KEY is deliberately unset, so sendEmail logs instead of sending
 * and the sweep still reports what it would have delivered.
 */

// In-memory keeps the suite hermetic and leaves no SQLite files behind.
process.env.TURSO_DATABASE_URL = ":memory:";
process.env.CRON_SECRET = "test-cron-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
delete process.env.RESEND_API_KEY;
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { users, mirroredSubscriptions, notificationLog } = await import("../../lib/schema");
const { signLink, verifyLink, hashSyncToken } = await import("../../lib/tokens");
const { deleteUserCompletely } = await import("../../lib/notify-server");

const { POST: subscribeRoute } = await import("../../app/api/notify/subscribe/route");
const { PUT: syncRoute, GET: statusRoute } = await import("../../app/api/notify/sync/route");
const { GET: verifyRoute } = await import("../../app/api/notify/verify/route");
const { GET: cronRoute } = await import("../../app/api/cron/notify/route");

const migration = readFileSync(join(process.cwd(), "drizzle", "0000_light_reavers.sql"), "utf-8");

async function resetDatabase() {
  const db = getDb();
  for (const table of ["notification_log", "mirrored_subscriptions", "users"]) {
    await db.run(`DROP TABLE IF EXISTS ${table}` as never);
  }
  for (const statement of migration.split("--> statement-breakpoint")) {
    const sql = statement.trim();
    if (sql) await db.run(sql as never);
  }
}

/** Builds a Next-style request; the routes only read url, headers and json. */
function request(url: string, init?: RequestInit) {
  const req = new Request(url, init) as Request & { nextUrl: URL };
  req.nextUrl = new URL(url);
  return req as never;
}

/** A billing day that is exactly `days` away from now. */
function billingDayIn(days: number): number {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.getDate();
}

async function optIn(email = "reader@example.com", reminderDays = 3): Promise<string> {
  const response = await subscribeRoute(
    request("http://localhost:3000/api/notify/subscribe", {
      method: "POST",
      body: JSON.stringify({ email, reminderDays }),
    }),
  );
  return (await response.json()).syncToken as string;
}

async function putMirror(token: string, subscriptions: unknown[]) {
  return syncRoute(
    request("http://localhost:3000/api/notify/sync", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subscriptions }),
    }),
  );
}

async function markVerified(userId: string) {
  return verifyRoute(
    request(
      `http://localhost:3000/api/notify/verify?token=${encodeURIComponent(
        signLink({ uid: userId, act: "verify" }, 3600),
      )}`,
    ),
  );
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(() => {
  closeDb();
});

describe("알림 옵트인", () => {
  it("이메일을 등록하면 sync 토큰을 발급하고 미확인 상태로 둔다", async () => {
    const response = await subscribeRoute(
      request("http://localhost:3000/api/notify/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: "Reader@Example.com", reminderDays: 3 }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.syncToken).toMatch(/^[0-9a-f]{64}$/);
    expect(body.email).toBe("reader@example.com");
    expect(body.verified).toBe(false);

    const rows = await getDb().select().from(users);
    expect(rows).toHaveLength(1);
    // Only the hash is persisted, never the raw token.
    expect(rows[0].syncTokenHash).toBe(hashSyncToken(body.syncToken));
    expect(rows[0].syncTokenHash).not.toBe(body.syncToken);
    expect(rows[0].verifiedAt).toBeNull();
  });

  it("잘못된 이메일은 거부한다", async () => {
    const response = await subscribeRoute(
      request("http://localhost:3000/api/notify/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await getDb().select().from(users)).toHaveLength(0);
  });
});

describe("미러 동기화", () => {
  it("활성 구독만 저장하고 민감한 필드는 버린다", async () => {
    const token = await optIn();

    const response = await putMirror(token, [
      {
        id: "sub-1",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay: 10,
        billingCycle: "monthly",
        cancelGuide: "이 필드는 서버로 넘어오면 안 된다",
        accountMemo: "민감정보",
      },
    ]);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ synced: 1, skipped: 0 });

    const rows = await getDb().select().from(mirroredSubscriptions);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("넷플릭스");
    expect(rows[0].clientId).toBe("sub-1");
    expect(JSON.stringify(rows[0])).not.toContain("민감정보");
    expect(JSON.stringify(rows[0])).not.toContain("넘어오면");
  });

  it("전체 교체 방식이라 지운 구독은 서버에서도 사라진다", async () => {
    const token = await optIn();

    await putMirror(token, [
      { id: "a", name: "A", amount: 1000, billingDay: 5, currency: "KRW", billingCycle: "monthly" },
      { id: "b", name: "B", amount: 2000, billingDay: 6, currency: "KRW", billingCycle: "monthly" },
    ]);
    expect(await getDb().select().from(mirroredSubscriptions)).toHaveLength(2);

    await putMirror(token, [
      { id: "a", name: "A", amount: 1000, billingDay: 5, currency: "KRW", billingCycle: "monthly" },
    ]);
    const rows = await getDb().select().from(mirroredSubscriptions);
    expect(rows).toHaveLength(1);
    expect(rows[0].clientId).toBe("a");
  });

  it("잘못된 항목은 건너뛰고 나머지는 저장한다", async () => {
    const token = await optIn();
    const response = await putMirror(token, [
      { id: "ok", name: "정상", amount: 1000, billingDay: 5 },
      { id: "bad-day", name: "결제일 이상", amount: 1000, billingDay: 99 },
      { id: "no-name", amount: 1000, billingDay: 5 },
    ]);
    expect(await response.json()).toMatchObject({ synced: 1, skipped: 2 });
  });

  it("토큰이 없거나 틀리면 401을 반환한다", async () => {
    await optIn();

    const noAuth = await syncRoute(
      request("http://localhost:3000/api/notify/sync", {
        method: "PUT",
        body: JSON.stringify({ subscriptions: [] }),
      }),
    );
    expect(noAuth.status).toBe(401);

    const wrong = await statusRoute(
      request("http://localhost:3000/api/notify/sync", {
        headers: { Authorization: "Bearer deadbeef" },
      }),
    );
    expect(wrong.status).toBe(401);
  });
});

describe("확인 링크", () => {
  it("서명된 링크로만 인증 상태가 된다", async () => {
    await optIn();
    const userId = (await getDb().select().from(users))[0].id;

    const tampered = await verifyRoute(
      request("http://localhost:3000/api/notify/verify?token=forged.signature"),
    );
    expect(tampered.headers.get("location")).toContain("notify=invalid");
    expect((await getDb().select().from(users))[0].verifiedAt).toBeNull();

    const ok = await markVerified(userId);
    expect(ok.headers.get("location")).toContain("notify=verified");
    expect((await getDb().select().from(users))[0].verifiedAt).not.toBeNull();
  });

  it("만료된 링크와 용도가 다른 링크는 거부한다", async () => {
    expect(verifyLink(signLink({ uid: "u1", act: "verify" }, -1))).toBeNull();

    const unsubToken = signLink({ uid: "u1", act: "unsubscribe" }, 3600);
    const response = await verifyRoute(
      request(`http://localhost:3000/api/notify/verify?token=${encodeURIComponent(unsubToken)}`),
    );
    expect(response.headers.get("location")).toContain("notify=invalid");
  });
});

describe("크론 알림 발송", () => {
  async function seedVerifiedUser(billingDay: number) {
    const token = await optIn();
    await putMirror(token, [
      {
        id: "sub-1",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay,
        billingCycle: "monthly",
      },
    ]);
    const userId = (await getDb().select().from(users))[0].id;
    await markVerified(userId);
    return { token, userId };
  }

  const runCron = (auth = "Bearer test-cron-secret") =>
    cronRoute(
      request("http://localhost:3000/api/cron/notify", { headers: { Authorization: auth } }),
    );

  it("인증 없이는 실행되지 않는다", async () => {
    expect((await runCron("Bearer wrong")).status).toBe(401);
  });

  it("결제 N일 전 구독에 대해 알림을 보낸다", async () => {
    await seedVerifiedUser(billingDayIn(3));

    const response = await runCron();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, notified: 1 });
  });

  it("결제일이 멀면 보내지 않는다", async () => {
    await seedVerifiedUser(billingDayIn(10));
    expect(await (await runCron()).json()).toMatchObject({ notified: 0 });
  });

  it("확인하지 않은 사용자에게는 보내지 않는다", async () => {
    const token = await optIn("unverified@example.com");
    await putMirror(token, [
      { id: "s", name: "넷플릭스", amount: 17000, billingDay: billingDayIn(3) },
    ]);

    expect(await (await runCron()).json()).toMatchObject({ recipients: 0, notified: 0 });
  });

  it("같은 결제 건에 대해 두 번 보내지 않는다", async () => {
    await seedVerifiedUser(billingDayIn(3));

    expect(await (await runCron()).json()).toMatchObject({ notified: 1 });
    // A second sweep on the same day must be a no-op.
    expect(await (await runCron()).json()).toMatchObject({ notified: 0, skipped: 1 });
    expect(await getDb().select().from(notificationLog)).toHaveLength(1);
  });
});

describe("수신 거부", () => {
  it("서버에 저장된 모든 흔적을 지운다", async () => {
    const token = await optIn();
    await putMirror(token, [{ id: "s", name: "넷플릭스", amount: 17000, billingDay: 10 }]);

    const userId = (await getDb().select().from(users))[0].id;
    await getDb()
      .insert(notificationLog)
      .values({ userId, clientId: "s", billingDate: "2026-01-10" });

    await deleteUserCompletely(userId);

    expect(await getDb().select().from(users)).toHaveLength(0);
    expect(await getDb().select().from(mirroredSubscriptions)).toHaveLength(0);
    expect(await getDb().select().from(notificationLog)).toHaveLength(0);
  });
});
