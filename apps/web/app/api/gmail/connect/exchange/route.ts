import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { featureClosedResponse, isGmailAutoImportOpen } from "@lib/privacy";
import { exchangeConnectCode } from "@lib/gmail-auto-import";
import { logError } from "@lib/log";
import {
  clientIp,
  hit,
  retryAfterSeconds,
  tooManyRequestsResponse,
  type RateLimitRule,
} from "@lib/rate-limit";
import { readJsonObject } from "@lib/request-body";

/** 정상 요청은 Google의 공유 IP에서 오므로 실패만 센다. */
const FAILURES_PER_IP: RateLimitRule = { limit: 60, windowMs: 10 * 60 * 1000 };

/**
 * SubSlash 웹 앱(Apps Script)이 사용자의 권한으로 돌면서 연결 코드를 연결 토큰으로 바꾸는 곳.
 * Google 서버에서 부르므로 로그인 세션은 없고, 서명된 코드만 믿는다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) return featureClosedResponse();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  const missKey = `gmail-exchange-miss:${clientIp(request.headers)}`;
  const wait = retryAfterSeconds(missKey, FAILURES_PER_IP);
  if (wait > 0) return tooManyRequestsResponse(wait);

  try {
    const body = await readJsonObject(request);
    const code = typeof body?.code === "string" ? body.code.slice(0, 2000) : "";
    const token = code ? await exchangeConnectCode(code) : null;
    if (!token) {
      hit(missKey, FAILURES_PER_IP);
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
