import type { DiscoveredSubscription, SubscriptionFormData } from "@subslash/shared";

/**
 * 불러오기(문자·메일)에서 찾은 후보를 등록할 폼 값으로. 웹과 앱의 불러오기 창이 같은 매핑을 따로 들고 있어,
 * 후보에 칸을 더하면 한쪽에서만 등록되는 일이 생길 수 있었다.
 *
 * 결제 기록(`chargeHistory`)은 폼 값이 아니라 등록한 뒤 앱이 적는 사실이라 넣지 않는다(recordChargeHistory).
 */
export function discoveredFormData(item: DiscoveredSubscription): SubscriptionFormData {
  return {
    name: item.name,
    amount: item.amount,
    currency: item.currency,
    billingDay: item.billingDay,
    billingCycle: item.billingCycle,
    billingMonth: item.billingMonth,
    category: item.category,
    cancelUrl: item.cancelUrl,
    cancelGuide: item.cancelGuide,
    paymentMethod: item.paymentMethod,
    linkedAccountId: item.linkedAccountId,
    linkedAccountName: item.linkedAccountName,
  };
}
