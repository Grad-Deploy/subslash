import { describe, expect, it } from "vitest";
import {
  checkInLink,
  claudeSession,
  codexSession,
  isClaudePrompt,
  parseLine,
  summarize,
  type DayKey,
} from "../src/parse.js";

const NOW = Date.parse("2026-10-09T12:00:00+09:00");
const at = (iso: string) => Date.parse(iso);
/** 한국 시간 날짜. 테스트가 돌아가는 PC의 시간대와 상관없게 한다. */
const kstDay: DayKey = (ms) => new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
    const session = claudeSession(lines);
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
    const session = claudeSession([human("2026-10-08T10:00:00+09:00")]);
    expect(JSON.stringify(session)).not.toContain("비밀 질문");
  });

  it("알아볼 수 없는 형식이면 '모른다'로 표시한다", () => {
    expect(claudeSession([{ foo: 1 }]).recognized).toBe(false);
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
  });

  it("최근 30일 안에서 질문한 날(이 PC의 날짜)을 센다", () => {
    const summary = summarize(
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
    const summary = summarize(
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
    expect(summarize(sessions, { ...base, subscriptionDefault: true }).days).toBe(1);
    expect(summarize(sessions, { ...base, subscriptionDefault: false }).days).toBe(0);
  });

  it("요금제는 가장 최근 세션의 것을 보인다", () => {
    const summary = summarize(
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
    const link = checkInLink(
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
      checkInLink("https://www.subslash.me", { "claude-pro": 0 }, { windowDays: 30, until: "x" }),
    ).toBeNull();
  });
});

describe("줄 읽기", () => {
  it("깨진 줄은 건너뛴다", () => {
    expect(parseLine("{not json")).toBeNull();
    expect(parseLine("")).toBeNull();
    expect(parseLine('{"type":"user"}')).toEqual({ type: "user" });
  });
});
