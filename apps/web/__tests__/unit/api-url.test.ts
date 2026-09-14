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
    // 앱 안의 상대 주소는 capacitor://localhost를 가리켜 서버에 닿지 않는다.
    vi.stubEnv("NEXT_PUBLIC_WEB_ORIGIN", "https://subslash.example/");
    const { apiUrl, webUrl } = await load();
    expect(apiUrl("/api/auth/me")).toBe("https://subslash.example/api/auth/me");
    expect(webUrl("/savings/share?saved=1")).toBe("https://subslash.example/savings/share?saved=1");
  });
});
