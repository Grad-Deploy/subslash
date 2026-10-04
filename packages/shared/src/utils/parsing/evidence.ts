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

export function hasPaymentEvidence(text: string): boolean {
  return PAYMENT_EVIDENCE.some((pattern) => pattern.test(text));
}

/**
 * 결제는 맞지만 구독이 아닌 것 — 웹툰 쿠키 충전(자동충전 포함). 쓴 만큼 채우는 것이라 결제일과 금액이
 * 매번 바뀌어, 구독으로 등록하면 지어낸 결제일로 D-day와 지출을 계산하게 된다. 서비스 목록에서도 뺐다.
 * '쿠키'만으로는 가리지 않는다 — 메일 하단의 쿠키 정책 안내에도 나온다.
 */
const NOT_SUBSCRIPTION_PURCHASE = /웹툰\s*쿠키|쿠키\s*(?:자동\s*)?충전|쿠키\s*구매|쿠키샵/;

export function isNotSubscriptionPurchase(text: string): boolean {
  return NOT_SUBSCRIPTION_PURCHASE.test(text);
}

/**
 * 해지·취소·환불·만료·종료 알림인지. 메일은 제목으로만 본다 — 본문의 "언제든 해지할 수 있습니다"가
 * 모든 영수증을 해지 알림으로 만든다. 요금제 변경·체험 종료 안내도 걸리므로 해지로 단정하지 않고
 * 후보를 비워 둔다(`isCanceled`).
 */
export function isCancelText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    text.includes("해지") ||
    text.includes("취소") ||
    text.includes("환불") ||
    text.includes("만료") ||
    text.includes("종료") ||
    lower.includes("cancel") ||
    lower.includes("refund")
  );
}
