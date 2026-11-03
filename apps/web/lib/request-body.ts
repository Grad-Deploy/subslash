import { NextResponse } from "next/server";

/**
 * API 라우트가 요청 본문을 읽는 곳. 예전에는 라우트마다 `request.json().catch(() => null)`을 적었는데, 그 값은 `any`라
 * `body.email`처럼 칸을 꺼내 쓰는 줄을 타입 검사가 보지 못했고, 같은 400 문구가 라우트마다 복사돼 있었다.
 *
 * 본문은 남이 보낸 값이므로 `unknown`으로 받고, 칸은 쓰는 곳에서 모양을 확인한다.
 */

/** JSON 본문. 읽지 못하면(비었거나 JSON이 아님) null이다. 모양 검사는 받는 함수(parse…)가 한다. */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

/**
 * JSON 객체 본문. 객체가 아니면(배열·숫자·문자열 포함) null이다 — 배열을 객체로 받으면 칸이 모두 비어 '이메일을
 * 입력하세요' 같은 엉뚱한 안내가 나간다.
 */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const body = await readJson(request);
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null;
}

/** 본문의 모양이 틀렸을 때. 문구는 화면이 `known-text` 표로 옮기므로 바꾸면 그 표도 고친다. */
export function badRequestResponse(): NextResponse {
  return NextResponse.json({ error: "요청을 이해할 수 없습니다." }, { status: 400 });
}
