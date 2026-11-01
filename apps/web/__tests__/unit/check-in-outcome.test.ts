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

  it("이용 목표 게이지 문장은 남은 횟수와 진행률 문구를 9개 언어 모두 일관되게 표현한다", () => {
    expect(describeBreakEven(messages.en, getBreakEvenInfo(17000, 1))).toBe(
      "3 more uses to reach your usage goal!",
    );
    expect(describeBreakEven(messages.en, getBreakEvenInfo(17000, 3))).toBe(
      "1 more use to reach your usage goal!",
    );
    expect(messages.ko.checkin.gauge.progress(75)).toBe("이용 목표의 75%");
    expect(messages.en.checkin.gauge.progress(75)).toBe("75% of usage goal");
    for (const locale of Object.keys(messages) as Array<keyof typeof messages>) {
      expect(messages[locale].checkin.gauge.progress(75)).toContain("75");
    }
  });

  it("혜택 지표(benefit)는 회비 대비 실제 환급액 비교 문구를 유지한다", () => {
    const over = evaluateMetric("benefit", "쿠팡 와우", 7890, 12000, "KRW");
    expect(over.riskLevel).toBe("green");
    expect(describeCheckInOutcome(messages.ko, over.outcome)).toContain(
      "회비 ₩7,890보다 많은 ₩12,000을 혜택으로 돌려받았어요.",
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

  it("0원 부담 구독(monthly <= 0)은 9개 언어 모두에서 ₩0을 버렸거나 냈다는 어색한 금액 문구를 만들지 않는다", () => {
    const zeroCases = [
      evaluateMetric("uses", "Netflix", 0, 0, "KRW"),
      evaluateMetric("uses", "Netflix", 0, 1, "KRW"),
      evaluateMetric("uses", "Netflix", 0, 4, "KRW"),
      evaluateMetric("days", "ChatGPT Plus", 0, 0, "KRW"),
      evaluateMetric("days", "ChatGPT Plus", 0, 5, "KRW"),
      evaluateMetric("hours", "Melon", 0, 0, "KRW"),
      evaluateMetric("hours", "Melon", 0, 10, "KRW"),
      evaluateMetric("benefit", "Naver Plus", 0, 5000, "KRW"),
    ];

    expect(describeCheckInOutcome(messages.ko, zeroCases[0].outcome)).toBe(
      "최근 30일 동안 Netflix을(를) 안 썼어요.",
    );
    expect(describeCheckInOutcome(messages.ko, zeroCases[3].outcome)).toBe(
      "최근 30일 동안 ChatGPT Plus을(를) 하루도 안 썼어요.",
    );
    expect(describeCheckInOutcome(messages.en, zeroCases[3].outcome)).toBe(
      "You didn't use ChatGPT Plus on a single day in the last 30 days.",
    );

    for (const locale of Object.keys(messages) as Array<keyof typeof messages>) {
      for (const item of zeroCases) {
        const text = describeCheckInOutcome(messages[locale], item.outcome);
        expect(text).not.toContain("₩0");
        expect(text).not.toContain("$0");
      }
    }
  });
});
