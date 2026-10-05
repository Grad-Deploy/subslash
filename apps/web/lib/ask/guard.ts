import { NextResponse } from "next/server";
import { clientIp, hit, retryAfterSeconds, type RateLimitRule } from "@lib/rate-limit";

/**
 * AI에게 묻는 API(`/api/ask`·`/api/help-ask`)가 같이 쓰는 제한. 질문은 표·로그에 남기지 않는다.
 *
 * - 질문 길이를 자른다.
 * - IP마다 10분 10번·하루 50번. 메모리에 세므로 대량 공격은 Vercel 방화벽이 맡는다(lib/rate-limit). 기능마다 따로 센다.
 * - 같은 질문의 결과를 인스턴스 메모리에 하루 둔다 — AI를 덜 부르기 위해서다(한도, 동시에 몰릴 때 멈춤). 캐시에서 답한
 *   것은 횟수에 세지 않는다.
 */
export const MAX_QUESTION = 200;
const PER_IP_SHORT: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };
const PER_IP_DAY: RateLimitRule = { limit: 50, windowMs: 24 * 60 * 60 * 1000 };

export async function readQuestion(request: Request): Promise<string | NextResponse> {
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 적어 주세요." }, { status: 400 });
  if (question.length > MAX_QUESTION) {
    return NextResponse.json(
      { error: `질문은 ${MAX_QUESTION}자까지 적을 수 있어요.` },
      { status: 400 },
    );
  }
  return question;
}

/** 막혔으면 429 응답, 아니면 한 번 세고 null. */
export function limitAiRequest(request: Request, scope: string): NextResponse | null {
  const ip = clientIp(request.headers);
  const shortKey = `${scope}:ip:${ip}`;
  const dayKey = `${scope}:ip-day:${ip}`;
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
  return null;
}

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

export function createAnswerCache<T>() {
  const store = new Map<string, { value: T; at: number }>();
  const key = (question: string) => question.toLowerCase().replace(/\s+/g, " ").trim();
  return {
    get(question: string): T | undefined {
      const entry = store.get(key(question));
      return entry && Date.now() - entry.at < CACHE_MS ? entry.value : undefined;
    },
    set(question: string, value: T) {
      if (store.size >= CACHE_MAX) store.delete(store.keys().next().value as string);
      store.set(key(question), { value, at: Date.now() });
    },
    clear() {
      store.clear();
    },
  };
}
