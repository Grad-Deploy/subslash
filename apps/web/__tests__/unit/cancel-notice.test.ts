import { describe, expect, it } from "vitest";
import { getActionQueue, matchCancelNotices, type Subscription } from "@subslash/shared";

/**
 * 구독 중인 서비스의 마지막 메일이 해지·취소 알림일 때(utils/cancelNotice). 제목 낱말로 가린 알림이라
 * 해지로 기록하지 않고 행동 큐에서 묻는다.
 */

const NOW = new Date("2026-09-29T09:00:00+09:00");

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 2,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastPriceCheckedAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

const NOTICE = {
  name: "넷플릭스",
  currency: "KRW" as const,
  isCanceled: true,
  receiptDate: "2026.09.20",
};

describe("해지 알림을 구독에 짝짓기", () => {
  it("구독 중인 같은 서비스에 메일 날짜를 적는다", () => {
    expect(matchCancelNotices([sub()], [NOTICE])).toEqual([
      { subscriptionId: "netflix", receiptDate: "2026.09.20" },
    ]);
  });

  it("결제 메일은 해지 알림이 아니다", () => {
    expect(matchCancelNotices([sub()], [{ ...NOTICE, isCanceled: false }])).toEqual([]);
  });

  it("이미 해지한 구독에는 묻지 않는다", () => {
    expect(matchCancelNotices([sub({ status: "killed" })], [NOTICE])).toEqual([]);
  });

  it("그 메일보다 뒤에 등록한 구독에는 묻지 않는다 — 해지 뒤 다시 구독했을 수 있다", () => {
    expect(matchCancelNotices([sub({ createdAt: "2026-09-25T00:00:00.000Z" })], [NOTICE])).toEqual(
      [],
    );
  });

  it("'아직 구독 중'이라고 답한 메일은 다시 가져와도 묻지 않는다", () => {
    expect(matchCancelNotices([sub({ cancelNoticeDismissedAt: "2026.09.20" })], [NOTICE])).toEqual(
      [],
    );
    // 새 해지 알림이면 다시 묻는다.
    expect(
      matchCancelNotices(
        [sub({ cancelNoticeDismissedAt: "2026.08.01" })],
        [{ ...NOTICE, receiptDate: "2026.09.20" }],
      ),
    ).toHaveLength(1);
  });

  it("다른 서비스·다른 통화는 짝짓지 않는다", () => {
    expect(matchCancelNotices([sub()], [{ ...NOTICE, name: "티빙" }])).toEqual([]);
    expect(matchCancelNotices([sub()], [{ ...NOTICE, currency: "USD" as const }])).toEqual([]);
  });
});

describe("행동 큐의 해지 알림 줄", () => {
  it("해지했는지 묻고, 해지했다고 단정하지 않는다", () => {
    const [item] = getActionQueue([sub({ cancelNoticeAt: "2026.09.20" })], [], NOW);
    expect(item.kind).toBe("cancel-notice");
    expect(item.verb).toBe("confirm-cancel");
    expect(item.reason).toContain("2026.09.20");
    expect(item.reason).toContain("해지했다면");
  });

  it("결제가 코앞이어도 이 줄 하나만 올린다 — 해지했다면 체크인할 일도 없다", () => {
    // NOW(9/29) 기준 10/2 결제 → D-3
    const items = getActionQueue([sub({ cancelNoticeAt: "2026.09.20" })], [], NOW);
    expect(items.map((item) => item.kind)).toEqual(["cancel-notice"]);
  });

  it("무료 체험 중이어도 묻는다 — 체험을 끊었다는 메일이 가장 흔하다", () => {
    const items = getActionQueue(
      [sub({ cancelNoticeAt: "2026.09.20", trialEndsAt: "2026-10-01" })],
      [],
      NOW,
    );
    expect(items.map((item) => item.kind)).toEqual(["cancel-notice"]);
  });
});
