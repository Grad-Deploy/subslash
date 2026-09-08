import { RiskLevel, Currency } from "../types";

export function calculateCostPerUse(amount: number, usageCount: number): number {
  if (usageCount === 0) return amount;
  return amount / usageCount;
}

export function getRiskLevel(costPerUse: number, amount: number, usageCount: number): RiskLevel {
  if (usageCount <= 1 || costPerUse > amount * 0.5) return "red";
  if (usageCount >= 8 || costPerUse <= amount * 0.25) return "green";
  return "yellow";
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "KRW") {
    // The won has no subunit; a divided cost-per-use must not show decimals.
    return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatShockMessage(
  serviceName: string,
  amount: number,
  usageCount: number,
  currency: Currency,
): string {
  const formattedAmount = formatCurrency(amount, currency);

  if (usageCount === 0) {
    return `이번 달 ${formattedAmount}을 공중에 버리셨습니다. 지금 바로 킬(Kill) 스위치를 켜세요.`;
  }

  if (usageCount === 1) {
    return `이번 달 ${serviceName} 1회를 ${formattedAmount}에 이용하셨습니다.`;
  }

  const costPerUseFormatted = formatCurrency(calculateCostPerUse(amount, usageCount), currency);
  return `이번 달 ${serviceName} 1회당 ${costPerUseFormatted}을 지출하셨습니다.`;
}

export function calculateAnnualSavings(monthlyAmount: number): number {
  return monthlyAmount * 12;
}

export interface SavingsEquivalent {
  emoji: string;
  /** Reward name, e.g. "맛있는 치킨". */
  label: string;
  /** Korean counter word, e.g. "마리". */
  unit: string;
  /** How many the savings actually cover. Always at least 1. */
  count: number;
}

/**
 * Reward tiers with the real price each is worth, cheapest first.
 *
 * Counts are derived from these prices rather than written by hand, so a tier
 * can never claim more than the savings cover.
 */
const REWARD_TIERS: ReadonlyArray<Omit<SavingsEquivalent, "count"> & { unitPrice: number }> = [
  { emoji: "☕", label: "카페 라떼", unit: "잔", unitPrice: 5000 },
  { emoji: "🍗", label: "맛있는 치킨", unit: "마리", unitPrice: 20000 },
  { emoji: "🍣", label: "고급 레스토랑 저녁", unit: "회", unitPrice: 100000 },
  { emoji: "✈️", label: "가까운 해외 여행", unit: "회", unitPrice: 500000 },
];

/**
 * The rewards `annualSavings` genuinely covers, cheapest first.
 *
 * A tier the savings cannot cover is left out rather than rounded up to one:
 * telling someone who saved ₩12,000 that it buys a ₩100,000 dinner discredits
 * every other number on the page. Returns an empty array below the cheapest
 * tier.
 */
export function getSavingsEquivalents(annualSavings: number): SavingsEquivalent[] {
  return REWARD_TIERS.filter((tier) => annualSavings >= tier.unitPrice).map(
    ({ emoji, label, unit, unitPrice }) => ({
      emoji,
      label,
      unit,
      count: Math.floor(annualSavings / unitPrice),
    }),
  );
}

/**
 * The single headline equivalent: the priciest reward the savings actually
 * cover. Empty when they do not cover even the cheapest tier.
 */
export function getSavingsEquivalent(annualSavings: number): string[] {
  const affordable = getSavingsEquivalents(annualSavings);
  const best = affordable[affordable.length - 1];
  return best ? [`${best.label} ${best.count}${best.unit}`] : [];
}
