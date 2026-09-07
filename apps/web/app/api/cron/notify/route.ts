import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDaysUntilBilling, getNextBillingDate, type Currency } from "@subslash/shared";
import { getDb } from "@lib/db";
import { mirroredSubscriptions, notificationLog, users } from "@lib/schema";
import { signLink } from "@lib/tokens";
import { appUrl, reminderEmail, sendEmail, type ReminderItem } from "@lib/email";

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
    console.error("[cron/notify] CRON_SECRET is not set; refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const db = getDb();

  let considered = 0;
  let notified = 0;
  let skipped = 0;
  const failures: string[] = [];

  try {
    const recipients = await db.select().from(users).where(isNotNull(users.verifiedAt));

    for (const user of recipients) {
      const subs = await db
        .select()
        .from(mirroredSubscriptions)
        .where(eq(mirroredSubscriptions.userId, user.id));

      const due: ReminderItem[] = [];

      for (const sub of subs) {
        considered += 1;
        const daysLeft = getDaysUntilBilling(sub.billingDay, now);
        if (daysLeft !== user.reminderDays) continue;

        const billingDate = toDateKey(getNextBillingDate(sub.billingDay, now));

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

    return NextResponse.json({
      success: failures.length === 0,
      recipients: recipients.length,
      considered,
      notified,
      skipped,
      failed: failures.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[cron/notify]", error);
    return NextResponse.json({ error: "Reminder sweep failed" }, { status: 500 });
  }
}
