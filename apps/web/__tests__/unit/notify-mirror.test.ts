import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  SyncTokenRejectedError,
  calendarSubscribeLinks,
  pushMirror,
  toMirrorPayload,
} from "../../lib/notify-client";
import { DEFAULT_NOTIFY, useStore, type NotifySettings } from "../../lib/store";

const claude: Subscription = {
  id: "claude",
  name: "Claude",
  amount: 20,
  currency: "USD",
  billingDay: 3,
  billingCycle: "monthly",
  category: "ai",
  status: "active",
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("toMirrorPayload", () => {
  it("알림 메일·캘린더로 보내는 금액은 세금까지 더한 카드 청구액이다", () => {
    expect(toMirrorPayload([{ ...claude, taxRate: 10 }])[0].amount).toBe(22);
    expect(toMirrorPayload([claude])[0].amount).toBe(20);
  });

  it("해지한 구독은 보내지 않는다", () => {
    expect(toMirrorPayload([{ ...claude, status: "killed" }])).toEqual([]);
  });
});

describe("pushMirror", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const respond = (status: number, body: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status })),
    );

  it("서버가 토큰을 모르면(401) 다른 실패와 구분되는 오류를 던진다", async () => {
    respond(401, { error: "Unauthorized" });
    await expect(pushMirror("gone-token", [claude])).rejects.toBeInstanceOf(SyncTokenRejectedError);
  });

  it("그 밖의 실패는 일반 오류다 — 다음 변경 때 다시 보낸다", async () => {
    respond(500, { error: "동기화에 실패했습니다." });
    const error = await pushMirror("token", [claude]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SyncTokenRejectedError);
    expect((error as Error).message).toBe("동기화에 실패했습니다.");
  });
});

describe("markNotifyRejected", () => {
  const optedIn: NotifySettings = {
    email: "me@gmail.com",
    syncToken: "token-a",
    verified: true,
    reminderDays: 7,
    lastSyncedAt: "2026-09-01T00:00:00.000Z",
    calendarUrl: "https://subslash.app/api/calendar/abc.ics",
  };

  beforeEach(() => {
    useStore.setState({ notify: optedIn });
  });

  it("알림을 꺼진 상태로 돌리고 거절된 사실을 남긴다 — '켜짐'으로 두지 않는다", () => {
    useStore.getState().markNotifyRejected("token-a");
    const { notify } = useStore.getState();
    expect(notify).toMatchObject({
      ...DEFAULT_NOTIFY,
      // 다시 신청할 때 쓰도록 알림 시점은 남긴다.
      reminderDays: 7,
    });
    expect(notify.rejectedAt).toEqual(expect.any(String));
  });

  it("응답을 기다리는 사이 다시 신청해 토큰이 바뀌었으면 새 신청을 건드리지 않는다", () => {
    useStore.getState().markNotifyRejected("old-token");
    expect(useStore.getState().notify).toEqual(optedIn);
  });

  it("사용자가 직접 끄면 거절 표시가 남지 않는다", () => {
    useStore.getState().markNotifyRejected("token-a");
    useStore.getState().clearNotify();
    expect(useStore.getState().notify.rejectedAt).toBeUndefined();
  });
});

describe("calendarSubscribeLinks", () => {
  const feed = "https://subslash.me/api/calendar/abc123.ics";

  it("캘린더 앱으로 넘기는 주소는 같은 피드의 webcal:// 주소다", () => {
    expect(calendarSubscribeLinks(feed).webcal).toBe(
      "webcal://subslash.me/api/calendar/abc123.ics",
    );
  });

  it("Google 캘린더에는 webcal 주소를 cid로 인코딩해 넘긴다", () => {
    const google = new URL(calendarSubscribeLinks(feed).google);

    expect(google.origin).toBe("https://calendar.google.com");
    expect(google.searchParams.get("cid")).toBe("webcal://subslash.me/api/calendar/abc123.ics");
  });
});
