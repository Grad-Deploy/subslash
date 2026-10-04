import { POPULAR_SERVICES } from "../../constants/services";
import { SERVICE_KEYWORDS } from "./serviceKeywords";

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

export function isPlatformSender(sender: string): boolean {
  const domain = senderDomainOf(sender);
  return PLATFORM_SENDER_DOMAINS.some((registrable) => isDomainOf(domain, registrable));
}

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
export function splitPlatformReceipt(body: string): { presetId: string; text: string }[] {
  const lower = body.toLowerCase();
  const found = new Map<string, number>();

  for (const item of SERVICE_KEYWORDS) {
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
