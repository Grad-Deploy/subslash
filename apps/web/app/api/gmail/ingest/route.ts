import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { logError } from "@lib/log";
import { featureClosedResponse, isGmailAutoImportOpen } from "@lib/privacy";
import { MAX_INGEST_BYTES, ingestReceiptEmails } from "@lib/gmail-auto-import";
import {
  clientIp,
  hit,
  retryAfterSeconds,
  tooManyRequestsResponse,
  type RateLimitRule,
} from "@lib/rate-limit";
import { isWellFormedToken } from "@lib/tokens";

/**
 * 없는 토큰을 이만큼 내민 IP는 잠시 DB를 읽어 주지 않는다. 정상 요청은 Google의 공유 IP에서 오므로 성공은 세지 않는다.
 */
const UNKNOWN_TOKENS_PER_IP: RateLimitRule = { limit: 60, windowMs: 10 * 60 * 1000 };

/**
 * 사용자의 Apps Script가 2주마다 결제 메일을 보내는 곳.
 *
 * 로그인 세션이 아니라 연결 토큰(`Authorization: Bearer`)으로 계정을 가린다. 스크립트는 Google
 * 서버에서 돌아 쿠키가 없다. 받은 메일은 파싱하는 데만 쓰고 저장하지 않으므로 로그에도 남기지 않는다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) return featureClosedResponse();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "연결 토큰이 없습니다." }, { status: 401 });
  }
  if (!isWellFormedToken(token)) {
    return NextResponse.json({ error: "연결이 끊겼습니다." }, { status: 401 });
  }
  const missKey = `gmail-ingest-miss:${clientIp(request.headers)}`;
  const wait = retryAfterSeconds(missKey, UNKNOWN_TOKENS_PER_IP);
  if (wait > 0) return tooManyRequestsResponse(wait);

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_INGEST_BYTES) {
    return NextResponse.json({ error: "한 번에 보낸 메일이 너무 많습니다." }, { status: 413 });
  }

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_INGEST_BYTES) {
      return NextResponse.json({ error: "한 번에 보낸 메일이 너무 많습니다." }, { status: 413 });
    }
    const result = await ingestReceiptEmails(token, text);
    if (!result.ok) {
      if (result.status === 401) hit(missKey, UNKNOWN_TOKENS_PER_IP);
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ received: result.received, candidates: result.candidates });
  } catch (error) {
    // 메일 내용이 로그에 찍히지 않게 오류 이름만 남긴다.
    logError("api/gmail/ingest", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "받은 메일을 처리하지 못했습니다." }, { status: 500 });
  }
}
