import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { exchangeConnectCode } from "@lib/gmail-auto-import";
import { logError } from "@lib/log";

/**
 * SubSlash 웹 앱(Apps Script)이 사용자의 권한으로 돌면서 연결 코드를 연결 토큰으로 바꾸는 곳.
 * Google 서버에서 부르므로 로그인 세션은 없고, 서명된 코드만 믿는다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
    const code = typeof body?.code === "string" ? body.code.slice(0, 2000) : "";
    const token = code ? await exchangeConnectCode(code) : null;
    if (!token) {
      return NextResponse.json(
        { error: "연결 코드가 만료됐거나 이미 쓰였습니다. SubSlash에서 다시 연결해 주세요." },
        { status: 400 },
      );
    }
    return NextResponse.json({ token });
  } catch (error) {
    logError("api/gmail/connect/exchange", error);
    return NextResponse.json({ error: "연결하지 못했습니다." }, { status: 500 });
  }
}
