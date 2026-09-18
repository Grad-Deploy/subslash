import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { MAX_INGEST_BYTES, ingestReceiptEmails } from "@lib/gmail-auto-import";

/**
 * 사용자의 Apps Script가 2주마다 결제 메일을 보내는 곳.
 *
 * 로그인 세션이 아니라 연결 토큰(`Authorization: Bearer`)으로 계정을 가린다. 스크립트는 Google
 * 서버에서 돌아 쿠키가 없다. 받은 메일은 파싱하는 데만 쓰고 저장하지 않으므로 로그에도 남기지 않는다.
 */
export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "연결 토큰이 없습니다." }, { status: 401 });
  }

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
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ received: result.received, candidates: result.candidates });
  } catch (error) {
    // 메일 내용이 로그에 찍히지 않게 오류 이름만 남긴다.
    console.error("[api/gmail/ingest]", error instanceof Error ? error.name : "unknown error");
    return NextResponse.json({ error: "받은 메일을 처리하지 못했습니다." }, { status: 500 });
  }
}
