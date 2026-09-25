/**
 * 서버 오류 로그. 라우트는 `console.error`에 오류 객체를 그대로 넘기지 않고 이것을 쓴다.
 *
 * Drizzle은 쿼리가 실패하면 오류 메시지에 SQL과 **바인딩한 값**을 그대로 싣는다
 * (`Failed query: ... params: 이메일,비밀번호 해시,...`). 그 객체를 로그에 넘기면 DB 오류가 한 번 날
 * 때마다 이메일·비밀번호 해시·세션 토큰 해시·계정 기록 JSON이 배포 로그(Vercel)에 남는다. 여기서는
 * 쿼리 모양과 DB가 알려 준 원인(`SQLITE_CONSTRAINT: UNIQUE constraint failed: accounts.email`처럼
 * 값이 없는 문장)만 남긴다.
 */

interface QueryErrorLike {
  query: string;
  params: unknown;
  cause?: unknown;
}

function isQueryError(error: unknown): error is QueryErrorLike {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { query?: unknown }).query === "string" &&
    "params" in error
  );
}

/** 원인 사슬을 따라 내려간 오류들. 순환해도 멈춘다. */
function causes(error: unknown): unknown[] {
  const chain: unknown[] = [];
  let current: unknown = error;
  while (current !== undefined && current !== null && chain.length < 5) {
    if (chain.includes(current)) break;
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
}

/** 로그에 남겨도 되는 한 줄. 쿼리 오류면 값을 빼고, 원인은 이름·코드·메시지만 남긴다. */
export function describeError(error: unknown): string {
  if (isQueryError(error)) {
    const cause = causes(error.cause)
      .map((item) => (item instanceof Error ? `${item.name}: ${item.message}` : String(item)))
      .join(" <- ");
    return `DrizzleQueryError (${error.query.slice(0, 200)})${cause ? ` <- ${cause}` : ""}`;
  }
  if (error instanceof Error) {
    const cause = error.cause !== undefined ? ` <- ${describeError(error.cause)}` : "";
    return `${error.name}: ${error.message}${cause}`;
  }
  return typeof error === "string" ? error : "unknown error";
}

/** `console.error("[scope]", error)` 대신 쓴다. 스택은 값이 없어 남긴다. */
export function logError(scope: string, error: unknown): void {
  const stack = error instanceof Error && !isQueryError(error) ? error.stack : undefined;
  console.error(`[${scope}] ${describeError(error)}`, ...(stack ? [`\n${stack}`] : []));
}

/**
 * 이미 있는 값과 부딪쳐 실패했는지(UNIQUE 제약). Drizzle은 DB 오류를 `cause`에 감싸므로
 * 메시지만 보면 놓친다 — 가입 경쟁에서 409 대신 500이 나고 파라미터가 로그에 찍혔다.
 */
export function isUniqueViolation(error: unknown): boolean {
  return causes(error).some(
    (item) => item instanceof Error && /UNIQUE constraint failed/i.test(item.message),
  );
}
