import { NextResponse } from "next/server";
import { isAiAskOpen } from "@lib/privacy";
import { logError } from "@lib/log";
import {
  clientIp,
  hit,
  retryAfterSeconds,
  tooManyRequestsResponse,
  type RateLimitRule,
} from "@lib/rate-limit";
import { askProviderConfig, type AskProviderConfig } from "./provider";
import { MAX_ASK_QUESTION, isValidAskHistory, type AskTurn } from "./tools";

/**
 * AI에게 묻는 API(`/api/ask`·`/api/help-ask`)가 같이 쓰는 제한. 질문은 표·로그에 남기지 않는다.
 *
 * - 질문 길이를 자른다.
 * - IP마다 10분 10번·하루 50번. 메모리에 세므로 대량 공격은 Vercel 방화벽이 맡는다(lib/rate-limit). 기능마다 따로 센다.
 * - 같은 질문의 결과를 인스턴스 메모리에 하루 둔다 — AI를 덜 부르기 위해서다(한도, 동시에 몰릴 때 멈춤). 캐시에서 답한
 *   것은 횟수에 세지 않는다.
 *
 * 두 API의 흐름(열림 확인 → 캐시 → 횟수 → AI → 오류 응답)은 `aiAskConfig`·`answerWithAi`로 같이 쓴다 — 따로 두면
 * 한쪽에만 고친 순서(예: 캐시에서 답한 것을 횟수에 세는지)가 두 기능에서 다르게 동작한다.
 */
const PER_IP_SHORT: RateLimitRule = { limit: 10, windowMs: 10 * 60 * 1000 };
const PER_IP_DAY: RateLimitRule = { limit: 50, windowMs: 24 * 60 * 60 * 1000 };

export async function readQuestion(request: Request): Promise<string | NextResponse> {
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  return questionFrom(body);
}

/**
 * 리포트에 물어보기의 본문: 질문과 앞선 턴(`history`). 앞선 턴이 모양·개수·호출 중 하나라도 틀리면 버리고 질문만
 * 쓴다 — 꼬리 질문을 못 알아들을 뿐, 틀린 값을 AI에 넘기지는 않는다.
 */
export async function readAskRequest(
  request: Request,
): Promise<{ question: string; history: AskTurn[] } | NextResponse> {
  const body = (await request.json().catch(() => null)) as {
    question?: unknown;
    history?: unknown;
  } | null;
  const question = questionFrom(body);
  if (typeof question !== "string") return question;
  const history = isValidAskHistory(body?.history) ? body.history : [];
  return { question, history };
}

function questionFrom(body: { question?: unknown } | null): string | NextResponse {
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ error: "질문을 적어 주세요." }, { status: 400 });
  if (question.length > MAX_ASK_QUESTION) {
    return NextResponse.json(
      { error: `질문은 ${MAX_ASK_QUESTION}자까지 적을 수 있어요.` },
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
    return tooManyRequestsResponse(
      wait,
      "질문이 많아 잠시 쉬어 갈게요. 조금 뒤에 다시 물어봐 주세요.",
    );
  }
  hit(shortKey, PER_IP_SHORT);
  hit(dayKey, PER_IP_DAY);
  return null;
}

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

export interface AnswerCache<T> {
  get(question: string): T | undefined;
  set(question: string, value: T): void;
  clear(): void;
}

export function createAnswerCache<T>(): AnswerCache<T> {
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

/** 기능이 열렸고 모델·키가 있으면 그 설정, 아니면 503 응답. */
export function aiAskConfig(): AskProviderConfig | NextResponse {
  const config = askProviderConfig();
  if (!isAiAskOpen() || !config) {
    return NextResponse.json({ error: "아직 준비 중인 기능이에요." }, { status: 503 });
  }
  return config;
}

/**
 * 캐시에 있으면 그 값을, 없으면 횟수를 센 뒤 AI에 물어 `{ [field]: 값, cached }`로 답한다. AI가 실패하면 502로 알리고
 * 저장하지 않는다. 질문은 남기지 않고 회사 오류(한도·장애)인지만 본다.
 *
 * AI가 목록 밖의 것을 골라 확인에서 걸렀으면(`rejected`) 답은 하되 저장하지 않는다 — 모델이 한 번 틀린 것을 저장하면 같은
 * 질문을 한 모든 사람이 하루 동안 '답할 수 없는 질문'을 받는다.
 */
export async function answerWithAi<T>(options: {
  request: Request;
  /** 횟수를 따로 세는 이름이자 로그의 이름("ask" → api/ask). */
  scope: string;
  cache: AnswerCache<T>;
  cacheKey: string;
  field: string;
  pick: () => Promise<{ value: T; rejected: boolean }>;
}): Promise<NextResponse> {
  const { request, scope, cache, cacheKey, field, pick } = options;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return NextResponse.json({ [field]: cached, cached: true });

  const blocked = limitAiRequest(request, scope);
  if (blocked) return blocked;

  try {
    const { value, rejected } = await pick();
    if (!rejected) cache.set(cacheKey, value);
    return NextResponse.json({ [field]: value, cached: false });
  } catch (error) {
    logError(`api/${scope}`, error);
    return NextResponse.json(
      { error: "지금은 답할 수 없어요. 잠시 뒤에 다시 물어봐 주세요." },
      { status: 502 },
    );
  }
}
