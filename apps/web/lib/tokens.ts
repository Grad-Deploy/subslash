import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Two separate secrets by design:
 *
 * - The sync token authenticates the browser's mirror uploads. It is sent in an
 *   Authorization header, never in a URL, and only its hash is stored.
 * - Email links carry a short-lived HMAC-signed payload instead, because URLs
 *   leak through referrers, mail scanners and browser history.
 */

export function generateSyncToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSyncToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function linkSecret(): string {
  const secret = process.env.EMAIL_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("EMAIL_LINK_SECRET (or CRON_SECRET) must be set to sign email links.");
  }
  return secret;
}

export interface LinkPayload {
  /** User id — `verify-account`이면 로그인 계정(accounts)의 id. */
  uid: string;
  /**
   * What the link is allowed to do.
   *
   * `verify`는 알림 미러(notification_subscribers)용이고 `verify-account`는 로그인 계정용이다. 둘은
   * 서로 다른 테이블의 id를 담는다. 하나로 쓰면 알림 확인 링크가 같은 id를 가진
   * 계정을 인증하는 길이 열린다.
   */
  act: "verify" | "unsubscribe" | "verify-account";
  /**
   * 링크가 가리키는 이메일의 지문(`emailFingerprint`). 주소가 바뀌면 옛 주소로
   * 보낸 링크가 새 주소를 인증하지 못하게 한다.
   */
  em?: string;
  /** Expiry, epoch seconds. */
  exp: number;
}

/** 서명 키가 있어 메일 링크를 만들 수 있는지. 없으면 `signLink`·`verifyLink`가 예외를 던진다. */
export function canSignLinks(): boolean {
  return Boolean(process.env.EMAIL_LINK_SECRET || process.env.CRON_SECRET);
}

/**
 * 링크에 담는 이메일 지문. 링크는 주소창·기록에 남으므로 주소 자체는 넣지 않는다.
 * 서명 키로 만든 HMAC이라, 흔한 주소를 대입해 지문을 맞춰볼 수도 없다.
 */
export function emailFingerprint(email: string): string {
  return createHmac("sha256", linkSecret())
    .update(`email:${email}`)
    .digest("base64url")
    .slice(0, 22);
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signLink(payload: Omit<LinkPayload, "exp">, ttlSeconds: number): string {
  const body: LinkPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = base64url(JSON.stringify(body));
  const mac = createHmac("sha256", linkSecret()).update(encoded).digest("base64url");
  return `${encoded}.${mac}`;
}

export function verifyLink(token: string): LinkPayload | null {
  const [encoded, mac] = token.split(".");
  if (!encoded || !mac) return null;

  const expected = createHmac("sha256", linkSecret()).update(encoded).digest("base64url");
  const given = Buffer.from(mac);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as LinkPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
