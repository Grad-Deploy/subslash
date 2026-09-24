import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { appUrl } from "@lib/email";
import { isAppOrigin } from "@lib/app-origins";
import { createConnectCode, gmailConnectWebAppUrl } from "@lib/gmail-auto-import";

/**
 * 원클릭 Gmail 연결 시작. 로그인한 사람에게 SubSlash 웹 앱(Apps Script) 주소를 연결 코드와 함께
 * 돌려준다. 브라우저가 그 주소로 가면 Google이 권한을 묻고, 허용하면 웹 앱이 그 사람의 권한으로
 * 코드를 연결 토큰으로 바꾼 뒤 2주마다 도는 트리거를 건다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const webAppUrl = gmailConnectWebAppUrl();
  if (!webAppUrl) {
    return NextResponse.json(
      { error: "원클릭 연결이 설정되지 않았습니다. 스크립트를 직접 설치해 주세요." },
      { status: 503 },
    );
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

    const url = new URL(webAppUrl);
    url.searchParams.set("code", await createConnectCode(account.id));
    // 웹 앱은 이 주소로 코드를 바꾸고 메일을 보낸다. 스크립트가 허용 목록으로 다시 확인한다.
    url.searchParams.set("origin", appUrl());
    // 앱은 이 주소를 인앱 브라우저로 연다. 웹 앱이 끝 화면에 웹사이트로 가는 '돌아가기' 대신
    // '창을 닫으면 앱으로 돌아간다'를 띄우게 알린다.
    if (isAppOrigin(request.headers.get("origin"))) url.searchParams.set("client", "app");
    return NextResponse.json({ url: url.toString() });
  } catch (error) {
    console.error("[api/gmail/connect]", error);
    return NextResponse.json({ error: "Gmail 연결을 시작하지 못했습니다." }, { status: 500 });
  }
}
