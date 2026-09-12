import { and, desc, eq, gt, isNull, lt } from "drizzle-orm";
import { getDb } from "./db";
import { accountSnapshots, accounts, sessions, verificationMailLog, type Account } from "./schema";
import { canSignLinks, emailFingerprint, signLink, verifyLink } from "./tokens";
import { accountVerificationEmail, appUrl, sendEmail } from "./email";
import { VERIFY_ACCOUNT_TTL_DAYS } from "./verification-config";

/**
 * 가입한 이메일이 그 사람 것인지 확인하기.
 *
 * 가입은 확인 전에도 끝난다. 로그인은 선택 기능이고 구독 데이터는 브라우저에
 * 있어서, 확인 전까지 막아서 지킬 것이 적다. 대신 확인 전인 계정은 주소를
 * 점유하지 못한다. 확인 메일을 받은 주소의 주인이 '제가 가입하지 않았어요'를
 * 누르면 그 계정은 지워진다.
 *
 * 시간이 지났다고 계정을 지우지는 않는다. 시간은 누가 주소의 주인인지 말해주지
 * 않는다. 확인 메일이 스팸함에 있어 누르지 못한 진짜 주인의 계정이, 같은 주소로
 * 가입을 시도한 다른 사람 때문에 지워지게 된다.
 */

const VERIFY_ACCOUNT_TTL_SECONDS = VERIFY_ACCOUNT_TTL_DAYS * 24 * 60 * 60;

/**
 * 한 주소로 계정 메일을 다시 보내기까지 기다리는 시간.
 *
 * 가입 확인 메일과 비밀번호 재설정 메일이 이 한도를 함께 쓴다. 어느 쪽이든 한 사람의
 * 받은편지함에 쌓이고 같은 Resend 한도를 쓴다 — 따로 세면 둘을 번갈아 요청해 두 배로
 * 보낼 수 있다.
 */
export const RESEND_COOLDOWN_SECONDS = 60;
/** 한 주소로 24시간 동안 보낼 수 있는 계정 메일 수(확인·재설정 합산). */
export const DAILY_SEND_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SendOutcome =
  | { status: "sent" }
  /** 서명 키나 Resend 키가 없는 서버. 다시 눌러도 결과가 같다. */
  | { status: "not_sent"; reason: "not_configured" }
  /** Resend가 거절했거나 닿지 않았다. 잠시 뒤에는 될 수 있다. */
  | { status: "not_sent"; reason: "failed" }
  | { status: "rate_limited"; retryAfterSeconds: number };

/**
 * 이 주소로 지금 계정 메일을 보낼 수 있으면 0, 아니면 기다려야 하는 초.
 *
 * 실제로 발송된 메일만 센다. 설정이 없어 보내지 못한 시도까지 세면, 설정을
 * 고친 뒤에도 한동안 보낼 수 없게 된다.
 */
export async function verificationWaitSeconds(email: string, now = new Date()): Promise<number> {
  const since = new Date(now.getTime() - DAY_MS).toISOString();
  const rows = await getDb()
    .select({ sentAt: verificationMailLog.sentAt })
    .from(verificationMailLog)
    .where(and(eq(verificationMailLog.email, email), gt(verificationMailLog.sentAt, since)))
    .orderBy(desc(verificationMailLog.sentAt));

  if (rows.length === 0) return 0;

  const waits: number[] = [];
  const latest = Date.parse(rows[0].sentAt);
  waits.push(latest + RESEND_COOLDOWN_SECONDS * 1000 - now.getTime());
  if (rows.length >= DAILY_SEND_LIMIT) {
    // 가장 오래된 기록이 24시간 창 밖으로 나가야 한 통이 풀린다.
    const oldest = Date.parse(rows[DAILY_SEND_LIMIT - 1].sentAt);
    waits.push(oldest + DAY_MS - now.getTime());
  }

  const wait = Math.max(...waits);
  return wait > 0 ? Math.ceil(wait / 1000) : 0;
}

/** 계정 메일을 실제로 보낸 뒤 부른다. 한도 계산에 쓰고, 24시간이 지난 기록은 지운다. */
export async function recordAccountMailSent(email: string, now = new Date()): Promise<void> {
  const db = getDb();
  await db.insert(verificationMailLog).values({ email, sentAt: now.toISOString() });
  await db
    .delete(verificationMailLog)
    .where(
      and(
        eq(verificationMailLog.email, email),
        lt(verificationMailLog.sentAt, new Date(now.getTime() - DAY_MS).toISOString()),
      ),
    );
}

/** 계정의 주소로 확인 메일을 보낸다. 예외를 던지지 않는다 — 가입을 실패로 만들지 않기 위해서다. */
export async function sendAccountVerification(account: Account): Promise<SendOutcome> {
  // 서명 키 없이 signLink를 부르면 예외가 난다. 알림을 쓰지 않는 배포에서는 두
  // 키가 모두 선택 사항이라, 여기서 먼저 걸러야 가입 전체가 500이 되지 않는다.
  if (!canSignLinks()) return { status: "not_sent", reason: "not_configured" };

  try {
    const wait = await verificationWaitSeconds(account.email);
    if (wait > 0) return { status: "rate_limited", retryAfterSeconds: wait };

    const token = signLink(
      { uid: account.id, act: "verify-account", em: emailFingerprint(account.email) },
      VERIFY_ACCOUNT_TTL_SECONDS,
    );
    const mail = accountVerificationEmail({
      username: account.username,
      confirmUrl: `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`,
      validDays: VERIFY_ACCOUNT_TTL_DAYS,
    });
    const result = await sendEmail({ to: account.email, ...mail });

    // 로그로 대신한 것(RESEND_API_KEY 없음)은 보낸 것이 아니다. "보냈습니다"라고
    // 하면 오지 않을 메일을 사용자가 기다리게 된다.
    if (result.simulated) return { status: "not_sent", reason: "not_configured" };
    if (!result.delivered) return { status: "not_sent", reason: "failed" };

    await recordAccountMailSent(account.email);
    return { status: "sent" };
  } catch (error) {
    console.error("[account-verification] send failed:", error);
    return { status: "not_sent", reason: "failed" };
  }
}

export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  if (seconds < 60 * 60) return `${Math.ceil(seconds / 60)}분`;
  return `${Math.ceil(seconds / (60 * 60))}시간`;
}

/** 발송 결과를 사용자에게 보여줄 문장. 가입 응답과 재발송 응답이 같은 문장을 쓴다. */
export function describeSendOutcome(outcome: SendOutcome, email: string): string {
  switch (outcome.status) {
    case "sent":
      return `${email}로 확인 메일을 보냈습니다. 받은편지함에 없으면 스팸함도 확인해주세요.`;
    case "rate_limited":
      return `이 주소로 메일을 너무 자주 보냈습니다. ${formatWait(outcome.retryAfterSeconds)} 뒤에 다시 보낼 수 있습니다.`;
    case "not_sent":
      return outcome.reason === "not_configured"
        ? "이 서버에는 메일 발송이 설정돼 있지 않아 확인 메일을 보내지 못했습니다."
        : "확인 메일을 보내지 못했습니다. 잠시 뒤 다시 보내주세요.";
  }
}

export type LinkState =
  | { kind: "invalid" }
  /** 서명은 맞지만 계정이 없다 — '제가 가입하지 않았어요'로 이미 지워졌다. */
  | { kind: "gone" }
  | { kind: "pending"; account: Account }
  | { kind: "verified"; account: Account };

/** 확인 링크의 토큰이 가리키는 계정과 그 상태. 읽기만 하고 아무것도 바꾸지 않는다. */
export async function resolveVerificationLink(
  token: string | null | undefined,
): Promise<LinkState> {
  if (!token || !canSignLinks()) return { kind: "invalid" };

  const payload = verifyLink(token);
  // 알림용 `verify` 링크는 notification_subscribers의 id를 담는다. 같은 id의 계정이
  // 있더라도 받지 않는다. 재설정 링크(`reset-password`)도 받지 않는다.
  if (!payload || payload.act !== "verify-account" || !payload.em) return { kind: "invalid" };

  const rows = await getDb().select().from(accounts).where(eq(accounts.id, payload.uid)).limit(1);
  const account = rows[0];
  if (!account) return { kind: "gone" };

  // 링크를 보낸 뒤 주소가 바뀌었다. 옛 주소의 주인이 새 주소를 확인해줄 수는 없다.
  if (emailFingerprint(account.email) !== payload.em) return { kind: "invalid" };

  return account.emailVerifiedAt ? { kind: "verified", account } : { kind: "pending", account };
}

export async function markEmailVerified(accountId: string): Promise<void> {
  await getDb()
    .update(accounts)
    .set({ emailVerifiedAt: new Date().toISOString() })
    .where(and(eq(accounts.id, accountId), isNull(accounts.emailVerifiedAt)));
}

/**
 * 확인 전인 계정을 지운다. 그사이 확인됐으면 지우지 않고 `false`.
 *
 * 확인된 계정은 주인이 '맞아요'라고 답한 것이다. 그 뒤에 남아 있던 옛 링크로
 * 지워지게 두지 않는다.
 */
export async function deleteUnverifiedAccount(accountId: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), isNull(accounts.emailVerifiedAt)))
    .returning({ id: accounts.id });
  if (deleted.length === 0) return false;

  // 스키마의 ON DELETE CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 동작한다.
  // 알림 미러를 지울 때처럼 딸린 행을 직접 지운다. 계정에 저장한 기록도 함께 지운다 —
  // 주소의 주인이 모르는 가입이라고 한 계정의 기록을 서버에 남겨 둘 이유가 없다.
  await db.delete(sessions).where(eq(sessions.accountId, accountId));
  await db.delete(accountSnapshots).where(eq(accountSnapshots.accountId, accountId));
  return true;
}

export async function findAccountByEmail(email: string): Promise<Account | null> {
  const rows = await getDb().select().from(accounts).where(eq(accounts.email, email)).limit(1);
  return rows[0] ?? null;
}
