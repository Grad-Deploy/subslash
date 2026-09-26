import { createHash, randomBytes } from "crypto";
import type { OAuthErrorCode } from "./oauth-messages";

export { OAUTH_ERROR_MESSAGE, type OAuthErrorCode } from "./oauth-messages";

/**
 * 구글·카카오·네이버 계정으로 로그인(OAuth 2.0 인가 코드 방식).
 *
 * SubSlash는 로그인에 필요한 것만 받는다: 제공자의 회원 번호(같은 사람인지 알아보는 데만 쓰고 해시로만
 * 저장)와 이메일(계정 연락처·비밀번호 재설정). 이름·프로필 사진·전화번호는 요청하지 않는다. 제공자가 준
 * 액세스 토큰은 프로필을 한 번 읽는 데만 쓰고 저장하지 않는다.
 *
 * 각 제공자의 앱 키는 환경 변수로 받고, 키가 없는 제공자는 버튼을 두지 않는다(`enabledProviders`).
 * 가짜 키로 채워 두면 누르는 순간 제공자 오류 화면이 뜬다.
 */

export type OAuthProviderId = "google" | "kakao" | "naver";

export const OAUTH_PROVIDER_IDS: readonly OAuthProviderId[] = ["google", "kakao", "naver"];

export const OAUTH_PROVIDER_LABEL: Record<OAuthProviderId, string> = {
  google: "구글",
  kakao: "카카오",
  naver: "네이버",
};

export function isOAuthProviderId(value: unknown): value is OAuthProviderId {
  return typeof value === "string" && (OAUTH_PROVIDER_IDS as readonly string[]).includes(value);
}

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  /** 요청하는 동의 항목. 이메일만 받는다. */
  scope: string | null;
  /** PKCE(S256)를 쓰는지. 구글만 공식 지원한다 — 나머지는 state와 client secret으로 막는다. */
  pkce: boolean;
  clientIdEnv: string;
  clientSecretEnv: string;
  /** 카카오는 client secret을 켜지 않았으면 없어도 된다. */
  secretOptional: boolean;
}

const PROVIDERS: Record<OAuthProviderId, ProviderConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email",
    pkce: true,
    clientIdEnv: "GOOGLE_OAUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_OAUTH_CLIENT_SECRET",
    secretOptional: false,
  },
  kakao: {
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    profileUrl: "https://kapi.kakao.com/v2/user/me",
    scope: "account_email",
    pkce: false,
    clientIdEnv: "KAKAO_OAUTH_CLIENT_ID",
    clientSecretEnv: "KAKAO_OAUTH_CLIENT_SECRET",
    secretOptional: true,
  },
  naver: {
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    profileUrl: "https://openapi.naver.com/v1/nid/me",
    // 네이버는 동의 항목을 개발자 센터에서 고른다(이메일만 필수로 둔다).
    scope: null,
    pkce: false,
    clientIdEnv: "NAVER_OAUTH_CLIENT_ID",
    clientSecretEnv: "NAVER_OAUTH_CLIENT_SECRET",
    secretOptional: false,
  },
};

interface Credentials {
  clientId: string;
  clientSecret: string | null;
}

function credentials(provider: OAuthProviderId): Credentials | null {
  const config = PROVIDERS[provider];
  const clientId = process.env[config.clientIdEnv]?.trim();
  const clientSecret = process.env[config.clientSecretEnv]?.trim() || null;
  if (!clientId) return null;
  if (!clientSecret && !config.secretOptional) return null;
  return { clientId, clientSecret };
}

/** 앱 키가 있는 제공자. */
export function enabledProviders(): OAuthProviderId[] {
  return OAUTH_PROVIDER_IDS.filter((provider) => credentials(provider) !== null);
}

/** 로그인이 끝나면 돌아올 주소. 제공자 앱 설정에 똑같이 등록해야 한다. */
export function redirectUri(origin: string, provider: OAuthProviderId): string {
  return `${origin}/api/auth/oauth/${provider}/callback`;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export function randomToken(): string {
  return base64url(randomBytes(32));
}

/** PKCE S256. 앱 넘겨받기(oauth_app_claims)도 같은 계산을 쓴다. */
export function s256(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

/** 제공자 회원 번호의 해시. 제공자 이름을 섞어, 다른 제공자의 같은 번호와 겹치지 않게 한다. */
export function subjectHash(provider: OAuthProviderId, subject: string): string {
  return createHash("sha256").update(`${provider}:${subject}`).digest("hex");
}

/**
 * 로그인을 시작할 때 쿠키에 두는 것. 제공자에서 돌아오면 `state`가 같은지 보고(다른 사이트가 시작한
 * 로그인을 이어 붙이지 못하게), 나머지로 할 일을 정한다.
 */
export interface OAuthFlow {
  provider: OAuthProviderId;
  state: string;
  /** PKCE verifier(구글). */
  verifier: string | null;
  /** 앱에서 시작했으면 앱이 만든 challenge. 웹이면 null. */
  appChallenge: string | null;
  /** 가입 화면에서 '만 14세 이상'을 확인하고 눌렀는지. 새 계정은 이것이 있어야 만든다. */
  over14: boolean;
  /** 로그인 뒤 갈 화면(같은 사이트의 경로만). */
  next: string;
}

export const OAUTH_COOKIE = "subslash_oauth";
export const OAUTH_FLOW_TTL_SECONDS = 10 * 60;

/** 같은 사이트 안의 경로만 받는다. `//evil.com`이나 `https://…`는 기본값으로 바꾼다. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  if (value.includes("\\") || value.length > 200) return "/dashboard";
  return value;
}

export function encodeFlow(flow: OAuthFlow): string {
  return Buffer.from(JSON.stringify(flow)).toString("base64url");
}

export function decodeFlow(raw: string | undefined): OAuthFlow | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<OAuthFlow>;
    if (!isOAuthProviderId(value.provider) || typeof value.state !== "string") return null;
    return {
      provider: value.provider,
      state: value.state,
      verifier: typeof value.verifier === "string" ? value.verifier : null,
      appChallenge: typeof value.appChallenge === "string" ? value.appChallenge : null,
      over14: value.over14 === true,
      next: safeNextPath(value.next),
    };
  } catch {
    return null;
  }
}

/** 제공자의 로그인 화면 주소. 앱 키가 없으면 null. */
export function authorizeUrl(
  provider: OAuthProviderId,
  origin: string,
  flow: Pick<OAuthFlow, "state" | "verifier">,
): string | null {
  const creds = credentials(provider);
  if (!creds) return null;
  const config = PROVIDERS[provider];
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("redirect_uri", redirectUri(origin, provider));
  url.searchParams.set("state", flow.state);
  if (config.scope) url.searchParams.set("scope", config.scope);
  if (config.pkce && flow.verifier) {
    url.searchParams.set("code_challenge", s256(flow.verifier));
    url.searchParams.set("code_challenge_method", "S256");
  }
  // 구글은 계정이 여럿이면 고르게 한다 — 브라우저에 로그인된 아무 계정으로 조용히 가입되지 않게.
  if (provider === "google") url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** 제공자에게서 받은 로그인한 사람. */
export interface OAuthProfile {
  subject: string;
  /** 소문자로 정규화한 이메일. 동의하지 않았거나 주지 않으면 null. */
  email: string | null;
  /** 제공자가 그 이메일을 확인했다고 밝혔는지. 밝히지 않으면 false다(모름을 확인으로 읽지 않는다). */
  emailVerified: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.includes("@") && email.length <= 254 ? email : null;
}

/** 제공자마다 다른 프로필 응답을 한 모양으로. 읽을 수 없으면 null. */
export function parseProfile(provider: OAuthProviderId, body: unknown): OAuthProfile | null {
  const data = asRecord(body);
  if (!data) return null;
  if (provider === "google") {
    if (typeof data.sub !== "string" || !data.sub) return null;
    return {
      subject: data.sub,
      email: normalizeEmail(data.email),
      emailVerified: data.email_verified === true,
    };
  }
  if (provider === "kakao") {
    const id = data.id;
    if ((typeof id !== "number" && typeof id !== "string") || id === "") return null;
    const account = asRecord(data.kakao_account);
    const email = normalizeEmail(account?.email);
    return {
      subject: String(id),
      email,
      // 카카오는 두 값을 따로 준다. 확인됐고 지금도 쓸 수 있는 주소일 때만 확인된 것으로 본다.
      emailVerified:
        email !== null && account?.is_email_verified === true && account?.is_email_valid === true,
    };
  }
  // 네이버
  if (data.resultcode !== "00") return null;
  const response = asRecord(data.response);
  if (typeof response?.id !== "string" || !response.id) return null;
  return {
    subject: response.id,
    email: normalizeEmail(response.email),
    // 네이버는 이메일을 확인했는지 알려 주지 않는다.
    emailVerified: false,
  };
}

export class OAuthError extends Error {
  constructor(readonly code: OAuthErrorCode) {
    super(code);
  }
}

type Fetcher = typeof fetch;

/** 인가 코드를 액세스 토큰으로 바꾸고 프로필을 읽는다. */
export async function fetchProfile(
  provider: OAuthProviderId,
  origin: string,
  code: string,
  flow: OAuthFlow,
  fetcher: Fetcher = fetch,
): Promise<OAuthProfile> {
  const creds = credentials(provider);
  if (!creds) throw new OAuthError("unavailable");
  const config = PROVIDERS[provider];

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: creds.clientId,
    code,
    redirect_uri: redirectUri(origin, provider),
  });
  if (creds.clientSecret) form.set("client_secret", creds.clientSecret);
  if (config.pkce && flow.verifier) form.set("code_verifier", flow.verifier);
  if (provider === "naver") form.set("state", flow.state);

  const tokenRes = await fetcher(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: form.toString(),
    cache: "no-store",
  });
  const tokenBody = asRecord(await tokenRes.json().catch(() => null));
  const accessToken = tokenBody?.access_token;
  if (!tokenRes.ok || typeof accessToken !== "string" || !accessToken) {
    throw new OAuthError("provider");
  }

  const profileRes = await fetcher(config.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!profileRes.ok) throw new OAuthError("provider");
  const profile = parseProfile(provider, await profileRes.json().catch(() => null));
  if (!profile) throw new OAuthError("provider");
  return profile;
}
