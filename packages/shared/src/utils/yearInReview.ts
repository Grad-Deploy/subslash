import type { Subscription, SubscriptionCategory, UsageLog } from "../types";
import { DEFAULT_EXCHANGE_RATE } from "../constants/thresholds";
import { CATEGORY_LABELS } from "../constants/categories";
import { toKRW } from "./currency";
import { getYearDefendedSeries, sumMyAnnualKRW, type YearDefendedSeries } from "./sharing";

export interface CategorySpend {
  category: SubscriptionCategory;
  /** 이 카테고리 구독을 1년 내내 낼 때의 내 몫(원). */
  annualKRW: number;
  /** 전체 연간 환산 지출에서 차지하는 비율(0~1). */
  share: number;
  count: number;
}

export interface CheckInStanding {
  subscriptionId: string;
  name: string;
  iconUrl?: string;
  /** 그 해에 해지한 구독이면 true. 결산에는 끊은 구독의 가성비도 들어간다. */
  killed: boolean;
  /** 그 해 마지막 체크인의 1회당 비용을 사용자 환율로 원화 환산한 값. */
  costPerUseKRW: number;
  usageCount: number;
  checkedAt: string;
}

/** 이 비율 이상을 한 카테고리가 차지하면 그 카테고리 '집중형'이다. */
export const FOCUSED_SHARE = 0.5;

/**
 * 지금 구독 구성으로 본 소비 유형.
 *
 * 지출 구성에서 그대로 읽히는 것만 말한다 — 가장 큰 카테고리가 절반 이상이면
 * 그 카테고리에 모인 것이고, 아니면 여러 곳에 나눠 쓴 것이다. 이용 습관이나
 * 성향처럼 앱이 모르는 것은 유형 이름에 담지 않는다.
 */
export type SpendingType =
  | { kind: "focused"; category: SubscriptionCategory; share: number }
  | { kind: "spread"; categoryCount: number };

export interface YearInReview {
  year: number;
  /** 그 해가 이미 끝났는가. 끝나지 않았으면 모든 수치는 "지금까지"다. */
  isComplete: boolean;
  defended: YearDefendedSeries;
  /** 그 해에 해지한 구독, 해지한 순서대로. */
  killedThisYear: Subscription[];
  /** 해지는 했지만 언제인지 기록이 없어 어느 해에도 넣지 못한 구독 수. */
  killedAtUnknown: number;
  /**
   * 지금 구독 중인 서비스를 1년 내내 낸다고 셈한 내 몫을 카테고리별로, 큰 순서로.
   * 앱은 지난 결제 내역을 갖고 있지 않으므로 "올해 실제로 결제된 금액"이 아니다.
   */
  categorySpend: CategorySpend[];
  activeAnnualKRW: number;
  /**
   * 지금 구독 구성으로 본 소비 유형. 지난 해 결산이면 null이다 — 그 해의 구독
   * 구성은 기록으로 남아 있지 않아, 지금 구성으로 지난 해를 말하게 된다.
   */
  spendingType: SpendingType | null;
  /** 그 해에 체크인한 서비스마다 마지막 체크인 기준 1회당 비용, 싼 순서로. */
  checkIns: CheckInStanding[];
}

function yearOf(iso: string | undefined): number | null {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(time) ? null : new Date(time).getFullYear();
}

/** 가장 늦은 체크인. 시각이 같으면 나중에 기록한 것을 최신으로 본다. */
function latestLog(logs: UsageLog[]): UsageLog | undefined {
  let latest: UsageLog | undefined;
  let latestTime = -Infinity;
  for (const log of logs) {
    const time = Date.parse(log.checkedAt);
    const comparable = Number.isNaN(time) ? -Infinity : time;
    if (!latest || comparable >= latestTime) {
      latest = log;
      latestTime = comparable;
    }
  }
  return latest;
}

/**
 * 지출 구성에서 소비 유형을 정한다. 구독 중인 서비스가 없거나 금액이 모두 0이면
 * 유형도 없다 — 없는 지출로 유형을 지어내지 않는다.
 */
export function getSpendingType(spend: CategorySpend[]): SpendingType | null {
  const paying = spend.filter((item) => item.annualKRW > 0);
  if (paying.length === 0) return null;

  const top = paying.reduce((best, item) => (item.share > best.share ? item : best));
  if (top.share >= FOCUSED_SHARE) {
    return { kind: "focused", category: top.category, share: top.share };
  }
  return { kind: "spread", categoryCount: paying.length };
}

/** 소비 유형을 화면·공유 카드에 적을 말. 둘이 같은 문장을 쓴다. */
export function describeSpendingType(type: SpendingType): {
  emoji: string;
  title: string;
  detail: string;
} {
  if (type.kind === "focused") {
    const label = CATEGORY_LABELS[type.category];
    return {
      emoji: "🎯",
      title: `${label} 집중형`,
      detail: `구독 지출의 ${Math.round(type.share * 100)}%가 ${label}에 모여 있습니다.`,
    };
  }
  return {
    emoji: "🧩",
    title: "고루 쓰는 분산형",
    detail: `${type.categoryCount}개 분야에 나눠 쓰고, 가장 큰 분야도 절반이 되지 않습니다.`,
  };
}

/**
 * 한 해 구독 결산 — 지킨 돈, 해지한 구독, 지출 구성, 체크인 기준 가성비.
 *
 * 모든 수치는 앱이 실제로 가진 기록에서만 나온다. 해지 날짜가 없는 구독은
 * 어느 해에 넣을지 몰라 따로 세고, 가성비는 그 해에 한 체크인만 쓴다.
 */
export function buildYearInReview(
  subs: Subscription[],
  logs: UsageLog[],
  year: number,
  rate: number = DEFAULT_EXCHANGE_RATE,
  now: Date = new Date(),
): YearInReview {
  const killed = subs.filter((sub) => sub.status === "killed");
  const active = subs.filter((sub) => sub.status === "active");

  const killedThisYear = killed
    .filter((sub) => yearOf(sub.killedAt) === year)
    .sort((a, b) => Date.parse(a.killedAt ?? "") - Date.parse(b.killedAt ?? ""));
  const killedAtUnknown = killed.filter((sub) => yearOf(sub.killedAt) === null).length;

  const activeAnnualKRW = sumMyAnnualKRW(active, rate);
  const byCategory = new Map<SubscriptionCategory, Subscription[]>();
  for (const sub of active) {
    byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
  }
  const categorySpend = [...byCategory]
    .map(([category, members]): CategorySpend => {
      const annualKRW = sumMyAnnualKRW(members, rate);
      return {
        category,
        annualKRW,
        share: activeAnnualKRW > 0 ? annualKRW / activeAnnualKRW : 0,
        count: members.length,
      };
    })
    .sort((a, b) => b.annualKRW - a.annualKRW);

  // 지금 구독 중인 것과 그 해에 끊은 것. 예전 해에 끊은 구독의 체크인은 그 해의
  // 가성비가 아니다.
  const reviewed = [...active, ...killedThisYear];
  const checkIns = reviewed
    .flatMap((sub): CheckInStanding[] => {
      const latest = latestLog(
        logs.filter((log) => log.subscriptionId === sub.id && yearOf(log.checkedAt) === year),
      );
      if (!latest) return [];
      return [
        {
          subscriptionId: sub.id,
          name: sub.name,
          iconUrl: sub.iconUrl,
          killed: sub.status === "killed",
          costPerUseKRW: toKRW(latest.costPerUse, sub.currency, rate),
          usageCount: latest.usageCount,
          checkedAt: latest.checkedAt,
        },
      ];
    })
    .sort((a, b) => a.costPerUseKRW - b.costPerUseKRW);

  const isComplete = year < now.getFullYear();

  return {
    year,
    isComplete,
    defended: getYearDefendedSeries(killed, year, rate, now),
    killedThisYear,
    killedAtUnknown,
    categorySpend,
    activeAnnualKRW,
    spendingType: isComplete ? null : getSpendingType(categorySpend),
    checkIns,
  };
}
