/**
 * Fallback USD → KRW rate, used only until the user sets one or the app fetches
 * a published rate. It is a round number, not a quote: every total derived from
 * it is an estimate, and the UI says which rate it used so the number can be
 * checked against a card statement.
 */
export const DEFAULT_EXCHANGE_RATE = 1350;
