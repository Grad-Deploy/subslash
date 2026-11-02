import { after } from "next/server";
import { isErrorLogExportOpen } from "./privacy";

/**
 * 서버 오류 한 줄을 운영자의 Grafana Cloud(Loki)로 보낸다. Vercel의 요청 로그는 보내지 않는다 — 주소에 실린 토큰, IP가
 * 함께 나가게 되고, 운영자가 보려는 것은 오류뿐이다. 나가는 것은 `[범위] 값을 지운 오류 문장`과 시각, 배포 환경뿐이고
 * 계정 ID·IP·요청 주소를 붙이지 않는다.
 *
 * 설정(`GRAFANA_LOKI_*`)과 방침 게시(`ERROR_LOG_EXPORT`)가 모두 있어야 나간다. 실패해도 응답을 막거나 다시 오류를 만들지
 * 않는다.
 */

const REDACTED = "[redacted]";
const SECRET_NAMES =
  "token|sessiontoken|access_token|refresh_token|code|state|verifier|challenge|secret|password|passwd|api_?key|key|sig|signature|authorization|cookie";

const RULES: readonly [RegExp, string][] = [
  // Drizzle 오류의 바인딩 값. 줄 끝까지 값이다.
  [/params:.*$/gim, `params: ${REDACTED}`],
  [new RegExp(`\\b(${SECRET_NAMES})=[^&\\s"']+`, "gi"), `$1=${REDACTED}`],
  [new RegExp(`"(${SECRET_NAMES})"\\s*:\\s*"[^"]*"`, "gi"), `"$1":"${REDACTED}"`],
  [/\b(Bearer|Basic)\s+[^\s,;"']+/gi, `$1 ${REDACTED}`],
  [/\beyJ[\w-]{5,}(\.[\w-]+){0,2}/g, REDACTED],
  [/\blibsql:\/\/\S+/gi, `libsql://${REDACTED}`],
  [/\b(sk|re|ghp|gho|glc)[-_][A-Za-z0-9_-]{10,}/g, REDACTED],
  [/\b[0-9a-f]{32,}\b/gi, REDACTED],
  [/[^\s"'<>(),;:]+@[^\s"'<>(),;:]+\.[^\s"'<>(),;:]+/g, "[email]"],
];

/** 로그에 남기기 전에 토큰·비밀번호·이메일처럼 보이는 값을 지운다. 모양으로 지우므로 오류 문장은 읽을 수 있게 남는다. */
export function redactSecrets(text: string): string {
  return RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}

const MAX_LINE = 1000;
const MAX_PER_MINUTE = 30;
const TIMEOUT_MS = 2000;
let windowStart = 0;
let sentInWindow = 0;

/** 오류가 쏟아져도 인스턴스마다 분당 이만큼만 보낸다 — 무료 한도를 태우지 않고, 처음 몇 줄이면 원인을 안다. */
function withinBudget(now: number): boolean {
  if (now - windowStart >= 60_000) {
    windowStart = now;
    sentInWindow = 0;
  }
  if (sentInWindow >= MAX_PER_MINUTE) return false;
  sentInWindow += 1;
  return true;
}

interface LokiConfig {
  url: string;
  user: string;
  token: string;
}

function lokiConfig(): LokiConfig | null {
  const url = process.env.GRAFANA_LOKI_URL;
  const user = process.env.GRAFANA_LOKI_USER;
  const token = process.env.GRAFANA_LOKI_TOKEN;
  if (!url?.startsWith("https://") || !user || !token) return null;
  return { url, user, token };
}

async function push(config: LokiConfig, line: string, now: number): Promise<void> {
  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${config.user}:${config.token}`).toString("base64")}`,
      },
      body: JSON.stringify({
        streams: [
          {
            stream: {
              app: "subslash",
              env: process.env.VERCEL_ENV ?? "development",
              level: "error",
            },
            values: [[`${now}000000`, line]],
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // logError를 부르지 않는다 — 내보내기 실패가 다시 내보내기를 부른다.
    if (!response.ok) console.warn(`[error-export] Loki responded ${response.status}`);
  } catch (error) {
    console.warn("[error-export]", error instanceof Error ? error.name : "unknown error");
  }
}

/** 이미 값을 지운 한 줄을 내보낸다. 응답을 보낸 뒤에 보내고(`after`), 요청 밖이면 바로 보낸다. */
export function exportErrorLine(line: string, now = Date.now()): void {
  const config = lokiConfig();
  if (!config || !isErrorLogExportOpen(new Date(now)) || !withinBudget(now)) return;
  const bounded = redactSecrets(line).slice(0, MAX_LINE);
  try {
    after(() => push(config, bounded, now));
  } catch {
    void push(config, bounded, now);
  }
}

/** 테스트용. */
export function resetErrorExportBudget(): void {
  windowStart = 0;
  sentInWindow = 0;
}
