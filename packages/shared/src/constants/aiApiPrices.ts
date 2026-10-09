/**
 * AI 코딩 도구가 쓴 토큰을 **API로 냈다면 얼마였는지**로 환산할 때 쓰는 요금(USD, 100만 토큰당).
 *
 * 구독 요금이 아니라 같은 모델을 API로 쓸 때의 요금표 가격이다(세금 제외). 확인한 모델만 적는다 — 표에 없는
 * 모델의 토큰은 0원으로 치지 않고 '요금을 모름'으로 따로 센다. 요금이 바뀌면 여기를 고치고 확인일을 바꾼다.
 *
 * - Claude: Anthropic Claude API 모델표(2026-10-06 기준). 캐시 쓰기는 입력의 1.25배(5분)·2배(1시간), 캐시 읽기는
 *   모델마다 다르다(Opus 5.5·Sonnet 5.5 $0.20, Fable 5.1 $0.25, Fable 5 $1, 그 밖에는 입력의 0.1배).
 * - OpenAI: developers.openai.com/api/docs/pricing(2026-10-09 확인). 요청 입력이 272K 토큰을 넘으면 장문 요금.
 */
export interface ApiPrice {
  input: number;
  output: number;
  cacheRead: number;
  /** 캐시 쓰기(5분). 캐시 쓰기 요금이 따로 없는 곳(OpenAI)은 입력과 같다. */
  cacheWrite5m: number;
  /** 캐시 쓰기(1시간). */
  cacheWrite1h: number;
  /** 요청 입력이 이 토큰 수를 넘으면 요청 전체에 이 요금을 쓴다. */
  longContext?: { threshold: number; input: number; cacheRead: number; output: number };
}

const claude = (input: number, output: number, cacheRead: number): ApiPrice => ({
  input,
  output,
  cacheRead,
  cacheWrite5m: input * 1.25,
  cacheWrite1h: input * 2,
});

export const API_PRICES_CHECKED_ON = "2026-10-09";

export const API_PRICES: Readonly<Record<string, ApiPrice>> = {
  "claude-fable-5-1": claude(10, 50, 0.25),
  "claude-fable-5": claude(10, 50, 1),
  "claude-opus-5-5": claude(4, 20, 0.2),
  "claude-opus-5": claude(5, 25, 0.5),
  "claude-opus-4-8": claude(5, 25, 0.5),
  "claude-opus-4-7": claude(5, 25, 0.5),
  "claude-opus-4-6": claude(5, 25, 0.5),
  "claude-sonnet-5-5": claude(2, 10, 0.2),
  "claude-sonnet-5": claude(2, 10, 0.2),
  "claude-sonnet-4-6": claude(3, 15, 0.3),
  "claude-haiku-4-5": claude(1, 5, 0.1),
  "gpt-5.5": {
    input: 5,
    output: 30,
    cacheRead: 0.5,
    cacheWrite5m: 5,
    cacheWrite1h: 5,
    longContext: { threshold: 272_000, input: 10, cacheRead: 1, output: 45 },
  },
};

/** 한 요청(응답 하나)이 쓴 토큰. 캐시 읽기·쓰기는 입력과 따로 센다. */
export interface ApiTokenUsage {
  model: string;
  /** 캐시를 거치지 않은 입력. */
  input: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
  /** 출력(추론 토큰 포함). */
  output: number;
}

/** 이 요청을 API로 냈다면 든 금액(USD). 요금을 모르는 모델이면 null. */
export function apiCostUsd(usage: ApiTokenUsage): number | null {
  const price = API_PRICES[usage.model];
  if (!price) return null;
  const promptTokens = usage.input + usage.cacheWrite5m + usage.cacheWrite1h + usage.cacheRead;
  const long = price.longContext && promptTokens > price.longContext.threshold;
  const input = long ? price.longContext!.input : price.input;
  const cacheRead = long ? price.longContext!.cacheRead : price.cacheRead;
  const output = long ? price.longContext!.output : price.output;
  // OpenAI는 캐시 쓰기 요금이 따로 없어 입력 요금과 같다. 장문이면 그 입력 요금을 따른다.
  const write5m = long ? input : price.cacheWrite5m;
  const write1h = long ? input : price.cacheWrite1h;
  return (
    (usage.input * input +
      usage.cacheWrite5m * write5m +
      usage.cacheWrite1h * write1h +
      usage.cacheRead * cacheRead +
      usage.output * output) /
    1_000_000
  );
}
