import { describe, expect, it } from "vitest";
import { ASK_EVAL_SET } from "@lib/ask/eval-set";
import { ASK_TOOLS, isValidAskCall, type AskToolName } from "@lib/ask/tools";

describe("리포트에 물어보기 — 도구 목록", () => {
  it("목록 밖의 도구·인자·값은 받지 않는다", () => {
    // AI가 돌려준 값을 그대로 계산에 넘기지 않는다. 틀리면 unsupported로 처리한다.
    expect(isValidAskCall({ tool: "spendTotal", args: { period: "month" } })).toBe(true);
    expect(isValidAskCall({ tool: "deleteAllSubscriptions" })).toBe(false);
    expect(isValidAskCall({ tool: "toString" })).toBe(false);
    expect(isValidAskCall({ tool: "spendTotal" })).toBe(false);
    expect(isValidAskCall({ tool: "spendTotal", args: { period: "week" } })).toBe(false);
    expect(isValidAskCall({ tool: "spendTotal", args: { period: "month", extra: 1 } })).toBe(false);
    expect(isValidAskCall({ tool: "upcomingCharges", args: { days: 0 } })).toBe(false);
    expect(isValidAskCall({ tool: "upcomingCharges", args: { days: 3.5 } })).toBe(false);
    expect(isValidAskCall({ tool: "cheaperPlan", args: { service: " " } })).toBe(false);
    expect(isValidAskCall({ tool: "cheaperPlan", args: { service: "가".repeat(31) } })).toBe(false);
    expect(isValidAskCall({ tool: "lowUsage", args: [] })).toBe(false);
    expect(isValidAskCall(null)).toBe(false);
  });
});

describe("리포트에 물어보기 — 평가 세트", () => {
  it("정답은 모두 목록 안의 올바른 호출이다", () => {
    for (const item of ASK_EVAL_SET) {
      for (const call of [item.expect, ...(item.also ?? [])]) {
        expect(isValidAskCall(call), `${item.q} → ${JSON.stringify(call)}`).toBe(true);
      }
    }
  });

  it("같은 질문을 두 번 적지 않는다", () => {
    const questions = ASK_EVAL_SET.map((item) => item.q);
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("도구마다 정답 질문이 3개 이상 있다 — 적은 도구의 정답률은 믿을 수 없다", () => {
    const counts = new Map<AskToolName, number>();
    for (const item of ASK_EVAL_SET)
      counts.set(item.expect.tool, (counts.get(item.expect.tool) ?? 0) + 1);
    for (const tool of Object.keys(ASK_TOOLS) as AskToolName[]) {
      expect(counts.get(tool) ?? 0, tool).toBeGreaterThanOrEqual(3);
    }
  });

  it("범위 밖·공격 질문이 전체의 5분의 1 이상이다 — 답하지 않아야 할 때를 함께 잰다", () => {
    const refusing = ASK_EVAL_SET.filter((item) => item.tag === "scope" || item.tag === "attack");
    expect(refusing.length * 5).toBeGreaterThanOrEqual(ASK_EVAL_SET.length);
  });
});
