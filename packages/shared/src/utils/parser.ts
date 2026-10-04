import type {
  BillingCycle,
  DiscoveredSubscription,
  PaymentMethod,
  SubscriptionCategory,
} from "../types";
import { formatCurrency } from "./cost-per-use";
import { chargeDateFromReceiptDate, mergeChargeHistory } from "./chargeHistory";
import { YEARLY_HINT } from "./parsing/serviceKeywords";
import { isPlatformSender, splitPlatformReceipt } from "./parsing/senders";
import { hasPaymentEvidence, isCancelText, isNotSubscriptionPurchase } from "./parsing/evidence";
import {
  detectPaymentMethod,
  extractAmount,
  extractBillingDate,
  extractProductName,
  merchantNameFromSms,
} from "./parsing/fields";
import { matchService } from "./parsing/matchService";
import type { CalendarDate, ReceiptHints } from "./parsing/types";

/**
 * 결제 문자(붙여 넣기)와 결제 메일(Gmail 가져오기)을 구독 후보로 바꾼다.
 *
 * 이 파일은 순서만 정한다 — 붙여 넣은 글을 메시지로 나누고, 한 덩어리마다 칸을 읽어(parsing/fields)
 * 서비스를 찾고(parsing/matchService), 후보 하나로 묶는다. 서비스 키워드 표는 parsing/serviceKeywords,
 * 발신자 판단은 parsing/senders, 결제 증거는 parsing/evidence에 있다.
 */

export {
  KNOWN_RECEIPT_SENDER_DOMAINS,
  SERVICE_KEYWORD_PRESET_IDS,
} from "./parsing/serviceKeywords";
export { isDomainOf, senderDomainOf } from "./parsing/senders";

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

function parseSingleMessageBlock(
  block: string,
  index: number,
  options?: { linkedAccountId?: string; linkedAccountName?: string },
  hints?: ReceiptHints,
): DiscoveredSubscription | null {
  const normalized = block.replace(/\r/g, " ");

  // 메일은 결제가 일어났다는 증거가 있어야 읽는다. 문자는 카드 승인 문자 자체가 증거다.
  if (hints && !hasPaymentEvidence(normalized)) return null;
  if (isNotSubscriptionPurchase(hints ? hints.subject + " " + normalized : normalized)) {
    return null;
  }

  // 영수증의 상품명 칸("상품명 : VIBE 무제한 듣기 (정기결제)")
  const productName = extractProductName(block);
  let { amount, currency } = extractAmount(block, normalized);

  // 해지·환불 알림인지. 메일은 제목으로만 본다(본문의 "언제든 해지할 수 있습니다").
  const isCanceled = isCancelText(hints ? hints.subject : normalized);

  const date = extractBillingDate(block, normalized, hints?.received);
  const billingDay = date.billingDay;
  let billingMonth = date.billingMonth;

  // Yearly plans: a receipt that says so is the only place the app can learn the billing cycle,
  // and importing one as monthly multiplies the user's reported fixed spend by twelve.
  let billingCycle: BillingCycle = YEARLY_HINT.test(normalized) ? "yearly" : "monthly";

  // 메일 하단의 "App Store에서 받기" 같은 배지는 결제수단이 아니므로, 메일은 제목·보낸 사람만 본다.
  const match = matchService({
    normalized,
    productName,
    hints,
    paymentMethod: detectPaymentMethod(
      hints ? (hints.subject + " " + hints.sender).toLowerCase() : normalized.toLowerCase(),
    ),
  });
  const matchedPreset = match.preset;
  const paymentMethod: PaymentMethod = match.paymentMethod;

  // 가장 비싼 월 요금보다 큰 영수증(굿노트)은 '연간'이라고 적혀 있지 않아도 연 결제다. 애플 영수증은
  // 앱 이름과 갱신일만 적기도 해서, 월 결제로 읽으면 3월 영수증이 반년 뒤 '오래된 메일'이 되어 자동으로
  // 등록되지 않았다.
  if (
    matchedPreset?.yearlyAbove !== undefined &&
    currency === matchedPreset.currency &&
    amount > matchedPreset.yearlyAbove
  ) {
    billingCycle = "yearly";
  }
  // 월은 연간 결제에서만 쓴다. 월간은 매달 반복되므로 영수증이 말하는 달이 더해 주는 것이 없다.
  if (billingCycle !== "yearly") {
    billingMonth = undefined;
  } else if (hints && billingMonth === undefined) {
    // "결제일 : 3일"처럼 달이 없는 영수증이라도 메일을 받은 달에 결제된 것이다.
    billingMonth = hints.received.month;
  }

  // 금액이 없으면 건너뛴다. 아는 서비스의 해지 알림만 그 서비스의 요금으로 채운다 — 요금제가 여럿이거나
  // 요금을 모르는 서비스는 금액을 채울 근거가 없다.
  if (amount === 0) {
    if (isCanceled && matchedPreset && matchedPreset.defaultAmount !== null) {
      amount = matchedPreset.defaultAmount;
      currency = matchedPreset.currency;
    } else {
      return null;
    }
  }

  let name: string;
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
    const bodyOnly =
      hints !== undefined && match.matchedIn === "body" && !isPlatformSender(hints.sender);
    confidence = bodyOnly ? "medium" : "high";
  } else if (productName) {
    name = productName;
    confidence = "high";
  } else if (hints) {
    // 메일 본문에서 남은 단어는 인사말·광고 문구이기 쉽다. 이름으로 쓰지 않고 모른다고 둔다.
    name = `알 수 없는 결제 (${formatCurrency(amount, currency)})`;
  } else {
    name = merchantNameFromSms(normalized, amount);
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
 * 같은 구독의 영수증은 달마다 쌓이므로 가장 최근 메일로 후보 하나를 만들고, 그 메일이 오래됐거나
 * 해지 알림이면 등록 후보에서 기본으로 빼 둔다(사용자가 다시 고를 수 있다). 더 이른 영수증은 버리지
 * 않고 받은 날과 금액만 후보의 결제 기록(`chargeHistory`)에 남긴다 — 영수증이 등록하기 전 달을 채운다.
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

  // 서비스마다 가장 최근 메일로 만든 후보. 같은 서비스의 더 이른 메일은 그 후보의 결제 기록이 된다.
  const seen = new Map<string, DiscoveredSubscription>();
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
      const receiptDate = `${received.year}.${String(received.month).padStart(2, "0")}.${String(received.day).padStart(2, "0")}`;
      // 해지 알림은 결제가 아니다. 금액이 없는 메일도 결제 기록으로 남기지 않는다.
      const charge =
        !parsed.isCanceled && parsed.amount > 0 ? chargeDateFromReceiptDate(receiptDate) : null;
      const earlier = seen.get(key);
      if (earlier) {
        // 더 이른 영수증은 후보를 만들지 않고, 결제 기록으로만 남긴다.
        if (charge) {
          earlier.chargeHistory = mergeChargeHistory(earlier.chargeHistory, [
            { date: charge, amount: parsed.amount },
          ]);
        }
        return;
      }

      const daysAgo = Math.max(0, Math.floor((now.getTime() - receivedAt.getTime()) / DAY_MS));
      const stale = daysAgo > STALE_AFTER_DAYS[parsed.billingCycle];
      const snippet = `${receiptDate} · ${email.from} · ${email.subject}`;

      const candidate: DiscoveredSubscription = {
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
        chargeHistory: charge ? [{ date: charge, amount: parsed.amount }] : [],
      };
      seen.set(key, candidate);
      results.push(candidate);
    });
  });

  return results;
}
