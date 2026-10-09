import { describe, expect, it } from "vitest";
import { metricRiskLevel, type Subscription } from "@subslash/shared";
import { buildCheckInLog, createSubscription } from "../../lib/store/records";
import { createBackup, parseBackup } from "../../lib/backup";
import { parsePcUsageHash, formatTokenCount } from "../../lib/pc-usage";
import { describeCheckInOutcome } from "../../lib/i18n/check-in-outcome";
import { messages } from "../../lib/i18n/messages";

const NOW = new Date("2026-10-09T12:00:00");

/** Claude Pro: $20 + 세금 10% = 내 몫 한 달 $22. 쓴 날로 잰다. */
const claude: Subscription = {
  ...createSubscription(
    {
      name: "Claude",
      amount: 20,
      currency: "USD",
      billingDay: 5,
      cancelUrl: "https://claude.ai/settings/billing",
      taxRate: 10,
      category: "ai",
    } as Parameters<typeof createSubscription>[0],
    "sub-claude",
    "2026-09-01T00:00:00.000Z",
  ),
};

const checkIn = (days: number, tokens?: { count: number; apiUsd: number | null }) =>
  buildCheckInLog(claude, days, { tokens, exchangeRate: 1400 }, NOW, "log-1");

describe("쓴 날 + 토큰으로 해지 판단", () => {
  it("쓴 날이 적어도 API 환산이 구독료 이상이면 본전 이상(초록)이다", () => {
    expect(metricRiskLevel("days", 22, 1, null, null, 2)).toBe("green");
    expect(checkIn(1, { count: 3_000_000, apiUsd: 44 }).log.riskLevel).toBe("green");
  });

  it("API 환산이 구독료보다 적으면 쓴 날대로 둔다 — PC 기록은 하한값이라 판단을 낮추지 않는다", () => {
    expect(checkIn(1, { count: 100_000, apiUsd: 5 }).log.riskLevel).toBe("red");
    expect(checkIn(20, { count: 100_000, apiUsd: 5 }).log.riskLevel).toBe("green");
  });

  it("'무료 요금제로 충분했다'고 답했으면 토큰이 많아도 무료로 내려 보라고 한다", () => {
    expect(metricRiskLevel("days", 22, 1, null, "enough", 2)).toBe("yellow");
  });

  it("체크인에 토큰 수와 API 환산 금액, 하루당 가격이 함께 남는다", () => {
    const { log, response } = checkIn(10, { count: 3_420_000_000, apiUsd: 1598.81 });
    expect(log.tokens).toEqual({ count: 3_420_000_000, apiUsd: 1598.81 });
    expect(log.metric).toBe("days");
    // 하루당 가격 = 내 몫 한 달 $22 ÷ 10일
    expect(log.costPerUse).toBeCloseTo(2.2);
    expect(response.outcome.apiValueRatio).toBeCloseTo(1598.81 / 22);
  });

  it("토큰 근거가 없으면 이전과 같다", () => {
    const { log, response } = checkIn(1);
    expect(log.tokens).toBeUndefined();
    expect(log.riskLevel).toBe("red");
    expect(response.outcome.apiValueRatio).toBeNull();
  });

  it("결과 문장에 구독료의 몇 배인지 덧붙인다", () => {
    const over = describeCheckInOutcome(
      messages.ko,
      checkIn(1, { count: 1, apiUsd: 44 }).response.outcome,
    );
    expect(over).toContain("2.0배");
    const under = describeCheckInOutcome(
      messages.en,
      checkIn(5, { count: 1, apiUsd: 11 }).response.outcome,
    );
    expect(under).toContain("50%");
  });
});

describe("토큰 근거의 저장·복원", () => {
  const data = (tokens: unknown) => ({
    subscriptions: [claude],
    usageLogs: [{ ...checkIn(3).log, tokens }],
    accounts: [],
    exchangeRate: { rate: 1400, source: "manual" as const, updatedAt: "2026-09-01T00:00:00.000Z" },
  });
  const restore = (tokens: unknown) =>
    parseBackup(JSON.stringify(createBackup(data(tokens) as never, NOW)));

  it("백업·계정 저장에 토큰 근거가 실려 그대로 돌아온다", () => {
    const result = restore({ count: 1000, apiUsd: 12.5 });
    expect(result.ok && result.data.usageLogs[0].tokens).toEqual({ count: 1000, apiUsd: 12.5 });
    expect(restore({ count: 1000, apiUsd: null }).ok).toBe(true);
  });

  it("틀린 토큰 근거는 받지 않는다", () => {
    for (const bad of [{ count: -1, apiUsd: 1 }, { count: 1 }, "x", { count: 1, apiUsd: "1" }]) {
      expect(restore(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("링크의 토큰 칸", () => {
  it("네 번째 칸에서 토큰 수를 읽고, 금액 칸은 비어 있을 수 있다", () => {
    const full = parsePcUsageHash(
      "#pc=claude-pro:30:1598.81:3420000000&window=30&until=2026-10-09",
      NOW,
    );
    expect(full.ok && full.link.entries[0]).toMatchObject({
      apiUsd: 1598.81,
      tokens: 3_420_000_000,
    });
    const noPrice = parsePcUsageHash("#pc=claude-pro:30::5000&window=30&until=2026-10-09", NOW);
    expect(noPrice.ok && noPrice.link.entries[0]).toMatchObject({ apiUsd: null, tokens: 5000 });
    expect(parsePcUsageHash("#pc=claude-pro:30:1:1.5&window=30&until=2026-10-09", NOW).ok).toBe(
      false,
    );
  });

  it("토큰 수를 줄여 보인다", () => {
    expect(formatTokenCount(3_420_000_000, "ko")).toBe("34.2억");
    expect(formatTokenCount(3_420_000_000, "en")).toBe("3.4B");
  });
});
