import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isAiAskDailyCountOpen, isDeviceUsageOpen } from "@lib/privacy";
import { pruneAskDailyCounts } from "@lib/ask/daily-count";
import { pruneDeviceUsage } from "@lib/device-usage-server";
import { pruneAbandonedAccounts } from "@lib/account-verification";
import { pruneExpiredSessions } from "@lib/auth-server";
import { logError } from "@lib/log";
import { checkCronSecret } from "@lib/secret";
import { checkTursoUsage } from "@lib/turso-usage";

/**
 * 하루 한 번 서버 기록을 치운다(vercel.json의 `crons`).
 *
 * 예전에는 결제 알림 메일을 보내는 크론이었다. 메일 알림을 그만둔 뒤에도 같은 주소로 두는 이유는
 * 배포 설정(vercel.json·CRON_SECRET)을 바꾸지 않으려는 것이다 — 치우는 일은 그대로 남았다.
 */
export async function GET(request: NextRequest) {
  const auth = checkCronSecret(request);
  if (auth === "missing") {
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
  if (auth === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;

  const now = new Date();

  try {
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

    // 지난 날의 AI 질문 횟수(방침: 다음 날 지워 이틀을 넘기지 않는다). 열기 전에는 표가 없을 수 있다.
    const askCountsPruned = isAiAskDailyCountOpen(now)
      ? await pruneAskDailyCounts(now).then(
          () => true,
          (error: unknown) => {
            logError("cron/notify ask count prune failed", error);
            return false;
          },
        )
      : null;

    // Turso 사용량이 한도에 가까우면 운영자에게 알린다(설정이 없으면 보지 않음, lib/turso-usage).
    const tursoUsage = await checkTursoUsage().catch((error: unknown) => {
      logError("cron/notify turso usage check failed", error);
      return { status: "error" as const, reason: "exception" };
    });

    // 하나라도 실패하면 500으로 답한다. 정리는 서로 막지 않게 끝까지 돌리지만, 200으로 답하면 `/api/*` 5xx를 보는
    // Vercel 알림이 울리지 않고, 크론은 다시 시도하지 않아 방침의 보관 기간을 넘긴 기록이 아무도 모르게 남는다.
    const failed = [
      prunedUsage === null && isDeviceUsageOpen(now) && "usage",
      !sessionsPruned && "sessions",
      prunedAccounts === null && "accounts",
      askCountsPruned === false && "askCounts",
      tursoUsage.status === "error" && "tursoUsage",
    ].filter((name): name is string => Boolean(name));

    return NextResponse.json(
      {
        success: failed.length === 0,
        failed,
        tursoUsage,
        sessionsPruned,
        prunedAccounts,
        prunedUsage,
        askCountsPruned,
        timestamp: now.toISOString(),
      },
      { status: failed.length === 0 ? 200 : 500 },
    );
  } catch (error) {
    logError("cron/notify", error);
    return NextResponse.json({ error: "Daily cleanup failed" }, { status: 500 });
  }
}
