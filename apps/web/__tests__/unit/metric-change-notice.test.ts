import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { staleOttCheckIns } from "../../components/dashboard/MetricChangeNotice";

const sub = (id: string, name: string, category: Subscription["category"]): Subscription =>
  ({
    id,
    name,
    amount: 13500,
    currency: "KRW",
    billingDay: 1,
    billingCycle: "monthly",
    category,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  }) as Subscription;
const log = (subscriptionId: string, metric?: UsageLog["metric"]): UsageLog =>
  ({
    id: `${subscriptionId}-${metric ?? "legacy"}`,
    subscriptionId,
    month: "2026-10",
    usageCount: 3,
    costPerUse: 4500,
    riskLevel: "yellow",
    checkedAt: "2026-10-01T00:00:00.000Z",
    ...(metric ? { metric } : {}),
  }) as UsageLog;

describe("예전 횟수 체크인만 남은 OTT 구독", () => {
  const tving = sub("tving", "티빙", "ott");
  const melon = sub("melon", "멜론", "music");

  it("OTT에 예전 횟수 체크인만 있으면 안내한다", () => {
    expect(staleOttCheckIns([tving], [log("tving")]).map((s) => s.id)).toEqual(["tving"]);
    expect(staleOttCheckIns([tving], [log("tving", "uses")]).map((s) => s.id)).toEqual(["tving"]);
  });

  it("시간으로 다시 체크인했거나, 체크인이 없거나, OTT가 아니면 안내하지 않는다", () => {
    expect(staleOttCheckIns([tving], [log("tving"), log("tving", "hours")])).toEqual([]);
    expect(staleOttCheckIns([tving], [])).toEqual([]);
    expect(staleOttCheckIns([melon], [log("melon")])).toEqual([]);
  });
});
