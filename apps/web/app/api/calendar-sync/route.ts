import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { appUrl } from "@lib/email";
import { isAppOrigin } from "@lib/app-origins";
import { gmailConnectWebAppUrl } from "@lib/gmail-auto-import";
import { createCalendarSyncPlan, parseCalendarPlan } from "@lib/calendar-sync";
import { logError } from "@lib/log";

/**
 * '구글 캘린더에 등록'을 시작한다. 브라우저가 지금 구독의 결제일을 맡기면, SubSlash Apps Script
 * 웹 앱 주소를 1회용 코드와 함께 돌려준다. 브라우저가 그 주소로 가면 그 사람의 Google 권한으로
 * 웹 앱이 돌면서 계획을 받아 자기 캘린더에 쓴다.
 *
 * 구독 이름·금액은 주소에 싣지 않는다 — 주소는 Google의 기록과 브라우저 방문 기록에 남는다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const webAppUrl = gmailConnectWebAppUrl();
  if (!webAppUrl) {
    return NextResponse.json(
      {
        error:
          "이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다. 알림 설정의 캘린더 구독을 쓰세요.",
      },
      { status: 503 },
    );
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const plan = parseCalendarPlan(await request.json().catch(() => null));
    if (!plan) {
      return NextResponse.json({ error: "보낸 구독 목록을 읽지 못했습니다." }, { status: 400 });
    }
    if (plan.entries.length === 0) {
      return NextResponse.json({ error: "캘린더에 올릴 구독이 없습니다." }, { status: 400 });
    }

    const url = new URL(webAppUrl);
    url.searchParams.set("action", "calendar");
    url.searchParams.set("code", await createCalendarSyncPlan(account.id, plan));
    // 웹 앱은 이 주소로 계획을 받아 간다. 스크립트가 허용 목록으로 다시 확인한다.
    url.searchParams.set("origin", appUrl());
    // 앱은 이 주소를 인앱 브라우저로 연다. 웹 앱이 끝 화면에 웹사이트로 가는 '돌아가기' 대신
    // '창을 닫으면 앱으로 돌아간다'를 띄우게 알린다.
    if (isAppOrigin(request.headers.get("origin"))) url.searchParams.set("client", "app");
    return NextResponse.json({ url: url.toString() });
  } catch (error) {
    logError("api/calendar-sync", error);
    return NextResponse.json({ error: "캘린더 등록을 시작하지 못했습니다." }, { status: 500 });
  }
}
