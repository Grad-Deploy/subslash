import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
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
const { POST: calendarOnRoute, DELETE: calendarOffRoute } =
  await import("../../app/api/notify/calendar/route");
const { GET: calendarFeedRoute } = await import("../../app/api/calendar/[token]/route");

// Every migration in order, so a new one is exercised the day it lands rather
// than the day someone notices the suite still builds the old schema.
const migrationsDir = join(process.cwd(), "drizzle");
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), "utf-8"));

async function resetDatabase() {
  const db = getDb();

  // 테이블 이름을 손으로 적어두면 마이그레이션이 새로 생길 때마다 이 목록이
  // 낡아, "이미 존재하는 테이블" 오류로 엉뚱한 테스트가 깨진다. 지금 DB에
  // 있는 것을 그때그때 물어보고 전부 지운다.
  const existing = (await db.all(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'` as never,
  )) as unknown as Array<{ name: string }>;

  // 외래키를 잠시 꺼야 순서에 상관없이 지울 수 있다.
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

describe("데이터베이스가 설정되지 않은 배포", () => {
  /**
   * 환경 변수가 빠진 채 배포되면, 예전에는 서버리스 파일시스템에 SQLite 파일을
   * 열려다 `Unable to open connection to local database local.db: 14` 로 500이
   * 났다. 원인이 설정 누락이라는 사실이 어디에도 드러나지 않는 메시지였다.
   */
  /** NODE_ENV는 타입상 읽기 전용이라 서술자로 바꾼다. */
  const setNodeEnv = (value: string | undefined) => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value,
      configurable: true,
      writable: true,
      enumerable: true,
    });
  };

  const withProductionNoDb = async (run: () => Promise<Response>) => {
    const url = process.env.TURSO_DATABASE_URL;
    const env = process.env.NODE_ENV;
    delete process.env.TURSO_DATABASE_URL;
    setNodeEnv("production");
    try {
      return await run();
    } finally {
      process.env.TURSO_DATABASE_URL = url;
      setNodeEnv(env);
    }
  };

  it("알림 신청은 500이 아니라 503으로 설정 누락임을 알린다", async () => {
    const res = await withProductionNoDb(() =>
      subscribeRoute(
        request("http://localhost/api/notify/subscribe", {
          method: "POST",
          body: JSON.stringify({ email: "reader@example.com" }),
        }),
      ),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("데이터베이스가 설정되어 있지 않아");
  });

  it("캘린더 피드도 503으로 답한다", async () => {
    const res = await withProductionNoDb(() =>
      calendarFeedRoute(request("http://localhost/api/calendar/whatever.ics"), {
        params: Promise.resolve({ token: "whatever.ics" }),
      } as never),
    );
    expect(res.status).toBe(503);
  });

  it("크론은 CRON_SECRET이 없으면 503으로 거부한다", async () => {
    const secret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const res = await cronRoute(request("http://localhost/api/cron/notify"));
      expect(res.status).toBe(503);
      expect((await res.json()).error).toContain("CRON_SECRET");
    } finally {
      process.env.CRON_SECRET = secret;
    }
  });
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

  it("확인된 주소로 다시 신청하면 확인 상태와 서버 사본을 넘겨주지 않고 처음부터 시작한다", async () => {
    const ownerToken = await optIn("owner@example.com");
    const [owner] = await getDb().select().from(users);
    await markVerified(owner.id);
    await putMirror(ownerToken, [
      {
        id: "sub-1",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay: 10,
        billingCycle: "monthly",
      },
    ]);

    // 주소만 아는 다른 사람이 같은 주소로 신청한다.
    const response = await subscribeRoute(
      request("http://localhost:3000/api/notify/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: "owner@example.com" }),
      }),
    );
    expect((await response.json()).verified).toBe(false);

    const rows = await getDb().select().from(users);
    expect(rows).toHaveLength(1);
    // 주인이 메일로 다시 확인하기 전에는 알림이 나가지 않는다.
    expect(rows[0].verifiedAt).toBeNull();
    // 새 토큰으로는 원래 주인의 구독 사본에 닿을 수 없다(캘린더 피드로도).
    expect(await getDb().select().from(mirroredSubscriptions)).toHaveLength(0);
    // 원래 기기의 토큰은 더 이상 통하지 않는다.
    expect((await putMirror(ownerToken, [])).status).toBe(401);
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
  async function seedVerifiedUser(billingDay: number, overrides: Record<string, unknown> = {}) {
    const token = await optIn();
    await putMirror(token, [
      {
        id: "sub-1",
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay,
        billingCycle: "monthly",
        ...overrides,
      },
    ]);
    const userId = (await getDb().select().from(users))[0].id;
    await markVerified(userId);
    return { token, userId };
  }

  /** The month a date `days` from now falls in, as 1-12. */
  function billingMonthIn(days: number): number {
    const target = new Date();
    target.setDate(target.getDate() + days);
    return target.getMonth() + 1;
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

  it("결제 월을 모르는 연간 구독에는 알림을 보내지 않는다", async () => {
    // 연간 구독은 '며칠'만으로 날짜를 알 수 없다. 매월 결제인 척 계산하면
    // 실제로 일어나지 않는 결제 11건에 대해 메일이 나간다.
    await seedVerifiedUser(billingDayIn(3), { billingCycle: "yearly" });

    expect(await (await runCron()).json()).toMatchObject({ considered: 1, notified: 0 });
  });

  it("결제 월이 있는 연간 구독은 그 달에만 알린다", async () => {
    await seedVerifiedUser(billingDayIn(3), {
      billingCycle: "yearly",
      billingMonth: billingMonthIn(3),
    });

    expect(await (await runCron()).json()).toMatchObject({ notified: 1 });
  });

  it("결제 월이 다른 연간 구독은 건너뛴다", async () => {
    await seedVerifiedUser(billingDayIn(3), {
      billingCycle: "yearly",
      billingMonth: (billingMonthIn(3) % 12) + 1,
    });

    expect(await (await runCron()).json()).toMatchObject({ notified: 0 });
  });

  it("같은 결제 건에 대해 두 번 보내지 않는다", async () => {
    await seedVerifiedUser(billingDayIn(3));

    expect(await (await runCron()).json()).toMatchObject({ notified: 1 });
    // A second sweep on the same day must be a no-op.
    expect(await (await runCron()).json()).toMatchObject({ notified: 0, skipped: 1 });
    expect(await getDb().select().from(notificationLog)).toHaveLength(1);
  });
});

describe("캘린더 피드", () => {
  async function enableFeed(token: string): Promise<string> {
    const response = await calendarOnRoute(
      request("http://localhost:3000/api/notify/calendar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    expect(response.status).toBe(200);
    return (await response.json()).url as string;
  }

  function feedTokenOf(url: string): string {
    return url.split("/").pop()!.replace(".ics", "");
  }

  async function fetchFeed(feedToken: string) {
    return calendarFeedRoute(request(`http://localhost:3000/api/calendar/${feedToken}.ics`), {
      params: Promise.resolve({ token: `${feedToken}.ics` }),
    });
  }

  it("동기화한 구독을 캘린더 일정으로 내려준다", async () => {
    const token = await optIn();
    await putMirror(token, [
      { id: "s1", name: "넷플릭스", amount: 17000, billingDay: 15, billingCycle: "monthly" },
    ]);

    const url = await enableFeed(token);
    const response = await fetchFeed(feedTokenOf(url));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");
    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("넷플릭스");
    expect(body).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=15");
  });

  it("확인 메일을 누르지 않아도 동작한다", async () => {
    const token = await optIn();
    await putMirror(token, [{ id: "s1", name: "왓챠", amount: 7900, billingDay: 3 }]);

    const response = await fetchFeed(feedTokenOf(await enableFeed(token)));

    expect(response.status).toBe(200);
    expect((await getDb().select().from(users))[0].verifiedAt).toBeNull();
  });

  it("원본 토큰이 아니라 해시만 저장한다", async () => {
    const token = await optIn();
    const feedToken = feedTokenOf(await enableFeed(token));

    const row = (await getDb().select().from(users))[0];
    expect(row.calendarTokenHash).toBe(hashSyncToken(feedToken));
    expect(row.calendarTokenHash).not.toBe(feedToken);
  });

  it("캘린더 토큰으로는 미러를 덮어쓸 수 없다", async () => {
    const token = await optIn();
    const feedToken = feedTokenOf(await enableFeed(token));

    const response = await putMirror(feedToken, [
      { id: "x", name: "침입", amount: 1, billingDay: 1 },
    ]);

    expect(response.status).toBe(401);
  });

  it("새 주소를 만들면 이전 주소는 끊긴다", async () => {
    const token = await optIn();
    const oldToken = feedTokenOf(await enableFeed(token));
    const newToken = feedTokenOf(await enableFeed(token));

    expect(newToken).not.toBe(oldToken);
    expect((await fetchFeed(oldToken)).status).toBe(404);
    expect((await fetchFeed(newToken)).status).toBe(200);
  });

  it("구독을 끊으면 주소가 더 이상 열리지 않는다", async () => {
    const token = await optIn();
    const feedToken = feedTokenOf(await enableFeed(token));

    await calendarOffRoute(
      request("http://localhost:3000/api/notify/calendar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    expect((await fetchFeed(feedToken)).status).toBe(404);
  });

  it("존재하지 않는 토큰은 404로만 답한다", async () => {
    expect((await fetchFeed("deadbeef")).status).toBe(404);
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
