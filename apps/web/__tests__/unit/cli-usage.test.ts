import { describe, expect, it } from "vitest";
import {
  apiCostUsd,
  claudeCodeSession,
  codexSession,
  isClaudePrompt,
  parseCliLine,
  pcUsageLink,
  slimCliLine,
  summarizeCliUsage,
  type CliDayKey,
  type CliTokenRecord,
} from "@subslash/shared";

const NOW = Date.parse("2026-10-09T12:00:00+09:00");
const at = (iso: string) => Date.parse(iso);
/** 한국 시간 날짜. 테스트가 돌아가는 PC의 시간대와 상관없게 한다. */
const kstDay: CliDayKey = (ms) => new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

describe("Claude Code 기록", () => {
  const human = (timestamp: string) => ({
    type: "user",
    sessionId: "s",
    timestamp,
    origin: { kind: "human" },
    message: { content: "비밀 질문" },
  });

  it("사람이 보낸 질문만 센다 — 도구 결과·작업 알림·메타·하위 에이전트는 빼고", () => {
    const lines = [
      human("2026-10-08T10:00:00+09:00"),
      { type: "user", sessionId: "s", timestamp: "2026-10-08T10:01:00+09:00", toolUseResult: {} },
      {
        type: "user",
        sessionId: "s",
        timestamp: "2026-10-08T10:02:00+09:00",
        origin: { kind: "task-notification" },
      },
      { type: "user", sessionId: "s", timestamp: "2026-10-08T10:03:00+09:00", isMeta: true },
      { type: "user", sessionId: "s", timestamp: "2026-10-08T10:04:00+09:00", isSidechain: true },
      { type: "assistant", sessionId: "s", timestamp: "2026-10-08T10:05:00+09:00" },
      human("2026-10-08T11:00:00+09:00"),
    ];
    const session = claudeCodeSession(lines);
    expect(session.prompts).toEqual([
      at("2026-10-08T10:00:00+09:00"),
      at("2026-10-08T11:00:00+09:00"),
    ]);
    expect(session.recognized).toBe(true);
    // 기록에는 어떤 계정으로 썼는지가 없다.
    expect(session.subscription).toBeNull();
  });

  it("origin이 없는 예전 기록은 도구 결과·메타가 아닌 사용자 줄을 질문으로 본다", () => {
    expect(isClaudePrompt({ type: "user", timestamp: "2026-10-01T00:00:00Z" })).toBe(true);
    expect(isClaudePrompt({ type: "user", toolUseResult: "x" })).toBe(false);
  });

  it("질문 내용은 결과에 담지 않는다", () => {
    const session = claudeCodeSession([human("2026-10-08T10:00:00+09:00")]);
    expect(JSON.stringify(session)).not.toContain("비밀 질문");
  });

  it("알아볼 수 없는 형식이면 '모른다'로 표시한다", () => {
    expect(claudeCodeSession([{ foo: 1 }]).recognized).toBe(false);
  });
});

describe("Codex 기록", () => {
  const userMessage = (timestamp: string) => ({
    timestamp,
    type: "event_msg",
    payload: { type: "user_message", message: "비밀 질문" },
  });
  const tokenCount = (planType: string | null) => ({
    timestamp: "2026-10-08T10:00:05+09:00",
    type: "event_msg",
    payload: {
      type: "token_count",
      info: { total_token_usage: { total_tokens: 10 } },
      rate_limits: planType === null ? null : { plan_type: planType, primary: { used_percent: 3 } },
    },
  });

  it("질문 시각과 ChatGPT 요금제를 꺼낸다", () => {
    const session = codexSession([
      { timestamp: "2026-10-08T10:00:00+09:00", type: "session_meta", payload: { id: "x" } },
      userMessage("2026-10-08T10:00:01+09:00"),
      tokenCount("go"),
      {
        timestamp: "2026-10-08T10:00:06+09:00",
        type: "response_item",
        payload: { type: "message" },
      },
    ]);
    expect(session.prompts).toEqual([at("2026-10-08T10:00:01+09:00")]);
    expect(session.planType).toBe("go");
    expect(session.subscription).toBe(true);
    expect(JSON.stringify(session)).not.toContain("비밀 질문");
  });

  it("한도 정보 없이 토큰만 있으면 구독이 아니고(API 키), 둘 다 없으면 모른다", () => {
    expect(codexSession([userMessage("2026-10-08T10:00:01Z"), tokenCount(null)]).subscription).toBe(
      false,
    );
    expect(codexSession([userMessage("2026-10-08T10:00:01Z")]).subscription).toBeNull();
  });
});

describe("요약", () => {
  const session = (
    prompts: string[],
    subscription: boolean | null,
    planType: string | null = null,
  ) => ({
    prompts: prompts.map(at),
    subscription,
    planType,
    recognized: true,
    tokens: [] as CliTokenRecord[],
  });

  it("최근 30일 안에서 질문한 날(이 PC의 날짜)을 센다", () => {
    const summary = summarizeCliUsage(
      [
        session(["2026-10-08T09:00:00+09:00", "2026-10-08T23:30:00+09:00"], true),
        session(["2026-10-09T00:10:00+09:00"], true),
        // 기간 밖
        session(["2026-09-01T09:00:00+09:00"], true),
      ],
      { now: NOW, windowDays: 30, subscriptionDefault: null, dayKey: kstDay },
    );
    expect(summary.days).toBe(2);
    expect(summary.prompts).toBe(3);
    expect(summary.lastAt).toBe(at("2026-10-09T00:10:00+09:00"));
  });

  it("구독이 아닌 세션과 구독인지 모르는 세션은 세지 않고 수만 알린다", () => {
    const summary = summarizeCliUsage(
      [
        session(["2026-10-08T09:00:00+09:00"], false),
        session(["2026-10-07T09:00:00+09:00"], null),
        session(["2026-10-06T09:00:00+09:00"], true),
      ],
      { now: NOW, windowDays: 30, subscriptionDefault: null, dayKey: kstDay },
    );
    expect(summary.days).toBe(1);
    expect(summary.excludedSessions).toBe(1);
    expect(summary.unknownSessions).toBe(1);
  });

  it("기록에 구독 여부가 없으면 지금 로그인 상태로 본다", () => {
    const sessions = [session(["2026-10-08T09:00:00+09:00"], null)];
    const base = { now: NOW, windowDays: 30, dayKey: kstDay };
    expect(summarizeCliUsage(sessions, { ...base, subscriptionDefault: true }).days).toBe(1);
    expect(summarizeCliUsage(sessions, { ...base, subscriptionDefault: false }).days).toBe(0);
  });

  it("요금제는 가장 최근 세션의 것을 보인다", () => {
    const summary = summarizeCliUsage(
      [
        session(["2026-10-01T09:00:00+09:00"], true, "plus"),
        session(["2026-10-08T09:00:00+09:00"], true, "go"),
      ],
      { now: NOW, windowDays: 30, subscriptionDefault: null, dayKey: kstDay },
    );
    expect(summary.planType).toBe("go");
  });
});

describe("체크인 링크", () => {
  it("쓴 날 수는 # 뒤에만 싣고, 0일인 서비스는 싣지 않는다", () => {
    const link = pcUsageLink(
      "https://www.subslash.me/",
      { "claude-pro": 12, "chatgpt-plus": 0 },
      { windowDays: 30, until: "2026-10-09" },
    )!;
    expect(link.startsWith("https://www.subslash.me/pc-usage#")).toBe(true);
    expect(link).not.toContain("?");
    const params = new URLSearchParams(link.split("#")[1]);
    expect(params.get("pc")).toBe("claude-pro:12");
    expect(params.get("window")).toBe("30");
    expect(params.get("until")).toBe("2026-10-09");
  });

  it("넘길 것이 없으면 링크를 만들지 않는다", () => {
    expect(
      pcUsageLink("https://www.subslash.me", { "claude-pro": 0 }, { windowDays: 30, until: "x" }),
    ).toBeNull();
  });
});

describe("줄 읽기", () => {
  it("깨진 줄은 건너뛴다", () => {
    expect(parseCliLine("{not json")).toBeNull();
    expect(parseCliLine("")).toBeNull();
    expect(parseCliLine('{"type":"user"}')).toEqual({ type: "user" });
  });
});

describe("API 요금 환산", () => {
  const assistant = (id: string, usage: object, model = "claude-opus-5-5") => ({
    type: "assistant",
    sessionId: "s",
    timestamp: "2026-10-08T10:00:00+09:00",
    message: { id, model, usage, content: [{ type: "text", text: "비밀 답" }] },
  });
  const usage = {
    input_tokens: 1_000_000,
    output_tokens: 1_000_000,
    cache_read_input_tokens: 1_000_000,
    cache_creation_input_tokens: 2_000_000,
    cache_creation: { ephemeral_5m_input_tokens: 1_000_000, ephemeral_1h_input_tokens: 1_000_000 },
  };

  it("모델 요금표로 입력·출력·캐시 읽기·캐시 쓰기(5분·1시간)를 따로 셈한다", () => {
    // Opus 5.5: 입력 $4, 출력 $20, 캐시 읽기 $0.20, 캐시 쓰기 5분 $5(1.25배)·1시간 $8(2배)
    const session = claudeCodeSession([assistant("m1", usage)]);
    expect(apiCostUsd(session.tokens[0])).toBeCloseTo(4 + 20 + 0.2 + 5 + 8);
  });

  it("한 응답이 여러 줄에 같은 사용량으로 적혀도 한 번만 센다", () => {
    const session = claudeCodeSession([assistant("m1", usage), assistant("m1", usage)]);
    expect(session.tokens).toHaveLength(1);
  });

  it("세션을 이어 해 다른 파일에 같은 응답이 다시 적혀도 한 번만 센다", () => {
    const a = { ...claudeCodeSession([assistant("m1", usage)]), subscription: true };
    const b = { ...claudeCodeSession([assistant("m1", usage)]), subscription: true };
    const prompts = [Date.parse("2026-10-08T09:59:00+09:00")];
    const summary = summarizeCliUsage(
      [
        { ...a, prompts },
        { ...b, prompts },
      ],
      {
        now: NOW,
        windowDays: 30,
        subscriptionDefault: null,
        dayKey: kstDay,
      },
    );
    expect(summary.api.pricedRequests).toBe(1);
    expect(summary.api.usd).toBeCloseTo(37.2);
  });

  it("요금을 모르는 모델과 빠른 모드는 0원으로 치지 않고 따로 센다", () => {
    const tokens = [
      ...claudeCodeSession([assistant("m1", usage, "claude-future-9")]).tokens,
      ...claudeCodeSession([assistant("m2", { ...usage, speed: "fast" })]).tokens,
    ];
    const summary = summarizeCliUsage(
      [
        {
          prompts: [Date.parse("2026-10-08T09:59:00+09:00")],
          subscription: true,
          planType: null,
          recognized: true,
          tokens,
        },
      ],
      { now: NOW, windowDays: 30, subscriptionDefault: null, dayKey: kstDay },
    );
    expect(summary.api).toEqual({
      usd: 0,
      pricedRequests: 0,
      unpricedRequests: 2,
      unpricedModels: ["claude-future-9", "claude-opus-5-5 (fast)"],
    });
  });

  it("구독이 아닌 세션(API 키)의 토큰은 환산하지 않는다 — 실제로 API 요금을 낸 것이다", () => {
    const session = { ...claudeCodeSession([assistant("m1", usage)]), subscription: false };
    const summary = summarizeCliUsage(
      [{ ...session, prompts: [Date.parse("2026-10-08T09:59:00+09:00")] }],
      { now: NOW, windowDays: 30, subscriptionDefault: null, dayKey: kstDay },
    );
    expect(summary.api.pricedRequests).toBe(0);
  });

  it("Codex는 누적 토큰의 늘어난 만큼을 요청으로 보고, 캐시 입력을 나눠 셈한다", () => {
    const tokenCount = (input: number, cached: number, output: number) => ({
      timestamp: "2026-10-08T10:00:00+09:00",
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          total_token_usage: {
            input_tokens: input,
            cached_input_tokens: cached,
            output_tokens: output,
          },
        },
        rate_limits: { plan_type: "plus" },
      },
    });
    const session = codexSession([
      {
        timestamp: "2026-10-08T09:59:00+09:00",
        type: "turn_context",
        payload: { model: "gpt-5.5" },
      },
      tokenCount(100_000, 60_000, 10_000),
      tokenCount(100_000, 60_000, 10_000), // 같은 값이 되풀이되면 세지 않는다
      tokenCount(200_000, 150_000, 20_000),
    ]);
    expect(session.tokens.map((t) => [t.input, t.cacheRead, t.output])).toEqual([
      [40_000, 60_000, 10_000],
      [10_000, 90_000, 10_000],
    ]);
    // gpt-5.5: 입력 $5, 캐시 입력 $0.50, 출력 $30
    expect(apiCostUsd(session.tokens[0])).toBeCloseTo(
      (40_000 * 5 + 60_000 * 0.5 + 10_000 * 30) / 1e6,
    );
  });

  it("gpt-5.5는 요청 입력이 272K를 넘으면 장문 요금을 쓴다", () => {
    const base = { model: "gpt-5.5", cacheWrite5m: 0, cacheWrite1h: 0, output: 1_000_000 };
    expect(apiCostUsd({ ...base, input: 100_000, cacheRead: 0 })).toBeCloseTo(0.5 + 30);
    expect(apiCostUsd({ ...base, input: 300_000, cacheRead: 0 })).toBeCloseTo(3 + 45);
  });

  it("남긴 줄에는 질문·답 내용이 없고, 남긴 줄로 셈해도 결과가 같다", () => {
    const lines = [assistant("m1", usage)];
    const slim = lines.map(slimCliLine);
    expect(JSON.stringify(slim)).not.toContain("비밀");
    expect(claudeCodeSession(slim).tokens).toEqual(claudeCodeSession(lines).tokens);
  });
});
