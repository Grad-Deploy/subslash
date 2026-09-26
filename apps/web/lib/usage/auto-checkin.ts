/**
 * 폰 사용 기록으로 체크인을 자동으로 적을지 정하는 순수 함수.
 *
 * 체크인은 '지난 30일 동안 몇 번'이다. 폰 기록이 그 30일을 온전히 덮을 때만 그 숫자를 쓴다 —
 * 기록이 열흘뿐인데 열흘치 횟수를 '30일 동안'으로 적으면 덜 쓴 것처럼 보여 해지 권유로 이어지고,
 * 30일로 부풀리면 지어낸 숫자다. 그래서 모자란 동안은 적지 않고 며칠 남았는지만 알린다.
 *
 * 이 폰에서 0번이면 적지 않는다. TV·PC에서 봤을 수 있어 '안 씀'의 증거가 아니다(체크인 막대가
 * '다른 기기에서 봤나요?'로 묻는 것과 같은 이유). 사용자가 직접 센 체크인이 최근 30일 안에 있고
 * 그 숫자가 폰 기록 이상이면 덮지 않는다 — 사람이 센 숫자에는 다른 기기가 들어 있다.
 *
 * 무엇을 적는지는 구독의 지표(utils/valueMetric)를 따른다.
 * - 횟수: 이 폰에서 연 횟수
 * - 쓴 날: 이 폰에서 한 번이라도 쓴 날 수
 * - 시간: 날마다 max(앞에 있던 시간, 재생 알림 시간)의 합을 시간으로 내린 값. 재생 시간을 모르는 날이
 *   있으면(안드로이드 9 이하, 이 기능 전의 기록) 적지 않는다 — 화면을 끄고 들은 음악이 빠져 덜 쓴 것처럼
 *   보인다. 1시간이 안 되면 0시간이 되므로 적지 않는다.
 * - 혜택·용량: 폰 기록으로 알 수 없어 적지 않는다.
 */
import {
  isInTrial,
  metricForSubscription,
  metricOfLog,
  type Subscription,
  type UsageLog,
  type ValueMetric,
} from "@subslash/shared";
import { lastDays, type UsageHistory } from "./history";
import { packagesFor } from "./packages";
import { subUsage } from "./value";

/** 자동 체크인에 필요한 기록 날 수. 체크인이 묻는 기간과 같다. */
export const AUTO_CHECKIN_DAYS = 30;
/** 같은 달의 자동 체크인을 다시 맞추는 최소 간격. */
const REFRESH_GAP_MS = 20 * 60 * 60 * 1000;
const MANUAL_FRESH_MS = AUTO_CHECKIN_DAYS * 24 * 60 * 60 * 1000;

export interface AutoCheckIn {
  subscriptionId: string;
  metric: ValueMetric;
  /** 적을 수량(지표의 단위: 회·일·시간). */
  quantity: number;
  /** 같은 달의 자동 체크인이 이미 있으면 그 줄을 바꾼다. */
  replaceLogId?: string;
}

function monthOf(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function planAutoCheckIns(
  subscriptions: readonly Subscription[],
  usageLogs: readonly UsageLog[],
  history: UsageHistory,
  installed: readonly string[] | null,
  now: Date,
  rate: number,
): AutoCheckIn[] {
  const dates = lastDays(now, AUTO_CHECKIN_DAYS);
  const thisMonth = monthOf(now.toISOString());
  const plans: AutoCheckIn[] = [];

  for (const sub of subscriptions) {
    // 체험 중인 구독은 나가는 돈이 없어 1회 단가를 매기지 않는다.
    if (sub.status !== "active" || isInTrial(sub, now) || !packagesFor(sub)) continue;
    const metric = metricForSubscription(sub);
    const usage = subUsage(sub, history, installed, dates, rate);
    if (usage.state !== "measured") continue;
    if (usage.totals.coveredDays < AUTO_CHECKIN_DAYS) continue;
    const quantity = phoneQuantity(metric, usage.totals);
    if (quantity === null || quantity === 0) continue;

    const latest = usageLogs
      .filter((log) => log.subscriptionId === sub.id)
      .reduce<UsageLog | null>(
        (best, log) =>
          !best || Date.parse(log.checkedAt) > Date.parse(best.checkedAt) ? log : best,
        null,
      );

    const plan: AutoCheckIn = { subscriptionId: sub.id, metric, quantity };
    if (!latest) {
      plans.push(plan);
      continue;
    }

    const age = now.getTime() - Date.parse(latest.checkedAt);
    if (latest.source !== "phone") {
      // 사람이 같은 지표로 센 숫자가 아직 30일 안이고 폰 기록 이상이면 그대로 둔다. 지표가 다르면(예전
      // 횟수 체크인 뒤 시간으로 재게 된 음악) 견줄 수 없어 새로 적는다.
      if (
        age < MANUAL_FRESH_MS &&
        metricOfLog(latest) === metric &&
        latest.usageCount >= quantity
      ) {
        continue;
      }
      plans.push(plan);
      continue;
    }

    if (age < REFRESH_GAP_MS) continue;
    plans.push(
      monthOf(latest.checkedAt) === thisMonth ? { ...plan, replaceLogId: latest.id } : plan,
    );
  }
  return plans;
}

/** 폰 기록으로 잰 이 지표의 수량. 폰으로 알 수 없으면 null. */
export function phoneQuantity(
  metric: ValueMetric,
  totals: { opens: number; activeDays: number; listenMs: number | null },
): number | null {
  switch (metric) {
    case "uses":
      return totals.opens;
    case "days":
      return totals.activeDays;
    case "hours":
      return totals.listenMs === null ? null : Math.floor(totals.listenMs / 3_600_000);
    default:
      return null;
  }
}

/** 자동 체크인까지 남은 날(이미 채웠으면 0). 기록이 하루도 없으면 null. */
export function daysUntilAutoCheckIn(history: UsageHistory, now: Date): number | null {
  const covered = lastDays(now, AUTO_CHECKIN_DAYS).filter((date) => history.days[date]).length;
  if (covered === 0) return null;
  return Math.max(0, AUTO_CHECKIN_DAYS - covered);
}

/** 폰 기록으로 잰 이 지표의 수량(체크인 칸에 채울 값). 시간은 1시간 단위로 내린다. */
export function measuredQuantity(
  metric: ValueMetric,
  totals: { activeDays: number; usedMs: number },
): number {
  return metric === "days" ? totals.activeDays : Math.floor(totals.usedMs / 3_600_000);
}
