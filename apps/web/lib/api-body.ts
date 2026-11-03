/**
 * 화면이 API 응답 본문을 읽는 곳. 예전에는 화면마다 `res.json().catch(() => ({}))`를 적었는데, 그 값은 `any`라
 * `data.error`가 문자열이 아니어도(서버가 바뀌었거나 프록시가 HTML을 돌려줬을 때) 그대로 화면에 넘어갔다.
 *
 * 본문은 객체로만 받고(아니면 빈 객체), 칸은 아래 함수로 모양을 확인해 꺼낸다. 서버 문장은 한국어이므로 보여 주는
 * 자리에서 `useKnownText()`로 옮기는 것은 그대로다.
 */

export type ResponseBody = Readonly<Record<string, unknown>>;

const EMPTY: ResponseBody = Object.freeze({});

/** 응답 본문. JSON 객체가 아니면(비었거나 HTML·배열) 빈 객체다. */
export async function readResponseBody(res: Response): Promise<ResponseBody> {
  const body: unknown = await res.json().catch(() => null);
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? (body as ResponseBody)
    : EMPTY;
}

/** 문자열 칸. 없거나 문자열이 아니면 undefined. */
export function textOf(body: ResponseBody, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value : undefined;
}

/** 칸별 입력 오류(`fieldErrors`). 문자열인 칸만 남긴다. 없으면 undefined. */
export function fieldErrorsOf(body: ResponseBody): Record<string, string> | undefined {
  const value = body.fieldErrors;
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const errors: Record<string, string> = {};
  for (const [key, message] of Object.entries(value)) {
    if (typeof message === "string") errors[key] = message;
  }
  return errors;
}

/** 서버가 돌려준 이동 경로가 우리 API(`/api/…`)인지. 응답의 경로로 곧바로 나가는 곳이 쓴다. */
export function isApiPath(path: string | undefined): path is `/api/${string}` {
  return typeof path === "string" && path.startsWith("/api/") && !path.startsWith("/api//");
}
