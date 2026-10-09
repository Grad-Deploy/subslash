import type { CliLogLine, CliSessionUsage, CliTokenRecord } from "./types";
import { count, isObject, timeOf } from "./values";

/**
 * Claude Code 세션 기록(`~/.claude/projects/<프로젝트>/<세션>.jsonl`).
 */

/**
 * 줄 하나가 사람이 보낸 질문인지.
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

/** 세션 파일 하나. 구독인지는 기록에 없어 null이다 — 지금 로그인 상태로 따로 본다. */
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

/** 응답 줄의 토큰. 캐시 쓰기는 5분·1시간 요금이 달라 나눠 둔다(나눈 칸이 없으면 5분으로 본다). */
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
  return {
    at,
    id: typeof message.id === "string" ? message.id : null,
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
