import { describe, it, expect } from "vitest";
import { linkSessions, summarizeUsage, type UsageInterval } from "@subslash/shared";

const MIN = 60 * 1000;
const at = (minutes: number) => Date.UTC(2026, 8, 1) + minutes * MIN;
const use = (deviceId: string, from: number, to: number, serviceId = "netflix"): UsageInterval => ({
  deviceId,
  serviceId,
  start: at(from),
  end: at(to),
});

describe("linkSessions", () => {
  it("휴대폰에서 보다가 30분 안에 태블릿으로 이어 보면 한 번이다", () => {
    const sessions = linkSessions([use("phone", 0, 40), use("tablet", 60, 120)]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ handoffs: 1, deviceIds: ["phone", "tablet"] });
    expect(sessions[0].activeMs).toBe(100 * MIN);
  });

  it("30분이 지나서 다시 열면 따로 센다", () => {
    expect(linkSessions([use("phone", 0, 40), use("phone", 71, 90)])).toHaveLength(2);
  });

  it("두 기기가 겹친 시간은 한 번만 센다", () => {
    const [session] = linkSessions([use("phone", 0, 60), use("tablet", 30, 90)]);
    expect(session.activeMs).toBe(90 * MIN);
  });

  it("한 기기 안에서 잠깐 다른 앱을 봤다 돌아오면 기기 전환이 아니다", () => {
    const [session] = linkSessions([use("phone", 0, 10), use("phone", 15, 30)]);
    expect(session.handoffs).toBe(0);
  });

  it("1분이 안 되는 세션은 사용으로 세지 않는다", () => {
    expect(linkSessions([{ ...use("phone", 0, 0), end: at(0) + 30_000 }])).toHaveLength(0);
  });

  it("서비스가 다르면 잇지 않는다", () => {
    expect(linkSessions([use("phone", 0, 10), use("phone", 12, 20, "spotify")])).toHaveLength(2);
  });
});

describe("summarizeUsage", () => {
  const window = { from: at(0), to: at(24 * 60) };

  it("측정한 기기가 없으면 partial이고 기기 수는 0이다", () => {
    const summary = summarizeUsage([], [], window);
    expect(summary).toMatchObject({ measuredDeviceCount: 0, partial: true, services: [] });
  });

  it("기간 전체를 측정한 기기가 있어야 partial이 아니다", () => {
    const coverage = [{ deviceId: "phone", measuredFrom: at(-10), measuredUntil: at(24 * 60) }];
    expect(summarizeUsage([], coverage, window).partial).toBe(false);
    const late = [{ deviceId: "phone", measuredFrom: at(60), measuredUntil: at(24 * 60) }];
    expect(summarizeUsage([], late, window).partial).toBe(true);
  });

  it("기간 경계에 걸친 구간은 잘라서 센다", () => {
    const summary = summarizeUsage([use("phone", -30, 20)], [], window);
    expect(summary.services[0]).toMatchObject({ sessionCount: 1, activeMinutes: 20 });
  });

  it("서비스별로 세션 수·시간·전환 횟수를 모은다", () => {
    const summary = summarizeUsage(
      [
        use("phone", 0, 40),
        use("tablet", 50, 100),
        use("phone", 300, 330),
        use("phone", 0, 5, "spotify"),
      ],
      [],
      window,
    );
    expect(summary.services).toEqual([
      {
        serviceId: "netflix",
        sessionCount: 2,
        activeMinutes: 120,
        handoffCount: 1,
        deviceCount: 2,
      },
      { serviceId: "spotify", sessionCount: 1, activeMinutes: 5, handoffCount: 0, deviceCount: 1 },
    ]);
  });
});
