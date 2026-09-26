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
 */
import {
  isInTrial,
  metricForSubscription,
  type Subscription,
  type UsageLog,
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
  opens: number;
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
    // 폰에서 연 횟수는 횟수로 재는 구독에만 맞다. 음악(시간)·AI(쓴 날)는 그 지표로 따로 센다.
    if (metricForSubscription(sub) !== "uses") continue;
    const usage = subUsage(sub, history, installed, dates, rate);
    if (usage.state !== "measured") continue;
    if (usage.totals.coveredDays < AUTO_CHECKIN_DAYS) continue;
    const opens = usage.totals.opens;
    if (opens === 0) continue;

    const latest = usageLogs
      .filter((log) => log.subscriptionId === sub.id)
      .reduce<UsageLog | null>(
        (best, log) =>
          !best || Date.parse(log.checkedAt) > Date.parse(best.checkedAt) ? log : best,
        null,
      );

    if (!latest) {
      plans.push({ subscriptionId: sub.id, opens });
      continue;
    }

    const age = now.getTime() - Date.parse(latest.checkedAt);
    if (latest.source !== "phone") {
      // 사람이 센 숫자가 아직 30일 안이고 폰 기록 이상이면 그대로 둔다.
      if (age < MANUAL_FRESH_MS && latest.usageCount >= opens) continue;
      plans.push({ subscriptionId: sub.id, opens });
      continue;
    }

    if (age < REFRESH_GAP_MS) continue;
    plans.push(
      monthOf(latest.checkedAt) === thisMonth
        ? { subscriptionId: sub.id, opens, replaceLogId: latest.id }
        : { subscriptionId: sub.id, opens },
    );
  }
  return plans;
}

/** 자동 체크인까지 남은 날(이미 채웠으면 0). 기록이 하루도 없으면 null. */
export function daysUntilAutoCheckIn(history: UsageHistory, now: Date): number | null {
  const covered = lastDays(now, AUTO_CHECKIN_DAYS).filter((date) => history.days[date]).length;
  if (covered === 0) return null;
  return Math.max(0, AUTO_CHECKIN_DAYS - covered);
}
