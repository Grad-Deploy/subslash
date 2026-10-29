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

/** SHA-256의 16진수. 저장하는 토큰·1회용 코드는 이 해시로만 둔다. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function linkSecret(): string {
  const secret = process.env.EMAIL_LINK_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("EMAIL_LINK_SECRET (or CRON_SECRET) must be set to sign email links.");
  }
  return secret;
}

export interface LinkPayload {
  /** User id — `verify-account`·`reset-password`이면 로그인 계정(accounts)의 id. */
  uid: string;
  /**
   * What the link is allowed to do.
   *
   * `verify`는 알림 미러(notification_subscribers)용이고 `verify-account`는 로그인 계정용이다. 둘은
   * 서로 다른 테이블의 id를 담는다. 하나로 쓰면 알림 확인 링크가 같은 id를 가진
   * 계정을 인증하는 길이 열린다. `reset-password`도 따로 둔다 — 가입 확인 링크로
   * 비밀번호를 바꿀 수 있으면, 3일짜리 링크가 계정을 넘겨받는 열쇠가 된다.
   */
  act:
    "verify" | "unsubscribe" | "verify-account" | "reset-password" | "gmail-connect" | "oauth-link";
  /**
   * 링크가 가리키는 이메일의 지문(`emailFingerprint`). 주소가 바뀌면 옛 주소로
   * 보낸 링크가 새 주소를 인증하지 못하게 한다.
   */
  em?: string;
  /**
   * 링크를 보낼 때의 비밀번호 해시 지문(`passwordFingerprint`). 재설정 링크에만 담는다.
   * 비밀번호가 한 번 바뀌면 해시가 달라지므로, 쓴 링크와 그 전에 보낸 링크가 함께
   * 쓸모없어진다. 링크를 DB에 따로 적어두지 않고도 한 번만 쓰이게 하는 방법이다.
   */
  pw?: string;
  /**
   * Gmail 연결 코드(`gmail-connect`)를 만들 때의 연결 지문. 연결이 없었으면 "none". 코드를 한 번
   * 교환하면 연결이 새로 발급되어 이 값이 달라지므로, 같은 코드를 다시 쓸 수 없다.
   */
  ln?: string;
  /**
   * 로그인 방법 연결 코드(`oauth-link`)가 이을 제공자. 다른 제공자를 잇는 데 쓰지 못하게 한다. 같은 코드의
   * `ln`은 그때 계정에 이어 둔 제공자들의 지문이라, 하나를 이으면 지문이 바뀌어 같은 코드를 다시 쓸 수 없다.
   */
  pv?: string;
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

/**
 * 링크에 담는 비밀번호 해시의 지문. 해시 자체를 링크에 싣지 않는다 — 링크가 새면
 * 해시를 두고 오프라인으로 비밀번호를 대입해볼 수 있게 된다.
 */
export function passwordFingerprint(passwordHash: string): string {
  return createHmac("sha256", linkSecret())
    .update(`password:${passwordHash}`)
    .digest("base64url")
    .slice(0, 22);
}

/**
 * 서버가 내려 보냈다가 그대로 돌려받는 값(쿠키 등)에 서명을 붙인다. 쿠키는 httpOnly여도 그 브라우저의 주인은 고칠 수
 * 있으므로, 서버가 적은 값만 믿으려면 서명이 있어야 한다. 용도(`purpose`)를 함께 서명해 다른 곳의 값으로 쓰지 못하게 한다.
 */
export function signValue(purpose: string, value: string): string {
  const mac = createHmac("sha256", linkSecret()).update(`${purpose}:${value}`).digest("base64url");
  return `${value}.${mac}`;
}

/** `signValue`로 서명한 값. 서명이 없거나 맞지 않으면 null. */
export function readSignedValue(purpose: string, signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = signed.slice(0, dot);
  const given = Buffer.from(signed.slice(dot + 1));
  const want = Buffer.from(
    createHmac("sha256", linkSecret()).update(`${purpose}:${value}`).digest("base64url"),
  );
  return given.length === want.length && timingSafeEqual(given, want) ? value : null;
}

export function signLink(payload: Omit<LinkPayload, "exp">, ttlSeconds: number): string {
  const body: LinkPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
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
