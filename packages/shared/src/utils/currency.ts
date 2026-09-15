import { BillingCycle, Currency } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";

export function formatKRW(amount: number): string {
  // The won has no subunit; never render fractional amounts.
  return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatAmount(amount: number, currency: Currency): string {
  if (currency === "KRW") {
    return formatKRW(amount);
  }
  return formatUSD(amount);
}

export function convertUSDtoKRW(usd: number, rate: number = DEFAULT_EXCHANGE_RATE): number {
  return usd * rate;
}

/** Normalises any amount to KRW so mixed-currency subscriptions can be summed. */
export function toKRW(
  amount: number,
  currency: Currency,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return currency === "USD" ? Math.round(amount * rate) : amount;
}

/**
 * 카드에 실제로 청구되는 한 번의 결제액(구독의 통화 그대로).
 *
 * 요금표 가격에 세금이 빠진 해외 서비스는 `taxRate`(%)만큼 더한다. 결제 대행사처럼 센트(원은
 * 소수점 둘째 자리)에서 반올림한다 — $9.99에 10%면 $10.99다. 세율이 없거나 이상한 값이면
 * 등록한 금액 그대로다.
 */
export function getBilledAmount(sub: { amount: number; taxRate?: number }): number {
  const taxRate = sub.taxRate;
  if (typeof taxRate !== "number" || !Number.isFinite(taxRate) || taxRate <= 0) return sub.amount;
  return Math.round(sub.amount * (100 + taxRate)) / 100;
}

type BilledSubscription = {
  amount: number;
  currency: Currency;
  billingCycle?: BillingCycle;
  taxRate?: number;
};

/**
 * A subscription's cost expressed as monthly KRW — yearly plans are divided by
 * 12 and USD plans converted, so totals across a mixed list are comparable.
 * Tax charged on top of the list price is included (`getBilledAmount`).
 */
export function getMonthlyAmountKRW(
  sub: BilledSubscription,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  const krw = toKRW(getBilledAmount(sub), sub.currency, rate);
  return sub.billingCycle === "yearly" ? Math.round(krw / 12) : krw;
}

/** Annual KRW cost of a subscription, whatever its currency, billing cycle or tax. */
export function getAnnualAmountKRW(
  sub: BilledSubscription,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  const krw = toKRW(getBilledAmount(sub), sub.currency, rate);
  return sub.billingCycle === "yearly" ? krw : krw * 12;
}

/** Sum of a list of subscriptions as monthly KRW. */
export function sumMonthlyKRW(
  subs: BilledSubscription[],
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getMonthlyAmountKRW(sub, rate), 0);
}

/** Sum of a list of subscriptions as annual KRW. */
export function sumAnnualKRW(
  subs: BilledSubscription[],
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getAnnualAmountKRW(sub, rate), 0);
}
