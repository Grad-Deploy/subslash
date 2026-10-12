import { afterEach, describe, expect, it, vi } from "vitest";
import type { CheckInDevice, Subscription } from "@subslash/shared";
import { buildCheckInLog, createSubscription } from "../../lib/store/records";
import { createBackup, parseBackup } from "../../lib/backup";
import {
  checkInDevice,
  detectDevice,
  isThisDevice,
  DEVICE_ID_KEY,
} from "../../lib/check-in-device";
import { translateKnownText } from "../../lib/i18n/known-text";
import { messages } from "../../lib/i18n/messages";

/**
 * 체크인한 기기(`UsageLog.device`). 로그인한 기기끼리 기록을 맞추면 여러 기기의 체크인이 한 목록에 섞여, 어디서 센
 * 숫자인지 알아볼 수 있어야 한다.
 */

const NOW = new Date("2026-10-12T12:00:00");
const netflix: Subscription = createSubscription(
  {
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 15,
    category: "ott",
  } as Parameters<typeof createSubscription>[0],
  "sub-netflix",
  "2026-09-01T00:00:00.000Z",
);
const device: CheckInDevice = { app: "web", os: "windows", mobile: false, id: "d-1" };

describe("기기 알아보기", () => {
  it("브라우저가 알려 주는 운영체제와 휴대폰 여부", () => {
    const windows =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
    const android =
      "Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36";
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const mac =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
    expect(detectDevice(windows)).toEqual({ os: "windows", mobile: false });
    // 안드로이드의 UA에는 Linux도 있다 — 안드로이드로 본다.
    expect(detectDevice(android)).toEqual({ os: "android", mobile: true });
    expect(detectDevice(iphone)).toEqual({ os: "ios", mobile: true });
    expect(detectDevice(mac)).toEqual({ os: "mac", mobile: false });
    expect(detectDevice("SomethingElse/1.0")).toEqual({ os: "other", mobile: false });
  });

  it("브라우저가 힌트(userAgentData)를 주면 그것을 먼저 본다", () => {
    expect(detectDevice("", { platform: "Windows", mobile: false })).toEqual({
      os: "windows",
      mobile: false,
    });
    expect(detectDevice("", { platform: "Android", mobile: true })).toEqual({
      os: "android",
      mobile: true,
    });
  });
});

describe("이 기기의 값", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("처음 한 번 무작위 값을 만들고, 같은 기기에서는 같은 값을 쓴다", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });

    const first = checkInDevice();
    const second = checkInDevice();
    expect(first).toMatchObject({ app: "web", os: "windows", mobile: false });
    expect(first?.id).toBe(store.get(DEVICE_ID_KEY));
    expect(second?.id).toBe(first?.id);
    expect(isThisDevice(first ?? undefined)).toBe(true);
    expect(isThisDevice({ ...device, id: "다른 기기" })).toBe(false);
    expect(isThisDevice(undefined)).toBe(false);
  });

  it("서버 렌더링 중에는 기기를 모른다", () => {
    expect(checkInDevice()).toBeNull();
  });
});

describe("체크인 줄", () => {
  it("체크인한 기기를 남기고, 모르면 칸을 두지 않는다", () => {
    expect(buildCheckInLog(netflix, 4, { device }, NOW, "l1").log.device).toEqual(device);
    expect("device" in buildCheckInLog(netflix, 4, { device: null }, NOW, "l2").log).toBe(false);
  });

  it("다른 기기의 체크인도 백업·계정 저장으로 그대로 돌아온다", () => {
    const logs = [
      buildCheckInLog(netflix, 4, { device }, NOW, "l1").log,
      buildCheckInLog(
        netflix,
        6,
        { device: { app: "android", os: "android", mobile: true, id: "d-2" } },
        NOW,
        "l2",
      ).log,
    ];
    const result = parseBackup(
      JSON.stringify(
        createBackup({ subscriptions: [netflix], usageLogs: logs, accounts: [] } as never, NOW),
      ),
    );
    expect(result.ok && result.data.usageLogs.map((log) => log.device?.id)).toEqual(["d-1", "d-2"]);
  });

  it("틀린 기기 칸은 받지 않고, 어느 칸인지 화면 언어로 알린다", () => {
    for (const bad of [
      { ...device, app: "tv" },
      { ...device, os: "beos" },
      { ...device, mobile: "no" },
      { ...device, id: "" },
      "PC",
    ]) {
      const log = { ...buildCheckInLog(netflix, 4, {}, NOW, "l1").log, device: bad };
      const result = parseBackup(
        JSON.stringify(
          createBackup({ subscriptions: [netflix], usageLogs: [log], accounts: [] } as never, NOW),
        ),
      );
      expect(result.ok, JSON.stringify(bad)).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("'체크인 기기'");
        expect(translateKnownText(result.error, "en")).toContain("check-in device");
      }
    }
  });
});

describe("기록에 보이는 기기 이름", () => {
  it("앱은 앱 이름, 웹은 운영체제와 기기 크기로 적는다", () => {
    const h = messages.ko.checkin.history;
    expect(h.deviceApp.android).toBe("Android 앱");
    expect(h.deviceWeb("Windows", false)).toBe("Windows PC 웹");
    expect(h.deviceWeb(null, true)).toBe("휴대폰 웹");
    expect(h.deviceLine("Windows PC 웹", true)).toBe("체크인한 기기: Windows PC 웹 (이 기기)");
    expect(messages.en.checkin.history.deviceWeb("Mac", false)).toBe("Mac PC (web)");
  });
});
