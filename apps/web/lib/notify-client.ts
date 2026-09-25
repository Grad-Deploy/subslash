import { currentCancelUrl, getBilledAmount, isInTrial, type Subscription } from "@subslash/shared";
import { apiUrl, readApiError } from "./api";

/**
 * Browser side of the reminder mirror.
 *
 * Only the fields the server needs are ever sent: no check-in history, no
 * savings pot, no cancel guides, no killed subscriptions.
 */

export interface NotifyStatus {
  email: string;
  verified: boolean;
  reminderDays: number;
  lastSyncedAt: string | null;
}

export function toMirrorPayload(subscriptions: Subscription[]) {
  return (
    subscriptions
      // 체험 중인 구독은 아직 청구되지 않는다. 알림도 캘린더도 없는 결제를 알리면 안 된다.
      .filter((sub) => sub.status === "active" && !isInTrial(sub))
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        // 알림 메일·캘린더에는 카드에 찍힐 금액을 적는다. 세금은 여기서 더해 보내므로 서버의
        // 미러 표는 칸이 늘지 않는다.
        amount: getBilledAmount(sub),
        currency: sub.currency,
        billingDay: sub.billingDay,
        billingCycle: sub.billingCycle,
        billingMonth: sub.billingMonth ?? null,
        // 캘린더 피드의 일정 메모에 적는다. 해지하려고 캘린더를 연 사람이 앱을 다시 열지 않아도 되게.
        cancelUrl: sub.cancelUrl ? currentCancelUrl(sub.cancelUrl) : null,
      }))
  );
}

/**
 * 서버가 이 브라우저의 동기화 토큰을 모른다(401). 메일의 '수신 거부'를 눌렀거나, 같은 주소로
 * 다른 곳에서 다시 신청해 서버의 기록이 지워진 경우다. 다시 보내도 통하지 않으므로, 네트워크
 * 오류처럼 다음 변경 때 다시 보낼 실패와 구분한다.
 */
export class SyncTokenRejectedError extends Error {
  constructor() {
    super("서버에 이 브라우저의 알림 기록이 없습니다. 알림을 다시 신청해주세요.");
    this.name = "SyncTokenRejectedError";
  }
}

export async function requestReminders(email: string, reminderDays: number) {
  const response = await fetch(apiUrl("/api/notify/subscribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, reminderDays }),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "알림 신청에 실패했습니다."));
  }

  return (await response.json()) as {
    syncToken: string;
    email: string;
    reminderDays: number;
    verified: boolean;
  };
}

export async function pushMirror(syncToken: string, subscriptions: Subscription[]) {
  const response = await fetch(apiUrl("/api/notify/sync"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${syncToken}`,
    },
    body: JSON.stringify({ subscriptions: toMirrorPayload(subscriptions) }),
  });

  if (response.status === 401) throw new SyncTokenRejectedError();
  if (!response.ok) {
    throw new Error(await readApiError(response, "동기화에 실패했습니다."));
  }

  return (await response.json()) as { synced: number; skipped: number; verified: boolean };
}

export async function fetchNotifyStatus(syncToken: string): Promise<NotifyStatus | null> {
  const response = await fetch(apiUrl("/api/notify/sync"), {
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await readApiError(response, "상태를 불러오지 못했습니다."));
  return (await response.json()) as NotifyStatus;
}

/**
 * Turns the calendar feed on, or rotates its URL.
 *
 * The returned URL is shown once: the server keeps only a hash of the token
 * inside it, so a lost URL is replaced rather than looked up.
 */
export async function enableCalendarFeed(syncToken: string): Promise<string> {
  const response = await fetch(apiUrl("/api/notify/calendar"), {
    method: "POST",
    headers: { Authorization: `Bearer ${syncToken}` },
  });

  if (response.status === 401) throw new SyncTokenRejectedError();
  if (!response.ok) {
    throw new Error(await readApiError(response, "캘린더 주소를 만들지 못했습니다."));
  }

  const body = (await response.json()) as { url: string };
  return body.url;
}

/**
 * 캘린더 주소를 캘린더 앱에 바로 넘기는 링크.
 *
 * `webcal://`은 운영체제가 기본 캘린더 앱(iPhone·Mac 캘린더, Outlook 등)에 넘기는 구독 주소이고,
 * Google 캘린더는 웹 화면에서 `cid`로 받은 주소를 구독한다. 둘 다 서버가 준 피드 주소로 만들므로,
 * 앱(Capacitor) 안에서도 앱 주소가 아니라 배포된 웹 주소를 가리킨다.
 */
export function calendarSubscribeLinks(feedUrl: string): { webcal: string; google: string } {
  const webcal = feedUrl.replace(/^https?:\/\//, "webcal://");
  return {
    webcal,
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
  };
}

/** Switches the feed off; calendars subscribed to the old URL stop resolving. */
export async function disableCalendarFeed(syncToken: string) {
  const response = await fetch(apiUrl("/api/notify/calendar"), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readApiError(response, "캘린더 구독 해제에 실패했습니다."));
  }
}

export async function stopReminders(syncToken: string) {
  const response = await fetch(apiUrl("/api/notify/sync"), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readApiError(response, "알림 해제에 실패했습니다."));
  }
}
