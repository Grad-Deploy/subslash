import {
  BillingCycle,
  DiscoveredSubscription,
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
