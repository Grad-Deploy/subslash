import type { ReceiptEmail } from "./parser";
import { isDomainOf, senderDomainOf } from "./parser";

/**
 * 멤버십의 혜택을 적을 때 기댈 근거 — 최근 30일 주문 메일 수.
 *
 * 멤버십(쿠팡 와우 등)의 돈값은 혜택 금액(utils/valueMetric의 `benefit`)으로 잰다. 혜택 금액은 앱이 알
 * 수 없어서(주문마다 무료 배송·할인이 다르다) 사용자가 적되, Gmail 가져오기로 받은 메일에서 주문 메일을
 * 세어 옆에 보여 준다. 금액으로 바꾸지 않는다 — '주문 1건 = 3,000원'은 지어낸 숫자다.
 *
 * 발신 도메인은 영수증 파싱 표(parser의 senderDomains)에서 확인된 서비스만 적는다. 배민클럽·네이버플러스는
 * 주문 메일의 발신 주소를 확인하지 못해 넣지 않았다. 세는 것은 브라우저 안에서만 하고 서버로 보내지 않는다.
 */
interface OrderSource {
  presetId: string;
  senderDomains: readonly string[];
  /** 제목에 이 중 하나가 있어야 주문 메일이다. */
  subjectIncludes: readonly string[];
  /** 멤버십 결제·취소·반품 메일은 주문이 아니다. */
  subjectExcludes: readonly string[];
}

export const MEMBERSHIP_ORDER_SOURCES: readonly OrderSource[] = [
  {
    presetId: "coupang-wow",
    senderDomains: ["coupang.com"],
    subjectIncludes: ["주문"],
    subjectExcludes: ["와우", "멤버십", "취소", "반품", "환불"],
  },
];

const WINDOW_DAYS = 30;

export interface OrderCount {
  presetId: string;
  count: number;
  /** 센 기간의 시작(YYYY-MM-DD). */
  since: string;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * 받은 메일에서 멤버십마다 최근 30일 주문 메일 수. 한 통도 못 찾은 멤버십은 돌려주지 않는다 — 가져온
 * 메일에 없다는 것이지 주문하지 않았다는 뜻이 아니다(스크립트는 메일 수에 상한을 둔다).
 */
export function countMembershipOrders(emails: readonly ReceiptEmail[], now: Date): OrderCount[] {
  const sinceMs = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const since = dayKey(new Date(sinceMs));
  const result: OrderCount[] = [];
  for (const source of MEMBERSHIP_ORDER_SOURCES) {
    let count = 0;
    for (const email of emails) {
      const at = Date.parse(email.date);
      if (Number.isNaN(at) || at < sinceMs || at > now.getTime()) continue;
      const domain = senderDomainOf(email.from);
      if (!source.senderDomains.some((registrable) => isDomainOf(domain, registrable))) continue;
      const subject = email.subject;
      if (!source.subjectIncludes.some((word) => subject.includes(word))) continue;
      if (source.subjectExcludes.some((word) => subject.includes(word))) continue;
      count += 1;
    }
    if (count > 0) result.push({ presetId: source.presetId, count, since });
  }
  return result;
}
