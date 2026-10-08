import { describe, expect, it } from "vitest";
import { allFaqs, faqGroups } from "@lib/help/faq";
import { isConfident, searchFaqs } from "@lib/help/match";

const ALL_OPEN = { gmailOpen: true, socialOpen: true, aiOpen: true };

describe("도움말 FAQ 영어", () => {
  it("한국어와 id·순서·그룹이 같고 영어에 한글이 섞이지 않는다", () => {
    const ko = faqGroups(ALL_OPEN, "ko");
    const en = faqGroups(ALL_OPEN, "en");
    expect(en.map((g) => g.items.map((i) => i.id))).toEqual(
      ko.map((g) => g.items.map((i) => i.id)),
    );
    for (const group of en) {
      expect(group.title).not.toMatch(/[가-힣]/);
      for (const item of group.items) {
        expect(`${item.q} ${item.a}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  it("닫힌 기능의 질문은 영어에서도 넣지 않는다", () => {
    const ids = allFaqs({ gmailOpen: false, socialOpen: false, aiOpen: false }, "en").map(
      (f) => f.id,
    );
    expect(ids).not.toContain("gmail-stored");
    expect(ids).not.toContain("social-email-taken");
    expect(ids).not.toContain("ai-what-is-sent");
  });

  it("알림 답은 Gmail이 열려 있을 때만 캘린더를 말한다", () => {
    const open = allFaqs(ALL_OPEN, "en").find((f) => f.id === "billing-reminder")!;
    const closed = allFaqs({ ...ALL_OPEN, gmailOpen: false }, "en").find(
      (f) => f.id === "billing-reminder",
    )!;
    expect(open.a).toContain("Google Calendar");
    expect(closed.a).not.toContain("Google Calendar");
  });

  it("영어 질문도 기기 검색이 맞는 항목을 찾는다", () => {
    const faqs = allFaqs(ALL_OPEN, "en");
    const hits = searchFaqs("where are my records stored", faqs);
    expect(hits[0].faq.id).toBe("where-stored");
    expect(isConfident(searchFaqs("how is cost per use calculated", faqs))).toBe(true);
  });
});
