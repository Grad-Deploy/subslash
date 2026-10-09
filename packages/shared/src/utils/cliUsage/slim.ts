import type { CliLogLine } from "./types";
import { isObject } from "./values";

/**
 * 셈에 쓰는 칸만 남긴 줄. 질문·답·파일 내용(`message.content`, 이벤트의 `message` 등)은 들고 있지 않는다 —
 * 웹이 큰 기록 파일을 읽으며 줄마다 바로 줄여 메모리에 내용을 쌓지 않는다.
 *
 * 여기서 남기는 칸은 claudeCode.ts·codex.ts가 읽는 칸과 같아야 한다. 셈이 새 칸을 읽게 되면 여기도 남긴다
 * (테스트가 남긴 줄로 셈한 결과와 원래 줄로 셈한 결과를 견준다).
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
  if (isObject(payload)) out.payload = slimPayload(payload);
  return out;
}

const USAGE_KEYS = [
  "input_tokens",
  "output_tokens",
  "cache_read_input_tokens",
  "cache_creation_input_tokens",
] as const;

/** Claude Code 응답의 사용량. */
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

/** Codex 이벤트: 종류, 모델, 요금제, 누적 토큰. */
function slimPayload(payload: CliLogLine): CliLogLine {
  const limits = isObject(payload.rate_limits) ? payload.rate_limits : null;
  const info = isObject(payload.info) ? payload.info : null;
  const total = info && isObject(info.total_token_usage) ? info.total_token_usage : null;
  return {
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
