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
 *   - 빨강(`red`): `usageCount < 2`(`redBelow`)이거나 유료 구독(`amount > 0`)에서 1회 단가가 월 부담금의 `1 / redBelow`(50%)를 초과할 때
 *   - 초록(`green`): 유료 구독(`amount > 0`)은 1회 단가가 월 부담금의 `1 / GOOD_AT.uses`(25%) 이하일 때,
 *     무료·0원 부담(`amount <= 0`)은 `usageCount >= GOOD_AT.uses`(4회 이상)일 때
 *   - 노랑(`yellow`): 그 사이의 주의 구간(정수 기준 2~3회)
 * - 유료와 0원 부담 구독 모두 빨강 경계를 `usageCount < 2`로 통일해, 폰 사용 기록 환산(`opensPer30`) 같은 소수 횟수(예: 1.5회)에서도
 *   유료와 0원 구독이 항상 같은 색을 내도록 보장한다.
 */
export function getRiskLevel(costPerUse: number, amount: number, usageCount: number): RiskLevel {
  const redBelow = VERDICT_THRESHOLDS.uses.redBelow;
  const greenAt = GOOD_AT.uses;
  if (usageCount < redBelow || (amount > 0 && costPerUse > amount / redBelow)) return "red";
  if (amount > 0 ? costPerUse <= amount / greenAt : usageCount >= greenAt) {
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
