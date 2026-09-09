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
 * A subscription's cost expressed as monthly KRW — yearly plans are divided by
 * 12 and USD plans converted, so totals across a mixed list are comparable.
 */
export function getMonthlyAmountKRW(
  sub: { amount: number; currency: Currency; billingCycle?: BillingCycle },
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  const krw = toKRW(sub.amount, sub.currency, rate);
  return sub.billingCycle === "yearly" ? Math.round(krw / 12) : krw;
}

/** Annual KRW cost of a subscription, whatever its currency or billing cycle. */
export function getAnnualAmountKRW(
  sub: { amount: number; currency: Currency; billingCycle?: BillingCycle },
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  const krw = toKRW(sub.amount, sub.currency, rate);
  return sub.billingCycle === "yearly" ? krw : krw * 12;
}

/** Sum of a list of subscriptions as monthly KRW. */
export function sumMonthlyKRW(
  subs: Array<{ amount: number; currency: Currency; billingCycle?: BillingCycle }>,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getMonthlyAmountKRW(sub, rate), 0);
}

/** Sum of a list of subscriptions as annual KRW. */
export function sumAnnualKRW(
  subs: Array<{ amount: number; currency: Currency; billingCycle?: BillingCycle }>,
  rate: number = DEFAULT_EXCHANGE_RATE,
): number {
  return subs.reduce((total, sub) => total + getAnnualAmountKRW(sub, rate), 0);
}
