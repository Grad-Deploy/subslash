import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { pruneStaleContributions } from "@lib/stats-server";
import { isAnonymousStatsOpen, isDeviceUsageOpen } from "@lib/privacy";
import { pruneDeviceUsage } from "@lib/device-usage-server";
import { purgeRetiredNotifyData } from "@lib/notify-server";
import { pruneAbandonedAccounts } from "@lib/account-verification";
import { pruneExpiredSessions } from "@lib/auth-server";
import { logError } from "@lib/log";

/**
 * 하루 한 번 서버 기록을 치운다(vercel.json의 `crons`).
 *
 * 예전에는 결제 알림 메일을 보내는 크론이었다. 메일 알림을 그만둔 뒤에도 같은 주소로 두는 이유는
 * 배포 설정(vercel.json·CRON_SECRET)을 바꾸지 않으려는 것이다 — 치우는 일은 그대로 남았다.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // 비밀값이 없으면 누구나 이 주소를 호출해 지우기를 돌릴 수 있으므로 실행하지 않는다. 500이 아니라
    // 503인 이유는, 이것이 코드의 결함이 아니라 배포에 환경 변수가 빠진 상태이기 때문이다 — 매일
    // 한 번씩 500이 쌓이면 진짜 장애와 구분되지 않는다.
    console.error(
      "[cron/notify] CRON_SECRET is not set; refusing to run. " +
        "Set CRON_SECRET in the deployment environment to enable the daily cleanup.",
    );
    return NextResponse.json(
      { error: "The daily cleanup is not configured on this server (CRON_SECRET is missing)." },
      { status: 503 },
    );
  }
  if (!sameSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  const now = new Date();

  try {
    // 그만둔 결제 알림 메일의 이메일·구독 사본. 실패해도 다른 정리는 계속한다 — 다음 날 다시 지운다.
    const purgedNotify = await purgeRetiredNotifyData().catch((error: unknown) => {
      logError("cron/notify retired notify purge failed", error);
      return null;
    });

    // 익명 통계의 오래된 참여 기록(방침의 보관 기간). 기능을 열기 전에는 표가 없을 수 있다(마이그레이션은
    // 시작일을 정할 때 적용한다).
    const prunedStats = isAnonymousStatsOpen(now)
      ? await pruneStaleContributions(now).catch((error: unknown) => {
          logError("cron/notify stats prune failed", error);
          return null;
        })
      : null;

    // 기기 간 사용 측정의 보관 기간(40일)이 지난 구간. 열기 전에는 표가 없을 수 있다.
    const prunedUsage = isDeviceUsageOpen(now)
      ? await pruneDeviceUsage(now.getTime()).catch((error: unknown) => {
          logError("cron/notify usage prune failed", error);
          return null;
        })
      : null;

    // 만료된 로그인 세션은 로그인할 때만 치우면 아무도 로그인하지 않는 동안 쌓인다.
    const sessionsPruned = await pruneExpiredSessions().then(
      () => true,
      (error: unknown) => {
        logError("cron/notify session prune failed", error);
        return false;
      },
    );

    // 확인하지 않고 90일 동안 쓴 흔적도 기록도 없는 계정. 세션을 먼저 치운 뒤 본다.
    const prunedAccounts = await pruneAbandonedAccounts(now).catch((error: unknown) => {
      logError("cron/notify account prune failed", error);
      return null;
    });

    return NextResponse.json({
      success: true,
      purgedNotify,
      sessionsPruned,
      prunedAccounts,
      prunedStats,
      prunedUsage,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logError("cron/notify", error);
    return NextResponse.json({ error: "Daily cleanup failed" }, { status: 500 });
  }
}

/** 앞에서부터 다른 글자에서 바로 멈추는 비교는 응답 시간으로 비밀값을 한 글자씩 알아낼 수 있다. */
function sameSecret(given: string | null, expected: string): boolean {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
