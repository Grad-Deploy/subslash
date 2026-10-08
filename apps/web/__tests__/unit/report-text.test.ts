import { describe, expect, it } from "vitest";
import { messages } from "@lib/i18n/messages";

describe("구독 리포트 문구", () => {
  it("한국어 연령대 이름은 lib/stats가 원문이다", () => {
    expect(messages.ko.reportPage.age.labels["60s+"]).toBe("60대 이상");
    expect(messages.en.reportPage.age.labels["60s+"]).toBe("60 and over");
  });

  it("비교 문장은 단수와 복수를 나눈다", () => {
    const p = messages.en.reportPage;
    expect(p.age.tooFew("20s", 1)).toContain("Only 1 person in 20s");
    expect(p.age.tooFew("20s", 3)).toContain("Only 3 people in 20s");
    expect(p.ranking.used(1)).toBe(" · used 1 time");
    expect(p.ranking.used(5)).toBe(" · used 5 times");
    expect(p.peer.gathering(20, 1)).toContain("1 person has joined");
  });

  it("겹치는 구독 안내는 결합 상품 이름 뒤에 이어 읽힌다", () => {
    const o = messages.en.reportPage.overlap;
    expect(`Bundle${o.middle("YouTube Premium")}Premium${o.after}`).toBe(
      "Bundle includes YouTube Premium, but you also subscribe to Premium separately. Unless it's a different account, you can cancel one of them.",
    );
  });
});
