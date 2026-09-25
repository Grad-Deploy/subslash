import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { confirmSubscriber } from "@lib/notify-server";
import { verifyLink } from "@lib/tokens";
import { appUrl } from "@lib/email";
import { logError } from "@lib/log";

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
    // 같은 주소로 알림을 받던 예전 기록은 여기서 이 기록으로 바뀐다. 신청만으로는 바뀌지 않는다
    // (api/notify/subscribe). 기록이 이미 없으면 더 새로 신청했거나 알림을 끈 것이다.
    if (!(await confirmSubscriber(payload.uid))) {
      return NextResponse.redirect(`${appUrl()}/subs?notify=invalid`);
    }

    return NextResponse.redirect(`${appUrl()}/subs?notify=verified`);
  } catch (error) {
    logError("api/notify/verify", error);
    return NextResponse.redirect(`${appUrl()}/subs?notify=error`);
  }
}
