import { NextRequest, NextResponse } from "next/server";
import { isAskReportOpen } from "@lib/privacy";
import { askProviderConfig, pickAskCall } from "@lib/ask/provider";
import type { AskCall } from "@lib/ask/tools";
import { clientIp, hit, retryAfterSeconds, type RateLimitRule } from "@lib/rate-limit";
import { logError } from "@lib/log";

/**
 * '리포트에 물어보기': 질문 문장을 받아 AI가 고른 도구 호출을 돌려준다. 계산은 기기가 한다(lib/ask/answer).
 *
 * - 로그인 없이 된다. 기록이 기기에 있고, 여기로 오는 것은 질문 문장뿐이다.
 * - 질문은 표·로그에 남기지 않는다(사용자가 개인정보를 적을 수 있다). 같은 질문의 답은 이 인스턴스 메모리에만 잠깐
 *   둔다 — AI를 덜 부르기 위해서다(무료·소액 한도, 동시에 몰릴 때 멈춤).
 * - IP마다 횟수를 제한한다. 메모리에 세므로 대량 공격은 Vercel 방화벽이 맡는다(lib/rate-limit).
 */

const PER_IP_SHORT: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };
const PER_IP_DAY: RateLimitRule = { limit: 50, windowMs: 24 * 60 * 60 * 1000 };
const MAX_QUESTION = 200;

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { call: AskCall; at: number }>();

const cacheKey = (question: string) => question.toLowerCase().replace(/\s+/g, " ").trim();

/** 테스트용. */
export function resetAskCache(): void {
  cache.clear();
}

export async function POST(request: NextRequest) {
  const config = askProviderConfig();
  if (!isAskReportOpen() || !config) {
    return NextResponse.json({ error: "아직 준비 중인 기능이에요." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 적어 주세요." }, { status: 400 });
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `질문은 ${MAX_QUESTION}자까지 적을 수 있어요.` },
      { status: 400 },
    );
  }

  const key = cacheKey(question);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({ call: cached.call, cached: true });
  }

  const ip = clientIp(request.headers);
  const shortKey = `ask:ip:${ip}`;
  const dayKey = `ask:ip-day:${ip}`;
  const wait = Math.max(
    retryAfterSeconds(shortKey, PER_IP_SHORT),
    retryAfterSeconds(dayKey, PER_IP_DAY),
  );
  if (wait > 0) {
    return NextResponse.json(
      { error: "질문이 많아 잠시 쉬어 갈게요. 조금 뒤에 다시 물어봐 주세요." },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }
  hit(shortKey, PER_IP_SHORT);
  hit(dayKey, PER_IP_DAY);

  try {
    const { call } = await pickAskCall(question, config);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
    cache.set(key, { call, at: Date.now() });
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
