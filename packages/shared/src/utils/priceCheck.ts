import { Currency, BillingCycle } from "../types";
import { findPresetForSubscription } from "../constants/services";

/** 요금을 다시 물어보기까지 두는 기간. */
export const PRICE_CHECK_INTERVAL_DAYS = 90;

export interface PriceCheckSubscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingCycle?: BillingCycle;
  cancelUrl?: string;
  createdAt: string;
  lastPriceCheckedAt?: string;
}

export type PriceCheckReason =
  /** 앱이 들고 있는 프리셋 기준 요금과 등록된 금액이 다르다. */
  | "preset-mismatch"
  /** 마지막 확인(또는 등록)으로부터 오래됐다. */
  | "stale";

export interface PriceCheckCandidate {
  subscriptionId: string;
  name: string;
  currentAmount: number;
  currency: Currency;
  reason: PriceCheckReason;
  /**
   * 프리셋에 적힌 월 기준 요금. 맞는 프리셋이 없거나 비교할 수 없으면 `null`
   * 이고, 이때 화면은 '최신 요금으로 갱신' 버튼을 내밀지 않는다.
   */
  presetAmount: number | null;
  /** 마지막 확인(없으면 등록)으로부터 지난 날짜 수. */
  daysSinceChecked: number;
  /** 한 번이라도 요금을 확인해 준 적이 있는지. */
  everChecked: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * 요금을 다시 확인해 볼 만한 구독을 고른다.
 *
 * 앱은 서비스의 실제 요금표를 조회하지 않는다. 여기서 아는 것은 (1) 앱에
 * 함께 실린 프리셋 기준 요금과 등록 금액이 다르다는 사실과 (2) 확인한 지
 * 오래됐다는 사실뿐이다. 그래서 "요금이 올랐습니다"라고 단정하지 않고,
 * 확인해 달라고만 한다.
 */
export function getPriceCheckCandidates(
  subs: PriceCheckSubscription[],
  now: Date = new Date(),
): PriceCheckCandidate[] {
  const candidates: PriceCheckCandidate[] = [];

  for (const sub of subs) {
    const checkedSource = sub.lastPriceCheckedAt ?? sub.createdAt;
    const checkedDate = new Date(checkedSource);
    if (Number.isNaN(checkedDate.getTime())) continue;

    const daysSinceChecked = Math.max(0, daysBetween(checkedDate, now));
    const isStale = daysSinceChecked >= PRICE_CHECK_INTERVAL_DAYS;

    const preset = findPresetForSubscription(sub);
    // 프리셋 기본 요금은 월 결제 기준이라 연간 플랜과는 비교할 수 없고,
    // 통화가 다르면 환율을 끼워 비교하는 순간 근거 없는 숫자가 된다.
    const comparable =
      preset && sub.currency === preset.currency && (sub.billingCycle ?? "monthly") === "monthly";
    const presetAmount = comparable ? preset.defaultAmount : null;
    const mismatched = presetAmount !== null && presetAmount !== sub.amount;

    // 사용자가 '요금 유지'를 눌렀다면 그 판단을 존중해서 다음 주기까지 조용히 둔다.
    if (!isStale) continue;

    if (mismatched) {
      candidates.push({
        subscriptionId: sub.id,
        name: sub.name,
        currentAmount: sub.amount,
        currency: sub.currency,
        reason: "preset-mismatch",
        presetAmount,
        daysSinceChecked,
        everChecked: Boolean(sub.lastPriceCheckedAt),
      });
      continue;
    }

    candidates.push({
      subscriptionId: sub.id,
      name: sub.name,
      currentAmount: sub.amount,
      currency: sub.currency,
      reason: "stale",
      presetAmount,
      daysSinceChecked,
      everChecked: Boolean(sub.lastPriceCheckedAt),
    });
  }

  // 프리셋과 어긋난 쪽이 더 확실한 근거이므로 먼저 보여준다.
  return candidates.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "preset-mismatch" ? -1 : 1;
    return b.daysSinceChecked - a.daysSinceChecked;
  });
}
