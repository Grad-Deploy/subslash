import type { Currency, PaymentMethod } from "../../types";
import type { CalendarDate } from "./types";

/**
 * 결제 문자·메일 한 덩어리에서 칸 하나씩을 읽는 함수들. 메일이면 `received`(받은 날)처럼 문자보다 더
 * 아는 것을 받아, 본문 아무 곳의 숫자보다 믿을 만한 곳을 먼저 본다.
 */

/**
 * 영수증의 상품명 칸. "상품명 : VIBE 무제한 듣기 (정기결제)" → "VIBE 무제한 듣기".
 * 칸이 없으면 빈 글자.
 */
export function extractProductName(block: string): string {
  const productMatch = block.match(
    /(?:상품명|서비스명|주문상품|구매상품|가맹점)\s*[:：]\s*([^\n\r]+)/i,
  );
  const name = productMatch ? productMatch[1].trim() : "";
  if (!name) return "";
  return name
    .replace(/\s*\((?:정기결제|반복결제|자동결제|월간|연간|1개월|매월|이용권|개인)[^)]*\)/gi, "")
    .trim();
}

/** 결제 금액과 통화. 찾지 못하면 0원이다. */
export function extractAmount(
  block: string,
  normalized: string,
): { amount: number; currency: Currency } {
  // 라벨이 붙은 원화 금액이 가장 믿을 만하다("결제금액 : 8,500원", "총 결제금액: 10,000원").
  const explicitAmountMatch = block.match(
    /(?:결제금액|총\s*결제금액|청구금액|이용금액|결제\s*금액)\s*[:：]?\s*(?:₩\s*([0-9,]+)|([0-9,]+)\s*원)/i,
  );
  if (explicitAmountMatch) {
    const parsedVal = parseInt(
      (explicitAmountMatch[1] || explicitAmountMatch[2]).replace(/,/g, ""),
      10,
    );
    if (!isNaN(parsedVal) && parsedVal > 0) return { amount: parsedVal, currency: "KRW" };
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

  // KRW patterns: 17,000원, 17000원, ₩17,000
  const krwMatch = amountScanText.match(/(?:₩\s*([0-9,]+)|([0-9,]+)\s*원)/i);
  // USD patterns: $20, $0.99, 20.00 USD, 20 USD
  const usdMatch = amountScanText.match(/(?:\$\s*([0-9.]+)|([0-9.]+)\s*USD)/i);

  if (usdMatch) {
    const parsedVal = parseFloat((usdMatch[1] || usdMatch[2]).replace(/,/g, ""));
    if (!isNaN(parsedVal) && parsedVal > 0) return { amount: parsedVal, currency: "USD" };
  } else if (labeledNumberMatch) {
    // 라벨이 가리키는 값이라, 본문 아무 곳의 숫자(적립금·할인액)보다 믿을 만하다.
    const parsedVal = parseInt(labeledNumberMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(parsedVal) && parsedVal > 0) return { amount: parsedVal, currency: "KRW" };
  } else if (krwMatch) {
    const parsedVal = parseInt((krwMatch[1] || krwMatch[2]).replace(/,/g, ""), 10);
    if (!isNaN(parsedVal) && parsedVal > 0) return { amount: parsedVal, currency: "KRW" };
  }
  return { amount: 0, currency: "KRW" };
}

/**
 * 결제일(일)과, 적혀 있으면 결제 월. 결제일 칸 → (메일이면) 받은 날 → (문자면) 본문의 날짜 순으로
 * 본다. 아무것도 없으면 오늘 날짜다. 월은 연간 결제에서만 쓴다 — 부르는 쪽이 정한다.
 */
export function extractBillingDate(
  block: string,
  normalized: string,
  received?: CalendarDate,
): { billingDay: number; billingMonth: number | undefined } {
  let billingDay = new Date().getDate();
  let billingMonth: number | undefined;

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

  const explicitDateMatch = block.match(
    /(?:결제일시|결제일자|결제일|승인일시|승인일자|승인일|거래일시|거래일자|이용일자|이용일|결제\s*완료일|일시|다음\s*결제\s*(?:예정)?일|\bdate\b|\bbilled\s*on\b|\bpayment\s*date\b)\s*[:：]?\s*(?:[0-9]{4}[./-]([0-9]{1,2})[./-]([0-3]?[0-9])|([0-1]?[0-9])[/.-]([0-3]?[0-9])|([0-3]?[0-9])일)/i,
  );

  if (explicitDateMatch) {
    takeDate(
      explicitDateMatch[1] || explicitDateMatch[3],
      explicitDateMatch[2] || explicitDateMatch[4] || explicitDateMatch[5],
    );
  } else if (received) {
    // 메일 본문의 "1.5GB", "3-5일" 같은 숫자는 날짜가 아니다. 결제일 칸이 없으면 메일을 받은
    // 날을 결제일로 본다 — 결제 메일은 결제한 날 온다.
    takeDate(String(received.month), String(received.day));
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

  return { billingDay, billingMonth };
}

/** 결제수단. `text`는 소문자로 바꾼 글자다. 모르면 신용카드로 둔다. */
export function detectPaymentMethod(text: string): PaymentMethod {
  if (text.includes("네이버페이") || text.includes("naverpay") || text.includes("naver pay")) {
    return "naverpay";
  }
  if (text.includes("카카오페이") || text.includes("kakaopay")) return "kakaopay";
  if (text.includes("apple") || text.includes("애플") || text.includes("app store")) {
    return "apple_iap";
  }
  if (
    text.includes("google play") ||
    text.includes("구글플레이") ||
    text.includes("구글페이먼트") ||
    text.includes("google payment")
  ) {
    return "google_play";
  }
  return "credit_card";
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
 * 아는 서비스도 상품명 칸도 없는 결제 문자의 이름. 승인·금액·날짜 같은 낱말을 걷고 남은 첫 낱말을 쓰고,
 * 가맹점으로 볼 만한 것이 없으면 '알 수 없는 결제'로 둔다.
 */
export function merchantNameFromSms(normalized: string, amount: number): string {
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
  return words[0] || `알 수 없는 결제 (${amount.toLocaleString()}원)`;
}
