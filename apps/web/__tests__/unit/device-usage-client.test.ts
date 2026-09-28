import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 기기 간 사용 측정의 기기 쪽(`lib/device-usage-client`). 네이티브는 폰 사용 기록과 같은 UsageStats
 * 플러그인(`lib/usage/native`)이다.
 *
 * - 네이티브 플러그인 프록시는 `then`까지 네이티브 메서드로 만든다. async 함수가 프록시를 그대로
 *   돌려주면 `await`가 끝나지 않아, 측정 화면이 '확인 중'에서 멈춘다.
 * - 측정은 켠 계정에 묶는다. 같은 기기에 다른 사람이 로그인하면 그 계정으로 올리지 않는다.
 * - 기기 키는 앱을 지웠다 다시 설치해도 같다(ANDROID_ID를 계정과 섞은 해시). 같은 폰이 두 기기로 남지 않는다.
 */

const mocks = vi.hoisted(() => ({
  granted: true,
  requests: [] as { url: string; method: string; body: unknown }[],
  failDelete: false,
  /** 네이티브 기기 식별값. undefined면 deviceId 메서드가 없는 예전 앱(거절한다). */
  androidId: undefined as string | null | undefined,
}));

vi.mock("@capacitor/core", () => {
  const methods: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    status: async () => ({ granted: mocks.granted }),
    openSettings: async () => undefined,
    deviceId: async () => {
      if (mocks.androidId === undefined) throw new Error("not implemented");
      return { id: mocks.androidId };
    },
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
  mocks.androidId = undefined;
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

describe("다시 설치한 기기", () => {
  it("기기 키는 앱을 다시 설치해도 같고, 계정마다 다르며, 식별값을 그대로 담지 않는다", async () => {
    mocks.androidId = "a1b2c3d4e5f60718";
    const client = await load();
    const first = await client.stableDeviceKey("acc-1");
    vi.resetModules(); // 다시 설치: 앱 저장소가 비어 있다
    const again = await (await load()).stableDeviceKey("acc-1");
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(again).toBe(first);
    expect(await client.stableDeviceKey("acc-2")).not.toBe(first);
    expect(first).not.toContain("a1b2c3d4e5f60718");
  });

  it("다시 설치한 뒤 켜면 새 기기가 아니라 같은 키로 올린다(서버가 그 기간을 통째로 바꾼다)", async () => {
    mocks.androidId = "a1b2c3d4e5f60718";
    const before = await load();
    before.useDeviceUsage.getState().enableFor("acc-1");
    await before.uploadThisDevice("acc-1");
    const firstKey = (mocks.requests.at(-1)?.body as { deviceKey: string }).deviceKey;

    // 앱 삭제 → 다시 설치: 저장소가 비고, 측정을 다시 켠다.
    localStorage.removeItem("subslash-device-usage");
    vi.resetModules();
    mocks.requests = [];
    const after = await load();
    after.useDeviceUsage.getState().enableFor("acc-1");
    expect(await after.uploadThisDevice("acc-1")).toBe(true);
    expect(mocks.requests.map((r) => r.method)).toEqual(["POST"]);
    expect(mocks.requests[0].body).toMatchObject({ deviceKey: firstKey });
  });

  it("예전 무작위 키로 올린 기록은 지우고, 고정 키로 보관 기간 전체를 다시 올린다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    const oldKey = client.useDeviceUsage.getState().ensureDeviceKey();
    client.useDeviceUsage.getState().markUploaded(Date.now() - 60 * 60_000);

    mocks.androidId = "a1b2c3d4e5f60718"; // 이 메서드가 있는 앱으로 업데이트
    expect(await client.uploadThisDevice("acc-1")).toBe(true);
    const stable = await client.stableDeviceKey("acc-1");
    expect(
      mocks.requests.map((r) => [r.method, (r.body as { deviceKey: string }).deviceKey]),
    ).toEqual([
      ["DELETE", oldKey],
      ["POST", stable],
    ]);
    // 이어 재지 않고 처음부터(보관 기간) 다시 올린다 — 지운 기간이 비지 않게.
    const from = (mocks.requests[1].body as { from: number }).from;
    expect(Date.now() - from).toBeGreaterThan(24 * 60 * 60_000);
    expect(client.useDeviceUsage.getState().deviceKey).toBe(stable);

    mocks.requests = [];
    await client.uploadThisDevice("acc-1");
    expect(mocks.requests.map((r) => r.method)).toEqual(["POST"]);
  });

  it("예전 기록을 지우지 못하면 새 키로 올리지 않는다(두 기기로 남지 않게)", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    const oldKey = client.useDeviceUsage.getState().ensureDeviceKey();
    mocks.androidId = "a1b2c3d4e5f60718";
    mocks.failDelete = true;
    await expect(client.uploadThisDevice("acc-1")).rejects.toThrow();
    expect(mocks.requests.map((r) => r.method)).toEqual(["DELETE"]);
    expect(client.useDeviceUsage.getState().deviceKey).toBe(oldKey);
  });

  it("식별값을 읽지 못하는 예전 앱은 지금처럼 무작위 키로 올린다", async () => {
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    expect(await client.uploadThisDevice("acc-1")).toBe(true);
    expect(mocks.requests.map((r) => r.method)).toEqual(["POST"]);
    expect((mocks.requests[0].body as { deviceKey: string }).deviceKey).toBe(
      client.useDeviceUsage.getState().deviceKey,
    );
  });

  it("다시 설치한 뒤 끄면 저장된 키가 없어도 이 기기의 고정 키 기록을 지운다", async () => {
    mocks.androidId = "a1b2c3d4e5f60718";
    const client = await load();
    client.useDeviceUsage.getState().enableFor("acc-1");
    await client.stopMeasuringThisDevice();
    expect(mocks.requests).toEqual([
      {
        url: "/api/usage",
        method: "DELETE",
        body: { deviceKey: await client.stableDeviceKey("acc-1") },
      },
    ]);
  });
});
