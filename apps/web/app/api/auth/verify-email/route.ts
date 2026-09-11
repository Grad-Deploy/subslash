import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import {
  deleteUnverifiedAccount,
  markEmailVerified,
  resolveVerificationLink,
  type LinkState,
} from "@lib/account-verification";

/**
 * 가입 확인 메일의 링크가 여는 `/verify-email` 페이지가 부르는 곳.
 *
 * GET은 링크가 가리키는 계정을 알려주기만 한다. 메일 검사기(Outlook의 링크 검사
 * 등)는 메일 속 링크를 사람보다 먼저 열어본다. 여는 것만으로 확인되거나 지워지면
 * 사람이 누르기도 전에 결정이 난다. 결정은 페이지의 버튼이 보내는 POST로만 한다.
 */
export async function GET(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const state = await resolveVerificationLink(request.nextUrl.searchParams.get("token"));
    return NextResponse.json(describe(state));
  } catch (error) {
    console.error("[api/auth/verify-email]", error);
    return NextResponse.json({ error: "확인 링크를 처리하지 못했습니다." }, { status: 500 });
  }
}

/** 본문: `{ token, decision: "confirm" | "decline" }` */
export async function POST(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const body = await request.json().catch(() => null);
    const decision = body?.decision;
    if (decision !== "confirm" && decision !== "decline") {
      return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
    }

    const state = await resolveVerificationLink(typeof body.token === "string" ? body.token : null);
    if (state.kind === "invalid") return NextResponse.json(describe(state), { status: 400 });
    if (state.kind === "gone") return NextResponse.json(describe(state), { status: 410 });

    if (decision === "confirm") {
      if (state.kind === "pending") await markEmailVerified(state.account.id);
      return NextResponse.json({ ...describe(state), status: "verified" });
    }

    // 확인된 계정은 주인이 '맞아요'라고 답한 것이다. 남아 있던 옛 링크로 지우지 않는다.
    const alreadyVerified = {
      ...describe(state),
      status: "verified",
      error: "이미 확인된 계정이라 이 링크로는 지울 수 없습니다.",
    };
    if (state.kind === "verified") return NextResponse.json(alreadyVerified, { status: 409 });

    // 그사이 다른 창에서 확인됐으면 지우지 않는다.
    const deleted = await deleteUnverifiedAccount(state.account.id);
    if (!deleted) return NextResponse.json(alreadyVerified, { status: 409 });

    return NextResponse.json({ status: "declined" });
  } catch (error) {
    console.error("[api/auth/verify-email]", error);
    return NextResponse.json({ error: "확인 링크를 처리하지 못했습니다." }, { status: 500 });
  }
}

function describe(state: LinkState) {
  if (state.kind === "pending" || state.kind === "verified") {
    return { status: state.kind, username: state.account.username, email: state.account.email };
  }
  return { status: state.kind };
}
