import { randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isErrorExportActive } from "@lib/error-export";
import { logError } from "@lib/log";

/**
 * 운영자가 오류 줄이 Grafana(Loki)까지 가는지 확인하는 경로(lib/error-export).
 *
 * 쓰기 토큰(`GRAFANA_LOKI_TOKEN`)은 배포에만 있어 밖에서는 그 토큰으로 보내 볼 수 없고, 진짜 오류 경로는 DB 장애처럼
 * 일부러 일으킬 수 없는 것뿐이다. 그래서 크론과 같은 비밀값(`CRON_SECRET`)으로 막아 둔 이 경로가 `logError`를 그대로
 * 불러 한 줄을 남긴다 — 값 지우기·내보내기를 실제 오류와 같은 길로 지난다. 사용자 기록은 읽지도 쓰지도 않는다.
 *
 * 응답의 `id`로 Grafana에서 `{app="subslash"} |= "<id>"`를 찾는다. `active`가 false면 설정이 없거나 방침의 시작일
 * 전이라 줄이 나가지 않는다.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not set on this server." }, { status: 503 });
  }
  if (!sameSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = `check-${randomBytes(4).toString("base64url")}`;
  logError("ops/error-export-check", `manual export check ${id}`);
  return NextResponse.json({ id, active: isErrorExportActive() });
}

/** 앞에서부터 다른 글자에서 바로 멈추는 비교는 응답 시간으로 비밀값을 한 글자씩 알아낼 수 있다. */
function sameSecret(given: string | null, expected: string): boolean {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
