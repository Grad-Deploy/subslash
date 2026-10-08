import { Currency, Subscription, UsageLog } from "../types";
import { calculateCostPerUse, getRiskLevel } from "./cost-per-use";
import { toKRW } from "./currency";
import { getMyMonthlyShareAmount, getMyMonthlyAmountKRW } from "./sharing";

// ─────────────────────────────────────────────────────────
// 1. 실체감 환산 메타포
// ─────────────────────────────────────────────────────────

/**
 * 1회당 단가를 일상 소비재로 환산한 말에 들어갈 값. 문장은 화면이 언어에 맞게 만든다 — 이 모듈은 서버도 쓰므로
 * 한 언어의 문장을 만들지 않는다.
 */
export interface UsageMetaphor {
  tone: "danger" | "warning" | "safe";
  /**
   * - `unused`: 이번 달 안 썼다 (`amountKRW` 값어치의 `item`)
   * - `movie`: 1회 이용이고 영화관 티켓에 가깝다 (`item`은 영화관 티켓)
   * - `once`: 1회 이용이고 `item`에 가깝다
   * - `warning`: 본전까지 조금 남았다
   * - `cheap`: 커피 한 잔보다 알뜰하다
   * - `worth`: 낸 돈 이상으로 쓰고 있다
   */
  kind: "unused" | "movie" | "once" | "warning" | "cheap" | "worth";
  serviceName: string;
  item: MetaphorKey;
  /** `item` 몇 개 값인지. */
  count: number;
  /** 1회당 단가(구독 통화). */
  cost: number;
  currency: Currency;
  /** 한 달치 내 몫을 원으로 바꾼 값. */
  amountKRW: number;
}

/** 일상 소비재 기준표 — 가장 가까운 것 하나를 고른다. */
const METAPHOR_ITEMS = [
  { key: "coffee", label: "커피", unit: "잔", price: 5000 },
  { key: "movie", label: "영화관 티켓", unit: "장", price: 15000 },
  { key: "chicken", label: "치킨", unit: "마리", price: 20000 },
  { key: "delivery", label: "배달팁", unit: "회", price: 3000 },
] as const;

/** 비유에 쓰는 소비재. 글자는 화면이 언어에 맞게 붙인다. */
export type MetaphorKey = (typeof METAPHOR_ITEMS)[number]["key"];

function priceOf(key: MetaphorKey): number {
  return METAPHOR_ITEMS.find((item) => item.key === key)!.price;
}

/** 금액(원)과 가장 가까운 소비재와, 그 소비재 몇 개 값인지. */
export function pickMetaphorItem(amountKRW: number): { key: MetaphorKey; count: number } {
  const best = [...METAPHOR_ITEMS].sort(
    (a, b) => Math.abs(a.price - amountKRW) - Math.abs(b.price - amountKRW),
  )[0];
  return { key: best.key, count: amountKRW / best.price };
}

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

  const cost = calculateCostPerUse(amount, usageCount);
  const base = { serviceName, currency, cost, amountKRW };

  if (usageCount === 0) {
    const total = pickMetaphorItem(amountKRW);
    return { ...base, tone: "danger", kind: "unused", item: total.key, count: total.count };
  }

  if (tone === "danger") {
    // OTT 계열이면 영화관 메타포가 더 직관적
    const movieCount = costPerUse / priceOf("movie");
    if (movieCount >= 0.8) {
      return { ...base, tone: "danger", kind: "movie", item: "movie", count: movieCount };
    }
    return { ...base, tone: "danger", kind: "once", item: best.key, count };
  }

  if (tone === "warning") {
    return { ...base, tone: "warning", kind: "warning", item: best.key, count };
  }

  // safe
  const coffeeRatio = costPerUse / priceOf("coffee");
  return coffeeRatio < 1
    ? { ...base, tone: "safe", kind: "cheap", item: "coffee", count: coffeeRatio }
    : { ...base, tone: "safe", kind: "worth", item: best.key, count };
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

  let level: BreakEvenInfo["level"];
  if (progress <= 40) level = "danger";
  else if (progress <= 80) level = "warning";
  else level = "safe";

  return {
    breakEvenUsage: target,
    currentUsage: usageCount,
    progressPercent: Math.round(progress),
    level,
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
}

/**
 * 절약 기회의 일상 환산. 문장은 화면이 만든다 — 한 구독이면 그 이름을, 여럿이면 "자주 쓰지 않는 구독"을 말한다.
 */
export interface WasteSuggestion {
  /** 쉬어가기 대상이 하나면 그 구독 이름. 여럿이면 null. */
  name: string | null;
  item: MetaphorKey;
  /** 소비재 몇 개 값인지. */
  count: number;
  amountKRW: number;
}

export interface MonthlyValueSummary {
  totalSpendKRW: number;
  worthItKRW: number;
  wastedKRW: number;
  unknownKRW: number;
  worthItItems: ValueReportItem[];
  wastedItems: ValueReportItem[];
  unknownItems: ValueReportItem[];
  /** 절약 기회의 일상 소비재 환산. */
  wasteSuggestion: WasteSuggestion | null;
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
      });
    } else {
      wastedItems.push({
        sub,
        log,
        monthlyAmountKRW: krw,
        status: "wasted",
        costPerUse: cpu,
      });
    }
  }

  const worthItKRW = worthItItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);
  const wastedKRW = wastedItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);
  const unknownKRW = unknownItems.reduce((s, i) => s + i.monthlyAmountKRW, 0);

  // 지출 다이어트 기회의 일상 환산
  let wasteSuggestion: WasteSuggestion | null = null;
  if (wastedKRW > 0) {
    const { key, count } = pickMetaphorItem(wastedKRW);
    wasteSuggestion = {
      name: wastedItems.length === 1 ? wastedItems[0].sub.name : null,
      item: key,
      count,
      amountKRW: wastedKRW,
    };
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

/**
 * 결제 임박 + 저사용 구독의 지출 다이어트 제안에 쓸 값. 문장은 화면이 언어에 맞게 만든다 — 아낄 한 달치 내 몫(구독
 * 통화)과, 그 금액과 가장 가까운 소비재 몇 개 값인지.
 */
export function getLowUsageBillingFigures(
  sub: Subscription,
  /** 부르는 쪽이 반드시 넘긴다. 기본값을 두면 화면이 잊었을 때 타입이 잡아 주지 못한다. */
  rate: number,
): { amount: number; currency: Currency; item: MetaphorKey; count: number } {
  const amount = getMyMonthlyShareAmount(sub);
  const { key, count } = pickMetaphorItem(toKRW(amount, sub.currency, rate));
  return { amount, currency: sub.currency, item: key, count };
}
