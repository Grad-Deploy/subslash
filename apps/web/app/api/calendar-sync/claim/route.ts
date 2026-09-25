import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { appUrl } from "@lib/email";
import { CALENDAR_NAME, buildCalendarEvents, claimCalendarSyncPlan } from "@lib/calendar-sync";
import { logError } from "@lib/log";

/**
 * SubSlash 웹 앱(Apps Script)이 사용자의 권한으로 돌면서 코드를 결제일 일정으로 바꾸는 곳.
 * Google 서버에서 부르므로 로그인 세션은 없고, 1회용 코드만 믿는다. 한 번 받아 가면 계획은
 * 지워진다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  try {
    const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
    const code = typeof body?.code === "string" ? body.code.slice(0, 200) : "";
    const plan = code ? await claimCalendarSyncPlan(code) : null;
    if (!plan) {
      return NextResponse.json(
        { error: "요청이 만료됐거나 이미 쓰였습니다. SubSlash에서 다시 눌러 주세요." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      calendarName: CALENDAR_NAME,
      events: buildCalendarEvents(plan, { appUrl: appUrl() }),
    });
  } catch (error) {
    logError("api/calendar-sync/claim", error);
    return NextResponse.json({ error: "결제일을 읽지 못했습니다." }, { status: 500 });
  }
}
