import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const logError = vi.hoisted(() => vi.fn());
vi.mock("../../lib/log", () => ({ logError }));
const active = vi.hoisted(() => ({ value: false }));
vi.mock("../../lib/error-export", () => ({ isErrorExportActive: () => active.value }));

const { POST } = await import("../../app/api/ops/error-export-check/route");

function request(authorization?: string) {
  return new NextRequest("https://www.subslash.me/api/ops/error-export-check", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

describe("POST /api/ops/error-export-check", () => {
  beforeEach(() => {
    logError.mockClear();
    active.value = false;
    vi.stubEnv("CRON_SECRET", "cron-secret");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("비밀값이 없으면 줄을 남기지 않는다", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(request("Bearer "))).status).toBe(503);
    expect(logError).not.toHaveBeenCalled();
  });

  it("비밀값이 틀리면 거절한다", async () => {
    expect((await POST(request("Bearer wrong"))).status).toBe(401);
    expect((await POST(request())).status).toBe(401);
    expect(logError).not.toHaveBeenCalled();
  });

  it("logError로 찾을 수 있는 한 줄을 남기고 내보내기 상태를 알린다", async () => {
    active.value = true;
    const response = await POST(request("Bearer cron-secret"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string; active: boolean };
    expect(body.active).toBe(true);
    expect(body.id).toMatch(/^check-[\w-]+$/);
    expect(logError).toHaveBeenCalledWith(
      "ops/error-export-check",
      expect.stringContaining(body.id),
    );
  });

  it("내보내기가 꺼져 있으면 그렇게 답한다", async () => {
    const body = (await (await POST(request("Bearer cron-secret"))).json()) as {
      active: boolean;
    };
    expect(body.active).toBe(false);
  });
});
