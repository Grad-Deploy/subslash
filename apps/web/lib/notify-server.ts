import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { mirroredSubscriptions, notificationLog, users, type User } from "./schema";
import { hashSyncToken } from "./tokens";

/** Resolves the caller from the `Authorization: Bearer <syncToken>` header. */
export async function userFromRequest(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.syncTokenHash, hashSyncToken(token)))
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
  await db.delete(users).where(eq(users.id, userId));
}
