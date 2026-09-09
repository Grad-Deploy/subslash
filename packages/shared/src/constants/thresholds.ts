export const RISK_THRESHOLDS = {
  green: {
    minUsageCount: 8,
    maxCostRatio: 0.25,
  },
  yellow: {
    minUsageCount: 3,
    maxCostRatio: 0.5,
  },
  red: {
    maxUsageCount: 1,
    minCostRatio: 0.5,
  },
} as const;

export const REMINDER_DAYS = [7, 3, 1];
export const MAX_FREE_SUBSCRIPTIONS = 10;
/**
 * Fallback USD → KRW rate, used only until the user sets one or the app fetches
 * a published rate. It is a round number, not a quote: every total derived from
 * it is an estimate, and the UI says which rate it used so the number can be
 * checked against a card statement.
 */
export const DEFAULT_EXCHANGE_RATE = 1350;

export const SAVINGS_EQUIVALENTS = [
  { minAmount: 500000, label: "해외 여행 1회", emoji: "✈️" },
  { minAmount: 200000, label: "고급 레스토랑 저녁 식사 4회", emoji: "🍽️" },
  { minAmount: 100000, label: "최신 무선 이어폰 1개", emoji: "🎧" },
  { minAmount: 50000, label: "맛있는 치킨 5마리", emoji: "🍗" },
] as const;
