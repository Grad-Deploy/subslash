/**
 * 전시장 대비 쿼터 안전 리허설 및 사용량 점검 실행기.
 *
 * 사용법:
 *   # 1. 부하 없이 현재 Turso 쿼터 및 Vercel/Turso 대시보드 확인 항목만 출력
 *   pnpm --filter @subslash/web rehearsal:quota
 *
 *   # 2. 드라이런 (기본값: 2 VU, 30초, 최대 40 요청, 종료 시 임시 계정 자동 삭제)
 *   REHEARSAL_BASE_URL=https://your-app.vercel.app pnpm --filter @subslash/web rehearsal:dry
 *
 *   # 3. 본 리허설 (최대 10 VU, 60초, 최대 250 요청 — 하드 상한 10 VU / 120초 / 400 요청 강제)
 *   REHEARSAL_BASE_URL=https://your-app.vercel.app pnpm --filter @subslash/web rehearsal:dry -- --full
 */
import { randomBytes } from "node:crypto";
import {
  computeTursoDelta,
  createTelemetry,
  fetchTursoQuotaSnapshot,
  parseRehearsalArgs,
  percentile,
  recordResponse,
  verifySecurityHeaders,
  type RehearsalOptions,
  type RunTelemetry,
  type TursoQuotaSnapshot,
} from "./check";

const fmt = (n: number) => Math.round(n).toLocaleString("ko-KR");

function printDashboardGuide() {
  console.error("\n============================================================");
  console.error("📊 [실행 전·후 수동 대시보드 확인 가이드 (Vercel Hobby & Turso Free)]");
  console.error("============================================================");
  console.error("1. Turso 대시보드 (https://app.turso.tech):");
  console.error(
    "   - Billing / Usage 탭에서 다음 3개 지표의 실행 전(Before) · 후(After) 값을 기록하세요:",
  );
  console.error("     • Rows Read (무료 한도: 월 500,000,000행)");
  console.error("     • Rows Written (무료 한도: 월 10,000,000행 — 가장 먼저 차는 핵심 지표)");
  console.error("     • Storage (무료 한도: 5 GB)");
  console.error(
    "   - TURSO_PLATFORM_API_TOKEN과 TURSO_ORG_SLUG 환경 변수를 설정하면 이 스크립트가",
  );
  console.error("     실행 전·후 스냅샷과 차이(Δ)를 자동으로 계산해 출력합니다.");
  console.error("2. Vercel 대시보드 (https://vercel.com/dashboard -> Usage):");
  console.error(
    "   - Serverless Function Invocations (무료 한도: 월 100,000회 / 실행 전후 차이 확인)",
  );
  console.error("   - Function Duration (GB-Hours) 및 Fast Origin Transfer");
  console.error("   - Edge Requests 및 429/5xx 발생 건수");
  console.error("============================================================\n");
}

function printTursoSnapshot(label: string, snap: TursoQuotaSnapshot) {
  const ratioText = (used: number, limit: number | undefined) =>
    limit ? `${fmt(used)} / ${fmt(limit)} (${((used / limit) * 100).toFixed(2)}%)` : fmt(used);

  console.error(`\n[${label}] Turso 조직: ${snap.organization} (요금제: ${snap.plan})`);
  console.error(
    `  • 행 쓰기(Rows Written): ${ratioText(snap.usage.rows_written, snap.quotas.rows_written)}`,
  );
  console.error(
    `  • 행 읽기(Rows Read)   : ${ratioText(snap.usage.rows_read, snap.quotas.rows_read)}`,
  );
  console.error(
    `  • 저장 용량(Bytes)     : ${ratioText(snap.usage.storage_bytes, snap.quotas.storage_bytes)}`,
  );
  console.error(
    `  • 차단 상태(Blocked)   : 읽기=${snap.blockedReads ? "차단됨(위험)" : "정상"}, 쓰기=${snap.blockedWrites ? "차단됨(위험)" : "정상"}`,
  );
}

function extractSessionCookie(res: Response): string | null {
  const raw = res.headers.get("set-cookie") ?? "";
  const match = raw.match(/subslash_session=([^;]+)/);
  return match ? `subslash_session=${match[1]}` : null;
}

async function timedFetch(
  url: string,
  init: RequestInit,
  telemetry: RunTelemetry,
  expectedStatuses: number[],
  abortController: AbortController,
): Promise<{ res: Response; bodyText: string }> {
  const start = performance.now();
  const res = await fetch(url, { ...init, signal: abortController.signal });
  const bodyText = await res.text();
  const latencyMs = performance.now() - start;

  const decision = recordResponse(
    telemetry,
    res.status,
    latencyMs,
    bodyText.slice(0, 300),
    expectedStatuses,
  );
  if (decision.abort) {
    console.error(`\n🛑 [HARD ABORT 발동] ${decision.reason}: ${decision.detail}`);
    abortController.abort(new Error(`${decision.reason}: ${decision.detail}`));
  }
  return { res, bodyText };
}

/**
 * 부하 루프에 들어가기 전에 단 4건의 요청으로 보안 헤더·CORS·기본 API 살아있음을 확인한다.
 * 여기서 실패하면 부하 테스트를 돌리지 않고 즉시 멈춰 쿼터를 아낀다.
 */
async function runLowCostPreflight(
  baseUrl: string,
  telemetry: RunTelemetry,
  abortController: AbortController,
) {
  console.error("🔍 [1/3] 저비용 사전 점검(보안 헤더·CORS·기본 응답, 총 4요청) 시작...");

  // 1. 랜딩 페이지 응답 및 보안 헤더 점검
  const { res: homeRes } = await timedFetch(
    `${baseUrl}/`,
    { method: "GET" },
    telemetry,
    [200],
    abortController,
  );
  const headerCheck = verifySecurityHeaders(homeRes.headers);
  if (!headerCheck.ok) {
    throw new Error(`보안 헤더 누락/불일치:\n  - ${headerCheck.missingOrMismatch.join("\n  - ")}`);
  }
  console.error("  ✓ 보안 헤더 5종(X-Frame-Options, CSP, nosniff, Referrer, Permissions) 정상");

  // 2. Capacitor 앱 출처 CORS 허용 점검
  const { res: corsAppRes } = await timedFetch(
    `${baseUrl}/api/auth/me`,
    {
      method: "OPTIONS",
      headers: {
        Origin: "capacitor://localhost",
        "Access-Control-Request-Headers": "authorization",
      },
    },
    telemetry,
    [204],
    abortController,
  );
  if (corsAppRes.headers.get("access-control-allow-origin") !== "capacitor://localhost") {
    throw new Error("앱 출처(capacitor://localhost) CORS 헤더가 열리지 않았습니다.");
  }

  // 3. 외부 출처 CORS 차단 점검
  const { res: corsEvilRes } = await timedFetch(
    `${baseUrl}/api/auth/me`,
    {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    },
    telemetry,
    [200, 204, 400, 404, 405],
    abortController,
  );
  if (corsEvilRes.headers.get("access-control-allow-origin")) {
    throw new Error("허용되지 않은 외부 출처(https://evil.example)에 CORS가 열려 있습니다.");
  }
  console.error("  ✓ CORS 정책(앱 출처 허용 / 외부 출처 차단) 정상");

  // 4. 비로그인 /api/auth/me 기본 응답 점검
  const { res: meRes, bodyText: meBody } = await timedFetch(
    `${baseUrl}/api/auth/me`,
    { method: "GET" },
    telemetry,
    [200],
    abortController,
  );
  if (meRes.status !== 200 || !meBody.includes('"account":null')) {
    throw new Error(`/api/auth/me 비로그인 응답 이상: status=${meRes.status}`);
  }
  console.error("  ✓ 기본 인증 상태 API(/api/auth/me) 정상");
}

function buildSampleSnapshotPayload(iteration: number): string {
  return JSON.stringify({
    app: "subslash",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      subscriptions: [
        {
          id: `rehearsal-sub-${iteration}`,
          name: "넷플릭스",
          amount: 17000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      usageLogs: [],
      accounts: [],
      exchangeRate: { mode: "auto", rate: 1380 },
    },
  });
}

async function sleep(ms: number, signal: AbortSignal) {
  if (signal.aborted) return;
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function runVirtualUser(
  vuId: number,
  options: RehearsalOptions,
  deadlineMs: number,
  telemetry: RunTelemetry,
  abortController: AbortController,
) {
  const tag = randomBytes(3).toString("hex");
  const username = `rh_${vuId}_${tag}`;
  const email = `rehearsal.${vuId}.${tag}@gmail.com`;
  const password = `Rehearsal-2026!${tag}`;
  let cookie: string | null = null;

  try {
    if (abortController.signal.aborted || telemetry.totalRequests >= options.maxRequests) return;

    // 1. 임시 테스트 계정 생성 (1 VU당 1회만 생성하여 행 쓰기 최소화)
    const { res: signupRes } = await timedFetch(
      `${options.baseUrl}/api/auth/signup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          passwordConfirm: password,
          isOver14: true,
        }),
      },
      telemetry,
      [201],
      abortController,
    );
    cookie = extractSessionCookie(signupRes);
    if (!cookie || abortController.signal.aborted) return;

    let iter = 0;
    while (
      Date.now() < deadlineMs &&
      !abortController.signal.aborted &&
      telemetry.totalRequests < options.maxRequests
    ) {
      iter += 1;

      // 스냅샷 저장 (첫 번째 반복에서만 1회 쓰기, 이후에는 읽기 위주로 돌며 쓰기 쿼터 절약)
      if (iter === 1 && telemetry.totalRequests < options.maxRequests) {
        await timedFetch(
          `${options.baseUrl}/api/account/snapshot`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: buildSampleSnapshotPayload(iter),
          },
          telemetry,
          [200, 409],
          abortController,
        );
      }

      if (abortController.signal.aborted || telemetry.totalRequests >= options.maxRequests) break;

      // 스냅샷 요약 읽기 (GET /api/account/snapshot?summary=1)
      await timedFetch(
        `${options.baseUrl}/api/account/snapshot?summary=1`,
        {
          method: "GET",
          headers: { Cookie: cookie },
        },
        telemetry,
        [200, 404],
        abortController,
      );

      if (abortController.signal.aborted || telemetry.totalRequests >= options.maxRequests) break;

      // 세션 확인 읽기 (GET /api/auth/me)
      await timedFetch(
        `${options.baseUrl}/api/auth/me`,
        {
          method: "GET",
          headers: { Cookie: cookie },
        },
        telemetry,
        [200],
        abortController,
      );

      await sleep(options.thinkTimeMs, abortController.signal);
    }
  } finally {
    // 중단되더라도 만든 임시 계정은 반드시 스스로 지워 운영 DB에 찌꺼기를 남기지 않는다.
    if (cookie) {
      try {
        const start = performance.now();
        const delRes = await fetch(`${options.baseUrl}/api/auth/account`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: JSON.stringify({ password }),
        });
        await delRes.text();
        telemetry.totalRequests += 1;
        telemetry.statusCounts[delRes.status] = (telemetry.statusCounts[delRes.status] ?? 0) + 1;
        telemetry.latenciesMs.push(performance.now() - start);
      } catch {
        // 정리 실패는 본 결과만 남긴다.
      }
    }
  }
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== "--");
  const options = parseRehearsalArgs(rawArgs);

  printDashboardGuide();

  const beforeSnap = await fetchTursoQuotaSnapshot();
  if (beforeSnap) {
    printTursoSnapshot("실행 전(Before) Turso 스냅샷", beforeSnap);
    if (beforeSnap.blockedReads || beforeSnap.blockedWrites) {
      throw new Error(
        "Turso 읽기/쓰기가 이미 차단(BLOCKED) 상태이므로 테스트를 실행하지 않습니다.",
      );
    }
    if (
      beforeSnap.quotas.rows_written &&
      beforeSnap.usage.rows_written / beforeSnap.quotas.rows_written >= 0.9
    ) {
      throw new Error(
        "Turso 월간 행 쓰기 사용량이 이미 한도의 90% 이상이므로 보호를 위해 리허설을 중단합니다.",
      );
    }
  } else {
    console.error(
      "ℹ️ TURSO_PLATFORM_API_TOKEN / TURSO_ORG_SLUG가 설정되지 않아 자동 스냅샷을 건너뜁니다. 위 안내에 따라 대시보드 수치를 직접 확인해 주세요.",
    );
  }

  if (options.quotaOnly) {
    console.error("\n--quota-only 모드이므로 부하 요청 없이 종료합니다.");
    return;
  }

  console.error(
    `\n🚀 [2/3] 쿼터 안전 리허설 시작: 대상=${options.baseUrl}, VU=${options.vus}명, 시간=${options.durationSeconds}초, 요청 상한=${options.maxRequests}건`,
  );

  const telemetry = createTelemetry();
  const abortController = new AbortController();

  try {
    await runLowCostPreflight(options.baseUrl, telemetry, abortController);

    const deadlineMs = Date.now() + options.durationSeconds * 1000;
    await Promise.all(
      Array.from({ length: options.vus }, (_, idx) =>
        runVirtualUser(idx + 1, options, deadlineMs, telemetry, abortController),
      ),
    );
  } catch (error) {
    if (!abortController.signal.aborted) {
      throw error;
    }
  }

  console.error("\n============================================================");
  console.error("📈 [3/3] 리허설 결과 요약");
  console.error("============================================================");
  console.error(
    `  • 총 전송 요청 수 : ${telemetry.totalRequests}건 (상한: ${options.maxRequests}건)`,
  );
  console.error(
    `  • 실패 요청 수    : ${telemetry.failedRequests}건 (${telemetry.totalRequests > 0 ? ((telemetry.failedRequests / telemetry.totalRequests) * 100).toFixed(2) : "0.00"}%)`,
  );
  console.error(`  • 상태 코드 분포  : ${JSON.stringify(telemetry.statusCounts)}`);
  console.error(
    `  • 응답 지연(ms)   : p50=${percentile(telemetry.latenciesMs, 50)}ms, p95=${percentile(telemetry.latenciesMs, 95)}ms, max=${percentile(telemetry.latenciesMs, 100)}ms`,
  );

  const afterSnap = await fetchTursoQuotaSnapshot();
  if (beforeSnap && afterSnap) {
    printTursoSnapshot("실행 후(After) Turso 스냅샷", afterSnap);
    const delta = computeTursoDelta(beforeSnap, afterSnap, telemetry.totalRequests);
    console.error("\n📉 [이번 실행의 Turso 쿼터 소모량(Δ) 및 전시장 20명 추정치]");
    console.error(`  • 이번 실행 행 쓰기 소모(Δ Rows Written): +${fmt(delta.rowsWrittenDelta)}행`);
    console.error(`  • 이번 실행 행 읽기 소모(Δ Rows Read)   : +${fmt(delta.rowsReadDelta)}행`);
    console.error(
      `  • 요청 1건당 평균 소모                   : 쓰기 ${delta.rowsWrittenPerRequest.toFixed(2)}행 / 읽기 ${delta.rowsReadPerRequest.toFixed(2)}행`,
    );
    console.error(
      `  • 전시장 방문객 20명(약 300 요청) 예상 쓰기: 약 +${fmt(delta.projected20UsersRowsWritten)}행`,
    );
  }

  if (abortController.signal.aborted) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`\n리허설 중단: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
