import { RiskLevel, Currency } from "../types";
import { GOOD_AT, VERDICT_THRESHOLDS } from "../constants/thresholds";

export function calculateCostPerUse(amount: number, usageCount: number): number {
  if (amount <= 0) return 0;
  if (usageCount <= 0) return amount;
  return amount / usageCount;
}

/**
 * 1회당 비용과 이용 횟수로 위험도를 판정한다.
 *
 * - 기준은 `constants/thresholds.ts`의 `GOOD_AT.uses`(4회)와 `VERDICT_THRESHOLDS.uses.redBelow`(2회)에서 파생한다:
 *   유료 구독(`amount > 0`)의 초록 단가 상한은 `amount / GOOD_AT.uses`(25%), 빨강 단가 하한은 `amount / redBelow`(50%)다.
 * - 무료·0원 부담(`amount <= 0`):
 *   0으로 나누거나 `0 <= 0` 비교로 중간 구간이 초록으로 건너뛰지 않도록 횟수 기준을 따른다.
 */
export function getRiskLevel(costPerUse: number, amount: number, usageCount: number): RiskLevel {
  const redBelow = VERDICT_THRESHOLDS.uses.redBelow;
  const greenAt = GOOD_AT.uses;
  if (usageCount <= 1 || (amount > 0 && costPerUse > amount / redBelow)) return "red";
  if (usageCount >= 8 || (amount > 0 ? costPerUse <= amount / greenAt : usageCount >= greenAt)) {
    return "green";
  }
  return "yellow";
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "KRW") {
    // The won has no subunit; a divided cost-per-use must not show decimals.
    return `₩${Math.round(amount).toLocaleString("ko-KR")}`;
  }
  return `$${amount.toFixed(2)}`;
}

export interface SavingsEquivalent {
  /** Language-neutral id, so a screen can name the reward in its own language. */
  key: "latte" | "chicken" | "dinner" | "trip";
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
  { key: "latte", label: "카페 라떼", unit: "잔", unitPrice: 5000 },
  { key: "chicken", label: "맛있는 치킨", unit: "마리", unitPrice: 20000 },
  { key: "dinner", label: "고급 레스토랑 저녁", unit: "회", unitPrice: 100000 },
  { key: "trip", label: "가까운 해외 여행", unit: "회", unitPrice: 500000 },
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
    ({ key, label, unit, unitPrice }) => ({
      key,
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
