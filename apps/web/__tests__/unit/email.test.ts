import { describe, it, expect } from "vitest";
import { accountVerificationEmail, reminderEmail } from "../../lib/email";

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

describe("accountVerificationEmail", () => {
  const confirmUrl = "http://localhost:3000/verify-email?token=abc.def";

  it("어떤 아이디가 이 주소를 썼는지와, 가입하지 않았을 때 할 일을 알린다", () => {
    // 받는 사람이 가입한 본인이 아닐 수 있다. 무엇을 확인해주는지 알아야 누를 수 있다.
    const { subject, text, html } = accountVerificationEmail({
      username: "sean_lee",
      confirmUrl,
      validDays: 3,
    });

    expect(subject).not.toMatch(/[\r\n]/);
    for (const body of [text, html]) {
      expect(body).toContain("sean_lee");
      expect(body).toContain(confirmUrl);
      expect(body).toContain("제가 가입하지 않았어요");
      expect(body).toContain("3일");
    }
  });

  it("아이디를 HTML로 해석하지 않는다", () => {
    const { html } = accountVerificationEmail({
      username: '<a href="https://evil.example">x</a>',
      confirmUrl,
      validDays: 3,
    });

    expect(html).not.toContain('<a href="https://evil.example">');
    expect(html).toContain("&lt;a href=&quot;https://evil.example&quot;&gt;");
  });
});
