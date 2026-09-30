import { and, eq, inArray, isNull, lt, ne } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "./db";
import {
  mirroredSubscriptions,
  notificationLog,
  notificationSubscribers,
  type NotificationSubscriber,
} from "./schema";
import { hashSyncToken } from "./tokens";

/** 알림 미러에 저장하는 구독 한 줄. 알림과 캘린더 피드에 필요한 칸만 있다. */
export interface MirrorItem {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth: number | null;
  /** 캘린더 일정 메모에 적을 해지 주소. 없으면 null. */
  cancelUrl: string | null;
}

const MIRROR_FIELDS = [
  "name",
  "amount",
  "currency",
  "billingDay",
  "billingCycle",
  "billingMonth",
  "cancelUrl",
] as const satisfies readonly (keyof MirrorItem)[];

/**
 * 사용자의 미러를 브라우저가 보낸 목록으로 맞춘다. 결과는 통째로 바꾼 것과 같다 — 병합도 충돌 처리도 없이
 * 마지막으로 동기화한 기기가 서버 상태를 정한다 — 다만 바뀐 줄만 쓴다. 전부 지우고 다시 넣으면 구독이
 * 하나 바뀌어도 N줄을 쓰는데(Turso는 저장 용량보다 행 쓰기 횟수 한도가 먼저 찬다), 여기서는 새로 생긴
 * 줄은 넣고, 사라진 줄은 지우고, 값이 달라진 줄만 고치며, 그대로인 줄은 건드리지 않는다.
 * 같은 `clientId`가 여럿이면 마지막 것을 쓴다. 쓰기는 한 번에 묶어 중간에 끊겨도 반쪽이 남지 않는다.
 * 반영한 줄 수를 돌려준다.
 */
export async function replaceMirror(
  userId: string,
  items: MirrorItem[],
  now: string,
): Promise<number> {
  const db = getDb();
  const wanted = new Map(items.map((item) => [item.clientId, item]));
  const existing = new Map(
    (
      await db.select().from(mirroredSubscriptions).where(eq(mirroredSubscriptions.userId, userId))
    ).map((row) => [row.clientId, row]),
  );

  const writes: BatchItem<"sqlite">[] = [];
  const removed = [...existing.keys()].filter((clientId) => !wanted.has(clientId));
  if (removed.length > 0) {
    writes.push(
      db
        .delete(mirroredSubscriptions)
        .where(
          and(
            eq(mirroredSubscriptions.userId, userId),
            inArray(mirroredSubscriptions.clientId, removed),
          ),
        ),
    );
  }

  const added: (typeof mirroredSubscriptions.$inferInsert)[] = [];
  for (const [clientId, item] of wanted) {
    const row = existing.get(clientId);
    if (!row) {
      added.push({ ...item, userId, updatedAt: now });
    } else if (MIRROR_FIELDS.some((field) => row[field] !== item[field])) {
      writes.push(
        db
          .update(mirroredSubscriptions)
          .set({ ...item, updatedAt: now })
          .where(eq(mirroredSubscriptions.id, row.id)),
      );
    }
  }
  if (added.length > 0) writes.push(db.insert(mirroredSubscriptions).values(added));

  if (writes.length > 0) await db.batch(writes as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return wanted.size;
}

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

/**
 * 발송 기록(`notification_log`)을 남기는 기간. 이 표는 같은 결제일에 같은 알림을 두 번 보내지 않으려는
 * 것뿐이라, 결제일이 지난 기록은 다시 볼 일이 없다. 알림은 결제일 며칠 전에만 나가므로 두 달이면 넉넉하다.
 */
export const NOTIFICATION_LOG_RETENTION_DAYS = 60;

/** 결제일이 보관 기간보다 오래된 발송 기록을 지운다. 크론이 하루 한 번 부른다. 지운 수를 돌려준다. */
export async function pruneNotificationLog(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - NOTIFICATION_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  // billing_date는 YYYY-MM-DD 문자열이라 사전순 비교가 날짜순이다.
  const deleted = await getDb()
    .delete(notificationLog)
    .where(lt(notificationLog.billingDate, cutoff.toISOString().slice(0, 10)))
    .returning({ id: notificationLog.id });
  return deleted.length;
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
