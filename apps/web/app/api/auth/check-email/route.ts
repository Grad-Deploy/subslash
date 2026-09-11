import { NextRequest, NextResponse } from "next/server";
import { getEmailDomain, normalizeEmailAddress, validateEmail } from "@subslash/shared";
import { checkEmailDomain, emailDomainMessage } from "@lib/email-domain";

/**
 * 가입 폼에서 이메일 입력을 멈추면, 그 도메인이 메일을 받을 수 있는지 미리 알려준다.
 *
 * 예전에는 도메인 확인이 가입 요청 안에서만 돌았다. 다른 칸을 전부 맞게 채우고
 * 제출해야만 결과가 나왔고, 한 칸이라도 비어 있으면 화면 검사에서 먼저 멈춰
 * "존재하지 않는 도메인" 문구는 끝내 보이지 않았다.
 *
 * 답하는 것은 도메인뿐이다. 이미 가입된 이메일인지는 말하지 않는다 — 그러면
 * 누구나 이 주소로 남의 가입 여부를 캐볼 수 있다. 최종 판단은 가입 요청이
 * 다시 한다. DB를 쓰지 않으므로 DB가 설정되지 않은 배포에서도 답한다.
 *
 * 이메일은 주소창이 아니라 본문으로 받는다. 쿼리스트링에 실으면 브라우저 기록과
 * 접근 로그에 주소가 남는다.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
  }

  const email = normalizeEmailAddress((body as { email?: unknown }).email);
  const formatError = validateEmail(email);
  if (formatError) {
    return NextResponse.json({ ok: false, reason: "format", message: formatError });
  }

  const domain = getEmailDomain(email);
  const result = await checkEmailDomain(domain);
  if (result.ok) return NextResponse.json({ ok: true });

  if (result.reason === "unverifiable") {
    console.warn(`[api/auth/check-email] 이메일 도메인 조회 실패 (${result.detail})`);
  }
  return NextResponse.json({
    ok: false,
    reason: result.reason,
    message: emailDomainMessage(domain, result.reason),
  });
}
