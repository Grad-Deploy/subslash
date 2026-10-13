import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAllRateLimits } from "@lib/rate-limit";
import { POST, resetAskCache } from "@/api/ask/route";

const ENV = {
  NEXT_PUBLIC_AI_ASK_TEST_OPEN: "true",
  ASK_PROVIDER: "anthropic",
  ASK_MODEL: "test-model",
  ANTHROPIC_API_KEY: "k",
};

function ask(question: unknown, ip = "1.2.3.4", history?: unknown) {
  return POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(history === undefined ? { question } : { question, history }),
    }) as never,
  );
}

/** AI에 보낸 사용자 메시지. */
function sentMessage(call: number): string {
  const init = upstream.mock.calls[call][1] as RequestInit;
  return JSON.parse(String(init.body)).messages[0].content;
}

const toolUse = (name: string, input: object = {}) =>
  new Response(JSON.stringify({ content: [{ type: "tool_use", name, input }], usage: {} }), {
    status: 200,
  });

let upstream: ReturnType<typeof vi.fn>;

beforeEach(() => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  upstream = vi.fn(async () => toolUse("lowUsage"));
  vi.stubGlobal("fetch", upstream);
  resetAllRateLimits();
  resetAskCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/ask", () => {
  it("열리지 않았거나 모델·키가 없으면 AI를 부르지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_ASK_TEST_OPEN", "");
    expect((await ask("안 쓰는 구독")).status).toBe(503);
    vi.stubEnv("NEXT_PUBLIC_AI_ASK_TEST_OPEN", "true");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect((await ask("안 쓰는 구독")).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("빈 질문·너무 긴 질문은 받지 않는다", async () => {
    expect((await ask("  ")).status).toBe(400);
    expect((await ask(42)).status).toBe(400);
    expect((await ask("가".repeat(201))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("고른 도구를 돌려주고, 같은 질문은 AI를 다시 부르지 않는다", async () => {
    const first = await ask("안 쓰는 구독 있어?");
    expect(await first.json()).toEqual({ call: { tool: "lowUsage" }, cached: false });
    const again = await ask("  안 쓰는   구독 있어? ");
    expect(await again.json()).toEqual({ call: { tool: "lowUsage" }, cached: true });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("목록 밖의 도구는 unsupported로 바꿔 돌려주고, 그 답은 저장하지 않는다", async () => {
    upstream.mockResolvedValueOnce(toolUse("deleteAllSubscriptions"));
    expect(await (await ask("다 지워")).json()).toEqual({
      call: { tool: "unsupported" },
      cached: false,
    });
    // 모델이 한 번 틀린 것을 하루 동안 모두에게 돌려주지 않는다 — 같은 질문은 AI에 다시 묻는다
    expect(await (await ask("다 지워")).json()).toEqual({
      call: { tool: "lowUsage" },
      cached: false,
    });
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it("한 IP가 10분에 10번을 넘게 물으면 쉬어 가게 한다", async () => {
    for (let i = 0; i < 10; i++) expect((await ask(`질문 ${i}`)).status).toBe(200);
    const blocked = await ask("질문 10");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    // 다른 사람은 막지 않는다.
    expect((await ask("질문 10", "5.6.7.8")).status).toBe(200);
  });

  it("AI 회사가 실패하면 502로 알리고 답을 저장하지 않는다", async () => {
    upstream.mockResolvedValueOnce(new Response("{}", { status: 529 }));
    expect((await ask("한 달에 얼마")).status).toBe(502);
    upstream.mockResolvedValueOnce(toolUse("spendTotal", { period: "month" }));
    expect(await (await ask("한 달에 얼마")).json()).toEqual({
      call: { tool: "spendTotal", args: { period: "month" } },
      cached: false,
    });
  });

  it("앞선 턴은 질문과 고른 호출만 AI에 함께 보내고, 꼬리 질문의 캐시는 앞선 턴마다 따로 둔다", async () => {
    upstream.mockResolvedValue(toolUse("spendTotal", { period: "year" }));
    const monthly = [
      { question: "한 달에 얼마?", call: { tool: "spendTotal", args: { period: "month" } } },
    ];
    expect((await ask("그럼 1년이면?", "1.2.3.4", monthly)).status).toBe(200);
    expect(sentMessage(0)).toContain('"한 달에 얼마?" → spendTotal {"period":"month"}');
    expect(sentMessage(0)).toContain("지금 질문: 그럼 1년이면?");

    // 같은 꼬리 질문이라도 앞선 턴이 다르면 다른 질문이다.
    const ott = [
      { question: "OTT에 얼마?", call: { tool: "spendByCategory", args: { category: "ott" } } },
    ];
    await ask("그럼 1년이면?", "1.2.3.4", ott);
    expect(upstream).toHaveBeenCalledTimes(2);
    await ask("그럼 1년이면?", "1.2.3.4", monthly);
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it("앞선 턴이 틀린 모양이거나 너무 많으면 버리고 지금 질문만 보낸다", async () => {
    const bad = [{ question: "x", call: { tool: "deleteAllSubscriptions" } }];
    expect((await ask("안 쓰는 구독", "1.2.3.4", bad)).status).toBe(200);
    expect(sentMessage(0)).toBe("안 쓰는 구독");
    const many = Array.from({ length: 4 }, (_, i) => ({
      question: `q${i}`,
      call: { tool: "lowUsage" },
    }));
    await ask("겹치는 구독", "1.2.3.4", many);
    expect(sentMessage(1)).toBe("겹치는 구독");
  });
});
