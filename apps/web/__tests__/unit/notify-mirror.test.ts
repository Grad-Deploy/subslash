import { describe, it, expect } from "vitest";
import type { Subscription } from "@subslash/shared";
import { toMirrorPayload } from "../../lib/notify-client";

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
