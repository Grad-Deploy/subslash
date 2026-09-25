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

/**
 * 결제 알림을 켠 브라우저. 로그인 계정(`accounts`)이 아니다.
 *
 * 로그인 없이 알림만 켜도 생기고, 이메일 하나와 그 브라우저가 쥔 sync 토큰으로
 * 식별된다. 예전 이름이 `users`여서 로그인 계정 테이블처럼 읽혔다(0006에서 바꿈).
 * 두 테이블을 합치면 "알림에는 로그인이 필요 없다"와 "계정마다 비밀번호가 있다"
 * 중 하나가 거짓이 된다.
 */
export const notificationSubscribers = sqliteTable(
  "notification_subscribers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    /** SHA-256 of the bearer token held by the browser. The raw token is never stored. */
    syncTokenHash: text("sync_token_hash").notNull(),
    /** Null until the confirmation link is clicked; the cron skips unverified subscribers. */
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
    // 고유 인덱스가 아니다. 같은 주소로 다시 신청하면 확인 링크를 누르기 전까지 새 신청(확인 전)과
    // 예전 기록(확인됨)이 함께 있고, 링크를 누를 때 새 것이 예전 것을 대신한다(api/notify/verify).
    // 예전에는 한 줄만 허용해 신청하자마자 예전 기록을 지웠고, 그래서 남의 주소만 알면 그 사람의
    // 알림을 끊을 수 있었다.
    emailIdx: index("notification_subscribers_email_idx").on(table.email),
    syncTokenIdx: uniqueIndex("notification_subscribers_sync_token_idx").on(table.syncTokenHash),
    calendarTokenIdx: uniqueIndex("notification_subscribers_calendar_token_idx").on(
      table.calendarTokenHash,
    ),
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
    /** notification_subscribers.id. 컬럼 이름은 테이블 이름을 바꾸기 전 그대로다. */
    userId: text("user_id")
      .notNull()
      .references(() => notificationSubscribers.id, { onDelete: "cascade" }),
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
    /**
     * 해지 주소. 캘린더 피드의 일정 메모에 적어, 캘린더에서 바로 해지하러 갈 수 있게 한다.
     * 브라우저가 이 구독에 적어 둔 주소를 그대로 보내고, 서버는 http(s)만 받는다. 없으면 null이고
     * 그때 메모에는 해지 줄이 없다.
     */
    cancelUrl: text("cancel_url"),
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
    /** notification_subscribers.id. */
    userId: text("user_id")
      .notNull()
      .references(() => notificationSubscribers.id, { onDelete: "cascade" }),
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
 * 알림 미러의 `notification_subscribers`와 일부러 분리했다. 저쪽은 "알림을 켠
 * 브라우저"를 가리키고 이메일 하나로 식별되며, 계정 없이도 존재한다. 로그인은
 * 그와 다른 개념이라 한 테이블에 밀어 넣으면 둘 중 하나의 규칙이 반드시 거짓이
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
    /**
     * 선택 항목. 가입 화면과 '내 정보'에서 원할 때만 적는다. 적지 않았으면 null이다.
     * 필수로 받지 않는다 — 서비스에 꼭 필요한 정보가 아니다(개인정보 보호법 제16조).
     */
    age: integer("age"),
    /** male | female | other | undisclosed. 선택 항목이라 적지 않았으면 null. */
    gender: text("gender"),
    /**
     * 가입한 이메일이 그 사람 것인지 확인된 시각. 확인 메일에서 '맞아요'를 누르기
     * 전까지 null이다. 이 기능이 생기기 전에 가입한 계정도 null로 남는다 — 확인한
     * 적 없는 주소를 확인된 것으로 채우지 않는다.
     */
    emailVerifiedAt: text("email_verified_at"),
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
 * 계정 메일(가입 확인·비밀번호 재설정)을 보낸 기록. 주소마다 보내는 횟수를 제한하는
 * 데만 쓴다. 두 메일이 한도를 함께 쓴다 — 어느 쪽이든 한 사람의 받은편지함과 같은
 * Resend 한도를 쓴다. 테이블 이름은 가입 확인 메일만 있던 때의 것이다.
 *
 * 계정이 아니라 주소에 묶는다. 계정은 '제가 가입하지 않았어요'로 지워졌다가 같은
 * 주소로 다시 만들어질 수 있어서, 계정에 적어두면 지울 때마다 제한이 풀린다 —
 * 모르는 사람의 받은편지함에 확인 메일을 계속 보내는 길이 된다.
 */
export const verificationMailLog = sqliteTable(
  "verification_mail_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    /** ISO 8601. 세션 만료 시각처럼 문자열 비교로 시간 순서를 가린다. */
    sentAt: text("sent_at").notNull(),
  },
  (table) => ({
    emailSentIdx: index("verification_mail_log_email_idx").on(table.email, table.sentAt),
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

/**
 * 계정에 저장한 기록 한 벌. 계정마다 한 줄이고, 저장할 때마다 통째로 바뀐다.
 *
 * 로그인한 사람이 '계정에 저장'을 직접 눌렀을 때만 생긴다. 기본 경험은 여전히
 * 브라우저 안에서 끝나고, 서버가 이 기록을 브라우저로 알아서 되쓰지도 않는다 —
 * 다른 기기에서 '계정에서 불러오기'를 눌러야 받는다. 내용은 백업 파일과 같다
 * (구독·체크인·연동 계정·환율). 결제 알림의 동기화 토큰은 넣지 않는다.
 */
export const accountSnapshots = sqliteTable("account_snapshots", {
  accountId: text("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  /** 백업 파일과 같은 형식의 JSON(`createBackup`). 서버가 다시 검사한 뒤 저장한 값. */
  payload: text("payload").notNull(),
  /** 목록 화면에서 payload를 풀지 않고 보여줄 수 있게 따로 적는다. */
  subscriptionCount: integer("subscription_count").notNull(),
  /** ISO 8601. 서버 시계로 적은 저장 시각. */
  savedAt: text("saved_at").notNull(),
});

export type AccountSnapshot = typeof accountSnapshots.$inferSelect;

/**
 * Gmail 자동 가져오기 연결. 로그인 계정마다 한 줄이다.
 *
 * SubSlash는 Gmail에 접근하지 않는다. 사용자가 자기 Google 계정에 만든 Apps Script가 2주마다
 * 결제 메일을 찾아 `/api/gmail/ingest`로 보내고, 이 표의 토큰으로 어느 계정의 것인지 가린다.
 * 토큰은 그 스크립트에만 들어가므로 해시만 남긴다. 세션·알림 동기화 토큰과 따로 둔다 — 스크립트
 * 코드는 사용자가 복사해 두는 글이라, 새더라도 후보를 보내는 것 말고는 할 수 없어야 한다.
 */
export const gmailImportLinks = sqliteTable(
  "gmail_import_links",
  {
    accountId: text("account_id")
      .primaryKey()
      .references(() => accounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: text("created_at").notNull(),
    /** 스크립트가 마지막으로 보낸 시각(ISO 8601). 한 번도 안 왔으면 null — 설치가 안 된 것이다. */
    lastIngestAt: text("last_ingest_at"),
    /** 그때 받은 메일 수. 새 메일이 없던 검사도 0으로 적어, 스크립트가 돌고 있다는 걸 보인다. */
    lastEmailCount: integer("last_email_count"),
  },
  (table) => ({
    tokenIdx: uniqueIndex("gmail_import_links_token_idx").on(table.tokenHash),
  }),
);

/**
 * 결제 메일에서 찾아 브라우저가 받아 가기 전의 구독 후보.
 *
 * 메일 제목·본문은 저장하지 않는다. 받은 메일은 요청을 처리하는 동안 파싱하는 데만 쓰고, 여기에는
 * 파싱 결과만 남긴다. 구독 기록은 여전히 브라우저에 있으므로, 브라우저가 받아 가면 곧바로 지운다
 * (받지 않은 후보도 30일이 지나면 지운다). 같은 서비스(이름·통화)는 한 줄로 두고 더 최근 메일의
 * 결과로 바꾼다.
 */
export const gmailDiscoveries = sqliteTable(
  "gmail_discoveries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    /** `이름|통화`. 같은 서비스의 다음 영수증이 새 줄을 만들지 않게 한다. */
    dedupeKey: text("dedupe_key").notNull(),
    name: text("name").notNull(),
    amount: real("amount").notNull(),
    currency: text("currency").notNull(),
    billingDay: integer("billing_day").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    billingMonth: integer("billing_month"),
    category: text("category").notNull(),
    /** 알려진 서비스와 맞았을 때만. 해지 링크·안내는 브라우저가 이 id로 서비스 목록에서 찾는다. */
    presetId: text("preset_id"),
    paymentMethod: text("payment_method"),
    /** 결제 메일을 받은 날(YYYY.MM.DD). */
    receiptDate: text("receipt_date").notNull(),
    /** 보낸 사람. 사용자가 후보를 알아보는 근거로만 보여준다. */
    sender: text("sender").notNull(),
    /** `auto`: 확인 없이 등록해도 되는 후보, `review`: 사용자가 골라야 하는 후보. */
    tier: text("tier").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    accountKeyIdx: uniqueIndex("gmail_discoveries_account_key_idx").on(
      table.accountId,
      table.dedupeKey,
    ),
  }),
);

/**
 * '구글 캘린더에 등록'을 누른 브라우저가 맡겨 둔 결제일 계획.
 *
 * 브라우저에만 있는 구독을 사용자의 Apps Script 웹 앱이 읽어 그 사람의 캘린더에 쓰려면, 둘 사이에
 * 잠깐 놓아 둘 곳이 필요하다. 주소에 실으면 구독 이름·금액이 Google의 기록과 브라우저 방문 기록에
 * 남으므로, 주소에는 코드만 싣고 계획은 여기에 둔다. 웹 앱이 받아 가면 곧바로 지우고, 받아 가지
 * 않아도 10분이 지나면 쓸 수 없다. 계정마다 한 벌이라 다시 누르면 앞의 것을 덮어쓴다.
 */
export const calendarSyncPlans = sqliteTable(
  "calendar_sync_plans",
  {
    accountId: text("account_id")
      .primaryKey()
      .references(() => accounts.id, { onDelete: "cascade" }),
    /** 웹 앱이 제시할 1회용 코드. 주소에 실리므로 되돌릴 수 없는 해시로만 둔다. */
    codeHash: text("code_hash").notNull(),
    /** 캘린더에 쓸 구독(이름·금액·통화·결제일·결제 주기·결제 월)과 알림 일수. JSON. */
    payload: text("payload").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("calendar_sync_plans_code_idx").on(table.codeHash),
  }),
);

export type CalendarSyncPlanRow = typeof calendarSyncPlans.$inferSelect;

export type GmailImportLink = typeof gmailImportLinks.$inferSelect;
export type GmailDiscovery = typeof gmailDiscoveries.$inferSelect;

export const notificationSubscribersRelations = relations(notificationSubscribers, ({ many }) => ({
  subscriptions: many(mirroredSubscriptions),
  notifications: many(notificationLog),
}));

export const mirroredSubscriptionsRelations = relations(mirroredSubscriptions, ({ one }) => ({
  subscriber: one(notificationSubscribers, {
    fields: [mirroredSubscriptions.userId],
    references: [notificationSubscribers.id],
  }),
}));

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  subscriber: one(notificationSubscribers, {
    fields: [notificationLog.userId],
    references: [notificationSubscribers.id],
  }),
}));

export type NotificationSubscriber = typeof notificationSubscribers.$inferSelect;
export type NewNotificationSubscriber = typeof notificationSubscribers.$inferInsert;
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

/**
 * 익명 구독 통계에 참여한 기기(lib/stats). 로그인 계정·알림 구독자와 묶지 않는다 — 누가 보낸 것인지
 * 알 수 없어야 익명이다. 기기는 토큰을 쥐고 자기 기록을 바꾸거나 지울 뿐이고, 서버는 해시만 둔다.
 * STATS_RETENTION_DAYS 동안 갱신되지 않으면 크론이 지운다.
 */
export const statsContributors = sqliteTable(
  "stats_contributors",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenHash: text("token_hash").notNull(),
    /** 한 달 구독 지출(내 몫) 합계, 1,000원 단위. */
    totalMonthlyKrw: integer("total_monthly_krw").notNull(),
    activeCount: integer("active_count").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("stats_contributors_token_idx").on(table.tokenHash),
    updatedIdx: index("stats_contributors_updated_idx").on(table.updatedAt),
  }),
);

/** 참여자의 알려진 서비스 하나. 서비스 이름이 아니라 서비스 목록의 id만 둔다. */
export const statsItems = sqliteTable(
  "stats_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    contributorId: text("contributor_id")
      .notNull()
      .references(() => statsContributors.id, { onDelete: "cascade" }),
    presetId: text("preset_id").notNull(),
    /** 내 몫의 한 달 금액, 100원 단위. */
    monthlyKrw: integer("monthly_krw").notNull(),
    /** 마지막 체크인의 이용 횟수. 최근 체크인이 없으면 null. */
    usageCount: integer("usage_count"),
  },
  (table) => ({
    contributorIdx: index("stats_items_contributor_idx").on(table.contributorId),
    presetIdx: index("stats_items_preset_idx").on(table.presetId),
  }),
);

/**
 * 기기 간 사용 측정(lib/device-usage)에 참여한 기기. 로그인 계정의 것이다 — 같은 사람의 휴대폰과
 * 태블릿을 이어 세려면 계정이라는 공통 식별자가 있어야 한다. 알림 구독자·익명 통계와는 묶지 않는다.
 *
 * `deviceKey`는 기기가 처음 켤 때 만든 무작위 값이고 기기 모델·광고 ID 같은 하드웨어 식별자가 아니다.
 * `measuredFrom`~`measuredUntil`은 이 기기가 실제로 잰 기간이다 — 그 밖의 시간은 '안 썼다'가 아니라
 * '모른다'라서, 화면이 부분 측정임을 말할 때 쓴다.
 */
export const usageDevices = sqliteTable(
  "usage_devices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    deviceKey: text("device_key").notNull(),
    /** 지금은 "android"뿐이다. iOS는 앱 밖으로 사용 시간을 내주지 않는다. */
    platform: text("platform").notNull(),
    /** 사용자가 붙인 이름("출근용 폰"). 없으면 화면이 '기기 1'처럼 부른다. */
    label: text("label"),
    /** epoch ms. */
    measuredFrom: integer("measured_from").notNull(),
    measuredUntil: integer("measured_until").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    accountDeviceIdx: uniqueIndex("usage_devices_account_device_idx").on(
      table.accountId,
      table.deviceKey,
    ),
    updatedIdx: index("usage_devices_updated_idx").on(table.updatedAt),
  }),
);

/**
 * 한 기기에서 서비스 목록에 있는 앱이 화면 맨 앞에 있던 구간. 앱 이름·패키지 이름이 아니라 서비스
 * 목록의 id만 둔다(목록에 없는 앱은 기기가 보내지도 않는다). 무엇을 봤는지·배속·위치는 없다.
 * 세션으로 잇는 것은 읽을 때 한다(@subslash/shared의 linkSessions) — 저장은 기기가 잰 그대로다.
 */
export const usageIntervals = sqliteTable(
  "usage_intervals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** 기기를 거치지 않고 계정 단위로 읽고 지우려고 함께 둔다. */
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    deviceId: text("device_id")
      .notNull()
      .references(() => usageDevices.id, { onDelete: "cascade" }),
    serviceId: text("service_id").notNull(),
    /** epoch ms. */
    startedAt: integer("started_at").notNull(),
    endedAt: integer("ended_at").notNull(),
  },
  (table) => ({
    deviceStartIdx: uniqueIndex("usage_intervals_device_start_idx").on(
      table.deviceId,
      table.serviceId,
      table.startedAt,
    ),
    accountStartIdx: index("usage_intervals_account_start_idx").on(
      table.accountId,
      table.startedAt,
    ),
  }),
);

export type UsageDeviceRow = typeof usageDevices.$inferSelect;
export type UsageIntervalRow = typeof usageIntervals.$inferSelect;
