import { formatAmount, getNextBillingDate, type Currency } from "@subslash/shared";

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
 * Repeat rule for a billing day.
 *
 * Days 29-31 do not exist in every month. `BYMONTHDAY=<day>,-1;BYSETPOS=1`
 * takes the earlier of "that day" and "the last day of the month", which is the
 * same clamping `getNextBillingDate` applies in the app.
 */
export function billingRRule(billingDay: number): string {
  if (billingDay <= 28) return `FREQ=MONTHLY;BYMONTHDAY=${billingDay}`;
  return `FREQ=MONTHLY;BYMONTHDAY=${billingDay},-1;BYSETPOS=1`;
}

/** Subscriptions this feed can place on a calendar. */
export function calendarEligible(entries: CalendarEntry[]): CalendarEntry[] {
  // A yearly plan records the day of the month but not which month, so the
  // feed has no date to publish. Emitting it as a monthly event would put
  // eleven charges on the calendar that will never happen.
  return entries.filter((entry) => entry.billingCycle !== "yearly");
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
    const start = getNextBillingDate(entry.billingDay, now);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const currency: Currency = entry.currency === "USD" ? "USD" : "KRW";
    const price = formatAmount(entry.amount, currency);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(entry.clientId)}@subslash`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toDateValue(start)}`,
      `DTEND;VALUE=DATE:${toDateValue(end)}`,
      `RRULE:${billingRRule(entry.billingDay)}`,
      `SUMMARY:💳 ${escapeText(entry.name)} ${escapeText(price)}`,
      `DESCRIPTION:${escapeText(
        `${entry.name} 결제일입니다. 지난 30일 동안 몇 번 썼는지 돌아보고, 아깝다면 지금 해지하세요.`,
      )}`,
      "TRANSP:TRANSPARENT",
    );

    if (options.appUrl) {
      lines.push(`URL:${escapeText(options.appUrl)}/subs`);
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
