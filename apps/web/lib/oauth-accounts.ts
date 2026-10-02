import { createHash, randomBytes } from "crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "./db";
import { accountIdentities, accounts, oauthAppClaims, type Account } from "./schema";
import { NO_PASSWORD, hasPassword } from "./password";
import { signLink, verifyLink } from "./tokens";
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
 *   계정에 들어가는 길이 되기 때문이다. 그 계정의 주인은 처음 가입한 방법으로 로그인한 뒤 '내 정보'에서
 *   이 제공자를 잇는다(`linkOAuthIdentity`). 제공자가 이메일을 확인했으면 그 계정의 로그인 방법을 오류에
 *   실어 화면이 어떻게 로그인하면 되는지 말하게 한다.
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
  if (taken.length > 0) {
    throw new OAuthError(
      "email-taken",
      profile.emailVerified ? await loginMethodIds(taken[0].id) : [],
    );
  }

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

/** 계정이 로그인하는 방법. `password`(비밀번호가 있으면)와 이어 둔 제공자. */
async function loginMethodIds(accountId: string): Promise<string[]> {
  const [row] = await getDb()
    .select({ passwordHash: accounts.passwordHash })
    .from(accounts)
    .where(eq(accounts.id, accountId))
    .limit(1);
  const providers = await linkedProviders(accountId);
  return [...(row && hasPassword(row.passwordHash) ? ["password"] : []), ...providers];
}

/** 로그인 방법 연결 코드가 유효한 시간. 제공자 화면에 다녀오는 동안만 쓴다. */
const LINK_CODE_TTL_SECONDS = 10 * 60;

/**
 * 계정에 이어 둔 제공자들의 지문. 하나를 잇거나 끊으면 바뀌므로, 연결 코드를 DB에 적지 않고도 한 번만
 * 쓰이게 한다(Gmail 연결 코드의 `linkFingerprint`와 같은 방식). 주소에 실리므로 해시만 싣는다.
 */
async function identityFingerprint(accountId: string): Promise<string> {
  const rows = await getDb()
    .select({ provider: accountIdentities.provider, subjectHash: accountIdentities.subjectHash })
    .from(accountIdentities)
    .where(eq(accountIdentities.accountId, accountId));
  const list = rows
    .map((row) => `${row.provider}:${row.subjectHash}`)
    .sort()
    .join(",");
  return createHash("sha256").update(`identities:${accountId}:${list}`).digest("hex").slice(0, 32);
}

/**
 * '내 정보'에서 로그인 방법을 이을 때 시작 주소에 싣는 코드. 앱은 인앱 브라우저에서 제공자로 가므로
 * 세션 쿠키가 없다 — 그래서 세션 대신 이 코드로 어느 계정에 이을지 정한다. 세션 토큰을 주소에 싣지
 * 않으려고 10분짜리 서명 코드만 싣고, 이을 제공자와 그때의 연결 지문을 담아 다른 제공자나 두 번째
 * 연결에 쓰지 못하게 한다.
 */
export async function createLinkCode(
  accountId: string,
  provider: OAuthProviderId,
): Promise<string> {
  return signLink(
    { uid: accountId, act: "oauth-link", pv: provider, ln: await identityFingerprint(accountId) },
    LINK_CODE_TTL_SECONDS,
  );
}

/** 연결 코드가 이 제공자를 이으려고 지금 계정 상태에서 발급된 것이면 그 계정. 아니면 null. */
export async function verifyLinkCode(
  code: string,
  provider: OAuthProviderId,
): Promise<string | null> {
  const payload = verifyLink(code);
  if (!payload || payload.act !== "oauth-link" || payload.pv !== provider || !payload.ln) {
    return null;
  }
  if ((await identityFingerprint(payload.uid)) !== payload.ln) return null;
  const [account] = await getDb()
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.id, payload.uid))
    .limit(1);
  return account ? account.id : null;
}

/**
 * 로그인한 계정에 제공자 계정을 로그인 방법으로 잇는다. 계정 주인임은 로그인(연결 코드)으로 이미
 * 확인했으므로 이메일이 달라도 잇는다 — 계정의 이메일은 바꾸지 않는다.
 *
 * - 이 제공자 계정이 이미 이 계정에 이어져 있으면 그대로 둔다.
 * - 다른 SubSlash 계정에 이어져 있으면 거절한다(`identity-taken`). 옮겨 오면 그 계정이 로그인할 길을
 *   잃는다.
 * - 이 계정에 같은 회사의 다른 계정이 이어져 있으면 거절한다(`provider-linked`). 한 회사에 하나만 둬야
 *   '구글 연결 끊기'가 무엇을 끊는지 분명하다.
 */
export async function linkOAuthIdentity(
  accountId: string,
  provider: OAuthProviderId,
  profile: Pick<OAuthProfile, "subject">,
): Promise<void> {
  const db = getDb();
  const hash = subjectHash(provider, profile.subject);
  const [owner] = await db
    .select({ accountId: accountIdentities.accountId })
    .from(accountIdentities)
    .where(and(eq(accountIdentities.provider, provider), eq(accountIdentities.subjectHash, hash)))
    .limit(1);
  if (owner) {
    if (owner.accountId === accountId) return;
    throw new OAuthError("identity-taken");
  }
  if ((await linkedProviders(accountId)).includes(provider)) {
    throw new OAuthError("provider-linked");
  }
  try {
    await db
      .insert(accountIdentities)
      .values({ accountId, provider, subjectHash: hash, createdAt: new Date().toISOString() });
  } catch (error) {
    // 같은 제공자 계정을 그사이 다른 창에서 이었다.
    if (isUniqueViolation(error)) throw new OAuthError("identity-taken");
    throw error;
  }
}

export type UnlinkResult = "ok" | "not-linked" | "last-method";

/**
 * 제공자 연결을 끊는다. 로그인할 방법(비밀번호나 다른 제공자)이 남지 않으면 끊지 않는다 — 비밀번호
 * 없이 간편 로그인으로만 가입한 계정이 하나뿐인 연결을 끊으면 다시 들어올 길이 없다.
 */
export async function unlinkOAuthIdentity(
  accountId: string,
  provider: OAuthProviderId,
): Promise<UnlinkResult> {
  const methods = await loginMethodIds(accountId);
  if (!methods.includes(provider)) return "not-linked";
  if (methods.length < 2) return "last-method";
  await getDb()
    .delete(accountIdentities)
    .where(
      and(eq(accountIdentities.accountId, accountId), eq(accountIdentities.provider, provider)),
    );
  return "ok";
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
