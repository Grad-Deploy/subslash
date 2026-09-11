import { describe, it, expect } from "vitest";
import { reminderEmail } from "../../lib/email";

const item = {
  clientId: "sub 1",
  name: '<a href="https://evil.example">결제 확인</a>',
  amount: 17000,
  currency: "KRW" as const,
  billingDate: "2026-09-15",
  daysLeft: 3,
};

describe("reminderEmail", () => {
  it("구독 이름을 HTML로 해석하지 않는다", () => {
    // 이름은 브라우저가 올려 보낸 값이라, 태그가 살아나면 SubSlash 메일 안에 남의 링크가 생긴다.
    const { html } = reminderEmail([item], "http://localhost:3000/unsubscribe");

    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
  });

  it("제목은 이름에 줄바꿈이 있어도 한 줄이다", () => {
    const { subject } = reminderEmail(
      [{ ...item, name: "넷플릭스\nBcc: someone@example.com" }],
      "http://localhost:3000/unsubscribe",
    );

    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("체크인 링크의 구독 ID를 인코딩한다", () => {
    const { text, html } = reminderEmail([item], "http://localhost:3000/unsubscribe");

    expect(text).toContain("/check-in?sub=sub%201&count=0");
    expect(html).toContain("/check-in?sub=sub%201&count=0");
  });
});
