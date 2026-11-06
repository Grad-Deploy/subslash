import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@lib/db";
import { logError } from "@lib/log";

/**
 * 외부 감시(Grafana Synthetic Monitoring)가 서비스가 살아 있는지 보는 경로. 서버가 응답하고 DB에 닿으면 200, 아니면 503이다.
 * 계정·동기화가 DB에 달려 있으므로 DB 장애도 중단으로 본다.
 *
 * 인증 없이 열려 있으므로 응답에는 상태만 싣는다 — 오류 문장·DB 주소·버전을 돌려주지 않는다. 원인은 `logError`로 서버 오류
 * 기록(Loki)에만 남는다. 응답은 캐시하지 않는다.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

export async function GET() {
  try {
    await getDb().run(sql`select 1`);
    return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
  } catch (error) {
    logError("api/health", error);
    return NextResponse.json({ status: "error" }, { status: 503, headers: NO_STORE });
  }
}
