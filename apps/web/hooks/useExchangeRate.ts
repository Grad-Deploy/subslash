import { useStore } from "../lib/store";
import { DEFAULT_EXCHANGE_RATE } from "@subslash/shared";

/**
 * The USD → KRW rate every component should convert with.
 *
 * Components must not fall back to the currency helpers' own default argument:
 * doing so would show a total built from 1,350 next to a screen that says the
 * user's rate is in use.
 */
export function useExchangeRate(): number {
  return useStore((state) => state.exchangeRate.rate ?? DEFAULT_EXCHANGE_RATE);
}
