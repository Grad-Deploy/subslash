/**
 * 앱의 구독 관리 목록 순서. 기본은 결제일이 가까운 순이고, 칩으로 금액·가성비 순으로 바꾼다.
 *
 * 손으로 끌어 순서를 바꾸는 방식은 두지 않는다 — 결제가 다가와도 위로 올라오지 않아 이 목록의 쓸모(급한
 * 결제가 위)가 사라지고, 폰에서는 끌기가 스크롤과 부딪힌다.
 */
import {
  getCheckInEvidence,
  getMyMonthlyAmountKRW,
  getNextBillingDateFor,
  type RiskLevel,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

export type AppSubsSort = "billing" | "amount" | "value";

export const APP_SUBS_SORT_LABEL: Record<AppSubsSort, string> = {
  billing: "결제일 순",
  amount: "금액 순",
  value: "가성비 순",
};

const RISK_ORDER: Record<RiskLevel, number> = { red: 0, yellow: 1, green: 2 };

/**
 * - 결제일 순: 결제일이 가까운 것부터. 결제 월을 모르는 연간 구독은 날짜가 없으니 맨 뒤.
 * - 금액 순: 내 몫 한 달 금액이 큰 것부터.
 * - 가성비 순: 마지막 체크인이 비쌈 → 애매 → 잘 씀. 체크인 전인 구독은 뒤(모르는 것을 좋다고 읽지
 *   않는다). 같은 무리 안에서는 결제일 순.
 */
export function sortSubsForApp(
  subs: Subscription[],
  key: AppSubsSort,
  usageLogs: UsageLog[],
  rate: number,
  now: Date = new Date(),
): Subscription[] {
  const billing = (sub: Subscription) =>
    getNextBillingDateFor(sub, now)?.getTime() ?? Number.POSITIVE_INFINITY;
  const byBilling = (a: Subscription, b: Subscription) => billing(a) - billing(b);
  if (key === "amount") {
    return [...subs].sort(
      (a, b) => getMyMonthlyAmountKRW(b, rate) - getMyMonthlyAmountKRW(a, rate) || byBilling(a, b),
    );
  }
  if (key === "value") {
    const risk = (sub: Subscription) => {
      const latest = getCheckInEvidence(
        usageLogs.filter((log) => log.subscriptionId === sub.id),
      )?.latest;
      return latest ? RISK_ORDER[latest.riskLevel] : 3;
    };
    return [...subs].sort((a, b) => risk(a) - risk(b) || byBilling(a, b));
  }
  return [...subs].sort(byBilling);
}
