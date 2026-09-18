import { Currency, Subscription, UsageLog } from "../types";
import { calculateCostPerUse, getRiskLevel } from "./cost-per-use";
import { formatAmount, formatKRW, toKRW } from "./currency";
import { getMyMonthlyShareAmount, getMyMonthlyAmountKRW } from "./sharing";

// ─────────────────────────────────────────────────────────
// 1. 실체감 환산 메타포
// ─────────────────────────────────────────────────────────

export interface UsageMetaphor {
  emoji: string;
  /** 짧은 비교 문구, 예: "커피 3.4잔" */
  comparison: string;
  /** 한 문장 메시지 */
  message: string;
  tone: "danger" | "warning" | "safe";
}

/** 일상 소비재 기준표 — 가장 가까운 것 하나를 고른다. */
const METAPHOR_ITEMS = [
  { emoji: "☕", label: "커피", unit: "잔", price: 5000 },
  { emoji: "🍿", label: "영화관 티켓", unit: "장", price: 15000 },
  { emoji: "🍗", label: "치킨", unit: "마리", price: 20000 },
  { emoji: "🛵", label: "배달팁", unit: "회", price: 3000 },
] as const;

/**
 * 1회당 단가나 총 금액을 일상 소비재로 환산한다.
 *
 * OTT를 1회 써서 ₩17,000이면 "영화관 티켓 1장 가격"이 되고,
 * 8회 써서 ₩2,125면 "커피 반 잔도 안 되는 가격"이 된다.
 */
export function getUsageMetaphor(
  /** 한 달 내 몫 금액(구독 통화). */
  amount: number,
  currency: Currency,
  usageCount: number,
  serviceName: string,
  /**
   * USD를 원으로 바꿀 환율. 기본값을 두지 않는다 — 화면이 넘기는 것을 잊으면 '내 환율을 쓴다'고
   * 적힌 화면 옆에 1,350으로 계산한 비유가 나오고, 타입이 그것을 잡아 주지 못한다.
   */
  rate: number,
): UsageMetaphor {
  // 소비재 가격이 원 기준이라 원으로 맞춰 비교한다.
  const amountKRW = toKRW(amount, currency, rate);
  const costPerUse = usageCount === 0 ? amountKRW : amountKRW / usageCount;
  const risk = getRiskLevel(calculateCostPerUse(amount, usageCount), amount, usageCount);
  const tone: UsageMetaphor["tone"] =
    risk === "red" ? "danger" : risk === "yellow" ? "warning" : "safe";

  // 가장 비슷한 소비재를 찾는다.
  const sorted = [...METAPHOR_ITEMS].sort(
    (a, b) => Math.abs(a.price - costPerUse) - Math.abs(b.price - costPerUse),
  );
  const best = sorted[0];
  const count = costPerUse / best.price;

  if (usageCount === 0) {
    const totalItem = [...METAPHOR_ITEMS].sort(
      (a, b) => Math.abs(a.price - amountKRW) - Math.abs(b.price - amountKRW),
    )[0];
    const totalCount = amountKRW / totalItem.price;
    return {
      emoji: "⏸️",
      comparison: `${totalItem.label} ${formatCount(totalCount)}${totalItem.unit} 세이브 기회`,
      message: `이번 달 ${serviceName} 이용이 없었어요. 잠시 구독을 쉬어가면 매달 ${totalItem.label} ${formatCount(totalCount)}${totalItem.unit} 값(${formatKRW(amountKRW)})을 아낄 수 있어요.`,
      tone: "danger",
    };
  }

  if (tone === "danger") {
    // OTT 계열이면 영화관 메타포가 더 직관적
    const movieItem = METAPHOR_ITEMS.find((i) => i.label === "영화관 티켓")!;
    const movieCount = costPerUse / movieItem.price;
    if (movieCount >= 0.8) {
      return {
        emoji: "🎬",
        comparison: `영화관 티켓 ${formatCount(movieCount)}${movieItem.unit} 세이브 기회`,
        message: `이번 달 1회 이용에 그쳤다면, 잠시 일시정지하고 영화관 티켓 1장 값(${formatAmount(calculateCostPerUse(amount, usageCount), currency)})을 세이브해보는 건 어떨까요?`,
        tone: "danger",
      };
    }
    return {
      emoji: "💡",
      comparison: `${best.label} ${formatCount(count)}${best.unit} 세이브 기회`,
      message: `이번 달 1회 이용했어요. 지금 잠시 쉬어가면 매달 ${best.label} ${formatCount(count)}${best.unit} 값(${formatAmount(calculateCostPerUse(amount, usageCount), currency)})을 아낄 수 있어요.`,
      tone: "danger",
    };
  }

  if (tone === "warning") {
    return {
      emoji: "🏃",
      comparison: `${best.label} ${formatCount(count)}${best.unit} 수준`,
      message: `1회당 ${formatAmount(calculateCostPerUse(amount, usageCount), currency)} — 조금만 더 자주 쓰면 본전 달성! 알차게 즐겨보세요.`,
      tone: "warning",
    };
  }

  // safe
  const coffeeItem = METAPHOR_ITEMS.find((i) => i.label === "커피")!;
  const coffeeRatio = costPerUse / coffeeItem.price;
  return {
    emoji: "🎉",
    comparison:
      coffeeRatio < 1
        ? `커피 한 잔보다 알뜰하게`
        : `${best.label} ${formatCount(count)}${best.unit} 가치`,
    message:
      coffeeRatio < 1
        ? `1회당 ${formatAmount(calculateCostPerUse(amount, usageCount), currency)} — 커피 한 잔보다 알뜰하게 즐겼어요! 본전 달성 완료 🎉`
        : `1회당 ${formatAmount(calculateCostPerUse(amount, usageCount), currency)} — 낸 돈 이상으로 알차게 활용하고 있어요! 🎉`,
    tone: "safe",
  };
}

function formatCount(n: number): string {
  if (n >= 10) return Math.floor(n).toString();
  if (n >= 1) return n.toFixed(1).replace(/\.0$/, "");
  if (n >= 0.1) return n.toFixed(1);
  return "0.1 미만";
}

// ─────────────────────────────────────────────────────────
// 2. 가성비 게이지 — 본전 도달 정보
// ─────────────────────────────────────────────────────────

export interface BreakEvenInfo {
  /** 본전을 뽑으려면 필요한 이용 횟수. */
  breakEvenUsage: number;
  currentUsage: number;
  /** 0 ~ 100+. 100 이상이면 본전 이상. */
  progressPercent: number;
  level: "danger" | "warning" | "safe";
  /** 예: "본전까지 앞으로 3회 더 이용 필요" */
  remainingMessage: string;
}

/**
 * 본전 도달 기준을 계산한다.
 *
 * 기본 breakEvenTarget은 8회(기존 getRiskLevel의 green 기준).
 * 8회 이상이면 1회당 단가가 금액의 12.5% 이하 — "돈값을 한다"고 본다.
 */
export function getBreakEvenInfo(
  _amount: number,
  usageCount: number,
  breakEvenTarget: number = 8,
): BreakEvenInfo {
  const target = Math.max(1, breakEvenTarget);
  const progress = target > 0 ? (usageCount / target) * 100 : 0;
  const remaining = Math.max(0, target - usageCount);

  let level: BreakEvenInfo["level"];
  if (progress <= 40) level = "danger";
  else if (progress <= 80) level = "warning";
  else level = "safe";

  let remainingMessage: string;
  if (usageCount === 0) {
    remainingMessage =
      "이번 달 이용이 아직 없어요. 더 자주 쓰거나, 잠시 쉬어가며 지출을 아낄 수 있어요.";
  } else if (remaining > 0) {
    remainingMessage = `본전까지 앞으로 ${remaining}회 더 이용하면 달성!`;
  } else {
    remainingMessage = "본전 달성 완료! 알뜰하게 활용 중이에요.";
  }

  return {
    breakEvenUsage: target,
    currentUsage: usageCount,
    progressPercent: Math.round(progress),
    level,
    remainingMessage,
  };
}

// ─────────────────────────────────────────────────────────
// 3. 월간 손익 리포트
// ─────────────────────────────────────────────────────────

export interface ValueReportItem {
  sub: Subscription;
  log: UsageLog | null;
  monthlyAmountKRW: number;
  status: "worth-it" | "wasted" | "unknown";
  costPerUse: number | null;
  reason: string;
}

export interface MonthlyValueSummary {
  totalSpendKRW: number;
  worthItKRW: number;
  wastedKRW: number;
  unknownKRW: number;
  worthItItems: ValueReportItem[];
  wastedItems: ValueReportItem[];
  unknownItems: ValueReportItem[];
  /** 절약 기회의 일상 소비재 환산 문구. */
  wasteSuggestion: string | null;
}

/**
 * 활성 구독 + 최근 체크인으로 "뽕 뽑은 구독"과 "잠시 쉬어가기 좋은 구독"을 분류한다.
 *
 * 체크인 기록이 없는 구독은 "판단 불가"로 분류한다 — 근거 없이 쉬어가기 대상으로
 * 추정하면 사용자 신뢰를 잃는다.
 */
export function getMonthlyValueSummary(
  subscriptions: Subscription[],
  usageLogs: UsageLog[],
  /** 부르는 쪽이 반드시 넘긴다. 기본값을 두면 화면이 잊었을 때 타입이 잡아 주지 못한다. */
  rate: number,
): MonthlyValueSummary {
  const active = subscriptions.filter((s) => s.status === "active");

  // 구독별 최신 체크인
  const latestLog = new Map<string, UsageLog>();
  for (const log of usageLogs) {
    const current = latestLog.get(log.subscriptionId);
    if (!current || new Date(log.checkedAt) > new Date(current.checkedAt)) {
      latestLog.set(log.subscriptionId, log);
    }
  }

  const worthItItems: ValueReportItem[] = [];
  const wastedItems: ValueReportItem[] = [];
  const unknownItems: ValueReportItem[] = [];

  let totalSpendKRW = 0;

  for (const sub of active) {
    const krw = getMyMonthlyAmountKRW(sub, rate);
    totalSpendKRW += krw;
    const log = latestLog.get(sub.id) ?? null;

    if (!log) {
      unknownItems.push({
        sub,
        log: null,
        monthlyAmountKRW: krw,
        status: "unknown",
        costPerUse: null,
        reason: "체크인 기록이 없어 가성비를 판단할 수 없습니다.",
      });
      continue;
    }

    const cpu = log.costPerUse;
    const risk = log.riskLevel;

    if (risk === "green") {
      worthItItems.push({
        sub,
        log,
        monthlyAmountKRW: krw,
        status: "worth-it",
        costPerUse: cpu,
        reason: `${log.usageCount}회 이용 · 회당 ${formatAmount(cpu, sub.currency)}`,
      });
    } else {
      wastedItems.push({
        sub,
        log,
        monthlyAmountKRW: krw,
        status: "wasted",
        costPerUse: cpu,
        reason:
          log.usageCount === 0
            ? "이번 달 미사용 · 쉬어가기 추천"
            : `${log.usageCount}회 이용 · 지출 다이어트 추천 (회당 ${formatAmount(cpu, sub.currency)})`,
      });
    }
  }

  const worthItKRW = worthItItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);
  const wastedKRW = wastedItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);
  const unknownKRW = unknownItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);

  // 지출 다이어트 기회의 일상 환산
  let wasteSuggestion: string | null = null;
  if (wastedKRW > 0) {
    const items = [...METAPHOR_ITEMS].sort(
      (a, b) => Math.abs(a.price - wastedKRW) - Math.abs(b.price - wastedKRW),
    );
    const best = items[0];
    const count = wastedKRW / best.price;
    if (wastedItems.length === 1) {
      wasteSuggestion = `이번 달 ${wastedItems[0].sub.name}을(를) 잠시 쉬어가면 ${best.label} ${formatCount(count)}${best.unit} 값(${formatKRW(wastedKRW)})을 아낄 수 있어요.`;
    } else {
      wasteSuggestion = `자주 쓰지 않는 구독을 정리하면 매달 ${best.label} ${formatCount(count)}${best.unit} 값(${formatKRW(wastedKRW)})을 내 지갑에 세이브할 수 있어요.`;
    }
  }

  return {
    totalSpendKRW,
    worthItKRW,
    wastedKRW,
    unknownKRW,
    worthItItems,
    wastedItems,
    unknownItems,
    wasteSuggestion,
  };
}

// ─────────────────────────────────────────────────────────
// 4. ActionQueue 트리거용 — 저사용 + 결제 임박 판정
// ─────────────────────────────────────────────────────────

/** 결제 임박 + 저사용 구독을 위한 지출 다이어트 제안 문구 생성. */
export function getLowUsageBillingMessage(
  sub: Subscription,
  usageCount: number,
  daysUntilBilling: number,
  /** 부르는 쪽이 반드시 넘긴다. 기본값을 두면 화면이 잊었을 때 타입이 잡아 주지 못한다. */
  rate: number,
): string {
  const amount = getMyMonthlyShareAmount(sub);
  const amountKRW = toKRW(amount, sub.currency, rate);
  const formatted = formatAmount(amount, sub.currency);

  // 가장 비슷한 소비재
  const best = [...METAPHOR_ITEMS].sort(
    (a, b) => Math.abs(a.price - amountKRW) - Math.abs(b.price - amountKRW),
  )[0];
  const count = amountKRW / best.price;

  if (usageCount === 0) {
    return `이번 달 이용이 아직 없었어요. ${daysUntilBilling}일 뒤 자동 갱신 전에 잠시 구독을 멈추고 ${best.label} ${formatCount(count)}${best.unit} 값(${formatted})을 아껴볼까요?`;
  }
  return `이번 달은 ${usageCount}회만 이용했어요. ${daysUntilBilling}일 뒤 갱신 전에 잠시 쉬어가면 ${best.label} ${formatCount(count)}${best.unit} 값(${formatted})을 지킬 수 있어요.`;
}
