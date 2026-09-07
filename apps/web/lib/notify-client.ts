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

export async function stopReminders(syncToken: string) {
  const response = await fetch("/api/notify/sync", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${syncToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error(await readError(response, "알림 해제에 실패했습니다."));
  }
}
