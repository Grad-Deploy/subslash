import { describe, expect, it, vi } from "vitest";
import { askProviderConfig, pickAskCall, settleCall, toolParameters } from "@lib/ask/provider";

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
    expect(sent.tool_choice).toEqual({ type: "any" });
    expect(sent.messages).toEqual([{ role: "user", content: "돈 값 못하는 구독 3개만" }]);
    expect(sent.tools.map((t: { name: string }) => t.name)).toContain("unsupported");
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
