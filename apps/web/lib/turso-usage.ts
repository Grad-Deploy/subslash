import { escapeHtml, sendEmail } from "./email";
import { logError } from "./log";

/**
 * Turso 사용량이 요금제 한도에 가까워지면 운영자에게 메일을 보낸다(하루 크론 `/api/cron/notify`).
 *
 * Turso는 한도에 가까워져도 알리지 않고, 넘으면 쿼리를 `BLOCKED`로 거절한다 — 그때는 로그인·계정 저장이 모두
 * 500을 낸다. Turso는 저장 용량보다 행 쓰기가 먼저 차므로 이 크론이 미리 본다.
 *
 * 플랫폼 API에서 세 가지를 읽는다(2026년 10월 실제 응답으로 확인했다 — 문서의 예시와 모양이 다르다).
 * - `GET /organizations/{org}/usage`의 `organization.usage`: 이번 결제 주기에 조직이 쓴 양(데이터베이스 합계와 같다)
 * - `GET /organizations/{org}/subscription`의 `plan` → `GET /organizations/{org}/plans`의 `quotas`: 그 요금제의 한도
 * - `GET /organizations`의 `blocked_reads`·`blocked_writes`: 이미 막혔는지
 * 한도를 환경 변수로 적으면 그 값을 쓴다. 응답 모양이 다르거나 요금제 한도를 찾지 못하면 0이나 '여유 있음'으로 읽지
 * 않고 오류로 남긴다.
 *
 * 사용자 기록은 읽지도 보내지도 않는다. 메일에는 지표 이름과 숫자만 있다.
 */

const TURSO_API = "https://api.turso.tech/v1";

export const USAGE_METRICS = ["rows_written", "rows_read", "storage_bytes"] as const;
export type UsageMetric = (typeof USAGE_METRICS)[number];
export type TursoUsage = Record<UsageMetric, number>;
type Limits = Partial<Record<UsageMetric, number>>;

const LIMIT_ENV: Record<UsageMetric, string> = {
  rows_written: "TURSO_ROWS_WRITTEN_LIMIT",
  rows_read: "TURSO_ROWS_READ_LIMIT",
  storage_bytes: "TURSO_STORAGE_BYTES_LIMIT",
};

/** `/plans` 응답의 `quotas` 칸 이름. */
const QUOTA_KEY: Record<UsageMetric, string> = {
  rows_written: "rowsWritten",
  rows_read: "rowsRead",
  storage_bytes: "storage",
};

const METRIC_LABEL: Record<UsageMetric, string> = {
  rows_written: "행 쓰기",
  rows_read: "행 읽기",
  storage_bytes: "저장 용량(바이트)",
};

export interface UsageAlertConfig {
  token: string;
  organization: string;
  to: string;
  /** 환경 변수로 적은 한도. 적지 않은 지표는 요금제 한도(`quotas`)를 쓴다. */
  limits: Limits;
  /** 이 비율(0~1) 이상이면 알린다. */
  threshold: number;
}

type Env = Record<string, string | undefined>;

const positive = (value: string | undefined) => {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
};

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/** 토큰·조직·받는 주소가 다 있으면 그 값, 아니면 null(검사하지 않음). */
export function readUsageAlertConfig(env: Env = process.env): UsageAlertConfig | null {
  const token = env.TURSO_PLATFORM_API_TOKEN;
  const organization = env.TURSO_ORG_SLUG;
  const to = env.OPS_ALERT_EMAIL;
  if (!token || !organization || !to) return null;
  const limits: Limits = {};
  for (const metric of USAGE_METRICS) {
    const limit = positive(env[LIMIT_ENV[metric]]);
    if (limit !== null) limits[metric] = limit;
  }
  const percent = positive(env.TURSO_USAGE_ALERT_PERCENT);
  return { token, organization, to, limits, threshold: Math.min(percent ?? 80, 100) / 100 };
}

/** `/usage` 응답의 조직 사용량. 모양이 다르면 null — 0으로 읽으면 '여유 있음'이 된다. */
export function readOrganizationUsage(body: unknown): TursoUsage | null {
  const usage = (body as { organization?: { usage?: Record<string, unknown> } } | null)
    ?.organization?.usage;
  if (!usage) return null;
  const result = {} as TursoUsage;
  for (const metric of USAGE_METRICS) {
    const value = usage[metric];
    if (!isCount(value)) return null;
    result[metric] = value;
  }
  return result;
}

/** `/plans` 응답에서 그 요금제의 한도. 요금제를 찾지 못하면 null. */
export function readPlanQuotas(body: unknown, plan: string): Limits | null {
  const plans = (body as { plans?: unknown } | null)?.plans;
  if (!Array.isArray(plans)) return null;
  const found = plans.find((p) => (p as { name?: unknown } | null)?.name === plan) as
    { quotas?: Record<string, unknown> } | undefined;
  if (!found?.quotas) return null;
  const quotas: Limits = {};
  for (const metric of USAGE_METRICS) {
    const value = found.quotas[QUOTA_KEY[metric]];
    if (isCount(value) && value > 0) quotas[metric] = value;
  }
  return quotas;
}

export interface UsageAlert {
  metric: UsageMetric;
  used: number;
  limit: number;
  ratio: number;
}

export function usageAlerts(usage: TursoUsage, limits: Limits, threshold: number): UsageAlert[] {
  return USAGE_METRICS.flatMap((metric) => {
    const limit = limits[metric];
    if (limit === undefined) return [];
    const ratio = usage[metric] / limit;
    return ratio >= threshold ? [{ metric, used: usage[metric], limit, ratio }] : [];
  });
}

export type UsageCheckResult =
  | { status: "off" }
  | { status: "ok" | "alerted"; alerts: number }
  | { status: "error"; reason: string };

class TursoRequestError extends Error {}

interface OrganizationRow {
  slug?: unknown;
  blocked_reads?: unknown;
  blocked_writes?: unknown;
}

/**
 * 크론이 부른다. 넘은 지표가 있거나 이미 막혔으면 그날 메일을 보낸다 — 그동안은 매일 온다. 한 번만 보내려면 보낸
 * 기록을 DB에 써야 하는데, 행 쓰기가 모자라 알리는 기능이 행을 쓰게 된다.
 */
export async function checkTursoUsage(
  config: UsageAlertConfig | null = readUsageAlertConfig(),
): Promise<UsageCheckResult> {
  if (!config) return { status: "off" };
  const org = encodeURIComponent(config.organization);
  const get = async (path: string): Promise<unknown> => {
    const response = await fetch(`${TURSO_API}${path}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    // 토큰이 틀렸거나 만료되면 매일 이 줄이 남는다 — 알림이 꺼진 것을 모르고 지내지 않게.
    if (!response.ok) throw new TursoRequestError(`turso_${response.status}`);
    return response.json();
  };

  let usage: TursoUsage | null;
  let limits: Limits | null;
  let blocked: boolean;
  try {
    const [usageBody, subscriptionBody, organizationsBody] = await Promise.all([
      get(`/organizations/${org}/usage`),
      get(`/organizations/${org}/subscription`),
      get(`/organizations`),
    ]);
    usage = readOrganizationUsage(usageBody);
    const plan = (subscriptionBody as { subscription?: { plan?: unknown } } | null)?.subscription
      ?.plan;
    const quotas =
      typeof plan === "string"
        ? readPlanQuotas(await get(`/organizations/${org}/plans`), plan)
        : null;
    limits = quotas ? { ...quotas, ...config.limits } : null;
    const organization = Array.isArray(organizationsBody)
      ? (organizationsBody as OrganizationRow[]).find((o) => o?.slug === config.organization)
      : undefined;
    blocked = organization?.blocked_reads === true || organization?.blocked_writes === true;
  } catch (error) {
    logError("turso-usage request failed", error);
    return {
      status: "error",
      reason: error instanceof TursoRequestError ? error.message : "network",
    };
  }

  if (!usage || !limits) {
    logError("turso-usage unexpected response", new Error(usage ? "no plan quotas" : "no usage"));
    return { status: "error", reason: "shape" };
  }
  const alerts = usageAlerts(usage, limits, config.threshold);
  if (alerts.length === 0 && !blocked) return { status: "ok", alerts: 0 };

  const sent = await sendEmail({ to: config.to, ...usageAlertEmail(alerts, config, blocked) });
  if (!sent.delivered) return { status: "error", reason: sent.error ?? "email_not_sent" };
  return { status: "alerted", alerts: alerts.length };
}

const formatNumber = (n: number) => Math.round(n).toLocaleString("ko-KR");

export function usageAlertEmail(
  alerts: UsageAlert[],
  config: Pick<UsageAlertConfig, "organization">,
  blocked = false,
): { subject: string; text: string; html: string } {
  const lines = [
    ...(blocked ? ["Turso가 이미 이 조직의 읽기나 쓰기를 막고 있습니다."] : []),
    ...alerts.map(
      (alert) =>
        `${METRIC_LABEL[alert.metric]}: ${formatNumber(alert.used)} / ${formatNumber(alert.limit)} (${Math.floor(alert.ratio * 100)}%)`,
    ),
  ];
  const top = Math.floor(Math.max(0, ...alerts.map((alert) => alert.ratio)) * 100);
  const subject = blocked
    ? `[SubSlash 운영] Turso가 쿼리를 막고 있습니다 — ${config.organization}`
    : `[SubSlash 운영] Turso 사용량 ${top}% — ${config.organization}`;
  const note =
    "이번 결제 주기의 사용량을 요금제 한도(환경 변수로 적었으면 그 값)와 견준 값입니다. 한도를 넘으면 Turso가 쿼리를 거절해 로그인·계정 저장이 실패합니다. " +
    "Turso 대시보드에서 사용량을 확인하고 요금제나 초과 요금 설정을 정해 주세요. 한도 아래로 내려갈 때까지 매일 보냅니다.";
  return {
    subject,
    text: [`Turso 조직 ${config.organization}`, ...lines, "", note].join("\n"),
    html: `<p>Turso 조직 <b>${escapeHtml(config.organization)}</b></p><ul>${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("")}</ul><p>${escapeHtml(note)}</p>`,
  };
}
