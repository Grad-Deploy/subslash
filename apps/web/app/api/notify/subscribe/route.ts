import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { users } from "@lib/schema";
import { generateSyncToken, hashSyncToken, signLink } from "@lib/tokens";
import { appUrl, sendEmail, verificationEmail } from "@lib/email";
import { normalizeEmail } from "@lib/notify-server";

const VERIFY_TTL_SECONDS = 60 * 60 * 24 * 3;

/**
 * Opt into email reminders. Always issues a fresh sync token and always
 * requires the address to be confirmed before anything is sent, so a mistyped
 * or hostile submission cannot turn SubSlash into a spam vector.
 */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    if (!email) {
      return NextResponse.json({ error: "유효한 이메일 주소를 입력해주세요." }, { status: 400 });
    }

    const reminderDays =
      Number.isInteger(body?.reminderDays) && body.reminderDays >= 1 && body.reminderDays <= 14
        ? body.reminderDays
        : 3;

    const db = getDb();
    const syncToken = generateSyncToken();
    const syncTokenHash = hashSyncToken(syncToken);

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

    let userId: string;
    if (existing[0]) {
      // Re-opting in from a new browser: rotate the token so only the newest
      // device can sync, but keep any existing verification.
      userId = existing[0].id;
      await db.update(users).set({ syncTokenHash, reminderDays }).where(eq(users.id, userId));
    } else {
      const inserted = await db
        .insert(users)
        .values({ email, syncTokenHash, reminderDays })
        .returning({ id: users.id });
      userId = inserted[0].id;
    }

    const alreadyVerified = Boolean(existing[0]?.verifiedAt);

    if (!alreadyVerified) {
      const token = signLink({ uid: userId, act: "verify" }, VERIFY_TTL_SECONDS);
      const { subject, html, text } = verificationEmail(
        `${appUrl()}/api/notify/verify?token=${encodeURIComponent(token)}`,
      );
      await sendEmail({ to: email, subject, html, text });
    }

    return NextResponse.json({ syncToken, email, reminderDays, verified: alreadyVerified });
  } catch (error) {
    console.error("[api/notify/subscribe]", error);
    return NextResponse.json({ error: "알림 신청을 처리하지 못했습니다." }, { status: 500 });
  }
}
