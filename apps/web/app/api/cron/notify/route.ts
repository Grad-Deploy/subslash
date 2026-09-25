import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import {
  getDaysUntilBillingFor,
  getNextBillingDateFor,
  type BillingCycle,
  type Currency,
} from "@subslash/shared";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { mirroredSubscriptions, notificationLog, notificationSubscribers } from "@lib/schema";
import { signLink } from "@lib/tokens";
import { pruneStaleContributions } from "@lib/stats-server";
import { isAnonymousStatsOpen, isDeviceUsageOpen } from "@lib/privacy";
import { pruneDeviceUsage } from "@lib/device-usage-server";
import { prunePendingSubscribers } from "@lib/notify-server";
import { appUrl, reminderEmail, sendEmail, type ReminderItem } from "@lib/email";
import { logError } from "@lib/log";

const UNSUBSCRIBE_TTL_SECONDS = 60 * 60 * 24 * 90;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Daily reminder sweep (see the `crons` entry in vercel.json).
 *
 * Only verified users are contacted, and the notification log makes the sweep
 * idempotent: re-running it on the same day, or retrying after a partial
 * failure, will not send a subscription's reminder twice for one billing date.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // 비밀값이 없으면 누구나 이 주소를 호출해 메일을 보낼 수 있으므로 실행하지
    // 않는다. 500이 아니라 503인 이유는, 이것이 코드의 결함이 아니라 배포에
    // 환경 변수가 빠진 상태이기 때문이다 — 매일 한 번씩 500이 쌓이면 진짜
    // 장애와 구분되지 않는다.
    console.error(
      "[cron/notify] CRON_SECRET is not set; refusing to run. " +
        "Set CRON_SECRET in the deployment environment to enable reminder emails.",
    );
    return NextResponse.json(
      { error: "Reminder emails are not configured on this server (CRON_SECRET is missing)." },
      { status: 503 },
    );
  }
  if (!sameSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  const now = new Date();
  const db = getDb();

  let considered = 0;
  let notified = 0;
  let skipped = 0;
  const failures: string[] = [];

  try {
    const recipients = await db
      .select()
      .from(notificationSubscribers)
      .where(isNotNull(notificationSubscribers.verifiedAt));

    for (const user of recipients) {
      const subs = await db
        .select()
        .from(mirroredSubscriptions)
        .where(eq(mirroredSubscriptions.userId, user.id));

      const due: ReminderItem[] = [];

      for (const sub of subs) {
        considered += 1;
        const schedule = {
          billingDay: sub.billingDay,
          billingCycle: sub.billingCycle as BillingCycle,
          billingMonth: sub.billingMonth ?? undefined,
        };

        // A yearly plan with no billing month has no date to remind about.
        // Treating it as monthly, which this sweep used to do, mailed the user
        // about eleven charges a year that never happen.
        const daysLeft = getDaysUntilBillingFor(schedule, now);
        if (daysLeft === null || daysLeft !== user.reminderDays) continue;

        const nextBillingDate = getNextBillingDateFor(schedule, now);
        if (!nextBillingDate) continue;
        const billingDate = toDateKey(nextBillingDate);

        // Idempotency: claim the send before doing it. A duplicate row means a
        // previous run already covered this billing date.
        try {
          await db.insert(notificationLog).values({
            userId: user.id,
            clientId: sub.clientId,
            billingDate,
          });
        } catch {
          skipped += 1;
          continue;
        }

        due.push({
          clientId: sub.clientId,
          name: sub.name,
          amount: sub.amount,
          currency: sub.currency as Currency,
          billingDate,
          daysLeft,
        });
      }

      if (due.length === 0) continue;

      const unsubscribeToken = signLink(
        { uid: user.id, act: "unsubscribe" },
        UNSUBSCRIBE_TTL_SECONDS,
      );
      const { subject, html, text } = reminderEmail(
        due,
        `${appUrl()}/api/notify/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
      );

      const result = await sendEmail({ to: user.email, subject, html, text });
      if (result.delivered || result.simulated) {
        notified += due.length;
      } else {
        failures.push(user.id);
        // Release the claims so the next run can retry this batch.
        for (const item of due) {
          await db
            .delete(notificationLog)
            .where(
              and(
                eq(notificationLog.userId, user.id),
                eq(notificationLog.clientId, item.clientId),
                eq(notificationLog.billingDate, item.billingDate),
              ),
            );
        }
      }
    }

    // 익명 통계의 오래된 참여 기록도 같은 하루 한 번에 치운다(방침의 보관 기간). 실패해도 알림 결과는
    // 그대로 돌려준다 — 다음 날 다시 치운다.
    // 기능을 열기 전에는 표가 없을 수 있다(마이그레이션은 시작일을 정할 때 적용한다).
    const prunedStats = isAnonymousStatsOpen(now)
      ? await pruneStaleContributions(now).catch((error: unknown) => {
          logError("cron/notify stats prune failed", error);
          return null;
        })
      : null;

    // 기기 간 사용 측정의 보관 기간(40일)이 지난 구간도 함께 치운다. 열기 전에는 표가 없을 수 있다.
    const prunedUsage = isDeviceUsageOpen(now)
      ? await pruneDeviceUsage(now.getTime()).catch((error: unknown) => {
          logError("cron/notify usage prune failed", error);
          return null;
        })
      : null;

    // 확인 링크를 누르지 않은 알림 신청(3일)도 치운다. 확인되지 않은 주소를 서버에 남기지 않는다.
    const prunedPending = await prunePendingSubscribers(now).catch((error: unknown) => {
      logError("cron/notify pending prune failed", error);
      return null;
    });

    return NextResponse.json({
      success: failures.length === 0,
      prunedPending,
      prunedStats,
      prunedUsage,
      recipients: recipients.length,
      considered,
      notified,
      skipped,
      failed: failures.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError("cron/notify", error);
    return NextResponse.json({ error: "Reminder sweep failed" }, { status: 500 });
  }
}

/** 앞에서부터 다른 글자에서 바로 멈추는 비교는 응답 시간으로 비밀값을 한 글자씩 알아낼 수 있다. */
function sameSecret(given: string | null, expected: string): boolean {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
