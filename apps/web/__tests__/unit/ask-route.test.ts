import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAllRateLimits } from "@lib/rate-limit";
import { POST, resetAskCache } from "@/api/ask/route";

const ENV = {
  NEXT_PUBLIC_ASK_REPORT_TEST_OPEN: "true",
  ASK_PROVIDER: "anthropic",
  ASK_MODEL: "test-model",
  ANTHROPIC_API_KEY: "k",
};

function ask(question: unknown, ip = "1.2.3.4") {
  return POST(
    new Request("http://localhost/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ question }),
    }) as never,
  );
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
    vi.stubEnv("NEXT_PUBLIC_ASK_REPORT_TEST_OPEN", "");
    expect((await ask("안 쓰는 구독")).status).toBe(503);
    vi.stubEnv("NEXT_PUBLIC_ASK_REPORT_TEST_OPEN", "true");
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

  it("목록 밖의 도구는 unsupported로 바꿔 돌려준다", async () => {
    upstream.mockResolvedValueOnce(toolUse("deleteAllSubscriptions"));
    expect(await (await ask("다 지워")).json()).toEqual({
      call: { tool: "unsupported" },
      cached: false,
    });
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
});
