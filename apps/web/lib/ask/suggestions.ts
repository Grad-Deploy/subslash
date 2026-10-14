import type { AskCall } from "./tools";

/**
 * '리포트에 물어보기'의 추천 질문 버튼(`t.ask.suggestions`, 같은 순서)이 부르는 도구.
 *
 * 버튼의 뜻은 정해져 있으므로 문장을 다시 해석하지 않고 이 호출로 바로 답한다. 기기 규칙(`localAskCall`)은 사실상
 * 한국어만 알아들어서, 문장으로 넘기면 AI가 닫힌 동안 다른 언어 화면의 버튼이 하나도 답하지 못했다. 버튼 문구를
 * 바꾸거나 더하면 이 목록도 같이 고친다(`ask-suggestions.test`가 개수와 한국어 문장의 뜻을 견준다).
 */
export const SUGGESTED_CALLS: readonly AskCall[] = [
  { tool: "spendTotal", args: { period: "month" } },
  { tool: "costPerUseRank", args: { order: "worst" } },
  { tool: "spendByCategory", args: { category: "ott" } },
  { tool: "upcomingCharges", args: { days: 7 } },
  { tool: "overlaps" },
];
