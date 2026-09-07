import { NextRequest, NextResponse } from "next/server";
import { verifyLink } from "@lib/tokens";
import { deleteUserCompletely } from "@lib/notify-server";
import { appUrl } from "@lib/email";

/**
 * Unsubscribe link from the reminder footer. Deletes the user outright — the
 * mirrored subscriptions and notification log cascade with it, so opting out
 * removes everything the server held.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const payload = token ? verifyLink(token) : null;

  if (!payload || payload.act !== "unsubscribe") {
    return NextResponse.redirect(`${appUrl()}/subs?notify=invalid`);
  }

  try {
    await deleteUserCompletely(payload.uid);
    return NextResponse.redirect(`${appUrl()}/subs?notify=unsubscribed`);
  } catch (error) {
    console.error("[api/notify/unsubscribe]", error);
    return NextResponse.redirect(`${appUrl()}/subs?notify=error`);
  }
}
