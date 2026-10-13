import { describe, expect, it } from "vitest";
import { ASK_EVAL_SET } from "@lib/ask/eval-set";
import { ASK_TRAIN_SET, askQuestionKey } from "@lib/ask/train-set";
import { isValidAskCall, MAX_ASK_QUESTION } from "@lib/ask/tools";
import { LOCALES } from "@lib/i18n/config";

describe("리포트에 물어보기 — 학습 세트", () => {
  it("평가 세트와 같은 질문이 없다(평가 세트는 처음 보는 질문으로 남는다)", () => {
    const evalKeys = new Set(ASK_EVAL_SET.map((item) => askQuestionKey(item.q)));
    expect(ASK_TRAIN_SET.filter((item) => evalKeys.has(askQuestionKey(item.q)))).toEqual([]);
  });

  it("같은 질문이 두 번 없다", () => {
    const keys = ASK_TRAIN_SET.map((item) => askQuestionKey(item.q));
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("모든 질문의 정답 호출이 도구 목록 안에 있다", () => {
    for (const item of ASK_TRAIN_SET) {
      expect(isValidAskCall(item.call), item.q).toBe(true);
      expect(LOCALES).toContain(item.locale);
      expect(item.q.length).toBeLessThanOrEqual(MAX_ASK_QUESTION);
    }
  });

  it("서비스 이름을 받는 호출은 그 이름이 질문에 그대로 있다", () => {
    for (const item of ASK_TRAIN_SET) {
      const service = item.call.args?.service;
      if (typeof service !== "string") continue;
      expect(askQuestionKey(item.q), item.q).toContain(askQuestionKey(service));
    }
  });

  it("띄어쓰기·문장부호·대소문자만 다른 질문은 같은 질문으로 본다", () => {
    expect(askQuestionKey("한 달 구독료 얼마야?")).toBe(askQuestionKey("한달 구독료 얼마야"));
    expect(askQuestionKey("Total Spend?")).toBe(askQuestionKey("total spend"));
  });
});
