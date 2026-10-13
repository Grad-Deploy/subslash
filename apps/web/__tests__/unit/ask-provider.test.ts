import { describe, expect, it, vi } from "vitest";
import {
  askProviderConfig,
  askUserMessage,
  pickAskCall,
  pickTool,
  settleCall,
  toolParameters,
} from "@lib/ask/provider";

function fakeFetch(body: unknown, status = 200) {
  return vi.fn(
    async () => new Response(JSON.stringify(body), { status }),
  ) as unknown as typeof fetch & {
    mock: { calls: [string, RequestInit][] };
  };
}

const ANTHROPIC = { provider: "anthropic" as const, model: "test-model", apiKey: "k" };
const GEMINI = { provider: "gemini" as const, model: "test-model", apiKey: "k" };

describe("리포트에 물어보기 — AI 호출", () => {
  it("모델·키가 다 있어야 켜진다 — 모델 ID를 지어 채우지 않는다", () => {
    expect(askProviderConfig({})).toBeNull();
    expect(askProviderConfig({ ASK_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k" })).toBeNull();
    expect(askProviderConfig({ ASK_PROVIDER: "anthropic", ASK_MODEL: "m" })).toBeNull();
    expect(
      askProviderConfig({ ASK_PROVIDER: "gemini", ASK_MODEL: "m", ANTHROPIC_API_KEY: "k" }),
    ).toBeNull();
    expect(
      askProviderConfig({ ASK_PROVIDER: "anthropic", ASK_MODEL: "m", ANTHROPIC_API_KEY: "k" }),
    ).toEqual({
      provider: "anthropic",
      model: "m",
      apiKey: "k",
    });
  });

  it("앞선 턴이 없으면 질문 그대로, 있으면 앞선 질문과 고른 호출을 위에 적는다", () => {
    expect(askUserMessage("한 달에 얼마?")).toBe("한 달에 얼마?");
    const message = askUserMessage("넷플릭스는?", [
      { question: "티빙 결제일", call: { tool: "serviceDetail", args: { service: "티빙" } } },
      { question: "안 쓰는 구독", call: { tool: "lowUsage" } },
    ]);
    expect(message).toBe(
      [
        "앞선 질문(꼬리 질문을 알아듣는 데만 쓴다):",
        '1. "티빙 결제일" → serviceDetail {"service":"티빙"}',
        '2. "안 쓰는 구독" → lowUsage',
        "",
        "지금 질문: 넷플릭스는?",
      ].join("\n"),
    );
  });

  it("도구 인자를 정해진 값만 받는 스키마로 보낸다", () => {
    expect(toolParameters("spendByCategory")).toMatchObject({
      required: ["category"],
      properties: {
        category: { type: "string", enum: ["ott", "music", "cloud", "shopping", "ai", "other"] },
      },
    });
    expect(toolParameters("upcomingCharges")).toMatchObject({
      properties: { days: { type: "integer", minimum: 1, maximum: 31 } },
    });
    expect(toolParameters("lowUsage")).toEqual({ type: "object", properties: {} });
  });

  it("AI가 목록 밖 도구나 값을 돌려주면 unsupported로 바꾼다", () => {
    expect(settleCall("spendTotal", { period: "month" })).toEqual({
      call: { tool: "spendTotal", args: { period: "month" } },
      rejected: false,
    });
    expect(settleCall("lowUsage", {})).toEqual({ call: { tool: "lowUsage" }, rejected: false });
    expect(settleCall("deleteAll", {})).toEqual({ call: { tool: "unsupported" }, rejected: true });
    expect(settleCall("spendTotal", { period: "week" }).rejected).toBe(true);
    expect(settleCall(undefined, undefined).rejected).toBe(true);
  });

  it("Anthropic: 질문만 보내고 도구 호출만 받는다", async () => {
    const fetcher = fakeFetch({
      content: [{ type: "tool_use", name: "costPerUseRank", input: { order: "worst", limit: 3 } }],
      usage: { input_tokens: 900, output_tokens: 40 },
    });
    const pick = await pickAskCall("돈 값 못하는 구독 3개만", ANTHROPIC, fetcher);
    expect(pick).toEqual({
      call: { tool: "costPerUseRank", args: { order: "worst", limit: 3 } },
      rejected: false,
      usage: { inputTokens: 900, outputTokens: 40 },
    });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    const sent = JSON.parse(String(init.body));
    // 강제(any)는 최신 모델이 400으로 거절한다 — 고르게 하는 것은 시스템 프롬프트가 맡는다
    expect(sent.tool_choice).toEqual({ type: "auto" });
    expect(sent.messages).toEqual([{ role: "user", content: "돈 값 못하는 구독 3개만" }]);
    expect(sent.tools.map((t: { name: string }) => t.name)).toContain("unsupported");
  });

  it("출력 상한은 기본 200토큰이고, 늘리면 두 회사에 같은 값으로 보낸다", async () => {
    const anthropic = fakeFetch({ content: [], usage: {} });
    await pickTool("질문", "시스템", [], ANTHROPIC, anthropic);
    await pickTool("질문", "시스템", [], ANTHROPIC, anthropic, {
      maxTokens: 2000,
      timeoutMs: 60_000,
    });
    expect(JSON.parse(String(anthropic.mock.calls[0][1].body)).max_tokens).toBe(200);
    expect(JSON.parse(String(anthropic.mock.calls[1][1].body)).max_tokens).toBe(2000);
    // 기다리는 시간은 요청마다 끊는 신호로 건다
    expect(anthropic.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);

    const gemini = fakeFetch({ candidates: [] });
    await pickTool("질문", "시스템", [], GEMINI, gemini, { maxTokens: 2000 });
    const sent = JSON.parse(String(gemini.mock.calls[0][1].body));
    expect(sent.generationConfig.maxOutputTokens).toBe(2000);
  });

  it("Gemini: 함수 호출만 받게 하고 결과를 같은 모양으로 돌려준다", async () => {
    const fetcher = fakeFetch({
      candidates: [
        { content: { parts: [{ functionCall: { name: "upcomingCharges", args: { days: 7 } } }] } },
      ],
      usageMetadata: { promptTokenCount: 800, candidatesTokenCount: 20 },
    });
    const pick = await pickAskCall("이번 주에 빠져나갈 돈", GEMINI, fetcher);
    expect(pick.call).toEqual({ tool: "upcomingCharges", args: { days: 7 } });
    expect(pick.usage).toEqual({ inputTokens: 800, outputTokens: 20 });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain("/models/test-model:generateContent");
    const sent = JSON.parse(String(init.body));
    expect(sent.toolConfig).toEqual({ functionCallingConfig: { mode: "ANY" } });
    // 인자가 없는 도구에는 parameters를 두지 않는다(빈 object를 거절하는 경우가 있다).
    const low = sent.tools[0].functionDeclarations.find(
      (f: { name: string }) => f.name === "lowUsage",
    );
    expect(low.parameters).toBeUndefined();
  });

  it("글로만 답하면(도구 호출 없음) unsupported, 회사 오류는 던진다", async () => {
    const text = await pickAskCall(
      "q",
      ANTHROPIC,
      fakeFetch({ content: [{ type: "text", text: "68,400원이에요" }] }),
    );
    expect(text.call).toEqual({ tool: "unsupported" });
    expect(text.rejected).toBe(true);
    await expect(pickAskCall("q", ANTHROPIC, fakeFetch({}, 429))).rejects.toThrow("429");
  });
});
