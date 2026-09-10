import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { users } from "@lib/schema";
import { generateSyncToken, hashSyncToken, signLink } from "@lib/tokens";
import { appUrl, sendEmail, verificationEmail } from "@lib/email";
import { deleteUserCompletely, normalizeEmail } from "@lib/notify-server";

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

    // 이미 있는 주소로 다시 신청하면 처음부터 다시 시작한다. 예전에는 토큰만
    // 새로 주고 확인 상태와 서버 사본을 그대로 넘겨서, 남의 주소만 알면 그
    // 사람의 구독 사본을 캘린더 피드로 읽거나, 사본을 바꿔 그 사람에게 가는
    // 알림 메일의 내용을 정할 수 있었다. 주소의 주인임을 다시 확인하기
    // 전에는 이전 기록을 아무것도 넘겨받지 않는다.
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      await deleteUserCompletely(existing[0].id);
    }

    const inserted = await db
      .insert(users)
      .values({ email, syncTokenHash: hashSyncToken(syncToken), reminderDays })
      .returning({ id: users.id });

    const token = signLink({ uid: inserted[0].id, act: "verify" }, VERIFY_TTL_SECONDS);
    const { subject, html, text } = verificationEmail(
      `${appUrl()}/api/notify/verify?token=${encodeURIComponent(token)}`,
    );
    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ syncToken, email, reminderDays, verified: false });
  } catch (error) {
    console.error("[api/notify/subscribe]", error);
    return NextResponse.json({ error: "알림 신청을 처리하지 못했습니다." }, { status: 500 });
  }
}
