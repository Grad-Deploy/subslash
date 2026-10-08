import type { Widen } from "../types";

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 대시보드의 '지금 결정할 것'. 각 줄이 왜 떴는지는 `lib/i18n/action-reason`이 아래 문장 틀에 값을 넣어 만든다. */
export const ko = {
  queue: {
    title: (count: number) => `지금 결정할 것 (${count})`,
    urgentFirst: "급한 순",
    emptyTitle: "아직 등록된 구독이 없어요",
    emptyHint: "구독을 등록하면 결정할 일이 여기 떠요.",
    addFirst: "+ 첫 구독 등록",
    nothingToDecide: "지금 결정할 것이 없어요",
    nextBilling: (name: string, dday: string) => `다음 결제: ${name} ${dday}`,
    noBillingKnown: "결제일을 아는 구독이 없어요. 구독 상세에서 채워 주세요.",
    tagVerifyKill: "해지 확인",
    tagResubscribe: "다시 살펴볼 날",
    tagCancelNotice: "해지 메일",
    tagChargedAfterKill: "해지 후 결제됨",
    checkIn: "체크인",
    updateTo: (amount: string) => `${amount}으로 갱신`,
    edit: "수정",
    charged: "결제됐어요",
    stillSubscribed: "아직 구독 중",
    verbs: {
      "cancel-guide": "해지 가이드",
      "check-in": "체크인하기",
      "confirm-price": "요금 유지",
      "set-billing-month": "결제 월 입력",
      "verify-kill": "결제 안 됐어요",
      "confirm-cancel": "해지했어요",
      "review-resubscribe": "살펴보기",
    },
    fold: {
      expand: "펼치기",
      collapse: "접기",
      mostUrgent: "가장 급한 것:",
      andMore: (count: number) => ` 외 ${count}건`,
    },
  },
  reason: {
    chargedAfterKill: (date: string, amount: string | null) =>
      `해지로 기록한 뒤인 ${date}에 결제 메일이 왔습니다${amount ? ` (${amount})` : ""}. 해지가 안 됐을 수 있으니 다시 확인해 주세요.`,
    trialEnding: (dday: string, endsAt: string, stake: string) =>
      `${dday} · 무료 체험이 ${endsAt}에 끝납니다. 그대로 두면 ${stake}부터 결제가 시작됩니다.`,
    cancelNotice: (date: string) =>
      `${date}에 해지·취소 알림 메일이 왔습니다. 해지했다면 기록해 주세요. 요금제 변경이나 환불 안내일 수도 있어요.`,
    billingSoonRisky: (dday: string, checkIn: string, stake: string | null) =>
      `${dday} · 마지막 체크인: ${checkIn}` +
      (stake !== null ? `. 결제 전에 끊으면 ${stake}을 지킵니다.` : "."),
    lowUsageNone: (days: number, item: string, amount: string) =>
      `이번 달 이용이 아직 없었어요. ${days}일 뒤 자동 갱신 전에 잠시 구독을 멈추고 ${item} 값(${amount})을 아껴볼까요?`,
    lowUsage: (uses: number, days: number, item: string, amount: string) =>
      `이번 달은 ${uses}회만 이용했어요. ${days}일 뒤 갱신 전에 잠시 쉬어가면 ${item} 값(${amount})을 지킬 수 있어요.`,
    billingSoon: (dday: string, stake: string | null, sinceCheckIn: number | null) =>
      `${dday} · ${stake !== null ? `${stake}이 곧 빠져나갑니다.` : "곧 결제됩니다."}` +
      (sinceCheckIn !== null
        ? ` 마지막 체크인이 ${sinceCheckIn}일 전이라 결제 전에 다시 확인해 보세요.`
        : ""),
    billingSoonNoCheckIn: (dday: string) =>
      `${dday} · 아직 체크인한 적이 없어, 끊을지 판단할 근거가 없습니다.`,
    verifyKill: (date: string, amount: string) =>
      `해지 후 첫 결제일 ${date}이 지났습니다. 그날 ${amount}이 결제됐나요? 결제 문자나 카드 내역에서 확인해 주세요.`,
    amountChanged: (date: string, observed: string, billed: string) =>
      `${date} 결제 메일에는 ${observed}이 찍혔는데, 등록된 청구액은 ${billed}입니다. 어느 쪽이 맞는지 확인해 주세요.`,
    risky: (checkIn: string) => `마지막 체크인: ${checkIn}. 돈값을 못 하고 있습니다.`,
    neverCheckedIn: "아직 체크인한 적이 없습니다. 얼마나 썼는지 모르면 끊을지 판단할 수 없습니다.",
    staleCheckIn: (days: number) =>
      `마지막 체크인이 ${days}일 전입니다. 그 사이 사용 습관이 달라졌을 수 있습니다.`,
    priceCheck: (amount: string, taxExcluded: boolean) =>
      `등록된 금액이 ${amount}${taxExcluded ? "(세금 별도)" : ""}입니다. 지금도 맞는지 확인해주세요.`,
    missingBillingMonth: "연간 결제인데 결제 월이 없어 D-day도, 지킨 금액도 계산할 수 없습니다.",
    resubscribe: (date: string) =>
      `해지할 때 ${date}에 다시 알려 달라고 하셨어요. 다시 쓸 때가 됐는지 살펴보세요. 필요 없으면 알림만 지우면 돼요.`,
    /** "9월 15일". 올해가 아니면 "2025년 12월 5일". */
    killCheckDate: (year: number, month: number, day: number, sameYear: boolean) =>
      sameYear ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`,
  },
};

export const en: Widen<typeof ko> = {
  queue: {
    title: (count) => `To decide now (${count})`,
    urgentFirst: "Most urgent first",
    emptyTitle: "No subscriptions yet",
    emptyHint: "Add a subscription and the things to decide will show up here.",
    addFirst: "+ Add your first subscription",
    nothingToDecide: "Nothing to decide right now",
    nextBilling: (name, dday) => `Next charge: ${name} ${dday}`,
    noBillingKnown:
      "No subscription has a known billing date. Fill it in on the subscription page.",
    tagVerifyKill: "Cancellation check",
    tagResubscribe: "Time to look again",
    tagCancelNotice: "Cancellation email",
    tagChargedAfterKill: "Charged after cancelling",
    checkIn: "Check in",
    updateTo: (amount) => `Update to ${amount}`,
    edit: "Edit",
    charged: "I was charged",
    stillSubscribed: "Still subscribed",
    verbs: {
      "cancel-guide": "Cancel guide",
      "check-in": "Check in",
      "confirm-price": "Keep price",
      "set-billing-month": "Set billing month",
      "verify-kill": "Not charged",
      "confirm-cancel": "I cancelled",
      "review-resubscribe": "Take a look",
    },
    fold: {
      expand: "Expand",
      collapse: "Collapse",
      mostUrgent: "Most urgent:",
      andMore: (count) => ` and ${count} more`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `A payment email arrived on ${date}, after you marked this as cancelled${amount ? ` (${amount})` : ""}. The cancellation may not have gone through, so please check again.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Your free trial ends on ${endsAt}. If you leave it, billing starts at ${stake}.`,
    cancelNotice: (date) =>
      `A cancellation email arrived on ${date}. If you did cancel, please record it. It may also be a plan change or refund notice.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Last check-in: ${checkIn}` +
      (stake !== null ? `. Cancel before it renews to keep ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `No use yet this month. Pause the subscription before it renews in ${days} days and you could save ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Only ${uses} ${uses === 1 ? "use" : "uses"} this month. Take a break before it renews in ${days} days and you keep ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `${stake} is about to be charged.` : "A payment is coming up."}` +
      (sinceCheckIn !== null
        ? ` Your last check-in was ${sinceCheckIn} ${sinceCheckIn === 1 ? "day" : "days"} ago, so check again before it renews.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · You haven't checked in yet, so there is nothing to base a decision on.`,
    verifyKill: (date, amount) =>
      `The first billing date after you cancelled, ${date}, has passed. Was ${amount} charged that day? Check your card statement or payment texts.`,
    amountChanged: (date, observed, billed) =>
      `The payment email from ${date} shows ${observed}, but the registered amount is ${billed}. Please check which one is right.`,
    risky: (checkIn) => `Last check-in: ${checkIn}. This isn't earning its price.`,
    neverCheckedIn:
      "You haven't checked in yet. Without knowing how much you use it, you can't decide whether to cancel.",
    staleCheckIn: (days) =>
      `Your last check-in was ${days} ${days === 1 ? "day" : "days"} ago. Your usage may have changed since.`,
    priceCheck: (amount, taxExcluded) =>
      `The registered amount is ${amount}${taxExcluded ? " (tax not included)" : ""}. Please check it is still right.`,
    missingBillingMonth:
      "This is billed yearly but has no billing month, so the D-day and the amount you would keep can't be worked out.",
    resubscribe: (date) =>
      `When you cancelled, you asked to be reminded on ${date}. See whether it's time to use it again. If not, just clear the reminder.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${EN_MONTHS[month - 1]} ${day}` : `${EN_MONTHS[month - 1]} ${day}, ${year}`,
  },
};
