import { describe, expect, it, vi } from "vitest";

/**
 * Capacitor 플러그인 프록시는 어떤 속성이든 네이티브 메서드로 답한다 — `then`까지. 프록시를 Promise의
 * 결과로 넘기면 Promise가 네이티브 'then'을 부르고 영영 끝나지 않아, 앱에서 폰 사용 기록이 계속 '확인
 * 중'에 머물고 연결 버튼도 뜨지 않았다. 같은 모양의 가짜 프록시로 확인이 끝나는지 본다.
 */
function pluginProxy(impl: Record<string, (...args: unknown[]) => Promise<unknown>>) {
  return new Proxy(
    {},
    {
      get: (_target, prop) => impl[prop as string] ?? (() => new Promise(() => {})),
    },
  );
}

const granted = { value: false };

vi.mock("@lib/platform", () => ({ IS_APP_BUILD: true }));
vi.mock("../../lib/platform", () => ({ IS_APP_BUILD: true }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "android" },
  registerPlugin: () =>
    pluginProxy({
      status: async () => ({ granted: granted.value }),
      installed: async () => ({ packages: ["com.frograms.wplay"] }),
      query: async () => ({ from: 0, dataFrom: null, days: [] }),
    }),
}));
vi.mock("@capacitor/preferences", () => ({
  Preferences: pluginProxy({ get: async () => ({ value: null }), set: async () => undefined }),
}));

function withinTwoSeconds(task: Promise<void>) {
  return Promise.race([
    task,
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error("끝나지 않음")), 2000)),
  ]);
}

describe("폰 사용 기록 확인(플러그인 프록시)", () => {
  it("권한이 꺼져 있으면 확인을 마치고 'off'가 된다", async () => {
    const { usePhoneUsageStore } = await import("../../hooks/usePhoneUsage");
    await withinTwoSeconds(usePhoneUsageStore.getState().refresh(true));
    expect(usePhoneUsageStore.getState().status).toBe("off");
  });

  it("권한이 켜져 있으면 기록을 읽고 'on'이 된다", async () => {
    granted.value = true;
    const { usePhoneUsageStore } = await import("../../hooks/usePhoneUsage");
    await withinTwoSeconds(usePhoneUsageStore.getState().refresh(true));
    expect(usePhoneUsageStore.getState().status).toBe("on");
    expect(usePhoneUsageStore.getState().installed).toEqual(["com.frograms.wplay"]);
  });
});
