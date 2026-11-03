import { afterEach, describe, it, expect, vi } from "vitest";

/** 주소는 모듈을 읽을 때 한 번 정해지므로, 환경 변수를 바꿀 때마다 새로 읽는다. */
async function load() {
  vi.resetModules();
  return import("../../lib/api");
}

describe("apiUrl / webUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("웹 빌드에서는 API를 상대 주소 그대로 부른다", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "");
    const { apiUrl } = await load();
    expect(apiUrl("/api/fx")).toBe("/api/fx");
  });

  it("앱 빌드에서는 배포된 웹 주소를 붙인다", async () => {
    // 앱 안의 상대 주소는 https://localhost를 가리켜 서버에 닿지 않는다.
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "https://subslash.example/");
    const { apiUrl, webUrl } = await load();
    expect(apiUrl("/api/auth/me")).toBe("https://subslash.example/api/auth/me");
    expect(webUrl("/savings/share?saved=1")).toBe("https://subslash.example/savings/share?saved=1");
  });
});

describe("apiFetch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("요청마다 제한 시간을 건다 — 네트워크가 멈춰도 몇 분씩 기다리지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "");
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    const { apiFetch, API_TIMEOUT_MS } = await load();

    await apiFetch("/api/auth/me");
    expect(timeout).toHaveBeenCalledWith(API_TIMEOUT_MS);
    const init = fetchMock.mock.calls[0]![1]!;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.credentials).toBe("same-origin");
  });

  it("부르는 곳이 취소하면 제한 시간 전이라도 끊는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "");
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal!.addEventListener("abort", () => reject(init.signal!.reason));
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { apiFetch } = await load();

    const controller = new AbortController();
    const pending = apiFetch("/api/account/snapshot", { signal: controller.signal });
    controller.abort(new Error("화면을 떠남"));
    await expect(pending).rejects.toThrow("화면을 떠남");
  });

  it("제한 시간이 지나면 TimeoutError로 거절한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "");
    vi.spyOn(AbortSignal, "timeout").mockImplementation(() => {
      const controller = new AbortController();
      controller.abort(new DOMException("timed out", "TimeoutError"));
      return controller.signal;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        init.signal!.throwIfAborted();
        return new Response("{}");
      }),
    );
    const { apiFetch } = await load();
    await expect(apiFetch("/api/auth/me")).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
