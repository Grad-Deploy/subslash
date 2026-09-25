import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { notificationSubscribers } from "@lib/schema";
import { generateSyncToken, hashSyncToken, signLink } from "@lib/tokens";
import { appUrl, sendEmail, verificationEmail } from "@lib/email";
import { deletePendingSubscribers, normalizeEmail } from "@lib/notify-server";
import {
  clientIp,
  hit,
  retryAfterSeconds,
  tooManyRequestsMessage,
  type RateLimitRule,
} from "@lib/rate-limit";
import { logError } from "@lib/log";

const VERIFY_TTL_SECONDS = 60 * 60 * 24 * 3;

/**
 * 로그인 없이 부르는 곳이라, 막지 않으면 남의 주소로 확인 메일을 끝없이 보내거나 메일 발송 한도를
 * 다 써 버릴 수 있다. 같은 주소로 다시 신청하면 그 주소의 알림 설정이 처음부터 다시 시작되므로,
 * 주소 기준 제한은 남의 설정을 거듭 지우는 것도 늦춘다.
 */
const PER_EMAIL: RateLimitRule = { limit: 3, windowMs: 60 * 60 * 1000 };
const PER_IP: RateLimitRule = { limit: 10, windowMs: 60 * 60 * 1000 };

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

    const emailKey = `notify-subscribe:email:${email}`;
    const ipKey = `notify-subscribe:ip:${clientIp(request.headers)}`;
    const wait = Math.max(retryAfterSeconds(emailKey, PER_EMAIL), retryAfterSeconds(ipKey, PER_IP));
    if (wait > 0) {
      return NextResponse.json(
        { error: tooManyRequestsMessage(wait) },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }
    hit(emailKey, PER_EMAIL);
    hit(ipKey, PER_IP);

    const reminderDays =
      Number.isInteger(body?.reminderDays) && body.reminderDays >= 1 && body.reminderDays <= 14
        ? body.reminderDays
        : 3;

    const db = getDb();
    const syncToken = generateSyncToken();

    // 이미 있는 주소로 다시 신청하면 새 기록을 '확인 전'으로 따로 만든다. 예전에는 토큰만 새로
    // 주고 확인 상태와 서버 사본을 그대로 넘겨서, 남의 주소만 알면 그 사람의 구독 사본을 캘린더
    // 피드로 읽거나 알림 메일의 내용을 정할 수 있었다. 그 뒤로는 확인된 기록을 곧바로 지웠는데,
    // 그러면 남의 주소만 알아도 그 사람의 알림과 캘린더 피드를 끊을 수 있었다. 이제 새 기록은
    // 아무것도 넘겨받지 않고, 예전 기록은 주인이 메일의 확인 링크를 누를 때에만 새 기록으로
    // 바뀐다(api/notify/verify). 지우는 것은 같은 주소의 확인 전 신청뿐이다.
    await deletePendingSubscribers(email);

    const inserted = await db
      .insert(notificationSubscribers)
      .values({ email, syncTokenHash: hashSyncToken(syncToken), reminderDays })
      .returning({ id: notificationSubscribers.id });

    const token = signLink({ uid: inserted[0].id, act: "verify" }, VERIFY_TTL_SECONDS);
    const { subject, html, text } = verificationEmail(
      `${appUrl()}/api/notify/verify?token=${encodeURIComponent(token)}`,
    );
    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ syncToken, email, reminderDays, verified: false });
  } catch (error) {
    logError("api/notify/subscribe", error);
    return NextResponse.json({ error: "알림 신청을 처리하지 못했습니다." }, { status: 500 });
  }
}
