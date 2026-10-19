import { NextRequest, NextResponse } from "next/server";
import { isGmailAutoImportOpen, isSocialLoginOpen } from "@lib/privacy";
import { aiAskConfig, answerWithAi, createAnswerCache, readQuestion } from "@lib/ask/guard";
import { allFaqs } from "@lib/help/faq";
import { pickHelpFaqs } from "@lib/help/ai";
import { isPromptAttack } from "@lib/ask/attack";

/**
 * 도움말 AI: 질문 문장을 받아 답이 되는 도움말 항목의 id(0~2개)를 돌려준다. 답 문장은 화면이 그 항목에서 그대로 꺼낸다.
 * FAQ 목록은 서버가 지금 열린 기능 기준으로 만든다 — 닫힌 기능의 항목을 고르지 않게.
 */
const cache = createAnswerCache<string[]>();

/** 테스트용. */
export function resetHelpAskCache(): void {
  cache.clear();
}

export async function POST(request: NextRequest) {
  const config = aiAskConfig();
  if (config instanceof NextResponse) return config;
  const question = await readQuestion(request);
  if (typeof question !== "string") return question;
  // 공격 문구는 AI를 부르지 않고 고른 항목 없이 답한다(화면은 문의하기로 보낸다). 횟수에도 세지 않는다.
  if (isPromptAttack(question)) return NextResponse.json({ ids: [], cached: false });

  return answerWithAi({
    request,
    scope: "help-ask",
    cache,
    cacheKey: question,
    field: "ids",
    pick: async () => {
      const faqs = allFaqs({
        gmailOpen: isGmailAutoImportOpen(),
        socialOpen: isSocialLoginOpen(),
        aiOpen: true,
      });
      const { ids, rejected } = await pickHelpFaqs(question, faqs, config);
      return { value: ids, rejected };
    },
  });
}
