import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

/**
 * Server schema for the notification mirror.
 *
 * localStorage stays the source of truth for a user's subscriptions; the server
 * holds only the thin projection the reminder cron needs, and only for people
 * who explicitly opted into email reminders. Check-in history, usage logs and
 * the savings pot never leave the browser.
 */

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    /** SHA-256 of the bearer token held by the browser. The raw token is never stored. */
    syncTokenHash: text("sync_token_hash").notNull(),
    /** Null until the confirmation link is clicked; the cron skips unverified users. */
    verifiedAt: text("verified_at"),
    /** How many days before a billing date the reminder goes out. */
    reminderDays: integer("reminder_days").notNull().default(3),
    /**
     * SHA-256 of the calendar feed token, or null while the feed is off.
     *
     * Kept separate from the sync token on purpose: a calendar URL is pasted
     * into apps, synced between devices and sometimes shared, so the credential
     * it carries must not be the one that can overwrite the mirror. This one
     * only reads, and rotating it revokes every subscribed calendar at once.
     */
    calendarTokenHash: text("calendar_token_hash"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastSyncedAt: text("last_synced_at"),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    syncTokenIdx: uniqueIndex("users_sync_token_idx").on(table.syncTokenHash),
    calendarTokenIdx: uniqueIndex("users_calendar_token_idx").on(table.calendarTokenHash),
  }),
);

/**
 * Mirror of the browser's active subscriptions. Replaced wholesale on each sync,
 * so there is no merge/conflict handling: the client always wins.
 */
export const mirroredSubscriptions = sqliteTable(
  "mirrored_subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The browser-side subscription id, used to build the one-tap check-in link. */
    clientId: text("client_id").notNull(),
    name: text("name").notNull(),
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("KRW"),
    billingDay: integer("billing_day").notNull(),
    billingCycle: text("billing_cycle").notNull().default("monthly"),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userClientIdx: uniqueIndex("mirrored_subs_user_client_idx").on(table.userId, table.clientId),
    billingDayIdx: index("mirrored_subs_billing_day_idx").on(table.billingDay),
  }),
);

/**
 * Idempotency guard: one reminder per subscription per billing date, however
 * many times the cron runs or retries.
 */
export const notificationLog = sqliteTable(
  "notification_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    /** The billing date the reminder was about, as YYYY-MM-DD. */
    billingDate: text("billing_date").notNull(),
    sentAt: text("sent_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    onceIdx: uniqueIndex("notification_log_once_idx").on(
      table.userId,
      table.clientId,
      table.billingDate,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(mirroredSubscriptions),
  notifications: many(notificationLog),
}));

export const mirroredSubscriptionsRelations = relations(mirroredSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [mirroredSubscriptions.userId],
    references: [users.id],
  }),
}));

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  user: one(users, {
    fields: [notificationLog.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MirroredSubscription = typeof mirroredSubscriptions.$inferSelect;
export type NewMirroredSubscription = typeof mirroredSubscriptions.$inferInsert;
export type NotificationLogEntry = typeof notificationLog.$inferSelect;
