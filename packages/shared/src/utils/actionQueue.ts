import { Currency, Subscription, UsageLog } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { getBilledAmount } from "./currency";
import { getDaysUntilBillingFor, getDaysUntilTrialEnd } from "./date";
import { getMyAnnualAmountKRW, getMyMonthlyAmountKRW } from "./sharing";
import { getPriceCheckCandidates } from "./priceCheck";
import { getKillCheckStatus } from "./killCheck";
import { getLowUsageBillingFigures, type MetaphorKey } from "./metaphor";
import { isResubscribeReminderDue } from "./killRecord";

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
/**
 * 이 안에 체크인했으면 결제가 다가와도 체크인을 다시 묻지 않는다. '곧 결제'의 할 일은 체크인이라, 방금
 * 체크인한 구독에도 결제 7일 전부터 '체크인' 버튼이 다시 떠서 체크인이 안 된 것처럼 보였다.
 */
export const RECENT_CHECK_IN_DAYS = 14;

/** 무료 체험 종료를 알리기 시작하는 날. 해지할 시간을 남겨 둔다. */
export const TRIAL_ENDING_DAYS = 7;

export type ActionKind =
  /** 해지했는데 그 뒤에 결제 메일이 왔다. 지금 돈이 새고 있다는 유일한 '증거'다. */
  | "charged-after-kill"
  /** 무료 체험이 곧 끝난다. 두면 유료로 넘어간다. */
  | "trial-ending"
  /** 구독 중인데 그 서비스의 마지막 메일이 해지·취소 알림이었다. 해지했는지 묻는다. */
  | "cancel-notice"
  /** 결제가 코앞인데 마지막 체크인이 '위험'이었다. */
  | "billing-soon-risky"
  /** 결제가 코앞인데 이번 달 사용량이 적다 (체크인 기록 기반). */
  | "low-usage-billing-soon"
  /** 결제가 코앞이다. */
  | "billing-soon"
  /** 해지 뒤 첫 결제일이 지났다. 결제가 정말 멈췄는지 물어야 한다. */
  | "verify-kill"
  /** 결제 메일에 찍힌 금액이 등록된 청구액과 달랐다. 추측이 아니라 관측이다. */
  | "amount-changed"
  /** 결제일과 무관하게 1회 단가가 위험 수준이다. */
  | "risky"
  /** 한 번도 체크인하지 않아 끊을지 판단할 근거가 없다. */
  | "never-checked-in"
  /** 마지막 체크인이 오래됐다. */
  | "stale-check-in"
  /** 등록된 금액이 지금도 맞는지 확인이 필요하다. */
  | "price-check"
  /** 연간 구독인데 결제 월을 몰라 D-day도 방어액도 계산할 수 없다. */
  | "missing-billing-month"
  /** 해지할 때 사용자가 고른 '다시 살펴볼 날'이 왔다. 앱이 정한 날이 아니다. */
  | "resubscribe-reminder";

/** 그 줄에서 사용자가 할 수 있는 일. */
export type ActionVerb =
  | "cancel-guide"
  | "check-in"
  | "confirm-price"
  | "set-billing-month"
  | "verify-kill"
  | "confirm-cancel"
  | "review-resubscribe";

/** 마지막 체크인에서 문장에 쓰는 값. 지표마다 말이 달라 화면이 `describeCheckIn`으로 문장을 만든다. */
export type CheckInFigures = Pick<UsageLog, "metric" | "usageCount" | "costPerUse">;

/**
 * 그 줄이 왜 떴는지. 문장이 아니라 문장에 들어갈 값이다 — 이 모듈은 서버도 쓰므로 한 언어의 문장을 만들지 않고,
 * 화면이 언어에 맞게 문장으로 바꾼다. 금액은 원화로 바꾼 값(`stakeKRW`)과 구독 통화 값을 구분해 둔다.
 */
export type ActionReason =
  | { type: "charged-after-kill"; chargedAt: string; amount: number | null; currency: Currency }
  | { type: "trial-ending"; daysLeft: number; endsAt: string; stakeKRW: number }
  | { type: "cancel-notice"; noticeAt: string }
  | {
      type: "billing-soon-risky";
      days: number;
      checkIn: CheckInFigures;
      currency: Currency;
      stakeKRW: number | null;
    }
  | {
      type: "low-usage-billing-soon";
      days: number;
      usageCount: number;
      amount: number;
      currency: Currency;
      item: MetaphorKey;
      /** 소비재 몇 개 값인지. */
      count: number;
    }
  | {
      type: "billing-soon";
      days: number;
      stakeKRW: number | null;
      /** 마지막 체크인이 며칠 전인지. 체크인한 적이 없으면 null. */
      sinceCheckIn: number | null;
      hasCheckIn: boolean;
    }
  | {
      type: "verify-kill";
      billingDate: Date;
      sameYear: boolean;
      amount: number;
      currency: Currency;
    }
  | {
      type: "amount-changed";
      observedAt: string;
      observed: number;
      billed: number;
      currency: Currency;
    }
  | { type: "risky"; checkIn: CheckInFigures; currency: Currency }
  | { type: "never-checked-in" }
  | { type: "stale-check-in"; daysAgo: number }
  | { type: "price-check"; amount: number; currency: Currency; taxExcluded: boolean }
  | { type: "missing-billing-month" }
  | { type: "resubscribe-reminder"; remindOn: string };

export interface ActionItem {
  subscriptionId: string;
  name: string;
  /** 사용자가 직접 넣은 아이콘(`Subscription.iconUrl`). 없으면 로고·이니셜로 그린다. */
  iconEmoji?: string;
  /** 직접 등록한 구독의 아이콘 타일 색(`Subscription.iconColor`). */
  iconColor?: string;
  kind: ActionKind;
  /** 왜 이 줄이 떴는지. 문장은 화면이 만든다. */
  reason: ActionReason;
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

// 해지 확인은 결제 임박 다음이다. 해지가 안 됐다면 돈이 계속 나가고 있지만,
// 다음 결제까지는 보통 한 달 가까이 남아 있다.
const PRIORITY: Record<ActionKind, number> = {
  // 나머지는 모두 "아까울 수 있다"이고 이것만 "이미 잘못됐다"이다. 그래서 1보다 앞이다.
  "charged-after-kill": 0,
  // 첫 결제가 시작되는 순간이고, 가장 쉽게 막을 수 있는 지출이다.
  "trial-ending": 1,
  // 해지했다면 지출·결제 알림이 모두 틀린 채로 남는다. 결제 임박보다 앞이다 — 해지했으면 체크인할 일도 없다.
  "cancel-notice": 1,
  "billing-soon-risky": 1,
  "low-usage-billing-soon": 1,
  "billing-soon": 2,
  "verify-kill": 3,
  // 관측은 추측보다 앞이다. 'price-check'는 "오래됐으니 확인해 달라"일 뿐이다.
  "amount-changed": 4,
  risky: 5,
  "never-checked-in": 6,
  "stale-check-in": 7,
  "price-check": 8,
  "missing-billing-month": 9,
  // 사용자가 스스로 정한 알림이라 급하지 않다. 돈이 나가는 일이 아니다.
  "resubscribe-reminder": 10,
};

const VERB: Record<ActionKind, ActionVerb> = {
  // 물어볼 것이 아니라 다시 해지하러 가야 한다.
  "charged-after-kill": "cancel-guide",
  "trial-ending": "cancel-guide",
  "cancel-notice": "confirm-cancel",
  "billing-soon-risky": "cancel-guide",
  "low-usage-billing-soon": "cancel-guide",
  "billing-soon": "check-in",
  "verify-kill": "verify-kill",
  "amount-changed": "confirm-price",
  risky: "cancel-guide",
  "never-checked-in": "check-in",
  "stale-check-in": "check-in",
  "price-check": "confirm-price",
  "missing-billing-month": "set-billing-month",
  "resubscribe-reminder": "review-resubscribe",
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
 * 활성 구독과 체크인 기록에서 오늘의 행동 큐를 만든다. 해지한 구독은 해지 뒤
 * 첫 결제가 정말 멈췄는지 물을 때만 올라온다.
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
    // 마지막 메일이 해지·취소 알림이었다. 해지했다면 이 구독의 다른 줄(결제 임박·체크인)은 모두 틀린
    // 말이 되므로 이것만 묻는다. 무료 체험을 끊었다는 메일이 가장 흔해서 체험 확인보다 먼저 본다.
    if (sub.cancelNoticeAt) {
      items.push({
        subscriptionId: sub.id,
        name: sub.name,
        iconEmoji: sub.iconUrl,
        iconColor: sub.iconColor,
        kind: "cancel-notice",
        // 제목의 낱말로 가린 알림이라 해지했다고 말하지 않는다. 사용자가 안다.
        reason: { type: "cancel-notice", noticeAt: sub.cancelNoticeAt },
        verb: VERB["cancel-notice"],
        daysUntilBilling: null,
        amountAtStake: null,
        currency: sub.currency,
        presetAmount: null,
        priority: PRIORITY["cancel-notice"],
      });
      continue;
    }

    // 체험 중에는 카드에서 나가는 돈이 없다. 결제일을 근거로 "곧 빠져나갑니다"라고 하면 거짓이
    // 되므로, 체험이 끝나간다는 것 하나만 말하고 다른 줄은 만들지 않는다.
    const trialDays = getDaysUntilTrialEnd(sub, now);
    if (trialDays !== null) {
      if (trialDays > TRIAL_ENDING_DAYS) continue;
      const stake = chargeAtStakeKRW(sub, rate);
      items.push({
        subscriptionId: sub.id,
        name: sub.name,
        iconEmoji: sub.iconUrl,
        iconColor: sub.iconColor,
        kind: "trial-ending",
        reason: {
          type: "trial-ending",
          daysLeft: trialDays,
          endsAt: sub.trialEndsAt ?? "",
          stakeKRW: stake,
        },
        verb: VERB["trial-ending"],
        daysUntilBilling: trialDays,
        amountAtStake: stake,
        currency: sub.currency,
        presetAmount: null,
        priority: PRIORITY["trial-ending"],
      });
      continue;
    }

    const days = getDaysUntilBillingFor(sub, now);
    const log = latest.get(sub.id);
    const isRisky = log?.riskLevel === "red";
    const billingSoon = days !== null && days >= 0 && days <= BILLING_SOON_DAYS;
    const stake = days === null ? null : chargeAtStakeKRW(sub, rate);
    // 체크인의 1회당 단가는 구독 자체의 통화로 기록된다. 달러 구독에 ₩를
    // 붙이면 $10이 "₩10"으로 읽힌다.
    // 마지막 체크인. 지표마다 말이 다르다('3회 이용 · 1회당 ₩5,000', '30일 중 2일 사용 · 하루당 …').
    const checkIn: CheckInFigures | null = log
      ? { metric: log.metric, usageCount: log.usageCount, costPerUse: log.costPerUse }
      : null;
    const sinceCheckIn = log ? daysSince(log.checkedAt, now) : null;
    const checkedInRecently = sinceCheckIn !== null && sinceCheckIn < RECENT_CHECK_IN_DAYS;

    let kind: ActionKind;
    let reason: ActionReason;

    // 결제 메일에 찍힌 금액이 등록된 청구액과 달랐다. 결제가 코앞인 것 다음으로 급하다 —
    // 돈의 크기가 달라졌다는 사실이라, "오래됐으니 확인해 달라"보다 앞이다.
    const observed =
      typeof sub.observedAmount === "number" && sub.observedAmountAt ? sub.observedAmount : null;

    if (billingSoon && isRisky) {
      kind = "billing-soon-risky";
      reason = {
        type: "billing-soon-risky",
        days: days!,
        checkIn: checkIn!,
        currency: sub.currency,
        stakeKRW: stake,
      };
    } else if (
      billingSoon &&
      days !== null &&
      days <= 3 &&
      log &&
      // 비유 문구가 '이번 달 N회'로 말하므로 횟수 체크인에만 쓴다.
      (log.metric ?? "uses") === "uses" &&
      log.usageCount <= 2 &&
      !isRisky
    ) {
      // 결제 D-3 이내 + 최근 체크인 사용량 2회 이하: 저사용 경고 (메타포 포함)
      kind = "low-usage-billing-soon";
      reason = {
        type: "low-usage-billing-soon",
        days,
        usageCount: log.usageCount,
        ...getLowUsageBillingFigures(sub, rate),
      };
    } else if (billingSoon && !checkedInRecently) {
      // '곧 결제'의 할 일은 체크인이다. 최근에 체크인했으면 다시 묻지 않고, 아래의 다른 이유(금액이
      // 달라짐, 요금 확인 등)가 있으면 그쪽을 보인다.
      kind = "billing-soon";
      reason = {
        type: "billing-soon",
        days: days!,
        stakeKRW: stake,
        sinceCheckIn,
        hasCheckIn: log !== undefined,
      };
    } else if (observed !== null) {
      kind = "amount-changed";
      // 요금표를 조회하지 않으므로 "올랐다"고 말하지 않는다. 두 숫자를 나란히 놓을 뿐이다.
      reason = {
        type: "amount-changed",
        observedAt: sub.observedAmountAt!,
        observed,
        billed: getBilledAmount(sub),
        currency: sub.currency,
      };
    } else if (isRisky) {
      kind = "risky";
      reason = { type: "risky", checkIn: checkIn!, currency: sub.currency };
    } else if (sub.billingCycle === "yearly" && typeof sub.billingMonth !== "number") {
      kind = "missing-billing-month";
      reason = { type: "missing-billing-month" };
    } else if (!log) {
      kind = "never-checked-in";
      reason = { type: "never-checked-in" };
    } else {
      if (sinceCheckIn !== null && sinceCheckIn >= STALE_CHECK_IN_DAYS) {
        kind = "stale-check-in";
        reason = { type: "stale-check-in", daysAgo: sinceCheckIn };
      } else if (priceChecks.has(sub.id)) {
        kind = "price-check";
        // 가격 확인은 요금표 가격끼리 비교한다. 세금이 따로 붙는 구독이면 그렇다고 적는다.
        reason = {
          type: "price-check",
          amount: sub.amount,
          currency: sub.currency,
          taxExcluded: Boolean(sub.taxRate),
        };
      } else {
        // 급한 일이 없는 구독은 큐에 올리지 않는다.
        continue;
      }
    }

    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconEmoji: sub.iconUrl,
      iconColor: sub.iconColor,
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

  // 해지한 구독인데 그 뒤에 결제 메일이 왔다. 묻는 것이 아니라 알리는 것이다 — 증거가 있다.
  for (const sub of subscriptions) {
    if (sub.status !== "killed" || !sub.chargedAfterKillAt) continue;

    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconEmoji: sub.iconUrl,
      iconColor: sub.iconColor,
      kind: "charged-after-kill",
      reason: {
        type: "charged-after-kill",
        chargedAt: sub.chargedAfterKillAt,
        amount: typeof sub.chargedAfterKillAmount === "number" ? sub.chargedAfterKillAmount : null,
        currency: sub.currency,
      },
      verb: VERB["charged-after-kill"],
      daysUntilBilling: null,
      amountAtStake: null,
      currency: sub.currency,
      presetAmount: null,
      priority: PRIORITY["charged-after-kill"],
    });
  }

  // 해지한 구독에게는 한 가지만 묻는다 — 해지 뒤 첫 결제가 정말 멈췄는지.
  // 카드에 찍히는 것은 전체 금액이므로 내 몫이 아니라 청구액(세금 포함)을 보여준다.
  for (const sub of subscriptions) {
    // 결제 메일이라는 증거가 있으면 그 줄이 이미 올라갔다. 같은 구독을 두 번 묻지 않는다.
    if (sub.chargedAfterKillAt) continue;
    const check = getKillCheckStatus(sub, now);
    if (!check || check.state !== "due") continue;

    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconEmoji: sub.iconUrl,
      iconColor: sub.iconColor,
      kind: "verify-kill",
      reason: {
        type: "verify-kill",
        billingDate: check.billingDate,
        sameYear: check.billingDate.getFullYear() === now.getFullYear(),
        amount: getBilledAmount(sub),
        currency: sub.currency,
      },
      verb: "verify-kill",
      daysUntilBilling: null,
      amountAtStake: null,
      currency: sub.currency,
      presetAmount: null,
      priority: PRIORITY["verify-kill"],
    });
  }

  // 해지할 때 '이날 다시 알려 줘'라고 적어 둔 구독. 해지 확인·해지 후 결제가 먼저라, 그 줄이 이미
  // 있으면 올리지 않는다(한 구독은 한 줄).
  const listed = new Set(items.map((item) => item.subscriptionId));
  for (const sub of subscriptions) {
    if (listed.has(sub.id) || !isResubscribeReminderDue(sub, now)) continue;
    items.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconEmoji: sub.iconUrl,
      iconColor: sub.iconColor,
      kind: "resubscribe-reminder",
      reason: { type: "resubscribe-reminder", remindOn: sub.resubscribeRemindOn ?? "" },
      verb: VERB["resubscribe-reminder"],
      daysUntilBilling: null,
      amountAtStake: null,
      currency: sub.currency,
      presetAmount: null,
      priority: PRIORITY["resubscribe-reminder"],
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
