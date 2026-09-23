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

describe("결제 메일이 아닌 메일을 구독으로 읽지 않는다", () => {
  const NOW = new Date("2026-09-15T03:00:00.000Z");
  const mail = (subject: string, body: string, from: string) => [
    { from, subject, body, date: "2026-09-10T03:00:00.000Z" },
  ];

  it("광고 메일의 안내 가격을 결제액으로 읽지 않는다", () => {
    // 쓰지도 않는 챗GPT가 '$20 구독'으로 등록되던 메일이다. 메일함 검색이 'subscription'까지
    // 훑기 때문에 광고가 함께 걸리고, 그 본문에도 서비스 이름과 금액이 있다.
    const items = parseReceiptEmails(
      mail(
        "Introducing new ChatGPT features",
        "Upgrade to ChatGPT Plus for $20/month. Manage your email subscription preferences here.",
        "OpenAI <noreply@email.openai.com>",
      ),
      { now: NOW },
    );

    expect(items).toEqual([]);
  });

  it("다른 서비스를 이야기하는 뉴스레터를 그 서비스의 구독으로 읽지 않는다", () => {
    const items = parseReceiptEmails(
      mail(
        "이번 주 AI 소식: ChatGPT와 Claude 비교",
        "두 서비스의 구독료는 월 29,000원 안팎입니다.",
        "뉴스레터 <news@example.com>",
      ),
      { now: NOW },
    );

    expect(items).toEqual([]);
  });

  it("영수증에 적힌 인상 예정 금액을 이번 결제액으로 읽지 않는다", () => {
    const [item] = parseReceiptEmails(
      mail(
        "넷플릭스 결제 안내",
        "결제가 완료되었습니다\n17,000원\n다음 달부터 19,500원부터 시작하는 요금제로 바뀝니다.",
        "Netflix <info@account.netflix.com>",
      ),
      { now: NOW },
    );

    expect(item.amount).toBe(17000);
  });

  it("보낸 사람의 도메인을 제목·본문의 다른 서비스보다 먼저 믿는다", () => {
    const [item] = parseReceiptEmails(
      mail(
        "Your receipt — compare us with Netflix",
        "Thank you for your payment. $20.00 charged. 넷플릭스보다 좋습니다.",
        "OpenAI <billing@openai.com>",
      ),
      { now: NOW },
    );

    expect(item.presetId).toBe("chatgpt-plus");
    expect(item.confidence).toBe("high");
  });

  it("본문에서만 찾은 이름은 확인 없이 등록하지 않는다", () => {
    // 이름의 근거가 본문 한 줄뿐이라 사용자가 골라야 한다(자동 가져오기의 review).
    const [item] = parseReceiptEmails(
      mail(
        "결제 영수증",
        "결제금액 : 13,900원\n상품: 티빙 이용권",
        "결제알림 <noreply@some-biller.example>",
      ),
      { now: NOW },
    );

    expect(item.presetId).toBe("tving");
    expect(item.confidence).toBe("medium");
  });

  it("앱스토어 영수증은 애플이 보냈다는 이유로 아이클라우드가 되지 않고, 본문의 앱 이름을 쓴다", () => {
    // 키워드에 "apple.com"이 있어 보낸 사람 주소만으로 아이클라우드가 됐다. 1년째 쓰는 굿노트
    // 구독이 '아이클라우드 연간 13,000원'으로 등록됐고, 해지하려고 누르면 애플 iCloud 설정이
    // 열렸다. 애플 결제라는 사실만으로는 어느 앱인지 알 수 없다.
    const [item] = parseReceiptEmails(
      mail(
        "귀하의 영수증입니다.",
        "APPLE 계정\nGoodnotes 6\n연간 구독 (자동 갱신)\n₩13,000\n합계 ₩13,000",
        "Apple <no_reply@email.apple.com>",
      ),
      { now: NOW },
    );

    expect(item.presetId).toBe("goodnotes");
    expect(item.name).toBe("굿노트");
    expect(item.billingCycle).toBe("yearly");
    expect(item.amount).toBe(13000);
    expect(item.paymentMethod).toBe("apple_iap");
    // 한 메일로 여러 앱을 청구하는 발신자라 본문의 이름을 그대로 믿는다.
    expect(item.confidence).toBe("high");
  });

  it("아이클라우드 영수증은 그대로 아이클라우드다", () => {
    const [item] = parseReceiptEmails(
      mail(
        "귀하의 영수증입니다.",
        "APPLE 계정\niCloud+ 50GB\n월간 구독\n₩1,100",
        "Apple <no_reply@email.apple.com>",
      ),
      { now: NOW },
    );

    expect(item.presetId).toBe("apple-icloud");
  });

  it("한 메일로 여러 서비스를 청구하는 발신자는 본문의 이름을 그대로 믿는다", () => {
    // 구글 플레이 영수증은 제목이 '주문 영수증'뿐이고 어느 서비스인지는 본문에만 있다.
    const [item] = parseReceiptEmails(
      mail(
        "Google Play 주문 영수증",
        "결제금액 : 14,900원\nYouTube Premium 월간 멤버십",
        "Google Play <googleplay-noreply@google.com>",
      ),
      { now: NOW },
    );

    expect(item.presetId).toBe("youtube-premium");
    expect(item.confidence).toBe("high");
  });

  it("한 영수증이 여러 앱을 청구하면 항목마다 후보를 만든다", () => {
    // 애플 영수증은 한 통에 여러 앱이 나란히 적힌다. 메일 한 통을 후보 하나로 읽었더니 키워드
    // 표에서 앞선 아이클라우드만 남고, 그 이름에 굿노트의 금액·주기(연간 13,000원)가 붙었다.
    // 굿노트는 후보에 아예 나타나지 않아, 파싱을 다시 돌려도 등록할 수 없었다.
    const items = parseReceiptEmails(
      mail(
        "귀하의 영수증입니다.",
        [
          "APPLE 계정",
          "Goodnotes 6",
          "연간 구독 (자동 갱신)",
          "₩13,000",
          "iCloud+ 50GB",
          "월간 구독 (자동 갱신)",
          "₩1,100",
          "합계 ₩14,100",
        ].join("\n"),
        "Apple <no_reply@email.apple.com>",
      ),
      { now: NOW },
    );

    const goodnotes = items.find((item) => item.presetId === "goodnotes");
    const icloud = items.find((item) => item.presetId === "apple-icloud");

    expect(goodnotes).toBeDefined();
    expect(goodnotes!.name).toBe("굿노트");
    expect(goodnotes!.amount).toBe(13000);
    expect(goodnotes!.billingCycle).toBe("yearly");
    expect(goodnotes!.confidence).toBe("high");

    expect(icloud).toBeDefined();
    expect(icloud!.amount).toBe(1100);
    expect(icloud!.billingCycle).toBe("monthly");

    // 두 항목이 각자의 줄로 남는다.
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
  });

  it("항목을 나눌 때 금액이 없는 조각은 후보가 되지 않는다", () => {
    // 하단 안내에 이름만 스친 서비스를 후보로 만들면, 결제하지도 않은 구독이 등록된다.
    const items = parseReceiptEmails(
      mail(
        "귀하의 영수증입니다.",
        "APPLE 계정\nGoodnotes 6\n연간 구독 (자동 갱신)\n₩13,000\n합계 ₩13,000\n" +
          "Apple Music을 무료로 사용해 보세요.",
        "Apple <no_reply@email.apple.com>",
      ),
      { now: NOW },
    );

    expect(items.map((item) => item.presetId)).toEqual(["goodnotes"]);
  });

  it("어느 앱인지 모를 때 쓰는 묶음 프리셋은 조각을 만들지 않는다", () => {
    // 'apple.com/bill'은 애플 영수증 어디에나 있는 안내라, 이것으로 조각을 하나 더 만들면
    // 결제하지 않은 '앱스토어 구독'이 옆 항목의 금액을 달고 등록된다.
    const items = parseReceiptEmails(
      mail(
        "귀하의 영수증입니다.",
        "APPLE 계정\nGoodnotes 6\n연간 구독 (자동 갱신)\n₩13,000\n" +
          "청구 내역은 apple.com/bill 에서 확인하세요.",
        "Apple <no_reply@email.apple.com>",
      ),
      { now: NOW },
    );

    expect(items.map((item) => item.presetId)).toEqual(["goodnotes"]);
  });
});

describe("붙여넣은 영수증의 결제일", () => {
  const receipt = (line: string) => `상품명 : 넷플릭스
결제금액 : 17,000원
${line}`;

  it("연도가 붙은 날짜에서 연도를 월로 읽지 않는다", () => {
    // "2026.09.05"를 월·일만 훑으면 연도 끝과 월이 "6.09"로 붙어 9일이 됐다.
    expect(parsePaymentSms(receipt("2026.09.05 결제 완료"))[0].billingDay).toBe(5);
    expect(parsePaymentSms(receipt("2026-09-05 결제 완료"))[0].billingDay).toBe(5);
    expect(parsePaymentSms(receipt("2026년 9월 5일 결제"))[0].billingDay).toBe(5);
  });

  it("결제일 라벨이 달라도 읽는다", () => {
    for (const label of ["승인일자", "승인일", "거래일시", "이용일", "결제 완료일", "Date"]) {
      expect(parsePaymentSms(receipt(`${label} : 2026.09.05`))[0].billingDay).toBe(5);
    }
  });

  it("전화번호를 날짜로 읽지 않는다", () => {
    // "02-1234-5678"에서 "02-12"를 집어 12일로 등록하던 것.
    const parsed = parsePaymentSms(
      receipt(`문의: 02-1234-5678
2026.09.05 결제`),
    )[0];
    expect(parsed.billingDay).toBe(5);
  });
});

describe("붙여넣은 영수증의 금액", () => {
  const receipt = (amountLine: string) =>
    `상품명 : 넷플릭스
${amountLine}
결제일시 : 2026.09.05`;

  it("라벨 뒤에 통화 표시가 없어도 읽는다", () => {
    expect(parsePaymentSms(receipt("결제금액 : 17,000"))[0].amount).toBe(17000);
    expect(parsePaymentSms(receipt("결제금액 : KRW 17,000"))[0].amount).toBe(17000);
  });

  it("라벨이 가리키는 금액을 본문의 다른 숫자보다 먼저 쓴다", () => {
    const parsed = parsePaymentSms(
      `상품명 : 넷플릭스
결제금액 : 17,000
적립 500원
결제일시 : 2026.09.05`,
    )[0];
    expect(parsed.amount).toBe(17000);
  });

  it("달러 영수증을 원으로 읽지 않는다", () => {
    const dollars = parsePaymentSms(receipt("결제금액 : 20.00 USD"))[0];
    expect(dollars.currency).toBe("USD");
    expect(dollars.amount).toBe(20);
  });

  it("서비스 이름이 없어도 금액이 있으면 후보로 남긴다", () => {
    const parsed = parsePaymentSms(`결제금액 : 17,000원
결제일시 : 2026.09.05`)[0];
    expect(parsed.name).toContain("알 수 없는 결제");
    expect(parsed.amount).toBe(17000);
  });
});

describe("결제 주기가 하나뿐인 서비스", () => {
  const NOW = new Date("2026-09-23T03:00:00.000Z");
  // 애플 영수증은 앱 이름·갱신일·금액만 적고 '연간'이라고 쓰지 않을 때가 있다.
  const MARCH_GOODNOTES = {
    from: "Apple <no_reply@email.apple.com>",
    subject: "Apple 영수증",
    date: "2026-03-12T03:00:00.000Z",
    body: [
      "영수증",
      "Apple 계정",
      "주문 ID MT4ABCD123",
      "App Store",
      "Goodnotes: AI Notes, Docs, PDF",
      "Goodnotes 6",
      "2027년 3월 12일에 갱신",
      "₩13,000",
      "합계 ₩13,000",
    ].join("\n"),
  };

  it("굿노트는 영수증에 '연간'이 없어도 연 결제로 읽고, 반년 전 영수증을 오래됐다고 하지 않는다", () => {
    // 1년 단위 결제뿐인 굿노트의 3월 영수증이 월 결제로 읽혀, 35일이 지난 '오래된 메일'로 체크가
    // 풀린 채 남았다. 자동으로 등록되지 않았다.
    const [item] = parseReceiptEmails([MARCH_GOODNOTES], { now: NOW, timeZone: "Asia/Seoul" });

    expect(item.presetId).toBe("goodnotes");
    expect(item.amount).toBe(13000);
    expect(item.billingCycle).toBe("yearly");
    expect(item.billingMonth).toBe(3);
    expect(item.billingDay).toBe(12);
    expect(item.confidence).toBe("high");
    expect(item.selected).toBe(true);
    expect(item.isWithin30Days).toBe(true);
  });

  it("결제 주기가 정해지지 않은 서비스는 여전히 영수증의 말을 따른다", () => {
    const [item] = parseReceiptEmails(
      [{ ...MARCH_GOODNOTES, body: MARCH_GOODNOTES.body.replace(/Goodnotes/g, "iCloud+") }],
      { now: NOW, timeZone: "Asia/Seoul" },
    );

    expect(item.presetId).toBe("apple-icloud");
    expect(item.billingCycle).toBe("monthly");
  });
});
