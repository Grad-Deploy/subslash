import type { DiscoveredSubscription } from "@subslash/shared";
import type { Messages } from "@lib/i18n/messages";

/** 후보 한 줄의 결제 주기: '매월 15일', '매년 9월 3일'. */
export function cycleText(
  t: Messages,
  item: Pick<DiscoveredSubscription, "billingCycle" | "billingDay" | "billingMonth">,
): string {
  const c = t.importing.cycle;
  if (item.billingCycle === "yearly") {
    return item.billingMonth ? c.yearly(item.billingMonth, item.billingDay) : c.yearlyUnset;
  }
  return c.monthly(item.billingDay);
}
