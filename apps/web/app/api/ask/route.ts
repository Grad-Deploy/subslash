import { NextRequest, NextResponse } from "next/server";
import { localAskCall } from "@lib/ask/local";
import { koreaToday } from "@lib/korea-time";
import { pickAskCall } from "@lib/ask/provider";
import { aiAskConfig, answerWithAi, createAnswerCache, readAskRequest } from "@lib/ask/guard";
import type { AskCall, AskTurn } from "@lib/ask/tools";

/**
 * '리포트에 물어보기': 질문 문장(과 앞선 턴의 질문·호출)을 받아 AI가 고른 도구 호출을 돌려준다. 계산은 기기가 한다
 * (lib/ask/answer). 로그인 없이 되고(기록은 기기에 있고 여기로는 질문 문장만 온다), 제한·캐시는 lib/ask/guard가 맡는다.
 */
const cache = createAnswerCache<AskCall>();

/** 테스트용. */
export function resetAskCache(): void {
  cache.clear();
}

/** 캐시 열쇠. 꼬리 질문("그럼 1년이면?")은 앞선 턴에 따라 답이 달라 함께 넣는다. */
function cacheKey(question: string, history: readonly AskTurn[]): string {
  return history.length === 0 ? question : `${JSON.stringify(history)}\n${question}`;
}

export async function POST(request: NextRequest) {
  const config = aiAskConfig();
  if (config instanceof NextResponse) return config;
  const body = await readAskRequest(request);
  if (body instanceof NextResponse) return body;
  const { question, history } = body;

  // 뜻이 하나뿐인 흔한 질문은 기기와 같은 규칙으로 고르고 AI를 부르지 않는다. 새 앱은 이 질문을 보내지 않지만, 규칙이
  // 생기기 전에 설치한 앱은 모든 질문을 보낸다. AI를 부르지 않으므로 횟수에 세지 않는다.
  const local = localAskCall(question, {
    now: koreaToday(),
    hasHistory: history.length > 0,
    previous: history.at(-1)?.call,
  });
  if (local) return NextResponse.json({ call: local, cached: false });

  return answerWithAi({
    request,
    scope: "ask",
    cache,
    cacheKey: cacheKey(question, history),
    field: "call",
    pick: async () => {
      const { call, rejected } = await pickAskCall(question, config, fetch, history);
      return { value: call, rejected };
    },
  });
}
