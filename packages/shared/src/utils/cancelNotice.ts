import type { Currency, Subscription } from "../types";
import { isSameService } from "./chargeHistory";

/** 해지 알림을 적을 구독과 그 메일 날짜. */
export interface CancelNoticeMatch {
  subscriptionId: string;
  /** 메일 날짜(`YYYY.MM.DD`). */
  receiptDate: string;
}

/** `YYYY.MM.DD` → `YYYY-MM-DD`. 형식이 다르면 null. */
function isoDay(receiptDate: string): string | null {
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(receiptDate);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/**
 * 가져온 메일 중 해지·취소 알림을 구독 중인 구독에 짝짓는다(`Subscription.cancelNoticeAt`).
 *
 * 메일 후보는 서비스마다 가장 최근 메일로 만들어지므로(`parseReceiptEmails`), 해지 알림 후보는 "그 서비스의
 * 마지막 메일이 해지 알림"이라는 뜻이다. 그래도 해지했다고 단정하지 않는다 — 묻기만 한다.
 *
 * 건너뛰는 것:
 * - 구독 중이 아닌 구독. 이미 해지했으면 물을 것이 없다.
 * - 그 메일보다 뒤에 등록한 구독. 해지 알림을 받은 뒤 다시 구독해 등록했을 수 있다.
 * - 같은 메일로 이미 물었거나 "아직 구독 중"이라고 답한 구독.
 */
export function matchCancelNotices(
  subscriptions: readonly Pick<
    Subscription,
    | "id"
    | "name"
    | "currency"
    | "status"
    | "createdAt"
    | "cancelNoticeAt"
    | "cancelNoticeDismissedAt"
  >[],
  found: readonly {
    name: string;
    currency: Currency;
    isCanceled?: boolean;
    receiptDate?: string;
  }[],
): CancelNoticeMatch[] {
  const matches: CancelNoticeMatch[] = [];
  for (const item of found) {
    if (!item.isCanceled || !item.receiptDate) continue;
    const day = isoDay(item.receiptDate);
    if (!day) continue;
    const target = subscriptions.find((sub) => sub.status === "active" && isSameService(sub, item));
    if (!target) continue;
    if (target.createdAt.slice(0, 10) > day) continue;
    if (
      target.cancelNoticeAt === item.receiptDate ||
      target.cancelNoticeDismissedAt === item.receiptDate
    ) {
      continue;
    }
    matches.push({ subscriptionId: target.id, receiptDate: item.receiptDate });
  }
  return matches;
}
