/**
 * 폰 사용 기록을 돈으로 읽는다. 체크인과 같은 기준을 쓴다 — 체크인은 '최근 30일 동안 몇 번'을
 * 한 달치 내 몫으로 나누므로, 폰 기록도 기록이 있는 날을 30일에 맞춰 환산한다.
 */
import {
  getMyMonthlyAmountKRW,
  getRiskLevel,
  metricRiskLevel,
  type RiskLevel,
  type Subscription,
  type ValueMetric,
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
  /** 기록이 있는 날만큼의 구독료(원). 한 달치 내 몫 × 기록이 있는 날 ÷ 30. */
  periodCostKRW: number;
  /**
   * 기록이 있는 날만큼의 구독료 ÷ 사용 시간. 1시간(MIN_HOURLY_MS)도 안 썼으면 null — 몇 초로 한 달 요금을
   * 나누면 '시간당 5,400만 원'이 나온다(Gemini가 0.5초로 잡혔을 때). 그때는 쓴 시간과 낸 돈을 그대로 보인다.
   */
  hourlyKRW: number | null;
  /** 30일로 환산한 쓴 횟수 기준 1회 단가. 안 열었으면 null. */
  perOpenKRW: number | null;
  /** 30일로 환산한 쓴 횟수로 매긴 색. 안 열었으면 null. */
  level: RiskLevel | null;
}

/** 이보다 적게 썼으면 시간당 금액을 내지 않는다. 한 시간으로 늘려 말하면 쓴 시간보다 큰 숫자가 된다. */
export const MIN_HOURLY_MS = 3_600_000;

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
      periodCostKRW: 0,
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
      periodCostKRW: 0,
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
      periodCostKRW: 0,
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
    periodCostKRW: periodCost,
    hourlyKRW: totals.usedMs >= MIN_HOURLY_MS ? periodCost / hours : null,
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

/**
 * 폰 기록으로 '잘 씀/비쌈'을 말하려면 기록이 이만큼 있어야 한다. 짧은 기록을 30일로 늘려 말하면 이틀에 한 번 연
 * 구독이 '잘 씀'이 된다(Claude 2회·5분이 잘 씀으로 떴다). 자동 체크인(AUTO_CHECKIN_DAYS)과 같은 30일이다.
 * 숫자(시간·횟수·단가)는 그 전에도 보여 준다 — 평가만 미룬다.
 */
export const VERDICT_DAYS = 30;

/**
 * '잘 씀'이 되는 30일 동안의 양. 체크인의 색 기준과 같은 값이다 — 기준을 바꾸면 여기도 바꾼다.
 * - 횟수: getRiskLevel은 8회 이상 **또는** 1회 단가가 한 달 요금의 25% 이하면 초록이라, 실제로는 4회부터다.
 * - 쓴 날·시간: metricRiskLevel의 10일·10시간.
 */
export const GOOD_AT: Record<"uses" | "days" | "hours", number> = { uses: 4, days: 10, hours: 10 };
export const GOAL_UNIT: Record<"uses" | "days" | "hours", string> = {
  uses: "회",
  days: "일",
  hours: "시간",
};

/**
 * 구독의 가성비 한 줄. 체크인과 같은 지표(`metricForSubscription`)로 말한다 — Gemini처럼 '쓴 날'로 재는
 * 구독에 시간당 금액을 보이면 체크인의 '하루당'과 다른 숫자가 나온다.
 */
export interface MetricView {
  metric: "uses" | "days" | "hours";
  /** '1회당' · '하루당' · '시간당' */
  perLabel: string;
  /** 단가. 안 썼거나(0) 시간이 1시간도 안 되면 null. 기록이 30일이 안 되면 30일로 늘려 계산한다. */
  unitKRW: number | null;
  /** 시간 지표인데 1시간도 안 썼다 — 단가 대신 쓴 시간과 낸 돈(periodCostKRW)을 보인다. */
  short: boolean;
  /** 이 기간에 이 폰에서 잰 양. 1회당이면 연 횟수, 하루당이면 쓴 날, 시간당이면 쓴 ms. */
  quantity: number;
  /** 기록에서 잰 양(목표 단위: 회·일·시간). 늘리지 않은 값. */
  have: number;
  /** 30일로 늘린 양(목표 단위). */
  have30: number;
  /** '잘 씀'이 되는 30일 동안의 양(목표 단위). */
  goal: number;
  goalUnit: string;
  /** 평가까지 남은 날. 0이면 평가가 나왔다. */
  pendingDays: number;
  /** 평가. 기록이 VERDICT_DAYS가 안 되면 null(보류). */
  level: RiskLevel | null;
}

export function metricView(usage: SubUsage, metric: ValueMetric): MetricView {
  const { totals, monthlyKRW } = usage;
  const covered = totals.coveredDays;
  const scale = covered > 0 ? 30 / covered : 0;
  const pendingDays = Math.max(0, VERDICT_DAYS - covered);
  const judge = (level: RiskLevel | null) => (pendingDays > 0 ? null : level);
  if (metric === "uses") {
    const have = totals.opens;
    return {
      metric,
      perLabel: "1회당",
      unitKRW: usage.perOpenKRW,
      short: false,
      quantity: have,
      have,
      have30: have * scale,
      goal: GOOD_AT.uses,
      goalUnit: GOAL_UNIT.uses,
      pendingDays,
      // 연 적이 없으면(perOpenKRW null) subUsage가 색을 매기지 않는다 — 0회는 비쌈이다.
      level: judge(usage.level ?? "red"),
    };
  }
  if (metric === "days") {
    const have = totals.activeDays;
    const per30 = have * scale;
    return {
      metric,
      perLabel: "하루당",
      unitKRW: per30 > 0 ? monthlyKRW / per30 : null,
      short: false,
      quantity: have,
      have,
      have30: per30,
      goal: GOOD_AT.days,
      goalUnit: GOAL_UNIT.days,
      pendingDays,
      level: judge(metricRiskLevel("days", monthlyKRW, Math.round(per30))),
    };
  }
  // 시간(음악·독서). 혜택·용량은 폰 기록으로 재지 않으므로 여기 오지 않는다 — 오면 시간으로 본다.
  const have = totals.usedMs / 3_600_000;
  const hoursPer30 = have * scale;
  return {
    metric: "hours",
    perLabel: "시간당",
    unitKRW: usage.hourlyKRW,
    short: totals.usedMs > 0 && totals.usedMs < MIN_HOURLY_MS,
    quantity: totals.usedMs,
    have,
    have30: hoursPer30,
    goal: GOOD_AT.hours,
    goalUnit: GOAL_UNIT.hours,
    pendingDays,
    level: judge(metricRiskLevel("hours", monthlyKRW, hoursPer30)),
  };
}

/** 가성비 순서: 안 좋은 것부터. 평가가 나왔으면 비쌈 → 애매 → 잘 씀, 같은 무리는 '잘 씀'까지 먼 순. */
export function compareValue(a: MetricView, b: MetricView): number {
  const order = (v: MetricView) =>
    v.level === null ? 0 : { red: 0, yellow: 1, green: 2 }[v.level];
  return order(a) - order(b) || a.have30 / a.goal - b.have30 / b.goal;
}
