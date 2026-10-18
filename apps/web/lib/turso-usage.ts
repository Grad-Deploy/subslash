import { escapeHtml, sendEmail } from "./email";
import { logError } from "./log";

/**
 * Turso 사용량이 요금제 한도에 가까워지면 운영자에게 메일을 보낸다(하루 크론 `/api/cron/notify`).
 *
 * Turso는 한도에 가까워져도 알리지 않고, 넘으면 쿼리를 `BLOCKED`로 거절한다 — 그때는 로그인·계정 저장이 모두
 * 500을 낸다. Turso는 저장 용량보다 행 쓰기가 먼저 차므로 이 크론이 미리 본다.
 *
 * 한도는 환경 변수로 적는다. 플랫폼 API의 사용량 응답에 요금제 한도가 있는지 문서로 확인하지 못했고, 모르는 한도로
 * 비율을 셈하면 "괜찮다"는 거짓 안심이 된다. 그래서 적은 지표만 보고, 설정이 하나라도 빠지면 아무것도 보지 않는다.
 * 쓴 양은 데이터베이스마다의 합계(`databases[].total`)를 더한다 — 한도는 조직 단위다.
 *
 * 사용자 기록은 읽지도 보내지도 않는다. 메일에는 지표 이름과 숫자만 있다.
 */

const TURSO_API = "https://api.turso.tech/v1";

export const USAGE_METRICS = ["rows_written", "rows_read", "storage_bytes"] as const;
export type UsageMetric = (typeof USAGE_METRICS)[number];
export type TursoUsage = Record<UsageMetric, number>;

const LIMIT_ENV: Record<UsageMetric, string> = {
  rows_written: "TURSO_ROWS_WRITTEN_LIMIT",
  rows_read: "TURSO_ROWS_READ_LIMIT",
  storage_bytes: "TURSO_STORAGE_BYTES_LIMIT",
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
  limits: Partial<Record<UsageMetric, number>>;
  /** 이 비율(0~1) 이상이면 알린다. */
  threshold: number;
}

type Env = Record<string, string | undefined>;

const positive = (value: string | undefined) => {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
};

/** 설정이 다 있으면 그 값, 아니면 null(검사하지 않음). 한도는 적은 것만 본다. */
export function readUsageAlertConfig(env: Env = process.env): UsageAlertConfig | null {
  const token = env.TURSO_PLATFORM_API_TOKEN;
  const organization = env.TURSO_ORG_SLUG;
  const to = env.OPS_ALERT_EMAIL;
  if (!token || !organization || !to) return null;
  const limits: Partial<Record<UsageMetric, number>> = {};
  for (const metric of USAGE_METRICS) {
    const limit = positive(env[LIMIT_ENV[metric]]);
    if (limit !== null) limits[metric] = limit;
  }
  if (Object.keys(limits).length === 0) return null;
  const percent = positive(env.TURSO_USAGE_ALERT_PERCENT);
  return { token, organization, to, limits, threshold: Math.min(percent ?? 80, 100) / 100 };
}

/** 플랫폼 API 응답에서 데이터베이스마다의 합계를 더한다. 모양이 다르면 null — 0으로 읽으면 '여유 있음'이 된다. */
export function sumDatabaseUsage(body: unknown): TursoUsage | null {
  const databases = (body as { databases?: unknown } | null)?.databases;
  if (!Array.isArray(databases)) return null;
  const sum: TursoUsage = { rows_written: 0, rows_read: 0, storage_bytes: 0 };
  for (const database of databases) {
    const total = (database as { total?: Record<string, unknown> } | null)?.total;
    if (!total) return null;
    for (const metric of USAGE_METRICS) {
      const value = total[metric];
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      sum[metric] += value;
    }
  }
  return sum;
}

export interface UsageAlert {
  metric: UsageMetric;
  used: number;
  limit: number;
  ratio: number;
}

export function usageAlerts(usage: TursoUsage, config: UsageAlertConfig): UsageAlert[] {
  return USAGE_METRICS.flatMap((metric) => {
    const limit = config.limits[metric];
    if (limit === undefined) return [];
    const ratio = usage[metric] / limit;
    return ratio >= config.threshold ? [{ metric, used: usage[metric], limit, ratio }] : [];
  });
}

export type UsageCheckResult =
  | { status: "off" }
  | { status: "ok" | "alerted"; alerts: number }
  | { status: "error"; reason: string };

/**
 * 크론이 부른다. 넘은 지표가 있으면 그날 메일을 보낸다 — 넘은 동안은 매일 온다. 한 번만 보내려면 보낸 기록을
 * DB에 써야 하는데, 행 쓰기가 모자라 알리는 기능이 행을 쓰게 된다.
 */
export async function checkTursoUsage(
  config: UsageAlertConfig | null = readUsageAlertConfig(),
): Promise<UsageCheckResult> {
  if (!config) return { status: "off" };
  let body: unknown;
  try {
    const response = await fetch(
      `${TURSO_API}/organizations/${encodeURIComponent(config.organization)}/usage`,
      { headers: { Authorization: `Bearer ${config.token}` } },
    );
    if (!response.ok) {
      // 토큰이 틀렸거나 만료되면 매일 이 줄이 남는다 — 알림이 꺼진 것을 모르고 지내지 않게.
      logError("turso-usage request failed", new Error(`status ${response.status}`));
      return { status: "error", reason: `turso_${response.status}` };
    }
    body = await response.json();
  } catch (error) {
    logError("turso-usage request failed", error);
    return { status: "error", reason: "network" };
  }

  const usage = sumDatabaseUsage(body);
  if (!usage) {
    logError("turso-usage unexpected response", new Error("no databases[].total"));
    return { status: "error", reason: "shape" };
  }
  const alerts = usageAlerts(usage, config);
  if (alerts.length === 0) return { status: "ok", alerts: 0 };

  const sent = await sendEmail({ to: config.to, ...usageAlertEmail(alerts, config) });
  if (!sent.delivered) return { status: "error", reason: sent.error ?? "email_not_sent" };
  return { status: "alerted", alerts: alerts.length };
}

const formatNumber = (n: number) => Math.round(n).toLocaleString("ko-KR");

export function usageAlertEmail(
  alerts: UsageAlert[],
  config: Pick<UsageAlertConfig, "organization">,
): { subject: string; text: string; html: string } {
  const lines = alerts.map(
    (alert) =>
      `${METRIC_LABEL[alert.metric]}: ${formatNumber(alert.used)} / ${formatNumber(alert.limit)} (${Math.floor(alert.ratio * 100)}%)`,
  );
  const top = Math.floor(Math.max(...alerts.map((alert) => alert.ratio)) * 100);
  const subject = `[SubSlash 운영] Turso 사용량 ${top}% — ${config.organization}`;
  const note =
    "이번 결제 주기의 사용량을 환경 변수에 적은 한도와 견준 값입니다. 한도를 넘으면 Turso가 쿼리를 거절해 로그인·계정 저장이 실패합니다. " +
    "Turso 대시보드에서 사용량을 확인하고 요금제나 초과 요금 설정을 정해 주세요. 한도 아래로 내려갈 때까지 매일 보냅니다.";
  return {
    subject,
    text: [`Turso 조직 ${config.organization}`, ...lines, "", note].join("\n"),
    html: `<p>Turso 조직 <b>${escapeHtml(config.organization)}</b></p><ul>${lines
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("")}</ul><p>${escapeHtml(note)}</p>`,
  };
}
