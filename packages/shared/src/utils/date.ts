import { BillingCycle } from "../types";

/** Everything needed to work out when a subscription is charged next. */
export interface BillingSchedule {
  billingDay: number;
  billingCycle?: BillingCycle;
  /** 1-12. Required for a yearly plan; ignored for a monthly one. */
  billingMonth?: number;
}

/** Clamps a day to a month that may be shorter, the way card issuers do. */
function effectiveDay(year: number, monthIndex: number, billingDay: number): number {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(billingDay, lastDay);
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

function startOfDay(date: Date): Date {
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
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isPaymentImminent(
  billingDay: number,
  thresholdDays: number,
  now: Date = new Date(),
): boolean {
  const daysLeft = getDaysUntilBilling(billingDay, now);
  return daysLeft >= 0 && daysLeft <= thresholdDays;
}

export function formatDday(daysLeft: number): string {
  if (daysLeft === 0) return "D-Day";
  if (daysLeft > 0) return `D-${daysLeft}`;
  return `D+${Math.abs(daysLeft)}`;
}

export function formatCountdown(targetDate: Date, now: Date = new Date()): string {
  const diffTime = targetDate.getTime() - now.getTime();
  if (diffTime <= 0) return "D-Day 00:00:00";

  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

  const formatUnit = (unit: number) => unit.toString().padStart(2, "0");

  return `D-${days} ${formatUnit(hours)}:${formatUnit(minutes)}:${formatUnit(seconds)}`;
}
