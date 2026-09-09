import { describe, it, expect } from "vitest";
import { POPULAR_SERVICES, SERVICE_KEYWORD_PRESET_IDS, parsePaymentSms } from "@subslash/shared";

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
    expect(results[0].name).toContain("Claude Pro");
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
