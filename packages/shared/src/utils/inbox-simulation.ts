import { DiscoveredSubscription, EmailReceipt } from "../types";
import { POPULAR_SERVICES } from "../constants/services";

/**
 * The inbox-scan preview's fixture data.
 *
 * Nothing here reads a real mailbox. These functions build example receipts so
 * the preview can demonstrate how the active-subscription filter behaves, and
 * they live apart from `parser.ts` for two reasons: the real parser is a third
 * of the size once the fixtures are out of it, and when a genuine Gmail/Naver
 * integration lands this file is deleted whole rather than picked apart.
 *
 * The preview stays behind `NEXT_PUBLIC_SHOW_INBOX_PREVIEW`, off by default.
 */

/**
 * Checks if an email belongs to known demo/sample test accounts.
 */
export function isDemoOrTestAccount(email?: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!lower) return false;
  const known = [
    "myaccount@gmail.com",
    "myaccount@naver.com",
    "testuser@gmail.com",
    "myuser@naver.com",
    "unified_user@example.com",
    "test@example.com",
    "user@gmail.com",
    "user@naver.com",
  ];
  if (known.includes(lower)) return true;
  if (lower.endsWith("@example.com")) return true;
  if (lower.includes("test") || lower.includes("demo") || lower.includes("sample")) return true;
  if (lower.startsWith("myaccount") || lower.startsWith("myuser")) return true;
  return false;
}

/**
 * Returns simulated email receipts found in a Google inbox.
 */
export function getSimulatedGoogleInboxReceipts(
  now: Date = new Date(),
  recipientEmail?: string,
): EmailReceipt[] {
  const formatDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };

  const targetEmail = recipientEmail || "myaccount@gmail.com";
  const idSuffix = recipientEmail ? `-${recipientEmail.replace(/[^a-zA-Z0-9]/g, "")}` : "";

  const receipts: EmailReceipt[] = [
    {
      id: "rcpt-google-youtube",
      sender: "Google Play",
      senderEmail: "googleplay-noreply@google.com",
      subject: "Google Play 결제 영수증: YouTube Premium (₩14,900)",
      receivedDate: formatDate(15),
      daysAgo: 15,
      amount: 14900,
      currency: "KRW",
      serviceName: "유튜브 프리미엄",
      matchedPresetId: "youtube-premium",
      billingDay: 22,
      snippet: "YouTube Premium 멤버십 요금 ₩14,900이 Google Play를 통해 정기 결제되었습니다.",
      isWithin30Days: true,
      cancelUrl: "https://www.youtube.com/paid_memberships",
      cancelGuide: "1. 프로필 > [구매 항목 및 멤버십] 선택\n2. [비활성화] 클릭",
      category: "ott",
      paymentMethod: "google_play",
      provider: "google",
    },
    {
      id: "rcpt-google-ai",
      sender: "Google Play",
      senderEmail: "googleplay-noreply@google.com",
      subject: "Google Play 결제 영수증: Google AI Pro (₩29,000)",
      receivedDate: formatDate(6),
      daysAgo: 6,
      amount: 29000,
      currency: "KRW",
      serviceName: "Google AI Pro (Gemini Advanced)",
      matchedPresetId: "google-ai-pro",
      billingDay: 31,
      snippet:
        "Google Play 결제 영수증: Google One AI Premium (Google AI Pro) 멤버십 ₩29,000 정기 결제 완료.",
      isWithin30Days: true,
      cancelUrl: "https://play.google.com/store/account/subscriptions",
      cancelGuide:
        "1. Google Play 접속 > [결제 및 정기결제] > [정기결제] 선택\n2. Google AI Pro 멤버십 선택\n3. [구독 취소] 클릭하여 해지 완료",
      category: "ai",
      paymentMethod: "google_play",
      provider: "google",
    },
    {
      id: "rcpt-google-claude",
      sender: "Anthropic",
      senderEmail: "invoice+statements@anthropic.com",
      subject: "Your receipt from Anthropic, PBC - Claude Pro ($20.00)",
      receivedDate: formatDate(10),
      daysAgo: 10,
      amount: 20,
      currency: "USD",
      serviceName: "클로드 프로 (Claude Pro)",
      matchedPresetId: "claude-pro",
      billingDay: 27,
      snippet:
        "Receipt from Anthropic, PBC: Claude Pro monthly subscription ($20.00) 결제가 정상 완료되었습니다.",
      isWithin30Days: true,
      cancelUrl: "https://claude.ai/settings/billing",
      cancelGuide:
        "1. claude.ai 접속 후 좌측 하단 프로필/계정 클릭\n2. [Settings] > [Billing] 선택\n3. [Cancel Plan] 클릭하여 해지 완료",
      category: "ai",
      paymentMethod: "credit_card",
      provider: "google",
      emailType: "payment",
    },
    {
      id: "rcpt-google-netflix",
      sender: "Netflix Korea",
      senderEmail: "service@netflix.com",
      subject: "Netflix 멤버십 요금 ₩17,000 결제 영수증",
      receivedDate: formatDate(114),
      daysAgo: 114,
      amount: 17000,
      currency: "KRW",
      serviceName: "넷플릭스",
      matchedPresetId: "netflix",
      billingDay: 15,
      snippet: "회원님의 멤버십 요금 ₩17,000이 결제되었습니다. (이후 30일 이내 청구 내역 없음)",
      isWithin30Days: false,
      cancelUrl: "https://www.netflix.com/cancelplan",
      cancelGuide: "계정 > [멤버십 해지] 클릭",
      category: "ott",
      paymentMethod: "credit_card",
      provider: "google",
    },
    {
      id: "rcpt-google-coupang",
      sender: "쿠팡",
      senderEmail: "receipt@coupang.com",
      subject: "[쿠팡] 와우 멤버십 월회비 ₩7,890 자동결제 완료 안내",
      receivedDate: formatDate(70),
      daysAgo: 70,
      amount: 7890,
      currency: "KRW",
      serviceName: "쿠팡 와우 (쿠팡플레이)",
      matchedPresetId: "coupang-wow",
      billingDay: 28,
      snippet: "와우 멤버십 월회비 ₩7,890이 결제되었습니다. (이후 30일 이내 추가 결제 없음)",
      isWithin30Days: false,
      cancelUrl: "https://m.coupang.com/",
      cancelGuide: "마이쿠팡 > 와우 멤버십 > 해지하기",
      category: "ott",
      paymentMethod: "credit_card",
      provider: "google",
    },
    {
      id: "rcpt-google-chatgpt",
      sender: "OpenAI / Stripe",
      senderEmail: "receipts@stripe.com",
      subject: "Invoice from OpenAI, LLC for ChatGPT Plus ($20.00)",
      receivedDate: formatDate(67),
      daysAgo: 67,
      amount: 20,
      currency: "USD",
      serviceName: "ChatGPT Plus",
      matchedPresetId: "chatgpt-plus",
      billingDay: 1,
      snippet: "Invoice for ChatGPT Plus subscription ($20.00). (최근 30일 이내 갱신 내역 없음)",
      isWithin30Days: false,
      cancelUrl: "https://chatgpt.com/",
      cancelGuide: "좌측 하단 프로필 > My Plan > Cancel Plan",
      category: "ai",
      paymentMethod: "credit_card",
      provider: "google",
    },
    {
      id: "rcpt-google-disney",
      sender: "Disney+",
      senderEmail: "disneyplus@mail.disneyplus.com",
      subject: "[Disney+] 디즈니+ 프리미엄 멤버십 결제 영수증 (₩13,900)",
      receivedDate: formatDate(55),
      daysAgo: 55,
      amount: 13900,
      currency: "KRW",
      serviceName: "디즈니플러스",
      matchedPresetId: "disney-plus",
      billingDay: 18,
      snippet:
        "Disney+ 프리미엄 월간 멤버십 요금 ₩13,900 결제가 완료되었습니다. (최근 30일 이내 추가 갱신 없음)",
      isWithin30Days: false,
      cancelUrl: "https://www.disneyplus.com/commerce/account",
      cancelGuide: "계정 설정 > [멤버십] > [멤버십 취소] 클릭",
      category: "ott",
      paymentMethod: "credit_card",
      provider: "google",
      emailType: "payment",
    },
    {
      id: "rcpt-google-prime",
      sender: "Amazon Prime Video",
      senderEmail: "digital-no-reply@amazon.com",
      subject: "Amazon Prime Video Monthly Subscription ($5.99)",
      receivedDate: formatDate(95),
      daysAgo: 95,
      amount: 5.99,
      currency: "USD",
      serviceName: "아마존 프라임 비디오",
      matchedPresetId: "prime-video",
      billingDay: 11,
      snippet:
        "Your monthly subscription to Amazon Prime Video has renewed for $5.99. (최근 30일 초과 과거 결제)",
      isWithin30Days: false,
      cancelUrl: "https://www.primevideo.com/settings",
      cancelGuide: "프로필 > [계정 및 설정] > [내 멤버십] > [멤버십 종료]",
      category: "ott",
      paymentMethod: "credit_card",
      provider: "google",
      emailType: "payment",
    },
    {
      id: "rcpt-google-apple-tv-cancel",
      sender: "Apple",
      senderEmail: "no_reply@email.apple.com",
      subject: "[Apple] Apple TV+ 정기구독 취소 및 만료 안내",
      receivedDate: formatDate(38),
      daysAgo: 38,
      amount: 6500,
      currency: "KRW",
      serviceName: "애플 TV+ (Apple TV+)",
      matchedPresetId: "apple-tv",
      billingDay: 26,
      snippet: "Apple TV+ 구독이 취소되었습니다. 다음 결제일부터 추가 요금이 청구되지 않습니다.",
      isWithin30Days: false,
      cancelUrl: "https://tv.apple.com/",
      cancelGuide: "tv.apple.com 또는 Apple 기기 설정 > [구독] > [구독 취소]",
      category: "ott",
      paymentMethod: "apple_iap",
      provider: "google",
      emailType: "cancellation",
    },
    {
      id: "rcpt-google-apple-tv",
      sender: "Apple",
      senderEmail: "no_reply@email.apple.com",
      subject: "Apple의 영수증: Apple TV+ 멤버십 (₩6,500)",
      receivedDate: formatDate(40),
      daysAgo: 40,
      amount: 6500,
      currency: "KRW",
      serviceName: "애플 TV+ (Apple TV+)",
      matchedPresetId: "apple-tv",
      billingDay: 26,
      snippet: "Apple TV+ 월간 멤버십 요금 ₩6,500 결제 완료 (38일 전 해지 완료 메일 수신됨)",
      isWithin30Days: false,
      cancelUrl: "https://tv.apple.com/",
      cancelGuide: "tv.apple.com 또는 Apple 기기 설정 > [구독] > [구독 취소]",
      category: "ott",
      paymentMethod: "apple_iap",
      provider: "google",
      emailType: "payment",
    },
  ];

  return receipts.map((r) => ({
    ...r,
    id: `${r.id}${idSuffix}`,
    recipientEmail: targetEmail,
  }));
}

/**
 * Returns simulated email receipts found in a Naver inbox.
 * Includes both payment receipts and subsequent cancellation notices to test realistic mailbox state.
 */
export function getSimulatedNaverInboxReceipts(
  now: Date = new Date(),
  recipientEmail?: string,
): EmailReceipt[] {
  const formatDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().split("T")[0];
  };

  const targetEmail = recipientEmail || "myaccount@naver.com";
  const idSuffix = recipientEmail ? `-${recipientEmail.replace(/[^a-zA-Z0-9]/g, "")}` : "";

  const receipts: EmailReceipt[] = [
    {
      id: "rcpt-naver-shopping",
      sender: "네이버페이",
      senderEmail: "help@naverpay.com",
      subject: "[네이버페이] 일반 상품 결제내역 안내 (₩32,000)",
      receivedDate: formatDate(2),
      daysAgo: 2,
      amount: 32000,
      currency: "KRW",
      serviceName: "네이버 쇼핑 일반 결제",
      billingDay: 4,
      snippet:
        "네이버페이 일반 주문 결제: 상품 구매 ₩32,000 결제가 완료되었습니다. (단발성 결제, 정기구독 아님)",
      isWithin30Days: false,
      category: "shopping",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "onetime",
    },
    {
      id: "rcpt-naver-tving-cancel",
      sender: "TVING",
      senderEmail: "ticket@tving.com",
      subject: "[TVING] 티빙 방송 무제한 정기결제 해지 완료 안내",
      receivedDate: formatDate(1), // 1일 전 해지 완료 메일 수신!
      daysAgo: 1,
      amount: 13900,
      currency: "KRW",
      serviceName: "티빙",
      matchedPresetId: "tving",
      billingDay: 3,
      snippet:
        "회원님의 티빙 자동결제 이용권 해지 신청이 정상 처리되었습니다. 추가 요금이 결제되지 않습니다.",
      isWithin30Days: false,
      cancelUrl: "https://www.tving.com/my/subscribe",
      cancelGuide: "1. 티빙 앱/웹 마이페이지 > [나의 이용권]\n2. [변경/해지] > [자동결제 해지]",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "cancellation",
    },
    {
      id: "rcpt-naver-tving",
      sender: "TVING",
      senderEmail: "ticket@tving.com",
      subject: "[TVING] 티빙 방송 무제한 정기 결제 영수증 (₩13,900)",
      receivedDate: formatDate(3), // 3일 전 결제 (1일 전 해지됨)
      daysAgo: 3,
      amount: 13900,
      currency: "KRW",
      serviceName: "티빙",
      matchedPresetId: "tving",
      billingDay: 3,
      snippet: "티빙(TVING) 정기 결제 ₩13,900이 승인되었습니다. (1일 전 해지 완료 메일 수신됨)",
      isWithin30Days: false, // 해지 메일로 인해 비활성화됨
      cancelUrl: "https://www.tving.com/my/subscribe",
      cancelGuide: "1. 티빙 앱/웹 마이페이지 > [나의 이용권]\n2. [변경/해지] > [자동결제 해지]",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-plus-cancel",
      sender: "네이버페이",
      senderEmail: "help@naverpay.com",
      subject: "[네이버페이] 네이버플러스 멤버십 정기결제 해지 완료 안내",
      receivedDate: formatDate(5), // 5일 전 해지 완료 메일 수신!
      daysAgo: 5,
      amount: 4900,
      currency: "KRW",
      serviceName: "네이버플러스",
      matchedPresetId: "naver-plus",
      billingDay: 27,
      snippet:
        "네이버플러스 멤버십 정기결제가 해지 처리되었습니다. 다음 회차부터 결제되지 않습니다.",
      isWithin30Days: false,
      cancelUrl: "https://nid.naver.com/membership/my",
      cancelGuide:
        "1. 네이버플러스 멤버십 마이페이지 > [멤버십 관리]\n2. 하단 [네이버플러스 멤버십 해지하기]",
      category: "shopping",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "cancellation",
    },
    {
      id: "rcpt-naver-plus",
      sender: "네이버페이",
      senderEmail: "help@naverpay.com",
      subject: "[네이버페이] 네이버플러스 멤버십 정기결제 완료 안내 (₩4,900)",
      receivedDate: formatDate(10), // 10일 전 결제 (5일 전 해지됨)
      daysAgo: 10,
      amount: 4900,
      currency: "KRW",
      serviceName: "네이버플러스",
      matchedPresetId: "naver-plus",
      billingDay: 27,
      snippet:
        "네이버플러스 멤버십 월간 정기이용권 ₩4,900 결제 완료 (5일 전 해지 완료 메일 수신됨)",
      isWithin30Days: false, // 해지 메일로 인해 비활성화됨
      cancelUrl: "https://nid.naver.com/membership/my",
      cancelGuide:
        "1. 네이버플러스 멤버십 마이페이지 > [멤버십 관리]\n2. 하단 [네이버플러스 멤버십 해지하기]",
      category: "shopping",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-melon",
      sender: "Melon",
      senderEmail: "member@melon.com",
      subject: "[Melon] 스트리밍 클럽 정기 결제 영수증 (₩10,900)",
      receivedDate: formatDate(85), // 85일 전 수신 (해지 상태)
      daysAgo: 85,
      amount: 10900,
      currency: "KRW",
      serviceName: "멜론",
      matchedPresetId: "melon",
      billingDay: 12,
      snippet: "멜론 스트리밍 클럽 ₩10,900 결제 완료 (최근 30일 이내 추가 결제 영수증 없음)",
      isWithin30Days: false,
      cancelUrl: "https://www.melon.com/",
      cancelGuide: "멜론 내 정보 > [이용권 해지신청]",
      category: "music",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-mybox",
      sender: "네이버 클라우드",
      senderEmail: "navercloud_noreply@naver.com",
      subject: "[네이버 클라우드] MYBOX 80GB 이용권 정기결제 (₩1,650)",
      receivedDate: formatDate(90), // 90일 전 수신 (해지 상태)
      daysAgo: 90,
      amount: 1650,
      currency: "KRW",
      serviceName: "네이버 MYBOX",
      matchedPresetId: "naver-mybox",
      billingDay: 8,
      snippet: "네이버 MYBOX 80GB 정기결제 ₩1,650 완료. (최근 30일 이내 추가 갱신 없음)",
      isWithin30Days: false,
      cancelUrl: "https://mybox.naver.com/",
      cancelGuide: "네이버 MYBOX 환경설정 > [용량 관리/이용권] > [정기결제 해지]",
      category: "cloud",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-wavve-cancel",
      sender: "콘텐츠웨이브",
      senderEmail: "help@wavve.com",
      subject: "[웨이브] 정기이용권 자동결제 해지 완료 안내",
      receivedDate: formatDate(58),
      daysAgo: 58,
      amount: 13900,
      currency: "KRW",
      serviceName: "웨이브",
      matchedPresetId: "wavve",
      billingDay: 14,
      snippet: "회원님의 웨이브 정기이용권 자동결제 해지 신청이 정상 처리되었습니다.",
      isWithin30Days: false,
      cancelUrl: "https://www.wavve.com/my/membership",
      cancelGuide: "웨이브 로그인 후 마이페이지 > [나의 이용권] > [자동결제 해지] 완료",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "cancellation",
    },
    {
      id: "rcpt-naver-wavve",
      sender: "콘텐츠웨이브",
      senderEmail: "help@wavve.com",
      subject: "[웨이브] 정기이용권 결제 완료 안내 (₩13,900)",
      receivedDate: formatDate(60),
      daysAgo: 60,
      amount: 13900,
      currency: "KRW",
      serviceName: "웨이브",
      matchedPresetId: "wavve",
      billingDay: 14,
      snippet: "웨이브 베이직 정기이용권 ₩13,900 결제 완료 (58일 전 해지 완료 메일 수신됨)",
      isWithin30Days: false,
      cancelUrl: "https://www.wavve.com/my/membership",
      cancelGuide: "웨이브 로그인 후 마이페이지 > [나의 이용권] > [자동결제 해지] 완료",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-watcha",
      sender: "왓챠",
      senderEmail: "cs@watcha.com",
      subject: "[왓챠] 베이직 이용권 정기 결제 영수증 (₩7,900)",
      receivedDate: formatDate(120),
      daysAgo: 120,
      amount: 7900,
      currency: "KRW",
      serviceName: "왓챠",
      matchedPresetId: "watcha",
      billingDay: 20,
      snippet:
        "왓챠 베이직 이용권 ₩7,900 결제가 완료되었습니다. (최근 30일 이내 추가 결제 영수증 없음)",
      isWithin30Days: false,
      cancelUrl: "https://watcha.com/settings",
      cancelGuide: "설정 > [이용권 설정] > [해지 신청]",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
    {
      id: "rcpt-naver-laftel",
      sender: "라프텔",
      senderEmail: "help@laftel.net",
      subject: "[라프텔] 애니 멤버십 월간 결제 영수증 (₩9,900)",
      receivedDate: formatDate(150),
      daysAgo: 150,
      amount: 9900,
      currency: "KRW",
      serviceName: "라프텔 (Laftel)",
      matchedPresetId: "laftel",
      billingDay: 7,
      snippet: "라프텔 애니 멤버십 ₩9,900 결제 완료 (최근 30일 이내 추가 갱신 내역 없음)",
      isWithin30Days: false,
      cancelUrl: "https://laftel.net/setting",
      cancelGuide: "라프텔 마이페이지 > [멤버십 관리] > [멤버십 해지하기]",
      category: "ott",
      paymentMethod: "naverpay",
      provider: "naver",
      emailType: "payment",
    },
  ];

  return receipts.map((r) => ({
    ...r,
    id: `${r.id}${idSuffix}`,
    recipientEmail: targetEmail,
  }));
}

/**
 * Returns simulated inbox receipts by provider (Google, Naver, or All).
 */
export function getSimulatedInboxReceipts(
  provider: "google" | "naver" | "all" = "all",
  now: Date = new Date(),
  recipientEmail?: string,
  options?: { generateSampleData?: boolean },
): EmailReceipt[] {
  if (recipientEmail) {
    const isDemo = isDemoOrTestAccount(recipientEmail);
    const shouldGenerate = options?.generateSampleData ?? isDemo;
    if (!shouldGenerate) {
      return [];
    }
  }

  if (provider === "google") {
    return getSimulatedGoogleInboxReceipts(now, recipientEmail);
  }
  if (provider === "naver") {
    return getSimulatedNaverInboxReceipts(now, recipientEmail);
  }
  return [
    ...getSimulatedGoogleInboxReceipts(now, recipientEmail),
    ...getSimulatedNaverInboxReceipts(now, recipientEmail),
  ];
}

/**
 * Simulates intelligent scanning of a user's Gmail or Naver Mail inbox for subscription receipts.
 * Performs cross-check analysis between payment receipts and cancellation notices
 * to accurately identify currently active subscriptions vs canceled ones.
 *
 * For unknown or fictional accounts (e.g. admin123@gmail.com), returns 0 items by default
 * to prevent leaking or recycling previous demo account data, unless generateSampleData: true is passed.
 */
export function simulateEmailScan(
  userEmail: string,
  options?: {
    provider?: "google" | "naver" | "auto" | "all";
    linkedAccountId?: string;
    linkedAccountName?: string;
    daysLimit?: number; // 30 = only last 30 days active subscriptions, 0 = all history
    now?: Date;
    generateSampleData?: boolean;
  },
): DiscoveredSubscription[] {
  const emailLower = userEmail.toLowerCase().trim();
  const isDemo = isDemoOrTestAccount(emailLower);
  const shouldGenerate = options?.generateSampleData ?? isDemo;

  // Unknown/fictional new email without sample mode enabled has 0 receipts (clean slate)
  if (!shouldGenerate) {
    return [];
  }

  let detectedProvider: "google" | "naver" | "all" = "google";

  if (
    options?.provider === "naver" ||
    options?.provider === "google" ||
    options?.provider === "all"
  ) {
    detectedProvider = options.provider;
  } else if (
    emailLower.endsWith("@naver.com") ||
    options?.linkedAccountName?.includes("네이버") ||
    options?.linkedAccountName?.includes("Naver")
  ) {
    detectedProvider = "naver";
  } else {
    detectedProvider = "google";
  }

  const defaultAccountName =
    detectedProvider === "naver"
      ? `네이버 (${userEmail})`
      : detectedProvider === "all"
        ? `통합 계정 (${userEmail})`
        : `Google (${userEmail})`;
  const accountName = options?.linkedAccountName || defaultAccountName;
  const accId = options?.linkedAccountId;
  const daysLimit = options?.daysLimit !== undefined ? options.daysLimit : 30;
  const now = options?.now || new Date();

  const receipts = getSimulatedInboxReceipts(detectedProvider, now, userEmail, {
    generateSampleData: shouldGenerate,
  });

  // Group receipts by service identifier (matchedPresetId or serviceName)
  const serviceGroups = new Map<string, EmailReceipt[]>();
  for (const r of receipts) {
    const key = r.matchedPresetId || r.serviceName;
    const existing = serviceGroups.get(key) || [];
    existing.push(r);
    serviceGroups.set(key, existing);
  }

  const discoveredItems: DiscoveredSubscription[] = [];
  let index = 0;

  for (const [, group] of serviceGroups.entries()) {
    // Separate payment receipts, cancellation notices, and one-time payments
    const paymentReceipts = group.filter(
      (r) => r.emailType === "payment" || (!r.emailType && r.amount > 0),
    );
    const cancelReceipts = group.filter(
      (r) =>
        r.emailType === "cancellation" ||
        r.subject.includes("해지") ||
        r.subject.includes("취소") ||
        r.snippet.includes("해지"),
    );
    const onetimeReceipts = group.filter(
      (r) =>
        r.emailType === "onetime" ||
        r.subject.includes("일반 상품") ||
        r.snippet.includes("단발성 결제"),
    );

    if (paymentReceipts.length === 0 && cancelReceipts.length === 0 && onetimeReceipts.length === 0)
      continue;

    // Sort by recency (smallest daysAgo first)
    paymentReceipts.sort((a, b) => a.daysAgo - b.daysAgo);
    cancelReceipts.sort((a, b) => a.daysAgo - b.daysAgo);
    onetimeReceipts.sort((a, b) => a.daysAgo - b.daysAgo);

    const latestPayment = paymentReceipts[0];
    const latestCancel = cancelReceipts[0];
    const latestOnetime = onetimeReceipts[0];

    const isOnetime = onetimeReceipts.length > 0 && paymentReceipts.length === 0;

    // Check cancellation: if latest cancellation notice was received on or after payment
    const isCanceled =
      !isOnetime &&
      !!latestCancel &&
      (!latestPayment || latestCancel.daysAgo <= latestPayment.daysAgo);

    const isRecentPayment = !isOnetime && !!latestPayment && latestPayment.daysAgo <= 30;
    const isActiveSubscription = isRecentPayment && !isCanceled && !isOnetime;

    // Pick representative receipt for metadata
    const rep = latestPayment || latestCancel || latestOnetime;
    const itemProvider = rep.provider || (detectedProvider === "naver" ? "naver" : "google");
    const providerLabel = itemProvider === "naver" ? "네이버 메일" : "Google 메일";

    let statusReason = "";
    if (isOnetime) {
      statusReason = `단발성 일반 결제 (${latestOnetime.daysAgo}일 전, 정기구독 아님 - 활성 제외)`;
    } else if (isCanceled) {
      statusReason = `해지 완료 확인됨 (${latestCancel.daysAgo}일 전 해지 메일: "${latestCancel.subject}")`;
    } else if (isRecentPayment) {
      statusReason = `최근 30일 내 결제 확인 (${latestPayment.daysAgo}일 전, ${latestPayment.receivedDate})`;
    } else if (latestPayment) {
      statusReason = `30일 초과 미결제 (${latestPayment.daysAgo}일 전, 해지 추정)`;
    } else {
      statusReason = `해지 안내 메일 확인됨`;
    }

    const preset = rep.matchedPresetId
      ? POPULAR_SERVICES.find((s) => s.id === rep.matchedPresetId)
      : undefined;
    const amount =
      latestPayment?.amount ||
      latestCancel?.amount ||
      latestOnetime?.amount ||
      preset?.defaultAmount ||
      0;

    const discovered: DiscoveredSubscription = {
      id: `${itemProvider}-${rep.matchedPresetId || "item"}-${Date.now()}-${index++}`,
      name: rep.serviceName,
      amount,
      currency: rep.currency,
      billingDay: rep.billingDay,
      billingCycle: "monthly",
      category: rep.category || preset?.category || "other",
      cancelUrl: rep.cancelUrl || preset?.cancelUrl,
      cancelGuide: rep.cancelGuide || preset?.cancelGuide,
      paymentMethod: rep.paymentMethod || preset?.id ? rep.paymentMethod : "credit_card",
      linkedAccountId: accId,
      linkedAccountName: accountName,
      recipientEmail: userEmail,
      source: "gmail",
      emailProvider: itemProvider,
      sourceSnippet: `[${providerLabel}] ${rep.sender} | ${rep.receivedDate}: "${rep.subject}" (수신: ${userEmail})`,
      confidence: "high",
      selected: isActiveSubscription,
      receiptDate:
        latestPayment?.receivedDate || latestCancel?.receivedDate || latestOnetime?.receivedDate,
      daysAgo: latestPayment?.daysAgo ?? latestCancel?.daysAgo ?? latestOnetime?.daysAgo,
      isWithin30Days: isActiveSubscription,
      isCanceled,
      cancellationDate: latestCancel?.receivedDate,
      cancellationSnippet: latestCancel ? `[해지 안내] ${latestCancel.subject}` : undefined,
      statusReason,
    };

    // Filter by daysLimit:
    // When daysLimit === 30: only return currently active subscriptions
    // When daysLimit === 0: return all subscriptions with status indications
    if (daysLimit > 0) {
      if (isActiveSubscription) {
        discoveredItems.push(discovered);
      }
    } else {
      discoveredItems.push(discovered);
    }
  }

  return discoveredItems;
}

// Backwards compatibility aliases
export const simulateGmailScan = simulateEmailScan;
export function simulateNaverScan(
  userEmail: string,
  options?: Parameters<typeof simulateEmailScan>[1],
) {
  return simulateEmailScan(userEmail, { ...options, provider: "naver" });
}
