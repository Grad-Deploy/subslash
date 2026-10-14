/**
 * 리포트의 '구독별 사용 시간' 막대그래프(`UsageTimeChart`)에 쓸 값. 막대 길이는 이 폰에서 잰 사용 시간,
 * 색은 가성비 평가(`metricView` — 체크인과 같은 기준)다. 평가는 30일 치 기록이 있어야 나오므로, 그 전의
 * 구독은 색 없이(null) 둔다 — 짧은 기록을 늘려 '잘 씀'·'비쌈'이라고 하지 않는다.
 */
import { metricForSubscription, type RiskLevel, type Subscription } from "@subslash/shared";
import { monthlyTotals, type UsageHistory } from "./history";
import { packagesFor } from "./packages";
import { metricView, subUsage, type SubUsage } from "./value";

export type ChartMode = "recent" | "month";

export interface ChartBar {
  sub: Subscription;
  /** 이 기간에 이 폰에서 쓴 시간(ms). 화면을 끄고 들은 재생 시간을 포함한다(`usedMs`). */
  usedMs: number;
  /** 가성비. 평가 전이면 null. */
  level: RiskLevel | null;
}

/** `YYYY-MM` 달의 날짜들. 이번 달이면 오늘까지. */
export function monthDates(month: string, now: Date): string[] {
  const [year, m] = month.split("-").map(Number);
  const isCurrent = year === now.getFullYear() && m === now.getMonth() + 1;
  const last = isCurrent ? now.getDate() : new Date(year, m, 0).getDate();
  return Array.from({ length: last }, (_, d) => `${month}-${String(d + 1).padStart(2, "0")}`);
}

/** 기록이 하루라도 있는 달(`YYYY-MM`), 이른 순. 최근 12달 안에서. */
export function chartMonths(
  history: UsageHistory,
  subs: readonly Subscription[],
  now: Date,
): string[] {
  const packages = [...new Set(subs.flatMap((sub) => packagesFor(sub) ?? []))];
  if (packages.length === 0) return [];
  return monthlyTotals(history, packages, now)
    .filter((m) => m.totals.coveredDays > 0)
    .map((m) => m.month);
}

/**
 * 기간의 막대. 이 폰에서 잴 수 없는 구독(앱 없음·기록 없음·연결표에 없음)은 막대로 만들지 않고 센다 —
 * 0으로 그리면 '안 썼다'로 읽힌다. 많이 쓴 순.
 *
 * `wholeMonth`면 그 달을 하루도 빠짐없이 잰 경우에 한 달 치로 평가한다(28일인 2월도 평가가 나오게).
 */
export function usageChartBars(
  subs: readonly Subscription[],
  history: UsageHistory,
  installed: readonly string[] | null,
  dates: readonly string[],
  rate: number,
  wholeMonth = false,
): { bars: ChartBar[]; excluded: number; partial: boolean } {
  const bars: ChartBar[] = [];
  let excluded = 0;
  let partial = false;
  for (const sub of subs) {
    const usage = subUsage(sub, history, installed, dates, rate);
    if (usage.state !== "measured") {
      excluded += 1;
      continue;
    }
    if (usage.totals.coveredDays < dates.length) partial = true;
    const judged: SubUsage =
      wholeMonth && usage.totals.coveredDays === dates.length
        ? { ...usage, totals: { ...usage.totals, coveredDays: 30 } }
        : usage;
    bars.push({
      sub,
      usedMs: usage.totals.usedMs,
      level: metricView(judged, metricForSubscription(sub)).level,
    });
  }
  bars.sort((a, b) => b.usedMs - a.usedMs);
  return { bars, excluded, partial };
}
