import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { SESSION_COOKIE, getAccountBySessionToken } from "@lib/auth-server";
import {
  MAX_SNAPSHOT_BYTES,
  deleteSnapshot,
  readSnapshot,
  saveSnapshot,
} from "@lib/account-snapshot";

/**
 * 계정에 저장한 기록 — 저장(PUT), 불러오기(GET), 지우기(DELETE).
 *
 * 어느 계정의 기록인지는 요청 본문이나 주소가 아니라 세션 쿠키로만 정한다. 다른
 * 계정의 id를 어디에 적어 보내도 그 계정의 기록에는 닿지 않는다.
 */

async function currentAccount(request: NextRequest) {
  return getAccountBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

const LOGIN_REQUIRED = () => NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

/** `?summary=1`이면 기록 내용 없이 요약만 돌려준다 — 화면이 열릴 때마다 전체를 받지 않게. */
export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await currentAccount(request);
    if (!account) return LOGIN_REQUIRED();

    const snapshot = await readSnapshot(account.id);
    if (!snapshot) {
      return NextResponse.json(
        { status: "none", message: "계정에 저장된 기록이 없습니다." },
        { status: 404 },
      );
    }
    if (request.nextUrl.searchParams.get("summary") === "1") {
      return NextResponse.json({ status: "saved", summary: snapshot.summary });
    }
    return NextResponse.json({
      status: "saved",
      summary: snapshot.summary,
      backup: snapshot.backup,
    });
  } catch (error) {
    console.error("[api/account/snapshot GET]", error);
    return NextResponse.json({ error: "계정에 저장된 기록을 읽지 못했습니다." }, { status: 500 });
  }
}

/** 본문: 백업 파일과 같은 JSON(`createBackup`의 결과). 계정의 기록을 통째로 바꾼다. */
export async function PUT(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await currentAccount(request);
    if (!account) return LOGIN_REQUIRED();

    // 본문을 다 읽기 전에 알 수 있으면 먼저 거절한다.
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_SNAPSHOT_BYTES) {
      return NextResponse.json(
        { error: "기록이 너무 커서 계정에 저장할 수 없습니다. 백업 파일로 저장해 주세요." },
        { status: 413 },
      );
    }

    const result = await saveSnapshot(account.id, await request.text());
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ status: "saved", summary: result.summary });
  } catch (error) {
    console.error("[api/account/snapshot PUT]", error);
    return NextResponse.json({ error: "계정에 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await currentAccount(request);
    if (!account) return LOGIN_REQUIRED();

    const deleted = await deleteSnapshot(account.id);
    return NextResponse.json({ status: deleted ? "deleted" : "none" });
  } catch (error) {
    console.error("[api/account/snapshot DELETE]", error);
    return NextResponse.json({ error: "계정에 저장된 기록을 지우지 못했습니다." }, { status: 500 });
  }
}
