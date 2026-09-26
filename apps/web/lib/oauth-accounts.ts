import { randomBytes } from "crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "./db";
import { accountIdentities, accounts, oauthAppClaims, type Account } from "./schema";
import { NO_PASSWORD } from "./password";
import { sendAccountVerification } from "./account-verification";
import { isUniqueViolation, logError } from "./log";
import {
  OAuthError,
  OAUTH_FLOW_TTL_SECONDS,
  s256,
  subjectHash,
  type OAuthFlow,
  type OAuthProfile,
  type OAuthProviderId,
} from "./oauth";

/**
 * 소셜 로그인으로 들어온 사람의 SubSlash 계정.
 *
 * - 이 제공자 계정을 이미 이어 둔 계정이 있으면 그 계정이다.
 * - 없으면 새로 만든다. 이메일이 있어야 하고(계정 연락처·비밀번호 재설정), 가입 화면에서 만 14세
 *   이상을 확인했어야 한다(개인정보 보호법 제22조의2 — 비밀번호 가입과 같은 조건).
 * - 같은 이메일의 계정이 이미 있으면 **잇지 않고** 거절한다. 제공자가 확인하지 않은 이메일로 남의
 *   계정에 들어가는 길이 되기 때문이다. 그 계정의 주인은 아이디로 로그인한다.
 *
 * 새 계정은 비밀번호가 없다(`NO_PASSWORD` — 어떤 비밀번호와도 맞지 않는 값). 비밀번호로도 로그인하고
 * 싶으면 '비밀번호 찾기' 메일로 만든다. 제공자가 확인한 이메일이면 확인된 것으로 두고, 아니면(네이버,
 * 확인하지 않은 카카오 주소) 가입처럼 확인 메일을 보낸다.
 */
export async function resolveOAuthAccount(
  provider: OAuthProviderId,
  profile: OAuthProfile,
  flow: Pick<OAuthFlow, "over14">,
): Promise<{ account: Account; created: boolean }> {
  const db = getDb();
  const hash = subjectHash(provider, profile.subject);

  const linked = await db
    .select({ account: accounts })
    .from(accountIdentities)
    .innerJoin(accounts, eq(accountIdentities.accountId, accounts.id))
    .where(and(eq(accountIdentities.provider, provider), eq(accountIdentities.subjectHash, hash)))
    .limit(1);
  if (linked[0]) return { account: linked[0].account, created: false };

  const email = profile.email;
  if (!email) throw new OAuthError("no-email");

  const taken = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.email, email))
    .limit(1);
  if (taken.length > 0) throw new OAuthError("email-taken");

  if (!flow.over14) throw new OAuthError("need-age");

  const now = new Date().toISOString();
  let account: Account | null = null;
  // 아이디는 사람이 고르지 않았으므로 제공자 첫 글자 + 무작위로 만든다. '내 정보'에서 보인다.
  for (let attempt = 0; attempt < 5 && !account; attempt++) {
    try {
      const inserted = await db
        .insert(accounts)
        .values({
          username: generateUsername(provider),
          email,
          passwordHash: NO_PASSWORD,
          emailVerifiedAt: profile.emailVerified ? now : null,
          lastLoginAt: now,
        })
        .returning();
      account = inserted[0];
    } catch (error) {
      // 아이디가 겹쳤으면 다시 뽑는다. 이메일이 그사이 가입됐으면 거절한다.
      if (!isUniqueViolation(error)) throw error;
      const raced = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, email))
        .limit(1);
      if (raced.length > 0) throw new OAuthError("email-taken");
    }
  }
  if (!account) throw new OAuthError("server");

  try {
    await db
      .insert(accountIdentities)
      .values({ accountId: account.id, provider, subjectHash: hash, createdAt: now });
  } catch (error) {
    // 같은 제공자 계정으로 두 창에서 동시에 가입했다. 방금 만든 빈 계정은 지운다.
    await db.delete(accounts).where(eq(accounts.id, account.id));
    if (isUniqueViolation(error)) return resolveOAuthAccount(provider, profile, flow);
    throw error;
  }

  if (!profile.emailVerified) {
    // 보내지 못해도 가입은 되돌리지 않는다. '내 정보'에서 다시 보낼 수 있다.
    await sendAccountVerification(account).catch((error) =>
      logError("oauth/verification-mail", error),
    );
  }
  return { account, created: true };
}

const USERNAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** `g_` + 무작위 10자. 아이디 규칙(영문 소문자·숫자·밑줄, 4~20자)을 지킨다. */
export function generateUsername(provider: OAuthProviderId): string {
  const bytes = randomBytes(10);
  let tail = "";
  for (const byte of bytes) tail += USERNAME_ALPHABET[byte % USERNAME_ALPHABET.length];
  return `${provider[0]}_${tail}`;
}

/** 계정에 이어 둔 제공자. '내 정보'가 보여 준다. */
export async function linkedProviders(accountId: string): Promise<OAuthProviderId[]> {
  const db = getDb();
  const rows = await db
    .select({ provider: accountIdentities.provider })
    .from(accountIdentities)
    .where(eq(accountIdentities.accountId, accountId));
  return rows.map((row) => row.provider as OAuthProviderId);
}

function claimCutoff(): string {
  return new Date(Date.now() - OAUTH_FLOW_TTL_SECONDS * 1000).toISOString();
}

/** 앱에서 시작한 로그인이 끝났다. 앱이 돌아와 가져갈 때까지 적어 둔다. */
export async function storeAppClaim(challenge: string, accountId: string): Promise<void> {
  const db = getDb();
  await db.delete(oauthAppClaims).where(lt(oauthAppClaims.createdAt, claimCutoff()));
  await db
    .insert(oauthAppClaims)
    .values({ challenge, accountId, createdAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: oauthAppClaims.challenge,
      set: { accountId, createdAt: new Date().toISOString() },
    });
}

/** 앱이 내민 verifier로 한 번만 가져간다. 없거나 10분이 지났으면 null. */
export async function consumeAppClaim(verifier: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .delete(oauthAppClaims)
    .where(
      and(
        eq(oauthAppClaims.challenge, s256(verifier)),
        gt(oauthAppClaims.createdAt, claimCutoff()),
      ),
    )
    .returning({ accountId: oauthAppClaims.accountId });
  return rows[0]?.accountId ?? null;
}
