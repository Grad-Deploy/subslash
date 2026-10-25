import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";
import {
  computeTursoDelta,
  createTelemetry,
  fetchTursoQuotaSnapshot,
  formatCleanupReport,
  parseRehearsalArgs,
  percentile,
  recordCleanupResult,
  recordResponse,
  REQUIRED_SECURITY_HEADERS,
  totalQuotaRequests,
  verifySecurityHeaders,
  type TursoQuotaSnapshot,
} from "../../scripts/rehearsal/check";

describe("전시장 리허설 가드레일 및 보안 헤더 점검", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("기본값은 안전한 시운전(2명, 30초, 최대 40건)이고 상한(10명, 120초, 400건)을 넘기면 거부한다", () => {
    const dry = parseRehearsalArgs([], {});
    expect(dry).toEqual({
      baseUrl: "http://localhost:3000",
      vus: 2,
      durationSeconds: 30,
      maxRequests: 40,
      thinkTimeMs: 1500,
      quotaOnly: false,
    });

    const full = parseRehearsalArgs(["--full", "--url", "https://subslash.example/"], {});
    expect(full).toEqual({
      baseUrl: "https://subslash.example",
      vus: 10,
      durationSeconds: 60,
      maxRequests: 250,
      thinkTimeMs: 1500,
      quotaOnly: false,
    });

    expect(() => parseRehearsalArgs(["--vus", "11"], {})).toThrow(/1~10명/);
    expect(() => parseRehearsalArgs(["--duration", "121"], {})).toThrow(/5~120초/);
    expect(() => parseRehearsalArgs(["--max-requests", "2000"], {})).toThrow(/1~400건/);
    expect(() => parseRehearsalArgs(["--think-ms", "50"], {})).toThrow(/최소 200ms/);
  });

  it("웹 설정에 정의된 보안 헤더가 필수 보안 헤더 5종을 모두 충족한다", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");
    const rules = await nextConfig.headers!();
    const rootRule = rules.find((rule) => rule.source === "/:path*");
    expect(rootRule).toBeDefined();

    const headers = new Headers();
    for (const item of rootRule!.headers) {
      headers.set(item.key, item.value);
    }

    const result = verifySecurityHeaders(headers);
    expect(result).toEqual({ ok: true, missingOrMismatch: [] });

    headers.delete("x-frame-options");
    const broken = verifySecurityHeaders(headers);
    expect(broken.ok).toBe(false);
    expect(broken.missingOrMismatch[0]).toContain(REQUIRED_SECURITY_HEADERS["x-frame-options"]);
  });

  it("즉시 중단 조건(데이터베이스 차단, 402·429 응답, 서버 오류 3건 연속, 오류율 5% 초과)을 곧바로 감지한다", () => {
    // 1. 데이터베이스 차단 감지
    const tBlocked = createTelemetry();
    expect(recordResponse(tBlocked, 500, 20, '{"error":"Turso query BLOCKED"}')).toEqual({
      abort: true,
      reason: "turso_blocked",
      detail: expect.stringContaining("BLOCKED"),
    });

    // 2. 429·402 응답 즉시 중단
    const t429 = createTelemetry();
    expect(recordResponse(t429, 429, 15, "Too Many Requests")).toEqual({
      abort: true,
      reason: "http_402_or_429",
      detail: expect.stringContaining("429"),
    });

    const t402 = createTelemetry();
    expect(recordResponse(t402, 402, 15, "Payment Required")).toEqual({
      abort: true,
      reason: "http_402_or_429",
      detail: expect.stringContaining("402"),
    });

    // 3. 서버 오류 3건 누적 중단
    const t5xx = createTelemetry();
    expect(recordResponse(t5xx, 502, 30, "Bad Gateway").abort).toBe(false);
    expect(recordResponse(t5xx, 503, 30, "Service Unavailable").abort).toBe(false);
    expect(recordResponse(t5xx, 500, 30, "Internal Error")).toEqual({
      abort: true,
      reason: "http_5xx_burst",
      detail: expect.stringContaining("3건"),
    });

    // 4. 최소 10건 이후 단일 실패(1건)는 계속 진행하고, 최소 2건 실패부터 오류율 5% 초과 시 중단한다
    const tRate = createTelemetry();
    for (let i = 0; i < 9; i++) {
      expect(recordResponse(tRate, 200, 10, "ok").abort).toBe(false);
    }
    // 10번째 요청이 첫 실패(1/10 = 10%)여도 단일 실패(failedRequests = 1 < 2)이므로 중단하지 않는다.
    expect(recordResponse(tRate, 400, 10, "bad request")).toEqual({ abort: false });

    // 11번째 요청에서 두 번째 실패(2/11 = 18.2% > 5%, failedRequests = 2 >= 2)가 발생하면 즉시 중단한다.
    expect(recordResponse(tRate, 400, 10, "bad request")).toEqual({
      abort: true,
      reason: "error_rate_exceeded",
      detail: expect.stringContaining("18.2%"),
    });
  });

  it("임시 계정 정리 결과를 일반 부하 통계와 분리해 기록하고, 실패 시 이메일 경고와 쿼터 분모를 보존한다", () => {
    const telemetry = createTelemetry();
    recordResponse(telemetry, 200, 25, "ok");
    recordResponse(telemetry, 201, 40, "created");

    recordCleanupResult(telemetry, "rehearsal.1.aaa@gmail.com", true);
    recordCleanupResult(telemetry, "rehearsal.2.bbb@gmail.com", false);

    // 정리 요청은 일반 부하 통계(요청 수·실패 수·응답시간)를 오염시키지 않는다.
    expect(telemetry.totalRequests).toBe(2);
    expect(telemetry.failedRequests).toBe(0);
    expect(telemetry.latenciesMs).toEqual([25, 40]);

    // 정리 시도·성공·실패 건수와 실패 계정 이메일을 기록하고 경고 문구를 만든다.
    expect(telemetry.cleanup).toEqual({
      attempted: 2,
      succeeded: 1,
      failed: 1,
      failedAccounts: ["rehearsal.2.bbb@gmail.com"],
    });
    const report = formatCleanupReport(telemetry.cleanup);
    expect(report.summaryLine).toContain("시도 2건 / 성공 1건 / 실패 1건");
    expect(report.warningLine).toContain("rehearsal.2.bbb@gmail.com");

    // 모두 성공하면 경고 문구는 null이다.
    const cleanTelemetry = createTelemetry();
    recordCleanupResult(cleanTelemetry, "rehearsal.1.ok@gmail.com", true);
    expect(formatCleanupReport(cleanTelemetry.cleanup).warningLine).toBeNull();

    // Turso 쿼터 소모량 계산의 추정 분모는 부하 요청(2건) + 정리 시도(2건) = 4건이다.
    expect(totalQuotaRequests(telemetry)).toBe(4);
  });

  it("실행 전·후 데이터베이스 사용량 기록으로 소모량과 전시장 20명 예상치를 계산한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/usage")) {
          return Response.json({
            organization: {
              usage: { rows_read: 1200, rows_written: 150, storage_bytes: 4096 },
            },
          });
        }
        if (url.endsWith("/subscription")) {
          return Response.json({ subscription: { plan: "starter" } });
        }
        if (url.endsWith("/plans")) {
          return Response.json({
            plans: [
              {
                name: "starter",
                quotas: { rowsRead: 500_000_000, rowsWritten: 10_000_000, storage: 5_000_000_000 },
              },
            ],
          });
        }
        return Response.json([{ slug: "subslash", blocked_reads: false, blocked_writes: false }]);
      }),
    );

    const before = await fetchTursoQuotaSnapshot({
      TURSO_PLATFORM_API_TOKEN: "tok",
      TURSO_ORG_SLUG: "subslash",
    });
    expect(before).not.toBeNull();
    expect(before!.usage.rows_written).toBe(150);

    const after: TursoQuotaSnapshot = {
      ...before!,
      usage: { rows_read: 1280, rows_written: 170, storage_bytes: 4096 },
    };

    const delta = computeTursoDelta(before!, after, 40);
    expect(delta).toEqual({
      rowsReadDelta: 80,
      rowsWrittenDelta: 20,
      storageBytesDelta: 0,
      rowsReadPerRequest: 2,
      rowsWrittenPerRequest: 0.5,
      projected20UsersRowsWritten: 150,
    });
    expect(percentile([10, 20, 30, 40, 100], 95)).toBe(100);
  });
});
