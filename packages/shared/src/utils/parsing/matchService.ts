import type { PaymentMethod } from "../../types";
import { POPULAR_SERVICES, type ServicePreset } from "../../constants/services";
import { SERVICE_KEYWORDS } from "./serviceKeywords";
import { isDomainOf, senderDomainOf } from "./senders";
import type { ReceiptHints } from "./types";

/** 이름을 어디서 찾았는지. 본문에서만 찾은 이름은 덜 믿는다(confidence). */
export type MatchedIn = "sender" | "subject" | "body";

/**
 * 결제 문자·메일이 어느 서비스의 것인지 서비스 목록에서 찾는다. 찾으면 그 서비스의 기본 결제수단이
 * 결제수단을 채운다(앞서 신용카드로만 읽혔을 때).
 *
 * 메일은 ① 보낸 사람의 도메인 ② 제목·보낸 사람 이름 ③ 본문 순으로 본다. 제목과 본문은 남의 서비스를
 * 말할 수 있지만(비교 기사·광고), 영수증이 온 도메인은 그 서비스의 것이다. 보낸 사람이 아는 서비스면
 * 본문은 아예 보지 않는다 — 넷플릭스 메일 본문의 '쿠팡플레이'는 광고다.
 */
export function matchService({
  normalized,
  productName,
  hints,
  paymentMethod,
}: {
  normalized: string;
  productName: string;
  hints?: ReceiptHints;
  paymentMethod: PaymentMethod;
}): { preset?: ServicePreset; matchedIn: MatchedIn; paymentMethod: PaymentMethod } {
  let preset: ServicePreset | undefined;
  let matchedIn: MatchedIn = "body";
  let method = paymentMethod;

  const takeMatch = (item: (typeof SERVICE_KEYWORDS)[number]): boolean => {
    // 키워드 표의 오타로 프리셋을 찾지 못하면 다음 후보를 계속 본다.
    const found = POPULAR_SERVICES.find((s) => s.id === item.presetId);
    if (!found) return false;
    preset = found;
    if (item.defaultPaymentMethod && method === "credit_card") {
      method = item.defaultPaymentMethod;
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
    const senderDomain = senderDomainOf(hints.sender);
    const byDomain = SERVICE_KEYWORDS.find((item) =>
      (item.senderDomains ?? []).some((domain) => isDomainOf(senderDomain, domain)),
    );
    if (byDomain && takeMatch(byDomain)) {
      matchedIn = "sender";
    } else if (matchByKeyword(hints.subject + " " + hints.sender)) {
      matchedIn = "subject";
    } else if (!byDomain) {
      matchByKeyword(productName + " " + hints.body);
    }
  } else {
    matchByKeyword(productName + " " + normalized);
  }

  return { preset, matchedIn, paymentMethod: method };
}
