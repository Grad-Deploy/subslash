import type { Subscription } from "@subslash/shared";

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
  return subscriptions
    .filter((sub) => sub.status === "active")
    .map((sub) => ({
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      billingDay: sub.billingDay,
      billingCycle: sub.billingCycle,
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

export async function requestReminders(email: string, reminderDays: number) {
  const response = await fetch("/api/notify/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, reminderDays }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "알림 신청에 실패했습니다."));
  }

  return (await response.json()) as {
    syncToken: string;
    email: string;
    reminderDays: number;
    verified: boolean;
  };
}

export async function pushMirror(syncToken: string, subscriptions: Subscription[]) {
  const response = await fetch("/api/notify/sync", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${syncToken}`,
    },
    body: JSON.stringify({ subscriptions: toMirrorPayload(subscriptions) }),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "동기화에 실패했습니다."));
  }

  return (await response.json()) as { synced: number; skipped: number; verified: boolean };
}

export async function fetchNotifyStatus(syncToken: string): Promise<NotifyStatus | null> {
  const response = await fetch("/api/notify/sync", {
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await readError(response, "상태를 불러오지 못했습니다."));
  return (await response.json()) as NotifyStatus;
}

/**
 * Turns the calendar feed on, or rotates its URL.
 *
 * The returned URL is shown once: the server keeps only a hash of the token
 * inside it, so a lost URL is replaced rather than looked up.
 */
export async function enableCalendarFeed(syncToken: string): Promise<string> {
  const response = await fetch("/api/notify/calendar", {
    method: "POST",
    headers: { Authorization: `Bearer ${syncToken}` },
  });

  if (!response.ok) {
    throw new Error(await readError(response, "캘린더 주소를 만들지 못했습니다."));
  }

  const body = (await response.json()) as { url: string };
  return body.url;
}

/** Switches the feed off; calendars subscribed to the old URL stop resolving. */
export async function disableCalendarFeed(syncToken: string) {
  const response = await fetch("/api/notify/calendar", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readError(response, "캘린더 구독 해제에 실패했습니다."));
  }
}

export async function stopReminders(syncToken: string) {
  const response = await fetch("/api/notify/sync", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readError(response, "알림 해제에 실패했습니다."));
  }
}
