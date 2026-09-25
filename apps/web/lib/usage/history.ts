/**
 * 폰 사용 기록을 기기에 쌓고 기간별로 합치는 순수 함수들.
 *
 * 안드로이드는 이벤트 기록을 오래 두지 않아서(기기마다 다르다), 앱이 열릴 때마다 최근 며칠을 읽어
 * 날짜별로 쌓는다. 날짜 칸이 있으면 '그날은 기록이 있다'는 뜻이고, 칸 안에 없는 앱은 그날 0이다.
 * 칸이 없는 날은 **모른다** — 0으로 읽지 않는다(앱을 안 연 날과 기록이 지워진 날은 다르다).
 */

/** 날짜 → 패키지 → [사용 시간(ms), 쓴 횟수] */
export type UsageDays = Record<string, Record<string, [number, number]>>;

export interface UsageHistory {
  v: 1;
  days: UsageDays;
  /** 마지막으로 읽은 시각(ISO). 다음에 며칠을 읽을지 정한다. */
  syncedAt: string | null;
}

export const EMPTY_HISTORY: UsageHistory = { v: 1, days: {}, syncedAt: null };

/** 이보다 오래된 날은 지운다(1년 추이 + 여유). */
export const KEEP_DAYS = 400;

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 오늘을 포함한 최근 n일의 날짜(오래된 것부터). */
export function lastDays(now: Date, n: number): string[] {
  return Array.from({ length: n }, (_, i) => dayKey(addDays(now, i - (n - 1))));
}

export function parseHistory(raw: string | null): UsageHistory {
  if (!raw) return EMPTY_HISTORY;
  try {
    const parsed = JSON.parse(raw) as Partial<UsageHistory>;
    if (parsed.v !== 1 || typeof parsed.days !== "object" || parsed.days === null) {
      return EMPTY_HISTORY;
    }
    return { v: 1, days: parsed.days, syncedAt: parsed.syncedAt ?? null };
  } catch {
    return EMPTY_HISTORY;
  }
}

/** 다음에 읽을 날 수. 처음이면 운영체제가 남겨 둔 만큼(최대 35일), 아니면 지난번 이후 + 하루. */
export function daysToQuery(history: UsageHistory, now: Date): number {
  if (!history.syncedAt) return 35;
  const since = (now.getTime() - Date.parse(history.syncedAt)) / 86_400_000;
  return Math.max(2, Math.min(35, Math.ceil(since) + 1));
}

/**
 * 읽은 결과를 쌓는다. 기록이 있는 날(그날 자정부터 받은 날)만 칸을 만들고 덮어쓴다.
 *
 * 요청한 첫날에 기록이 없거나 그날 중간부터 있으면(운영체제가 앞을 지웠으면) 그날은 일부만 있는
 * 것이라 쌓지 않는다. 그다음 날부터가 온전하다.
 */
export function mergeUsage(
  history: UsageHistory,
  result: {
    from: number;
    dataFrom: number | null;
    days: { date: string; pkg: string; foregroundMs: number; opens: number }[];
  },
  queriedDays: number,
  now: Date,
): UsageHistory {
  const requested = lastDays(now, queriedDays);
  let firstComplete = 0;
  if (result.dataFrom === null) {
    // 기록이 하나도 없다. 폰을 전혀 안 썼다기보다 읽지 못한 것이라 아무 날도 쌓지 않는다.
    return { ...history, syncedAt: now.toISOString() };
  }
  const firstDataDay = dayKey(new Date(result.dataFrom));
  if (firstDataDay !== requested[0]) {
    const index = requested.indexOf(firstDataDay);
    firstComplete = index < 0 ? requested.length : index + 1;
  }

  const days: UsageDays = { ...history.days };
  for (const date of requested.slice(firstComplete)) days[date] = {};
  for (const row of result.days) {
    const day = days[row.date];
    // 온전하지 않은 날(위에서 칸을 만들지 않은 날)은 버린다.
    if (!day || !requested.slice(firstComplete).includes(row.date)) continue;
    day[row.pkg] = [row.foregroundMs, row.opens];
  }

  const oldest = dayKey(addDays(now, -KEEP_DAYS));
  for (const date of Object.keys(days)) if (date < oldest) delete days[date];

  return { v: 1, days, syncedAt: now.toISOString() };
}

export interface UsageTotals {
  ms: number;
  opens: number;
  /** 이 기간 중 기록이 있는 날 수. 0이면 모른다. */
  coveredDays: number;
}

/** 날짜 목록 동안 패키지들의 사용 합계. */
export function totalsFor(
  history: UsageHistory,
  packages: readonly string[],
  dates: readonly string[],
): UsageTotals {
  let ms = 0;
  let opens = 0;
  let coveredDays = 0;
  for (const date of dates) {
    const day = history.days[date];
    if (!day) continue;
    coveredDays += 1;
    for (const pkg of packages) {
      const entry = day[pkg];
      if (!entry) continue;
      ms += entry[0];
      opens += entry[1];
    }
  }
  return { ms, opens, coveredDays };
}

/** 기록이 있는 가장 이른 날(없으면 null). */
export function firstRecordedDay(history: UsageHistory): string | null {
  const keys = Object.keys(history.days).sort();
  return keys[0] ?? null;
}

/** 최근 12개월(이번 달 포함, 오래된 것부터)의 달별 합계. */
export function monthlyTotals(
  history: UsageHistory,
  packages: readonly string[],
  now: Date,
): { month: string; label: string; totals: UsageTotals }[] {
  const months: { month: string; label: string; totals: UsageTotals }[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const first = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`;
    const last =
      i === 0 ? now.getDate() : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const dates = Array.from(
      { length: last },
      (_, d) => `${month}-${String(d + 1).padStart(2, "0")}`,
    );
    months.push({
      month,
      label: `${first.getMonth() + 1}월`,
      totals: totalsFor(history, packages, dates),
    });
  }
  return months;
}

/** '12시간 10분', '40분', '1분 미만'. */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return ms > 0 ? "1분 미만" : "0분";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
