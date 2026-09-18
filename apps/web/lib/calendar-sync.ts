import { eq, lt } from "drizzle-orm";
import {
  formatAmount,
  getNextBillingDateFor,
  type BillingCycle,
  type Currency,
} from "@subslash/shared";
import { getDb } from "./db";
import { calendarSyncPlans } from "./schema";
import { generateSyncToken, hashSyncToken } from "./tokens";
import { billingRRule, calendarEligible, eventDescription, type CalendarEntry } from "./ics";
import { subscriptionDetailHref } from "./routes";

/**
 * '구글 캘린더에 등록'의 서버 쪽.
 *
 * SubSlash는 Google 캘린더 권한을 받지 않는다. 버튼을 누르면 브라우저가 지금 구독의 결제일을
 * 계획으로 맡기고, 사용자의 권한으로 도는 SubSlash Apps Script 웹 앱이 그 계획을 받아 **자기**
 * 캘린더에 쓴다. 서버는 그 사이에서 계획을 10분 동안만 들고 있다 — 받아 가면 곧바로 지운다.
 *
 * 캘린더 피드(`/api/calendar/[token]`)와는 다른 길이다. 피드는 캘린더 앱이 주소를 다시 읽을 때까지
 * 기다려야 하고 알림도 캘린더 설정을 따르지만, 이쪽은 누른 그 자리에서 진짜 일정으로 들어간다.
 */

/** 계획을 받아 갈 수 있는 시간. Google 권한 화면을 읽고 허용하기에 넉넉하다(연결 코드와 같다). */
export const CALENDAR_PLAN_TTL_MS = 10 * 60 * 1000;

/** 한 번에 맡길 수 있는 구독 수. 넘으면 400으로 거절한다 — 조용히 자르면 빠진 줄 모른다. */
export const MAX_PLAN_ENTRIES = 200;

/** 캘린더가 알림을 낼 수 있는 가장 이른 시점(4주). Google이 그보다 앞선 알림을 거절한다. */
const MAX_REMINDER_DAYS = 28;

/** 결제일을 쓰는 캘린더 이름. 전용 캘린더라 통째로 지우면 결제일만 사라진다. */
export const CALENDAR_NAME = "SubSlash 결제일";

export interface CalendarPlanEntry extends CalendarEntry {
  billingMonth: number | null;
}

export interface CalendarPlan {
  entries: CalendarPlanEntry[];
  /** 며칠 전에 알릴지. 알림 설정의 값을 그대로 쓴다. 0이면 결제일 아침에 알린다. */
  reminderDays: number;
}

/** 웹 앱이 받아 캘린더에 쓰는 일정 하나. RRULE은 캘린더 피드와 같은 규칙을 쓴다. */
export interface CalendarSyncEvent {
  uid: string;
  summary: string;
  description: string;
  /** 종일 일정의 시작·끝(YYYY-MM-DD). 끝은 다음 날이다(RFC 5545와 같다). */
  start: string;
  end: string;
  rrule: string;
  /** 일정 시작(결제일 0시) 기준으로 몇 분 전에 알릴지. */
  reminderMinutes: number;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * 브라우저가 보낸 계획을 다시 검사한다.
 *
 * 브라우저에서 만든 값이라 서버가 그대로 믿지 않는다(알림 미러·계정 백업과 같은 규칙). 결제일을
 * 모르는 연간 구독은 `calendarEligible`이 걸러낸다 — 결제 월이 없으면 매달 결제가 있는 것처럼
 * 캘린더에 열한 번 더 찍힌다.
 */
export function parseCalendarPlan(input: unknown): CalendarPlan | null {
  if (!input || typeof input !== "object") return null;
  const body = input as { entries?: unknown; reminderDays?: unknown };
  if (!Array.isArray(body.entries)) return null;
  if (body.entries.length > MAX_PLAN_ENTRIES) return null;

  const entries: CalendarPlanEntry[] = [];
  for (const raw of body.entries) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 120) : "";
    const clientId = typeof item.clientId === "string" ? item.clientId.slice(0, 120) : "";
    const cycle = item.billingCycle === "yearly" ? "yearly" : "monthly";
    const month = isFiniteNumber(item.billingMonth) ? Math.trunc(item.billingMonth) : null;
    if (!name || !clientId) return null;
    if (!isFiniteNumber(item.amount) || item.amount < 0) return null;
    if (!isFiniteNumber(item.billingDay)) return null;
    const day = Math.trunc(item.billingDay);
    if (day < 1 || day > 31) return null;
    if (month !== null && (month < 1 || month > 12)) return null;

    entries.push({
      clientId,
      name,
      amount: item.amount,
      currency: item.currency === "USD" ? "USD" : "KRW",
      billingDay: day,
      billingCycle: cycle,
      billingMonth: month,
    });
  }

  const reminderDays = isFiniteNumber(body.reminderDays) ? Math.trunc(body.reminderDays) : 0;
  return {
    entries,
    reminderDays: Math.min(Math.max(reminderDays, 0), MAX_REMINDER_DAYS),
  };
}

function toDateValue(date: Date): string {
  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")}`
  );
}

/**
 * 계획을 캘린더 일정으로. 다음 결제일부터 반복한다.
 *
 * 금액은 요금표 가격(`amount`)이 아니라 계획에 담겨 온 값을 그대로 쓴다 — 브라우저가 카드에
 * 찍히는 금액(`getBilledAmount`)을 넣어 보낸다. 캘린더에 뜨는 숫자는 결제 화면에서 볼 숫자여야
 * 한다.
 */
export function buildCalendarEvents(
  plan: CalendarPlan,
  options: { appUrl?: string; now?: Date } = {},
): CalendarSyncEvent[] {
  const now = options.now ?? new Date();
  const events: CalendarSyncEvent[] = [];
  for (const entry of calendarEligible(plan.entries)) {
    const start = getNextBillingDateFor(
      {
        billingDay: entry.billingDay,
        billingCycle: entry.billingCycle as BillingCycle,
        billingMonth: entry.billingMonth ?? undefined,
      },
      now,
    );
    // calendarEligible이 결제일을 모르는 것을 이미 걸렀다. 타입을 억지로 좁히지 않는다.
    if (!start) continue;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    const currency: Currency = entry.currency === "USD" ? "USD" : "KRW";
    const price = formatAmount(entry.amount, currency);

    events.push({
      uid: entry.clientId,
      summary: `💳 ${entry.name} ${price}`,
      description: eventDescription(
        entry,
        options.appUrl ? `${options.appUrl}${subscriptionDetailHref(entry.clientId)}` : null,
      ),
      start: toDateValue(start),
      end: toDateValue(end),
      rrule: billingRRule(entry),
      reminderMinutes: plan.reminderDays * 24 * 60,
    });
  }
  return events;
}

/**
 * 계획을 맡기고 1회용 코드를 받는다. 계정마다 한 벌이라 다시 누르면 앞의 계획과 코드가 함께
 * 버려진다 — 두 번 눌렀을 때 예전 목록이 캘린더에 들어가지 않는다.
 */
export async function createCalendarSyncPlan(
  accountId: string,
  plan: CalendarPlan,
  now = new Date(),
): Promise<string> {
  const code = generateSyncToken();
  const values = {
    accountId,
    codeHash: hashSyncToken(code),
    payload: JSON.stringify(plan),
    createdAt: now.toISOString(),
  };
  await getDb()
    .insert(calendarSyncPlans)
    .values(values)
    .onConflictDoUpdate({ target: calendarSyncPlans.accountId, set: values });
  return code;
}

/**
 * 웹 앱이 코드를 계획으로 바꾼다. 한 번 받아 가면 지운다 — 같은 주소를 다시 열어도 캘린더가 또
 * 채워지지 않는다. 10분이 지난 계획은 주지 않고 지운다.
 */
export async function claimCalendarSyncPlan(
  code: string,
  now = new Date(),
): Promise<CalendarPlan | null> {
  const db = getDb();
  // 먼저 만료된 것을 치운다. 받아 가지 않은 계획이 쌓이지 않게 하는 유일한 경로다.
  await db
    .delete(calendarSyncPlans)
    .where(
      lt(calendarSyncPlans.createdAt, new Date(now.getTime() - CALENDAR_PLAN_TTL_MS).toISOString()),
    );

  const [row] = await db
    .delete(calendarSyncPlans)
    .where(eq(calendarSyncPlans.codeHash, hashSyncToken(code)))
    .returning({ payload: calendarSyncPlans.payload });
  if (!row) return null;

  try {
    return parseCalendarPlan(JSON.parse(row.payload));
  } catch {
    return null;
  }
}

/** 맡겨 둔 계획을 지운다. 연결 끊기·회원 탈퇴가 부른다. */
export async function deleteCalendarSyncPlan(accountId: string): Promise<void> {
  await getDb().delete(calendarSyncPlans).where(eq(calendarSyncPlans.accountId, accountId));
}

/** 테스트가 쓰는, 아직 안 지워진 계획 수. */
export async function countCalendarSyncPlans(accountId: string): Promise<number> {
  const rows = await getDb()
    .select({ accountId: calendarSyncPlans.accountId })
    .from(calendarSyncPlans)
    .where(eq(calendarSyncPlans.accountId, accountId));
  return rows.length;
}
