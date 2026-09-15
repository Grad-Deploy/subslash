import { describe, expect, it, vi } from "vitest";
import { createMirroredStorage, type NativeKeyValue } from "@lib/mirrored-storage";

const KEY = "subslash-storage";

function memoryLocal(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

function memoryNative(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const native: NativeKeyValue & { data: Map<string, string> } = {
    data,
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => void data.set(key, value)),
    remove: vi.fn(async (key: string) => void data.delete(key)),
  };
  return native;
}

// 사본 쓰기는 기다리지 않고 보내므로, 확인하기 전에 쌓인 작업을 흘려보낸다.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createMirroredStorage", () => {
  it("localStorage가 비어 있었고 사본이 있으면 되살린다", async () => {
    const local = memoryLocal();
    const native = memoryNative({ [KEY]: '{"state":{"subscriptions":[1]}}' });
    const { storage, restore } = createMirroredStorage(local, native);

    expect(storage.getItem(KEY)).toBeNull();
    await expect(restore(KEY)).resolves.toBe(true);
    expect(local.getItem(KEY)).toBe('{"state":{"subscriptions":[1]}}');
  });

  it("기록이 있던 기기에서는 되살리지 않고 사본을 새 값으로 맞춘다", async () => {
    const local = memoryLocal({ [KEY]: "current" });
    const native = memoryNative({ [KEY]: "old" });
    const { storage, restore } = createMirroredStorage(local, native);

    storage.getItem(KEY);
    storage.setItem(KEY, "changed");
    await expect(restore(KEY)).resolves.toBe(false);
    await flush();
    expect(local.getItem(KEY)).toBe("changed");
    expect(native.data.get(KEY)).toBe("changed");
  });

  it("되살리기를 확인하기 전에 쓴 값이 사본을 덮지 않는다", async () => {
    const local = memoryLocal();
    const native = memoryNative({ [KEY]: "saved" });
    const { storage, restore } = createMirroredStorage(local, native);

    storage.getItem(KEY);
    // 앱이 시작하자마자 빈 상태를 한 번 적은 경우.
    storage.setItem(KEY, "empty-state");
    expect(native.set).not.toHaveBeenCalled();

    await expect(restore(KEY)).resolves.toBe(true);
    await flush();
    expect(local.getItem(KEY)).toBe("saved");
    expect(native.data.get(KEY)).toBe("saved");
  });

  it("확인이 끝난 뒤의 쓰기와 지우기는 사본에도 반영한다", async () => {
    const local = memoryLocal();
    const native = memoryNative();
    const { storage, restore } = createMirroredStorage(local, native);

    storage.getItem(KEY);
    await expect(restore(KEY)).resolves.toBe(false);
    storage.setItem(KEY, "v1");
    await flush();
    expect(native.data.get(KEY)).toBe("v1");

    storage.removeItem(KEY);
    await flush();
    expect(native.data.has(KEY)).toBe(false);
  });

  it("사본을 읽지 못하면 되살리지도, 사본을 덮지도 않는다", async () => {
    const local = memoryLocal();
    const native = memoryNative({ [KEY]: "saved" });
    vi.mocked(native.get).mockRejectedValueOnce(new Error("bridge down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { storage, restore } = createMirroredStorage(local, native);

    storage.getItem(KEY);
    await expect(restore(KEY)).resolves.toBe(false);
    storage.setItem(KEY, "new");
    await flush();
    expect(native.data.get(KEY)).toBe("saved");
    warn.mockRestore();
  });
});
