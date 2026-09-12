import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { accounts, sessions, type Account } from "./schema";
import {
  canSignLinks,
  emailFingerprint,
  passwordFingerprint,
  signLink,
  verifyLink,
} from "./tokens";
import { appUrl, passwordResetEmail, sendEmail } from "./email";
import { RESET_PASSWORD_TTL_MINUTES } from "./verification-config";
import {
  formatWait,
  markEmailVerified,
  recordAccountMailSent,
  verificationWaitSeconds,
  type SendOutcome,
} from "./account-verification";

/**
 * 비밀번호 재설정.
 *
 * 비밀번호는 되돌릴 수 없게 저장하므로 알려줄 수 없다. 잊은 사람이 기댈 곳은 계정에
 * 적힌 주소뿐이라, 그 주소로 간 메일의 링크에서 새 비밀번호를 정하게 한다.
 *
 * 링크는 DB에 따로 적어두지 않는다. 대신 링크에 지금 비밀번호 해시의 지문을 담는다.
 * 비밀번호가 한 번 바뀌면 해시가 달라지므로, 쓴 링크와 그 전에 보낸 링크가 함께
 * 쓸모없어진다.
 */

const RESET_TTL_SECONDS = RESET_PASSWORD_TTL_MINUTES * 60;

/** 계정의 주소로 재설정 메일을 보낸다. 가입 확인 메일과 주소별 한도를 함께 쓴다. */
export async function sendPasswordReset(account: Account): Promise<SendOutcome> {
  if (!canSignLinks()) return { status: "not_sent", reason: "not_configured" };

  try {
    const wait = await verificationWaitSeconds(account.email);
    if (wait > 0) return { status: "rate_limited", retryAfterSeconds: wait };

    const token = signLink(
      {
        uid: account.id,
        act: "reset-password",
        em: emailFingerprint(account.email),
        pw: passwordFingerprint(account.passwordHash),
      },
      RESET_TTL_SECONDS,
    );
    const mail = passwordResetEmail({
      username: account.username,
      resetUrl: `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`,
      validMinutes: RESET_PASSWORD_TTL_MINUTES,
    });
    const result = await sendEmail({ to: account.email, ...mail });

    // 로그로 대신한 것은 보낸 것이 아니다. 오지 않을 메일을 기다리게 하지 않는다.
    if (result.simulated) return { status: "not_sent", reason: "not_configured" };
    if (!result.delivered) return { status: "not_sent", reason: "failed" };

    await recordAccountMailSent(account.email);
    return { status: "sent" };
  } catch (error) {
    console.error("[password-reset] send failed:", error);
    return { status: "not_sent", reason: "failed" };
  }
}

export function describeResetOutcome(outcome: SendOutcome, email: string): string {
  switch (outcome.status) {
    case "sent":
      return `${email}로 비밀번호 재설정 메일을 보냈습니다. 링크는 ${RESET_PASSWORD_TTL_MINUTES}분 동안 한 번만 쓸 수 있습니다. 받은편지함에 없으면 스팸함도 확인해주세요.`;
    case "rate_limited":
      return `이 주소로 메일을 너무 자주 보냈습니다. ${formatWait(outcome.retryAfterSeconds)} 뒤에 다시 요청할 수 있습니다.`;
    case "not_sent":
      return outcome.reason === "not_configured"
        ? "이 서버에는 메일 발송이 설정돼 있지 않아 재설정 메일을 보내지 못했습니다."
        : "재설정 메일을 보내지 못했습니다. 잠시 뒤 다시 요청해주세요.";
  }
}

export type ResetLinkState = { kind: "invalid" } | { kind: "valid"; account: Account };

/** 재설정 링크가 가리키는 계정. 읽기만 하고 아무것도 바꾸지 않는다. */
export async function resolveResetLink(token: string | null | undefined): Promise<ResetLinkState> {
  if (!token || !canSignLinks()) return { kind: "invalid" };

  const payload = verifyLink(token);
  // 가입 확인(`verify-account`)·알림 링크는 받지 않는다. 용도가 다른 링크로 비밀번호를
  // 바꿀 수 있으면, 더 오래 살아 있는 링크가 계정을 넘겨받는 열쇠가 된다.
  if (!payload || payload.act !== "reset-password" || !payload.em || !payload.pw) {
    return { kind: "invalid" };
  }

  const rows = await getDb().select().from(accounts).where(eq(accounts.id, payload.uid)).limit(1);
  const account = rows[0];
  // 계정이 지워졌든, 주소나 비밀번호가 그사이 바뀌었든 이 링크로 할 수 있는 일은 없다.
  if (!account) return { kind: "invalid" };
  if (emailFingerprint(account.email) !== payload.em) return { kind: "invalid" };
  if (passwordFingerprint(account.passwordHash) !== payload.pw) return { kind: "invalid" };

  return { kind: "valid", account };
}

/**
 * 비밀번호를 바꾼다. 링크를 확인한 사이 다른 창에서 먼저 바꿨으면 `false`.
 *
 * 링크를 확인할 때 본 해시가 그대로일 때만 바꾼다. 같은 링크를 두 창에서 동시에
 * 제출해도 한 번만 바뀐다.
 */
export async function applyPasswordReset(account: Account, newHash: string): Promise<boolean> {
  const db = getDb();
  const updated = await db
    .update(accounts)
    .set({ passwordHash: newHash })
    .where(and(eq(accounts.id, account.id), eq(accounts.passwordHash, account.passwordHash)))
    .returning({ id: accounts.id });
  if (updated.length === 0) return false;

  // 옛 비밀번호로 들어와 있던 기기를 모두 내보낸다. 비밀번호를 바꾸는 이유가
  // 잊어서만은 아니다 — 누가 알아냈을까 봐 바꾸는 경우도 있다.
  await db.delete(sessions).where(eq(sessions.accountId, account.id));
  // 재설정 링크는 이 주소로만 갔다. 링크를 열어 여기까지 왔다면 주소의 주인이다.
  await markEmailVerified(account.id);
  return true;
}
