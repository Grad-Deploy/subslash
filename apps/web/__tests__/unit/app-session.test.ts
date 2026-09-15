import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 앱(Capacitor) 빌드에서 로그인 세션 토큰이 오가는 길(lib/api의 apiFetch, lib/session-token).
// 빌드 대상은 모듈을 처음 읽을 때 정해지므로, 테스트마다 환경 변수를 바꾸고 모듈을 새로 읽는다.

const mocks = vi.hoisted(() => ({ prefs: new Map<string, string>() }));

// 실제 플러그인처럼 프록시로 만든다. Capacitor 플러그인은 없는 메서드(then 포함)를 부르면
// "not implemented"로 던지므로, 플러그인 객체를 Promise의 결과로 돌려주는 실수가 여기서 드러난다.
vi.mock("@capacitor/preferences", () => {
  const methods: Record<string, unknown> = {
    get: async ({ key }: { key: string }) => ({ value: mocks.prefs.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => void mocks.prefs.set(key, value),
    remove: async ({ key }: { key: string }) => void mocks.prefs.delete(key),
  };
  const Preferences = new Proxy(methods, {
    get: (target, prop) =>
      prop in target
        ? target[prop as string]
        : () => {
            throw new Error(`"Preferences.${String(prop)}()" is not implemented on android`);
          },
  });
  return { Preferences };
});

const ORIGIN = "https://subslash.example";

type Reply = { status?: number; body?: unknown };
let replies: Record<string, Reply> = {};
const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
  const reply = replies[new URL(url, ORIGIN).pathname] ?? {};
  return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200 });
});

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url, init: init!, auth: new Headers(init?.headers).get("Authorization") };
}

async function load(target: "app" | "web") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BUILD_TARGET", target === "app" ? "app" : "");
  vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", target === "app" ? ORIGIN : "");
  const api = await import("@lib/api");
  const auth = await import("../../hooks/useAuth");
  return { ...api, ...auth };
}

beforeEach(() => {
  mocks.prefs.clear();
  replies = {};
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("앱 빌드의 apiFetch", () => {
  it("로그인 응답의 토큰을 보관하고 다음 요청부터 헤더로 싣는다", async () => {
    const { apiFetch } = await load("app");
    replies["/api/auth/login"] = { body: { status: "ok", sessionToken: "tok-1" } };

    await apiFetch("/api/auth/login", { method: "POST", body: "{}" });
    expect(lastRequest().auth).toBeNull();

    await apiFetch("/api/auth/me");
    const { url, init, auth } = lastRequest();
    expect(url).toBe(`${ORIGIN}/api/auth/me`);
    expect(auth).toBe("Bearer tok-1");
    // 쿠키는 싣지 않는다. 앱 출처에서는 어차피 실리지 않고, 토큰이 유일한 자격증명이다.
    expect(init.credentials).toBe("omit");
  });

  it("실패한 로그인은 보관한 토큰을 바꾸지 않는다", async () => {
    mocks.prefs.set("subslash-session-token", "tok-old");
    const { apiFetch } = await load("app");
    replies["/api/auth/login"] = { status: 401, body: { error: "틀림", sessionToken: "tok-x" } };

    await apiFetch("/api/auth/login", { method: "POST" });
    await apiFetch("/api/auth/me");
    expect(lastRequest().auth).toBe("Bearer tok-old");
  });

  it("/me가 계정 없음을 줘도 토큰을 지우지 않는다 — 서버 오류 때도 같은 응답이다", async () => {
    mocks.prefs.set("subslash-session-token", "tok-1");
    const { refreshAuth, apiFetch } = await load("app");
    replies["/api/auth/me"] = { body: { account: null } };

    await refreshAuth();
    expect(mocks.prefs.get("subslash-session-token")).toBe("tok-1");
    await apiFetch("/api/account/snapshot");
    expect(lastRequest().auth).toBe("Bearer tok-1");
  });

  it("계정을 지우면 토큰도 지운다", async () => {
    mocks.prefs.set("subslash-session-token", "tok-1");
    const { apiFetch } = await load("app");

    await apiFetch("/api/auth/account", { method: "DELETE", body: "{}" });
    expect(lastRequest().auth).toBe("Bearer tok-1");
    expect(mocks.prefs.has("subslash-session-token")).toBe(false);

    await apiFetch("/api/auth/me");
    expect(lastRequest().auth).toBeNull();
  });

  it("로그아웃은 토큰을 실어 서버 세션을 끊고, 서버에 닿지 못해도 기기에서 지운다", async () => {
    mocks.prefs.set("subslash-session-token", "tok-1");
    const { logoutAuth } = await load("app");

    await logoutAuth();
    expect(lastRequest().url).toBe(`${ORIGIN}/api/auth/logout`);
    expect(lastRequest().auth).toBe("Bearer tok-1");
    expect(mocks.prefs.has("subslash-session-token")).toBe(false);

    mocks.prefs.set("subslash-session-token", "tok-2");
    const again = await load("app");
    fetchMock.mockRejectedValueOnce(new TypeError("network"));
    await expect(again.logoutAuth()).rejects.toThrow("network");
    expect(mocks.prefs.has("subslash-session-token")).toBe(false);
  });
});

describe("웹 빌드의 apiFetch", () => {
  it("상대 주소에 세션 쿠키로 보내고, 응답의 토큰은 보관하지 않는다", async () => {
    const { apiFetch } = await load("web");
    replies["/api/auth/login"] = { body: { status: "ok", sessionToken: "tok-1" } };

    await apiFetch("/api/auth/login", { method: "POST" });
    await apiFetch("/api/auth/me");
    const { url, init, auth } = lastRequest();
    expect(url).toBe("/api/auth/me");
    expect(init.credentials).toBe("same-origin");
    expect(auth).toBeNull();
    expect(mocks.prefs.size).toBe(0);
  });
});
