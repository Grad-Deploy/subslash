import {
  GOOD_AT,
  GOOGLE_FREE_STORAGE_GB,
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
import { formatGoogleGB } from "../storage-quota";

/**
 * 체크인 결과의 큰 한 문장. `@subslash/shared`의 `evaluateMetric`이 문장 대신 값(`CheckInOutcome`)을 돌려주므로
 * 서버와 공유해도 한 언어의 문장이 섞이지 않는다.
 */
export function describeCheckInOutcome(t: Messages, outcome: CheckInOutcome): string {
  const o = t.checkin.outcome;
  const { metric, serviceName: name, monthly, quantity, currency } = outcome;
  const hasCost = monthly > 0;
  const money = (amount: number) => formatCurrency(amount, currency);
  const message = (() => {
    switch (metric) {
      case "uses":
        if (!hasCost) {
          return quantity === 0
            ? o.hoursNone(name, null)
            : `${name} · ${t.value.checkIn.uses(quantity)}`;
        }
        if (quantity === 0) return o.unused(money(monthly));
        if (quantity === 1) return o.once(name, money(monthly));
        return o.perUse(name, money(calculateCostPerUse(monthly, quantity)));
      case "days":
        if (!hasCost) {
          return quantity === 0
            ? o.daysNone(name, null)
            : `${name} · ${t.value.checkIn.days(quantity)}`;
        }
        return quantity === 0
          ? o.daysNone(name, money(monthly))
          : o.daysSome(name, money(monthly / quantity));
      case "hours":
        if (!hasCost) {
          return quantity === 0
            ? o.hoursNone(name, null)
            : `${name} · ${t.value.checkIn.hours(quantity)}`;
        }
        return quantity === 0
          ? o.hoursNone(name, money(monthly))
          : o.hoursSome(name, money(monthly / quantity));
      case "benefit": {
        const benefitMoney = formatCurrency(quantity, "KRW");
        if (!hasCost) {
          return `${name} · ${t.value.checkIn.benefit(benefitMoney)}`;
        }
        return quantity >= monthly
          ? o.benefitOver(money(monthly), benefitMoney)
          : o.benefitUnder(money(monthly), benefitMoney);
      }
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
  const withStorage = `${message}${aiStorageNote(t, outcome, money)}`;
  const withFreeTier = outcome.freeTierEnough ? `${withStorage} ${o.freeTierEnough}` : withStorage;
  // PC 기록의 토큰 근거가 있으면(쓴 날로 재는 AI 구독) 구독료의 몇 배를 뽑아 썼는지 덧붙인다.
  const ratio = outcome.apiValueRatio;
  if (ratio === null || ratio === undefined) return withFreeTier;
  return `${withFreeTier} ${
    ratio >= 1 ? o.tokensOver(formatRatio(ratio)) : o.tokensUnder(Math.round(ratio * 100))
  }`;
}

/**
 * 용량과 AI를 함께 주는 요금제(구글 AI 프로)에서 함께 적은 용량의 한 마디. 용량 때문에 이 요금제가 필요하면 그렇게
 * 말하고, 더 작은 AI 요금제에 들어가면 그것을 권한다 — Gemini를 '잘 씀'만큼(GOOD_AT.days) 썼으면 권하지 않는다.
 * 작은 요금제는 Gemini 한도도 작아, 많이 쓰는 사람에게 맞는지는 알 수 없다.
 */
function aiStorageNote(
  t: Messages,
  outcome: CheckInOutcome,
  money: (amount: number) => string,
): string {
  const fit = outcome.aiStorage;
  if (!fit || fit.percent === 0) return "";
  const o = t.checkin.outcome;
  // 측정 문장('5TB 중 4.45GB')과 같은 숫자로 적는다 — '약 5GB'로 반올림하면 같은 창에 두 숫자가 보였다.
  const used = formatGoogleGB(fit.usedGB);
  if (fit.needsThisPlan) return ` ${o.aiStorageNeeded(used)}`;
  // Gemini를 안 썼으면 AI가 없는 요금제도 권하고, 무료 용량에 들어가면 아무 요금제도 권하지 않는다.
  if (outcome.quantity === 0) {
    if (fit.fitsFree) return ` ${o.aiStorageFree(used, GOOGLE_FREE_STORAGE_GB)}`;
    return fit.cheapest
      ? ` ${o.aiStorageCheapest(used, fit.cheapest.planName, money(fit.cheapest.amount))}`
      : "";
  }
  if (fit.smallerAi && outcome.quantity < GOOD_AT.days) {
    return ` ${o.aiStorageSmaller(used, fit.smallerAi.planName, money(fit.smallerAi.amount))}`;
  }
  return "";
}

/** 일상 소비재로 환산한 비교 한 줄과 설명 한 문장. */
export function describeUsageMetaphor(
  t: Messages,
  metaphor: UsageMetaphor,
): { comparison: string; message: string } {
  if (metaphor.amountKRW <= 0) {
    const r = t.checkin.appResult;
    // 폰 기록으로 환산한 소수 횟수(1.5회)도 있어 남은 횟수는 올림한다.
    const remaining = Math.max(0, Math.ceil(GOOD_AT.uses - metaphor.usageCount));
    if (metaphor.kind === "unused") {
      return {
        comparison: r.toBreakEven,
        message: `${t.checkin.outcome.hoursNone(metaphor.serviceName, null)} ${r.remainingNote(remaining)}`,
      };
    }
    if (metaphor.kind === "movie" || metaphor.kind === "once") {
      return {
        comparison: r.toBreakEven,
        message: `${t.value.checkIn.uses(metaphor.usageCount)} · ${r.remainingNote(remaining)}`,
      };
    }
    if (metaphor.kind === "warning") {
      return {
        comparison: r.toBreakEven,
        message: r.remainingNote(remaining),
      };
    }
    return {
      comparison: r.toBreakEven,
      message: r.doneNote,
    };
  }
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

/** 이용 목표 게이지 아래 한 문장(주의 단계에서 쓴다). */
export function describeBreakEven(t: Messages, info: BreakEvenInfo): string {
  const g = t.checkin.gauge;
  if (info.currentUsage === 0) return g.none;
  const remaining = Math.max(0, info.breakEvenUsage - info.currentUsage);
  return remaining > 0 ? g.remaining(remaining) : g.done;
}
