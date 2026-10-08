import type { Widen } from "../types";

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const monthName = (month: number) => EN_MONTHS[Number(month) - 1] ?? String(month);
/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;

/** 대시보드 본문: 머리말·월 고정지출·지킨 돈·결제 캘린더·이번 달 결제일 현황. */
export const ko = {
  page: {
    title: "오늘의 구독 점검",
    subtitle: "결정이 필요한 구독만 모았어요.",
    autoImport: "자동 불러오기",
    addNew: "+ 새 구독 등록",
    summaryLabel: "이번 달 요약",
    demoStarted: "샘플 체험 시작 · 내 구독과 섞이지 않아요",
    checkInRecorded: (name: string) => `${name} 사용 횟수를 기록했습니다.`,
  },
  totalSpend: {
    title: "월 고정지출",
    inTrial: (count: number, amount: string) =>
      `체험 중 ${count}건은 빼고 셉니다 · 끝나면 월 ${amount}이 더해집니다`,
    shared: (count: number, billed: string) =>
      `공유 구독 ${count}건 반영 · 카드 청구액은 월 ${billed}`,
    byCategory: "분류별 월 지출",
    moreCategories: (count: number) => `외 ${count}개 분류`,
  },
  savings: {
    title: "지킨 돈",
    confirmedNote: "해지 뒤 결제일이 지났고, 그날 결제가 없었다고 확인한 금액입니다.",
    nothingPassed:
      "아직 해지 뒤 결제일이 지나지 않았습니다. 첫 결제일이 지나면 결제가 멈췄는지 여쭤볼게요.",
    pending: (amount: string, count: number) => `확인 대기 ${amount} (${count}건)`,
    pendingNote:
      "결제일은 지났지만 결제가 멈췄는지 아직 답하지 않은 해지입니다. 답하면 지킨 돈에 더해집니다.",
    answerOnDashboard: "대시보드에서 답하기 →",
    ahead: "앞으로",
    runRate: (amount: string) => `해지를 유지하면 연 ${amount} 아끼는 중`,
    unknown: (count: number) =>
      `결제 월이나 해지 날짜를 모르는 ${count}건은 언제 결제되는지 알 수 없어 지킨 돈과 확인 대기에서 빠졌습니다.`,
    link: {
      pendingPrefix: (amount: string) => `확인 대기 ${amount} · `,
      summary: (runRate: string, level: string, title: string) =>
        `연 ${runRate} 아끼는 중 · ${level} ${title}`,
      unknownExcluded: (count: number) => ` · 결제 월 미설정 ${count}건 제외`,
      goSavings: "절약 현황 →",
    },
  },
  risk: {
    green: "유지",
    yellow: "주의",
    red: "해지 권고",
    title: (label: string) => `위험도: ${label}`,
  },
  dday: {
    billingMonthUnset: "결제 월 미설정",
    tellYearlyDate: "연간 결제일을 알려주세요",
  },
  calendar: {
    title: "결제 캘린더",
    thisMonth: "이번 달",
    prevMonth: "이전 달",
    nextMonth: "다음 달",
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    monthLabel: (year: number, month: number) => `${year}년 ${month}월`,
    dayWithCount: (month: number, day: number, count: number) =>
      `${month}월 ${day}일, 결제 ${count}건`,
    dayNone: (month: number, day: number) => `${month}월 ${day}일, 결제 없음`,
    noSubscriptions: "등록한 구독이 없어요. 구독을 등록하면 결제일이 달력에 찍혀요.",
    noneThisMonth: "이 달에 청구되는 구독이 없습니다.",
    summary: (days: number, count: number) => `이 달 결제 ${days}일 · ${count}건 · `,
    pickHint: " — 점이 있는 날짜를 누르면 무엇이 나가는지 봅니다",
    undated: (count: number) => `결제 월 미설정 ${count}건은 날짜를 몰라 찍지 못했습니다 — `,
    undatedLink: "연간 구독의 결제 월 적기",
    dayHeading: (month: number, day: number) => `${month}월 ${day}일 결제`,
    total: "합계",
    converted: " (내 환율로 환산)",
    sheet: "결제 달력",
    sheetSoon: (days: number) => `결제 달력 · ${days}일 안에 결제 있음`,
    next: "다음 결제",
    noKnownDate: "결제일을 아는 구독이 없어요",
    leftThisMonth: (count: number) => `이번 달 남은 결제 ${count}건 · `,
    viewCalendar: "달력 보기",
  },
  defense: {
    title: (month: number) => `${month}월 결제일 현황`,
    passed: "해지 뒤 지나간 결제일",
    upcoming: "남은 결제일 (해지를 유지하면)",
    none: "이번 달에는 해지 뒤에 돌아오는 결제일이 없습니다.",
    unverified:
      "결제가 멈췄는지 아직 확인하지 않은 해지도 들어 있습니다. 확인된 금액은 위 ‘지킨 돈’에 있습니다.",
    unknown: (count: number) =>
      `결제 월을 모르는 연간 구독 ${count}건은 이번 달 결제 여부를 알 수 없어 합계에서 빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.`,
    blocked: (cur: number, curAmount: string, prev: number, prevAmount: string) =>
      `해지로 막는 결제: ${cur}월 ${curAmount} · ${prev}월 ${prevAmount} — `,
    more: (amount: string) => `지난달보다 ${amount} 더 막습니다`,
    less: (amount: string) => `지난달보다 ${amount} 적습니다`,
    same: "지난달과 같습니다",
  },
};

export const en: Widen<typeof ko> = {
  page: {
    title: "Today's subscription check",
    subtitle: "Only the subscriptions that need a decision.",
    autoImport: "Auto import",
    addNew: "+ Add subscription",
    summaryLabel: "This month's summary",
    demoStarted: "Sample tour started · it won't mix with your subscriptions",
    checkInRecorded: (name) => `Recorded your ${name} usage.`,
  },
  totalSpend: {
    title: "Monthly fixed spending",
    inTrial: (count, amount) =>
      `${count} on a free trial ${one(count) ? "is" : "are"} not counted · ${amount}/month will be added when ${one(count) ? "it ends" : "they end"}`,
    shared: (count, billed) =>
      `Includes ${count} shared ${one(count) ? "subscription" : "subscriptions"} · charged to your card: ${billed}/month`,
    byCategory: "Monthly spending by category",
    moreCategories: (count) => `and ${count} more ${one(count) ? "category" : "categories"}`,
  },
  savings: {
    title: "Money kept",
    confirmedNote: "The amount confirmed as not charged on the billing date after you cancelled.",
    nothingPassed:
      "No billing date has passed since you cancelled yet. We'll ask whether the charge stopped once the first one does.",
    pending: (amount, count) => `Awaiting confirmation ${amount} (${count})`,
    pendingNote:
      "The billing date has passed but you haven't said whether the charge stopped. Answer to add it to the money you kept.",
    answerOnDashboard: "Answer on the dashboard →",
    ahead: "Going forward",
    runRate: (amount) => `Keeping these cancelled saves ${amount} a year`,
    unknown: (count) =>
      `${count} with an unknown billing month or cancellation date can't be placed in time, so they are left out of the money kept and the pending amount.`,
    link: {
      pendingPrefix: (amount) => `Awaiting confirmation ${amount} · `,
      summary: (runRate, level, title) => `Saving ${runRate} a year · ${level} ${title}`,
      unknownExcluded: (count) => ` · ${count} without a billing month left out`,
      goSavings: "Savings →",
    },
  },
  risk: {
    green: "Keep",
    yellow: "Caution",
    red: "Cancel advised",
    title: (label) => `Risk: ${label}`,
  },
  dday: {
    billingMonthUnset: "Billing month not set",
    tellYearlyDate: "Tell us the yearly billing date",
  },
  calendar: {
    title: "Billing calendar",
    thisMonth: "This month",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthLabel: (year, month) => `${monthName(month)} ${year}`,
    dayWithCount: (month, day, count) =>
      `${monthName(month)} ${day}, ${count} ${one(count) ? "payment" : "payments"}`,
    dayNone: (month, day) => `${monthName(month)} ${day}, no payments`,
    noSubscriptions: "No subscriptions yet. Add one and its billing date shows up on the calendar.",
    noneThisMonth: "No subscription is billed this month.",
    summary: (days, count) =>
      `This month: ${days} ${one(days) ? "day" : "days"} · ${count} ${one(count) ? "payment" : "payments"} · `,
    pickHint: " — tap a dotted date to see what is charged",
    undated: (count) =>
      `${count} without a billing month couldn't be placed because the date is unknown — `,
    undatedLink: "Set the billing month of yearly subscriptions",
    dayHeading: (month, day) => `Charged on ${monthName(month)} ${day}`,
    total: "Total",
    converted: " (converted at your rate)",
    sheet: "Billing calendar",
    sheetSoon: (days) => `Billing calendar · a payment within ${days} days`,
    next: "Next payment",
    noKnownDate: "No subscription has a known billing date",
    leftThisMonth: (count) => `${count} ${one(count) ? "payment" : "payments"} left this month · `,
    viewCalendar: "View calendar",
  },
  defense: {
    title: (month) => `Billing dates in ${monthName(month)}`,
    passed: "Billing dates passed since cancelling",
    upcoming: "Billing dates left (if you stay cancelled)",
    none: "No billing date falls after a cancellation this month.",
    unverified:
      "Some cancellations are included whose charge you haven't confirmed stopped. Confirmed amounts are in “Money kept” above.",
    unknown: (count) =>
      `${count} yearly ${one(count) ? "subscription" : "subscriptions"} with an unknown billing month can't be placed in this month, so ${one(count) ? "it is" : "they are"} left out of the total. Set the billing month in the subscription details to include ${one(count) ? "it" : "them"}.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Charges blocked by cancelling: ${monthName(cur)} ${curAmount} · ${monthName(prev)} ${prevAmount} — `,
    more: (amount) => `${amount} more than last month`,
    less: (amount) => `${amount} less than last month`,
    same: "Same as last month",
  },
};
