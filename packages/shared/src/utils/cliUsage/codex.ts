import type { CliLogLine, CliSessionUsage, CliTokenRecord } from "./types";
import { count, isObject, timeOf } from "./values";

/**
 * Codex 세션 기록(`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`) 하나.
 *
 * 질문은 `event_msg` 중 `user_message`다. 구독인지는 `token_count`의 `rate_limits.plan_type`으로 본다 —
 * ChatGPT로 로그인하면 요금제 이름이 적힌다. 한도 정보 없이 토큰 수만 있으면 구독이 아닌 것(API 키)으로,
 * `token_count`가 아예 없으면(바로 끊긴 세션) 모른다로 둔다.
 */
export function codexSession(lines: Iterable<CliLogLine>): CliSessionUsage {
  const prompts: number[] = [];
  const tokens: CliTokenRecord[] = [];
  let recognized = false;
  let planType: string | null = null;
  let sawTokenCount = false;
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
      continue;
    }
    if (payload.type !== "token_count") continue;
    sawTokenCount = true;
    const limits = payload.rate_limits;
    if (isObject(limits) && typeof limits.plan_type === "string" && limits.plan_type) {
      planType = limits.plan_type;
    }
    // 토큰은 세션 누적값으로 적힌다. 늘어난 만큼이 이번 요청이다(같은 값이 되풀이되면 0이라 세지 않는다).
    const info = payload.info;
    const total =
      isObject(info) && isObject(info.total_token_usage) ? info.total_token_usage : null;
    const at = timeOf(line);
    if (!total || at === null) continue;
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
  const subscription = planType !== null ? true : sawTokenCount ? false : null;
  return { prompts, subscription, planType, recognized, tokens };
}
