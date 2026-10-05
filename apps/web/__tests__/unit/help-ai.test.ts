import { describe, expect, it } from "vitest";
import { allFaqs } from "@lib/help/faq";
import { HELP_EVAL_SET } from "@lib/help/eval-set";
import { isConfident, searchFaqs } from "@lib/help/match";
import { faqCatalog, pickHelpFaqs, settleHelpPick } from "@lib/help/ai";

const ALL = allFaqs({ gmailOpen: true, socialOpen: true, aiOpen: true });

describe("도움말 목록", () => {
  it("id가 겹치지 않고, 닫힌 기능의 항목은 빠진다", () => {
    expect(new Set(ALL.map((f) => f.id)).size).toBe(ALL.length);
    const closed = allFaqs({ gmailOpen: false, socialOpen: false, aiOpen: false }).map((f) => f.id);
    for (const id of [
      "gmail-unverified",
      "gmail-stored",
      "gmail-annual-missing",
      "social-email-taken",
      "ai-what-is-sent",
    ]) {
      expect(closed).not.toContain(id);
    }
  });
});

describe("도움말 AI — 평가 세트", () => {
  it("정답 id는 모두 목록에 있고, 항목마다 질문이 하나 이상 있다", () => {
    const ids = new Set(ALL.map((f) => f.id));
    for (const item of HELP_EVAL_SET)
      for (const id of item.expect) expect(ids.has(id), `${item.q} → ${id}`).toBe(true);
    const covered = new Set(HELP_EVAL_SET.flatMap((item) => item.expect));
    for (const id of ids) expect(covered.has(id), id).toBe(true);
    expect(new Set(HELP_EVAL_SET.map((i) => i.q)).size).toBe(HELP_EVAL_SET.length);
  });

  it("기기 검색은 자신 있다고 할 때 틀리지 않는다 — 틀린 FAQ를 '가장 비슷한 질문'으로 내밀지 않게", () => {
    // 검색이 자신 있게 내놓은 첫 답은 정답이어야 한다. 자신 없으면 AI에게 넘기므로 괜찮다.
    const wrong = HELP_EVAL_SET.filter((item) => {
      const hits = searchFaqs(item.q, ALL);
      return isConfident(hits) && !item.expect.includes(hits[0].faq.id);
    }).map((item) => `${item.q} → ${searchFaqs(item.q, ALL)[0].faq.id}`);
    expect(wrong).toEqual([]);
    // 자신 없을 때도 '비슷할 수 있는 질문'으로 보여 주므로, 답이 있는 질문의 3분의 2 이상은 맞는 항목이 맨 위에 와야 한다.
    const answerable = HELP_EVAL_SET.filter((item) => item.expect.length > 0);
    const topRight = answerable.filter((item) =>
      item.expect.includes(searchFaqs(item.q, ALL)[0]?.faq.id ?? ""),
    ).length;
    expect(topRight * 3).toBeGreaterThanOrEqual(answerable.length * 2);
  });
});

describe("도움말 AI — 고른 것 확인", () => {
  it("목록에 있는 id만, 2개까지 받고, 아니면 '없음'으로 본다", () => {
    expect(settleHelpPick("pickFaq", { ids: ["what-is"] }, ALL)).toEqual({
      ids: ["what-is"],
      rejected: false,
    });
    expect(settleHelpPick("pickFaq", { ids: ["what-is", "what-is"] }, ALL)).toEqual({
      ids: ["what-is"],
      rejected: false,
    });
    expect(settleHelpPick("noAnswer", {}, ALL)).toEqual({ ids: [], rejected: false });
    expect(settleHelpPick("pickFaq", { ids: ["admin-reset"] }, ALL).rejected).toBe(true);
    expect(settleHelpPick("pickFaq", { ids: ["a", "b", "c"] }, ALL).rejected).toBe(true);
    expect(settleHelpPick("pickFaq", { ids: [] }, ALL).rejected).toBe(true);
    expect(settleHelpPick(undefined, undefined, ALL).rejected).toBe(true);
  });

  it("AI에는 공개된 도움말과 질문만 보내고, 고른 id를 돌려받는다", async () => {
    let sent: {
      system: string;
      messages: unknown;
      tools: { name: string; input_schema: unknown }[];
    } | null = null;
    const fetcher = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          content: [{ type: "tool_use", name: "pickFaq", input: { ids: ["lose-records"] } }],
          usage: {},
        }),
      );
    }) as unknown as typeof fetch;
    const pick = await pickHelpFaqs(
      "폰 바꾸면 기록 날아가?",
      ALL,
      { provider: "anthropic", model: "m", apiKey: "k" },
      fetcher,
    );
    expect(pick.ids).toEqual(["lose-records"]);
    expect(sent!.system).toContain(faqCatalog(ALL));
    expect(sent!.messages).toEqual([{ role: "user", content: "폰 바꾸면 기록 날아가?" }]);
    expect(sent!.tools.map((t) => t.name)).toEqual(["pickFaq", "noAnswer"]);
  });
});
