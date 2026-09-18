import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 사용자를 Google 권한 화면으로 보냈다가 돌아오게 하는 길(`lib/native`의 `leaveForExternal`).
 *
 * 웹과 앱이 달라야 한다. 웹은 이 탭이 그대로 가면 되지만, 앱은 웹뷰가 통째로 나가면 담아 둔 화면을
 * 잃고 외부 사이트의 '돌아가기'가 앱이 아니라 웹사이트를 연다. 빌드 대상은 모듈을 처음 읽을 때
 * 정해지므로, 테스트마다 환경 변수를 바꾸고 모듈을 새로 읽는다.
 */

const mocks = vi.hoisted(() => ({
  opened: [] as string[],
  listeners: [] as (() => void)[],
  removed: 0,
}));

vi.mock("@capacitor/browser", () => ({
  Browser: {
    open: async ({ url }: { url: string }) => void mocks.opened.push(url),
    addListener: async (_event: string, handler: () => void) => {
      mocks.listeners.push(handler);
      return { remove: async () => void (mocks.removed += 1) };
    },
  },
}));

const ORIGINAL_TARGET = process.env.NEXT_PUBLIC_BUILD_TARGET;
const URL_TO_OPEN = "https://script.google.com/macros/s/TEST/exec?action=calendar&code=abc";

beforeEach(() => {
  mocks.opened = [];
  mocks.listeners = [];
  mocks.removed = 0;
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_TARGET === undefined) delete process.env.NEXT_PUBLIC_BUILD_TARGET;
  else process.env.NEXT_PUBLIC_BUILD_TARGET = ORIGINAL_TARGET;
  vi.unstubAllGlobals();
});

async function load() {
  return import("../../lib/native");
}

describe("웹에서", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = "web";
  });

  it("이 탭이 그대로 그 주소로 간다 — 돌아오면 화면이 다시 그려진다", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });

    const { leaveForExternal } = await load();
    leaveForExternal(URL_TO_OPEN);

    expect(assign).toHaveBeenCalledWith(URL_TO_OPEN);
    // 앱 플러그인은 부르지 않는다. 웹에는 인앱 브라우저가 없다.
    expect(mocks.opened).toEqual([]);
  });
});

describe("앱에서", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = "app";
  });

  it("인앱 브라우저로 열고, 앱 웹뷰를 외부 사이트로 보내지 않는다", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });

    const { leaveForExternal } = await load();
    leaveForExternal(URL_TO_OPEN);
    await vi.waitFor(() => expect(mocks.opened).toEqual([URL_TO_OPEN]));

    // 여기서 assign을 부르면 담아 둔 앱 화면을 잃는다.
    expect(assign).not.toHaveBeenCalled();
  });

  it("인앱 브라우저를 닫으면 화면을 다시 맞출 기회를 준다", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } });
    const onReturn = vi.fn();

    const { leaveForExternal } = await load();
    leaveForExternal(URL_TO_OPEN, onReturn);
    await vi.waitFor(() => expect(mocks.listeners).toHaveLength(1));

    mocks.listeners[0]();
    expect(onReturn).toHaveBeenCalledTimes(1);
    // 들은 것은 거둔다. 여러 번 열고 닫아도 쌓이지 않는다.
    await vi.waitFor(() => expect(mocks.removed).toBe(1));
  });

  it("주소가 없으면 아무것도 하지 않는다", async () => {
    vi.stubGlobal("window", { location: { assign: vi.fn() } });

    const { leaveForExternal } = await load();
    leaveForExternal("");

    expect(mocks.opened).toEqual([]);
    expect(mocks.listeners).toEqual([]);
  });
});

/**
 * 상태 표시줄 색 맞추기(`syncSystemBars`)는 플랫폼을 가려야 한다. 막대 뒤 색을 바꾸는 AppWindow는
 * apps/mobile의 안드로이드 네이티브 플러그인이라 iOS에는 없다.
 */
describe("시스템 막대", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BUILD_TARGET = "app";
  });

  async function run(platform: string) {
    const bars = { styles: [] as string[] };
    const registered: string[] = [];
    vi.doMock("@capacitor/core", () => ({
      Capacitor: { getPlatform: () => platform },
      SystemBars: {
        setStyle: async ({ style }: { style: string }) => void bars.styles.push(style),
      },
      SystemBarsStyle: { Dark: "DARK", Light: "LIGHT" },
      registerPlugin: (name: string) => {
        registered.push(name);
        return { setBackgroundColor: async () => undefined };
      },
    }));
    const { syncSystemBars } = await import("../../lib/native");
    syncSystemBars("dark");
    await vi.waitFor(() => expect(bars.styles).toEqual(["DARK"]));
    return registered;
  }

  it("안드로이드에서는 막대 뒤 색까지 맞춘다", async () => {
    expect(await run("android")).toEqual(["AppWindow"]);
  });

  it("iOS에서는 안드로이드에만 있는 플러그인을 부르지 않는다", async () => {
    // 부르면 "not implemented on ios"로 거절당해 테마를 바꿀 때마다 경고만 쌓인다.
    expect(await run("ios")).toEqual([]);
  });
});
