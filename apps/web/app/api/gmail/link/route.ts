import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { isGmailAutoImportOpen } from "@lib/privacy";
import {
  createImportLink,
  deleteGmailImportData,
  gmailConnectWebAppUrl,
  readImportLink,
} from "@lib/gmail-auto-import";

/**
 * Gmail 자동 가져오기 연결 — 상태(GET), 연결 토큰 발급·재발급(POST), 끊기(DELETE).
 *
 * 어느 계정인지는 로그인 세션으로만 정한다. 토큰은 발급하는 응답에만 한 번 실리고 서버에는 해시만
 * 남는다. 사용자는 그 토큰이 든 스크립트를 자기 Apps Script에 붙여 넣는다.
 */

const LOGIN_REQUIRED = () => NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
const NOT_OPEN = () =>
  NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });

export async function GET(request: NextRequest) {
  // 시작 전에는 화면이 이 기능을 숨길 수 있게 오류 대신 알린다.
  if (!isGmailAutoImportOpen()) return NextResponse.json({ open: false });
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    const link = await readImportLink(account.id);
    // 운영자가 웹 앱을 배포해 주소를 넣었을 때만 원클릭 연결을 보여준다.
    const connectAvailable = gmailConnectWebAppUrl() !== null;
    return NextResponse.json(
      link
        ? { open: true, linked: true, connectAvailable, ...link }
        : { open: true, linked: false, connectAvailable },
    );
  } catch (error) {
    console.error("[api/gmail/link GET]", error);
    return NextResponse.json({ error: "연결 상태를 읽지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isGmailAutoImportOpen()) return NOT_OPEN();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    const token = await createImportLink(account.id);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("[api/gmail/link POST]", error);
    return NextResponse.json({ error: "연결 토큰을 만들지 못했습니다." }, { status: 500 });
  }
}

/** 시작일과 상관없이 끊을 수 있어야 한다 — 방침을 되돌려도 남은 연결을 지울 곳이 있어야 한다. */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    const deleted = await deleteGmailImportData(account.id);
    return NextResponse.json({ status: deleted ? "deleted" : "none" });
  } catch (error) {
    console.error("[api/gmail/link DELETE]", error);
    return NextResponse.json({ error: "연결을 끊지 못했습니다." }, { status: 500 });
  }
}
