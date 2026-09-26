import {
  POPULAR_SERVICES,
  findPresetForSubscription,
  getMyMonthlyAmountKRW,
  isInTrial,
  sumMyMonthlyKRW,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

/**
 * 익명 구독 통계. '다른 사람들은 이 서비스에 얼마를 내고 몇 번 쓰나'를 보여 주려고, 참여에 동의한
 * 기기만 아주 작은 요약을 보낸다.
 *
 * 보내는 것: 한 달 구독 지출 합계(1,000원 단위), 구독 개수, 그리고 **알려진 서비스**마다 서비스 id,
 * 내 몫의 한 달 금액(100원 단위), 마지막 체크인의 이용 횟수. 구독 이름·메모·결제일·계정은 보내지
 * 않는다 — 직접 적은 서비스 이름은 그 자체로 사람을 알아볼 수 있어서, 목록에 있는 서비스만 보낸다.
 *
 * 비교는 모인 사람이 충분할 때만 보여 준다(STATS_MIN_*). 몇 명뿐인 평균을 '다른 사용자들'이라고
 * 부르면 사실처럼 읽히는 우연이 되고, 한두 명의 값이 드러난다.
 */

/** 전체 비교를 보여 주는 최소 참여자 수. */
export const STATS_MIN_PARTICIPANTS = 20;
/** 서비스별 비교를 보여 주는 최소 참여자 수. */
export const STATS_MIN_PER_SERVICE = 10;
/** 이만큼 갱신되지 않은 참여 기록은 지운다(일). */
export const STATS_RETENTION_DAYS = 180;
/** 체크인이 이보다 오래됐으면 이용 횟수를 모른다고 본다(일). 리포트의 1회 단가도 같은 기준을 쓴다. */
export const USAGE_FRESH_DAYS = 45;

export interface StatsItem {
  presetId: string;
  monthlyKRW: number;
  /** 지난 30일 이용 횟수. 최근 체크인이 없으면 null — 0회로 읽지 않는다. */
  usageCount: number | null;
}

export interface StatsContribution {
  v: 1;
  totalMonthlyKRW: number;
  activeCount: number;
  items: StatsItem[];
}

const roundTo = (value: number, unit: number) => Math.round(value / unit) * unit;

/**
 * 이 구독의 최근 체크인 이용 횟수. 체크인이 없거나 `USAGE_FRESH_DAYS`보다 오래됐으면 null이다 —
 * 오래된 횟수를 지금 것으로, 모름을 0회로 읽지 않는다.
 */
export function latestFreshUsage(
  usageLogs: UsageLog[],
  subscriptionId: string,
  now: Date = new Date(),
): number | null {
  const latest = latestFreshLog(usageLogs, subscriptionId, now);
  // 횟수 체크인만 보낸다. 시간·쓴 날·혜택 금액은 '이용 횟수' 비교에 섞이면 안 되고, 방침에 적은 항목도
  // 이용 횟수뿐이다(utils/valueMetric).
  if (!latest || (latest.metric ?? "uses") !== "uses") return null;
  return latest.usageCount;
}

/** 이 구독의 최근 체크인(지표와 관계없이). `USAGE_FRESH_DAYS`보다 오래됐으면 null. */
export function latestFreshLog(
  usageLogs: UsageLog[],
  subscriptionId: string,
  now: Date = new Date(),
): UsageLog | null {
  const freshAfter = now.getTime() - USAGE_FRESH_DAYS * 24 * 60 * 60 * 1000;
  let latest: UsageLog | null = null;
  for (const log of usageLogs) {
    if (log.subscriptionId !== subscriptionId) continue;
    const checkedAt = Date.parse(log.checkedAt);
    if (checkedAt < freshAfter) continue;
    if (!latest || checkedAt > Date.parse(latest.checkedAt)) latest = log;
  }
  return latest;
}

/** 지금 구독에서 보낼 요약을 만든다. 체험 중인 구독은 돈이 나가지 않으므로 뺀다. */
export function buildContribution(
  subscriptions: Subscription[],
  usageLogs: UsageLog[],
  rate: number,
  now: Date = new Date(),
): StatsContribution {
  const active = subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now));

  const items: StatsItem[] = [];
  const seen = new Set<string>();
  for (const sub of active) {
    const preset = findPresetForSubscription(sub);
    if (!preset || seen.has(preset.id)) continue;
    seen.add(preset.id);

    items.push({
      presetId: preset.id,
      monthlyKRW: roundTo(getMyMonthlyAmountKRW(sub, rate), 100),
      usageCount: latestFreshUsage(usageLogs, sub.id, now),
    });
  }

  return {
    v: 1,
    totalMonthlyKRW: roundTo(sumMyMonthlyKRW(active, rate), 1000),
    activeCount: active.length,
    items,
  };
}

const KNOWN_PRESETS = new Set(POPULAR_SERVICES.map((service) => service.id));

const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;

/** 서버가 받은 요약을 검사한다. 모양이 조금이라도 틀리면 통째로 받지 않는다. */
export function parseContribution(body: unknown): StatsContribution | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (value.v !== 1) return null;
  if (!isInt(value.totalMonthlyKRW, 0, 10_000_000)) return null;
  if (!isInt(value.activeCount, 0, 300)) return null;
  if (!Array.isArray(value.items) || value.items.length > 150) return null;

  const items: StatsItem[] = [];
  const seen = new Set<string>();
  for (const raw of value.items) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    if (typeof item.presetId !== "string" || !KNOWN_PRESETS.has(item.presetId)) return null;
    if (seen.has(item.presetId)) return null;
    if (!isInt(item.monthlyKRW, 0, 2_000_000)) return null;
    if (item.usageCount !== null && !isInt(item.usageCount, 0, 300)) return null;
    seen.add(item.presetId);
    items.push({
      presetId: item.presetId,
      monthlyKRW: item.monthlyKRW,
      usageCount: item.usageCount as number | null,
    });
  }
  return {
    v: 1,
    totalMonthlyKRW: value.totalMonthlyKRW,
    activeCount: value.activeCount,
    items,
  };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export interface ServiceStats {
  presetId: string;
  participants: number;
  medianMonthlyKRW: number;
  /** 체크인한 사람이 모자라면 null. */
  medianUsage: number | null;
}

export interface StatsSummary {
  participants: number;
  /** 참여자가 모자라면 null. */
  overall: { medianMonthlyKRW: number; medianActiveCount: number } | null;
  services: ServiceStats[];
}

export interface ContributorRow {
  totalMonthlyKRW: number;
  activeCount: number;
  items: StatsItem[];
}

/** 참여 기록을 모아 요약한다. 모자란 칸은 숫자 대신 비워 둔다. */
export function summarize(rows: ContributorRow[]): StatsSummary {
  const participants = rows.length;
  const overall =
    participants >= STATS_MIN_PARTICIPANTS
      ? {
          medianMonthlyKRW: median(rows.map((row) => row.totalMonthlyKRW)) ?? 0,
          medianActiveCount: median(rows.map((row) => row.activeCount)) ?? 0,
        }
      : null;

  const byPreset = new Map<string, StatsItem[]>();
  for (const row of rows) {
    for (const item of row.items) {
      const list = byPreset.get(item.presetId) ?? [];
      list.push(item);
      byPreset.set(item.presetId, list);
    }
  }

  const services: ServiceStats[] = [];
  for (const [presetId, items] of byPreset) {
    if (items.length < STATS_MIN_PER_SERVICE) continue;
    const usages = items
      .map((item) => item.usageCount)
      .filter((count): count is number => count !== null);
    services.push({
      presetId,
      participants: items.length,
      medianMonthlyKRW: median(items.map((item) => item.monthlyKRW)) ?? 0,
      medianUsage: usages.length >= STATS_MIN_PER_SERVICE ? median(usages) : null,
    });
  }
  services.sort((a, b) => b.participants - a.participants);

  return { participants, overall, services };
}
