import { NextRequest, NextResponse } from "next/server";
import { isAiAskOpen } from "@lib/privacy";
import { askProviderConfig, pickAskCall } from "@lib/ask/provider";
import { createAnswerCache, limitAiRequest, readQuestion } from "@lib/ask/guard";
import type { AskCall } from "@lib/ask/tools";
import { logError } from "@lib/log";

/**
 * '리포트에 물어보기': 질문 문장을 받아 AI가 고른 도구 호출을 돌려준다. 계산은 기기가 한다(lib/ask/answer).
 * 로그인 없이 되고(기록은 기기에 있고 여기로는 질문 문장만 온다), 제한·캐시는 lib/ask/guard가 맡는다.
 */
const cache = createAnswerCache<AskCall>();

/** 테스트용. */
export function resetAskCache(): void {
  cache.clear();
}

export async function POST(request: NextRequest) {
  const config = askProviderConfig();
  if (!isAiAskOpen() || !config) {
    return NextResponse.json({ error: "아직 준비 중인 기능이에요." }, { status: 503 });
  }
  const question = await readQuestion(request);
  if (typeof question !== "string") return question;

  const cached = cache.get(question);
  if (cached) return NextResponse.json({ call: cached, cached: true });

  const blocked = limitAiRequest(request, "ask");
  if (blocked) return blocked;

  try {
    const { call } = await pickAskCall(question, config);
    cache.set(question, call);
    return NextResponse.json({ call, cached: false });
  } catch (error) {
    // 질문은 남기지 않는다. 회사 오류(한도·장애)인지만 본다.
    logError("api/ask", error);
    return NextResponse.json(
      { error: "지금은 답할 수 없어요. 잠시 뒤에 다시 물어봐 주세요." },
      { status: 502 },
    );
  }
}
