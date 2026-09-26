import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { sortSubsForApp } from "@lib/subs-order";

const NOW = new Date(2026, 8, 26, 12, 0, 0);

function sub(id: string, amount: number, billingDay: number): Subscription {
  return {
    id,
    name: id,
    amount,
    currency: "KRW",
    billingDay,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  } as Subscription;
}

const log = (subscriptionId: string, riskLevel: UsageLog["riskLevel"]): UsageLog =>
  ({
    id: `l-${subscriptionId}`,
    subscriptionId,
    month: "2026-09",
    usageCount: 3,
    costPerUse: 3000,
    riskLevel,
    checkedAt: "2026-09-20T00:00:00.000Z",
  }) as UsageLog;

describe("sortSubsForApp", () => {
  const subs = [sub("a", 9900, 30), sub("b", 17000, 28), sub("c", 4900, 27), sub("d", 13900, 29)];

  it("결제일 순: 결제일이 가까운 것부터", () => {
    expect(sortSubsForApp(subs, "billing", [], 1350, NOW).map((s) => s.id)).toEqual([
      "c",
      "b",
      "d",
      "a",
    ]);
  });

  it("금액 순: 한 달 금액이 큰 것부터", () => {
    expect(sortSubsForApp(subs, "amount", [], 1350, NOW).map((s) => s.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ]);
  });

  it("가성비 순: 비쌈 → 애매 → 잘 씀, 체크인 전은 뒤(같으면 결제일 순)", () => {
    const logs = [log("a", "green"), log("b", "yellow"), log("d", "red")];
    expect(sortSubsForApp(subs, "value", logs, 1350, NOW).map((s) => s.id)).toEqual([
      "d",
      "b",
      "a",
      "c",
    ]);
  });
});
