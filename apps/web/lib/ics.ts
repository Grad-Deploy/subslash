import { cancelNoteFor, needsBillingMonth, type BillingCycle } from "@subslash/shared";

/**
 * 결제일을 캘린더 일정으로 옮기는 규칙(RFC 5545의 RRULE·일정 본문). '구글 캘린더에 결제일 등록'
 * (`lib/calendar-sync`)이 쓴다. 예전에는 캘린더 피드(.ics)도 이 규칙으로 만들었다 — 피드는 결제 알림
 * 메일과 함께 그만뒀다.
 */

export interface CalendarEntry {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth?: number | null;
  /** 이 구독의 해지 주소. 브라우저가 계획에 실어 보낸다. 없으면 일정 메모에 해지 줄이 없다. */
  cancelUrl?: string | null;
}

/**
 * Repeat rule for a billing date.
 *
 * Days 29-31 do not exist in every month. `BYMONTHDAY=<day>,-1;BYSETPOS=1`
 * takes the earlier of "that day" and "the last day of the month", which is the
 * same clamping the app applies when it works out the next billing date. A
 * yearly plan pins the month as well, so Feb 29 lands on Feb 28 off-leap-years
 * instead of skipping three years at a time.
 */
export function billingRRule(entry: {
  billingDay: number;
  billingCycle?: string;
  billingMonth?: number | null;
}): string {
  const dayPart =
    entry.billingDay <= 28
      ? `BYMONTHDAY=${entry.billingDay}`
      : `BYMONTHDAY=${entry.billingDay},-1;BYSETPOS=1`;

  if (entry.billingCycle === "yearly" && entry.billingMonth) {
    return `FREQ=YEARLY;BYMONTH=${entry.billingMonth};${dayPart}`;
  }
  return `FREQ=MONTHLY;${dayPart}`;
}

/** Subscriptions that can be placed on a calendar. */
export function calendarEligible(entries: CalendarEntry[]): CalendarEntry[] {
  // A yearly plan whose billing month was never recorded has no date to
  // publish. Emitting it as a monthly event would put eleven charges on the
  // calendar that will never happen.
  return entries.filter(
    (entry) =>
      !needsBillingMonth({
        billingDay: entry.billingDay,
        billingCycle: entry.billingCycle as BillingCycle,
        billingMonth: entry.billingMonth ?? undefined,
      }),
  );
}

/**
 * 일정 본문. 캘린더 앱은 본문의 주소를 눌러 열 수 있게 보여주므로, 결제일 알림에서 바로 구독을
 * 고치거나 해지하러 갈 수 있다.
 */
export function eventDescription(entry: CalendarEntry, detailUrl: string | null): string {
  const parts = [
    `${entry.name} 결제일입니다. 지난 30일 동안 몇 번 썼는지 돌아보고, 아깝다면 지금 해지하세요.`,
  ];

  // 해지하려고 캘린더를 연 사람이 앱을 다시 열지 않아도 되게, 갈 곳을 메모에 적는다.
  const cancelNote = cancelNoteFor(entry.cancelUrl);
  if (cancelNote) parts.push(cancelNote);

  if (detailUrl) {
    // 구독 기록은 서버가 아니라 기기에 있다. 등록한 기기가 아니면 열어도 보이지 않으므로 미리
    // 적어 둔다. 로그인한 기기끼리는 계정 동기화로 맞춰지므로 그 길도 함께 알린다.
    parts.push(
      `구독 보기·수정: ${detailUrl}\n(이 구독을 등록한 기기에서 열거나, 로그인해 두면 다른 기기에서도 보입니다)`,
    );
  }

  return parts.join("\n\n");
}
