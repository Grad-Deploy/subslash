import type { DiscoveredSubscription } from "@subslash/shared";

/**
 * 찾은 후보의 결제 주기 한 줄(웹·앱의 결제 문자로 불러오기). 결제 메일에는 연간 영수증도 섞여 오므로 주기를
 * 따른다. 연간인데 결제 월을 모르면 날짜를 지어내지 않고 '미설정'으로 둔다.
 */
export function cycleText(
  item: Pick<DiscoveredSubscription, "billingCycle" | "billingDay" | "billingMonth">,
): string {
  if (item.billingCycle === "yearly") {
    return item.billingMonth
      ? `매년 ${item.billingMonth}월 ${item.billingDay}일`
      : "매년 · 결제월 미설정";
  }
  return `매월 ${item.billingDay}일`;
}
