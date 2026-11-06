import { beforeEach, describe, expect, it, vi } from "vitest";

const run = vi.hoisted(() => vi.fn());
vi.mock("../../lib/db", () => ({ getDb: () => ({ run }) }));
const logError = vi.hoisted(() => vi.fn());
vi.mock("../../lib/log", () => ({ logError }));

const { GET } = await import("../../app/api/health/route");

describe("GET /api/health", () => {
  beforeEach(() => {
    run.mockReset();
    logError.mockReset();
  });

  it("DB에 닿으면 200과 상태만 돌려준다", async () => {
    run.mockResolvedValue(undefined);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(logError).not.toHaveBeenCalled();
  });

  it("DB가 실패하면 503을 돌려주고 원인은 응답에 싣지 않는다", async () => {
    run.mockRejectedValue(new Error("libsql://secret-db.turso.io timed out"));
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.text();
    expect(body).toBe('{"status":"error"}');
    expect(body).not.toContain("secret-db");
    expect(logError).toHaveBeenCalledWith("api/health", expect.any(Error));
  });
});
