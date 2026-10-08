import { formatAmount, formatDday, formatKRW, type ActionReason } from "@subslash/shared";
import { describeCheckInText } from "./check-in-text";
import type { Messages } from "./messages";

/**
 * 행동 큐의 한 줄이 왜 떴는지를 지금 언어의 문장으로 만든다. `@subslash/shared`의 `getActionQueue`는 문장이 아니라
 * 값(`ActionReason`)을 돌려주므로 서버와 공유해도 한 언어의 문장이 섞이지 않는다.
 */
export function describeActionReason(t: Messages, reason: ActionReason): string {
  const r = t.dashboard.reason;
  switch (reason.type) {
    case "charged-after-kill":
      return r.chargedAfterKill(
        reason.chargedAt,
        reason.amount !== null ? formatAmount(reason.amount, reason.currency) : null,
      );
    case "trial-ending":
      return r.trialEnding(formatDday(reason.daysLeft), reason.endsAt, formatKRW(reason.stakeKRW));
    case "cancel-notice":
      return r.cancelNotice(reason.noticeAt);
    case "billing-soon-risky":
      return r.billingSoonRisky(
        formatDday(reason.days),
        describeCheckInText(t, reason.checkIn, reason.currency),
        reason.stakeKRW !== null ? formatKRW(reason.stakeKRW) : null,
      );
    case "low-usage-billing-soon": {
      const item = t.value.metaphor[reason.item](reason.count);
      const amount = formatAmount(reason.amount, reason.currency);
      return reason.usageCount === 0
        ? r.lowUsageNone(reason.days, item, amount)
        : r.lowUsage(reason.usageCount, reason.days, item, amount);
    }
    case "billing-soon":
      return reason.hasCheckIn
        ? r.billingSoon(
            formatDday(reason.days),
            reason.stakeKRW !== null ? formatKRW(reason.stakeKRW) : null,
            reason.sinceCheckIn,
          )
        : r.billingSoonNoCheckIn(formatDday(reason.days));
    case "verify-kill": {
      const d = reason.billingDate;
      return r.verifyKill(
        r.killCheckDate(d.getFullYear(), d.getMonth() + 1, d.getDate(), reason.sameYear),
        formatAmount(reason.amount, reason.currency),
      );
    }
    case "amount-changed":
      return r.amountChanged(
        reason.observedAt,
        formatAmount(reason.observed, reason.currency),
        formatAmount(reason.billed, reason.currency),
      );
    case "risky":
      return r.risky(describeCheckInText(t, reason.checkIn, reason.currency));
    case "never-checked-in":
      return r.neverCheckedIn;
    case "stale-check-in":
      return r.staleCheckIn(reason.daysAgo);
    case "price-check":
      return r.priceCheck(formatAmount(reason.amount, reason.currency), reason.taxExcluded);
    case "missing-billing-month":
      return r.missingBillingMonth;
    case "resubscribe-reminder":
      return r.resubscribe(reason.remindOn);
  }
}
