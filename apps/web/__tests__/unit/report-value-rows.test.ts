import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { buildOtherMetricRows, buildValueRows } from "../../components/report/valueRows";

const now = new Date("2026-10-04T12:00:00Z");

function sub(id: string, amount: number, overrides: Partial<Subscription> = {}): Subscription {
  return {
    id,
    name: id,
    amount,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

function log(
  subscriptionId: string,
  usageCount: number,
  riskLevel: UsageLog["riskLevel"] = "green",
): UsageLog {
  return {
    id: `${subscriptionId}-log`,
    subscriptionId,
    usageCount,
    riskLevel,
    checkedAt: "2026-10-01T00:00:00.000Z",
  } as UsageLog;
}

describe("리포트의 1회 단가 순위", () => {
  it("한 번도 안 쓴 구독이 맨 앞, 체크인 전(모름)은 맨 뒤다", () => {
    const subs = [
      sub("unknown", 20000),
      sub("cheap", 10000),
      sub("unused", 5000),
      sub("pricey", 17000),
    ];
    const logs = [log("cheap", 10), log("unused", 0), log("pricey", 1)];

    const rows = buildValueRows(subs, logs, 1350, now);

    expect(rows.map((row) => row.sub.id)).toEqual(["unused", "pricey", "cheap", "unknown"]);
    expect(rows.find((row) => row.sub.id === "unknown")?.costPerUse).toBeNull();
    expect(rows.find((row) => row.sub.id === "cheap")?.costPerUse).toBe(1000);
  });

  it("횟수가 아닌 것으로 재는 구독은 순위에 넣지 않고 따로 줄 세운다", () => {
    const subs = [sub("ott", 10000), sub("music", 10900, { category: "music" })];
    const valueIds = buildValueRows(subs, [], 1350, now).map((row) => row.sub.id);
    const otherIds = buildOtherMetricRows(subs, [], now).map((row) => row.sub.id);

    expect(valueIds).toEqual(["ott"]);
    expect(otherIds).toEqual(["music"]);
  });
});
