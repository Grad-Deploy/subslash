import { timingSafeEqual } from "crypto";

/**
 * 두 문자열이 같은지 걸리는 시간이 내용에 따라 달라지지 않게 견준다. 앞에서부터 다른 글자에서 바로 멈추는 비교(`===`)는
 * 응답 시간으로 비밀값을 한 글자씩 알아낼 수 있다. 길이가 다르면 바로 false다 — 길이는 숨기지 않는다.
 */
export function safeEqual(given: string | null | undefined, expected: string): boolean {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * 요청이 `Authorization: Bearer <CRON_SECRET>`를 실었는지. Vercel 크론이 이 헤더를 싣고, 운영자의 확인 경로도 같은 값을 쓴다.
 * 비밀값이 배포에 없으면 `missing`이다 — 그때 열어 두면 누구나 부를 수 있으므로 부르는 곳은 실행하지 않는다.
 */
export function checkCronSecret(request: Request): "ok" | "missing" | "unauthorized" {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "missing";
  return safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)
    ? "ok"
    : "unauthorized";
}
