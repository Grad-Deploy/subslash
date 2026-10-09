import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import { matchPcUsageSubscription, parsePcUsageHash } from "@lib/pc-usage";

const NOW = new Date("2026-10-09T12:00:00");

describe("PC 사용 링크 읽기", () => {
  it("CLI가 만든 링크를 읽는다", () => {
    const result = parsePcUsageHash(
      "#pc=claude-pro%3A12%2Cchatgpt-plus%3A5&window=30&until=2026-10-09",
      NOW,
    );
    expect(result).toEqual({
      ok: true,
      link: {
        entries: [
          { serviceId: "claude-pro", days: 12 },
          { serviceId: "chatgpt-plus", days: 5 },
        ],
        windowDays: 30,
        until: "2026-10-09",
      },
    });
  });

  it("모르는 서비스·범위 밖 숫자·겹친 서비스·빈 값은 통째로 거절한다", () => {
    const bad = [
      "#pc=netflix:3&window=30&until=2026-10-09",
      "#pc=claude-pro:31&window=30&until=2026-10-09",
      "#pc=claude-pro:0&window=30&until=2026-10-09",
      "#pc=claude-pro:2.5&window=30&until=2026-10-09",
      "#pc=claude-pro:3,claude-pro:4&window=30&until=2026-10-09",
      "#pc=&window=30&until=2026-10-09",
      "#pc=claude-pro:3&window=99&until=2026-10-09",
      "#pc=claude-pro:3&window=30&until=not-a-date",
      "#pc=claude-pro:3&window=30&until=2026-12-01",
      "",
    ];
    for (const hash of bad)
      expect(parsePcUsageHash(hash, NOW), hash).toEqual({ ok: false, reason: "invalid" });
  });

  it("며칠 지난 링크는 지난 숫자라 받지 않는다", () => {
    expect(parsePcUsageHash("#pc=claude-pro:3&window=30&until=2026-10-01", NOW)).toEqual({
      ok: false,
      reason: "stale",
    });
    expect(parsePcUsageHash("#pc=claude-pro:3&window=30&until=2026-10-07", NOW).ok).toBe(true);
  });
});

describe("어느 구독에 적을지", () => {
  const sub = (id: string, name: string, status: Subscription["status"] = "active") =>
    ({ id, name, status, cancelUrl: undefined }) as unknown as Subscription;

  it("그 서비스의 구독 중인 구독 하나에 적는다", () => {
    const result = matchPcUsageSubscription("claude-pro", [
      sub("a", "Claude"),
      sub("b", "넷플릭스"),
    ]);
    expect(result.kind === "match" && result.subscription.id).toBe("a");
  });

  it("없거나 해지했으면 적지 않고, 여럿이면 고르지 않는다", () => {
    expect(matchPcUsageSubscription("claude-pro", [sub("a", "Claude", "killed")]).kind).toBe(
      "none",
    );
    expect(matchPcUsageSubscription("chatgpt-plus", [])).toEqual({ kind: "none" });
    expect(
      matchPcUsageSubscription("claude-pro", [sub("a", "Claude"), sub("b", "Claude")]),
    ).toEqual({ kind: "ambiguous", count: 2 });
  });
});
