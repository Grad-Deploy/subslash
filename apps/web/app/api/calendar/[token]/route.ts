import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@lib/db";
import { mirroredSubscriptions, users } from "@lib/schema";
import { hashSyncToken } from "@lib/tokens";
import { buildBillingCalendar } from "@lib/ics";
import { appUrl } from "@lib/email";

/**
 * The calendar feed a calendar app polls.
 *
 * Unauthenticated by design in the HTTP sense: calendar clients cannot present
 * a bearer header, so the URL itself is the credential. That is why it carries
 * the read-only calendar token and never the sync token, and why the token can
 * be rotated from the app to revoke every subscribed calendar at once.
 */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  // 캘린더 앱이 읽는 주소라 본문은 텍스트여야 한다. 503은 "지금 이 서버에서는
  // 못 한다"는 뜻이라, 앱이 구독을 지우지 않고 다음 폴링 때 다시 시도한다.
  if (!isDatabaseConfigured()) {
    return new NextResponse("Calendar feed is not configured on this server.", { status: 503 });
  }

  const { token: raw } = await context.params;
  // Calendar apps are happier with a URL that ends in .ics; the suffix is not
  // part of the token.
  const token = raw.replace(/[.]ics$/, "");

  if (!token || token.length > 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const rows = await getDb()
      .select()
      .from(users)
      .where(eq(users.calendarTokenHash, hashSyncToken(token)))
      .limit(1);

    const user = rows[0];
    if (!user) {
      // Same response as a token that never existed: a distinguishable error
      // would tell a guesser when they are close.
      return new NextResponse("Not found", { status: 404 });
    }

    const subs = await getDb()
      .select()
      .from(mirroredSubscriptions)
      .where(eq(mirroredSubscriptions.userId, user.id));

    const body = buildBillingCalendar(subs, {
      reminderDays: user.reminderDays,
      appUrl: appUrl(),
    });

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="subslash.ics"',
        // The feed changes whenever the browser syncs, so it must not be held
        // in a shared cache.
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    console.error("[api/calendar]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
