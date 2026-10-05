import { NextRequest, NextResponse } from "next/server";
import { isAiAskOpen, isGmailAutoImportOpen, isSocialLoginOpen } from "@lib/privacy";
import { askProviderConfig } from "@lib/ask/provider";
import { createAnswerCache, limitAiRequest, readQuestion } from "@lib/ask/guard";
import { allFaqs } from "@lib/help/faq";
import { pickHelpFaqs } from "@lib/help/ai";
import { logError } from "@lib/log";

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
  const config = askProviderConfig();
  if (!isAiAskOpen() || !config) {
    return NextResponse.json({ error: "아직 준비 중인 기능이에요." }, { status: 503 });
  }
  const question = await readQuestion(request);
  if (typeof question !== "string") return question;

  const cached = cache.get(question);
  if (cached) return NextResponse.json({ ids: cached, cached: true });

  const blocked = limitAiRequest(request, "help-ask");
  if (blocked) return blocked;

  try {
    const faqs = allFaqs({
      gmailOpen: isGmailAutoImportOpen(),
      socialOpen: isSocialLoginOpen(),
      aiOpen: true,
    });
    const { ids } = await pickHelpFaqs(question, faqs, config);
    cache.set(question, ids);
    return NextResponse.json({ ids, cached: false });
  } catch (error) {
    logError("api/help-ask", error);
    return NextResponse.json(
      { error: "지금은 답할 수 없어요. 잠시 뒤에 다시 물어봐 주세요." },
      { status: 502 },
    );
  }
}
