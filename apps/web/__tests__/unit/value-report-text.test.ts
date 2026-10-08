import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import { getMonthlyValueSummary } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import {
  describeWastedItem,
  describeWasteSuggestion,
  describeWorthItem,
} from "@lib/i18n/value-report";

const sub = (id: string, name: string, amount: number): Subscription => ({
  id,
  name,
  amount,
  currency: "KRW",
  billingDay: 10,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
});

const log = (subscriptionId: string, usageCount: number, riskLevel: UsageLog["riskLevel"]) => ({
  id: `log-${subscriptionId}`,
  subscriptionId,
  month: "2026-09",
  usageCount,
  costPerUse: usageCount === 0 ? 17000 : 17000 / usageCount,
  riskLevel,
  checkedAt: "2026-09-10T00:00:00.000Z",
});

describe("월간 가성비 리포트 문장", () => {
  const summary = getMonthlyValueSummary(
    [sub("a", "넷플릭스", 17000), sub("b", "유튜브", 14900)],
    [log("a", 0, "red"), log("b", 20, "green")],
    1350,
  );

  it("한 달 동안 안 쓴 구독은 언어에 맞게 쉬어가기를 권한다", () => {
    expect(describeWastedItem(messages.ko, summary.wastedItems[0])).toBe(
      "이번 달 미사용 · 쉬어가기 추천",
    );
    expect(describeWastedItem(messages.en, summary.wastedItems[0])).toBe(
      "Unused this month · pause suggested",
    );
  });

  it("뽕 뽑은 구독은 체크인 한 줄을 보인다", () => {
    expect(describeWorthItem(messages.en, summary.worthItItems[0])).toBe("20 uses · ₩850 per use");
  });

  it("절약 제안은 하나면 이름을, 여럿이면 이름 없이 말한다", () => {
    const one = describeWasteSuggestion(messages.en, summary.wasteSuggestion!);
    expect(one).toContain("Pause 넷플릭스");
    expect(one).toContain("₩17,000");
    expect(describeWasteSuggestion(messages.ko, summary.wasteSuggestion!)).toContain(
      "넷플릭스을(를) 잠시 쉬어가면",
    );
    const many = describeWasteSuggestion(messages.en, { ...summary.wasteSuggestion!, name: null });
    expect(many).toContain("rarely use");
  });
});
