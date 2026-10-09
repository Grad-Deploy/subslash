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

import { apiCostUsd, type ApiTokenUsage } from "../constants/aiApiPrices";

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
  /** 응답(요청)마다 쓴 토큰. API로 냈다면 얼마였는지 환산하는 데 쓴다(constants/aiApiPrices). */
  tokens: CliTokenRecord[];
}

/** 응답 하나가 쓴 토큰과 그 시각. */
export interface CliTokenRecord extends ApiTokenUsage {
  at: number;
  /** 응답 id. 같은 응답이 여러 줄·여러 파일에 적혀도 한 번만 센다. 모르면 null. */
  id: string | null;
  /** 빠른 모드(요금이 다르다). 요금을 확인하지 못해 환산하지 않는다. */
  fast: boolean;
}

const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

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
  const tokens: CliTokenRecord[] = [];
  const seen = new Set<string>();
  let recognized = false;
  for (const line of lines) {
    if (typeof line.sessionId === "string" && typeof line.type === "string") recognized = true;
    if (line.type === "assistant") {
      const record = claudeTokens(line);
      // 응답 하나는 내용 조각마다 한 줄씩 같은 사용량을 되풀이해 적는다. 응답 id로 한 번만 센다.
      if (record && !(record.id && seen.has(record.id))) {
        if (record.id) seen.add(record.id);
        tokens.push(record);
      }
      continue;
    }
    if (!isClaudePrompt(line)) continue;
    const at = timeOf(line);
    if (at !== null) prompts.push(at);
  }
  return { prompts, subscription: null, planType: null, recognized, tokens };
}

/** Claude Code 응답 줄의 토큰. 캐시 쓰기는 5분·1시간 요금이 달라 나눠 둔다(나눈 칸이 없으면 5분으로 본다). */
function claudeTokens(line: CliLogLine): CliTokenRecord | null {
  const message = line.message;
  if (!isObject(message) || !isObject(message.usage)) return null;
  const model = message.model;
  if (typeof model !== "string" || model.startsWith("<")) return null;
  const at = timeOf(line);
  if (at === null) return null;
  const usage = message.usage;
  // 서버 쪽 단계(압축 등)가 돈 응답은 단계마다 토큰을 `iterations`에 나눠 적는다. 둘 이상이면 그 합이
  // 응답 전체다(하나뿐이면 위쪽 숫자와 같다).
  const parts =
    Array.isArray(usage.iterations) && usage.iterations.length > 1
      ? usage.iterations.filter(isObject)
      : [usage];
  const sum = (read: (part: CliLogLine) => number) =>
    parts.reduce((total, part) => total + read(part), 0);
  const id = typeof message.id === "string" ? message.id : null;
  return {
    at,
    id,
    model,
    fast: usage.speed === "fast",
    input: sum((part) => count(part.input_tokens)),
    cacheWrite5m: sum((part) => cacheWrites(part).write5m),
    cacheWrite1h: sum((part) => cacheWrites(part).write1h),
    cacheRead: sum((part) => count(part.cache_read_input_tokens)),
    output: sum((part) => count(part.output_tokens)),
  };
}

/** 캐시 쓰기를 5분·1시간으로 나눈다. 나눈 칸이 없으면 모두 5분으로 본다. */
function cacheWrites(part: CliLogLine): { write5m: number; write1h: number } {
  const split = isObject(part.cache_creation) ? part.cache_creation : null;
  if (!split) return { write5m: count(part.cache_creation_input_tokens), write1h: 0 };
  return {
    write5m: count(split.ephemeral_5m_input_tokens),
    write1h: count(split.ephemeral_1h_input_tokens),
  };
}

const USAGE_KEYS = [
  "input_tokens",
  "output_tokens",
  "cache_read_input_tokens",
  "cache_creation_input_tokens",
] as const;

function slimUsage(usage: CliLogLine): CliLogLine {
  const out: CliLogLine = { speed: usage.speed };
  for (const key of USAGE_KEYS) out[key] = usage[key];
  if (isObject(usage.cache_creation)) {
    out.cache_creation = {
      ephemeral_5m_input_tokens: usage.cache_creation.ephemeral_5m_input_tokens,
      ephemeral_1h_input_tokens: usage.cache_creation.ephemeral_1h_input_tokens,
    };
  }
  if (Array.isArray(usage.iterations)) {
    out.iterations = usage.iterations.filter(isObject).map(slimUsage);
  }
  return out;
}

/**
 * 셈에 쓰는 칸만 남긴 줄. 질문·답·파일 내용(`message.content`, 이벤트의 `message` 등)은 들고 있지 않는다 —
 * 웹이 큰 기록 파일을 읽으며 줄마다 바로 줄여 메모리에 내용을 쌓지 않는다. 여기서 남기는 칸과 위의 셈이 읽는
 * 칸이 같아야 하므로 한 파일에 둔다.
 */
export function slimCliLine(line: CliLogLine): CliLogLine {
  const out: CliLogLine = {};
  for (const key of ["type", "timestamp", "sessionId", "isSidechain", "isMeta"]) {
    if (key in line) out[key] = line[key];
  }
  if ("toolUseResult" in line) out.toolUseResult = true;
  if (isObject(line.origin)) out.origin = { kind: line.origin.kind };
  const message = line.message;
  if (isObject(message)) {
    out.message = {
      id: message.id,
      model: message.model,
      ...(isObject(message.usage) ? { usage: slimUsage(message.usage) } : {}),
    };
  }
  const payload = line.payload;
  if (isObject(payload)) {
    const limits = isObject(payload.rate_limits) ? payload.rate_limits : null;
    const info = isObject(payload.info) ? payload.info : null;
    const total = info && isObject(info.total_token_usage) ? info.total_token_usage : null;
    out.payload = {
      type: payload.type,
      model: payload.model,
      rate_limits: limits?.plan_type ? { plan_type: limits.plan_type } : null,
      ...(total
        ? {
            info: {
              total_token_usage: {
                input_tokens: total.input_tokens,
                cached_input_tokens: total.cached_input_tokens,
                output_tokens: total.output_tokens,
              },
            },
          }
        : {}),
    };
  }
  return out;
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
  const tokens: CliTokenRecord[] = [];
  let model: string | null = null;
  let previous = { input: 0, cached: 0, output: 0 };
  for (const line of lines) {
    const payload = line.payload;
    if (!isObject(payload)) continue;
    if (line.type === "session_meta") recognized = true;
    if (line.type === "turn_context" && typeof payload.model === "string") model = payload.model;
    if (line.type !== "event_msg") continue;
    recognized = true;
    if (payload.type === "user_message") {
      const at = timeOf(line);
      if (at !== null) prompts.push(at);
    } else if (payload.type === "token_count") {
      sawTokenCount = true;
      // 토큰은 세션 누적값으로 적힌다. 늘어난 만큼이 이번 요청이다(같은 값이 되풀이되면 0이라 세지 않는다).
      const info = payload.info;
      const total =
        isObject(info) && isObject(info.total_token_usage) ? info.total_token_usage : null;
      const at = timeOf(line);
      if (total && at !== null) {
        const now = {
          input: count(total.input_tokens),
          cached: count(total.cached_input_tokens),
          output: count(total.output_tokens),
        };
        const input = now.input - previous.input;
        const cached = now.cached - previous.cached;
        const output = now.output - previous.output;
        if (model && input >= 0 && cached >= 0 && output >= 0 && input + output > 0) {
          tokens.push({
            at,
            id: null,
            model,
            fast: false,
            // OpenAI는 캐시로 읽은 입력이 입력에 들어 있다. 요금이 달라 빼서 따로 센다.
            input: Math.max(0, input - cached),
            cacheWrite5m: 0,
            cacheWrite1h: 0,
            cacheRead: cached,
            output,
          });
        }
        previous = now;
      }
      const limits = payload.rate_limits;
      if (isObject(limits) && typeof limits.plan_type === "string" && limits.plan_type) {
        planType = limits.plan_type;
      }
    }
  }
  const subscription = planType !== null ? true : sawTokenCount ? false : null;
  return { prompts, subscription, planType, recognized, tokens };
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
  /** 이 기간에 구독으로 쓴 토큰을 API로 냈다면 든 금액. */
  api: CliApiValue;
}

export interface CliApiValue {
  /** 요금을 아는 요청의 합계(USD, 세금 제외). */
  usd: number;
  pricedRequests: number;
  /** 구독으로 쓴 토큰 수(입력·캐시 쓰기·캐시 읽기·출력 모두, 요금을 모르는 모델도 포함). */
  tokens: number;
  /** 요금을 모르는 모델·빠른 모드 요청 수. 0원으로 치지 않고 따로 알린다. */
  unpricedRequests: number;
  unpricedModels: string[];
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
  const api: CliApiValue = {
    usd: 0,
    pricedRequests: 0,
    tokens: 0,
    unpricedRequests: 0,
    unpricedModels: [],
  };
  const seenResponses = new Set<string>();

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
    for (const record of session.tokens) {
      if (record.at < since || record.at > options.now) continue;
      // 세션을 이어 하면 앞 세션의 응답이 새 파일에 다시 적힌다. 응답 id로 한 번만 센다.
      if (record.id) {
        if (seenResponses.has(record.id)) continue;
        seenResponses.add(record.id);
      }
      api.tokens +=
        record.input + record.cacheWrite5m + record.cacheWrite1h + record.cacheRead + record.output;
      const usd = record.fast ? null : apiCostUsd(record);
      if (usd === null) {
        api.unpricedRequests += 1;
        const label = record.fast ? record.model + " (fast)" : record.model;
        if (!api.unpricedModels.includes(label)) api.unpricedModels.push(label);
      } else {
        api.usd += usd;
        api.pricedRequests += 1;
      }
    }
    const latest = Math.max(...inWindow);
    if (session.planType && latest > planAt) {
      planType = session.planType;
      planAt = latest;
    }
  }

  return { days: days.size, prompts, lastAt, planType, unknownSessions, excludedSessions, api };
}

/**
 * SubSlash로 넘길 링크. 값은 `#` 뒤에만 싣는다 — `?`에 실으면 SubSlash 서버 접속 기록에 남는다.
 * 쓴 날이 0인 서비스는 싣지 않는다: PC에서 안 쓴 것이지 구독을 안 쓴 것은 아니다(웹·앱에서 썼을 수 있다).
 */
/** 링크에 서비스마다 싣는 값. */
export interface PcUsageLinkValue {
  days: number;
  /** API 환산 금액(USD). 모르면 null. */
  usd?: number | null;
  /** 구독으로 쓴 토큰 수. */
  tokens?: number;
}

export function pcUsageLink(
  origin: string,
  counts: Partial<Record<CliServiceId, number | PcUsageLinkValue>>,
  options: { windowDays: number; until: string },
): string | null {
  // `서비스:쓴 날[:API 환산 USD[:토큰 수]]`. 금액은 요금을 아는 요청이 있을 때만, 토큰은 0보다 클 때만 싣는다
  // (금액을 모르면 빈 칸: `서비스:쓴 날::토큰 수`).
  const parts = (Object.entries(counts) as [CliServiceId, number | PcUsageLinkValue][])
    .map(([id, value]) => [id, typeof value === "number" ? { days: value } : value] as const)
    .filter(([, value]) => value.days > 0)
    .map(([id, { days, usd, tokens }]) => {
      const amount = usd !== null && usd !== undefined && usd > 0 ? usd.toFixed(2) : "";
      const count = tokens && tokens > 0 ? String(Math.round(tokens)) : "";
      if (count) return `${id}:${days}:${amount}:${count}`;
      return amount ? `${id}:${days}:${amount}` : `${id}:${days}`;
    });
  if (parts.length === 0) return null;
  const hash = new URLSearchParams({
    pc: parts.join(","),
    window: String(options.windowDays),
    until: options.until,
  });
  return `${origin.replace(/\/$/, "")}/pc-usage#${hash.toString()}`;
}
