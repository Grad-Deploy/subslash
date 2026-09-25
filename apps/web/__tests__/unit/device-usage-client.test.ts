import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 기기 간 사용 측정의 기기 쪽(`lib/device-usage-client`). 네이티브는 폰 사용 기록과 같은 UsageStats
 * 플러그인(`lib/usage/native`)이다.
 *
 * - 네이티브 플러그인 프록시는 `then`까지 네이티브 메서드로 만든다. async 함수가 프록시를 그대로
 *   돌려주면 `await`가 끝나지 않아, 측정 화면이 '확인 중'에서 멈춘다.
 * - 측정은 켠 계정에 묶는다. 같은 기기에 다른 사람이 로그인하면 그 계정으로 올리지 않는다.
 */

const mocks = vi.hoisted(() => ({
  granted: true,
  requests: [] as { url: string; method: string; body: unknown }[],
  failDelete: false,
}));

vi.mock("@capacitor/core", () => {
  const methods: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    status: async () => ({ granted: mocks.granted }),
    openSettings: async () => undefined,
    queryForeground: async () => ({
      intervals: [
        { packageName: "com.netflix.mediaclient", start: Date.now() - 60_000, end: Date.now() },
        { packageName: "com.unknown.app", start: Date.now() - 60_000, end: Date.now() },
      ],
      firstEventAt: null,
    }),
  };
  return {
    Capacitor: { getPlatform: () => "android" },
    // 진짜 프록시처럼 모르는 속성(then 포함)도 '네이티브 메서드'로 돌려준다. 이 then은 영원히 끝나지 않는다.
    registerPlugin: () =>
      new Proxy(
        {},
        {
          get: (_, prop: string) => methods[prop] ?? (() => new Promise(() => undefined)),
        },
      ),
  };
});

vi.mock("../../lib/api", () => ({
  apiFetch: async (url: string, init: { method?: string; body?: string } = {}) => {
    const method = init.method ?? "GET";
    mocks.requests.push({ url, method, body: init.body ? JSON.parse(init.body) : null });
    if (method === "DELETE" && mocks.failDelete) {
      return new Response(JSON.stringify({ error: "잠시 뒤에" }), { status: 500 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  },
  readApiError: async (_: Response, fallback: string) => fallback,
}));

const ORIGINAL_TARGET = process.env.NEXT_PUBLIC_BUILD_TARGET;

async function load() {
  return import("../../lib/device-usage-client");
}

function withTimeout<T>(promise: Promise<T>, ms = 500): Promise<T | "timeout"> {
  return Promise.race([promise, new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms))]);
}

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
  mocks.granted = true;
  mocks.requests = [];
  mocks.failDelete = false;
  process.env.NEXT_PUBLIC_BUILD_TARGET = "app";
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_BUILD_TARGET = ORIGINAL_TARGET;
  vi.unstubAllGlobals();
});

describe("네이티브 플러그인", () => {
  it("프록시의 then에 걸리지 않고 끝난다", async () => {
    const client = await load();
    expect(await withTimeout(client.canMeasureOnThisDevice())).toBe(true);
    expect(await withTimeout(client.hasUsageAccess())).toBe(true);
  });

  it("목록에 있는 서비스의 구간만 올린다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    const upload = await withTimeout(client.collectUpload());
    expect(upload).not.toBe("timeout");
    expect(upload && upload !== "timeout" ? upload.intervals.map((i) => i.serviceId) : []).toEqual([
      "netflix",
    ]);
  });
});

describe("측정을 켠 계정", () => {
  it("다른 계정으로 로그인해 있으면 올리지 않는다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    expect(await client.uploadThisDevice("acc-2")).toBe(false);
    expect(mocks.requests).toEqual([]);

    expect(await client.uploadThisDevice("acc-1")).toBe(true);
    expect(mocks.requests.map((r) => r.method)).toEqual(["POST"]);
    expect(client.useDeviceUsage.getState().uploadedUntil).not.toBeNull();
  });

  it("다른 계정으로 새로 켜면 이어 잴 자리를 비운다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    client.useDeviceUsage.getState().markUploaded(1_000);
    client.useDeviceUsage.getState().enableFor("acc-1");
    expect(client.useDeviceUsage.getState().uploadedUntil).toBe(1_000);
    client.useDeviceUsage.getState().enableFor("acc-2");
    expect(client.useDeviceUsage.getState().uploadedUntil).toBeNull();
    expect(client.isMeasuringFor(client.useDeviceUsage.getState(), "acc-1")).toBe(false);
  });

  it("사용 정보 접근이 없으면 올리지 않는다", async () => {
    const client = await load();
    mocks.granted = false;
    client.useDeviceUsage.getState().enableFor("acc-1");
    expect(await client.uploadThisDevice("acc-1")).toBe(false);
    expect(mocks.requests).toEqual([]);
  });
});

describe("끄기", () => {
  it("끄면 이 기기 기록을 지우고 켠 계정도 잊는다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    const deviceKey = client.useDeviceUsage.getState().ensureDeviceKey();
    await client.stopMeasuringThisDevice();
    expect(mocks.requests).toEqual([{ url: "/api/usage", method: "DELETE", body: { deviceKey } }]);
    expect(client.useDeviceUsage.getState()).toMatchObject({ enabled: false, accountId: null });
  });

  it("지우지 못하면 켜진 상태로 되돌려 다시 누를 수 있게 한다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    client.useDeviceUsage.getState().ensureDeviceKey();
    mocks.failDelete = true;
    await expect(client.stopMeasuringThisDevice()).rejects.toThrow();
    expect(client.isMeasuringFor(client.useDeviceUsage.getState(), "acc-1")).toBe(true);
  });

  it("모든 기기 기록을 지우면 이 기기가 그 계정으로 재던 것도 끈다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    await client.deleteAllDeviceUsage("acc-1");
    expect(mocks.requests.at(-1)).toMatchObject({ method: "DELETE", body: { all: true } });
    expect(client.useDeviceUsage.getState().enabled).toBe(false);
  });
});
