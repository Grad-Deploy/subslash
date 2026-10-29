import { HOUR_MS } from "@subslash/shared";
import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getRequestAccount, loginRequiredResponse } from "@lib/auth-server";
import { featureClosedResponse, isGmailAutoImportOpen } from "@lib/privacy";
import { appUrl } from "@lib/email";
import { isAppOrigin } from "@lib/app-origins";
import { isAppReturnScheme } from "@lib/app-return";
import { gmailConnectWebAppUrl } from "@lib/gmail-auto-import";
import { createCalendarSyncPlan, parseCalendarPlan } from "@lib/calendar-sync";
import {
  hit,
  retryAfterSeconds,
  tooManyRequestsResponse,
  type RateLimitRule,
} from "@lib/rate-limit";
import { logError } from "@lib/log";
import { SOURCE_LOCALE } from "@lib/i18n/config";

/**
 * '구글 캘린더에 등록'을 시작한다. 브라우저가 지금 구독의 결제일을 맡기면, SubSlash Apps Script
 * 웹 앱 주소를 1회용 코드와 함께 돌려준다. 브라우저가 그 주소로 가면 그 사람의 Google 권한으로
 * 웹 앱이 돌면서 계획을 받아 자기 캘린더에 쓴다.
 *
 * 구독 이름·금액은 주소에 싣지 않는다 — 주소는 Google의 기록과 브라우저 방문 기록에 남는다.
 */
/**
 * 누를 때마다 계획 한 줄을 쓴다(계정마다 한 줄을 덮어쓴다). 표는 커지지 않지만 Turso는 행 쓰기 한도가 먼저
 * 차므로 되풀이해 부르는 것을 막는다. 고쳐 가며 몇 번 다시 누르는 것보다 넉넉한 값이다.
 */
const PLANS_PER_ACCOUNT: RateLimitRule = { limit: 20, windowMs: HOUR_MS };

export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) return featureClosedResponse();
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
    const account = await getRequestAccount(request);
    if (!account) return loginRequiredResponse();

    const plan = parseCalendarPlan(await request.json().catch(() => null));
    if (!plan) {
      return NextResponse.json({ error: "보낸 구독 목록을 읽지 못했습니다." }, { status: 400 });
    }
    if (plan.entries.length === 0) {
      return NextResponse.json({ error: "캘린더에 올릴 구독이 없습니다." }, { status: 400 });
    }

    // 읽지 못한 요청은 행을 쓰지 않으므로 세지 않는다.
    const key = `calendar-sync:account:${account.id}`;
    const wait = retryAfterSeconds(key, PLANS_PER_ACCOUNT);
    if (wait > 0) return tooManyRequestsResponse(wait);
    hit(key, PLANS_PER_ACCOUNT);

    const url = new URL(webAppUrl);
    url.searchParams.set("action", "calendar");
    url.searchParams.set("code", await createCalendarSyncPlan(account.id, plan));
    // 웹 앱은 이 주소로 계획을 받아 간다. 스크립트가 허용 목록으로 다시 확인한다.
    url.searchParams.set("origin", appUrl());
    // 웹 앱의 결과 화면도 캘린더 이름처럼 등록한 언어로 보인다.
    if (plan.lang && plan.lang !== SOURCE_LOCALE) url.searchParams.set("lang", plan.lang);
    // 앱은 이 주소를 인앱 브라우저로 연다. 웹 앱이 끝 화면에 웹사이트로 가는 '돌아가기' 대신 앱으로
    // 돌아가는 길을 두게 알린다. 앱이 보낸 돌아올 스킴(`return`, 앱 ID)은 목록에 있는 것만 옮긴다 — 웹 앱이
    // 그 앱을 연다(lib/app-return).
    if (isAppOrigin(request.headers.get("origin"))) {
      url.searchParams.set("client", "app");
      const appReturn = request.nextUrl.searchParams.get("return");
      if (isAppReturnScheme(appReturn)) url.searchParams.set("return", appReturn);
    }
    return NextResponse.json({ url: url.toString() });
  } catch (error) {
    logError("api/calendar-sync", error);
    return NextResponse.json({ error: "캘린더 등록을 시작하지 못했습니다." }, { status: 500 });
  }
}
