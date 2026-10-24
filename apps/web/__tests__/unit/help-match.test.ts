import { describe, expect, it } from "vitest";
import { allFaqs } from "@lib/help/faq";
import { isConfident, searchFaqs } from "@lib/help/match";

const faqs = allFaqs({} as Parameters<typeof allFaqs>[0]);

describe("도움말 검색(기기)", () => {
  it("'하려면' 같은 어미끼리 겹쳐 다른 질문을 앞세우지 않는다", () => {
    // "해지하려면 어떻게 해요"가 "탈퇴하려면 어떻게 하나요"를 맨 위에 두었다(운영 QA 2026-10-24).
    const hits = searchFaqs("해지하려면 어떻게 해요", faqs);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) expect(hit.faq.q).toContain("해지");
  });

  it("어미를 떼도 같은 낱말의 질문은 그대로 찾는다", () => {
    const hits = searchFaqs("탈퇴하려면 어떻게 하나요", faqs);
    expect(isConfident(hits)).toBe(true);
    expect(hits[0].faq.q).toContain("탈퇴");
  });
});
