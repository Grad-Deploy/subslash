import { Currency, Subscription, UsageLog } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { formatAmount, formatKRW } from "./currency";
import { getDaysUntilBillingFor } from "./date";
import { getMyAnnualAmountKRW, getMyMonthlyAmountKRW } from "./sharing";
import { getPriceCheckCandidates } from "./priceCheck";

/**
 * 대시보드의 행동 큐.
 *
 * 목록이 아니라 "지금 결정할 것"만 모은다. 구독 전체를 다시 늘어놓는 화면은
 * 이미 /subs에 있고, 얼마나 지켰는지는 /savings에 있다. 여기서 답하는 질문은
 * 하나다 — 오늘 내가 무엇을 해야 하나.
 *
 * 큐에 올라오는 근거는 전부 앱이 실제로 가진 데이터다. 결제일, 체크인 기록,
 * 등록된 금액. 없는 것을 짐작해서 "이건 해지하는 게 좋겠다"고 말하지 않는다.
 */

/** 며칠 앞이면 '결제 임박'으로 볼지. */
export const BILLING_SOON_DAYS = 7;
/** 체크인이 이만큼 지나면 판단 근거가 낡은 것으로 본다. */
export const STALE_CHECK_IN_DAYS = 30;

export type ActionKind =
  /** 결제가 코앞인데 마지막 체크인이 '위험'이었다. 가장 급하다. */
  | "billing-soon-risky"
  /** 결제가 코앞이다. */
  | "billing-soon"
  /** 결제일과 무관하게 1회 단가가 위험 수준이다. */
  | "risky"
  /** 한 번도 체크인하지 않아 끊을지 판단할 근거가 없다. */
  | "never-checked-in"
  /** 마지막 체크인이 오래됐다. */
  | "stale-check-in"
  /** 등록된 금액이 지금도 맞는지 확인이 필요하다. */
  | "price-check"
  /** 연간 구독인데 결제 월을 몰라 D-day도 방어액도 계산할 수 없다. */
  | "missing-billing-month";

/** 그 줄에서 사용자가 할 수 있는 일. */
export type ActionVerb = "cancel-guide" | "check-in" | "confirm-price" | "set-billing-month";

export interface ActionItem {
  subscriptionId: string;
  name: string;
  iconEmoji: string;
  kind: ActionKind;
  /** 왜 이 줄이 떴는지, 한 문장. */
  reason: string;
  /** 이 줄의 주 버튼이 할 일. */
  verb: ActionVerb;
  /** 다음 결제까지 남은 일수. 계산할 수 없으면 null. */
  daysUntilBilling: number | null;
  /**
   * 이번 결제에서 빠져나갈 내 몫(KRW). 결제일을 모르면 null이다.
   * "끊으면 이만큼 지킨다"는 말은 결제가 실제로 예정돼 있을 때만 참이다.
   */
  amountAtStake: number | null;
  /**
   * 구독 자체의 통화. `presetAmount`는 이 통화로 적혀 있다 — 원화로 환산된
   * `amountAtStake`와 달리, 달러 구독의 프리셋 요금을 ₩로 찍으면 안 된다.
   */
  currency: Currency;
  /**
   * 'price-check' 항목에서, 앱에 실린 프리셋 기준 요금(`currency` 통화).
   *
   * 비교할 프리셋이 없거나 통화·주기가 달라 비교할 수 없으면 null이고,
   * 이때 화면은 '최신 요금으로 갱신' 버튼을 내밀지 않는다 — 갱신할 기준값을
   * 모르면서 있는 척하면 안 된다.
   */
  presetAmount: number | null;
  /** 작을수록 급하다. */
  priority: number;
}

const PRIORITY: Record<ActionKind, number> = {
  "billing-soon-risky": 1,
  "billing-soon": 2,
  risky: 3,
  "never-checked-in": 4,
  "stale-check-in": 5,
  "price-check": 6,
  "missing-billing-month": 7,
};

const VERB: Record<ActionKind, ActionVerb> = {
  "billing-soon-risky": "cancel-guide",
  "billing-soon": "check-in",
  risky: "cancel-guide",
  "never-checked-in": "check-in",
  "stale-check-in": "check-in",
  "price-check": "confirm-price",
  "missing-billing-month": "set-billing-month",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 구독별 가장 최근 체크인. */
function latestLogBySubscription(logs: UsageLog[]): Map<string, UsageLog> {
  const latest = new Map<string, UsageLog>();
  for (const log of logs) {
    const current = latest.get(log.subscriptionId);
    if (!current || new Date(log.checkedAt) > new Date(current.checkedAt)) {
      latest.set(log.subscriptionId, log);
    }
  }
  return latest;
}

function daysSince(iso: string, now: Date): number | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY);
}

/** 이번 결제에서 빠져나갈 내 몫. 연간 플랜은 한 번에 연 결제액이 나간다. */
function chargeAtStakeKRW(sub: Subscription, rate: number): number {
  return sub.billingCycle === "yearly"
    ? getMyAnnualAmountKRW(sub, rate)
    : getMyMonthlyAmountKRW(sub, rate);
}

/**
 * 활성 구독과 체크인 기록에서 오늘의 행동 큐를 만든다.
 *
 * 한 구독은 한 줄만 만든다. 같은 구독이 여러 이유로 걸리면 가장 급한 이유
 * 하나만 남긴다 — 큐가 길어지면 "지금 할 것"이라는 성격 자체가 사라진다.
 */
export function getActionQueue(
  subscriptions: Subscription[],
  usageLogs: UsageLog[],
  now: Date = new Date(),
  rate: number = DEFAULT_EXCHANGE_RATE,
): ActionItem[] {
  const active = subscriptions.filter((sub) => sub.status === "active");
  const latest = latestLogBySubscription(usageLogs);

  // 요금 확인 대상은 이미 만들어둔 판정기를 그대로 쓴다.
  const priceChecks = new Map(
    getPriceCheckCandidates(active, now).map((candidate) => [
      candidate.subscriptionId,
      candidate.presetAmount,
    ]),
  );

  const items: ActionItem[] = [];

  for (const sub of active) {
    const days = getDaysUntilBillingFor(sub, now);
    const log = latest.get(sub.id);
    const isRisky = log?.riskLevel === "red";
    const billingSoon = days !== null && days >= 0 && days <= BILLING_SOON_DAYS;
    const stake = days === null ? null : chargeAtStakeKRW(sub, rate);
    // 체크인의 1회당 단가는 구독 자체의 통화로 기록된다. 달러 구독에 ₩를
    // 붙이면 $10이 "₩10"으로 읽힌다.
    const perUse = log ? formatAmount(log.costPerUse, sub.currency) : "";

    let kind: ActionKind;
    let reason: string;

    if (billingSoon && isRisky) {
      kind = "billing-soon-risky";
      reason =
        `D-${days} · 마지막 체크인에서 ${log!.usageCount}회 사용 (1회당 ${perUse})` +
        (stake !== null ? `. 결제 전에 끊으면 ${formatKRW(stake)}을 지킵니다.` : ".");
    } else if (billingSoon) {
      kind = "billing-soon";
      reason = log
        ? `D-${days} · ${stake !== null ? `${formatKRW(stake)}이 곧 빠져나갑니다.` : "곧 결제됩니다."}`
        : `D-${days} · 아직 체크인한 적이 없어, 끊을지 판단할 근거가 없습니다.`;
    } else if (isRisky) {
      kind = "risky";
      reason = `마지막 체크인에서 ${log!.usageCount}회 사용 (1회당 ${perUse}). 돈값을 못 하고 있습니다.`;
    } else if (sub.billingCycle === "yearly" && typeof sub.billingMonth !== "number") {
      kind = "missing-billing-month";
      reason = "연간 결제인데 결제 월이 없어 D-day도, 지킨 금액도 계산할 수 없습니다.";
    } else if (!log) {
      kind = "never-checked-in";
      reason = "아직 체크인한 적이 없습니다. 얼마나 썼는지 모르면 끊을지 판단할 수 없습니다.";
    } else {
      const since = daysSince(log.checkedAt, now);
      if (since !== null && since >= STALE_CHECK_IN_DAYS) {
        kind = "stale-check-in";
        reason = `마지막 체크인이 ${since}일 전입니다. 그 사이 사용 습관이 달라졌을 수 있습니다.`;
      } else if (priceChecks.has(sub.id)) {
        kind = "price-check";
        reason = `등록된 금액이 ${formatAmount(sub.amount, sub.currency)}입니다. 지금도 맞는지 확인해주세요.`;
      } else {
        // 급한 일이 없는 구독은 큐에 올리지 않는다.
        continue;
      }
    }

    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconEmoji: sub.iconUrl || "📦",
      kind,
      reason,
      verb: VERB[kind],
      daysUntilBilling: days,
      amountAtStake: stake,
      currency: sub.currency,
      presetAmount: kind === "price-check" ? (priceChecks.get(sub.id) ?? null) : null,
      priority: PRIORITY[kind],
    });
  }

  return items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // 같은 급함이면 결제가 먼저 오는 쪽, 날짜를 모르는 쪽은 뒤로.
    const left = a.daysUntilBilling ?? Number.POSITIVE_INFINITY;
    const right = b.daysUntilBilling ?? Number.POSITIVE_INFINITY;
    if (left !== right) return left - right;
    return (b.amountAtStake ?? 0) - (a.amountAtStake ?? 0);
  });
}

/**
 * 큐가 비었을 때 보여줄 다음 결제.
 *
 * "할 일 없음"만 띄우면 앱이 멈춘 것처럼 보인다. 결제일을 아는 구독 중
 * 가장 가까운 것을 알려주되, 하나도 모르면 `null`을 돌려준다.
 */
export function getNextBillingHint(
  subscriptions: Subscription[],
  now: Date = new Date(),
): { name: string; daysUntilBilling: number } | null {
  let best: { name: string; daysUntilBilling: number } | null = null;

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;
    const days = getDaysUntilBillingFor(sub, now);
    if (days === null || days < 0) continue;
    if (!best || days < best.daysUntilBilling) {
      best = { name: sub.name, daysUntilBilling: days };
    }
  }

  return best;
}
