import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { eq } from "drizzle-orm";

/**
 * 회원가입 → 로그인 → 세션 확인 → 로그아웃을 실제 SQLite에 대고 돌린다.
 *
 * 여기서 확인하려는 것은 두 가지다.
 * 1. 비밀번호가 평문으로 저장되지 않는다.
 * 2. 사용자가 넣은 값이 SQL 문장에 섞여 들어가지 않는다 — 따옴표든
 *    `DROP TABLE`이든 한 칸의 데이터로만 남는다.
 */

/**
 * 가입 라우트는 이메일 도메인을 실제 DNS에 물어본다. 테스트가 네트워크에 기대면
 * 오프라인에서 깨지고, 여기서 쓰는 example.com은 "메일을 받지 않는 도메인"으로
 * 선언돼 있어(null MX) 그대로 두면 모든 가입이 막힌다. 조회 로직 자체는
 * unit/email-domain.test.ts가 가짜 응답으로 확인하고, 여기서는 라우트가 그 결과를
 * 어떻게 다루는지만 본다.
 */
const { checkEmailDomain } = vi.hoisted(() => ({ checkEmailDomain: vi.fn() }));
vi.mock("../../lib/email-domain", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/email-domain")>()),
  checkEmailDomain,
}));

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const { getDb, closeDb } = await import("../../lib/db");
const { accounts, sessions } = await import("../../lib/schema");
const { hashSessionToken, SESSION_COOKIE } = await import("../../lib/auth-server");

const { POST: signupRoute } = await import("../../app/api/auth/signup/route");
const { POST: loginRoute } = await import("../../app/api/auth/login/route");
const { POST: logoutRoute } = await import("../../app/api/auth/logout/route");
const { GET: meRoute } = await import("../../app/api/auth/me/route");

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

/** Next 라우트가 읽는 것은 url·headers·cookies·json 뿐이다. */
function request(url: string, init?: RequestInit & { cookie?: string }) {
  const headers = new Headers(init?.headers);
  if (init?.cookie) headers.set("cookie", init.cookie);
  const req = new Request(url, { ...init, headers }) as Request & {
    nextUrl: URL;
    cookies: { get(name: string): { value: string } | undefined };
  };
  req.nextUrl = new URL(url);
  const jar = new Map<string, string>();
  for (const part of (init?.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) jar.set(name, rest.join("="));
  }
  req.cookies = { get: (name) => (jar.has(name) ? { value: jar.get(name)! } : undefined) };
  return req as never;
}

function json(url: string, body: unknown, cookie?: string) {
  return request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cookie,
  });
}

/**
 * scrypt는 일부러 느리다(그게 방어의 핵심이다). 해시를 여러 번 도는
 * 테스트는 기본 5초 안에 끝나지 않으므로 개별로 시간을 넉넉히 준다.
 * 전역 타임아웃을 올리면 다른 테스트가 진짜로 멈췄을 때를 놓친다.
 */
const SCRYPT_TIMEOUT_MS = 60_000;

const VALID_SIGNUP = {
  username: "sean_lee",
  email: "sean@example.com",
  password: "subslash-2026!",
  passwordConfirm: "subslash-2026!",
  age: 30,
  gender: "male",
};

/** Set-Cookie에서 세션 토큰만 뽑아낸다. */
function sessionTokenFrom(response: Response): string {
  const raw = response.headers.get("set-cookie") ?? "";
  const match = raw.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`));
  return match?.[1] ?? "";
}

beforeEach(async () => {
  await resetDatabase();
  checkEmailDomain.mockReset();
  checkEmailDomain.mockResolvedValue({ ok: true });
});

afterAll(() => {
  closeDb();
});

describe("회원가입", () => {
  it("계정을 만들고 곧바로 로그인 상태가 된다", async () => {
    const res = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.account.username).toBe("sean_lee");
    expect(body.account.email).toBe("sean@example.com");
    expect(body.account.age).toBe(30);

    // 응답에 비밀번호 관련 값이 섞여 나가지 않는다.
    expect(JSON.stringify(body)).not.toContain("password");

    expect(sessionTokenFrom(res).length).toBeGreaterThan(0);
  });

  it("비밀번호를 평문으로 저장하지 않는다", async () => {
    await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));

    const db = getDb();
    const [row] = await db.select().from(accounts).where(eq(accounts.username, "sean_lee"));

    expect(row.passwordHash).not.toBe(VALID_SIGNUP.password);
    expect(row.passwordHash.startsWith("scrypt$")).toBe(true);

    // 어느 칸에도 평문이 남아있지 않다.
    expect(JSON.stringify(row)).not.toContain(VALID_SIGNUP.password);
  });

  it("세션 토큰도 원문이 아니라 해시로만 저장된다", async () => {
    const res = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const token = sessionTokenFrom(res);

    const db = getDb();
    const rows = await db.select().from(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token);
    expect(rows[0].tokenHash).toBe(hashSessionToken(token));
  });

  it("입력값을 서버가 다시 검사한다", async () => {
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", {
        ...VALID_SIGNUP,
        password: "short",
        passwordConfirm: "short",
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.password).toBeDefined();
  });

  it("만 14세 미만은 받지 않는다", async () => {
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, age: 13 }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.age).toBeDefined();
  });

  it(
    "같은 아이디·이메일로 두 번 가입할 수 없다",
    async () => {
      await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));

      const dupUsername = await signupRoute(
        json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, email: "other@example.com" }),
      );
      expect(dupUsername.status).toBe(409);
      expect((await dupUsername.json()).fieldErrors.username).toBeDefined();

      const dupEmail = await signupRoute(
        json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, username: "other_id" }),
      );
      expect(dupEmail.status).toBe(409);
      expect((await dupEmail.json()).fieldErrors.email).toBeDefined();
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("대소문자만 바꾼 아이디로 중복 가입할 수 없다", async () => {
    await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", {
        ...VALID_SIGNUP,
        username: "SEAN_LEE",
        email: "OTHER@EXAMPLE.COM",
      }),
    );
    expect(res.status).toBe(409);
  });
});

describe("이메일 도메인 확인", () => {
  it("존재하지 않는 도메인이면 가입을 막는다", async () => {
    checkEmailDomain.mockResolvedValueOnce({ ok: false, reason: "not-found" });
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, email: "sean@gmial-typo.com" }),
    );
    expect(res.status).toBe(400);
    const email = (await res.json()).fieldErrors.email;
    expect(email).toContain("gmial-typo.com");
    expect(email).toContain("존재하지 않는");
    expect(await getDb().select().from(accounts)).toHaveLength(0);
  });

  it("메일을 받지 않는 도메인도 막는다", async () => {
    checkEmailDomain.mockResolvedValueOnce({ ok: false, reason: "no-mail" });
    const res = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    expect(res.status).toBe(400);
    expect((await res.json()).fieldErrors.email).toContain("메일을 받을 수 없는");
    expect(await getDb().select().from(accounts)).toHaveLength(0);
  });

  it("도메인을 확인할 수 없으면 가입시키지 않되, 잘못된 도메인이라고 단정하지 않는다", async () => {
    checkEmailDomain.mockResolvedValueOnce({
      ok: false,
      reason: "unverifiable",
      detail: "ETIMEOUT",
    });
    const res = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    // 입력이 틀린 게 아니라 지금 확인을 못 한 것이다.
    expect(res.status).toBe(503);
    const email = (await res.json()).fieldErrors.email;
    expect(email).toContain("확인할 수 없습니다");
    expect(email).not.toContain("존재하지 않는");
    expect(await getDb().select().from(accounts)).toHaveLength(0);
  });

  it("조회에는 정리된(소문자) 도메인을 넘긴다", async () => {
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, email: "Sean@Example.COM" }),
    );
    expect(res.status).toBe(201);
    expect(checkEmailDomain).toHaveBeenCalledWith("example.com");
  });

  it("형식부터 틀린 이메일은 DNS까지 묻지 않는다", async () => {
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, email: "sean@example" }),
    );
    expect(res.status).toBe(400);
    expect(checkEmailDomain).not.toHaveBeenCalled();
  });
});

describe("로그인", () => {
  beforeEach(async () => {
    await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
  });

  it("아이디로 로그인한다", async () => {
    const res = await loginRoute(
      json("http://localhost/api/auth/login", {
        identifier: "sean_lee",
        password: VALID_SIGNUP.password,
      }),
    );
    expect(res.status).toBe(200);
    expect(sessionTokenFrom(res).length).toBeGreaterThan(0);
  });

  it("이메일로도 로그인한다", async () => {
    const res = await loginRoute(
      json("http://localhost/api/auth/login", {
        identifier: "sean@example.com",
        password: VALID_SIGNUP.password,
      }),
    );
    expect(res.status).toBe(200);
  });

  it("비밀번호가 틀리면 막는다", async () => {
    const res = await loginRoute(
      json("http://localhost/api/auth/login", { identifier: "sean_lee", password: "wrong-one!!" }),
    );
    expect(res.status).toBe(401);
  });

  it(
    "없는 아이디와 틀린 비밀번호의 응답이 서로 구분되지 않는다",
    async () => {
      const missing = await loginRoute(
        json("http://localhost/api/auth/login", { identifier: "nobody", password: "whatever!!" }),
      );
      const wrong = await loginRoute(
        json("http://localhost/api/auth/login", { identifier: "sean_lee", password: "whatever!!" }),
      );
      expect(missing.status).toBe(wrong.status);
      expect(await missing.json()).toEqual(await wrong.json());
    },
    SCRYPT_TIMEOUT_MS,
  );
});

describe("세션", () => {
  it("쿠키로 로그인한 계정을 알아본다", async () => {
    const signup = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const token = sessionTokenFrom(signup);

    const res = await meRoute(
      request("http://localhost/api/auth/me", { cookie: `${SESSION_COOKIE}=${token}` }),
    );
    expect((await res.json()).account.username).toBe("sean_lee");
  });

  it("쿠키가 없으면 오류가 아니라 '로그인 안 됨'이다", async () => {
    const res = await meRoute(request("http://localhost/api/auth/me"));
    expect(res.status).toBe(200);
    expect((await res.json()).account).toBeNull();
  });

  it("만료된 세션은 통하지 않는다", async () => {
    const signup = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const token = sessionTokenFrom(signup);

    const db = getDb();
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .where(eq(sessions.tokenHash, hashSessionToken(token)));

    const res = await meRoute(
      request("http://localhost/api/auth/me", { cookie: `${SESSION_COOKIE}=${token}` }),
    );
    expect((await res.json()).account).toBeNull();
  });

  it("로그아웃하면 서버의 세션도 사라진다", async () => {
    const signup = await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const token = sessionTokenFrom(signup);

    await logoutRoute(json("http://localhost/api/auth/logout", {}, `${SESSION_COOKIE}=${token}`));

    const db = getDb();
    expect(await db.select().from(sessions)).toHaveLength(0);

    const res = await meRoute(
      request("http://localhost/api/auth/me", { cookie: `${SESSION_COOKIE}=${token}` }),
    );
    expect((await res.json()).account).toBeNull();
  });
});

describe("데이터베이스가 없는 배포", () => {
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

  it("가입은 503으로 설정 누락임을 알린다", async () => {
    const res = await withProductionNoDb(() =>
      signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP)),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("데이터베이스가 설정되어 있지 않아");
  });

  it("로그인도 503으로 답한다", async () => {
    const res = await withProductionNoDb(() =>
      loginRoute(
        json("http://localhost/api/auth/login", { identifier: "sean_lee", password: "whatever!!" }),
      ),
    );
    expect(res.status).toBe(503);
  });

  it("현재 계정 조회는 오류가 아니라 '로그인 안 됨'이다", async () => {
    // 계정이라는 개념이 없는 서버에서 503을 내면 헤더가 오류 상태가 된다.
    const res = await withProductionNoDb(() =>
      meRoute(request("http://localhost/api/auth/me", { cookie: `${SESSION_COOKIE}=whatever` })),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).account).toBeNull();
  });

  it("로그아웃은 쿠키만 지우고 성공한다", async () => {
    const res = await withProductionNoDb(() =>
      logoutRoute(json("http://localhost/api/auth/logout", {}, `${SESSION_COOKIE}=whatever`)),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
  });
});

describe("입력값이 쿼리문에 섞여 들어가지 않는다", () => {
  const INJECTIONS = [
    "'; DROP TABLE accounts; --",
    "' OR '1'='1",
    "admin'--",
    '" OR 1=1 --',
    "'); DELETE FROM sessions; --",
    "' UNION SELECT password_hash FROM accounts --",
  ];

  it(
    "로그인 식별자에 SQL을 넣어도 테이블이 살아있고 로그인되지 않는다",
    async () => {
      await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
      const db = getDb();

      for (const payload of INJECTIONS) {
        const res = await loginRoute(
          json("http://localhost/api/auth/login", { identifier: payload, password: payload }),
        );
        // 통과해서도 안 되고, 500으로 터져서도 안 된다 — 그냥 값이 안 맞는 것뿐이다.
        expect(res.status).toBe(401);
        // 테이블이 지워지지 않았다.
        expect(await db.select().from(accounts)).toHaveLength(1);
      }

      // 세션 테이블도 그대로다.
      expect(await db.select().from(sessions)).toHaveLength(1);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("이메일에 SQL을 넣으면 형식 검사에서 먼저 막히고 테이블은 그대로다", async () => {
    const db = getDb();
    const res = await signupRoute(
      json("http://localhost/api/auth/signup", {
        ...VALID_SIGNUP,
        email: "'; DROP TABLE accounts; --@example.com",
      }),
    );
    expect(res.status).toBe(400);
    expect(await db.select().from(accounts)).toHaveLength(0);
  });

  it(
    "비밀번호에 SQL 문자열을 써도 그대로 저장되고 로그인된다",
    async () => {
      const password = "'; DROP TABLE accounts; --xyz";
      const db = getDb();

      const signup = await signupRoute(
        json("http://localhost/api/auth/signup", {
          ...VALID_SIGNUP,
          password,
          passwordConfirm: password,
        }),
      );
      expect(signup.status).toBe(201);
      expect(await db.select().from(accounts)).toHaveLength(1);

      const login = await loginRoute(
        json("http://localhost/api/auth/login", { identifier: "sean_lee", password }),
      );
      expect(login.status).toBe(200);
    },
    SCRYPT_TIMEOUT_MS,
  );

  it("아이디에 SQL을 넣으면 형식 검사에서 먼저 막힌다", async () => {
    const db = getDb();
    for (const payload of INJECTIONS) {
      const res = await signupRoute(
        json("http://localhost/api/auth/signup", { ...VALID_SIGNUP, username: payload }),
      );
      expect(res.status).toBe(400);
      expect(await db.select().from(accounts)).toHaveLength(0);
    }
  });

  it("세션 쿠키에 SQL을 넣어도 조회가 값으로만 다뤄진다", async () => {
    await signupRoute(json("http://localhost/api/auth/signup", VALID_SIGNUP));
    const db = getDb();

    for (const payload of INJECTIONS) {
      const res = await meRoute(
        request("http://localhost/api/auth/me", { cookie: `${SESSION_COOKIE}=${payload}` }),
      );
      expect((await res.json()).account).toBeNull();
      expect(await db.select().from(accounts)).toHaveLength(1);
    }
  });
});
