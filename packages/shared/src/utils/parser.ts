import {
  BillingCycle,
  DiscoveredSubscription,
  SubscriptionCategory,
  PaymentMethod,
  Currency,
} from "../types";
import { POPULAR_SERVICES, ServicePreset } from "../constants/services";
import { formatCurrency } from "./cost-per-use";

// Known keyword mapping for popular services
const SERVICE_KEYWORDS: {
  keywords: string[];
  presetId: string;
  defaultPaymentMethod?: PaymentMethod;
  /**
   * 이 서비스가 영수증을 보내는 도메인. 하위 도메인(email.openai.com)도 같은 서비스로 본다.
   *
   * 보낸 사람이 여기 맞으면 제목·본문보다 먼저 믿는다. 반대로 여러 서비스가 함께 쓰는
   * 도메인(google.com·apple.com·naver.com)은 어느 서비스인지 가리지 못하므로 적지 않고,
   * 확인하지 못한 도메인도 적지 않는다 — 틀린 도메인을 적으면 남의 메일을 이 서비스의
   * 영수증으로 읽는다.
   */
  senderDomains?: string[];
}[] = [
  {
    keywords: ["넷플릭스", "netflix", "넷플릭스코리아"],
    presetId: "netflix",
    senderDomains: ["netflix.com"],
  },
  {
    keywords: ["유튜브", "youtube", "youtube premium", "유튜브 프리미엄", "구글페이먼트(유튜브)"],
    presetId: "youtube-premium",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: ["쿠팡", "와우", "coupang", "와우멤버십", "쿠팡플레이", "coupang play"],
    presetId: "coupang-wow",
    senderDomains: ["coupang.com"],
  },
  { keywords: ["티빙", "tving"], presetId: "tving", senderDomains: ["tving.com"] },
  {
    keywords: ["웨이브", "wavve", "콘텐츠웨이브"],
    presetId: "wavve",
    senderDomains: ["wavve.com"],
  },
  { keywords: ["왓챠", "watcha", "왓챠플레이"], presetId: "watcha", senderDomains: ["watcha.com"] },
  {
    keywords: ["디즈니", "disney", "디즈니플러스", "disney+", "디즈니+"],
    presetId: "disney-plus",
    senderDomains: ["disneyplus.com"],
  },
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
  {
    keywords: ["라프텔", "laftel", "애니메이션 라프텔"],
    presetId: "laftel",
    senderDomains: ["laftel.net"],
  },
  { keywords: ["스포티파이", "spotify"], presetId: "spotify", senderDomains: ["spotify.com"] },
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
    // "apple.com"을 넣어 두었더니 애플이 보낸 영수증이 모두 아이클라우드가 됐다(보낸 사람
    // 주소에 그 글자가 들어 있다). 애플 결제라는 사실만으로는 어느 앱인지 알 수 없다.
    keywords: ["아이클라우드", "icloud"],
    presetId: "apple-icloud",
    defaultPaymentMethod: "apple_iap",
  },
  {
    keywords: ["굿노트", "goodnotes", "good notes"],
    presetId: "goodnotes",
    senderDomains: ["goodnotes.com"],
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
  {
    keywords: ["notion", "노션"],
    presetId: "notion",
    senderDomains: ["notion.so", "makenotion.com"],
  },
  {
    keywords: ["chatgpt", "openai", "챗gpt"],
    presetId: "chatgpt-plus",
    senderDomains: ["openai.com"],
  },
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
    senderDomains: ["anthropic.com"],
    defaultPaymentMethod: "credit_card",
  },
  { keywords: ["어도비", "adobe"], presetId: "adobe-cc", senderDomains: ["adobe.com"] },
  {
    keywords: ["마이크로소프트", "microsoft", "ms 365", "m365"],
    presetId: "microsoft-365",
    senderDomains: ["microsoft.com"],
  },
  { keywords: ["밀리", "밀리의 서재", "millie"], presetId: "millie" },
  { keywords: ["리디", "리디셀렉트", "ridi"], presetId: "ridi-select" },
  {
    // 카드 명세에 찍히는 애플 결제 표기. 어느 앱의 구독인지는 알 수 없으므로 앱스토어 구독
    // 묶음(요금 없음)으로 두고 사용자가 앱과 요금을 적게 한다. 이 줄은 위의 어느 서비스와도
    // 맞지 않았을 때만 닿도록 맨 뒤에 둔다.
    keywords: ["apple.com/bill"],
    presetId: "apple-app-store",
    defaultPaymentMethod: "apple_iap",
  },
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

/**
 * 메일 한 통을 읽을 때 문자보다 더 아는 것.
 *
 * 문자는 짧아서 본문 전체가 판단 근거지만, 메일 본문에는 광고·약관·하단 안내가 섞인다.
 * "언제든 해지할 수 있습니다"가 모든 영수증을 해지 알림으로, "1.5GB"가 결제일 5일로 읽히지
 * 않도록 판단마다 믿을 곳을 따로 준다.
 */
interface ReceiptHints {
  /** 메일 제목. 해지 여부와 서비스 이름을 여기서 먼저 본다. */
  subject: string;
  /** 보낸 사람. 도메인이 서비스와 맞으면 제목·본문보다 믿을 만한 근거다. */
  sender: string;
  /** 메일 본문. 서비스 이름을 마지막으로 찾아볼 곳이다. */
  body: string;
  /** 본문에 결제일 칸이 없을 때 쓸 날짜. 메일에서는 받은 날(사용자 시간대의 달·일)이다. */
  received: CalendarDate;
  /**
   * 이 조각이 어느 서비스의 것인지 이미 정해졌을 때의 프리셋 id.
   *
   * 한 통으로 여러 앱을 청구하는 영수증을 항목별로 쪼갤 때만 쓴다(`splitPlatformReceipt`).
   * 조각에는 그 앱의 이름·금액·주기만 들어 있으므로, 이름을 다시 찾게 두면 키워드 표에서
   * 앞선 서비스가 조각을 가로챈다.
   */
  forcedPresetId?: string;
}

/**
 * 메일이 "이 결제가 실제로 일어났다"고 말하는 표현.
 *
 * 메일함 검색은 '구독'·'subscription'처럼 넓은 단어로 하기 때문에 광고와 뉴스레터가 함께
 * 걸린다. 그런 메일에도 금액("$20/month")과 서비스 이름이 있어서, 증거를 따로 묻지 않으면
 * 쓰지도 않는 구독이 등록된다 — 챗GPT 광고 메일이 '챗GPT $20 구독'으로 등록되던 것이 그랬다.
 * '구독'·'멤버십'·'subscription'은 메일 하단의 수신 설정 안내에도 나오므로 증거로 치지 않는다.
 * 여기 걸리지 않아 놓친 결제는 사용자가 직접 등록하면 되지만, 지어낸 구독은 사용자가 잘못됐다는
 * 것조차 모른다.
 */
const PAYMENT_EVIDENCE: RegExp[] = [
  /영수증|청구서|receipt|invoice/i,
  /(?:결제|청구|이용|승인|주문)\s*금액/,
  /결제(?:가|를)?\s*(?:완료|승인|처리)(?:되|했|됐|하)/,
  /(?:정기|자동)\s*결제\s*(?:안내|완료|승인|내역|예정)/,
  /(?:결제|승인|주문)\s*(?:내역|번호|일시|완료)/,
  /[0-9,]+\s*원\s*(?:승인|결제|청구)|(?:승인|결제|청구)\s*[0-9,]+\s*원/,
  /payment\s*(?:confirmation|receipt|received|successful|succeeded|complete|processed)/i,
  /(?:has been|have been|was|were)\s*(?:charged|billed)/i,
  /we(?:'ve| have)?\s*charged/i,
  /thank(?:s| you)[^.\n]{0,40}(?:payment|purchase|order)/i,
  /(?:amount|total)\s*(?:charged|billed|paid|due)/i,
  /order\s*confirmation|confirmation\s*of\s*(?:your\s*)?payment/i,
];

function hasPaymentEvidence(text: string): boolean {
  return PAYMENT_EVIDENCE.some((pattern) => pattern.test(text));
}

/** "Netflix <info@account.netflix.com>"에서 도메인만 꺼낸다. */
export function senderDomainOf(from: string): string {
  const match = /@([A-Za-z0-9.-]+)/.exec(from);
  return match ? match[1].toLowerCase().replace(/[^a-z0-9.-]|\.+$/g, "") : "";
}

/** 하위 도메인(email.openai.com)도 그 서비스의 것으로 본다. */
export function isDomainOf(domain: string, registrable: string): boolean {
  return domain === registrable || domain.endsWith("." + registrable);
}

/**
 * 한 메일로 여러 서비스를 청구하는 발신자. 구글 플레이 영수증은 제목이 "주문 영수증"뿐이고
 * 어느 서비스인지는 본문에만 있다. 이 발신자들만 본문에서 찾은 이름을 확인 없이 등록해도 되는
 * 것으로 본다 — 나머지는 사용자가 골라야 등록된다.
 */
const PLATFORM_SENDER_DOMAINS = [
  "google.com",
  "apple.com",
  "naver.com",
  "kakao.com",
  "payco.com",
  "paypal.com",
  "stripe.com",
];

function isPlatformSender(sender: string): boolean {
  const domain = senderDomainOf(sender);
  return PLATFORM_SENDER_DOMAINS.some((registrable) => isDomainOf(domain, registrable));
}

/**
 * 어느 앱인지 모를 때 쓰는 묶음 프리셋. 항목별로 쪼갤 때는 후보가 아니다.
 *
 * 애플 영수증 하단의 "apple.com/bill"은 어느 줄에나 있는 안내 문구라, 이것으로 조각을 하나 더
 * 만들면 실제로 결제하지 않은 '앱스토어 구독'이 그 옆 항목의 금액을 달고 등록된다.
 */
const PLATFORM_FALLBACK_PRESET_IDS = new Set(["apple-app-store", "apple-play-store"]);

/**
 * 한 통으로 여러 앱을 청구하는 영수증을 항목별 조각으로 나눈다.
 *
 * 애플·구글 플레이 영수증은 한 통에 굿노트·아이클라우드가 나란히 적힌다. 메일 한 통을 후보
 * 하나로 읽으면 키워드 표에서 앞선 서비스(아이클라우드)만 남고, 그 이름에 뒤 항목의 금액·주기
 * (굿노트의 연간 13,000원)가 붙는다 — 1년째 쓰는 굿노트가 '아이클라우드 연간 13,000원'으로
 * 등록되던 것이 이 경우였다.
 *
 * 본문에서 **아는 서비스**가 두 곳 이상 나올 때만 나눈다. 나누는 자리는 그 이름이 처음 나온
 * 위치이고, 조각은 다음 이름 직전까지다. 금액이 없는 조각은 뒤에서 버려지므로, 하단 안내에
 * 이름만 스친 서비스는 후보가 되지 않는다.
 *
 * 하나만 나오면 빈 배열을 돌려준다 — 지금까지처럼 메일 한 통을 통째로 읽는다.
 */
function splitPlatformReceipt(body: string): { presetId: string; text: string }[] {
  const lower = body.toLowerCase();
  const found = new Map<string, number>();

  for (const item of SERVICE_KEYWORDS) {
    if (PLATFORM_FALLBACK_PRESET_IDS.has(item.presetId)) continue;
    if (!POPULAR_SERVICES.some((s) => s.id === item.presetId)) continue;
    let at = -1;
    for (const keyword of item.keywords) {
      const found_at = lower.indexOf(keyword.toLowerCase());
      if (found_at >= 0 && (at < 0 || found_at < at)) at = found_at;
    }
    // 같은 서비스가 여러 번 나오면 처음 나온 자리를 쓴다.
    if (at >= 0 && (!found.has(item.presetId) || at < found.get(item.presetId)!)) {
      found.set(item.presetId, at);
    }
  }

  if (found.size < 2) return [];

  const marks = [...found.entries()]
    .map(([presetId, at]) => ({ presetId, at }))
    .sort((a, b) => a.at - b.at);

  return marks.map((mark, i) => ({
    presetId: mark.presetId,
    text: body.slice(mark.at, i + 1 < marks.length ? marks[i + 1].at : undefined),
  }));
}

function parseSingleMessageBlock(
  block: string,
  index: number,
  options?: { linkedAccountId?: string; linkedAccountName?: string },
  hints?: ReceiptHints,
): DiscoveredSubscription | null {
  const normalized = block.replace(/\r/g, " ");
  const lower = normalized.toLowerCase();

  // 메일은 결제가 일어났다는 증거가 있어야 읽는다. 문자는 카드 승인 문자 자체가 증거다.
  if (hints && !hasPaymentEvidence(normalized)) return null;

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

  // 라벨 뒤에 통화 표시가 없는 영수증이 있다("결제금액 : 17,000", "결제금액 : KRW 17,000").
  // 달러를 먼저 보고 나서 이 값을 쓴다 — "결제금액 : 10.99 USD"를 10원으로 읽으면 안 된다.
  const labeledNumberMatch = block.match(
    /(?:결제금액|총\s*결제금액|청구금액|이용금액|결제\s*금액)\s*[:：]?\s*(?:KRW\s*)?([0-9][0-9,]*)(?:\s*(?:원|KRW|won))?/i,
  );

  // "9,900원부터", "starting at $20"은 안내 가격이지 이 메일의 결제액이 아니다. 광고 문구의
  // 가격을 결제액으로 읽으면, 쓰지도 않는 요금제가 지출에 잡힌다.
  const amountScanText = normalized
    .replace(/(?:₩\s*[0-9,]+|[0-9,]+\s*원|\$\s*[0-9.]+|[0-9.]+\s*USD)\s*(?:부터|~)/gi, " ")
    .replace(
      /(?:starting\s*(?:at|from)|정가|할인가)\s*(?:₩\s*[0-9,]+|\$\s*[0-9.]+|[0-9,]+\s*원)/gi,
      " ",
    );

  if (amount === 0) {
    // KRW patterns: 17,000원, 17000원, ₩17,000
    const krwMatch = amountScanText.match(/(?:₩\s*([0-9,]+)|([0-9,]+)\s*원)/i);
    // USD patterns: $20, $0.99, 20.00 USD, 20 USD
    const usdMatch = amountScanText.match(/(?:\$\s*([0-9.]+)|([0-9.]+)\s*USD)/i);

    if (usdMatch) {
      const rawVal = (usdMatch[1] || usdMatch[2]).replace(/,/g, "");
      const parsedVal = parseFloat(rawVal);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        currency = "USD";
      }
    } else if (labeledNumberMatch) {
      // 라벨이 가리키는 값이라, 본문 아무 곳의 숫자(적립금·할인액)보다 믿을 만하다.
      const parsedVal = parseInt(labeledNumberMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(parsedVal) && parsedVal > 0) {
        amount = parsedVal;
        currency = "KRW";
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
  const cancelText = hints ? hints.subject : normalized;
  const isCanceled =
    cancelText.includes("해지") ||
    cancelText.includes("취소") ||
    cancelText.includes("환불") ||
    cancelText.includes("만료") ||
    cancelText.includes("종료") ||
    cancelText.toLowerCase().includes("cancel") ||
    cancelText.toLowerCase().includes("refund");

  // 4. Extract Date (explicit 결제일시 or MM/DD, M월 D일, MM.DD, MM-DD)
  let billingDay = new Date().getDate();
  // Month is only carried through for yearly plans, which have no date without
  // it. Monthly plans repeat every month, so the month a receipt happens to
  // mention says nothing extra.
  let billingMonth: number | undefined;
  const explicitDateMatch = block.match(
    /(?:결제일시|결제일자|결제일|승인일시|승인일자|승인일|거래일시|거래일자|이용일자|이용일|결제\s*완료일|일시|다음\s*결제\s*(?:예정)?일|\bdate\b|\bbilled\s*on\b|\bpayment\s*date\b)\s*[:：]?\s*(?:[0-9]{4}[./-]([0-9]{1,2})[./-]([0-3]?[0-9])|([0-1]?[0-9])[/.-]([0-3]?[0-9])|([0-3]?[0-9])일)/i,
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
  } else if (hints) {
    // 메일 본문의 "1.5GB", "3-5일" 같은 숫자는 날짜가 아니다. 결제일 칸이 없으면 메일을 받은
    // 날을 결제일로 본다 — 결제 메일은 결제한 날 온다.
    takeDate(String(hints.received.month), String(hints.received.day));
  } else {
    // Strip currency amounts so numbers like "$20.00" are not mistaken for MM.DD
    const dateScanText = normalized.replace(/\$\s*[0-9.]+/g, "").replace(/[0-9.]+\s*USD/gi, "");

    // 연도가 붙은 날짜를 먼저 읽는다. "2026.09.05"를 월·일만 훑으면 연도 끝과 월이 "6.09"로
    // 붙어 9일이 된다 — 실제 결제일(5일)과 나흘이 어긋난다.
    const fullDate =
      dateScanText.match(/(?:19|20)[0-9]{2}\s*[./-]\s*([0-1]?[0-9])\s*[./-]\s*([0-3]?[0-9])/) ??
      dateScanText.match(/(?:19|20)[0-9]{2}\s*년\s*([0-1]?[0-9])\s*월\s*([0-3]?[0-9])\s*일/);

    if (!fullDate || !takeDate(fullDate[1], fullDate[2])) {
      const dateRegex =
        /(?:([0-1]?[0-9])[/.-]([0-3]?[0-9])|([0-1]?[0-9])\s*월\s*([0-3]?[0-9])\s*일)/g;
      let match: RegExpExecArray | null;
      while ((match = dateRegex.exec(dateScanText)) !== null) {
        // 전화번호("02-1234-5678")나 카드번호의 토막은 날짜가 아니다. 앞뒤에 숫자가 더 붙어
        // 있으면 더 긴 번호의 일부로 본다.
        const before = dateScanText[match.index - 1] ?? "";
        const after = dateScanText[match.index + match[0].length] ?? "";
        if (/[0-9-]/.test(before) || /[0-9-]/.test(after)) continue;
        if (takeDate(match[1] || match[3], match[2] || match[4])) break;
      }
    }
  }

  // 4b. Yearly plans: a receipt that says so is the only place the app can
  // learn the billing cycle, and importing one as monthly multiplies the user's
  // reported fixed spend by twelve.
  // 결제 주기가 하나뿐인 서비스는 아래에서 이름을 찾은 뒤 그 주기로 바꾼다.
  let billingCycle: BillingCycle = YEARLY_HINT.test(normalized) ? "yearly" : "monthly";

  // 5. Extract Payment Method
  let paymentMethod: PaymentMethod = "credit_card";
  // 메일 하단의 "App Store에서 받기" 같은 배지는 결제수단이 아니므로, 메일은 제목·보낸 사람만 본다.
  const paymentText = hints ? (hints.subject + " " + hints.sender).toLowerCase() : lower;
  if (
    paymentText.includes("네이버페이") ||
    paymentText.includes("naverpay") ||
    paymentText.includes("naver pay")
  ) {
    paymentMethod = "naverpay";
  } else if (paymentText.includes("카카오페이") || paymentText.includes("kakaopay")) {
    paymentMethod = "kakaopay";
  } else if (
    paymentText.includes("apple") ||
    paymentText.includes("애플") ||
    paymentText.includes("app store")
  ) {
    paymentMethod = "apple_iap";
  } else if (
    paymentText.includes("google play") ||
    paymentText.includes("구글플레이") ||
    paymentText.includes("구글페이먼트") ||
    paymentText.includes("google payment")
  ) {
    paymentMethod = "google_play";
  }

  // 6. Match Known Service Preset
  let matchedPreset: ServicePreset | undefined;
  // 이름을 어디서 찾았는지. 본문에서만 찾은 이름은 덜 믿는다(아래 confidence).
  let matchedIn: "sender" | "subject" | "body" = "body";

  const takeMatch = (item: (typeof SERVICE_KEYWORDS)[number]): boolean => {
    // 키워드 표의 오타로 프리셋을 찾지 못하면 다음 후보를 계속 본다.
    const preset = POPULAR_SERVICES.find((s) => s.id === item.presetId);
    if (!preset) return false;
    matchedPreset = preset;
    if (item.defaultPaymentMethod && paymentMethod === "credit_card") {
      paymentMethod = item.defaultPaymentMethod;
    }
    return true;
  };

  const matchByKeyword = (text: string): boolean => {
    const target = text.toLowerCase();
    for (const item of SERVICE_KEYWORDS) {
      if (!item.keywords.some((kw) => target.includes(kw.toLowerCase()))) continue;
      if (takeMatch(item)) return true;
    }
    return false;
  };

  if (hints?.forcedPresetId) {
    // 항목별로 쪼갠 조각이다. 어느 서비스의 것인지는 나눌 때 이미 정해졌다.
    const forced = SERVICE_KEYWORDS.find((item) => item.presetId === hints.forcedPresetId);
    if (forced) takeMatch(forced);
  } else if (hints) {
    // 메일은 ① 보낸 사람의 도메인 ② 제목·보낸 사람 이름 ③ 본문 순으로 본다. 제목과 본문은 남의
    // 서비스를 말할 수 있지만(비교 기사·광고), 영수증이 온 도메인은 그 서비스의 것이다. 보낸
    // 사람이 아는 서비스면 본문은 아예 보지 않는다 — 넷플릭스 메일 본문의 '쿠팡플레이'는 광고다.
    const senderDomain = senderDomainOf(hints.sender);
    const byDomain = SERVICE_KEYWORDS.find((item) =>
      (item.senderDomains ?? []).some((domain) => isDomainOf(senderDomain, domain)),
    );
    if (byDomain && takeMatch(byDomain)) {
      matchedIn = "sender";
    } else if (matchByKeyword(hints.subject + " " + hints.sender)) {
      matchedIn = "subject";
    } else if (!byDomain) {
      matchByKeyword(structuredProductName + " " + hints.body);
    }
  } else {
    matchByKeyword(structuredProductName + " " + normalized);
  }

  // 연 결제만 있는 서비스(굿노트)의 영수증은 '연간'이라고 적혀 있지 않아도 연 결제다. 애플
  // 영수증은 앱 이름과 갱신일만 적기도 해서, 월 결제로 읽으면 3월 영수증이 반년 뒤 '오래된 메일'이
  // 되어 자동으로 등록되지 않았다.
  if (matchedPreset?.onlyBillingCycle) billingCycle = matchedPreset.onlyBillingCycle;
  if (billingCycle !== "yearly") {
    billingMonth = undefined;
  } else if (hints && billingMonth === undefined) {
    // "결제일 : 3일"처럼 달이 없는 영수증이라도 메일을 받은 달에 결제된 것이다.
    billingMonth = hints.received.month;
  }

  // If no amount found and not a recognized cancellation notice for a known service, skip
  if (amount === 0) {
    // 요금제가 여럿이거나 요금을 모르는 서비스는 금액을 채울 근거가 없어 건너뛴다.
    if (isCanceled && matchedPreset && matchedPreset.defaultAmount !== null) {
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
    // 본문에서만 찾은 이름은 사용자가 골라야 등록된다(자동 가져오기의 review). 한 메일로 여러
    // 서비스를 청구하는 발신자는 본문이 유일한 근거라 예외다.
    const bodyOnly = hints !== undefined && matchedIn === "body" && !isPlatformSender(hints.sender);
    confidence = bodyOnly ? "medium" : "high";
  } else if (structuredProductName) {
    name = structuredProductName;
    confidence = "high";
  } else if (hints) {
    // 메일 본문에서 남은 단어는 인사말·광고 문구이기 쉽다. 이름으로 쓰지 않고 모른다고 둔다.
    name = `알 수 없는 결제 (${formatCurrency(amount, currency)})`;
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
    presetId: matchedPreset?.id,
    sourceSnippet: block.length > 80 ? block.slice(0, 80) + "..." : block,
    confidence,
    selected: !isCanceled,
    isCanceled,
    isWithin30Days: !isCanceled,
    statusReason: isCanceled ? "해지/취소 알림 감지됨 (활성 구독 제외)" : "결제 승인 확인됨",
  };
}

/** Apps Script가 Gmail에서 꺼내 온 메일 한 통. */
export interface ReceiptEmail {
  from: string;
  subject: string;
  /** 받은 시각(ISO 8601). */
  date: string;
  /** 본문 글자. HTML 메일은 태그를 뺀 글자다. */
  body: string;
}

/**
 * 이보다 오래전에 마지막 결제 메일이 온 구독은 지금도 결제 중인지 알 수 없다.
 *
 * "알 수 없다"는 "아니다"가 아니다. 이 선을 넘은 후보는 기본으로 체크를 풀어 사용자가 고르게
 * 할 뿐, 없애지 않는다 — 연간 구독의 영수증은 1년에 한 번뿐이라 갱신 직전에는 늘 이 근처이고,
 * 없애면 1년에 한 번 결제되는 구독은 영영 등록할 수 없다.
 */
export const STALE_AFTER_DAYS: Record<BillingCycle, number> = { monthly: 35, yearly: 370 };

/**
 * `YYYY.MM.DD`로 적어 둔 영수증 날짜가 며칠 전인지. 읽을 수 없으면 `null`.
 *
 * 메일을 막 읽는 자리에서는 받은 시각을 그대로 쓰면 되지만(더 정확하다), 후보를 저장해 둔 뒤
 * 다시 판단할 때는 이 날짜밖에 남아 있지 않다.
 */
export function daysSinceReceipt(receiptDate: string, now: Date): number | null {
  const match = /^([0-9]{4})\.([0-9]{2})\.([0-9]{2})$/.exec(receiptDate);
  if (!match) return null;
  const at = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((now.getTime() - at) / DAY_MS));
}

/** 마지막 결제 메일이 오래돼 지금도 결제 중인지 알 수 없는 후보인지. */
export function isStaleReceipt(
  receiptDate: string,
  billingCycle: BillingCycle,
  now: Date,
): boolean {
  const days = daysSinceReceipt(receiptDate, now);
  return days !== null && days > STALE_AFTER_DAYS[billingCycle];
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * 어느 시간대의 달력으로 본 날짜인지. 서버(UTC)에서 한국 시각 오전 8시에 온 메일을 그냥 읽으면
 * 전날이 되어 결제일이 하루 어긋난다. 시간대를 주지 않으면 실행 환경의 시간대(브라우저)다.
 */
function calendarDate(date: Date, timeZone?: string): CalendarDate {
  if (!timeZone) {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

/**
 * Gmail에서 가져온 결제 메일을 구독 후보로 바꾼다.
 *
 * 문자와 달리 메일은 한 통이 한 건이다. 본문의 빈 줄로 나누면 메일 하나가 여러 조각이 되므로
 * 나누지 않는다. 다만 한 통으로 여러 앱을 청구하는 발신자(애플·구글 플레이)의 영수증에 아는
 * 서비스가 둘 이상 적혀 있으면 항목별로 나눈다 — 그러지 않으면 뒤 항목이 통째로 사라지고,
 * 그 금액이 앞 항목의 이름에 붙는다(`splitPlatformReceipt`).
 *
 * 같은 구독의 영수증은 달마다 쌓이므로 가장 최근 메일 하나만 남기고, 그 메일이 오래됐거나
 * 해지 알림이면 등록 후보에서 기본으로 빼 둔다(사용자가 다시 고를 수 있다).
 */
export function parseReceiptEmails(
  emails: ReceiptEmail[],
  options?: {
    linkedAccountId?: string;
    linkedAccountName?: string;
    now?: Date;
    /** 받은 날을 읽을 시간대(IANA 이름). 서버에서 부를 때는 사용자의 시간대를 준다. */
    timeZone?: string;
  },
): DiscoveredSubscription[] {
  const now = options?.now ?? new Date();
  const newestFirst = emails
    .map((email) => ({ email, receivedAt: new Date(email.date) }))
    .filter(({ receivedAt }) => !Number.isNaN(receivedAt.getTime()))
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

  const seen = new Set<string>();
  const results: DiscoveredSubscription[] = [];

  newestFirst.forEach(({ email, receivedAt }, index) => {
    const received = calendarDate(receivedAt, options?.timeZone);
    // 한 통으로 여러 앱을 청구하는 발신자만 항목별로 나눈다. 나눌 것이 없으면 통째로 읽는다.
    const parts = isPlatformSender(email.from) ? splitPlatformReceipt(email.body) : [];
    const pieces =
      parts.length > 0
        ? parts.map((part) => ({ body: part.text, forcedPresetId: part.presetId }))
        : [{ body: email.body, forcedPresetId: undefined }];

    pieces.forEach((piece, pieceIndex) => {
      // 결제가 일어났다는 증거는 제목에 있는 경우가 많아(‘귀하의 영수증입니다’) 조각에도 붙인다.
      const block = `${email.subject}
${piece.body}`;
      const parsed = parseSingleMessageBlock(block, index, options, {
        subject: email.subject,
        sender: email.from,
        body: piece.body,
        received,
        forcedPresetId: piece.forcedPresetId,
      });
      if (!parsed) return;

      // 같은 서비스라도 통화가 다르면 다른 구독일 수 있다.
      const key = `${parsed.name}|${parsed.currency}`;
      if (seen.has(key)) return;
      seen.add(key);

      const daysAgo = Math.max(0, Math.floor((now.getTime() - receivedAt.getTime()) / DAY_MS));
      const stale = daysAgo > STALE_AFTER_DAYS[parsed.billingCycle];
      const receiptDate = `${received.year}.${String(received.month).padStart(2, "0")}.${String(received.day).padStart(2, "0")}`;
      const snippet = `${receiptDate} · ${email.from} · ${email.subject}`;

      results.push({
        ...parsed,
        id: `gmail-${receivedAt.getTime()}-${index}-${pieceIndex}`,
        source: "gmail",
        sender: email.from,
        emailProvider: "google",
        sourceSnippet: snippet.length > 120 ? `${snippet.slice(0, 120)}...` : snippet,
        receiptDate,
        daysAgo,
        selected: !parsed.isCanceled && !stale,
        isWithin30Days: !parsed.isCanceled && !stale,
        statusReason: parsed.isCanceled
          ? "가장 최근 메일이 해지·취소 알림입니다 (활성 구독 제외)"
          : stale
            ? `마지막 결제 메일이 ${daysAgo}일 전이라 지금도 결제 중인지 알 수 없습니다`
            : `${daysAgo}일 전 결제 메일 확인됨`,
      });
    });
  });

  return results;
}
