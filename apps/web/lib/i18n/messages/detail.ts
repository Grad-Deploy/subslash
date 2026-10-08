import type { Widen } from "../types";
import { MONTHS_LONG } from "../english";

/**
 * 구독 상세와 해지 안내. 결제 수단 이름·안내(`guide`)·사용자가 적은 해지 단계처럼 서비스 목록이나 사용자의
 * 내용은 옮기지 않는다. 고객센터에 보내는 환불 요청 글(`formatRefundRequest`)도 한국 서비스에 보내는 글이라 그대로다.
 */
const ko0 = {
  detail: {
    missingTitle: "이 기기에는 이 구독이 없어요",
    missingBody: "다른 기기에서 등록했거나 지운 구독이에요. ",
    login: "로그인",
    missingAfter: "하면 기기끼리 기록이 맞춰져요.",
    backToList: "← 구독 목록",
    saved: "저장했어요",
    checkedIn: "체크인 완료",
    saveFailed: "저장하지 못했어요. 다시 시도해 주세요.",
    revived: (name: string) => `${name} 구독 중으로 되돌림`,
    killRecorded: (name: string) => `${name} 해지 완료로 기록`,
    edit: "정보 수정",
    delete: "삭제",
    editTitle: "구독 정보 수정",
    editDescription: "금액·결제일·해지 링크를 고쳐요.",
    back: "← 뒤로 가기",
  },
  summary: {
    killed: "해지 완료",
    active: "구독 중",
    meta: (category: string, plan: string | null, cycle: string) =>
      `카테고리: ${category}${plan ? ` · 요금제: ${plan}` : ""} · 결제 주기: ${cycle}`,
    cycleYearly: "매년",
    cycleMonthly: "매월",
    perYear: "연 ",
    perMonth: "월 ",
    withTax: (amount: string, rate: number) => `요금 ${amount} + 부가세 ${rate}%`,
    monthlyEquiv: (amount: string) => `월 ${amount}꼴`,
    monthlyOn: (day: number) => `매월 ${day}일 결제`,
    yearlyOn: (month: number, day: number) => `매년 ${month}월 ${day}일 결제`,
    yearlyUnset: "연간 결제 · 결제 월 미설정",
    trial: (endsAt: string, dday: string) =>
      `무료 체험 중 · ${endsAt} 종료(${dday}) · 그때까지 지출에서 빼요`,
    nextBilling: "다음 결제까지: ",
    monthUnset: "결제 월 미설정",
    checkIn: "이용 횟수 체크인",
    kill: "지금 해지하기",
    killedNote: "해지한 구독입니다.",
    revive: "다시 구독 중으로 변경",
  },
  routes: {
    title: "해지 경로 안내",
    account: "가입한 계정",
    copyId: "계정 ID 복사",
    idCopied: "계정 ID를 복사했어요",
    copyFailed: "복사하지 못했어요. 화면의 ID를 직접 선택해 주세요",
    loginWith: " 계정으로 로그인해야 해지 버튼이 보여요.",
    loginAny: "가입한 계정으로 로그인하세요. 계정은 ‘정보 수정’에서 적을 수 있어요.",
    paymentMethod: "결제 수단: ",
    paymentEntry:
      "정기결제 목록이 아니라 첫 화면으로 가요. 위 결제 수단 안내대로 해지 메뉴를 찾아가세요.",
    entry: "해지 화면이 아니라 첫 화면·계정 화면으로 가요. 아래 안내대로 해지 메뉴를 찾아가세요.",
    custom: "직접 입력한 주소예요. 어디로 가는지는 확인하지 않았어요.",
    openGuide: "해지 방법 보기",
    savedSteps: "저장해 둔 해지 단계:",
  },
  link: {
    newWindow: (label: string) => `${label} (새 창)`,
    paymentManage: (name: string, direct: boolean) =>
      direct ? `${name} 정기결제 관리 열기` : `${name} 열기`,
    cancelPage: (name: string) => `${name} 해지 페이지 바로가기 (새 창)`,
    cancelPageOpen: (name: string) => `${name} 해지 페이지 열기 (새 창)`,
    open: (name: string) => `${name} 열기 (새 창)`,
  },
  guide: {
    title: (name: string) => `${name} 해지 가이드`,
    description: "링크가 안 열리면 아래 단계를 따라가세요.",
    askTitle: "해지를 마쳤나요?",
    askBody:
      "해지 화면에서 돌아왔어요. 마쳤다면 기록해 두세요. 앱은 해지 여부를 직접 확인할 수 없어요.",
    notYet: "아직이에요",
    done: "해지 완료했어요",
    step1: "1단계 · 해지 화면 열기",
    paymentDirect: (method: string) => `${method}로 결제했다면 여기서 해지해요.`,
    paymentEntry: (method: string) =>
      `${method}로 결제했다면 여기서 해지해요. 정기결제 목록이 아니라 첫 화면으로 가요.`,
    direct: "해지 화면으로 바로 가요.",
    entry: "해지 화면이 아니라 첫 화면·계정 화면으로 가요. 아래 단계대로 해지 메뉴를 찾아가세요.",
    custom: "직접 입력한 주소예요. 어디로 가는지는 확인하지 않았어요.",
    noLinks: "저장된 해지 링크가 없어요. ‘정보 수정’에서 주소를 넣으면 바로가기가 생겨요.",
    together: "함께 받는 서비스",
    togetherNote:
      "결합 상품은 위 해지 화면에서 해지해요. 포함된 서비스만 따로 해지할 수 있는지는 확인하지 못했어요. 해지한 뒤 각 서비스에서 구독이 끝났는지 확인하세요.",
    checkStatus: (name: string) => `${name} 구독 상태 확인하기`,
    openService: (name: string) => `${name} 열기`,
    appBack:
      "서비스 앱으로 열리면 뒤로 가기가 그 앱 안에서 움직일 수 있어요. 확인한 뒤 최근 앱 목록에서 SubSlash로 돌아오세요.",
    fallback: "링크가 안 열릴 때",
    tryAccount: "계정 관리 페이지로 이동 시도",
    guessed: (url: string) => `${url} — 흔한 주소 형태로 추정한 것이라 없을 수 있어요.`,
    homeOf: (host: string) => `${host} 첫 화면 열기`,
    homeNote: "로그인한 뒤 아래 단계를 따라가세요.",
    step2: "2단계 · 해지 메뉴까지 가는 길",
    noSteps: "저장된 단계 안내가 없어요. ‘정보 수정’에 적어 두면 다음에 편해요.",
    alreadyKilled:
      "이미 해지한 구독으로 기록되어 있어요. 해지가 안 됐다면 구독 상세에서 ‘다시 구독 중으로 변경’ 후 다시 기록하세요.",
    close: "닫기",
    doneNote:
      "해지를 마쳤다면 눌러 주세요. 결제일부터 지킨 돈으로 쌓여요. 앱은 해지 여부를 직접 확인할 수 없어요.",
    later: "나중에 하기",
  },
  record: {
    title: "해지 기록",
    killedOn: (date: string) => `${date}에 해지로 기록했어요.`,
    noDate: "해지한 날 기록이 없어요.",
    chargedAfter: "해지 뒤에 결제됐어요",
    chargedNote:
      "고객센터에 보낼 글이에요. 앱에 있는 기록만 넣었어요 — 보내기 전에 읽어 보고 고치세요.",
    copyRefund: "환불 요청 글 복사",
    refundCopied: "환불 요청 글을 복사했어요",
    refundTitle: "환불 요청 글",
    lookAgain: "다시 살펴볼 날",
    lookAgainNote: (app: boolean) =>
      `새 시즌·경기 시즌처럼 다시 쓸 때가 있다면 날을 정해 두세요. 그날 ‘지금 결정할 것’에 올리고${app ? ", 앱 알림을 켰다면 알림도 보내요" : ""}.`,
    due: (date: string) => `${date}이 됐어요. 다시 쓸 때가 아니면 날을 지우거나 미루세요.`,
    save: "저장",
    saveReminder: (date: string) => `${date}에 다시 알려 드릴게요`,
    clear: "지우기",
    cleared: "다시 살펴볼 날을 지웠어요",
    evidence: "해지했다는 근거",
    evidenceNote:
      "해지 확인 메일 제목이나 접수 번호를 적어 두면, 나중에 결제가 또 되었을 때 환불을 요청하는 근거가 돼요. 이 기기와 백업·계정 동기화에만 저장돼요.",
    referenceLabel: "해지 확인 번호나 메일 제목",
    referencePlaceholder: "예: 해지 접수번호, 해지 확인 메일 제목",
    memoLabel: "해지 메모",
    memoPlaceholder: "예: 앱 설정 > 구독에서 해지, 상담원과 통화",
    recordedOn: (date: string) => `${date}에 적음`,
    evidenceSaved: "해지 기록을 저장했어요",
    evidenceCleared: "해지 기록을 지웠어요",
  },
  alt: {
    unknownTitle: "해지 대신 요금제를 낮출 수도 있어요",
    unknownBody: (count: number) =>
      `이 서비스에는 요금제가 ${count}개 있어요. ‘정보 수정’에서 지금 쓰는 요금제를 고르면 더 싼 요금제와 비교해 드려요.`,
    recorded: (plan: string) => `${plan}(으)로 기록했어요`,
    recordedYearly: (plan: string) =>
      `${plan}(으)로 기록했어요. 결제 월을 ‘정보 수정’에서 적어 주세요.`,
    titleCompact: "해지 전에: 더 싼 방법",
    title: "해지 대신 할 수 있는 것",
    nowOn: (plan: string, cycle: string, amount: string, perUse: string | null) =>
      `지금 ${plan} · ${cycle} ${amount}${perUse ? ` · 1회 ${perUse}` : ""}`,
    cycleYearly: "연",
    cycleMonthly: "월",
    cheapest: "이미 이 서비스에서 가장 싼 요금제예요. 더 줄이려면 해지뿐이에요.",
    toYearly: "연 결제로 바꾸기",
    line: (cycle: string, amount: string, monthly: string | null, perUse: string | null) =>
      `${cycle} ${amount}${monthly ? ` (월 ${monthly}꼴)` : ""}${perUse ? ` · 1회 ${perUse}` : ""}`,
    saves: "1년에 덜 내요",
    confirm: (plan: string) =>
      `서비스에서 ${plan}(으)로 바꿨나요? 금액과 요금제를 이걸로 고쳐 둘게요.`,
    confirmYes: "바꿨어요",
    switched: "이 요금제로 바꿨어요",
    footerBase: (taxExcluded: boolean) =>
      `요금표 가격끼리 비교했어요${taxExcluded ? "(세금은 두 쪽에 똑같이 붙어요)" : ""}. 요금제마다 광고·화질·기능이 달라요 — 무엇이 빠지는지는 서비스에서 확인하세요.`,
    footerShared: " 나눠 내는 구독이라 금액은 카드에 찍히는 전체 요금이에요.",
    footerNoUsage: " 최근 30일 안에 체크인하면 1회 단가도 함께 보여 드려요.",
  },
};

const en0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "This device doesn't have this subscription",
    missingBody: "It was added or deleted on another device. ",
    login: "Log in",
    missingAfter: " and your records are matched across devices.",
    backToList: "← Subscriptions",
    saved: "Saved",
    checkedIn: "Checked in",
    saveFailed: "Couldn't save. Please try again.",
    revived: (name) => `${name} set back to subscribed`,
    killRecorded: (name) => `${name} recorded as cancelled`,
    edit: "Edit details",
    delete: "Delete",
    editTitle: "Edit subscription",
    editDescription: "Fix the price, billing day and cancel link.",
    back: "← Back",
  },
  summary: {
    killed: "Cancelled",
    active: "Subscribed",
    meta: (category, plan, cycle) =>
      `Category: ${category}${plan ? ` · Plan: ${plan}` : ""} · Billing cycle: ${cycle}`,
    cycleYearly: "yearly",
    cycleMonthly: "monthly",
    perYear: "Yearly ",
    perMonth: "Monthly ",
    withTax: (amount, rate) => `Price ${amount} + ${rate}% VAT`,
    monthlyEquiv: (amount) => `About ${amount}/month`,
    monthlyOn: (day) => `Billed on day ${day} of every month`,
    yearlyOn: (month, day) => `Billed every year on ${monthDay(month, day)}`,
    yearlyUnset: "Billed yearly · billing month not set",
    trial: (endsAt, dday) =>
      `On a free trial · ends ${endsAt} (${dday}) · left out of your spending until then`,
    nextBilling: "Until the next payment: ",
    monthUnset: "Billing month not set",
    checkIn: "Check in your usage",
    kill: "Cancel now",
    killedNote: "This subscription is cancelled.",
    revive: "Set back to subscribed",
  },
  routes: {
    title: "How to cancel",
    account: "Sign-up account",
    copyId: "Copy account ID",
    idCopied: "Copied the account ID",
    copyFailed: "Couldn't copy. Please select the ID on screen yourself",
    loginWith: " — log in with this account to see the cancel button.",
    loginAny: "Log in with the account you signed up with. You can enter it under “Edit details”.",
    paymentMethod: "Payment method: ",
    paymentEntry:
      "This goes to the home page, not the recurring-payment list. Follow the payment method notes above to find the cancel menu.",
    entry:
      "This goes to the home or account page, not a cancel page. Follow the guide below to find the cancel menu.",
    custom: "This is an address you entered. We haven't checked where it goes.",
    openGuide: "See how to cancel",
    savedSteps: "Saved cancellation steps:",
  },
  link: {
    newWindow: (label) => `${label} (new window)`,
    paymentManage: (name, direct) =>
      direct ? `Manage recurring payments in ${name}` : `Open ${name}`,
    cancelPage: (name) => `Go straight to the ${name} cancel page (new window)`,
    cancelPageOpen: (name) => `Open the ${name} cancel page (new window)`,
    open: (name) => `Open ${name} (new window)`,
  },
  guide: {
    title: (name) => `How to cancel ${name}`,
    description: "If a link doesn't open, follow the steps below.",
    askTitle: "Did you finish cancelling?",
    askBody:
      "You're back from the cancel page. If you finished, record it. The app can't check whether you cancelled.",
    notYet: "Not yet",
    done: "I cancelled",
    step1: "Step 1 · Open the cancel page",
    paymentDirect: (method) => `If you paid with ${method}, cancel here.`,
    paymentEntry: (method) =>
      `If you paid with ${method}, cancel here. This goes to the home page, not the recurring-payment list.`,
    direct: "This goes straight to the cancel page.",
    entry:
      "This goes to the home or account page, not a cancel page. Follow the steps below to find the cancel menu.",
    custom: "This is an address you entered. We haven't checked where it goes.",
    noLinks: "No cancel link is saved. Add an address under “Edit details” to get a shortcut.",
    together: "Services you get together",
    togetherNote:
      "A bundle is cancelled on the cancel page above. We haven't confirmed whether the included services can be cancelled on their own. After cancelling, check in each service that the subscription has ended.",
    checkStatus: (name) => `Check ${name} subscription status`,
    openService: (name) => `Open ${name}`,
    appBack:
      "If it opens in the service's app, the back button may move around inside that app. After checking, return to SubSlash from your recent apps.",
    fallback: "If the link doesn't open",
    tryAccount: "Try the account management page",
    guessed: (url) => `${url} — a guess based on common address patterns, so it may not exist.`,
    homeOf: (host) => `Open the ${host} home page`,
    homeNote: "Log in, then follow the steps below.",
    step2: "Step 2 · The way to the cancel menu",
    noSteps: "No steps are saved. Add them under “Edit details” to make it easier next time.",
    alreadyKilled:
      "This is already recorded as cancelled. If it didn't go through, choose “Set back to subscribed” in the subscription details and record it again.",
    close: "Close",
    doneNote:
      "Tap this once you've cancelled. It counts as money kept from the billing date. The app can't check whether you cancelled.",
    later: "Later",
  },
  record: {
    title: "Cancellation record",
    killedOn: (date) => `Recorded as cancelled on ${date}.`,
    noDate: "There's no record of the cancellation date.",
    chargedAfter: "You were charged after cancelling",
    chargedNote:
      "This is a message for customer support. It only uses records in the app — read and edit it before sending.",
    copyRefund: "Copy refund request",
    refundCopied: "Copied the refund request",
    refundTitle: "Refund request",
    lookAgain: "Day to look again",
    lookAgainNote: (app) =>
      `If there's a time you'd use it again, such as a new season, pick a day. It goes into “To decide now” that day${app ? ", and if app notifications are on, we'll notify you too" : ""}.`,
    due: (date) => `It's ${date}. If it isn't time to use it again, clear or postpone the day.`,
    save: "Save",
    saveReminder: (date) => `We'll remind you on ${date}`,
    clear: "Clear",
    cleared: "Cleared the day to look again",
    evidence: "Proof you cancelled",
    evidenceNote:
      "Note the subject of the cancellation email or a reference number, and it backs up a refund request if you're charged again later. It's only stored on this device and in backups and account sync.",
    referenceLabel: "Cancellation reference or email subject",
    referencePlaceholder: "e.g. cancellation reference, cancellation email subject",
    memoLabel: "Cancellation notes",
    memoPlaceholder: "e.g. Cancelled in app settings > subscriptions, spoke to an agent",
    recordedOn: (date) => `Noted on ${date}`,
    evidenceSaved: "Saved the cancellation record",
    evidenceCleared: "Cleared the cancellation record",
  },
  alt: {
    unknownTitle: "You could lower the plan instead of cancelling",
    unknownBody: (count) =>
      `This service has ${count} plans. Pick the plan you use under “Edit details” and we'll compare it with cheaper ones.`,
    recorded: (plan) => `Recorded as ${plan}`,
    recordedYearly: (plan) => `Recorded as ${plan}. Enter the billing month under “Edit details”.`,
    titleCompact: "Before cancelling: a cheaper way",
    title: "What you can do instead of cancelling",
    nowOn: (plan, cycle, amount, perUse) =>
      `Now ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} per use` : ""}`,
    cycleYearly: "yearly",
    cycleMonthly: "monthly",
    cheapest:
      "This is already the cheapest plan of the service. Cancelling is the only way to cut more.",
    toYearly: "Switch to yearly billing",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (about ${monthly}/month)` : ""}${perUse ? ` · ${perUse} per use` : ""}`,
    saves: "Less per year",
    confirm: (plan) =>
      `Did you switch to ${plan} in the service? We'll change the price and plan to match.`,
    confirmYes: "I switched",
    switched: "I switched to this plan",
    footerBase: (taxExcluded) =>
      `Compared by list price${taxExcluded ? " (tax is added equally to both)" : ""}. Plans differ in ads, quality and features — check in the service what you'd lose.`,
    footerShared:
      " This is a shared subscription, so the price is the full amount charged to the card.",
    footerNoUsage: " Check in within the last 30 days and we'll show the cost per use too.",
  },
};

function monthDay(month: number, day: number): string {
  return `${MONTHS_LONG[Number(month) - 1] ?? month} ${day}`;
}

export const ko = {
  detail: {
    ...ko0.detail,
    summary: ko0.summary,
    routes: ko0.routes,
    link: ko0.link,
    guide: ko0.guide,
    record: ko0.record,
    alt: ko0.alt,
  },
};

export const en: Widen<typeof ko> = {
  detail: {
    ...en0.detail,
    summary: en0.summary,
    routes: en0.routes,
    link: en0.link,
    guide: en0.guide,
    record: en0.record,
    alt: en0.alt,
  },
};
