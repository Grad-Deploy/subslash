import { describe, expect, it } from "vitest";
import { messages } from "@lib/i18n/messages";

describe("구독 리포트 문구", () => {
  it("횟수 문장은 단수와 복수를 나눈다", () => {
    const p = messages.en.reportPage;
    expect(p.ranking.used(1)).toBe(" · used 1 time");
    expect(p.ranking.used(5)).toBe(" · used 5 times");
  });

  it("겹치는 구독 안내는 결합 상품 이름 뒤에 이어 읽힌다", () => {
    const o = messages.en.reportPage.overlap;
    expect(`Bundle${o.middle("YouTube Premium")}Premium${o.after}`).toBe(
      "Bundle includes YouTube Premium, but you also subscribe to Premium separately. Unless it's a different account, you can cancel one of them.",
    );
  });
});
