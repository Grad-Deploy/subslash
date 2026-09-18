import {
  cancelNoteFor,
  formatAmount,
  getNextBillingDateFor,
  needsBillingMonth,
  type BillingCycle,
  type Currency,
} from "@subslash/shared";
import { subscriptionDetailHref } from "./routes";

/**
 * Builds the iCalendar feed a calendar app subscribes to.
 *
 * A feed beats a downloaded .ics file here: the user subscribes once and every
 * later edit in the app reaches their phone, with the reminder raised by the
 * calendar itself rather than by an email that has to be opened.
 */

export interface CalendarEntry {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth?: number | null;
  /**
   * 이 구독의 해지 주소. 캘린더 피드(`/api/calendar/[token]`)는 알림 미러에서 읽는데 그 표에는
   * 이 칸이 없으므로 늘 비어 있다 — 방침의 사전 고지 없이 서버 저장 칸을 늘리지 않기로 했다.
   * '구글 캘린더에 등록'은 브라우저가 계획에 실어 보내므로 채워진다.
   */
  cancelUrl?: string;
}

/** Escapes the characters RFC 5545 gives special meaning inside a TEXT value. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Folds a content line to 75 octets, counting bytes rather than characters:
 * Korean text is three bytes per character, so folding by length would leave
 * lines that some parsers reject.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  let limit = 75;

  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split inside a multi-byte character.
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end -= 1;
    }
    parts.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    // Continuation lines carry a leading space that counts toward the limit.
    limit = 74;
  }

  return parts.join("\r\n ");
}

function toDateValue(date: Date): string {
  return (
    `${date.getFullYear()}` +
    `${String(date.getMonth() + 1).padStart(2, "0")}` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}

function toUTCStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
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

/** Subscriptions this feed can place on a calendar. */
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
    // 구독 기록은 서버가 아니라 기록한 브라우저에 있다. 다른 기기에서 열면 "구독을 찾을 수
    // 없습니다"가 나오므로 미리 적어 둔다.
    parts.push(
      `구독 보기·수정: ${detailUrl}\n(SubSlash에 이 구독을 기록한 브라우저에서 열어야 보입니다)`,
    );
  }

  return parts.join("\n\n");
}

export function buildBillingCalendar(
  entries: CalendarEntry[],
  options: { reminderDays: number; now?: Date; appUrl?: string },
): string {
  const now = options.now ?? new Date();
  const stamp = toUTCStamp(now);
  const alarmTrigger = options.reminderDays > 0 ? `-P${options.reminderDays}D` : "PT0S";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SubSlash//Billing Calendar//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SubSlash 결제일",
    "X-WR-TIMEZONE:Asia/Seoul",
    // Calendar apps poll on their own schedule; this is a hint, not a promise.
    "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    "X-PUBLISHED-TTL:PT12H",
  ];

  for (const entry of calendarEligible(entries)) {
    const start = getNextBillingDateFor(
      {
        billingDay: entry.billingDay,
        billingCycle: entry.billingCycle as BillingCycle,
        billingMonth: entry.billingMonth ?? undefined,
      },
      now,
    );
    // calendarEligible already dropped the undated ones; this keeps the types
    // honest rather than asserting.
    if (!start) continue;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const currency: Currency = entry.currency === "USD" ? "USD" : "KRW";
    const price = formatAmount(entry.amount, currency);

    const detailUrl = options.appUrl
      ? `${options.appUrl}${subscriptionDetailHref(entry.clientId)}`
      : null;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(entry.clientId)}@subslash`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toDateValue(start)}`,
      `DTEND;VALUE=DATE:${toDateValue(end)}`,
      `RRULE:${billingRRule(entry)}`,
      `SUMMARY:💳 ${escapeText(entry.name)} ${escapeText(price)}`,
      `DESCRIPTION:${escapeText(eventDescription(entry, detailUrl))}`,
      "TRANSP:TRANSPARENT",
    );

    if (detailUrl) {
      lines.push(`URL:${escapeText(detailUrl)}`);
    }

    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:${alarmTrigger}`,
      `DESCRIPTION:${escapeText(`${entry.name} ${price} 결제가 곧 진행됩니다`)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings, including one after the last line.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
