import { getSavingsEquivalents, type SpendingType } from "@subslash/shared";
import type { Messages } from "./messages";

/** 소비 유형을 화면·공유 카드에 적을 말. 둘이 같은 문장을 쓴다. */
export function describeSpendingTypeText(
  t: Messages,
  type: SpendingType,
): { title: string; detail: string } {
  const s = t.savings.spendingType;
  if (type.kind === "focused") {
    const label = t.value.category[type.category];
    return {
      title: s.focusedTitle(label),
      detail: s.focusedDetail(label, Math.round(type.share * 100)),
    };
  }
  return { title: s.spreadTitle, detail: s.spreadDetail(type.categoryCount) };
}

/** 1년 절약액으로 살 수 있는 가장 비싼 보상 한 줄('맛있는 치킨 3마리'). 첫 보상에도 못 미치면 빈 글자. */
export function rewardHeadline(t: Messages, annualSavings: number): string {
  const best = getSavingsEquivalents(annualSavings).at(-1);
  return best ? t.value.reward[best.key](best.count) : "";
}
