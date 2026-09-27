import { describe, it, expect } from "vitest";
import {
  formatRefundRequest,
  getActionQueue,
  isResubscribeReminderDue,
  parseDateOnly,
  type Subscription,
} from "@subslash/shared";

const NOW = new Date(2026, 8, 27, 9, 0);

function killed(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "티빙",
    amount: 13500,
    currency: "KRW",
    billingDay: 5,
    billingCycle: "monthly",
    category: "ott",
    status: "killed",
    createdAt: "2026-01-01T00:00:00.000Z",
    killedAt: new Date(2026, 7, 1, 12).toISOString(),
    // 해지 확인을 이미 받아 둬서 '해지 확인' 줄이 섞이지 않게 한다.
    killVerifiedAt: new Date(2026, 8, 6).toISOString(),
    ...overrides,
  };
}

describe("parseDateOnly", () => {
  it("없는 날짜와 틀린 형식은 받지 않는다", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("2026/10/01")).toBeNull();
    expect(parseDateOnly(undefined)).toBeNull();
    expect(parseDateOnly("2026-10-01")?.getDate()).toBe(1);
  });
});

describe("다시 살펴볼 날", () => {
  it("그날 0시부터 알린다", () => {
    expect(isResubscribeReminderDue(killed({ resubscribeRemindOn: "2026-09-27" }), NOW)).toBe(true);
    expect(isResubscribeReminderDue(killed({ resubscribeRemindOn: "2026-09-28" }), NOW)).toBe(
      false,
    );
  });

  it("구독 중인 구독에는 알리지 않는다", () => {
    expect(
      isResubscribeReminderDue(
        killed({ status: "active", resubscribeRemindOn: "2026-09-01" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("날이 오면 행동 큐 맨 뒤에 한 줄 올린다", () => {
    const queue = getActionQueue([killed({ resubscribeRemindOn: "2026-09-20" })], [], NOW);
    expect(queue.map((item) => [item.kind, item.verb])).toEqual([
      ["resubscribe-reminder", "review-resubscribe"],
    ]);
  });

  it("해지 후 결제된 구독은 그 줄만 올린다(한 구독은 한 줄)", () => {
    const queue = getActionQueue(
      [killed({ resubscribeRemindOn: "2026-09-20", chargedAfterKillAt: "2026.09.05" })],
      [],
      NOW,
    );
    expect(queue.map((item) => item.kind)).toEqual(["charged-after-kill"]);
  });
});

describe("formatRefundRequest", () => {
  it("해지 후 결제 증거가 없으면 만들지 않는다", () => {
    expect(formatRefundRequest(killed())).toBeNull();
  });

  it("앱이 가진 사실만 적는다 — 해지한 날, 결제된 날과 금액, 적어 둔 확인 내용", () => {
    const text = formatRefundRequest(
      killed({
        chargedAfterKillAt: "2026.09.05",
        chargedAfterKillAmount: 13500,
        killEvidence: { reference: "해지 접수번호 A-123", recordedAt: NOW.toISOString() },
      }),
    );
    expect(text).toContain("티빙");
    expect(text).toContain("2026.08.01에 구독을 해지했는데, 2026.09.05에 ₩13,500이 다시 결제");
    expect(text).toContain("해지 접수번호 A-123");
  });

  it("금액을 모르면 금액을 적지 않는다", () => {
    const text = formatRefundRequest(killed({ chargedAfterKillAt: "2026.09.05" }));
    expect(text).toContain("2026.09.05에 다시 결제");
    expect(text).not.toContain("₩");
  });
});
