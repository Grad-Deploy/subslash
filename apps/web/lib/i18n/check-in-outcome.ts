import {
  calculateCostPerUse,
  formatAmount,
  formatCurrency,
  formatKRW,
  type BreakEvenInfo,
  type CheckInOutcome,
  type UsageMetaphor,
} from "@subslash/shared";
import type { Messages } from "./messages";
import { formatRatio } from "../pc-usage";

/**
 * 체크인 결과의 큰 한 문장. `@subslash/shared`의 `evaluateMetric`이 문장 대신 값(`CheckInOutcome`)을 돌려주므로
 * 서버와 공유해도 한 언어의 문장이 섞이지 않는다.
 */
export function describeCheckInOutcome(t: Messages, outcome: CheckInOutcome): string {
  const o = t.checkin.outcome;
  const { metric, serviceName: name, monthly, quantity, currency } = outcome;
  const money = (amount: number) => formatCurrency(amount, currency);
  const message = (() => {
    switch (metric) {
      case "uses":
        if (quantity === 0) return o.unused(money(monthly));
        if (quantity === 1) return o.once(name, money(monthly));
        return o.perUse(name, money(calculateCostPerUse(monthly, quantity)));
      case "days":
        return quantity === 0
          ? o.daysNone(name, money(monthly))
          : o.daysSome(name, money(monthly / quantity));
      case "hours":
        return quantity === 0
          ? o.hoursNone(name, money(monthly))
          : o.hoursSome(name, money(monthly / quantity));
      case "benefit":
        return quantity >= monthly
          ? o.benefitOver(money(monthly), money(quantity))
          : o.benefitUnder(money(monthly), money(quantity));
      case "storage": {
        if (quantity === 0) return o.storageEmpty(name);
        const fit = outcome.storageFit;
        if (fit) {
          const used = o.storageUsed(fit.planName, quantity, t.checkin.input.storageGB(fit.usedGB));
          if (fit.smaller) {
            return o.storageSmaller(name, used, fit.smaller.planName, money(fit.smaller.amount));
          }
          return fit.bundledExtras
            ? o.storageBundled(name, used, fit.bundledExtras)
            : o.storageNoSmaller(name, used);
        }
        return quantity < 50
          ? o.storageLowUnknownPlan(name, quantity)
          : o.storageUnknownPlan(name, quantity);
      }
    }
  })();
  const withFreeTier = outcome.freeTierEnough ? `${message} ${o.freeTierEnough}` : message;
  // PC 기록의 토큰 근거가 있으면(쓴 날로 재는 AI 구독) 구독료의 몇 배를 뽑아 썼는지 덧붙인다.
  const ratio = outcome.apiValueRatio;
  if (ratio === null || ratio === undefined) return withFreeTier;
  return `${withFreeTier} ${
    ratio >= 1 ? o.tokensOver(formatRatio(ratio)) : o.tokensUnder(Math.round(ratio * 100))
  }`;
}

/** 일상 소비재로 환산한 비교 한 줄과 설명 한 문장. */
export function describeUsageMetaphor(
  t: Messages,
  metaphor: UsageMetaphor,
): { comparison: string; message: string } {
  const m = t.checkin.metaphor;
  const item = t.value.metaphor[metaphor.item](metaphor.count);
  const cost = formatAmount(metaphor.cost, metaphor.currency);
  switch (metaphor.kind) {
    case "unused":
      return {
        comparison: m.unusedComparison(item),
        message: m.unusedMessage(metaphor.serviceName, item, formatKRW(metaphor.amountKRW)),
      };
    case "movie":
      return { comparison: m.movieComparison(item), message: m.movieMessage(cost) };
    case "once":
      return { comparison: m.onceComparison(item), message: m.onceMessage(item, cost) };
    case "warning":
      return { comparison: m.warningComparison(item), message: m.warningMessage(cost) };
    case "cheap":
      return { comparison: m.cheapComparison, message: m.cheapMessage(cost) };
    case "worth":
      return { comparison: m.worthComparison(item), message: m.worthMessage(cost) };
  }
}

/** 본전 게이지 아래 한 문장(주의 단계에서 쓴다). */
export function describeBreakEven(t: Messages, info: BreakEvenInfo): string {
  const g = t.checkin.gauge;
  if (info.currentUsage === 0) return g.none;
  const remaining = Math.max(0, info.breakEvenUsage - info.currentUsage);
  return remaining > 0 ? g.remaining(remaining) : g.done;
}
