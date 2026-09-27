import type { Subscription, UsageLog } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { formatKRW, getBilledAmount, toKRW } from "./currency";
import { isInTrial } from "./date";
import {
  getMyAnnualAmountKRW,
  getMyMonthlyAmountKRW,
  isShared,
  sumMyMonthDefendedKRW,
  sumMyYearDefendedKRW,
} from "./sharing";

/**
 * 한 달·한 해의 구독 영수증.
 *
 * 앱은 카드 명세서를 갖고 있지 않다. 그래서 영수증의 줄은 "기록으로 보면 이날 결제됐을 것"이다 —
 * 구독 중이었고, 결제일이 그 기간 안에 있었고, 체험 중이 아니었던 것. 화면은 이것이 카드 명세서가
 * 아니라고 적는다. 그 밖의 것은 줄로 만들지 않고 따로 센다.
 *
 * - 결제 월을 모르는 연간 구독: 어느 달에 결제됐는지 모른다(`undated`).
 * - 등록하기 전의 결제일: 그때도 구독 중이었는지 앱은 모른다(`beforeRegistration`). 넣으면 등록할 때
 *   처음 구독한 사람에게 내지 않은 돈을 청구한다.
 * - 체험 중이던 결제일: 카드에서 나간 돈이 없다(`trial`).
 * - 아직 오지 않은 결제일: 영수증은 이미 일어난 것만 적는다. 이번 달은 '지금까지'다.
 *
 * 금액은 내 몫(나눠 내면 나눈 뒤, 세금 포함)을 사용자 환율로 원 환산한 값이다. 지출 합계
 * (`sumMyMonthlyKRW`)와 같은 기준이다.
 */

export type ReceiptPeriod =
  { kind: "month"; year: number; month: number } | { kind: "year"; year: number };

export interface ReceiptLine {
  subscriptionId: string;
  name: string;
  iconUrl?: string;
  /** 이 기간에 결제된 날들(`YYYY-MM-DD`), 이른 순. */
  chargeDates: string[];
  /** 내 몫 합계(원). */
  amountKRW: number;
  /** 카드에 찍힌 금액 합계(원). 나눠 내지 않으면 `amountKRW`와 같다. */
  billedKRW: number;
  shared: boolean;
  billingCycle: Subscription["billingCycle"];
  /** 그 기간이 지나기 전에 해지한 구독이면 해지한 날(`YYYY-MM-DD`). */
  killedOn: string | null;
  /**
   * 그 기간에 한 마지막 횟수 체크인. 없으면 null — 0회가 아니라 모른다.
   * 연 영수증에서는 그 해의 마지막 체크인이다.
   */
  usage: { count: number; costPerUseKRW: number; checkedAt: string } | null;
}

export interface Receipt {
  period: ReceiptPeriod;
  /** 기간이 이미 끝났는지. 끝나지 않았으면 모든 수치는 '오늘까지'다. */
  isComplete: boolean;
  /** 결제 금액이 큰 순서. */
  lines: ReceiptLine[];
  totalKRW: number;
  billedTotalKRW: number;
  chargeCount: number;
  /** 체크인이 있는 줄 중, 1회 단가가 가장 높은 것. 비교할 줄이 둘 이상일 때만. */
  priciestPerUse: ReceiptLine | null;
  /** 해지 덕분에 이 기간에 나가지 않은 돈(원). 결제일이 지난 것만. */
  defendedKRW: number;
  /** 결제 월·해지 시각을 몰라 지킨 돈에 넣지 못한 해지 구독 수. */
  defendedUnknownCount: number;
  /** 이 기간에 해지한 구독. */
  killed: { subscriptionId: string; name: string; killedOn: string }[];
  excluded: {
    /** 결제 월을 모르는 연간 구독 수. */
    undated: number;
    /** 등록하기 전의 결제일이 있던 구독 수. */
    beforeRegistration: number;
    /** 체험 중이던 결제일이 있던 구독 수. */
    trial: number;
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** ISO 시각을 그 기기 시간대의 날짜로. 깨졌으면 null. */
function dayOf(iso: string | undefined): Date | null {
  if (!iso) return null;
  const time = new Date(iso);
  return Number.isNaN(time.getTime()) ? null : startOfDay(time);
}

/** 그 달의 결제일. 연간 구독이 그 달에 결제되지 않으면 null. 짧은 달은 말일로 당긴다. */
function chargeDateIn(sub: Subscription, year: number, monthIndex: number): Date | null {
  if (sub.billingCycle === "yearly" && sub.billingMonth !== monthIndex + 1) return null;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(Math.max(1, sub.billingDay || 1), lastDay);
  return new Date(year, monthIndex, day);
}

function monthsOf(period: ReceiptPeriod): { year: number; monthIndex: number }[] {
  if (period.kind === "month") return [{ year: period.year, monthIndex: period.month - 1 }];
  return Array.from({ length: 12 }, (_, monthIndex) => ({ year: period.year, monthIndex }));
}

function periodEnd(period: ReceiptPeriod): Date {
  // 기간의 마지막 날 다음 날 0시.
  return period.kind === "month"
    ? new Date(period.year, period.month, 1)
    : new Date(period.year + 1, 0, 1);
}

function periodStart(period: ReceiptPeriod): Date {
  return period.kind === "month"
    ? new Date(period.year, period.month - 1, 1)
    : new Date(period.year, 0, 1);
}

function inPeriod(date: Date | null, period: ReceiptPeriod): boolean {
  if (!date) return false;
  return date >= periodStart(period) && date < periodEnd(period);
}

/** 그 기간에 한 마지막 횟수 체크인. */
function lastUsesLogIn(
  subscriptionId: string,
  logs: readonly UsageLog[],
  period: ReceiptPeriod,
): UsageLog | null {
  let latest: UsageLog | null = null;
  for (const log of logs) {
    if (log.subscriptionId !== subscriptionId) continue;
    if ((log.metric ?? "uses") !== "uses") continue;
    const at = new Date(log.checkedAt);
    if (Number.isNaN(at.getTime()) || !inPeriod(at, period)) continue;
    if (!latest || at.getTime() >= Date.parse(latest.checkedAt)) latest = log;
  }
  return latest;
}

export function buildReceipt(
  subscriptions: readonly Subscription[],
  logs: readonly UsageLog[],
  period: ReceiptPeriod,
  rate: number = DEFAULT_EXCHANGE_RATE,
  now: Date = new Date(),
): Receipt {
  const today = startOfDay(now);
  const lines: ReceiptLine[] = [];
  const excluded = { undated: 0, beforeRegistration: 0, trial: 0 };

  for (const sub of subscriptions) {
    if (sub.billingCycle === "yearly" && typeof sub.billingMonth !== "number") {
      // 해지한 연간 구독도 그 기간에 결제됐을 수 있지만, 언제인지 모른다.
      const killed = dayOf(sub.killedAt);
      if (sub.status === "active" || (killed && killed >= periodStart(period))) {
        excluded.undated += 1;
      }
      continue;
    }

    const registered = dayOf(sub.createdAt);
    const killed = sub.status === "killed" ? dayOf(sub.killedAt) : null;
    // 해지했다는데 언제인지 모르면 어느 결제가 해지 뒤였는지 모른다. 줄을 만들지 않는다.
    if (sub.status === "killed" && !killed) continue;

    const chargeDates: Date[] = [];
    let hadBeforeRegistration = false;
    let hadTrial = false;

    for (const { year, monthIndex } of monthsOf(period)) {
      const charge = chargeDateIn(sub, year, monthIndex);
      if (!charge || charge > today) continue;
      // 해지한 날의 결제일은 지킨 것으로 센다(getMyMonthDefendedAmountKRW와 같은 기준).
      if (killed && killed <= charge) continue;
      if (registered && charge < registered) {
        hadBeforeRegistration = true;
        continue;
      }
      if (isInTrial(sub, charge)) {
        hadTrial = true;
        continue;
      }
      chargeDates.push(charge);
    }

    if (hadBeforeRegistration) excluded.beforeRegistration += 1;
    if (hadTrial) excluded.trial += 1;
    if (chargeDates.length === 0) continue;

    const perCharge =
      sub.billingCycle === "yearly"
        ? getMyAnnualAmountKRW(sub, rate)
        : getMyMonthlyAmountKRW(sub, rate);
    const billedPerCharge = toKRW(getBilledAmount(sub), sub.currency, rate);
    const log = lastUsesLogIn(sub.id, logs, period);

    lines.push({
      subscriptionId: sub.id,
      name: sub.name,
      iconUrl: sub.iconUrl,
      chargeDates: chargeDates.map(dateOnly),
      amountKRW: perCharge * chargeDates.length,
      billedKRW: billedPerCharge * chargeDates.length,
      shared: isShared(sub),
      billingCycle: sub.billingCycle,
      killedOn: killed && inPeriod(killed, period) ? dateOnly(killed) : null,
      usage: log
        ? {
            count: log.usageCount,
            costPerUseKRW: toKRW(log.costPerUse, sub.currency, rate),
            checkedAt: log.checkedAt,
          }
        : null,
    });
  }

  lines.sort((a, b) => b.amountKRW - a.amountKRW || a.name.localeCompare(b.name, "ko"));

  // 해지 덕분에 나가지 않은 돈. 결제일이 이미 지난 것만 — 아직 오지 않은 결제일의 금액은 '지킨 돈'이
  // 아니라 '지킬 돈'이다. 달마다 그 달 결제일이 지난 해지 구독만 골라 방어액 계산에 넘긴다.
  const killedSubs = subscriptions.filter((sub) => sub.status === "killed");
  let defendedKRW = 0;
  for (const { year, monthIndex } of monthsOf(period)) {
    const passed = killedSubs.filter((sub) => {
      const charge = chargeDateIn(sub, year, monthIndex);
      return charge !== null && charge <= today;
    });
    defendedKRW += sumMyMonthDefendedKRW(passed, year, monthIndex + 1, rate).amount;
  }
  const defendedUnknownCount = sumMyYearDefendedKRW(killedSubs, period.year, rate).unknownCount;

  const killed = killedSubs
    .map((sub) => ({ sub, day: dayOf(sub.killedAt) }))
    .filter(({ day }) => inPeriod(day, period))
    .sort((a, b) => a.day!.getTime() - b.day!.getTime())
    .map(({ sub, day }) => ({ subscriptionId: sub.id, name: sub.name, killedOn: dateOnly(day!) }));

  const withUsage = lines.filter((line) => line.usage && line.usage.count > 0);
  const priciestPerUse =
    withUsage.length >= 2
      ? withUsage.reduce((max, line) =>
          line.usage!.costPerUseKRW > max.usage!.costPerUseKRW ? line : max,
        )
      : null;

  return {
    period,
    isComplete: periodEnd(period) <= today,
    lines,
    totalKRW: lines.reduce((total, line) => total + line.amountKRW, 0),
    billedTotalKRW: lines.reduce((total, line) => total + line.billedKRW, 0),
    chargeCount: lines.reduce((total, line) => total + line.chargeDates.length, 0),
    priciestPerUse,
    defendedKRW,
    defendedUnknownCount,
    killed,
    excluded,
  };
}

/** 영수증을 보여 줄 만한 지난달(오늘이 속한 달의 앞 달). */
export function previousMonth(now: Date = new Date()): { year: number; month: number } {
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** "2026년 9월", "2026년". */
export function formatReceiptPeriod(period: ReceiptPeriod): string {
  return period.kind === "month" ? `${period.year}년 ${period.month}월` : `${period.year}년`;
}

/** "09.10". 영수증 줄의 결제일. */
export function formatChargeDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}.${day}`;
}

/**
 * 공유·복사용 글 영수증. 화면과 같은 숫자만 적고, 카드 명세서가 아니라는 말을 끝에 붙인다 — 받은
 * 사람이 은행 기록으로 읽지 않게.
 */
export function formatReceiptText(receipt: Receipt): string {
  const title = `SubSlash 구독 영수증 · ${formatReceiptPeriod(receipt.period)}${
    receipt.isComplete ? "" : " (오늘까지)"
  }`;
  const lines = [title, "-".repeat(28)];
  if (receipt.lines.length === 0) lines.push("결제된 구독이 없어요");
  for (const line of receipt.lines) {
    const count = line.chargeDates.length > 1 ? ` ×${line.chargeDates.length}` : "";
    lines.push(`${line.name}${count}  ${formatKRW(line.amountKRW)}`);
  }
  lines.push("-".repeat(28));
  lines.push(`합계(내 몫)  ${formatKRW(receipt.totalKRW)}`);
  if (receipt.defendedKRW > 0) lines.push(`해지로 지킨 돈  ${formatKRW(receipt.defendedKRW)}`);
  lines.push("", "등록한 구독 기록으로 계산했어요. 카드 명세서와 다를 수 있어요.");
  return lines.join("\n");
}
