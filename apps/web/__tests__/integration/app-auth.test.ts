import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

/**
 * 앱(Capacitor)의 로그인을 실제 SQLite에 대고 돌린다.
 *
 * 앱의 화면은 다른 출처(capacitor://localhost)에서 돌아 쿠키가 실리지 않는다. 그래서 앱은
 * 세션 토큰을 응답 본문으로 받아 `Authorization: Bearer` 헤더로 보낸다. 확인하려는 것:
 * 1. 본문의 토큰은 앱 출처에만 준다. 웹은 지금처럼 httpOnly 쿠키만 받는다.
 * 2. 헤더 토큰으로 로그인 상태 확인·로그아웃이 된다.
 * 3. CORS는 앱 출처에만 열린다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { SESSION_COOKIE } = await import("../../lib/auth-server");
const { POST: signupRoute } = await import("../../app/api/auth/signup/route");
const { POST: loginRoute } = await import("../../app/api/auth/login/route");
const { POST: logoutRoute } = await import("../../app/api/auth/logout/route");
const { GET: meRoute } = await import("../../app/api/auth/me/route");
const { middleware } = await import("../../middleware");

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

const IOS_APP = "capacitor://localhost";
const ANDROID_APP = "https://localhost";
const WEB = "https://subslash.example";

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function get(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers });
}

/** scrypt는 일부러 느리다. 해시를 여러 번 도는 테스트는 시간을 넉넉히 준다. */
const SCRYPT_TIMEOUT_MS = 60_000;

const SIGNUP = {
  username: "app_user",
  email: "app-user@gmail.com",
  password: "subslash-2026!",
  passwordConfirm: "subslash-2026!",
  isOver14: true,
};
const LOGIN = { identifier: SIGNUP.username, password: SIGNUP.password };

beforeEach(async () => {
  await resetDatabase();
  const res = await signupRoute(post("http://localhost/api/auth/signup", SIGNUP));
  expect(res.status).toBe(201);
}, SCRYPT_TIMEOUT_MS);

afterAll(() => {
  closeDb();
});

describe("앱 로그인 (헤더 토큰)", () => {
  it(
    "앱 출처에서 로그인하면 본문에 토큰을 주고, 그 토큰을 헤더로 보내면 로그인 상태다",
    async () => {
      for (const origin of [IOS_APP, ANDROID_APP]) {
        const res = await loginRoute(post("http://localhost/api/auth/login", LOGIN, { origin }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.sessionToken).toMatch(/^[0-9a-f]{64}$/);
        expect(new Date(body.sessionExpiresAt).getTime()).toBeGreaterThan(Date.now());

        const me = await meRoute(
          get("http://localhost/api/auth/me", { authorization: `Bearer ${body.sessionToken}` }),
        );
        expect((await me.json()).account?.username).toBe(SIGNUP.username);
      }
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "웹 출처나 출처 없는 요청에는 본문에 토큰을 주지 않고 쿠키만 준다",
    async () => {
      for (const headers of [{ origin: WEB }, {} as Record<string, string>]) {
        const res = await loginRoute(post("http://localhost/api/auth/login", LOGIN, headers));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.sessionToken).toBeUndefined();
        expect(res.headers.get("set-cookie") ?? "").toContain(`${SESSION_COOKIE}=`);
      }
    },
    SCRYPT_TIMEOUT_MS,
  );

  it(
    "헤더 토큰으로 로그아웃하면 그 세션은 더 이상 통하지 않는다",
    async () => {
      const login = await loginRoute(
        post("http://localhost/api/auth/login", LOGIN, { origin: IOS_APP }),
      );
      const { sessionToken } = await login.json();
      const auth = { authorization: `Bearer ${sessionToken}` };

      await logoutRoute(post("http://localhost/api/auth/logout", {}, auth));
      const me = await meRoute(get("http://localhost/api/auth/me", auth));
      expect((await me.json()).account).toBeNull();
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("형식이 틀린 헤더는 로그인으로 치지 않는다", async () => {
    for (const authorization of ["Bearer nope", "Basic abc", "Bearer ", "nope"]) {
      const me = await meRoute(get("http://localhost/api/auth/me", { authorization }));
      expect((await me.json()).account).toBeNull();
    }
  });
});

describe("CORS (middleware)", () => {
  it("앱 출처의 사전 요청에는 그 출처와 Authorization 헤더를 허용한다", () => {
    for (const origin of [IOS_APP, ANDROID_APP]) {
      const res = middleware(
        new NextRequest("http://localhost/api/auth/me", {
          method: "OPTIONS",
          headers: { origin, "access-control-request-headers": "authorization" },
        }),
      );
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe(origin);
      expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
      // 쿠키는 다른 출처로 보내지 않는다.
      expect(res.headers.get("access-control-allow-credentials")).toBeNull();
    }
  });

  it("앱 출처의 실제 요청 응답에도 허용 출처를 붙인다", () => {
    const res = middleware(get("http://localhost/api/auth/me", { origin: ANDROID_APP }));
    expect(res.headers.get("access-control-allow-origin")).toBe(ANDROID_APP);
  });

  it("다른 출처에는 CORS를 열지 않는다", () => {
    for (const origin of [WEB, "https://evil.example", "http://localhost"]) {
      const res = middleware(
        new NextRequest("http://localhost/api/auth/me", { method: "OPTIONS", headers: { origin } }),
      );
      expect(res.status).not.toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBeNull();
    }
  });
});
