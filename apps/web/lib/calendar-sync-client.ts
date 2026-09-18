import { currentCancelUrl, getBilledAmount, type Subscription } from "@subslash/shared";
import { apiUrl } from "./api";

/**
 * '구글 캘린더에 등록'의 브라우저 쪽.
 *
 * 구독 기록은 브라우저에 있으므로, 캘린더에 올릴 결제일도 브라우저가 만들어 보낸다. 서버는 이
 * 목록을 10분 동안만 들고 있다가 사용자의 Apps Script 웹 앱에 넘긴다 — 캘린더에 쓰는 것은
 * SubSlash가 아니라 그 사람의 Google 권한이다.
 */

export interface CalendarPlanEntryInput {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth: number | null;
  /** 캘린더 일정 메모에 적을 해지 주소. 없으면 메모에 해지 줄이 없다. */
  cancelUrl?: string;
}

/**
 * 캘린더에 올릴 구독. 알림 미러와 같은 규칙을 따른다 — 구독 중인 것만, 필요한 칸만, 금액은 카드에
 * 찍히는 값(`getBilledAmount`)으로 보낸다. 체크인·절약 기록과 해지한 구독은 보내지 않는다.
 */
export function toCalendarPlanEntries(subscriptions: Subscription[]): CalendarPlanEntryInput[] {
  return subscriptions
    .filter((sub) => sub.status === "active")
    .map((sub) => ({
      clientId: sub.id,
      name: sub.name,
      amount: getBilledAmount(sub),
      currency: sub.currency,
      billingDay: sub.billingDay,
      billingCycle: sub.billingCycle,
      billingMonth: sub.billingMonth ?? null,
      // 해지하려고 캘린더를 연 사람이 앱을 다시 열지 않아도 되게 메모에 적는다. 사용자가 이
      // 구독에 적어 둔 주소를 그대로 쓴다 — 이름으로 짐작해 붙이면 엉뚱한 곳으로 보낼 수 있다.
      cancelUrl: sub.cancelUrl ? currentCancelUrl(sub.cancelUrl) : undefined,
    }));
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 결제일을 맡기고, 갈 주소(SubSlash의 Apps Script 웹 앱)를 받는다. 그 주소로 가면 Google이 권한을
 * 묻고, 허용하면 그 자리에서 이 사람의 캘린더에 결제일이 들어간다.
 */
export async function startCalendarSync(
  entries: CalendarPlanEntryInput[],
  reminderDays: number,
): Promise<string> {
  const response = await fetch(apiUrl("/api/calendar-sync"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ entries, reminderDays }),
  });
  if (!response.ok) {
    throw new Error(await readError(response, "캘린더 등록을 시작하지 못했습니다."));
  }
  return ((await response.json()) as { url: string }).url;
}
