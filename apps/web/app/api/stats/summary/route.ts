import { NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isAnonymousStatsOpen } from "@lib/privacy";
import { loadSummary } from "@lib/stats-server";
import { logError } from "@lib/log";

/**
 * 익명 구독 통계의 요약. 누구나 읽을 수 있다 — 모자란 칸은 비워 두므로(lib/stats의 summarize) 한두
 * 명의 값이 드러나지 않는다. 자주 바뀌지 않아 CDN에 10분 둔다.
 */
export async function GET() {
  if (!isAnonymousStatsOpen()) {
    return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
  }
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    return NextResponse.json(await loadSummary(), {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    });
  } catch (error) {
    logError("api/stats/summary", error);
    return NextResponse.json({ error: "통계를 읽지 못했습니다." }, { status: 500 });
  }
}
