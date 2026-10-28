import { describe, expect, it } from "vitest";
import { latestCheckIn, latestCheckInBySubscription } from "@subslash/shared";

const log = (id: string, subscriptionId: string, checkedAt: string) => ({
  id,
  subscriptionId,
  checkedAt,
});

describe("latestCheckIn", () => {
  it("기록한 순서가 아니라 체크인 시각으로 가장 늦은 것을 고른다", () => {
    const logs = [
      log("b", "s", "2026-10-20T00:00:00.000Z"),
      log("a", "s", "2026-09-01T00:00:00.000Z"),
    ];
    expect(latestCheckIn(logs)?.id).toBe("b");
  });

  it("시각이 같으면 나중에 기록한 것을 최신으로 본다", () => {
    const logs = [
      log("first", "s", "2026-10-20T00:00:00.000Z"),
      log("second", "s", "2026-10-20T00:00:00.000Z"),
    ];
    expect(latestCheckIn(logs)?.id).toBe("second");
  });

  it("시각을 읽을 수 없는 기록은 최근으로 고르지 않는다", () => {
    expect(latestCheckIn([log("x", "s", "어제")])).toBeNull();
    expect(
      latestCheckIn([log("ok", "s", "2026-01-01T00:00:00.000Z"), log("x", "s", "어제")])?.id,
    ).toBe("ok");
  });

  it("include가 받아 준 것 중에서만 고른다", () => {
    const logs = [
      log("old", "s", "2026-09-01T00:00:00.000Z"),
      log("other", "t", "2026-10-25T00:00:00.000Z"),
    ];
    expect(latestCheckIn(logs, (l) => l.subscriptionId === "s")?.id).toBe("old");
    expect(latestCheckIn(logs, (_, at) => at.getMonth() === 0)).toBeNull();
  });
});

describe("latestCheckInBySubscription", () => {
  it("구독마다 가장 늦은 체크인을 둔다", () => {
    const latest = latestCheckInBySubscription([
      log("s2", "s", "2026-10-20T00:00:00.000Z"),
      log("t1", "t", "2026-08-01T00:00:00.000Z"),
      log("s1", "s", "2026-09-20T00:00:00.000Z"),
      log("bad", "u", "어제"),
    ]);
    expect(latest.get("s")?.id).toBe("s2");
    expect(latest.get("t")?.id).toBe("t1");
    expect(latest.has("u")).toBe(false);
  });
});
