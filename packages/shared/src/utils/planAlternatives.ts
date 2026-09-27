import type { BillingCycle, Currency, Subscription, UsageLog } from "../types";
import {
  counterpartPlan,
  findPresetForSubscription,
  planCurrency,
  type ServicePlan,
  type ServicePreset,
} from "../constants/services";
import { getSharingCount } from "./sharing";

/**
 * 해지 말고 할 수 있는 것 — 같은 서비스의 더 싼 요금제, 연 결제로 바꾸기.
 *
 * 앱이 고를 수 있는 것은 "유지"와 "해지" 둘뿐이었다. 광고형으로 내리면 반값인데 해지만 권하면,
 * 계속 쓰고 싶은 사람은 아무것도 하지 않는다. 그래서 해지를 누르기 전에 같은 서비스의 다른
 * 요금제를 나란히 보여 준다.
 *
 * 비교는 서비스 목록에서 확인한 요금제끼리만 한다. 이 구독이 어느 요금제인지 모르면(`planId` 없음)
 * 비교하지 않는다 — 가격 확인(`referencePriceFor`)과 같은 규칙이다. 금액은 요금표 가격끼리라
 * 세금이 따로 붙는 구독이면 두 쪽에 똑같이 붙는다. 요금제마다 화질·광고·기능이 다르다는 것은
 * 앱이 적어 두지 않았으므로, 무엇이 빠지는지는 화면이 서비스에서 확인하라고만 말한다.
 *
 * 일시정지는 넣지 않는다. 일시정지가 되는 서비스와 기간을 확인해 적어 둔 목록이 없다 — 되는
 * 것처럼 권하면 해지 화면에서 없는 버튼을 찾게 된다.
 */

/** 이만큼 지난 체크인으로는 1회 단가를 다시 계산하지 않는다(행동 큐의 STALE_CHECK_IN_DAYS와 같다). */
const RECENT_USAGE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PlanPrice {
  planId: string;
  planName: string;
  /** 요금표 가격. 결제 주기가 연간이면 1년치다. */
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  /** 한 달로 나눈 요금표 가격. */
  monthlyAmount: number;
  /**
   * 최근 횟수 체크인으로 계산한 1회 단가(한 달 금액 ÷ 횟수, 나눠 내면 내 몫으로). 최근 체크인이
   * 없거나, 나눠 내는 금액이 고르지 않아 다른 요금제의 내 몫을 알 수 없으면 null.
   */
  costPerUse: number | null;
}

export interface PlanAlternative extends PlanPrice {
  /** `cheaper-plan`: 같은 결제 주기의 더 싼 요금제. `yearly`: 같은 요금제의 연 결제. */
  kind: "cheaper-plan" | "yearly";
  /** 지금 요금제보다 1년에 덜 내는 요금표 금액. 늘 0보다 크다. */
  yearlySaving: number;
}

export type PlanAlternatives =
  /** 서비스 목록에 요금제가 없는 서비스. 비교할 것이 없다. */
  | { state: "none" }
  /** 요금제가 여럿인 서비스인데 어느 요금제인지 모른다. 고르면 비교할 수 있다. */
  | { state: "plan-unknown"; planCount: number }
  | {
      state: "ok";
      current: PlanPrice;
      /** 1년에 덜 내는 순서. 없을 수 있다(이미 가장 싼 요금제). */
      alternatives: PlanAlternative[];
      /** 1회 단가에 쓴 체크인. 최근 것이 없으면 null. */
      usage: { count: number; checkedAt: string } | null;
      /** 나눠 내는 구독이면 true. 금액은 카드에 찍히는 전체 요금이다. */
      shared: boolean;
      /** 요금표 가격에 세금이 따로 붙는 구독(`taxRate`). */
      taxExcluded: boolean;
    };

function monthlyOf(plan: ServicePlan): number {
  return (plan.billingCycle ?? "monthly") === "yearly" ? plan.amount / 12 : plan.amount;
}

/** 최근 30일 안의 가장 늦은 횟수 체크인. */
function recentUsesLog(
  subscriptionId: string,
  logs: readonly UsageLog[],
  now: Date,
): UsageLog | null {
  let latest: UsageLog | null = null;
  for (const log of logs) {
    if (log.subscriptionId !== subscriptionId) continue;
    // 1회 단가로 줄 세우므로 횟수 체크인만 본다. 시간·쓴 날과 섞으면 '1회'의 뜻이 달라진다.
    if ((log.metric ?? "uses") !== "uses") continue;
    const time = Date.parse(log.checkedAt);
    if (Number.isNaN(time) || now.getTime() - time > RECENT_USAGE_DAYS * MS_PER_DAY) continue;
    if (!latest || time >= Date.parse(latest.checkedAt)) latest = log;
  }
  return latest;
}

function priceOf(
  preset: ServicePreset,
  plan: ServicePlan,
  perUseDivisor: number | null,
): PlanPrice {
  const monthlyAmount = monthlyOf(plan);
  return {
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    currency: planCurrency(preset, plan),
    billingCycle: plan.billingCycle ?? "monthly",
    monthlyAmount,
    costPerUse: perUseDivisor ? monthlyAmount / perUseDivisor : null,
  };
}

export function getPlanAlternatives(
  sub: Pick<
    Subscription,
    "id" | "name" | "amount" | "cancelUrl" | "planId" | "sharingCount" | "myShareAmount" | "taxRate"
  >,
  logs: readonly UsageLog[] = [],
  now: Date = new Date(),
): PlanAlternatives {
  const preset = findPresetForSubscription(sub);
  const plans = preset?.plans ?? [];
  if (!preset || plans.length < 2) return { state: "none" };

  const plan = plans.find((candidate) => candidate.id === sub.planId);
  if (!plan) return { state: "plan-unknown", planCount: plans.length };

  const shared = getSharingCount(sub) > 1;
  const log = recentUsesLog(sub.id, logs, now);
  // 1회 단가 = 한 달 금액(내 몫) ÷ 횟수. 고르게 나누면 어느 요금제든 내 몫은 요금 ÷ 사람 수다.
  // 따로 적은 내 몫이 있으면 다른 요금제에서 얼마를 낼지 모르므로 계산하지 않는다.
  const perUseDivisor =
    log && log.usageCount > 0 && !(shared && typeof sub.myShareAmount === "number")
      ? log.usageCount * getSharingCount(sub)
      : null;

  const current = priceOf(preset, plan, perUseDivisor);
  const currentCycle = current.billingCycle;
  const alternatives: PlanAlternative[] = [];

  // 저장 공간 요금제는 쓰는 양이 들어가야 내릴 수 있다. 그 계산은 체크인(utils/storagePlan)이 하고,
  // 여기서 싸다는 이유만으로 권하면 사진이 들어가지 않는 요금제를 권하게 된다.
  if (!plan.storageGB) {
    for (const candidate of plans) {
      if (candidate.id === plan.id) continue;
      if ((candidate.billingCycle ?? "monthly") !== currentCycle) continue;
      if (planCurrency(preset, candidate) !== current.currency) continue;
      const price = priceOf(preset, candidate, perUseDivisor);
      const yearlySaving = (current.monthlyAmount - price.monthlyAmount) * 12;
      if (yearlySaving <= 0) continue;
      alternatives.push({ ...price, kind: "cheaper-plan", yearlySaving });
    }
  }

  // 같은 요금제의 연 결제. 짝(`yearlyOf`)을 서비스 목록에 적어 둔 것만 — 할인율을 짐작하지 않는다.
  const counterpart = currentCycle === "monthly" ? counterpartPlan(preset, plan) : undefined;
  if (
    counterpart &&
    (counterpart.billingCycle ?? "monthly") === "yearly" &&
    planCurrency(preset, counterpart) === current.currency
  ) {
    const price = priceOf(preset, counterpart, perUseDivisor);
    const yearlySaving = current.amount * 12 - counterpart.amount;
    if (yearlySaving > 0) alternatives.push({ ...price, kind: "yearly", yearlySaving });
  }

  alternatives.sort((a, b) => b.yearlySaving - a.yearlySaving);

  return {
    state: "ok",
    current,
    alternatives,
    usage: log ? { count: log.usageCount, checkedAt: log.checkedAt } : null,
    shared,
    taxExcluded: typeof sub.taxRate === "number" && sub.taxRate > 0,
  };
}
