import { describe, expect, it } from "vitest";
import { messages } from "@lib/i18n/messages";
import { ASK_EVAL_SET, isExpectedCall } from "@lib/ask/eval-set";
import { localAskCall } from "@lib/ask/local";
import { SUGGESTED_CALLS } from "@lib/ask/suggestions";
import { isValidAskCall } from "@lib/ask/tools";

describe("리포트에 물어보기 추천 질문", () => {
  it("모든 화면 언어의 버튼 수와 호출 수가 같다", () => {
    for (const [locale, m] of Object.entries(messages)) {
      expect(m.ask.suggestions, locale).toHaveLength(SUGGESTED_CALLS.length);
    }
  });

  it("호출은 모두 도구 목록 안에 있다", () => {
    for (const call of SUGGESTED_CALLS) expect(isValidAskCall(call)).toBe(true);
  });

  it("한국어 버튼 문장의 뜻과 호출이 맞는다", () => {
    messages.ko.ask.suggestions.forEach((question, i) => {
      const call = SUGGESTED_CALLS[i];
      // 평가 세트에 같은 질문이 있으면 사람이 정한 정답과 맞아야 한다.
      const graded = ASK_EVAL_SET.find((item) => item.q === question && !item.history);
      if (graded) expect(isExpectedCall(graded, call), question).toBe(true);
      // 기기 규칙이 답하는 질문이면 버튼과 규칙이 같은 계산을 해야 한다.
      const local = localAskCall(question, {
        now: new Date(),
        subscriptions: [],
        hasHistory: false,
      });
      if (local) expect(local, question).toEqual(call);
    });
  });
});
