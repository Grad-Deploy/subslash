import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlannedReminder } from "../../lib/local-reminders";

/**
 * 기기 알림을 거는 길(`lib/native-reminders`)이 플랫폼을 가리는지.
 *
 * 알림 채널은 안드로이드에만 있다. iOS에서 만들려 하면 거절당하는데, 알림을 걸기 전에 매번
 * 기다리므로 가리지 않으면 iOS에서는 알림이 하나도 걸리지 않는다. 빌드 대상은 모듈을 처음 읽을 때
 * 정해지므로, 테스트마다 환경 변수를 바꾸고 모듈을 새로 읽는다.
 */

const mocks = vi.hoisted(() => ({
  platform: "android",
  channels: [] as string[],
  scheduled: [] as { id: number }[],
  cancelled: [] as { id: number }[],
  pending: [] as { id: number; extra?: Record<string, unknown> }[],
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => mocks.platform },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    createChannel: async ({ id }: { id: string }) => {
      if (mocks.platform !== "android") {
        throw new Error(`"LocalNotifications.createChannel()" is not implemented on ios`);
      }
      mocks.channels.push(id);
    },
    getPending: async () => ({ notifications: mocks.pending }),
    cancel: async ({ notifications }: { notifications: { id: number }[] }) =>
      void mocks.cancelled.push(...notifications),
    schedule: async ({ notifications }: { notifications: { id: number }[] }) =>
      void mocks.scheduled.push(...notifications),
  },
}));

const ORIGINAL_TARGET = process.env.NEXT_PUBLIC_BUILD_TARGET;

const PLAN: PlannedReminder[] = [
  {
    id: 1,
    subscriptionId: "sub-netflix",
    title: "넷플릭스 결제 3일 전",
    body: "₩17,000이 곧 빠져나갑니다.",
    at: new Date("2026-09-22T00:00:00.000Z"),
  },
];

beforeEach(() => {
  mocks.channels = [];
  mocks.scheduled = [];
  mocks.cancelled = [];
  mocks.pending = [];
  process.env.NEXT_PUBLIC_BUILD_TARGET = "app";
  vi.resetModules();
});

afterEach(() => {
  if (ORIGINAL_TARGET === undefined) delete process.env.NEXT_PUBLIC_BUILD_TARGET;
  else process.env.NEXT_PUBLIC_BUILD_TARGET = ORIGINAL_TARGET;
});

describe("안드로이드에서", () => {
  beforeEach(() => {
    mocks.platform = "android";
  });

  it("채널을 만들고 알림을 건다", async () => {
    const { replaceScheduledReminders } = await import("../../lib/native-reminders");
    await replaceScheduledReminders(PLAN);

    expect(mocks.channels).toEqual(["billing"]);
    expect(mocks.scheduled.map((n) => n.id)).toEqual([1]);
  });
});

describe("iOS에서", () => {
  beforeEach(() => {
    mocks.platform = "ios";
  });

  it("채널을 만들려 하지 않고, 알림은 그대로 걸린다", async () => {
    const { replaceScheduledReminders } = await import("../../lib/native-reminders");
    await replaceScheduledReminders(PLAN);

    // 채널은 안드로이드에만 있다. 부르면 거절당하고, 그 실패가 알림 걸기를 통째로 막는다.
    expect(mocks.channels).toEqual([]);
    expect(mocks.scheduled.map((n) => n.id)).toEqual([1]);
  });

  it("시험 알림도 걸린다", async () => {
    const { sendTestReminder } = await import("../../lib/native-reminders");
    await sendTestReminder();

    expect(mocks.channels).toEqual([]);
    expect(mocks.scheduled).toHaveLength(1);
  });

  it("전에 걸어 둔 우리 알림만 지우고 다시 건다", async () => {
    mocks.pending = [
      { id: 7, extra: { kind: "billing" } },
      { id: 8, extra: { kind: "other" } },
    ];
    const { replaceScheduledReminders } = await import("../../lib/native-reminders");
    await replaceScheduledReminders(PLAN);

    expect(mocks.cancelled.map((n) => n.id)).toEqual([7]);
  });
});
