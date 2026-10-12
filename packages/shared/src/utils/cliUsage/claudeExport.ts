import type { CliSessionUsage } from "./types";
import { isObject } from "./values";

/**
 * claude.ai 대화 내보내기의 `conversations.json`(설정의 데이터 내보내기 → 안내 파일의 `conversations` 묶음).
 * 대화마다 `chat_messages`가 있고, 메시지마다 보낸 쪽(`sender`: `human`·`assistant`)과 보낸 시각(`created_at`, ISO)이
 * 있다. 2026년 10월에 받은 파일로 확인한 모양이다 — 공개 문서가 없는 형식이라 바뀔 수 있다.
 *
 * 웹·앱에서 나눈 대화라 PC 기록(Claude Code)에서 빠지는 사용을 채운다. 파일에는 대화 내용 전체가 있으므로
 * 사람이 보낸 메시지의 시각만 꺼내고 내용(`text`·`content`·`name`·`summary`·첨부)은 보지 않는다. 계정의 요금제는
 * 없어 구독인지는 사용자에게 묻는다(`subscription: null`). 내보낸 때까지의 대화만 들어 있다.
 */
export function claudeExportSession(data: unknown): CliSessionUsage {
  const prompts: number[] = [];
  let recognized = false;
  if (Array.isArray(data)) {
    for (const conversation of data) {
      if (!isObject(conversation) || !Array.isArray(conversation.chat_messages)) continue;
      recognized = true;
      for (const message of conversation.chat_messages) {
        if (!isObject(message) || message.sender !== "human") continue;
        if (typeof message.created_at !== "string") continue;
        const at = Date.parse(message.created_at);
        if (Number.isFinite(at)) prompts.push(at);
      }
    }
  }
  return { prompts, subscription: null, planType: null, recognized, tokens: [] };
}
