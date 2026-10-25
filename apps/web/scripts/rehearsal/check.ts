/**
 * 전시장 대비 무료 호스팅(Vercel Hobby + Turso Free) 쿼터 보호형 리허설 로직.
 *
 * 무료 요금제의 월간 한도(Turso 행 읽기·쓰기, Vercel 함수 호출)는 일별로 초기화되지 않으며,
 * 초과 시 최대 30일간 DB 쿼리가 `BLOCKED`되거나 배포가 일시 정지될 수 있다.
 * 따라서 스트레스·스파이크·내구성(Soak) 테스트는 원천 배제하고, 다음 하드 가드레일을 코드로 강제한다:
 * - 가상 사용자(VU) 상한: 최대 10명 (기본 드라이런: 2명)
 * - 실행 시간 상한: 최대 120초 (기본 드라이런: 30초)
 * - 1회 실행 총 요청 상한: 최대 400건 (기본 드라이런: 40건 — 전체 누적 2,000건 미만 보장)
 * - 하드 중단(Circuit Breaker):
 *   1. 응답에 Turso `BLOCKED` 또는 `SQLITE_BUSY` 문구 감지 시 즉시 중단
 *   2. HTTP 402(쿼터/결제 한도) 또는 429(속도 제한) 1건이라도 발생 시 즉시 중단
 *   3. HTTP 5xx 오류가 3건 이상 버스트로 발생 시 즉시 중단
 *   4. 최소 10건 이후 누적 오류율이 5%를 초과하면 즉시 중단
 */
import { readOrganizationUsage, readPlanQuotas, type TursoUsage } from "../../lib/turso-usage";

export const HARD_LIMITS = {
  maxVus: 10,
  maxDurationSeconds: 120,
  maxRequestsPerRun: 400,
  maxErrorRate: 0.05,
  minSamplesForErrorRate: 10,
  max5xxBurst: 3,
} as const;

export const REQUIRED_SECURITY_HEADERS: Record<string, string> = {
  "x-frame-options": "DENY",
  "content-security-policy": "frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export interface RehearsalOptions {
  baseUrl: string;
  vus: number;
  durationSeconds: number;
  maxRequests: number;
  thinkTimeMs: number;
  quotaOnly: boolean;
}

export function parseRehearsalArgs(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): RehearsalOptions {
  const flag = (name: string): string | undefined => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const quotaOnly = args.includes("--quota-only");
  const isFull = args.includes("--full");

  const baseUrl = (flag("--url") ?? env.REHEARSAL_BASE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );

  const vus = Number(flag("--vus") ?? (isFull ? 10 : 2));
  const durationSeconds = Number(flag("--duration") ?? (isFull ? 60 : 30));
  const maxRequests = Number(flag("--max-requests") ?? (isFull ? 250 : 40));
  const thinkTimeMs = Number(flag("--think-ms") ?? 1500);

  if (!Number.isInteger(vus) || vus < 1 || vus > HARD_LIMITS.maxVus) {
    throw new Error(
      `가상 사용자(--vus)는 1~${HARD_LIMITS.maxVus}명 사이여야 합니다(현재: ${vus}). 무료 쿼터 보호를 위해 10명을 넘길 수 없습니다.`,
    );
  }
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds < 5 ||
    durationSeconds > HARD_LIMITS.maxDurationSeconds
  ) {
    throw new Error(
      `실행 시간(--duration)은 5~${HARD_LIMITS.maxDurationSeconds}초 사이여야 합니다(현재: ${durationSeconds}).`,
    );
  }
  if (
    !Number.isInteger(maxRequests) ||
    maxRequests < 1 ||
    maxRequests > HARD_LIMITS.maxRequestsPerRun
  ) {
    throw new Error(
      `최대 요청 수(--max-requests)는 1~${HARD_LIMITS.maxRequestsPerRun}건 사이여야 합니다(현재: ${maxRequests}). 전체 테스트 누적 2,000건 미만을 유지해야 합니다.`,
    );
  }
  if (!Number.isFinite(thinkTimeMs) || thinkTimeMs < 200) {
    throw new Error(`요청 간격(--think-ms)은 최소 200ms 이상이어야 합니다(스트레스 테스트 금지).`);
  }

  return { baseUrl, vus, durationSeconds, maxRequests, thinkTimeMs, quotaOnly };
}

export type AbortReason =
  "turso_blocked" | "http_402_or_429" | "http_5xx_burst" | "error_rate_exceeded";

export interface RunTelemetry {
  totalRequests: number;
  failedRequests: number;
  statusCounts: Record<number, number>;
  server5xxCount: number;
  latenciesMs: number[];
  lastStatus?: number;
  lastBodySnippet?: string;
}

export function createTelemetry(): RunTelemetry {
  return {
    totalRequests: 0,
    failedRequests: 0,
    statusCounts: {},
    server5xxCount: 0,
    latenciesMs: [],
  };
}

const BLOCKED_PATTERN = /\b(BLOCKED|blocked_reads|blocked_writes|SQLITE_BUSY)\b/i;

/**
 * 매 응답 직후 즉시 중단해야 하는지 판정한다.
 * 정상 범위를 벗어난 신호가 보이면 곧바로 원인을 돌려주어 나머지 VU가 추가 요청을 보내지 않게 막는다.
 */
export function evaluateAbortCondition(
  telemetry: RunTelemetry,
  expectedStatuses: number[] = [200, 201, 204, 409],
): { abort: true; reason: AbortReason; detail: string } | { abort: false } {
  const { lastStatus, lastBodySnippet, totalRequests, failedRequests, server5xxCount } = telemetry;

  if (lastBodySnippet && BLOCKED_PATTERN.test(lastBodySnippet)) {
    return {
      abort: true,
      reason: "turso_blocked",
      detail: `DB 쿼리 차단/잠금 징후 감지 (${lastBodySnippet.slice(0, 120)})`,
    };
  }

  if (lastStatus === 402 || lastStatus === 429) {
    return {
      abort: true,
      reason: "http_402_or_429",
      detail: `HTTP ${lastStatus} 응답 감지 — 호스팅 쿼터 또는 속도 제한에 도달하여 즉시 중단합니다.`,
    };
  }

  if (server5xxCount >= HARD_LIMITS.max5xxBurst) {
    return {
      abort: true,
      reason: "http_5xx_burst",
      detail: `HTTP 5xx 서버 오류가 ${server5xxCount}건 발생하여 즉시 중단합니다.`,
    };
  }

  if (
    totalRequests >= HARD_LIMITS.minSamplesForErrorRate &&
    failedRequests / totalRequests > HARD_LIMITS.maxErrorRate
  ) {
    const pct = ((failedRequests / totalRequests) * 100).toFixed(1);
    return {
      abort: true,
      reason: "error_rate_exceeded",
      detail: `오류율 ${pct}% (${failedRequests}/${totalRequests})가 허용치(5%)를 초과하여 즉시 중단합니다.`,
    };
  }

  void expectedStatuses;
  return { abort: false };
}

export function recordResponse(
  telemetry: RunTelemetry,
  status: number,
  latencyMs: number,
  bodySnippet: string,
  expectedStatuses: number[] = [200, 201, 204, 409],
): { abort: true; reason: AbortReason; detail: string } | { abort: false } {
  telemetry.totalRequests += 1;
  telemetry.statusCounts[status] = (telemetry.statusCounts[status] ?? 0) + 1;
  telemetry.latenciesMs.push(latencyMs);
  telemetry.lastStatus = status;
  telemetry.lastBodySnippet = bodySnippet;

  if (status >= 500 && status <= 599) {
    telemetry.server5xxCount += 1;
  }
  if (!expectedStatuses.includes(status) || BLOCKED_PATTERN.test(bodySnippet)) {
    telemetry.failedRequests += 1;
  }

  return evaluateAbortCondition(telemetry, expectedStatuses);
}

/** 응답 헤더에서 `next.config.ts`에 정의한 5대 보안 헤더가 모두 들어 있는지 확인한다. */
export function verifySecurityHeaders(headers: Headers): {
  ok: boolean;
  missingOrMismatch: string[];
} {
  const missingOrMismatch: string[] = [];
  for (const [key, expected] of Object.entries(REQUIRED_SECURITY_HEADERS)) {
    const actual = headers.get(key);
    if (!actual || !actual.toLowerCase().includes(expected.toLowerCase())) {
      missingOrMismatch.push(`${key}: expected "${expected}", got "${actual ?? "null"}"`);
    }
  }
  return { ok: missingOrMismatch.length === 0, missingOrMismatch };
}

export interface TursoQuotaSnapshot {
  organization: string;
  plan: string;
  usage: TursoUsage;
  quotas: Partial<TursoUsage>;
  blockedReads: boolean;
  blockedWrites: boolean;
  capturedAt: string;
}

export interface TursoQuotaDelta {
  rowsReadDelta: number;
  rowsWrittenDelta: number;
  storageBytesDelta: number;
  rowsReadPerRequest: number;
  rowsWrittenPerRequest: number;
  projected20UsersRowsWritten: number;
}

/**
 * Turso Platform API에서 현재 조직의 월간 누적 사용량과 요금제 한도를 읽는다.
 * 토큰이나 조직 슬러그가 없으면 null을 돌려준다(수동 대시보드 확인 안내로 대체).
 */
export async function fetchTursoQuotaSnapshot(
  env: Record<string, string | undefined> = process.env,
): Promise<TursoQuotaSnapshot | null> {
  const token = env.TURSO_PLATFORM_API_TOKEN;
  const organization = env.TURSO_ORG_SLUG;
  if (!token || !organization) return null;

  const org = encodeURIComponent(organization);
  const get = async (path: string): Promise<unknown> => {
    const res = await fetch(`https://api.turso.tech/v1${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Turso Platform API 오류: HTTP ${res.status} (${path})`);
    return res.json();
  };

  const [usageBody, subBody, orgsBody] = await Promise.all([
    get(`/organizations/${org}/usage`),
    get(`/organizations/${org}/subscription`),
    get(`/organizations`),
  ]);

  const usage = readOrganizationUsage(usageBody);
  const plan =
    ((subBody as { subscription?: { plan?: unknown } } | null)?.subscription?.plan as string) ??
    "starter";
  const quotas = readPlanQuotas(await get(`/organizations/${org}/plans`), plan) ?? {};
  const orgRow = Array.isArray(orgsBody)
    ? (
        orgsBody as Array<{
          slug?: unknown;
          blocked_reads?: unknown;
          blocked_writes?: unknown;
        }>
      ).find((item) => item?.slug === organization)
    : undefined;

  if (!usage) throw new Error("Turso 사용량 응답 형식을 해석할 수 없습니다.");

  return {
    organization,
    plan,
    usage,
    quotas,
    blockedReads: orgRow?.blocked_reads === true,
    blockedWrites: orgRow?.blocked_writes === true,
    capturedAt: new Date().toISOString(),
  };
}

export function computeTursoDelta(
  before: TursoQuotaSnapshot,
  after: TursoQuotaSnapshot,
  totalRequests: number,
): TursoQuotaDelta {
  const rowsReadDelta = Math.max(0, after.usage.rows_read - before.usage.rows_read);
  const rowsWrittenDelta = Math.max(0, after.usage.rows_written - before.usage.rows_written);
  const storageBytesDelta = after.usage.storage_bytes - before.usage.storage_bytes;
  const safeReqs = Math.max(1, totalRequests);
  const rowsReadPerRequest = rowsReadDelta / safeReqs;
  const rowsWrittenPerRequest = rowsWrittenDelta / safeReqs;
  // 전시장 20명이 각자 약 15회 API 요청(가입·스냅샷 저장·조회 등 총 300회 요청)을 수행한다고 가정할 때의 예상 행 쓰기 수
  const projected20UsersRowsWritten = Math.ceil(rowsWrittenPerRequest * 300);

  return {
    rowsReadDelta,
    rowsWrittenDelta,
    storageBytesDelta,
    rowsReadPerRequest,
    rowsWrittenPerRequest,
    projected20UsersRowsWritten,
  };
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[idx]);
}
