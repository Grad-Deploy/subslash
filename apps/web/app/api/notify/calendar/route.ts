import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@lib/db";
import { users } from "@lib/schema";
import { generateSyncToken, hashSyncToken } from "@lib/tokens";
import { userFromRequest } from "@lib/notify-server";
import { appUrl } from "@lib/email";

function feedUrl(token: string): string {
  return `${appUrl()}/api/calendar/${token}.ics`;
}

/**
 * Turns the calendar feed on, or rotates it.
 *
 * Only the hash is stored, so the URL is shown once per rotation and cannot be
 * recovered from the server afterwards. Rotating is also how a user revokes a
 * URL they shared or pasted somewhere they regret.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = generateSyncToken();
    await getDb()
      .update(users)
      .set({ calendarTokenHash: hashSyncToken(token) })
      .where(eq(users.id, user.id));

    return NextResponse.json({ url: feedUrl(token), reminderDays: user.reminderDays });
  } catch (error) {
    console.error("[api/notify/calendar]", error);
    return NextResponse.json({ error: "캘린더 주소를 만들지 못했습니다." }, { status: 500 });
  }
}

/** Switches the feed off. Subscribed calendars stop resolving immediately. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await userFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await getDb().update(users).set({ calendarTokenHash: null }).where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/notify/calendar]", error);
    return NextResponse.json({ error: "캘린더 구독 해제에 실패했습니다." }, { status: 500 });
  }
}
