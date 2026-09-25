import { and, eq, isNull, lt, ne } from "drizzle-orm";
import { getDb } from "./db";
import {
  mirroredSubscriptions,
  notificationLog,
  notificationSubscribers,
  type NotificationSubscriber,
} from "./schema";
import { hashSyncToken } from "./tokens";

/** Resolves the caller from the `Authorization: Bearer <syncToken>` header. */
export async function userFromRequest(request: Request): Promise<NotificationSubscriber | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const rows = await getDb()
    .select()
    .from(notificationSubscribers)
    .where(eq(notificationSubscribers.syncTokenHash, hashSyncToken(token)))
    .limit(1);

  return rows[0] ?? null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

/**
 * Removes a user and everything the server held about them.
 *
 * The migration declares ON DELETE CASCADE, but SQLite only honours it when
 * `PRAGMA foreign_keys` is on — which is off by default and not guaranteed by
 * the driver. Deleting the children explicitly makes opting out reliable
 * regardless of that setting.
 */
export async function deleteUserCompletely(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(mirroredSubscriptions).where(eq(mirroredSubscriptions.userId, userId));
  await db.delete(notificationLog).where(eq(notificationLog.userId, userId));
  await db.delete(notificationSubscribers).where(eq(notificationSubscribers.id, userId));
}

/** 같은 주소의 확인 전 신청을 지운다. 새로 신청하면 예전 확인 메일은 쓸모가 없다. */
export async function deletePendingSubscribers(email: string): Promise<void> {
  const rows = await getDb()
    .select({ id: notificationSubscribers.id })
    .from(notificationSubscribers)
    .where(
      and(eq(notificationSubscribers.email, email), isNull(notificationSubscribers.verifiedAt)),
    );
  for (const row of rows) await deleteUserCompletely(row.id);
}

/**
 * 확인 링크를 누른 기록을 이 주소의 알림으로 삼는다. 같은 주소의 다른 기록(예전 기기의 확인된 기록,
 * 다른 확인 전 신청)은 지운다 — 이 주소로 알림을 받는 곳은 하나다. 기록이 이미 없으면(더 새로 신청해
 * 지워졌거나 알림을 껐다) `false`.
 */
export async function confirmSubscriber(id: string, now: Date = new Date()): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: notificationSubscribers.id, email: notificationSubscribers.email })
    .from(notificationSubscribers)
    .where(eq(notificationSubscribers.id, id))
    .limit(1);
  if (!row) return false;

  const others = await db
    .select({ id: notificationSubscribers.id })
    .from(notificationSubscribers)
    .where(and(eq(notificationSubscribers.email, row.email), ne(notificationSubscribers.id, id)));
  for (const other of others) await deleteUserCompletely(other.id);

  await db
    .update(notificationSubscribers)
    .set({ verifiedAt: now.toISOString() })
    .where(and(eq(notificationSubscribers.id, id), isNull(notificationSubscribers.verifiedAt)));
  return true;
}

/** 확인 링크(3일)가 끝나도록 확인하지 않은 신청. 누구의 주소인지 확인되지 않은 채 남겨 두지 않는다. */
export const PENDING_SUBSCRIBER_TTL_DAYS = 3;

/** 확인하지 않고 기간이 지난 신청을 지운다. 크론이 하루 한 번 부른다. 지운 수를 돌려준다. */
export async function prunePendingSubscribers(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PENDING_SUBSCRIBER_TTL_DAYS * 24 * 60 * 60 * 1000);
  // created_at은 SQLite의 datetime('now') 형식("YYYY-MM-DD HH:MM:SS", UTC)이다.
  const cutoffText = cutoff.toISOString().replace("T", " ").slice(0, 19);
  const rows = await getDb()
    .select({ id: notificationSubscribers.id })
    .from(notificationSubscribers)
    .where(
      and(
        isNull(notificationSubscribers.verifiedAt),
        lt(notificationSubscribers.createdAt, cutoffText),
      ),
    );
  for (const row of rows) await deleteUserCompletely(row.id);
  return rows.length;
}
