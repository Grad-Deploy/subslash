import { createHash } from "crypto";
import { and, count, eq, inArray, lt, sql } from "drizzle-orm";
import { parseReceiptEmails, type DiscoveredSubscription } from "@subslash/shared";
import { getDb } from "./db";
import { accounts, gmailDiscoveries, gmailImportLinks, type GmailDiscovery } from "./schema";
import { canSignLinks, generateSyncToken, hashSyncToken, signLink, verifyLink } from "./tokens";
import { readReceiptEmails } from "./gmail-import";

/**
 * Gmail 자동 가져오기의 서버 쪽.
 *
 * 사용자의 Apps Script가 2주마다 결제 메일을 보내면, 서버는 그 자리에서 파싱해 구독 후보만
 * 남긴다. 메일 제목·본문은 저장하지 않는다. 후보는 로그인한 브라우저가 열릴 때 받아 가고, 받은
 * 후보는 지운다 — 구독 기록의 원본은 여전히 브라우저다.
 */

/** 스크립트가 한 번에 보낼 수 있는 크기. 메일 100통 × 1,500자를 넉넉히 넘는다. */
export const MAX_INGEST_BYTES = 2_000_000;

/** 받아 가지 않은 후보를 한 계정에 쌓아 둘 수 있는 수. 토큰이 새도 DB를 채우지 못하게 한다. */
const MAX_PENDING = 100;

/** 받아 가지 않은 후보를 남겨 두는 기간. */
const PENDING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** 결제일을 읽는 달력의 시간대. 한국 서비스라 한국 시간으로 본다(캘린더 피드와 같다). */
const USER_TIME_ZONE = "Asia/Seoul";

export interface ImportLinkStatus {
  createdAt: string;
  lastIngestAt: string | null;
  lastEmailCount: number | null;
  pendingCount: number;
}

export interface DiscoveryDto {
  id: string;
  name: string;
  amount: number;
  currency: "KRW" | "USD";
  billingDay: number;
  billingCycle: "monthly" | "yearly";
  billingMonth: number | null;
  category: string;
  presetId: string | null;
  paymentMethod: string | null;
  receiptDate: string;
  sender: string;
  tier: "auto" | "review";
}

/**
 * 확인 없이 등록해도 되는 후보인지. 알려진 서비스와 맞았고, 최근 결제 메일이며, 해지 알림이
 * 아닌 것만 `auto`다. 이름을 추측한 후보('알 수 없는 결제' 포함)는 사용자가 고른다(`review`).
 * 해지 알림이거나 오래된 메일이라 지금도 결제 중인지 모르는 후보는 남기지 않는다(null).
 */
export function discoveryTier(item: DiscoveredSubscription): "auto" | "review" | null {
  if (!item.selected) return null;
  return item.presetId && item.confidence === "high" ? "auto" : "review";
}

/** 연결 토큰을 새로 만든다. 이미 있으면 바꾼다 — 예전 스크립트는 그 순간부터 거절된다. */
export async function createImportLink(accountId: string, now = new Date()): Promise<string> {
  const token = generateSyncToken();
  const tokenHash = hashSyncToken(token);
  const createdAt = now.toISOString();
  await getDb()
    .insert(gmailImportLinks)
    .values({ accountId, tokenHash, createdAt })
    .onConflictDoUpdate({
      target: gmailImportLinks.accountId,
      set: { tokenHash, createdAt, lastIngestAt: null, lastEmailCount: null },
    });
  return token;
}

export async function readImportLink(accountId: string): Promise<ImportLinkStatus | null> {
  const db = getDb();
  const [link] = await db
    .select()
    .from(gmailImportLinks)
    .where(eq(gmailImportLinks.accountId, accountId))
    .limit(1);
  if (!link) return null;
  const [pending] = await db
    .select({ value: count() })
    .from(gmailDiscoveries)
    .where(eq(gmailDiscoveries.accountId, accountId));
  return {
    createdAt: link.createdAt,
    lastIngestAt: link.lastIngestAt,
    lastEmailCount: link.lastEmailCount,
    pendingCount: pending?.value ?? 0,
  };
}

/**
 * 연결과 받아 가지 않은 후보를 지운다. 연결 끊기와 회원 탈퇴가 쓴다. 스키마의 ON DELETE
 * CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 동작하므로 직접 지운다.
 */
export async function deleteGmailImportData(accountId: string): Promise<boolean> {
  const db = getDb();
  await db.delete(gmailDiscoveries).where(eq(gmailDiscoveries.accountId, accountId));
  const deleted = await db
    .delete(gmailImportLinks)
    .where(eq(gmailImportLinks.accountId, accountId))
    .returning({ accountId: gmailImportLinks.accountId });
  return deleted.length > 0;
}

export type IngestResult =
  | { ok: true; received: number; candidates: number }
  | { ok: false; status: 400 | 401; error: string };

/** 스크립트가 보낸 메일을 파싱해 후보를 남긴다. 어느 계정인지는 연결 토큰으로만 정한다. */
export async function ingestReceiptEmails(
  token: string,
  bodyText: string,
  now = new Date(),
): Promise<IngestResult> {
  const db = getDb();
  const [link] = await db
    .select()
    .from(gmailImportLinks)
    .where(eq(gmailImportLinks.tokenHash, hashSyncToken(token)))
    .limit(1);
  if (!link) {
    return {
      ok: false,
      status: 401,
      error: "연결이 끊겼습니다. SubSlash에서 스크립트를 다시 받아 붙여 넣으세요.",
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText);
  } catch {
    return { ok: false, status: 400, error: "보낸 내용을 읽지 못했습니다." };
  }
  const emails = readReceiptEmails(data);
  if (!emails) return { ok: false, status: 400, error: "보낸 내용의 형식이 맞지 않습니다." };

  const { accountId } = link;
  const createdAt = now.toISOString();

  // 오래 받아 가지 않은 후보부터 정리한다.
  await db
    .delete(gmailDiscoveries)
    .where(
      and(
        eq(gmailDiscoveries.accountId, accountId),
        lt(gmailDiscoveries.createdAt, new Date(now.getTime() - PENDING_TTL_MS).toISOString()),
      ),
    );

  const candidates = parseReceiptEmails(emails, { now, timeZone: USER_TIME_ZONE }).flatMap(
    (item) => {
      const tier = discoveryTier(item);
      if (!tier || !item.receiptDate) return [];
      return [
        {
          accountId,
          dedupeKey: `${item.name}|${item.currency}`,
          name: item.name,
          amount: item.amount,
          currency: item.currency,
          billingDay: item.billingDay,
          billingCycle: item.billingCycle,
          billingMonth: item.billingCycle === "yearly" ? (item.billingMonth ?? null) : null,
          category: item.category,
          presetId: item.presetId ?? null,
          paymentMethod: item.paymentMethod ?? null,
          receiptDate: item.receiptDate,
          sender: item.sender?.slice(0, 120) ?? "",
          tier,
          createdAt,
        },
      ];
    },
  );

  // 이미 있는 서비스는 갱신이라 자리를 차지하지 않는다. 새 서비스는 남은 자리만큼만 받는다.
  const existing = await db
    .select({ dedupeKey: gmailDiscoveries.dedupeKey })
    .from(gmailDiscoveries)
    .where(eq(gmailDiscoveries.accountId, accountId));
  const existingKeys = new Set(existing.map((row) => row.dedupeKey));
  let room = MAX_PENDING - existingKeys.size;
  const accepted = candidates.filter((row) => {
    if (existingKeys.has(row.dedupeKey)) return true;
    if (room <= 0) return false;
    room -= 1;
    return true;
  });

  for (const row of accepted) {
    await db
      .insert(gmailDiscoveries)
      .values(row)
      .onConflictDoUpdate({
        target: [gmailDiscoveries.accountId, gmailDiscoveries.dedupeKey],
        set: {
          amount: row.amount,
          billingDay: row.billingDay,
          billingCycle: row.billingCycle,
          billingMonth: row.billingMonth,
          category: row.category,
          presetId: row.presetId,
          paymentMethod: row.paymentMethod,
          receiptDate: row.receiptDate,
          sender: row.sender,
          tier: row.tier,
          createdAt: row.createdAt,
        },
        // 같은 메일을 두 번 보내거나 옛 메일이 늦게 와도 더 최근 결과를 덮지 않는다.
        setWhere: sql`excluded.receipt_date >= ${gmailDiscoveries.receiptDate}`,
      });
  }

  await db
    .update(gmailImportLinks)
    .set({ lastIngestAt: createdAt, lastEmailCount: emails.length })
    .where(eq(gmailImportLinks.accountId, accountId));

  return { ok: true, received: emails.length, candidates: accepted.length };
}

function toDto(row: GmailDiscovery): DiscoveryDto {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency === "USD" ? "USD" : "KRW",
    billingDay: row.billingDay,
    billingCycle: row.billingCycle === "yearly" ? "yearly" : "monthly",
    billingMonth: row.billingMonth,
    category: row.category,
    presetId: row.presetId,
    paymentMethod: row.paymentMethod,
    receiptDate: row.receiptDate,
    sender: row.sender,
    tier: row.tier === "auto" ? "auto" : "review",
  };
}

export async function listDiscoveries(accountId: string): Promise<DiscoveryDto[]> {
  const rows = await getDb()
    .select()
    .from(gmailDiscoveries)
    .where(eq(gmailDiscoveries.accountId, accountId));
  return rows.map(toDto);
}

/** 브라우저가 받은(등록했거나 버린) 후보를 지운다. 다른 계정의 id는 지우지 않는다. */
export async function acknowledgeDiscoveries(accountId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const deleted = await getDb()
    .delete(gmailDiscoveries)
    .where(and(eq(gmailDiscoveries.accountId, accountId), inArray(gmailDiscoveries.id, ids)))
    .returning({ id: gmailDiscoveries.id });
  return deleted.length;
}

/** 연결 코드가 쓸 수 있는 시간. Google 권한 화면을 읽고 허용하기에 넉넉하다. */
const CONNECT_CODE_TTL_SECONDS = 10 * 60;

/**
 * 원클릭 연결에 쓰는 SubSlash의 Apps Script 웹 앱 주소. 운영자가 웹 앱을 배포한 뒤 환경 변수에
 * 넣는다. 없거나 Apps Script 주소가 아니면 원클릭 연결을 보여주지 않는다(복사 방식은 그대로 된다).
 */
export function gmailConnectWebAppUrl(): string | null {
  const url = process.env.GMAIL_CONNECT_WEB_APP_URL?.trim();
  if (!url || !url.startsWith("https://script.google.com/macros/s/") || !canSignLinks()) {
    return null;
  }
  return url;
}

/**
 * 웹 앱에 넘길 연결 코드. 연결 토큰 자체는 주소에 싣지 않는다 — 주소는 Google의 기록과 브라우저
 * 방문 기록에 남는다. 코드는 10분 동안만, 그리고 발급 시점의 연결 상태에서만 교환된다.
 */
export async function createConnectCode(accountId: string): Promise<string> {
  return signLink(
    { uid: accountId, act: "gmail-connect", ln: await linkFingerprint(accountId) },
    CONNECT_CODE_TTL_SECONDS,
  );
}

/**
 * 지금 연결의 지문. 연결을 새로 발급할 때마다 무작위 토큰이 바뀌므로 지문도 바뀐다 — 한 번 교환한
 * 코드를 다시 쓸 수 없게 하는 근거다. 코드는 주소에 실리므로 토큰 해시를 그대로 싣지 않는다.
 */
async function linkFingerprint(accountId: string): Promise<string> {
  const [link] = await getDb()
    .select({ tokenHash: gmailImportLinks.tokenHash })
    .from(gmailImportLinks)
    .where(eq(gmailImportLinks.accountId, accountId))
    .limit(1);
  return link
    ? createHash("sha256").update(`link:${link.tokenHash}`).digest("hex").slice(0, 32)
    : "none";
}

/**
 * 웹 앱이 사용자의 권한으로 돌면서 코드를 연결 토큰으로 바꾼다. 교환하면 연결을 새로 발급하므로
 * 예전 스크립트(복사 방식 포함)는 거절되고, 같은 코드는 다시 쓸 수 없다.
 */
export async function exchangeConnectCode(code: string): Promise<string | null> {
  const payload = verifyLink(code);
  if (!payload || payload.act !== "gmail-connect" || !payload.ln) return null;

  if ((await linkFingerprint(payload.uid)) !== payload.ln) return null;

  // 코드를 받은 뒤 탈퇴한 계정에 주인 없는 연결을 만들지 않는다.
  const [account] = await getDb()
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.id, payload.uid))
    .limit(1);
  if (!account) return null;

  return createImportLink(payload.uid);
}
