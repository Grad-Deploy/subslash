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
  /** User id. */
  uid: string;
  /** What the link is allowed to do. */
  act: "verify" | "unsubscribe";
  /** Expiry, epoch seconds. */
  exp: number;
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
