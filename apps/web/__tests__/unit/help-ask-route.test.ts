import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetAllRateLimits } from "@lib/rate-limit";
import { POST, resetHelpAskCache } from "@/api/help-ask/route";

function ask(question: unknown) {
  return POST(
    new Request("http://localhost/api/help-ask", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify({ question }),
    }) as never,
  );
}

const reply = (name: string, input: object) =>
  new Response(JSON.stringify({ content: [{ type: "tool_use", name, input }], usage: {} }), {
    status: 200,
  });

let upstream: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_AI_ASK_TEST_OPEN", "true");
  vi.stubEnv("ASK_PROVIDER", "anthropic");
  vi.stubEnv("ASK_MODEL", "m");
  vi.stubEnv("ANTHROPIC_API_KEY", "k");
  upstream = vi.fn(async () => reply("pickFaq", { ids: ["what-is"] }));
  vi.stubGlobal("fetch", upstream);
  resetAllRateLimits();
  resetHelpAskCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/help-ask", () => {
  it("닫혀 있으면 AI를 부르지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_AI_ASK_TEST_OPEN", "");
    expect((await ask("이 앱 뭐야")).status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("고른 도움말 id를 돌려주고, 같은 질문은 다시 부르지 않는다", async () => {
    expect(await (await ask("이 앱 뭐야")).json()).toEqual({ ids: ["what-is"], cached: false });
    expect(await (await ask("이 앱  뭐야")).json()).toEqual({ ids: ["what-is"], cached: true });
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("목록에 없는 id를 고르면 '없음'으로 돌려준다", async () => {
    upstream.mockResolvedValueOnce(reply("pickFaq", { ids: ["admin-reset"] }));
    expect(await (await ask("관리자 초기화")).json()).toEqual({ ids: [], cached: false });
  });

  it("리포트에 물어보기와 횟수를 따로 센다", async () => {
    for (let i = 0; i < 10; i++) expect((await ask(`질문 ${i}`)).status).toBe(200);
    expect((await ask("질문 10")).status).toBe(429);
  });
});
