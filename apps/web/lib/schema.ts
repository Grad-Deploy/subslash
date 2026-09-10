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
    /**
     * Which month a yearly plan is charged in (1-12), or null when the browser
     * has not recorded one. Without it the reminder has no date, so the sweep
     * skips the subscription rather than mailing about it every month.
     */
    billingMonth: integer("billing_month"),
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

/**
 * 로그인 계정.
 *
 * 알림 미러의 `users`와 일부러 분리했다. 저쪽은 "알림을 켠 브라우저"를
 * 가리키고 이메일 하나로 식별되며, 계정 없이도 존재한다. 로그인은 그와
 * 다른 개념이라 한 테이블에 밀어 넣으면 둘 중 하나의 규칙이 반드시 거짓이
 * 된다. 로그인은 선택 기능이므로, 계정이 없어도 앱은 그대로 동작한다.
 */
export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** 소문자로 정규화해 저장한다. 대소문자만 다른 두 계정을 막기 위해서다. */
    username: text("username").notNull(),
    email: text("email").notNull(),
    /**
     * `scrypt$N$r$p$솔트$해시` 형식의 단방향 해시. 평문 비밀번호는 어디에도
     * 저장하지 않고, 로그인 요청을 처리하는 순간 외에는 메모리에도 남기지 않는다.
     */
    passwordHash: text("password_hash").notNull(),
    age: integer("age").notNull(),
    /** male | female | other | undisclosed. */
    gender: text("gender").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    lastLoginAt: text("last_login_at"),
  },
  (table) => ({
    usernameIdx: uniqueIndex("accounts_username_idx").on(table.username),
    emailIdx: uniqueIndex("accounts_email_idx").on(table.email),
  }),
);

/**
 * 로그인 세션.
 *
 * 브라우저에는 임의의 토큰만 쿠키로 내려가고, 서버에는 그 SHA-256만 남는다.
 * DB가 통째로 새더라도 거기 있는 값으로는 로그인할 수 없다 — 알림 동기화
 * 토큰과 같은 방식이다.
 */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.tokenHash),
    accountIdx: index("sessions_account_idx").on(table.accountId),
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

export const accountsRelations = relations(accounts, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  account: one(accounts, {
    fields: [sessions.accountId],
    references: [accounts.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
