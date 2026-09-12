import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { databaseUnavailableResponse, getDb } from "@lib/db";
import { notificationSubscribers } from "@lib/schema";
import { verifyLink } from "@lib/tokens";
import { appUrl } from "@lib/email";

/** Confirmation link target from the opt-in email. Redirects back into the app. */
export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  const token = request.nextUrl.searchParams.get("token");
  const payload = token ? verifyLink(token) : null;

  if (!payload || payload.act !== "verify") {
    return NextResponse.redirect(`${appUrl()}/subs?notify=invalid`);
  }

  try {
    await getDb()
      .update(notificationSubscribers)
      .set({ verifiedAt: new Date().toISOString() })
      .where(eq(notificationSubscribers.id, payload.uid));

    return NextResponse.redirect(`${appUrl()}/subs?notify=verified`);
  } catch (error) {
    console.error("[api/notify/verify]", error);
    return NextResponse.redirect(`${appUrl()}/subs?notify=error`);
  }
}
