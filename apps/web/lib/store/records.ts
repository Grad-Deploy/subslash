import {
  asksFreeTier,
  clampQuantity,
  evaluateMetric,
  getMyMonthlyShareAmount,
  metricForSubscription,
  storagePlanFit,
  type CheckInResponse,
  type Subscription,
  type SubscriptionFormData,
  type UsageLog,
  type ValueMetric,
} from "@subslash/shared";

/**
 * 구독 기록 한 줄을 바꾸는 규칙. 저장소 액션(index.ts)은 어느 구독에 적용할지만 고르고, 무엇을 지우고
 * 남기는지는 여기서 정한다 — 해지·되살리기에 딸려 지울 칸이 늘어날 때 한 곳만 고치면 된다.
 */

/** 등록 폼의 값으로 새 구독을 만든다. */
export function createSubscription(
  data: SubscriptionFormData,
  id: string,
  createdAt: string,
): Subscription {
  return {
    ...data,
    id,
    status: "active",
    createdAt,
    currency: data.currency || "KRW",
    billingCycle: data.billingCycle || "monthly",
    category: data.category || "other",
  };
}

/**
 * 해지로 기록한다. 해지 확인은 해지 한 번에 딸린 기록이라 지운다 — 되살렸다가 다시 해지했을 때 이전
 * 확인이 새 해지를 확인한 것처럼 남지 않게.
 */
export function killedRecord(sub: Subscription, killedAt: string): Subscription {
  return {
    ...sub,
    status: "killed",
    killedAt,
    killVerifiedAt: undefined,
    // 앞선 해지에 딸린 기록이 새 해지에 남지 않게 한다.
    resubscribeRemindOn: undefined,
    killEvidence: undefined,
    // 해지 알림에 대한 물음은 해지로 답이 됐다.
    cancelNoticeAt: undefined,
  };
}

/** 구독 중으로 되돌린다. 해지 한 번에 딸린 기록을 모두 지운다. */
export function revivedRecord(sub: Subscription): Subscription {
  return {
    ...sub,
    status: "active",
    killedAt: undefined,
    killVerifiedAt: undefined,
    // 다시 구독했으니 '다시 살펴볼 날'도, 해지 근거도 더 이상 이 구독의 것이 아니다.
    resubscribeRemindOn: undefined,
    killEvidence: undefined,
    // 되살린 구독은 구독 중 목록에 보여야 한다.
    hiddenAt: undefined,
    // 다시 구독 중이면 "해지했는데 결제됐다"는 더 이상 이상한 일이 아니다.
    chargedAfterKillAt: undefined,
    chargedAfterKillAmount: undefined,
    // 되살리기 전의 해지 알림은 이 구독에 물을 것이 아니다.
    cancelNoticeAt: undefined,
  };
}

/**
 * 체크인 한 줄을 만든다. 체크인은 "지난 30일 동안 몇 번"이라, 한 달치 내 몫(`getMyMonthlyShareAmount`)으로
 * 나눈다 — 요금을 그대로 나누면 연간 구독의 1회 단가가 12배로, 공유 구독은 나누기 전 금액으로 나온다.
 */
export function buildCheckInLog(
  sub: Subscription,
  usageCount: number,
  options: { source?: "phone"; metric?: ValueMetric } | undefined,
  now: Date,
  id: string,
): { log: UsageLog; response: CheckInResponse } {
  const monthlyShare = getMyMonthlyShareAmount(sub);
  // 무엇을 세었는지는 구독마다 다르다(음악은 시간, 멤버십은 혜택 금액 — utils/valueMetric). 부르는
  // 쪽이 다른 지표로 물었으면(메일의 'N회' 버튼) 그 지표를 넘긴다.
  const metric = options?.metric ?? metricForSubscription(sub);
  const quantity = clampQuantity(metric, usageCount);
  // 무료 요금제로 충분했는지의 답은 묻는 구독(쓴 날로 재는, 무료 요금제가 있는 서비스)에만 쓴다.
  const freeTier = metric === "days" && asksFreeTier(sub) ? (sub.freeTierAnswer ?? null) : null;
  const { costPerUse, riskLevel, shockMessage } = evaluateMetric(
    metric,
    sub.name,
    monthlyShare,
    quantity,
    sub.currency,
    metric === "storage" ? storagePlanFit(sub, quantity) : null,
    freeTier,
  );
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const log: UsageLog = {
    id,
    subscriptionId: sub.id,
    month,
    usageCount: quantity,
    costPerUse,
    riskLevel,
    checkedAt: now.toISOString(),
    // 횟수는 적지 않는다 — 이 기능 전의 기록과 같은 모양으로 남아 예전 앱도 읽는다.
    ...(metric !== "uses" ? { metric } : {}),
    ...(options?.source ? { source: options.source } : {}),
    ...(freeTier ? { freeTier } : {}),
  };
  return { log, response: { shockMessage, riskLevel, costPerUse } };
}

/** 가장 최근 체크인이 빨강인지. 체크인이 없으면 위험으로 보지 않는다(모름). */
export function isAtRisk(sub: Subscription, usageLogs: UsageLog[]): boolean {
  const logs = usageLogs
    .filter((log) => log.subscriptionId === sub.id)
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  return logs.length > 0 && logs[0].riskLevel === "red";
}
