import type { CliSessionUsage } from "./types";
import { plausibleTime } from "./values";

/*
 * Cursor·Antigravity는 JSONL이 아니라 SQLite에 적는다. 명령줄 도구(node:sqlite)와 웹(sql.js)이 같은 SQL로 **필요한
 * 칸만** 조회하고, 꺼낸 행을 아래 함수가 센다. Cursor의 파일(state.vscdb)에는 로그인 토큰도 들어 있지만 그 칸은
 * 조회하지 않는다. Antigravity의 요약 DB에는 대화 제목·미리보기가 있지만 시각과 깊이만 조회한다.
 */

/** Cursor 요금제 칸. `free`면 구독이 아니다. */
export const CURSOR_MEMBERSHIP_SQL =
  "select value from ItemTable where key = 'cursorAuth/stripeMembershipType'";

/**
 * Cursor 응답(bubble)의 종류와 요청 시각. 사람이 보낸 메시지(type 1)에는 시각이 없어, 응답(type 2)의 요청 시각
 * (`timingInfo.clientRpcSendTime`)을 질문한 때로 본다. json_extract로 그 칸만 꺼낸다 — 메시지 내용은 읽지 않는다.
 */
export const CURSOR_BUBBLES_SQL =
  "select json_extract(value, '$.type') as type, " +
  "json_extract(value, '$.timingInfo.clientRpcSendTime') as sentAt " +
  "from cursorDiskKV where key like 'bubbleId:%'";

/** Antigravity 대화마다 마지막으로 사람이 입력한 시각과 깊이(0이면 사람이 연 대화, 1 이상은 하위 에이전트). */
export const ANTIGRAVITY_CONVERSATIONS_SQL =
  "select last_user_input_time as lastInput, nesting_depth as depth from conversation_summaries";

/** 이 PC에서 확인한 값은 `free`뿐이다. 나머지는 Cursor 요금제 이름으로 알려진 것이고, 모르는 값은 null로 둔다. */
const CURSOR_FREE = ["free", "free_trial"];
const CURSOR_PAID = ["pro", "pro_plus", "ultra", "business", "team", "enterprise"];

/** Cursor 요금제 → 구독인지. 모르는 값이면 null(세지 않고 알린다). */
export function cursorMembershipIsSubscription(membership: unknown): boolean | null {
  if (typeof membership !== "string" || !membership) return null;
  const plan = membership.toLowerCase();
  if (CURSOR_FREE.includes(plan)) return false;
  if (CURSOR_PAID.includes(plan)) return true;
  return null;
}

/**
 * Cursor 기록 하나(state.vscdb). 응답 줄마다 질문 하나로 센다. 토큰 칸(`tokenCount`)은 로컬 기록에 0으로 남는
 * 일이 많아 믿지 않는다 — API 환산은 하지 않는다.
 */
export function cursorSession(input: {
  membership: unknown;
  bubbles: { type: unknown; sentAt: unknown }[];
}): CliSessionUsage {
  const prompts = input.bubbles
    .filter((bubble) => Number(bubble.type) === 2)
    .map((bubble) => plausibleTime(bubble.sentAt))
    .filter((at): at is number => at !== null);
  return {
    prompts,
    subscription: cursorMembershipIsSubscription(input.membership),
    planType: typeof input.membership === "string" ? input.membership : null,
    recognized: true,
    tokens: [],
  };
}

/** Antigravity의 시각('2026-09-16 05:47:46.7950697+00:00')을 epoch ms로. */
export function parseAntigravityTime(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const iso = value
    .trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1");
  return plausibleTime(Date.parse(iso));
}

/**
 * Antigravity 대화 요약(conversation_summaries.db). 사람이 연 대화(깊이 0)마다 마지막 입력 시각 하나만 남아 있어,
 * 여러 날에 걸친 대화도 하루로 잡힌다 — 쓴 날의 하한값이다. 어떤 계정으로 썼는지는 기록에 없다(묻는다).
 */
export function antigravitySessions(
  rows: { lastInput: unknown; depth: unknown }[],
): CliSessionUsage[] {
  return rows
    .filter((row) => Number(row.depth ?? 0) === 0)
    .map((row) => parseAntigravityTime(row.lastInput))
    .filter((at): at is number => at !== null)
    .map((at) => ({
      prompts: [at],
      subscription: null,
      planType: null,
      recognized: true,
      tokens: [],
    }));
}
