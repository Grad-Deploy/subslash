import { BillingCycle } from "../types";

/** 한 시간·하루의 밀리초. 파일마다 따로 적던 것을 여기 모았다. */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** 두 자리로(`7` → `"07"`). 날짜·시각을 손으로 조립할 때 쓴다. */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 기기 시간대의 날짜를 `YYYY-MM-DD`로. 파일마다 따로 적던 것을 여기 모았다. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 기기 시간대의 달을 `YYYY-MM`로. */
export function localMonthKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

/** 기기 시간대의 날짜를 `2026.10.07`로. 영수증·메일 날짜와 같은 모양이다. */
export function formatDotDate(date: Date): string {
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

/** 기기 시간대의 시각을 `HH:mm`로(24시간). */
export function formatClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Everything needed to work out when a subscription is charged next. */
export interface BillingSchedule {
  billingDay: number;
  billingCycle?: BillingCycle;
  /** 1-12. Required for a yearly plan; ignored for a monthly one. */
  billingMonth?: number;
}

/** 그 달의 날 수(= 말일). monthIndex는 0~11. */
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** 카드 회사가 하는 것처럼, 그 달에 없는 날짜(2월 30일 등)는 말일로 당긴다. 결제 캘린더도 이 함수를 쓴다. */
export function effectiveDay(year: number, monthIndex: number, billingDay: number): number {
  return Math.min(billingDay, daysInMonth(year, monthIndex));
}

/**
 * The next charge date, for monthly and yearly plans alike.
 *
 * Returns null for a yearly plan whose billing month is unknown. A yearly plan
 * only records a day of the month, so without the month there is no date to
 * give — and treating it as monthly, which the app used to do everywhere, puts
 * eleven charges on the calendar that will never happen.
 */
export function getNextBillingDateFor(
  schedule: BillingSchedule,
  now: Date = new Date(),
): Date | null {
  if (schedule.billingCycle !== "yearly") {
    return getNextBillingDate(schedule.billingDay, now);
  }

  const month = schedule.billingMonth;
  if (!month || month < 1 || month > 12) return null;

  const monthIndex = month - 1;
  const thisYear = new Date(
    now.getFullYear(),
    monthIndex,
    effectiveDay(now.getFullYear(), monthIndex, schedule.billingDay),
  );

  // Same rule as the monthly path: the charge date itself counts as passed.
  if (thisYear.getTime() > startOfDay(now).getTime()) return thisYear;

  const nextYear = now.getFullYear() + 1;
  return new Date(nextYear, monthIndex, effectiveDay(nextYear, monthIndex, schedule.billingDay));
}

/**
 * 기록에 남긴 시각(ISO 문자열, 예: `killedAt`·`checkedAt`)을 Date로. 없거나 읽을 수 없으면 null — 모르는 시각을
 * 지어내지 않는다. `new Date(null)`은 1970년 1월 1일이 되고 깨진 값은 'Invalid Date'가 되므로, 시각 칸을 읽는 곳은
 * 저마다 검사하지 않고 이것을 쓴다. 날짜만 적은 칸(`trialEndsAt`·`reviewAt`)은 `parseDateOnly`다.
 */
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * `from`부터 `to`까지 지난 날 수 — 시간 차이를 24시간으로 나눠 내린 값이다(달력의 날짜 차이가 아니다). `to`가
 * 앞이면 음수다. '마지막 체크인으로부터 며칠'·'마지막 요금 확인으로부터 며칠'처럼 지난 기간을 셀 때 쓴다.
 */
export function daysBetween(from: Date | number, to: Date | number): number {
  return Math.floor((+to - +from) / DAY_MS);
}

/** 그 기기 시간대의 그날 0시. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Days until the next charge, or null when the date is unknown (a yearly plan
 * with no billing month). Callers must render that as "not set", never as 0.
 */
export function getDaysUntilBillingFor(
  schedule: BillingSchedule,
  now: Date = new Date(),
): number | null {
  const next = getNextBillingDateFor(schedule, now);
  if (!next) return null;
  return Math.ceil((next.getTime() - now.getTime()) / DAY_MS);
}

/** True when a yearly plan is missing the month it is charged in. */
export function needsBillingMonth(schedule: BillingSchedule): boolean {
  return schedule.billingCycle === "yearly" && !schedule.billingMonth;
}

export function getNextBillingDate(billingDay: number, now: Date = new Date()): Date {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDate = now.getDate();

  let nextBillingDate = new Date(currentYear, currentMonth, billingDay);

  // If the billing day is invalid for the current month (e.g., Feb 30), JS adjusts it to the next month automatically
  // But we want to cap it at the end of the month
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const effectiveBillingDay = Math.min(billingDay, lastDayOfCurrentMonth);
  nextBillingDate = new Date(currentYear, currentMonth, effectiveBillingDay);

  if (currentDate >= effectiveBillingDay) {
    // Need to calculate for the next month
    const lastDayOfNextMonth = new Date(currentYear, currentMonth + 2, 0).getDate();
    const nextEffectiveBillingDay = Math.min(billingDay, lastDayOfNextMonth);
    nextBillingDate = new Date(currentYear, currentMonth + 1, nextEffectiveBillingDay);
  }

  return nextBillingDate;
}

export function getDaysUntilBilling(billingDay: number, now: Date = new Date()): number {
  const nextBillingDate = getNextBillingDate(billingDay, now);
  const diffTime = nextBillingDate.getTime() - now.getTime();
  return Math.ceil(diffTime / DAY_MS);
}

export function formatDday(daysLeft: number): string {
  if (daysLeft === 0) return "D-Day";
  if (daysLeft > 0) return `D-${daysLeft}`;
  return `D+${Math.abs(daysLeft)}`;
}

/**
 * 남은 시간을 `HH:MM:SS`로. 날 수는 D-day 배지가 따로 적으므로 하루 안의 몫만 적고, 이미 지났거나 모르면(null)
 * `00:00:00`이다. 결제가 하루 남은 카드가 초 단위로 센다.
 */
export function formatTimeLeft(target: Date | null, now: Date = new Date()): string {
  const ms = target ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const minuteMs = 60 * 1000;
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / minuteMs);
  const seconds = Math.floor((ms % minuteMs) / 1000);
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

/**
 * 아직 무료 체험 중인지. 체험 종료일을 모르면 false다 — 모른다는 것을 "체험 중"으로 읽지 않는다.
 *
 * 종료일 당일은 체험이 끝나 결제가 시작되는 날로 본다. 이날부터는 보통 구독과 같다.
 */
export function isInTrial(sub: { trialEndsAt?: string }, now: Date = new Date()): boolean {
  if (!sub.trialEndsAt) return false;
  const ends = new Date(`${sub.trialEndsAt}T00:00:00`);
  if (Number.isNaN(ends.getTime())) return false;
  return startOfDay(now).getTime() < ends.getTime();
}

/**
 * 지금 카드에서 돈이 나가는 구독인지 — 구독 중이고 무료 체험 중이 아니다. 지출·1회 단가·결제 일정처럼 '내는 돈'을
 * 다루는 곳은 이것으로 고른다. 체험 중인 구독을 넣으면 내지도 않은 돈을 보이게 된다(CLAUDE.md '데이터 위치').
 */
export function isPaying(
  sub: { status: string; trialEndsAt?: string },
  now: Date = new Date(),
): boolean {
  return sub.status === "active" && !isInTrial(sub, now);
}

/** 체험이 끝나기까지 남은 날. 종료일을 모르거나 이미 끝났으면 null. */
export function getDaysUntilTrialEnd(
  sub: { trialEndsAt?: string },
  now: Date = new Date(),
): number | null {
  if (!isInTrial(sub, now)) return null;
  const ends = new Date(`${sub.trialEndsAt}T00:00:00`);
  return Math.round((ends.getTime() - startOfDay(now).getTime()) / DAY_MS);
}
