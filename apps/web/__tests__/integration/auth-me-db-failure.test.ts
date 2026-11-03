import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * DB가 실패했을 때 `/api/auth/me`가 '계정 없음'(200)으로 답하면 화면이 로그아웃으로 받아 기록을 비로그인 칸으로
 * 바꾼다. 실패는 실패로 답해야 한다.
 */

process.env.TURSO_DATABASE_URL = ":memory:";
delete process.env.TURSO_AUTH_TOKEN;

const getRequestAccount = vi.fn();
vi.mock("@lib/auth-server", async (importOriginal) => ({
  SessionCheckThrottledError: (await importOriginal<typeof import("@lib/auth-server")>())
    .SessionCheckThrottledError,
  getRequestAccount,
  toPublicAccount: (account: unknown) => account,
}));

const { GET } = await import("../../app/api/auth/me/route");
const { DB_REQUEST_TIMEOUT_MS, fetchWithTimeout } = await import("../../lib/db");

const request = () => new NextRequest("http://localhost/api/auth/me");

describe("/api/auth/me", () => {
  it("DB가 실패하면 계정 없음이 아니라 503으로 답한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getRequestAccount.mockRejectedValueOnce(new Error("quota exceeded"));

    const res = await GET(request());

    expect(res.status).toBe(503);
    expect(await res.json()).not.toHaveProperty("account");
  });

  it("세션이 없는 것은 그대로 200과 계정 없음이다", async () => {
    getRequestAccount.mockResolvedValueOnce(null);

    const res = await GET(request());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ account: null });
  });
});

describe("fetchWithTimeout", () => {
  it("제한 시간이 지나면 응답을 기다리지 않고 실패한다", async () => {
    const neverAnswers: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
      });

    await expect(fetchWithTimeout(10, neverAnswers)("https://db.example")).rejects.toMatchObject({
      name: "TimeoutError",
    });
  });

  it("Request 객체 하나로 부르는 libsql의 호출을 그대로 넘기고 신호를 싣는다", async () => {
    const base = vi.fn<typeof fetch>(async () => new Response("ok"));
    const req = new Request("https://db.example", { method: "POST", body: "{}" });

    await fetchWithTimeout(DB_REQUEST_TIMEOUT_MS, base)(req);

    expect(base.mock.calls[0][0]).toBe(req);
    expect(base.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
