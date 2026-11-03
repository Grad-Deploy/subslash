import { describe, expect, it, vi } from "vitest";
import { SessionCheckThrottledError } from "../../lib/auth-server";
import { serverErrorResponse, sessionThrottledResponse } from "../../lib/route-error";

describe("serverErrorResponse", () => {
  it("처리하지 못한 오류는 줄을 남기고 화면 문구와 함께 500으로 답한다", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = serverErrorResponse("api/x", new Error("boom"), "저장하지 못했습니다.");
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "저장하지 못했습니다." });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]![0])).toContain("[api/x] Error: boom");
    errorSpy.mockRestore();
  });

  it("상태 코드를 바꿀 수 있다", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(serverErrorResponse("api/me", new Error("db"), "database_unavailable", 503).status).toBe(
      503,
    );
    vi.restoreAllMocks();
  });

  it("세션 확인을 막은 것은 줄을 남기지 않고 429와 Retry-After로 답한다", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = serverErrorResponse("api/x", new SessionCheckThrottledError(42), "msg");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("sessionThrottledResponse", () => {
  it("막은 오류가 아니면 null이다", () => {
    expect(sessionThrottledResponse(new Error("x"))).toBeNull();
    expect(sessionThrottledResponse(new SessionCheckThrottledError(5))?.status).toBe(429);
  });
});
