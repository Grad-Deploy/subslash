import type { BillingCycle, SubscriptionStatus } from "../types";
import { getNextBillingDateFor } from "./date";

/**
 * 해지가 실제로 결제를 멈췄는지 확인한다.
 *
 * "해지 완료했어요"는 사용자의 말이고, 앱은 서비스에 해지 여부를 물어볼 수
 * 없다. 해지가 제대로 됐는지는 다음 결제가 빠져나가지 않았다는 사실로만
 * 드러난다. 앱스토어 구독이 따로 남아 있거나 해지 마지막 단계를 놓쳤다면,
 * 절약 현황은 지키지 못한 돈을 지킨 돈으로 세고 있게 된다.
 *
 * 그래서 해지 뒤 첫 결제일이 지나면 그날 결제가 됐는지를 한 번 묻는다. 한 번
 * 멈췄다면 이후 결제도 멈춘 것으로 보고 다시 묻지 않는다.
 */

export interface KillCheckSubscription {
  status: SubscriptionStatus;
  billingDay: number;
  billingCycle?: BillingCycle;
  billingMonth?: number;
  killedAt?: string;
  killVerifiedAt?: string;
}

export type KillCheckStatus =
  /** 해지 뒤 결제가 멈춘 것을 사용자가 확인해 줬다. */
  | { state: "verified" }
  /** 해지 뒤 첫 결제일이 지났는데 아직 답을 받지 못했다. */
  | { state: "due"; billingDate: Date }
  /** 해지 뒤 첫 결제일이 아직 오지 않았다. 물어볼 근거가 없다. */
  | { state: "waiting"; billingDate: Date }
  /**
   * 물어볼 날짜를 정할 수 없다 — 결제 월을 모르는 연간 구독이거나, 해지
   * 시각이 없거나 깨졌다. 날짜를 짐작해서 묻지 않는다.
   */
  | { state: "unknown" };

/**
 * 해지 뒤 첫 결제일.
 *
 * 방어액 계산(`getMyMonthDefendedAmountKRW`)은 결제일 당일에 해지해도 그 달을
 * 지킨 것으로 센다. 같은 기준을 써서, 해지한 날과 같은 날인 결제일도 첫
 * 결제일로 본다. 기준이 어긋나면 지킨 것으로 센 달을 확인하지 않게 된다.
 */
export function getFirstBillingDateAfterKill(sub: KillCheckSubscription): Date | null {
  if (!sub.killedAt) return null;
  const killed = new Date(sub.killedAt);
  if (Number.isNaN(killed.getTime())) return null;
  // getNextBillingDateFor는 기준일 당일의 결제일을 지난 것으로 본다. 하루 전을
  // 기준으로 넘겨야 해지 당일의 결제일이 포함된다.
  const dayBefore = new Date(killed.getFullYear(), killed.getMonth(), killed.getDate() - 1);
  return getNextBillingDateFor(sub, dayBefore);
}

/**
 * 해지한 구독의 결제 확인 상태. 해지하지 않은 구독에는 `null`.
 *
 * 결제 문자는 결제일 당일에 오지만 몇 시에 올지는 모른다. 당일에 물으면
 * "아직 안 왔다"를 "결제 안 됐다"로 답하게 되므로 다음 날부터 묻는다.
 */
export function getKillCheckStatus(
  sub: KillCheckSubscription,
  now: Date = new Date(),
): KillCheckStatus | null {
  if (sub.status !== "killed") return null;
  if (sub.killVerifiedAt) return { state: "verified" };

  const billingDate = getFirstBillingDateAfterKill(sub);
  if (!billingDate) return { state: "unknown" };

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today.getTime() > billingDate.getTime()
    ? { state: "due", billingDate }
    : { state: "waiting", billingDate };
}

/** "9월 15일". 올해가 아니면 "2025년 12월 5일". */
export function formatKillCheckDate(date: Date, now: Date = new Date()): string {
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  return date.getFullYear() === now.getFullYear()
    ? monthDay
    : `${date.getFullYear()}년 ${monthDay}`;
}
