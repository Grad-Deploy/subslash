import { describe, it, expect, beforeEach } from "vitest";
import {
  POPULAR_SERVICES,
  SERVICE_KEYWORD_PRESET_IDS,
  parsePaymentSms,
  simulateGmailScan,
  simulateNaverScan,
  simulateEmailScan,
  getSimulatedInboxReceipts,
  isDemoOrTestAccount,
} from "@subslash/shared";
import { useStore } from "../../lib/store";

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

describe("Gmail Scan Simulation with 30-day Filter", () => {
  it("기본 30일 이내 필터 적용 시 최근 청구된 유튜브 프리미엄, Google AI Pro, Claude Pro 3건을 반환한다", () => {
    const results = simulateGmailScan("testuser@gmail.com", {
      linkedAccountId: "acc-123",
      linkedAccountName: "테스트 구글 계정",
      daysLimit: 30,
    });

    // 넷플릭스(114일 전), 쿠팡(70일 전), ChatGPT(67일 전)은 제외되고
    // 최근 30일 이내인 유튜브 프리미엄(15일 전), Google AI Pro(6일 전), Claude Pro(10일 전) 3건 반환
    expect(results).toHaveLength(3);
    const names = results.map((r) => r.name);
    expect(names).toContain("유튜브 프리미엄");
    expect(names).toContain("Google AI Pro (Gemini Advanced)");
    expect(names).toContain("클로드 프로 (Claude Pro)");

    const claude = results.find((r) => r.name.includes("Claude Pro"));
    expect(claude?.amount).toBe(20);
    expect(claude?.currency).toBe("USD");
    expect(claude?.category).toBe("ai");
    expect(claude?.paymentMethod).toBe("credit_card");
    expect(claude?.daysAgo).toBe(10);
    expect(claude?.isWithin30Days).toBe(true);
    expect(claude?.selected).toBe(true);
    expect(claude?.emailProvider).toBe("google");

    const googleAi = results.find((r) => r.name.includes("Google AI Pro"));
    expect(googleAi?.amount).toBe(29000);
    expect(googleAi?.category).toBe("ai");
    expect(googleAi?.paymentMethod).toBe("google_play");
  });

  it("전체 기간(daysLimit=0) 조회 시 과거 청구 이력(총 9건)을 모두 반환하되 30일 초과 건은 비활성 표시한다", () => {
    const allResults = simulateGmailScan("testuser@gmail.com", {
      daysLimit: 0,
    });

    expect(allResults.length).toBe(9);
    const youtube = allResults.find((r) => r.name === "유튜브 프리미엄");
    const googleAi = allResults.find((r) => r.name.includes("Google AI Pro"));
    const claude = allResults.find((r) => r.name.includes("Claude Pro"));
    const netflix = allResults.find((r) => r.name === "넷플릭스");
    const disney = allResults.find((r) => r.name === "디즈니플러스");
    const prime = allResults.find((r) => r.name === "아마존 프라임 비디오");
    const appleTv = allResults.find((r) => r.name.includes("Apple TV+"));

    expect(youtube?.isWithin30Days).toBe(true);
    expect(googleAi?.isWithin30Days).toBe(true);
    expect(claude?.isWithin30Days).toBe(true);

    expect(netflix?.isWithin30Days).toBe(false);
    expect(netflix?.selected).toBe(false);
    expect(netflix?.statusReason).toContain("30일 초과");

    expect(disney?.isWithin30Days).toBe(false);
    expect(disney?.selected).toBe(false);
    expect(disney?.category).toBe("ott");

    expect(prime?.isWithin30Days).toBe(false);
    expect(prime?.currency).toBe("USD");
    expect(prime?.amount).toBe(5.99);

    expect(appleTv?.isCanceled).toBe(true);
    expect(appleTv?.statusReason).toContain("해지 완료");
  });
});

describe("Naver Mailbox Scan Simulation with Cancellation Cross-Check", () => {
  it("@naver.com 이메일 스캔 시 티빙/네이버플러스/웨이브 해지 및 단발성 쇼핑 결제를 감지하여 최근 30일 활성 구독 0건으로 정확히 판별한다", () => {
    const results = simulateEmailScan("myuser@naver.com", {
      daysLimit: 30,
    });

    // 3일 전 결제된 티빙은 1일 전 해지 완료 메일로 인해 제외
    // 10일 전 결제된 네이버플러스는 5일 전 해지 완료 메일로 인해 제외
    // 60일 전 결제된 웨이브는 58일 전 해지 완료 메일로 인해 제외
    // 2일 전 네이버페이 32,000원 결제는 일반 쇼핑 단발성 결제로 제외
    // 85일 전 멜론, 90일 전 MYBOX, 120일 전 왓챠, 150일 전 라프텔은 30일 초과로 제외
    // 사용하지 않는 네이버 바이브 등 가짜 구독이 생성되지 않고 정확히 0건 반환
    expect(results).toHaveLength(0);
  });

  it("네이버 메일함 전체 기간(daysLimit=0) 조회 시 티빙, 네이버플러스, 웨이브는 '해지 완료', 쇼핑은 '단발성 결제'로 감지된다", () => {
    const allResults = simulateNaverScan("myuser@naver.com", {
      daysLimit: 0,
    });

    expect(allResults).toHaveLength(8);
    const tving = allResults.find((r) => r.name === "티빙");
    const naverPlus = allResults.find((r) => r.name === "네이버플러스");
    const shopping = allResults.find((r) => r.name.includes("쇼핑"));
    const melon = allResults.find((r) => r.name === "멜론");
    const mybox = allResults.find((r) => r.name === "네이버 MYBOX");
    const wavve = allResults.find((r) => r.name === "웨이브");
    const watcha = allResults.find((r) => r.name === "왓챠");
    const laftel = allResults.find((r) => r.name.includes("라프텔"));

    // 티빙 해지 감지 검증 (원 금액 13,900원 보존)
    expect(tving?.isCanceled).toBe(true);
    expect(tving?.amount).toBe(13900);
    expect(tving?.isWithin30Days).toBe(false);
    expect(tving?.selected).toBe(false);
    expect(tving?.statusReason).toContain("해지 완료 확인됨");

    // 네이버플러스 해지 감지 검증 (원 금액 4,900원 보존)
    expect(naverPlus?.isCanceled).toBe(true);
    expect(naverPlus?.amount).toBe(4900);
    expect(naverPlus?.isWithin30Days).toBe(false);
    expect(naverPlus?.selected).toBe(false);
    expect(naverPlus?.statusReason).toContain("해지 완료 확인됨");

    // 웨이브 해지 감지 검증 (원 금액 13,900원 보존)
    expect(wavve?.isCanceled).toBe(true);
    expect(wavve?.amount).toBe(13900);
    expect(wavve?.category).toBe("ott");
    expect(wavve?.statusReason).toContain("해지 완료 확인됨");

    // 쇼핑 단발성 결제 검증 (정기구독 아님)
    expect(shopping?.amount).toBe(32000);
    expect(shopping?.isWithin30Days).toBe(false);
    expect(shopping?.selected).toBe(false);
    expect(shopping?.statusReason).toContain("단발성 일반 결제");

    // 멜론, MYBOX는 30일 초과 미결제
    expect(melon?.isCanceled).toBe(false);
    expect(melon?.selected).toBe(false);
    expect(melon?.statusReason).toContain("30일 초과");

    expect(mybox?.isCanceled).toBe(false);
    expect(mybox?.selected).toBe(false);
    expect(mybox?.statusReason).toContain("30일 초과");

    // 왓챠, 라프텔 OTT 검증 (30일 초과 미결제)
    expect(watcha?.category).toBe("ott");
    expect(watcha?.amount).toBe(7900);
    expect(watcha?.statusReason).toContain("30일 초과");

    expect(laftel?.category).toBe("ott");
    expect(laftel?.amount).toBe(9900);
    expect(laftel?.statusReason).toContain("30일 초과");
  });
});

describe("Unified Multi-Mailbox Scan (Google + Naver)", () => {
  it("getSimulatedInboxReceipts가 공급자별로 올바른 수신함 영수증 및 해지 메일을 반환한다", () => {
    const googleReceipts = getSimulatedInboxReceipts("google");
    const naverReceipts = getSimulatedInboxReceipts("naver");
    const allReceipts = getSimulatedInboxReceipts("all");

    expect(googleReceipts).toHaveLength(10); // 유튜브, Google AI, Claude Pro, 넷플릭스, 쿠팡, ChatGPT, 디즈니, 프라임, 애플TV 해지/결제
    expect(naverReceipts).toHaveLength(11); // 쇼핑, 티빙(2), 플러스(2), 멜론, 마이박스, 웨이브(2), 왓챠, 라프텔
    expect(allReceipts).toHaveLength(21);
  });

  it("provider='all' 설정 시 네이버(활성 0건) 및 만료/해지건이 제외되고 실제 구독 중인 Google 3건(유튜브, Google AI Pro, Claude Pro)만 통합 반환된다", () => {
    const results = simulateEmailScan("unified_user@example.com", {
      provider: "all",
      daysLimit: 30,
    });

    // Google: 유튜브 프리미엄(14,900원), Google AI Pro(29,000원), Claude Pro($20.00) 총 3건
    // Naver: 활성 구독 0건 (바이브 없음, 티빙/플러스/웨이브 해지됨, 쇼핑 제외)
    expect(results).toHaveLength(3);
    const names = results.map((r) => r.name);
    expect(names).toContain("유튜브 프리미엄");
    expect(names).toContain("Google AI Pro (Gemini Advanced)");
    expect(names).toContain("클로드 프로 (Claude Pro)");
    expect(names).not.toContain("티빙");
    expect(names).not.toContain("네이버플러스");
    expect(names).not.toContain("웨이브");
    expect(names).not.toContain("네이버 바이브 (VIBE)");

    const googleItems = results.filter((r) => r.emailProvider === "google");
    const naverItems = results.filter((r) => r.emailProvider === "naver");
    expect(googleItems).toHaveLength(3);
    expect(naverItems).toHaveLength(0);
  });
});

describe("10대 주요 OTT 서비스 전수 파싱 및 전체 메일함 검증 (넷플릭스, 유튜브, 티빙, 웨이브, 왓챠, 디즈니+, 쿠팡플레이, 애플TV+, 프라임비디오, 라프텔)", () => {
  it("10대 OTT 서비스의 개별 결제 문자/영수증을 전수 파싱하여 올바른 카테고리(ott)와 금액을 식별한다", () => {
    const ottSamples = [
      {
        text: "[Web발신] 신한카드 승인 17,000원 넷플릭스 09/15 일시불",
        expectedName: "넷플릭스",
        expectedAmount: 17000,
        expectedDay: 15,
        expectedCurrency: "KRW",
      },
      {
        text: "[KB국민카드] 14,900원 구글페이먼트(유튜브) 승인 09/22 10:12",
        expectedName: "유튜브 프리미엄",
        expectedAmount: 14900,
        expectedDay: 22,
        expectedCurrency: "KRW",
      },
      {
        text: "[네이버페이] 티빙 13,900원 정기결제 완료 09/03",
        expectedName: "티빙",
        expectedAmount: 13900,
        expectedDay: 3,
        expectedCurrency: "KRW",
      },
      {
        text: "[삼성카드] 13,900원 콘텐츠웨이브 승인 08/14 일시불",
        expectedName: "웨이브",
        expectedAmount: 13900,
        expectedDay: 14,
        expectedCurrency: "KRW",
      },
      {
        text: "[현대카드] 7,900원 왓챠 결제 완료 08/20",
        expectedName: "왓챠",
        expectedAmount: 7900,
        expectedDay: 20,
        expectedCurrency: "KRW",
      },
      {
        text: "[롯데카드] 13,900원 디즈니플러스 정기결제 승인 08/18",
        expectedName: "디즈니플러스",
        expectedAmount: 13900,
        expectedDay: 18,
        expectedCurrency: "KRW",
      },
      {
        text: "[현대카드] 7,890원 쿠팡와우멤버십(쿠팡플레이) 08/28 승인",
        expectedName: "쿠팡 와우 (쿠팡플레이)",
        expectedAmount: 7890,
        expectedDay: 28,
        expectedCurrency: "KRW",
      },
      {
        text: "[BC카드] 6,500원 Apple TV+ 승인 08/26 09:00",
        expectedName: "애플 TV+ (Apple TV+)",
        expectedAmount: 6500,
        expectedDay: 26,
        expectedCurrency: "KRW",
      },
      {
        text: "[신한카드] 해외승인 $5.99 Prime Video 08/11 일시불",
        expectedName: "아마존 프라임 비디오",
        expectedAmount: 5.99,
        expectedDay: 11,
        expectedCurrency: "USD",
      },
      {
        text: "[카카오페이] 9,900원 자동결제 완료 (라프텔 애니 멤버십) 08/07",
        expectedName: "라프텔 (Laftel)",
        expectedAmount: 9900,
        expectedDay: 7,
        expectedCurrency: "KRW",
      },
    ];

    for (const sample of ottSamples) {
      const results = parsePaymentSms(sample.text);
      expect(results.length).toBeGreaterThanOrEqual(1);
      const matched = results[0];
      expect(matched.name).toBe(sample.expectedName);
      expect(matched.amount).toBe(sample.expectedAmount);
      expect(matched.currency).toBe(sample.expectedCurrency);
      expect(matched.billingDay).toBe(sample.expectedDay);
      expect(matched.category).toBe("ott");
      expect(matched.cancelUrl).toBeDefined();
      expect(matched.cancelGuide).toBeDefined();
    }
  });

  it("전체 기간(daysLimit=0, provider='all') 스캔 시 10대 OTT 서비스가 100% 누락 없이 식별된다", () => {
    const allServices = simulateEmailScan("test@example.com", {
      provider: "all",
      daysLimit: 0,
    });

    // Google (9개) + Naver (8개) = 총 17개 서비스
    expect(allServices).toHaveLength(17);

    const ottServices = allServices.filter((s) => s.category === "ott");
    // 10대 OTT: 넷플릭스, 유튜브, 티빙, 웨이브, 왓챠, 디즈니+, 쿠팡플레이, 애플TV+, 프라임비디오, 라프텔
    expect(ottServices).toHaveLength(10);

    const ottNames = ottServices.map((s) => s.name);
    expect(ottNames).toContain("넷플릭스");
    expect(ottNames).toContain("유튜브 프리미엄");
    expect(ottNames).toContain("티빙");
    expect(ottNames).toContain("웨이브");
    expect(ottNames).toContain("왓챠");
    expect(ottNames).toContain("디즈니플러스");
    expect(ottNames).toContain("쿠팡 와우 (쿠팡플레이)");
    expect(ottNames).toContain("애플 TV+ (Apple TV+)");
    expect(ottNames).toContain("아마존 프라임 비디오");
    expect(ottNames).toContain("라프텔 (Laftel)");

    // 모든 10대 OTT의 해지 가이드 및 해지 URL이 존재하는지 검증
    for (const ott of ottServices) {
      expect(ott.cancelUrl).toBeTruthy();
      expect(ott.cancelGuide).toBeTruthy();
      expect(ott.cancelGuide?.length).toBeGreaterThan(10);
    }
  });

  it("최근 30일 이내(daysLimit=30, provider='all') 스캔 시 10대 OTT 중 실제 이용 중인 유튜브 프리미엄 1건만 활성으로 감지된다", () => {
    const activeServices = simulateEmailScan("test@example.com", {
      provider: "all",
      daysLimit: 30,
    });

    const activeOtt = activeServices.filter((s) => s.category === "ott");
    expect(activeOtt).toHaveLength(1);
    expect(activeOtt[0].name).toBe("유튜브 프리미엄");
    expect(activeOtt[0].isWithin30Days).toBe(true);
    expect(activeOtt[0].selected).toBe(true);

    // AI 서비스 2건 포함하여 총 3건 활성
    expect(activeServices).toHaveLength(3);
    const activeAi = activeServices.filter((s) => s.category === "ai");
    expect(activeAi).toHaveLength(2);
  });
});

describe("Store addBatchSubscriptions", () => {
  beforeEach(() => {
    useStore.setState({ subscriptions: [], usageLogs: [] });
  });

  it("여러 구독을 한 번에 일괄 추가하고 고유 ID를 부여한다", () => {
    const newSubs = useStore.getState().addBatchSubscriptions([
      {
        name: "서비스 A",
        amount: 10000,
        currency: "KRW",
        billingDay: 5,
        billingCycle: "monthly",
        category: "ott",
      },
      {
        name: "서비스 B",
        amount: 20000,
        currency: "KRW",
        billingDay: 15,
        billingCycle: "monthly",
        category: "music",
      },
    ]);

    expect(newSubs).toHaveLength(2);
    expect(newSubs[0].id).toBeDefined();
    expect(newSubs[1].id).toBeDefined();
    expect(newSubs[0].id).not.toBe(newSubs[1].id);

    const storeSubs = useStore.getState().subscriptions;
    expect(storeSubs).toHaveLength(2);
    expect(useStore.getState().getDashboardStats().totalMonthlySpend).toBe(30000);
  });
});

describe("가상 계정 메일함 격리 (admin123@gmail.com 등 신규/가상 이메일 데이터 분리)", () => {
  it("isDemoOrTestAccount가 데모 계정과 임의의 가상 계정을 정확히 구별한다", () => {
    expect(isDemoOrTestAccount("myaccount@gmail.com")).toBe(true);
    expect(isDemoOrTestAccount("myaccount@naver.com")).toBe(true);
    expect(isDemoOrTestAccount("testuser@gmail.com")).toBe(true);
    expect(isDemoOrTestAccount("myuser@naver.com")).toBe(true);
    expect(isDemoOrTestAccount("demo_user@service.com")).toBe(true);
    expect(isDemoOrTestAccount("sample@company.com")).toBe(true);

    // 가상 이메일은 데모 계정으로 취급되지 않음
    expect(isDemoOrTestAccount("admin123@gmail.com")).toBe(false);
    expect(isDemoOrTestAccount("newuser456@naver.com")).toBe(false);
    expect(isDemoOrTestAccount("unknown@customdomain.kr")).toBe(false);
  });

  it("가상의 신규 이메일(admin123@gmail.com) 스캔 시 이전 계정 데이터를 재사용하지 않고 0건(빈 메일함)으로 격리한다", () => {
    // 이전 계정의 영수증(유튜브, Google AI, 클로드 등)이 임의로 노출되지 않고 깨끗이 0건 반환
    const results = simulateEmailScan("admin123@gmail.com", {
      daysLimit: 30,
    });
    expect(results).toHaveLength(0);

    const allHistoryResults = simulateEmailScan("admin123@gmail.com", {
      daysLimit: 0,
    });
    expect(allHistoryResults).toHaveLength(0);

    const receipts = getSimulatedInboxReceipts("google", new Date(), "admin123@gmail.com");
    expect(receipts).toHaveLength(0);
  });

  it("가상의 신규 이메일(admin123@gmail.com)에 generateSampleData: true 활성화 시 수신자 admin123@gmail.com 전용 영수증을 생성한다", () => {
    const results = simulateEmailScan("admin123@gmail.com", {
      daysLimit: 30,
      generateSampleData: true,
    });

    expect(results.length).toBeGreaterThan(0);
    // 모든 결과가 admin123@gmail.com을 수신자로 가지며, myaccount@gmail.com이 섞이지 않음
    for (const item of results) {
      expect(item.recipientEmail).toBe("admin123@gmail.com");
      expect(item.linkedAccountName).toContain("admin123@gmail.com");
      expect(item.sourceSnippet).toContain("admin123@gmail.com");
      expect(item.linkedAccountName).not.toContain("myaccount@gmail.com");
      expect(item.sourceSnippet).not.toContain("myaccount@gmail.com");
    }

    const receipts = getSimulatedInboxReceipts("google", new Date(), "admin123@gmail.com", {
      generateSampleData: true,
    });
    expect(receipts.length).toBeGreaterThan(0);
    for (const r of receipts) {
      expect(r.recipientEmail).toBe("admin123@gmail.com");
    }
  });

  it("가상 계정(admin123@gmail.com) 구독 일괄 등록 시 이전 myaccount 계정 기록을 지우고 신규 계정으로 등록된다", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "old-sub-1",
          name: "이전 유튜브",
          amount: 14900,
          currency: "KRW",
          billingDay: 10,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: new Date().toISOString(),
          linkedAccountId: "acc-google-1",
          linkedAccountName: "Google 개인 계정 (myaccount@gmail.com)",
        },
      ],
      usageLogs: [],
    });

    const store = useStore.getState();
    expect(store.subscriptions).toHaveLength(1);
    expect(store.subscriptions[0].linkedAccountName).toContain("myaccount@gmail.com");

    // admin123 계정 생성
    const newAcc = store.addAccount({
      name: "admin123",
      emailOrId: "admin123@gmail.com",
      provider: "google",
    });

    // clearPrevious: true로 일괄 등록 실행
    store.addBatchSubscriptions(
      [
        {
          name: "클로드 프로 (Claude Pro)",
          amount: 20,
          currency: "USD",
          billingDay: 27,
          billingCycle: "monthly",
          category: "ai",
          linkedAccountId: newAcc.id,
          linkedAccountName: `${newAcc.name} (${newAcc.emailOrId})`,
        },
      ],
      { clearPrevious: true },
    );

    const updatedSubs = useStore.getState().subscriptions;
    expect(updatedSubs).toHaveLength(1);
    expect(updatedSubs[0].name).toBe("클로드 프로 (Claude Pro)");
    expect(updatedSubs[0].linkedAccountId).toBe(newAcc.id);
    expect(updatedSubs[0].linkedAccountName).toBe("admin123 (admin123@gmail.com)");
    // 이전 myaccount 계정 구독은 완전히 제거됨
    expect(
      updatedSubs.find((s) => s.linkedAccountName?.includes("myaccount@gmail.com")),
    ).toBeUndefined();
  });
});
