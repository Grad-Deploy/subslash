/**
 * 폰 사용 기록을 돈으로 읽는다. 체크인과 같은 기준을 쓴다 — 체크인은 '최근 30일 동안 몇 번'을
 * 한 달치 내 몫으로 나누므로, 폰 기록도 기록이 있는 날을 30일에 맞춰 환산한다.
 */
import {
  getMyMonthlyAmountKRW,
  getRiskLevel,
  type RiskLevel,
  type Subscription,
} from "@subslash/shared";
import { lastDays, totalsFor, type UsageHistory, type UsageTotals } from "./history";
import { packagesFor } from "./packages";

export type UsageRange = "week" | "month" | "year";

export const RANGE_DAYS: Record<UsageRange, number> = { week: 7, month: 30, year: 365 };
export const RANGE_LABEL: Record<UsageRange, string> = { week: "1주", month: "1달", year: "1년" };

/**
 * 막대 색과 글자. 기준은 체크인·계산서가 쓰는 getRiskLevel 그대로다(새 기준을 만들지 않는다).
 * 색만으로 말하지 않게 늘 글자를 붙인다.
 */
export const LEVEL_STYLE: Record<RiskLevel, { label: string; bar: string; text: string }> = {
  red: {
    label: "비쌈",
    bar: "bg-red-500 dark:bg-red-400",
    text: "text-red-700 dark:text-red-400",
  },
  yellow: {
    label: "애매",
    bar: "bg-amber-400 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-400",
  },
  green: {
    label: "잘 씀",
    bar: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
  },
};

export type UsageState =
  /** 연결표에 없는 구독(멤버십·PC 도구 등). 직접 체크인한다. */
  | "unmapped"
  /** 연결표에는 있지만 이 폰에 앱이 없다. 0회를 '안 씀'으로 읽지 않는다. */
  | "not-installed"
  /** 이 기간에 기록이 있는 날이 없다. */
  | "no-data"
  | "measured";

export interface SubUsage {
  sub: Subscription;
  state: UsageState;
  totals: UsageTotals;
  /** 한 달치 내 몫(원). */
  monthlyKRW: number;
  /** 기록이 있는 날만큼의 구독료 ÷ 사용 시간. 안 썼으면 null. */
  hourlyKRW: number | null;
  /** 30일로 환산한 쓴 횟수 기준 1회 단가. 안 열었으면 null. */
  perOpenKRW: number | null;
  /** 30일로 환산한 쓴 횟수로 매긴 색. 안 열었으면 null. */
  level: RiskLevel | null;
}

export function subUsage(
  sub: Subscription,
  history: UsageHistory,
  installed: readonly string[] | null,
  dates: readonly string[],
  rate: number,
): SubUsage {
  const packages = packagesFor(sub);
  const monthlyKRW = getMyMonthlyAmountKRW(sub, rate);
  const empty = {
    ms: 0,
    opens: 0,
    coveredDays: 0,
    activeDays: 0,
    listenMs: null,
    usedMs: 0,
    byPackage: {},
  };
  if (!packages) {
    return {
      sub,
      state: "unmapped",
      totals: empty,
      monthlyKRW,
      hourlyKRW: null,
      perOpenKRW: null,
      level: null,
    };
  }
  // 설치 목록을 아직 모르면(null) 설치된 것으로 본다 — 기록 자체는 설치 여부와 관계없이 읽힌다.
  const present = installed === null ? packages : packages.filter((pkg) => installed.includes(pkg));
  const totals = totalsFor(history, packages, dates);
  if (present.length === 0 && totals.opens === 0) {
    return {
      sub,
      state: "not-installed",
      totals,
      monthlyKRW,
      hourlyKRW: null,
      perOpenKRW: null,
      level: null,
    };
  }
  if (totals.coveredDays === 0) {
    return {
      sub,
      state: "no-data",
      totals,
      monthlyKRW,
      hourlyKRW: null,
      perOpenKRW: null,
      level: null,
    };
  }
  const periodCost = (monthlyKRW * totals.coveredDays) / 30;
  // 화면을 끄고 들은 재생도 넣는다(유튜브 뮤직·음악 앱). 재생 시간을 모르면 앞에 있던 시간만.
  const hours = totals.usedMs / 3_600_000;
  const opensPer30 = (totals.opens * 30) / totals.coveredDays;
  const perOpenKRW = opensPer30 > 0 ? monthlyKRW / opensPer30 : null;
  return {
    sub,
    state: "measured",
    totals,
    monthlyKRW,
    hourlyKRW: hours > 0 ? periodCost / hours : null,
    perOpenKRW,
    level: perOpenKRW === null ? null : getRiskLevel(perOpenKRW, monthlyKRW, opensPer30),
  };
}

export function rangeDates(range: UsageRange, now: Date): string[] {
  return lastDays(now, RANGE_DAYS[range]);
}

/** 최근 30일 쓴 횟수(체크인 미리 맞추기용). 잴 수 없으면 null. */
export function recentOpens(
  sub: Subscription,
  history: UsageHistory,
  installed: readonly string[] | null,
  now: Date,
  rate: number,
): SubUsage | null {
  const usage = subUsage(sub, history, installed, lastDays(now, 30), rate);
  return usage.state === "measured" ? usage : null;
}

/** 가운데 값. 비교 대상이 모자라면 null. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
