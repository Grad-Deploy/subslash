/**
 * Claude Code·Codex가 PC에 남긴 기록(JSONL)에서 **질문을 보낸 시각**만 꺼낸다. 명령줄 도구(apps/usage-cli)와
 * 웹의 'PC 기록 읽기'(/pc-usage, 브라우저가 고른 폴더를 기기 안에서 읽음)가 같은 함수로 센다.
 *
 * 이 기록에는 대화 전체가 들어 있다. 여기서는 줄마다 시각·종류·요금제 칸만 보고, 질문·답·파일 내용은
 * 읽지도 돌려주지도 않는다 — 돌려주는 것은 숫자(시각)와 요금제 이름뿐이다.
 *
 * 두 형식 모두 공개 문서가 없는 내부 형식이라 버전마다 바뀔 수 있다. 모르는 줄은 건너뛰고, 아무것도
 * 알아보지 못하면 '안 썼다'가 아니라 '모른다'로 남긴다(`recognized`).
 */

/** 이 도구가 재는 구독(SubSlash 서비스 목록의 id). */
export type CliServiceId = "claude-pro" | "chatgpt-plus";

/** 기록 하나(세션 파일 하나)에서 꺼낸 것. */
export interface CliSessionUsage {
  /** 사람이 질문을 보낸 시각(epoch ms). */
  prompts: number[];
  /**
   * 구독 로그인으로 썼는지. true: 구독, false: API 키 등 구독이 아님, null: 기록만으로는 모름.
   * 구독이 아닌 사용은 구독을 얼마나 쓰는지와 상관이 없으므로 세지 않는다.
   */
  subscription: boolean | null;
  /** Codex가 적어 둔 ChatGPT 요금제(`go`, `plus`, `pro` 등). 모르면 null. */
  planType: string | null;
  /** 이 형식의 줄을 하나라도 알아봤는지. false면 형식이 바뀐 것일 수 있다. */
  recognized: boolean;
}

/** 기록 한 줄(JSON 객체). */
export type CliLogLine = Record<string, unknown>;

const isObject = (value: unknown): value is CliLogLine =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function timeOf(line: CliLogLine): number | null {
  if (typeof line.timestamp !== "string") return null;
  const ms = Date.parse(line.timestamp);
  return Number.isFinite(ms) ? ms : null;
}

/** JSONL 한 줄을 읽는다. 깨진 줄은 null. */
export function parseCliLine(text: string): CliLogLine | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const value: unknown = JSON.parse(trimmed);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Claude Code 줄 하나가 사람이 보낸 질문인지.
 *
 * 새 버전은 `origin.kind`가 있다 — `human`만 질문이고, 작업 알림(`task-notification`)·자동 이어 하기는
 * 사람이 보낸 것이 아니다. 예전 버전은 `origin`이 없어서, 도구 결과(`toolUseResult`)·메타(`isMeta`)·
 * 하위 에이전트(`isSidechain`)가 아닌 사용자 줄을 질문으로 본다.
 */
export function isClaudePrompt(line: CliLogLine): boolean {
  if (line.type !== "user") return false;
  if (line.isSidechain === true || line.isMeta === true) return false;
  if ("toolUseResult" in line) return false;
  if (isObject(line.origin)) return line.origin.kind === "human";
  return true;
}

/** Claude Code 세션 파일 하나. 구독인지는 기록에 없어 null이다 — 지금 로그인 상태로 따로 본다. */
export function claudeCodeSession(lines: Iterable<CliLogLine>): CliSessionUsage {
  const prompts: number[] = [];
  let recognized = false;
  for (const line of lines) {
    if (typeof line.sessionId === "string" && typeof line.type === "string") recognized = true;
    if (!isClaudePrompt(line)) continue;
    const at = timeOf(line);
    if (at !== null) prompts.push(at);
  }
  return { prompts, subscription: null, planType: null, recognized };
}

/**
 * Codex 세션 파일(rollout-*.jsonl) 하나.
 *
 * 질문은 `event_msg` 중 `user_message`다. 구독인지는 `token_count`의 `rate_limits.plan_type`으로 본다 —
 * ChatGPT로 로그인하면 요금제 이름이 적힌다. 한도 정보 없이 토큰 수만 있으면 구독이 아닌 것(API 키)으로,
 * `token_count`가 아예 없으면(바로 끊긴 세션) 모른다로 둔다.
 */
export function codexSession(lines: Iterable<CliLogLine>): CliSessionUsage {
  const prompts: number[] = [];
  let recognized = false;
  let planType: string | null = null;
  let sawTokenCount = false;
  for (const line of lines) {
    const payload = line.payload;
    if (!isObject(payload)) continue;
    if (line.type === "session_meta") recognized = true;
    if (line.type !== "event_msg") continue;
    recognized = true;
    if (payload.type === "user_message") {
      const at = timeOf(line);
      if (at !== null) prompts.push(at);
    } else if (payload.type === "token_count") {
      sawTokenCount = true;
      const limits = payload.rate_limits;
      if (isObject(limits) && typeof limits.plan_type === "string" && limits.plan_type) {
        planType = limits.plan_type;
      }
    }
  }
  const subscription = planType !== null ? true : sawTokenCount ? false : null;
  return { prompts, subscription, planType, recognized };
}

/** 한 서비스의 최근 기간 요약. */
export interface CliUsageSummary {
  /** 질문을 보낸 날(이 PC의 날짜 기준) 수. */
  days: number;
  /** 질문 수. */
  prompts: number;
  /** 마지막 질문 시각(epoch ms). 없으면 null. */
  lastAt: number | null;
  /** 이 기간에 기록이 남은 Codex 요금제(가장 최근 것). */
  planType: string | null;
  /** 구독인지 몰라 세지 않은 세션 수. */
  unknownSessions: number;
  /** 구독이 아니라(API 키 등) 세지 않은 세션 수. */
  excludedSessions: number;
}

/** 이 PC의 날짜(YYYY-MM-DD). 테스트는 시간대를 주입한다. */
export type CliDayKey = (ms: number) => string;

export const cliDayKey: CliDayKey = (ms) => {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * 세션들을 최근 `windowDays`일로 요약한다. `subscriptionDefault`는 기록에 구독 여부가 없는 세션에 쓸 값이다
 * (Claude Code는 지금 로그인 상태, Codex는 지금 인증 방식). 그것도 모르면(null) 그 세션은 세지 않는다.
 */
export function summarizeCliUsage(
  sessions: CliSessionUsage[],
  options: {
    now: number;
    windowDays: number;
    subscriptionDefault: boolean | null;
    dayKey?: CliDayKey;
  },
): CliUsageSummary {
  const dayKey = options.dayKey ?? cliDayKey;
  const since = options.now - options.windowDays * 24 * 60 * 60 * 1000;
  const days = new Set<string>();
  let prompts = 0;
  let lastAt: number | null = null;
  let planType: string | null = null;
  let planAt = -Infinity;
  let unknownSessions = 0;
  let excludedSessions = 0;

  for (const session of sessions) {
    const inWindow = session.prompts.filter((at) => at >= since && at <= options.now);
    if (inWindow.length === 0) continue;
    const subscription = session.subscription ?? options.subscriptionDefault;
    if (subscription === null) {
      unknownSessions += 1;
      continue;
    }
    if (!subscription) {
      excludedSessions += 1;
      continue;
    }
    for (const at of inWindow) {
      days.add(dayKey(at));
      prompts += 1;
      if (lastAt === null || at > lastAt) lastAt = at;
    }
    const latest = Math.max(...inWindow);
    if (session.planType && latest > planAt) {
      planType = session.planType;
      planAt = latest;
    }
  }

  return { days: days.size, prompts, lastAt, planType, unknownSessions, excludedSessions };
}

/**
 * SubSlash로 넘길 링크. 값은 `#` 뒤에만 싣는다 — `?`에 실으면 SubSlash 서버 접속 기록에 남는다.
 * 쓴 날이 0인 서비스는 싣지 않는다: PC에서 안 쓴 것이지 구독을 안 쓴 것은 아니다(웹·앱에서 썼을 수 있다).
 */
export function pcUsageLink(
  origin: string,
  counts: Partial<Record<CliServiceId, number>>,
  options: { windowDays: number; until: string },
): string | null {
  const parts = (Object.entries(counts) as [CliServiceId, number][])
    .filter(([, days]) => days > 0)
    .map(([id, days]) => `${id}:${days}`);
  if (parts.length === 0) return null;
  const hash = new URLSearchParams({
    pc: parts.join(","),
    window: String(options.windowDays),
    until: options.until,
  });
  return `${origin.replace(/\/$/, "")}/pc-usage#${hash.toString()}`;
}
