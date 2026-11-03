import { NextResponse } from "next/server";
import { SessionCheckThrottledError } from "./auth-server";
import { logError } from "./log";
import { tooManyRequestsResponse } from "./rate-limit";

/**
 * API 라우트가 처리하지 못한 오류에 돌려주는 응답. 예전에는 라우트마다 `catch`에 `logError` + 500을 적었다.
 *
 * 세션 확인을 막은 것(`SessionCheckThrottledError`, 없는 토큰을 많이 내민 IP)은 서버 오류가 아니라 요청 수 제한이다.
 * 일반 오류처럼 다루면 막힌 요청마다 오류 줄이 남고 500이 `/api/*` 5xx 알림을 울려, 지어낸 토큰을 보내는 쪽이 운영자에게
 * 거짓 장애 알림을 보낼 수 있었다. 그래서 429로 답하고 줄을 남기지 않는다. 로그아웃(200·401)으로 답하지 않는 것은
 * 같다 — 화면은 오류 응답이면 알던 로그인 상태를 그대로 둔다.
 *
 * `message`는 화면에 보이는 문장이라 `known-text` 표가 옮긴다. `status`는 기본 500이다.
 */
export function serverErrorResponse(
  scope: string,
  error: unknown,
  message: string,
  status = 500,
): NextResponse {
  const throttled = sessionThrottledResponse(error);
  if (throttled) return throttled;
  logError(scope, error);
  return NextResponse.json({ error: message }, { status });
}

/** 세션 확인을 막은 오류면 429, 아니면 null. 자기 모양의 실패 응답을 쓰는 라우트(간편 로그인)가 먼저 부른다. */
export function sessionThrottledResponse(error: unknown): NextResponse | null {
  return error instanceof SessionCheckThrottledError
    ? tooManyRequestsResponse(error.retryAfterSeconds)
    : null;
}
