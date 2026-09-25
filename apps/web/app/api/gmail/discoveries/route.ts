import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { acknowledgeDiscoveries, listDiscoveries } from "@lib/gmail-auto-import";
import { logError } from "@lib/log";

/**
 * 결제 메일에서 찾아 둔 구독 후보 — 받기(GET), 받은 것 지우기(DELETE).
 *
 * 서버가 브라우저 기록에 직접 쓰지 않는다. 로그인한 브라우저가 열릴 때 가져가 스스로 등록하고,
 * 등록했거나 버린 후보의 id를 보내 지운다. 시작일 전에도 열어 둔다 — 후보가 없으면 빈 목록일 뿐이다.
 */

const LOGIN_REQUIRED = () => NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

const MAX_ACK_IDS = 200;

export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    return NextResponse.json({ discoveries: await listDiscoveries(account.id) });
  } catch (error) {
    logError("api/gmail/discoveries GET", error);
    return NextResponse.json({ error: "찾아 둔 구독을 읽지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();

    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    if (!Array.isArray(body?.ids)) {
      return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
    }
    const ids = body.ids
      .filter((id): id is string => typeof id === "string" && id.length <= 100)
      .slice(0, MAX_ACK_IDS);

    return NextResponse.json({ deleted: await acknowledgeDiscoveries(account.id, ids) });
  } catch (error) {
    logError("api/gmail/discoveries DELETE", error);
    return NextResponse.json({ error: "찾아 둔 구독을 지우지 못했습니다." }, { status: 500 });
  }
}
