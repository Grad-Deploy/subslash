import {
  BillingCycle,
  DiscoveredSubscription,
  EmailReceipt,
  SubscriptionCategory,
  PaymentMethod,
  Currency,
} from "../types";
import { POPULAR_SERVICES, ServicePreset } from "../constants/services";

// Known keyword mapping for popular services
const SERVICE_KEYWORDS: {
  keywords: string[];
  presetId: string;
  defaultPaymentMethod?: PaymentMethod;
}[] = [
  { keywords: ["넷플릭스", "netflix", "넷플릭스코리아"], presetId: "netflix" },
  {
    keywords: ["유튜브", "youtube", "youtube premium", "유튜브 프리미엄", "구글페이먼트(유튜브)"],
    presetId: "youtube-premium",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: ["쿠팡", "와우", "coupang", "와우멤버십", "쿠팡플레이", "coupang play"],
    presetId: "coupang-wow",
  },
  { keywords: ["티빙", "tving"], presetId: "tving" },
  { keywords: ["웨이브", "wavve", "콘텐츠웨이브"], presetId: "wavve" },
  { keywords: ["왓챠", "watcha", "왓챠플레이"], presetId: "watcha" },
  { keywords: ["디즈니", "disney", "디즈니플러스", "disney+", "디즈니+"], presetId: "disney-plus" },
  {
    keywords: ["애플tv", "애플티비", "apple tv", "apple tv+", "애플 tv", "appletv"],
    presetId: "apple-tv",
    defaultPaymentMethod: "apple_iap",
  },
  {
    keywords: ["프라임 비디오", "아마존 프라임", "prime video", "amazon prime", "primevideo"],
    presetId: "prime-video",
    defaultPaymentMethod: "credit_card",
  },
  { keywords: ["라프텔", "laftel", "애니메이션 라프텔"], presetId: "laftel" },
  { keywords: ["스포티파이", "spotify"], presetId: "spotify" },
  { keywords: ["멜론", "melon", "로엔"], presetId: "melon" },
  {
    keywords: ["네이버플러스", "네이버 멤버십", "네이버페이 멤버십"],
    presetId: "naver-plus",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: [
      "naver mybox",
      "마이박스",
      "mybox",
      "네이버 클라우드",
      "네이버클라우드",
      "naver cloud",
    ],
    presetId: "naver-mybox",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: ["vibe", "바이브", "네이버 바이브", "naver vibe"],
    presetId: "naver-vibe",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: ["쿠키", "네이버 웹툰", "네이버웹툰", "웹툰 쿠키", "cookie"],
    presetId: "naver-webtoon",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: ["카카오 이모티콘", "이모티콘 플러스", "톡서랍"],
    presetId: "kakao-emoticon",
    defaultPaymentMethod: "kakaopay",
  },
  {
    keywords: ["아이클라우드", "icloud", "apple.com/bill", "apple.com"],
    presetId: "apple-icloud",
    defaultPaymentMethod: "apple_iap",
  },
  {
    keywords: ["구글원", "google one", "google storage"],
    presetId: "google-one",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: [
      "google ai pro",
      "google ai",
      "구글 ai 프로",
      "구글 ai",
      "구글ai",
      "gemini advanced",
      "제미나이",
      "google one ai",
      "ai pro",
      "google ai premium",
    ],
    presetId: "google-ai-pro",
    defaultPaymentMethod: "google_play",
  },
  { keywords: ["notion", "노션"], presetId: "notion" },
  { keywords: ["chatgpt", "openai", "챗gpt"], presetId: "chatgpt-plus" },
  {
    keywords: [
      "claude",
      "클로드",
      "anthropic",
      "앤트로픽",
      "앤쓰로픽",
      "claude pro",
      "클로드 프로",
      "claude ai",
      "claude.ai",
    ],
    presetId: "claude-pro",
    defaultPaymentMethod: "credit_card",
  },
  { keywords: ["어도비", "adobe"], presetId: "adobe-cc" },
  { keywords: ["마이크로소프트", "microsoft", "ms 365", "m365"], presetId: "microsoft-365" },
  { keywords: ["밀리", "밀리의 서재", "millie"], presetId: "millie" },
  { keywords: ["리디", "리디셀렉트", "ridi"], presetId: "ridi-select" },
];

/**
 * Parses raw SMS / push notification text containing payment approvals
 * Handles multi-line or multi-message input.
 */
/**
 * Wording that marks a receipt as a yearly plan.
 *
 * Deliberately narrow: reading a monthly plan as yearly divides the reported
 * cost by twelve, which is just as wrong in the other direction.
 */
const YEARLY_HINT =
  /연간|연\s*결제|1년|12개월|년\s*이용권|연회비|annual|yearly|per\s*year|\/\s*yr/i;

/**
 * Every preset the keyword table points at.
 *
 * Exported so a test can prove each one resolves: a typo here fails silently —
 * the lookup returns undefined, the receipt keeps scanning other keywords, and
 * the subscription is imported with no cancel URL, no category and a fallback
 * name, without anything reporting an error.
 */
export const SERVICE_KEYWORD_PRESET_IDS = SERVICE_KEYWORDS.map((item) => item.presetId);

/**
 * Where one pasted message ends and the next begins.
 *
 * Korean card SMS is routinely multi-line — the bank header, the amount and the
 * merchant each get their own line — so a boundary has to be a *message*
 * header, never merely "a line that mentions an amount". Splitting on the
 * amount tore single messages in half: the merchant name stayed in one block
 * and the money went to another, so the block holding the amount had no service
 * to match and got named after whatever token survived cleaning ("03/11").
 *
 * A new message starts at a forwarding marker, a blank line, a divider rule, or
 * a line opening with a bracketed sender, a card issuer, a bank or a payment
 * provider. The colon guard keeps receipt fields such as "결제카드 : 신한카드"
 * from reading as the start of another message.
 */
const MESSAGE_BOUNDARY =
  /(?=\[Web발신\])|\n\s*[-=_]{3,}\s*\n|\n\s*\n|(?<=\n)(?=\s*(?:\[[^\]\n]{1,24}\]|[가-힣A-Za-z]{1,10}(?:카드|은행|페이|페이먼트)(?!\s*[:：])|토스|PAYCO))/i;

export function parsePaymentSms(
  rawText: string,
  options?: { linkedAccountId?: string; linkedAccountName?: string },
): DiscoveredSubscription[] {
  if (!rawText || !rawText.trim()) return [];

  // Normalize newlines
  const clean = rawText.replace(/\r\n/g, "\n");

  // Check if the text contains structured email receipt fields (e.g. 상품명 : ..., 결제금액 : ...)
  const hasStructuredReceiptFields = /(?:상품명|주문상품|서비스명)\s*[:：]/i.test(clean);

  let rawBlocks: string[];
  if (hasStructuredReceiptFields) {
    // For structured email receipts: split by dividers (---, ===) or double newlines or new message headers
    rawBlocks = clean
      .split(
        /(?:\n\s*[-=_]{3,}\s*\n|\n\s*\n\s*\n|(?<=\n)(?=\[Web발신\]|\[.+?(?:페이|카드|결제|영수증|알림)\]))/i,
      )
      .map((b) => b.trim())
      .filter((b) => b.length > 5);
  } else {
    rawBlocks = clean
      .split(MESSAGE_BOUNDARY)
      .map((b) => b.trim())
      .filter((b) => b.length > 5);
  }

  const blocksToProcess =
    rawBlocks.length > 0
      ? rawBlocks
      : clean
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .filter((b) => b.length > 5);

  const results: DiscoveredSubscription[] = [];

  for (let i = 0; i < blocksToProcess.length; i++) {
    const block = blocksToProcess[i];
    const parsed = parseSingleMessageBlock(block, i, options);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/** Receipt field labels, which name the row rather than the merchant. */
const FIELD_LABELS = [
  "결제금액",
  "총결제금액",
  "청구금액",
  "이용금액",
  "결제일",
  "결제일시",
  "승인일시",
  "결제수단",
  "결제카드",
  "카드번호",
  "주문번호",
  "상품명",
  "서비스명",
  "가맹점",
  "이용기간",
  "다음결제일",
];

/**
 * Whether a leftover token could plausibly be the merchant.
 *
 * The fallback name is whatever survives cleaning, so without this a card SMS
 * whose merchant was never recognised ends up registered as "03/11", and a
 * receipt as "결제금액". Both read like real subscriptions in the list, which
 * is worse than admitting the merchant is unknown.
 */
function looksLikeMerchantName(word: string): boolean {
  const token = word.replace(/[[\](){}:：,]/g, "").trim();
  if (!token) return false;
  // Dates, times and bare numbers: 03/11, 2026-03-11, 14:22, 17000
  if (/^[0-9]+(?:[./:-][0-9]+)*$/.test(token)) return false;
  return !FIELD_LABELS.includes(token);
}

function parseSingleMessageBlock(
  block: string,
  index: number,
  options?: { linkedAccountId?: string; linkedAccountName?: string },
): DiscoveredSubscription | null {
  const normalized = block.replace(/\r/g, " ");
  const lower = normalized.toLowerCase();

  // 1. Structured Field Extraction for Naver / Email Receipts
  // e.g. "상품명 : VIBE 무제한 듣기 (정기결제)" / "서비스명: 네이버 MYBOX" / "가맹점: 스포티파이"
  const productMatch = block.match(
    /(?:상품명|서비스명|주문상품|구매상품|가맹점)\s*[:：]\s*([^\n\r]+)/i,
  );
  let structuredProductName = productMatch ? productMatch[1].trim() : "";
  if (structuredProductName) {
    structuredProductName = structuredProductName
      .replace(/\s*\((?:정기결제|반복결제|자동결제|월간|연간|1개월|매월|이용권|개인)[^)]*\)/gi, "")
      .trim();
  }

  // 2. Extract Amount & Currency
  let amount = 0;
  let currency: Currency = "KRW";

  // Check structured amount field first (e.g. "결제금액 : 8,500원", "총 결제금액: 10,000원")
  const explicitAmountMatch = block.match(
    /(?:결제금액|총\s*결제금액|청구금액|이용금액|결제\s*금액)\s*[:：]?\s*(?:₩\s*([0-9,]+)|([0-9,]+)\s*원)/i,
  );

  if (explicitAmountMatch) {
    const rawVal = (explicitAmountMatch[1] || explicitAmountMatch[2]).replace(/,/g, "");
    const parsedVal = parseInt(rawVal, 10);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      amount = parsedVal;
      currency = "KRW";
    }
  }

  if (amount === 0) {
    // KRW patterns: 17,000원, 17000원, ₩17,000
    const krwMatch = normalized.match(/(?:₩\s*([0-9,]+)|([0-9,]+)\s*원)/i);
    // USD patterns: $20, $0.99, 20.00 USD, 20 USD
    const usdMatch = normalized.match(/(?:\$\s*([0-9.]+)|([0-9.]+)\s*USD)/i);

    if (usdMatch) {
      const rawVal = (usdMatch[1] || usdMatch[2]).replace(/,/g, "");
      const parsedVal = parseFloat(rawVal);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        currency = "USD";
      }
    } else if (krwMatch) {
      const rawVal = (krwMatch[1] || krwMatch[2]).replace(/,/g, "");
      const parsedVal = parseInt(rawVal, 10);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        currency = "KRW";
      }
    }
  }

  // 3. Check if this is a cancellation / refund notice
  const isCanceled =
    normalized.includes("해지") ||
    normalized.includes("취소") ||
    normalized.includes("환불") ||
    normalized.includes("만료") ||
    normalized.includes("종료") ||
    lower.includes("cancel") ||
    lower.includes("refund");

  // 4. Extract Date (explicit 결제일시 or MM/DD, M월 D일, MM.DD, MM-DD)
  let billingDay = new Date().getDate();
  // Month is only carried through for yearly plans, which have no date without
  // it. Monthly plans repeat every month, so the month a receipt happens to
  // mention says nothing extra.
  let billingMonth: number | undefined;
  const explicitDateMatch = block.match(
    /(?:결제일시|결제일|승인일시|일시|다음\s*결제\s*(?:예정)?일)\s*[:：]?\s*(?:[0-9]{4}[./-]([0-9]{1,2})[./-]([0-3]?[0-9])|([0-1]?[0-9])[/.-]([0-3]?[0-9])|([0-3]?[0-9])일)/i,
  );

  const takeDate = (rawMonth?: string, rawDay?: string) => {
    const day = parseInt(rawDay ?? "", 10);
    if (isNaN(day) || day < 1 || day > 31) return false;
    billingDay = day;
    const month = parseInt(rawMonth ?? "", 10);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      billingMonth = month;
    }
    return true;
  };

  if (explicitDateMatch) {
    takeDate(
      explicitDateMatch[1] || explicitDateMatch[3],
      explicitDateMatch[2] || explicitDateMatch[4] || explicitDateMatch[5],
    );
  } else {
    // Strip currency amounts so numbers like "$20.00" are not mistaken for MM.DD
    const dateScanText = normalized.replace(/\$\s*[0-9.]+/g, "").replace(/[0-9.]+\s*USD/gi, "");
    const dateRegex =
      /(?:([0-1]?[0-9])[/.-]([0-3]?[0-9])|([0-1]?[0-9])\s*월\s*([0-3]?[0-9])\s*일)/g;
    let match: RegExpExecArray | null;
    while ((match = dateRegex.exec(dateScanText)) !== null) {
      if (takeDate(match[1] || match[3], match[2] || match[4])) break;
    }
  }

  // 4b. Yearly plans: a receipt that says so is the only place the app can
  // learn the billing cycle, and importing one as monthly multiplies the user's
  // reported fixed spend by twelve.
  const billingCycle: BillingCycle = YEARLY_HINT.test(normalized) ? "yearly" : "monthly";
  if (billingCycle !== "yearly") {
    billingMonth = undefined;
  }

  // 5. Extract Payment Method
  let paymentMethod: PaymentMethod = "credit_card";
  if (lower.includes("네이버페이") || lower.includes("naverpay") || lower.includes("naver pay")) {
    paymentMethod = "naverpay";
  } else if (lower.includes("카카오페이") || lower.includes("kakaopay")) {
    paymentMethod = "kakaopay";
  } else if (lower.includes("apple") || lower.includes("애플") || lower.includes("app store")) {
    paymentMethod = "apple_iap";
  } else if (
    lower.includes("google play") ||
    lower.includes("구글플레이") ||
    lower.includes("구글페이먼트") ||
    lower.includes("google payment")
  ) {
    paymentMethod = "google_play";
  }

  // 6. Match Known Service Preset
  let matchedPreset: ServicePreset | undefined;
  const targetToMatch = (structuredProductName + " " + lower).toLowerCase();
  for (const item of SERVICE_KEYWORDS) {
    for (const kw of item.keywords) {
      if (targetToMatch.includes(kw.toLowerCase())) {
        matchedPreset = POPULAR_SERVICES.find((s) => s.id === item.presetId);
        if (item.defaultPaymentMethod && paymentMethod === "credit_card") {
          paymentMethod = item.defaultPaymentMethod;
        }
        break;
      }
    }
    if (matchedPreset) break;
  }

  // If no amount found and not a recognized cancellation notice for a known service, skip
  if (amount === 0) {
    if (isCanceled && matchedPreset) {
      amount = matchedPreset.defaultAmount;
      currency = matchedPreset.currency;
    } else {
      return null;
    }
  }

  // 7. Fallback Merchant Name if not matched
  let name = "";
  let category: SubscriptionCategory = "other";
  let cancelUrl: string | undefined;
  let cancelGuide: string | undefined;
  let confidence: "high" | "medium" = "medium";

  if (matchedPreset) {
    name = matchedPreset.nameKo || matchedPreset.name;
    category = matchedPreset.category;
    cancelUrl = matchedPreset.cancelUrl;
    cancelGuide = matchedPreset.cancelGuide;
    confidence = "high";
  } else if (structuredProductName) {
    name = structuredProductName;
    confidence = "high";
  } else {
    // Clean out known keywords
    const cleaned = normalized
      .replace(/\[Web발신\]/gi, "")
      .replace(/\[.+?(?:카드|페이|결제|영수증)\]/gi, "")
      .replace(/[0-9,]+원/g, "")
      .replace(/\$[0-9.]+/g, "")
      .replace(/승인|일시불|결제완료|자동결제|정기결제|반복결제|취소|해지/g, "")
      .replace(/[0-9]{2,4}[/.-][0-9]{1,2}[/.-][0-9]{1,2}/g, "")
      .replace(/[0-9]{1,2}:[0-9]{1,2}/g, "")
      .trim();

    const words = cleaned
      .split(/\s+/)
      .filter((w) => w.length > 1 && !w.includes("*") && looksLikeMerchantName(w));
    name = words[0] || `알 수 없는 결제 (${amount.toLocaleString()}원)`;
  }

  return {
    id: `sms-${Date.now()}-${index}`,
    name,
    amount,
    currency,
    billingDay,
    billingCycle,
    billingMonth,
    category,
    cancelUrl,
    cancelGuide,
    paymentMethod,
    linkedAccountId: options?.linkedAccountId,
    linkedAccountName: options?.linkedAccountName,
    source: "sms",
    sourceSnippet: block.length > 80 ? block.slice(0, 80) + "..." : block,
    confidence,
    selected: !isCanceled,
    isCanceled,
    isWithin30Days: !isCanceled,
    statusReason: isCanceled ? "해지/취소 알림 감지됨 (활성 구독 제외)" : "결제 승인 확인됨",
  };
}

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
      cancelUrl: "https://chat.openai.com/",
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
      cancelUrl: "https://www.disneyplus.com/account/cancel-subscription",
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
      cancelUrl: "https://member.melon.com/pay/charge/payCancel.htm",
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
