import { describe, it, expect } from "vitest";
import {
  POPULAR_SERVICES,
  SERVICE_KEYWORD_PRESET_IDS,
  parsePaymentSms,
  parseReceiptEmails,
} from "@subslash/shared";

describe("Payment SMS & Receipt Parser", () => {
  it("신한카드 넷플릭스 결제 승인 문자를 정상 파싱한다", () => {
    const sms = "[Web발신]\n신한카드 승인 홍*동님 17,000원 넷플릭스 09/15 14:30 일시불";
    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("넷플릭스");
    expect(results[0].amount).toBe(17000);
    expect(results[0].currency).toBe("KRW");
    expect(results[0].billingDay).toBe(15);
    expect(results[0].category).toBe("ott");
    expect(results[0].confidence).toBe("high");
    expect(results[0].source).toBe("sms");
  });

  it("KB국민카드 구글페이먼트(유튜브) 문자를 정상 파싱하고 결제수단을 google_play로 분류한다", () => {
    const sms = "[KB국민카드] 14,900원 구글페이먼트(유튜브) 승인 09/22 10:12";
    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("유튜브 프리미엄");
    expect(results[0].amount).toBe(14900);
    expect(results[0].paymentMethod).toBe("google_play");
    expect(results[0].billingDay).toBe(22);
  });

  it("카카오페이 및 네이버페이 자동결제 알림을 올바른 결제수단으로 파싱한다", () => {
    const text = `카카오페이 4,900원 자동결제 완료 (카카오 이모티콘 플러스) 09/05
네이버페이 4,900원 결제 완료 (네이버플러스 멤버십) 09/03`;

    const results = parsePaymentSms(text);
    expect(results).toHaveLength(2);

    const kakao = results.find((r) => r.name.includes("카카오"));
    expect(kakao).toBeDefined();
    expect(kakao?.paymentMethod).toBe("kakaopay");
    expect(kakao?.amount).toBe(4900);

    const naver = results.find((r) => r.name.includes("네이버"));
    expect(naver).toBeDefined();
    expect(naver?.paymentMethod).toBe("naverpay");
    expect(naver?.amount).toBe(4900);
  });

  it("네이버 MYBOX 클라우드 결제 문자를 정상 파싱한다", () => {
    const sms = "네이버페이 1,650원 결제 완료 (네이버 MYBOX 80GB 이용권) 09/08";
    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("네이버 MYBOX");
    expect(results[0].amount).toBe(1650);
    expect(results[0].category).toBe("cloud");
    expect(results[0].paymentMethod).toBe("naverpay");
    expect(results[0].billingDay).toBe(8);
  });

  it("여러 건의 결제 문자가 한 번에 들어와도 각각 분리하여 파싱한다", () => {
    const multiSms = `[Web발신] 신한카드 승인 17,000원 넷플릭스 09/15 일시불
[KB국민카드] 14,900원 구글페이먼트 09/22 승인
현대카드 승인 7,890원 쿠팡와우멤버십 08/28 일시불`;

    const results = parsePaymentSms(multiSms);
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.map((r) => r.amount)).toContain(17000);
    expect(results.map((r) => r.amount)).toContain(14900);
    expect(results.map((r) => r.amount)).toContain(7890);
  });

  it("줄이 나뉜 카드 승인 문자에서 가맹점과 금액을 한 건으로 묶는다", () => {
    // 국내 카드 문자는 은행 헤더·금액·가맹점이 각각 다른 줄에 오는 경우가 흔하다.
    // 금액이 있는 줄마다 새 메시지로 잘라내면 가맹점 이름이 떨어져 나간다.
    const sms = `[국민카드] 승인 홍*동
17,000원 일시불
09/15 14:30
넷플릭스`;

    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("넷플릭스");
    expect(results[0].amount).toBe(17000);
    expect(results[0].billingDay).toBe(15);
    expect(results[0].confidence).toBe("high");
  });

  it("[Web발신] 뒤에 여러 줄이 이어져도 한 건으로 본다", () => {
    const sms = `[Web발신]
노션 연간 결제 안내
결제금액 : 120,000원
결제일시 : 2026-03-11`;

    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("노션");
    expect(results[0].amount).toBe(120000);
  });

  it("영수증 필드 이름이 구독 이름이 되지 않는다", () => {
    const sms = `[Web발신]
결제금액 : 8,900원
결제일시 : 2026-03-11`;

    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).not.toBe("결제금액");
    expect(results[0].name).toContain("알 수 없는 결제");
  });

  it("날짜가 구독 이름이 되지 않는다", () => {
    const sms = `[하나카드] 승인
9,900원 일시불
03/11`;

    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).not.toBe("03/11");
    expect(results[0].name).toContain("알 수 없는 결제");
  });

  it("키워드 표의 presetId가 모두 실제 프리셋을 가리킨다", () => {
    // 오타가 나면 매칭이 조용히 실패한다. 해지 URL도 카테고리도 붙지 않고,
    // 이름은 폴백으로 떨어지는데 어디에서도 오류가 나지 않는다.
    const known = new Set(POPULAR_SERVICES.map((service) => service.id));
    const dangling = SERVICE_KEYWORD_PRESET_IDS.filter((id) => !known.has(id));

    expect(dangling).toEqual([]);
  });

  it("어도비 결제 문자가 프리셋에 매칭된다", () => {
    const results = parsePaymentSms(`[신한카드] 승인
24,000원 일시불
어도비`);

    expect(results[0].name).toBe("어도비");
    expect(results[0].cancelUrl).toBeTruthy();
    expect(results[0].confidence).toBe("high");
  });

  it("마이크로소프트 365 결제 문자가 프리셋에 매칭된다", () => {
    const results = parsePaymentSms(`[국민카드] 승인
11,900원
마이크로소프트 365`);

    expect(results[0].name).toBe("마이크로소프트 365");
    expect(results[0].cancelUrl).toBeTruthy();
  });

  it("연간 결제 영수증을 연간 구독으로 인식하고 결제 월까지 가져온다", () => {
    // 월간으로 등록하면 월 고정지출이 12배로 잡힌다.
    const results = parsePaymentSms(`[Web발신]
노션 연간 결제 안내
결제금액 : 120,000원
결제일시 : 2026-03-11`);

    expect(results[0].billingCycle).toBe("yearly");
    expect(results[0].billingMonth).toBe(3);
    expect(results[0].billingDay).toBe(11);
  });

  it("1년 이용권 문구도 연간으로 본다", () => {
    const results = parsePaymentSms(`[국민카드] 승인
99,000원 일시불
03/11
유튜브 프리미엄 1년 이용권`);

    expect(results[0].billingCycle).toBe("yearly");
    expect(results[0].billingMonth).toBe(3);
  });

  it("월간 결제에는 결제 월을 붙이지 않는다", () => {
    // 매달 반복되는 결제라 영수증에 적힌 달은 아무것도 알려주지 않는다.
    const results = parsePaymentSms(`[Web발신]
신한카드 승인 17,000원 넷플릭스 09/15 일시불`);

    expect(results[0].billingCycle).toBe("monthly");
    expect(results[0].billingMonth).toBeUndefined();
  });

  it("Google Play의 Google AI Pro 결제 문자를 정상 파싱하고 AI 카테고리로 분류한다", () => {
    const sms = "[KB국민카드] 29,000원 구글페이먼트(Google AI Pro) 승인 08/31 11:20";
    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Google AI Pro (Gemini Advanced)");
    expect(results[0].amount).toBe(29000);
    expect(results[0].category).toBe("ai");
    expect(results[0].paymentMethod).toBe("google_play");
  });

  it("신한카드 해외승인 Claude Pro (Anthropic) 결제 문자를 정상 파싱하고 AI 카테고리로 분류한다", () => {
    const sms = "[Web발신]\n신한카드 해외승인 김*수님 $20.00 ANTHROPIC 08/27 15:40 일시불";
    const results = parsePaymentSms(sms);

    expect(results).toHaveLength(1);
    // 문자만으로는 Pro인지 Max인지 알 수 없어 요금제 이름을 붙이지 않는다.
    expect(results[0].name).toBe("Claude");
    expect(results[0].amount).toBe(20);
    expect(results[0].currency).toBe("USD");
    expect(results[0].category).toBe("ai");
    expect(results[0].billingDay).toBe(27);
  });

  it("네이버플러스 멤버십 정기결제 해지 완료 안내 문자를 감지하고 isCanceled: true로 마킹한다", () => {
    const cancelText = "[네이버페이] 네이버플러스 멤버십 정기결제 해지 완료 안내 09/05";
    const results = parsePaymentSms(cancelText);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("네이버플러스");
    expect(results[0].isCanceled).toBe(true);
    expect(results[0].selected).toBe(false);
    expect(results[0].statusReason).toContain("해지");
  });

  it("네이버페이 결제 영수증 이메일 본문(멀티라인 Key-Value)을 정확하게 파싱한다", () => {
    const naverEmail = `[네이버페이] 결제내역 안내 (정기/반복결제)
주문번호 : 2026090212345678
상품명 : 네이버 MYBOX 80GB 이용권 (정기결제)
결제금액 : 1,650원
결제일시 : 2026.09.02 14:30
결제수단 : 네이버페이 머니
다음 결제 예정일 : 2026.10.02`;

    const results = parsePaymentSms(naverEmail);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("네이버 MYBOX");
    expect(results[0].amount).toBe(1650);
    expect(results[0].currency).toBe("KRW");
    expect(results[0].billingDay).toBe(2);
    expect(results[0].paymentMethod).toBe("naverpay");
    expect(results[0].category).toBe("cloud");
  });

  it("결제 금액이 없는 일반 텍스트나 빈 문자열은 무시한다", () => {
    expect(parsePaymentSms("")).toEqual([]);
    expect(parsePaymentSms("안녕하세요 반갑습니다.")).toEqual([]);
  });
});

describe("parseReceiptEmails (Gmail 결제 메일)", () => {
  const NOW = new Date("2026-09-15T03:00:00.000Z");
  const email = (subject: string, body: string, date: string, from = "billing@example.com") => ({
    from,
    subject,
    body,
    date,
  });

  it("본문 하단의 '언제든 해지' 안내로 영수증을 해지 알림으로 읽지 않는다", () => {
    const [item] = parseReceiptEmails(
      [
        email(
          "넷플릭스 결제 안내",
          "결제금액 : 17,000원\n\n멤버십은 언제든 해지할 수 있습니다.",
          "2026-09-10T03:00:00.000Z",
        ),
      ],
      { now: NOW },
    );

    expect(item.isCanceled).toBe(false);
    expect(item.selected).toBe(true);
    expect(item.source).toBe("gmail");
  });

  it("제목이 해지 안내면 해지로 보고 등록 후보에서 뺀다", () => {
    const [item] = parseReceiptEmails(
      [email("넷플릭스 멤버십 해지 완료", "결제금액 : 17,000원", "2026-09-10T03:00:00.000Z")],
      { now: NOW },
    );

    expect(item.isCanceled).toBe(true);
    expect(item.selected).toBe(false);
  });

  it("결제일 칸이 없으면 본문의 숫자가 아니라 메일을 받은 날을 결제일로 쓴다", () => {
    const [item] = parseReceiptEmails(
      [email("스포티파이 영수증", "$11.99 결제\n저장공간 1.5GB 추가", "2026-09-08T03:00:00.000Z")],
      { now: NOW },
    );

    expect(item.billingDay).toBe(8);
    expect(item.amount).toBe(11.99);
    expect(item.currency).toBe("USD");
  });

  it("본문의 다른 서비스 광고보다 제목·보낸 사람의 서비스를 먼저 본다", () => {
    const [item] = parseReceiptEmails(
      [
        email(
          "결제 안내",
          "결제금액 : 17,000원\n쿠팡플레이도 함께 즐겨보세요",
          "2026-09-10T03:00:00.000Z",
          "Netflix <info@account.netflix.com>",
        ),
      ],
      { now: NOW },
    );

    expect(item.name).toBe("넷플릭스");
  });

  it("서비스를 알아보지 못하면 본문의 단어를 이름으로 쓰지 않는다", () => {
    const [item] = parseReceiptEmails(
      [email("Your receipt", "Thanks for your payment ₩8,900", "2026-09-10T03:00:00.000Z")],
      { now: NOW },
    );

    expect(item.name).toBe("알 수 없는 결제 (₩8,900)");
  });

  it("같은 구독의 영수증은 가장 최근 것 하나만 남긴다", () => {
    const items = parseReceiptEmails(
      [
        email("넷플릭스 결제 안내", "결제금액 : 13,500원", "2026-08-10T03:00:00.000Z"),
        email("넷플릭스 결제 안내", "결제금액 : 17,000원", "2026-09-10T03:00:00.000Z"),
        email("넷플릭스 결제 안내", "결제금액 : 13,500원", "2026-07-10T03:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(17000);
    expect(items[0].receiptDate).toBe("2026.09.10");
  });

  it("마지막 결제 메일이 오래된 월간 구독은 지금도 결제 중인지 모른다고 보고 기본으로 빼 둔다", () => {
    const [item] = parseReceiptEmails(
      [email("티빙 정기결제 안내", "결제금액 : 13,900원", "2026-06-03T03:00:00.000Z")],
      { now: NOW },
    );

    expect(item.selected).toBe(false);
    expect(item.statusReason).toContain("지금도 결제 중인지 알 수 없습니다");
  });

  it("연간 결제 메일은 받은 달을 결제 월로 쓰고, 1년이 안 지났으면 후보로 둔다", () => {
    const [item] = parseReceiptEmails(
      [email("쿠팡 와우 연간 멤버십 결제", "결제금액 : 79,000원", "2025-11-20T03:00:00.000Z")],
      { now: NOW },
    );

    expect(item.billingCycle).toBe("yearly");
    expect(item.billingMonth).toBe(11);
    expect(item.billingDay).toBe(20);
    expect(item.selected).toBe(true);
  });
  it("시간대를 주면 그 시간대의 달력으로 받은 날을 읽는다(서버는 UTC라 한국 오전 메일이 전날이 되지 않게)", () => {
    // 한국 시각 2026-09-10 08:00 = UTC 2026-09-09 23:00
    const [item] = parseReceiptEmails(
      [email("넷플릭스 결제 안내", "결제금액 : 17,000원", "2026-09-09T23:00:00.000Z")],
      { now: NOW, timeZone: "Asia/Seoul" },
    );

    expect(item.billingDay).toBe(10);
    expect(item.receiptDate).toBe("2026.09.10");
  });

  it("알려진 서비스와 맞으면 그 id와 보낸 사람을 남긴다", () => {
    const [known, unknown] = parseReceiptEmails(
      [
        email(
          "넷플릭스 결제 안내",
          "결제금액 : 17,000원",
          "2026-09-10T03:00:00.000Z",
          "Netflix <a@b>",
        ),
        email("Your receipt", "₩8,900 paid", "2026-09-09T03:00:00.000Z", "Shop <c@d>"),
      ],
      { now: NOW },
    );

    expect(known.presetId).toBe("netflix");
    expect(known.sender).toBe("Netflix <a@b>");
    expect(unknown.presetId).toBeUndefined();
  });
});
