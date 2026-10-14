/**
 * 리포트의 '구독별 사용 시간' 막대그래프(`UsageTimeChart`)에 쓸 값. 막대 길이는 이 폰에서 잰 사용 시간,
 * 색은 가성비 평가(`metricView` — 체크인과 같은 기준)다. 평가는 30일 치 기록이 있어야 나오므로, 그 전의
 * 구독은 색 없이(null) 둔다 — 짧은 기록을 늘려 '잘 씀'·'비쌈'이라고 하지 않는다.
 */
import { metricForSubscription, type RiskLevel, type Subscription } from "@subslash/shared";
import type { UsageHistory } from "./history";
import { metricView, subUsage, type SubUsage } from "./value";

export type ChartMode = "recent" | "month";

export interface ChartBar {
  sub: Subscription;
  /** 이 기간에 이 폰에서 쓴 시간(ms). 화면을 끄고 들은 재생 시간을 포함한다(`usedMs`). */
  usedMs: number;
  /** 가성비. 평가 전이면 null. */
  level: RiskLevel | null;
}

/** 막대로 그리지 않은 구독 수. 이유마다 화면에 하는 말이 다르다. */
export interface ChartExclusions {
  /** 폰 기록으로 잴 방법이 없는 구독(멤버십·PC에서 쓰는 구독 — 연결표에 없음). */
  unmapped: number;
  /** 잴 수는 있지만 이 폰에 앱이 없거나 이 기간에 기록이 없는 구독. */
  unmeasured: number;
}

/**
 * 기간의 막대. 이 폰에서 잴 수 없는 구독은 막대로 만들지 않고 이유별로 센다 — 0으로 그리면 '안 썼다'로
 * 읽힌다. 많이 쓴 순.
 *
 * `wholeMonth`면 그 달을 하루도 빠짐없이 잰 경우에 한 달 치로 평가한다(28일인 2월도 평가가 나오게).
 * `fallback`은 폰 기록으로 아직 평가하지 못한 구독(30일 전)의 색이다 — 최근 30일 막대에서 최근 체크인의 색을 준다.
 */
export function usageChartBars(
  subs: readonly Subscription[],
  history: UsageHistory,
  installed: readonly string[] | null,
  dates: readonly string[],
  rate: number,
  wholeMonth = false,
  fallback?: (sub: Subscription) => RiskLevel | null,
): { bars: ChartBar[]; excluded: ChartExclusions; partial: boolean } {
  const bars: ChartBar[] = [];
  const excluded: ChartExclusions = { unmapped: 0, unmeasured: 0 };
  let partial = false;
  for (const sub of subs) {
    const usage = subUsage(sub, history, installed, dates, rate);
    if (usage.state !== "measured") {
      excluded[usage.state === "unmapped" ? "unmapped" : "unmeasured"] += 1;
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
      level: metricView(judged, metricForSubscription(sub)).level ?? fallback?.(sub) ?? null,
    });
  }
  bars.sort((a, b) => b.usedMs - a.usedMs);
  return { bars, excluded, partial };
}
