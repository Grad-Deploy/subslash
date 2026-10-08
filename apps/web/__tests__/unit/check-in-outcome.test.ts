import { describe, expect, it } from "vitest";
import { evaluateMetric, getBreakEvenInfo, getUsageMetaphor } from "@subslash/shared";
import { messages } from "@lib/i18n/messages";
import {
  describeBreakEven,
  describeCheckInOutcome,
  describeUsageMetaphor,
} from "@lib/i18n/check-in-outcome";
import { storageCheckInFrom } from "@lib/storage-quota";

describe("체크인 결과 문장(영어)", () => {
  it("쓴 날로 재는 구독은 하루당 금액을 말하고, 무료로 충분했다면 내려도 된다고 덧붙인다", () => {
    const { outcome } = evaluateMetric("days", "ChatGPT Plus", 29000, 20, "KRW", null, "enough");
    const text = describeCheckInOutcome(messages.en, outcome);
    expect(text).toContain("You paid ₩1,450 for each day you used ChatGPT Plus.");
    expect(text).toContain("drop to it instead of cancelling");
  });

  it("안 쓴 달은 그냥 낸 돈을 말한다", () => {
    const { outcome } = evaluateMetric("hours", "Melon", 10000, 0, "KRW");
    expect(describeCheckInOutcome(messages.en, outcome)).toContain("You paid ₩10,000 for nothing.");
  });

  it("비유는 소비재를 영어로 센다", () => {
    const text = describeUsageMetaphor(
      messages.en,
      getUsageMetaphor(17000, "KRW", 1, "Netflix", 1400),
    );
    expect(text.comparison).toContain("movie ticket");
    expect(text.message).toContain("₩17,000");
  });

  it("본전 게이지 문장은 남은 횟수를 센다", () => {
    expect(describeBreakEven(messages.en, getBreakEvenInfo(17000, 5, 8))).toBe(
      "3 more uses to break even!",
    );
    expect(describeBreakEven(messages.en, getBreakEvenInfo(17000, 7, 8))).toBe(
      "1 more use to break even!",
    );
  });

  it("저장 공간 측정이 채우지 않은 이유도 영어로 말한다", () => {
    const sub = { name: "구글 원", cancelUrl: undefined, planId: undefined, sharingCount: 4 };
    const result = storageCheckInFrom(
      sub,
      { state: "s", ok: true, usage: 3 * 1024 ** 3, limit: 100 * 1024 ** 3 },
      messages.en.checkin.storage,
    );
    expect(result.quantity).toBeNull();
    expect(result.message).toContain("shared with family");
  });
});
