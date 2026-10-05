/**
 * '리포트에 물어보기'에서 AI가 고를 수 있는 계산(도구) 목록.
 *
 * AI는 질문을 읽고 이 중 하나와 인자만 고른다. 계산은 기기가 자기 기록으로 하고(기록은 기기에 있다 — CLAUDE.md
 * '데이터 위치'), 답은 도구마다 정해 둔 문장 틀에 그 숫자를 넣어 만든다. 그래서 AI에는 질문 문장만 가고 구독 목록·금액은
 * 가지 않으며, AI가 숫자를 지어낼 자리가 없다(제1원칙). 서비스 이름도 사용자가 적은 말 그대로 받고, 실제 구독과 맞추는
 * 것은 기기가 한다.
 *
 * 이 목록이 AI가 할 수 있는 일의 전부다. 여기 없는 질문은 `unsupported`, 앱 사용법은 `help`(도움말 AI)로 보낸다.
 * 도구를 더하거나 인자를 바꾸면 평가 세트(`eval-set.ts`)도 같이 고친다.
 */

import type { SubscriptionCategory } from "@subslash/shared";

export const ASK_CATEGORIES = [
  "ott",
  "music",
  "cloud",
  "shopping",
  "ai",
  "other",
] as const satisfies readonly SubscriptionCategory[];

export const ASK_PERIODS = ["month", "year"] as const;
export const ASK_ORDERS = ["worst", "best"] as const;

type ParamSpec =
  | { type: "enum"; values: readonly string[]; required: boolean }
  | { type: "int"; min: number; max: number; required: boolean }
  | { type: "text"; maxLength: number; required: boolean };

interface ToolSpec {
  /** AI에게 보이는 설명. 언제 고르는지를 쓴다. */
  description: string;
  params: Record<string, ParamSpec>;
  /** 기기에서 이 도구를 계산할 때 쓰는 기존 함수(@subslash/shared 등). 새로 만들어야 하면 그렇게 적는다. */
  computedBy: string;
}

export const ASK_TOOLS = {
  spendTotal: {
    description: "구독에 쓰는 돈의 합계. 한 달 또는 1년.",
    params: { period: { type: "enum", values: ASK_PERIODS, required: true } },
    computedBy: "sumMyMonthlyKRW / sumMyAnnualKRW",
  },
  spendByCategory: {
    description:
      "한 분류(OTT·음악·클라우드·쇼핑 멤버십·AI·기타)에 쓰는 한 달 돈과 전체에서의 비율.",
    params: { category: { type: "enum", values: ASK_CATEGORIES, required: true } },
    computedBy: "sumMyMonthlyKRW(분류로 거른 구독)",
  },
  costPerUseRank: {
    description:
      "1회(또는 하루·시간)당 비용 순위. worst는 가장 아까운 것부터, best는 가성비 좋은 것부터.",
    params: {
      order: { type: "enum", values: ASK_ORDERS, required: true },
      limit: { type: "int", min: 1, max: 5, required: false },
    },
    computedBy: "리포트 1회 단가 순위(components/report/valueRows)",
  },
  lowUsage: {
    description: "최근 30일 동안 거의 쓰지 않은 구독(체크인 기준 빨강).",
    params: {},
    computedBy: "metricRiskLevel / getRiskLevel",
  },
  upcomingCharges: {
    description: "앞으로 며칠 안에 결제될 구독과 금액. 무료 체험 중인 구독은 빠진다.",
    params: { days: { type: "int", min: 1, max: 31, required: true } },
    computedBy: "getDaysUntilBillingFor · isInTrial",
  },
  trialsEnding: {
    description: "며칠 안에 무료 체험이 끝나는 구독.",
    params: { days: { type: "int", min: 1, max: 31, required: true } },
    computedBy: "getDaysUntilTrialEnd",
  },
  overlaps: {
    description: "결합 상품과 겹치거나 같은 분류에 여러 개 있는 구독.",
    params: {},
    computedBy: "findBundleOverlaps + 같은 분류 묶기",
  },
  cheaperPlan: {
    description: "한 서비스에 지금보다 싼 요금제가 있는지.",
    params: { service: { type: "text", maxLength: 30, required: true } },
    computedBy: "getPlanAlternatives",
  },
  serviceDetail: {
    description: "한 서비스의 다음 결제일·내 몫 금액·최근 체크인.",
    params: { service: { type: "text", maxLength: 30, required: true } },
    computedBy: "getNextBillingDateFor · getMyMonthlyShareAmount · 체크인 기록",
  },
  savedSoFar: {
    description: "해지해서 지킨 돈. 이번 달 또는 올해.",
    params: { period: { type: "enum", values: ASK_PERIODS, required: true } },
    computedBy: "sumMyMonthDefendedKRW / sumMyYearDefendedKRW",
  },
  compareLastMonth: {
    description: "이번 달 구독비가 지난달보다 늘었는지 줄었는지.",
    params: {},
    computedBy: "새로 만들어야 함 — 등록일·해지일로 지난달 합계를 다시 계산",
  },
  help: {
    description: "앱 사용법·기능 설명 질문. 도움말 AI로 넘긴다.",
    params: {},
    computedBy: "도움말 AI(FAQ)",
  },
  unsupported: {
    description: "위 어느 것에도 맞지 않는 질문. 답하지 않고 물어볼 수 있는 질문을 보여 준다.",
    params: {},
    computedBy: "없음",
  },
} as const satisfies Record<string, ToolSpec>;

export type AskToolName = keyof typeof ASK_TOOLS;

export interface AskCall {
  tool: AskToolName;
  args?: Record<string, string | number>;
}

/**
 * AI가 돌려준 호출이 목록 안에 있는지. 도구 이름·인자 이름·값의 범위를 모두 본다. 틀리면 그 호출을 쓰지 않고
 * `unsupported`로 처리한다 — 목록 밖의 값을 그대로 계산에 넘기지 않는다.
 */
export function isValidAskCall(call: unknown): call is AskCall {
  if (!call || typeof call !== "object") return false;
  const { tool, args = {} } = call as { tool?: unknown; args?: unknown };
  if (typeof tool !== "string" || !Object.hasOwn(ASK_TOOLS, tool)) return false;
  if (!args || typeof args !== "object" || Array.isArray(args)) return false;
  const params: Record<string, ParamSpec> = ASK_TOOLS[tool as AskToolName].params;
  const given = args as Record<string, unknown>;
  for (const key of Object.keys(given)) if (!Object.hasOwn(params, key)) return false;
  for (const [key, spec] of Object.entries(params)) {
    const value = given[key];
    if (value === undefined) {
      if (spec.required) return false;
      continue;
    }
    if (spec.type === "enum" && !spec.values.includes(value as string)) return false;
    if (
      spec.type === "int" &&
      (!Number.isInteger(value) || (value as number) < spec.min || (value as number) > spec.max)
    )
      return false;
    if (
      spec.type === "text" &&
      (typeof value !== "string" || value.trim() === "" || value.length > spec.maxLength)
    )
      return false;
  }
  return true;
}
