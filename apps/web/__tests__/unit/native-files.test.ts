import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 앱(Capacitor)의 웹뷰는 `<a download>`로 내려받지 않고, `navigator.clipboard`도 없거나 거절될 수
// 있다. 그래서 앱 빌드의 복사·파일 저장은 네이티브 플러그인으로 간다(lib/native).

const calls = vi.hoisted(() => ({
  clipboard: [] as string[],
  written: [] as Array<{ path: string; data: string }>,
  shared: [] as Array<{ files?: string[] }>,
  shareError: null as Error | null,
}));

vi.mock("@capacitor/clipboard", () => ({
  Clipboard: { write: async ({ string }: { string: string }) => void calls.clipboard.push(string) },
}));
vi.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Encoding: { UTF8: "utf8" },
  Filesystem: {
    writeFile: async ({ path, data }: { path: string; data: string }) => {
      calls.written.push({ path, data });
      return { uri: `file:///cache/${path}` };
    },
  },
}));
vi.mock("@capacitor/share", () => ({
  Share: {
    share: async (options: { files?: string[] }) => {
      if (calls.shareError) throw calls.shareError;
      calls.shared.push(options);
    },
  },
}));

async function load(target: "app" | "web") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BUILD_TARGET", target === "app" ? "app" : "");
  return import("@lib/native");
}

beforeEach(() => {
  calls.clipboard = [];
  calls.written = [];
  calls.shared = [];
  calls.shareError = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("앱 빌드의 복사", () => {
  it("웹뷰의 클립보드가 아니라 네이티브 클립보드로 복사한다", async () => {
    // 웹뷰에 clipboard가 없어도 복사된다.
    vi.stubGlobal("navigator", {});
    const { copyText } = await load("app");
    expect(await copyText("sean@gmail.com")).toBe(true);
    expect(calls.clipboard).toEqual(["sean@gmail.com"]);
  });

  it("웹에서 복사가 거절되면 복사했다고 하지 않는다", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: () => Promise.reject(new Error("denied")) },
    });
    const { copyText } = await load("web");
    expect(await copyText("x")).toBe(false);
  });
});

describe("앱 빌드의 파일 저장", () => {
  it("기기 임시 폴더에 파일을 쓰고 공유 창으로 넘긴다", async () => {
    const { saveFile } = await load("app");
    expect(await saveFile("subslash-backup-2026-09-24.json", '{"v":1}', "application/json")).toBe(
      true,
    );
    expect(calls.written).toEqual([{ path: "subslash-backup-2026-09-24.json", data: '{"v":1}' }]);
    expect(calls.shared[0].files).toEqual(["file:///cache/subslash-backup-2026-09-24.json"]);
  });

  it("공유 창을 닫았으면 저장했다고 하지 않는다", async () => {
    calls.shareError = new Error("Share canceled");
    const { saveFile } = await load("app");
    expect(await saveFile("a.json", "{}", "application/json")).toBe(false);
  });
});
