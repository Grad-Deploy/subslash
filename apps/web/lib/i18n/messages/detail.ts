import { josa } from "../../ask/josa";
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
    recorded: (plan: string) => `${plan}${josa(plan, "으로", "로")} 기록했어요`,
    recordedYearly: (plan: string) =>
      `${plan}${josa(plan, "으로", "로")} 기록했어요. 결제 월을 ‘정보 수정’에서 적어 주세요.`,
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
      `서비스에서 ${plan}${josa(plan, "으로", "로")} 바꿨나요? 금액과 요금제를 이걸로 고쳐 둘게요.`,
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

// 중국어(간체)·일본어·베트남어.
const zh0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "这台设备上没有这个订阅",
    missingBody: "它是在其他设备上添加或删除的。",
    login: "登录",
    missingAfter: "后，各设备的记录会同步一致。",
    backToList: "← 订阅列表",
    saved: "已保存",
    checkedIn: "已签到",
    saveFailed: "未能保存。请重试。",
    revived: (name) => `${name} 已改回订阅中`,
    killRecorded: (name) => `${name} 已记录为已退订`,
    edit: "编辑信息",
    delete: "删除",
    editTitle: "编辑订阅信息",
    editDescription: "修改金额、扣款日和退订链接。",
    back: "← 返回",
  },
  summary: {
    killed: "已退订",
    active: "订阅中",
    meta: (category, plan, cycle) =>
      `类别：${category}${plan ? ` · 套餐：${plan}` : ""} · 扣款周期：${cycle}`,
    cycleYearly: "每年",
    cycleMonthly: "每月",
    perYear: "年付 ",
    perMonth: "月付 ",
    withTax: (amount, rate) => `价格 ${amount} + 增值税 ${rate}%`,
    monthlyEquiv: (amount) => `约每月 ${amount}`,
    monthlyOn: (day) => `每月 ${day} 日扣款`,
    yearlyOn: (month, day) => `每年 ${month} 月 ${day} 日扣款`,
    yearlyUnset: "年付 · 未设置扣款月份",
    trial: (endsAt, dday) => `免费试用中 · ${endsAt} 结束（${dday}）· 在此之前不计入支出`,
    nextBilling: "距下次扣款：",
    monthUnset: "未设置扣款月份",
    checkIn: "签到使用次数",
    kill: "立即退订",
    killedNote: "这是已退订的订阅。",
    revive: "改回订阅中",
  },
  routes: {
    title: "退订途径",
    account: "注册账户",
    copyId: "复制账户 ID",
    idCopied: "已复制账户 ID",
    copyFailed: "未能复制。请直接选中屏幕上的 ID",
    loginWith: " —— 用这个账户登录才能看到退订按钮。",
    loginAny: "请用注册时的账户登录。账户可以在“编辑信息”中填写。",
    paymentMethod: "支付方式：",
    paymentEntry: "这会进入首页，而不是定期付款列表。请按上面的支付方式说明找到退订菜单。",
    entry: "这会进入首页或账户页面，而不是退订页面。请按下面的指南找到退订菜单。",
    custom: "这是你自己输入的地址。我们没有确认它会进入哪里。",
    openGuide: "查看退订方法",
    savedSteps: "已保存的退订步骤：",
  },
  link: {
    newWindow: (label) => `${label}（新窗口）`,
    paymentManage: (name, direct) => (direct ? `打开 ${name} 定期付款管理` : `打开 ${name}`),
    cancelPage: (name) => `直接前往 ${name} 退订页面（新窗口）`,
    cancelPageOpen: (name) => `打开 ${name} 退订页面（新窗口）`,
    open: (name) => `打开 ${name}（新窗口）`,
  },
  guide: {
    title: (name) => `${name} 退订指南`,
    description: "如果链接打不开，请按下面的步骤操作。",
    askTitle: "退订完成了吗？",
    askBody: "你从退订页面回来了。如果已完成，请记录下来。应用无法自行确认是否已退订。",
    notYet: "还没有",
    done: "我已退订",
    step1: "第 1 步 · 打开退订页面",
    paymentDirect: (method) => `如果用 ${method} 付款，请在这里退订。`,
    paymentEntry: (method) =>
      `如果用 ${method} 付款，请在这里退订。这会进入首页，而不是定期付款列表。`,
    direct: "直接进入退订页面。",
    entry: "这会进入首页或账户页面，而不是退订页面。请按下面的步骤找到退订菜单。",
    custom: "这是你自己输入的地址。我们没有确认它会进入哪里。",
    noLinks: "没有保存退订链接。在“编辑信息”中填写地址后就会出现快捷方式。",
    together: "一起获得的服务",
    togetherNote:
      "组合套餐需在上面的退订页面退订。我们没有确认其中包含的服务能否单独退订。退订后，请在各个服务中确认订阅已结束。",
    checkStatus: (name) => `查看 ${name} 订阅状态`,
    openService: (name) => `打开 ${name}`,
    appBack:
      "如果在服务的应用中打开，返回键可能只在那个应用里移动。确认后，请从最近使用的应用列表回到 SubSlash。",
    fallback: "链接打不开时",
    tryAccount: "尝试前往账户管理页面",
    guessed: (url) => `${url} —— 这是按常见地址格式推测的，可能不存在。`,
    homeOf: (host) => `打开 ${host} 首页`,
    homeNote: "登录后请按下面的步骤操作。",
    step2: "第 2 步 · 前往退订菜单的路径",
    noSteps: "没有保存步骤说明。写在“编辑信息”里，下次会更方便。",
    alreadyKilled:
      "已记录为已退订。如果其实没有退订成功，请在订阅详情中选择“改回订阅中”后重新记录。",
    close: "关闭",
    doneNote: "完成退订后请点这里。从扣款日起会计入守住的钱。应用无法自行确认是否已退订。",
    later: "稍后再说",
  },
  record: {
    title: "退订记录",
    killedOn: (date) => `已于 ${date} 记录为退订。`,
    noDate: "没有退订日期的记录。",
    chargedAfter: "退订后仍被扣款",
    chargedNote: "这是发给客服的文字，只用了应用里的记录——发送前请阅读并修改。",
    copyRefund: "复制退款申请",
    refundCopied: "已复制退款申请",
    refundTitle: "退款申请",
    lookAgain: "再次查看的日期",
    lookAgainNote: (app) =>
      `如果有新一季等可能再用的时候，请定一个日期。那天会出现在“现在要决定的”中${app ? "，如果开启了应用通知，也会通知你" : ""}。`,
    due: (date) => `已经到 ${date} 了。如果还不需要再用，请清除或推迟这个日期。`,
    save: "保存",
    saveReminder: (date) => `${date} 会再提醒你`,
    clear: "清除",
    cleared: "已清除再次查看的日期",
    evidence: "已退订的凭证",
    evidenceNote:
      "记下退订确认邮件的标题或受理编号，以后再次被扣款时可以作为申请退款的依据。只保存在这台设备以及备份和账户同步中。",
    referenceLabel: "退订确认编号或邮件标题",
    referencePlaceholder: "例如：退订受理编号、退订确认邮件标题",
    memoLabel: "退订备注",
    memoPlaceholder: "例如：在应用设置 > 订阅中退订，和客服通过电话",
    recordedOn: (date) => `记于 ${date}`,
    evidenceSaved: "已保存退订记录",
    evidenceCleared: "已清除退订记录",
  },
  alt: {
    unknownTitle: "也可以降低套餐而不是退订",
    unknownBody: (count) =>
      `这个服务有 ${count} 个套餐。在“编辑信息”中选择你现在用的套餐，我们会和更便宜的套餐比较。`,
    recorded: (plan) => `已记录为 ${plan}`,
    recordedYearly: (plan) => `已记录为 ${plan}。请在“编辑信息”中填写扣款月份。`,
    titleCompact: "退订之前：更便宜的办法",
    title: "退订之外可以做的事",
    nowOn: (plan, cycle, amount, perUse) =>
      `现在 ${plan} · ${cycle} ${amount}${perUse ? ` · 每次 ${perUse}` : ""}`,
    cycleYearly: "年付",
    cycleMonthly: "月付",
    cheapest: "这已经是该服务最便宜的套餐。想再省钱只能退订。",
    toYearly: "改为年付",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? `（约每月 ${monthly}）` : ""}${perUse ? ` · 每次 ${perUse}` : ""}`,
    saves: "每年少付",
    confirm: (plan) => `你已在服务中改成 ${plan} 了吗？我们会按此修改金额和套餐。`,
    confirmYes: "已更改",
    switched: "我已改成这个套餐",
    footerBase: (taxExcluded) =>
      `按价目表价格比较${taxExcluded ? "（两边同样加税）" : ""}。各套餐的广告、画质和功能不同——少了什么请在服务中确认。`,
    footerShared: " 这是分摊的订阅，所以金额是卡上扣的全部费用。",
    footerNoUsage: " 在最近 30 天内签到后，也会显示单次成本。",
  },
};

const ja0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "この端末にはこのサブスクがありません",
    missingBody: "ほかの端末で登録または削除されたサブスクです。",
    login: "ログイン",
    missingAfter: "すると端末どうしで記録がそろいます。",
    backToList: "← サブスク一覧",
    saved: "保存しました",
    checkedIn: "チェックイン完了",
    saveFailed: "保存できませんでした。もう一度お試しください。",
    revived: (name) => `${name} を契約中に戻しました`,
    killRecorded: (name) => `${name} を解約済みとして記録`,
    edit: "情報を編集",
    delete: "削除",
    editTitle: "サブスク情報の編集",
    editDescription: "金額・支払日・解約リンクを直します。",
    back: "← 戻る",
  },
  summary: {
    killed: "解約済み",
    active: "契約中",
    meta: (category, plan, cycle) =>
      `カテゴリ: ${category}${plan ? ` · プラン: ${plan}` : ""} · 支払い周期: ${cycle}`,
    cycleYearly: "毎年",
    cycleMonthly: "毎月",
    perYear: "年額 ",
    perMonth: "月額 ",
    withTax: (amount, rate) => `料金 ${amount} + 付加価値税 ${rate}%`,
    monthlyEquiv: (amount) => `月あたり約 ${amount}`,
    monthlyOn: (day) => `毎月 ${day} 日に支払い`,
    yearlyOn: (month, day) => `毎年 ${month} 月 ${day} 日に支払い`,
    yearlyUnset: "年払い · 支払月が未設定",
    trial: (endsAt, dday) => `無料体験中 · ${endsAt} 終了（${dday}）· それまでは支出に含めません`,
    nextBilling: "次の支払いまで: ",
    monthUnset: "支払月が未設定",
    checkIn: "利用回数をチェックイン",
    kill: "今すぐ解約",
    killedNote: "解約済みのサブスクです。",
    revive: "契約中に戻す",
  },
  routes: {
    title: "解約の手順",
    account: "登録したアカウント",
    copyId: "アカウント ID をコピー",
    idCopied: "アカウント ID をコピーしました",
    copyFailed: "コピーできませんでした。画面の ID を直接選択してください",
    loginWith: " のアカウントでログインすると解約ボタンが表示されます。",
    loginAny:
      "登録したアカウントでログインしてください。アカウントは「情報を編集」で入力できます。",
    paymentMethod: "支払い方法: ",
    paymentEntry:
      "定期支払いの一覧ではなくトップページへ移動します。上の支払い方法の案内に沿って解約メニューを探してください。",
    entry:
      "解約画面ではなくトップページやアカウント画面へ移動します。下の案内に沿って解約メニューを探してください。",
    custom: "自分で入力したアドレスです。どこへ移動するかは確認していません。",
    openGuide: "解約方法を見る",
    savedSteps: "保存した解約手順:",
  },
  link: {
    newWindow: (label) => `${label}（新しいウィンドウ）`,
    paymentManage: (name, direct) => (direct ? `${name} の定期支払い管理を開く` : `${name} を開く`),
    cancelPage: (name) => `${name} の解約ページへ直接移動（新しいウィンドウ）`,
    cancelPageOpen: (name) => `${name} の解約ページを開く（新しいウィンドウ）`,
    open: (name) => `${name} を開く（新しいウィンドウ）`,
  },
  guide: {
    title: (name) => `${name} 解約ガイド`,
    description: "リンクが開かない場合は、下の手順に沿って進めてください。",
    askTitle: "解約は終わりましたか？",
    askBody:
      "解約画面から戻ってきました。終わったら記録しておきましょう。アプリは解約したかどうかを直接確認できません。",
    notYet: "まだです",
    done: "解約しました",
    step1: "ステップ 1 · 解約画面を開く",
    paymentDirect: (method) => `${method} で支払った場合はここで解約します。`,
    paymentEntry: (method) =>
      `${method} で支払った場合はここで解約します。定期支払いの一覧ではなくトップページへ移動します。`,
    direct: "解約画面へ直接移動します。",
    entry:
      "解約画面ではなくトップページやアカウント画面へ移動します。下の手順に沿って解約メニューを探してください。",
    custom: "自分で入力したアドレスです。どこへ移動するかは確認していません。",
    noLinks:
      "保存された解約リンクがありません。「情報を編集」でアドレスを入れるとショートカットができます。",
    together: "一緒に受けているサービス",
    togetherNote:
      "セット商品は上の解約画面で解約します。含まれるサービスだけを個別に解約できるかは確認できていません。解約後、各サービスで契約が終わったか確認してください。",
    checkStatus: (name) => `${name} の契約状況を確認`,
    openService: (name) => `${name} を開く`,
    appBack:
      "サービスのアプリで開いた場合、戻るボタンはそのアプリの中で動くことがあります。確認したら、最近使ったアプリの一覧から SubSlash に戻ってください。",
    fallback: "リンクが開かないとき",
    tryAccount: "アカウント管理ページへの移動を試す",
    guessed: (url) => `${url} — よくあるアドレスの形から推測したもので、存在しない場合があります。`,
    homeOf: (host) => `${host} のトップページを開く`,
    homeNote: "ログインしてから下の手順に沿って進めてください。",
    step2: "ステップ 2 · 解約メニューまでの道のり",
    noSteps: "保存された手順がありません。「情報を編集」に書いておくと次回が楽になります。",
    alreadyKilled:
      "すでに解約済みとして記録されています。解約できていなかった場合は、サブスクの詳細で「契約中に戻す」を選んでからもう一度記録してください。",
    close: "閉じる",
    doneNote:
      "解約が終わったら押してください。支払日から守ったお金として積み上がります。アプリは解約したかどうかを直接確認できません。",
    later: "あとで",
  },
  record: {
    title: "解約の記録",
    killedOn: (date) => `${date} に解約として記録しました。`,
    noDate: "解約した日の記録がありません。",
    chargedAfter: "解約後に請求されました",
    chargedNote:
      "カスタマーサポートに送る文章です。アプリにある記録だけを入れました——送る前に読んで直してください。",
    copyRefund: "返金依頼の文章をコピー",
    refundCopied: "返金依頼の文章をコピーしました",
    refundTitle: "返金依頼の文章",
    lookAgain: "もう一度見直す日",
    lookAgainNote: (app) =>
      `新シーズンなど、また使うときがあるなら日付を決めておきましょう。その日に「今決めること」に表示します${app ? "。アプリの通知をオンにしていれば通知も送ります" : ""}。`,
    due: (date) => `${date} になりました。まだ使う時期でなければ、日付を消すか延ばしてください。`,
    save: "保存",
    saveReminder: (date) => `${date} にもう一度お知らせします`,
    clear: "消す",
    cleared: "見直す日を消しました",
    evidence: "解約した根拠",
    evidenceNote:
      "解約確認メールの件名や受付番号を書いておくと、後でまた請求されたときに返金を求める根拠になります。この端末とバックアップ・アカウント同期にだけ保存されます。",
    referenceLabel: "解約確認番号またはメールの件名",
    referencePlaceholder: "例: 解約受付番号、解約確認メールの件名",
    memoLabel: "解約メモ",
    memoPlaceholder: "例: アプリの設定 > サブスクで解約、担当者と電話",
    recordedOn: (date) => `${date} に記入`,
    evidenceSaved: "解約の記録を保存しました",
    evidenceCleared: "解約の記録を消しました",
  },
  alt: {
    unknownTitle: "解約の代わりにプランを下げることもできます",
    unknownBody: (count) =>
      `このサービスにはプランが ${count} 個あります。「情報を編集」で今のプランを選ぶと、もっと安いプランと比べます。`,
    recorded: (plan) => `${plan} として記録しました`,
    recordedYearly: (plan) =>
      `${plan} として記録しました。支払月を「情報を編集」で入力してください。`,
    titleCompact: "解約の前に: もっと安い方法",
    title: "解約の代わりにできること",
    nowOn: (plan, cycle, amount, perUse) =>
      `現在 ${plan} · ${cycle} ${amount}${perUse ? ` · 1 回 ${perUse}` : ""}`,
    cycleYearly: "年額",
    cycleMonthly: "月額",
    cheapest: "すでにこのサービスで一番安いプランです。これ以上減らすには解約しかありません。",
    toYearly: "年払いに変える",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? `（月あたり約 ${monthly}）` : ""}${perUse ? ` · 1 回 ${perUse}` : ""}`,
    saves: "1 年で安くなる額",
    confirm: (plan) => `サービスで ${plan} に変えましたか？ 金額とプランをこれに合わせて直します。`,
    confirmYes: "変えました",
    switched: "このプランに変えました",
    footerBase: (taxExcluded) =>
      `料金表の価格どうしで比べました${taxExcluded ? "（税は両方に同じように加わります）" : ""}。プランごとに広告・画質・機能が違います——何がなくなるかはサービスで確認してください。`,
    footerShared: " 分け合うサブスクなので、金額はカードに請求される全額です。",
    footerNoUsage: " 直近 30 日以内にチェックインすると、1 回あたりの単価も表示します。",
  },
};

const vi0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "Thiết bị này không có gói đăng ký này",
    missingBody: "Gói này được thêm hoặc xóa trên thiết bị khác. ",
    login: "Đăng nhập",
    missingAfter: " để dữ liệu giữa các thiết bị được khớp với nhau.",
    backToList: "← Danh sách đăng ký",
    saved: "Đã lưu",
    checkedIn: "Đã check-in",
    saveFailed: "Không lưu được. Hãy thử lại.",
    revived: (name) => `Đã chuyển ${name} về trạng thái đang đăng ký`,
    killRecorded: (name) => `Đã ghi nhận ${name} là đã hủy`,
    edit: "Sửa thông tin",
    delete: "Xóa",
    editTitle: "Sửa thông tin gói đăng ký",
    editDescription: "Sửa số tiền, ngày thanh toán và đường dẫn hủy.",
    back: "← Quay lại",
  },
  summary: {
    killed: "Đã hủy",
    active: "Đang đăng ký",
    meta: (category, plan, cycle) =>
      `Danh mục: ${category}${plan ? ` · Gói: ${plan}` : ""} · Chu kỳ thanh toán: ${cycle}`,
    cycleYearly: "hằng năm",
    cycleMonthly: "hằng tháng",
    perYear: "Mỗi năm ",
    perMonth: "Mỗi tháng ",
    withTax: (amount, rate) => `Giá ${amount} + VAT ${rate}%`,
    monthlyEquiv: (amount) => `Khoảng ${amount}/tháng`,
    monthlyOn: (day) => `Thanh toán ngày ${day} hằng tháng`,
    yearlyOn: (month, day) => `Thanh toán hằng năm vào ngày ${day} tháng ${month}`,
    yearlyUnset: "Thanh toán theo năm · chưa đặt tháng thanh toán",
    trial: (endsAt, dday) =>
      `Đang dùng thử miễn phí · kết thúc ${endsAt} (${dday}) · đến lúc đó chưa tính vào chi tiêu`,
    nextBilling: "Đến lần thanh toán tiếp theo: ",
    monthUnset: "Chưa đặt tháng thanh toán",
    checkIn: "Check-in số lần dùng",
    kill: "Hủy ngay",
    killedNote: "Gói đăng ký này đã hủy.",
    revive: "Chuyển về đang đăng ký",
  },
  routes: {
    title: "Cách hủy",
    account: "Tài khoản đã đăng ký",
    copyId: "Sao chép ID tài khoản",
    idCopied: "Đã sao chép ID tài khoản",
    copyFailed: "Không sao chép được. Hãy tự chọn ID trên màn hình",
    loginWith: " — đăng nhập bằng tài khoản này mới thấy nút hủy.",
    loginAny:
      "Hãy đăng nhập bằng tài khoản đã đăng ký. Bạn có thể ghi tài khoản trong “Sửa thông tin”.",
    paymentMethod: "Phương thức thanh toán: ",
    paymentEntry:
      "Đường dẫn này đến trang chủ, không phải danh sách thanh toán định kỳ. Hãy làm theo hướng dẫn phương thức thanh toán ở trên để tìm menu hủy.",
    entry:
      "Đường dẫn này đến trang chủ hoặc trang tài khoản, không phải trang hủy. Hãy làm theo hướng dẫn bên dưới để tìm menu hủy.",
    custom: "Đây là địa chỉ bạn tự nhập. Chúng tôi chưa kiểm tra nó dẫn đến đâu.",
    openGuide: "Xem cách hủy",
    savedSteps: "Các bước hủy đã lưu:",
  },
  link: {
    newWindow: (label) => `${label} (cửa sổ mới)`,
    paymentManage: (name, direct) =>
      direct ? `Mở quản lý thanh toán định kỳ ${name}` : `Mở ${name}`,
    cancelPage: (name) => `Đi thẳng đến trang hủy ${name} (cửa sổ mới)`,
    cancelPageOpen: (name) => `Mở trang hủy ${name} (cửa sổ mới)`,
    open: (name) => `Mở ${name} (cửa sổ mới)`,
  },
  guide: {
    title: (name) => `Hướng dẫn hủy ${name}`,
    description: "Nếu đường dẫn không mở được, hãy làm theo các bước bên dưới.",
    askTitle: "Bạn đã hủy xong chưa?",
    askBody:
      "Bạn vừa quay lại từ trang hủy. Nếu đã xong, hãy ghi lại. Ứng dụng không tự kiểm tra được bạn đã hủy hay chưa.",
    notYet: "Chưa",
    done: "Tôi đã hủy",
    step1: "Bước 1 · Mở trang hủy",
    paymentDirect: (method) => `Nếu bạn thanh toán bằng ${method}, hãy hủy ở đây.`,
    paymentEntry: (method) =>
      `Nếu bạn thanh toán bằng ${method}, hãy hủy ở đây. Đường dẫn này đến trang chủ, không phải danh sách thanh toán định kỳ.`,
    direct: "Đi thẳng đến trang hủy.",
    entry:
      "Đường dẫn này đến trang chủ hoặc trang tài khoản, không phải trang hủy. Hãy làm theo các bước bên dưới để tìm menu hủy.",
    custom: "Đây là địa chỉ bạn tự nhập. Chúng tôi chưa kiểm tra nó dẫn đến đâu.",
    noLinks: "Chưa lưu đường dẫn hủy. Thêm địa chỉ trong “Sửa thông tin” để có lối tắt.",
    together: "Dịch vụ nhận kèm",
    togetherNote:
      "Gói kết hợp được hủy ở trang hủy phía trên. Chúng tôi chưa xác nhận các dịch vụ đi kèm có hủy riêng được không. Sau khi hủy, hãy kiểm tra trong từng dịch vụ xem gói đã kết thúc chưa.",
    checkStatus: (name) => `Kiểm tra trạng thái đăng ký ${name}`,
    openService: (name) => `Mở ${name}`,
    appBack:
      "Nếu mở trong ứng dụng của dịch vụ, nút quay lại có thể chỉ di chuyển trong ứng dụng đó. Sau khi kiểm tra, hãy quay lại SubSlash từ danh sách ứng dụng gần đây.",
    fallback: "Khi đường dẫn không mở được",
    tryAccount: "Thử vào trang quản lý tài khoản",
    guessed: (url) => `${url} — đoán theo dạng địa chỉ phổ biến nên có thể không tồn tại.`,
    homeOf: (host) => `Mở trang chủ ${host}`,
    homeNote: "Hãy đăng nhập rồi làm theo các bước bên dưới.",
    step2: "Bước 2 · Đường đến menu hủy",
    noSteps: "Chưa lưu hướng dẫn các bước. Ghi vào “Sửa thông tin” để lần sau dễ hơn.",
    alreadyKilled:
      "Gói này đã được ghi nhận là đã hủy. Nếu thực ra chưa hủy được, hãy chọn “Chuyển về đang đăng ký” trong chi tiết gói rồi ghi nhận lại.",
    close: "Đóng",
    doneNote:
      "Nhấn khi bạn đã hủy xong. Từ ngày thanh toán, khoản này sẽ được tính là tiền đã giữ lại. Ứng dụng không tự kiểm tra được bạn đã hủy hay chưa.",
    later: "Để sau",
  },
  record: {
    title: "Bản ghi hủy",
    killedOn: (date) => `Đã ghi nhận hủy vào ${date}.`,
    noDate: "Không có bản ghi ngày hủy.",
    chargedAfter: "Bạn bị trừ tiền sau khi hủy",
    chargedNote:
      "Đây là nội dung gửi bộ phận chăm sóc khách hàng. Chỉ dùng dữ liệu có trong ứng dụng — hãy đọc và sửa trước khi gửi.",
    copyRefund: "Sao chép yêu cầu hoàn tiền",
    refundCopied: "Đã sao chép yêu cầu hoàn tiền",
    refundTitle: "Yêu cầu hoàn tiền",
    lookAgain: "Ngày xem lại",
    lookAgainNote: (app) =>
      `Nếu có lúc bạn sẽ dùng lại, như mùa phim mới, hãy chọn một ngày. Hôm đó gói sẽ hiện trong “Cần quyết định ngay”${app ? ", và nếu bật thông báo ứng dụng, chúng tôi cũng sẽ nhắc bạn" : ""}.`,
    due: (date) => `Đã đến ${date}. Nếu chưa phải lúc dùng lại, hãy xóa hoặc dời ngày.`,
    save: "Lưu",
    saveReminder: (date) => `Chúng tôi sẽ nhắc lại vào ${date}`,
    clear: "Xóa",
    cleared: "Đã xóa ngày xem lại",
    evidence: "Bằng chứng đã hủy",
    evidenceNote:
      "Ghi lại tiêu đề email xác nhận hủy hoặc mã tiếp nhận, sau này nếu bị trừ tiền lại thì đó là căn cứ để yêu cầu hoàn tiền. Chỉ lưu trên thiết bị này và trong sao lưu, đồng bộ tài khoản.",
    referenceLabel: "Mã xác nhận hủy hoặc tiêu đề email",
    referencePlaceholder: "Ví dụ: mã tiếp nhận hủy, tiêu đề email xác nhận hủy",
    memoLabel: "Ghi chú hủy",
    memoPlaceholder: "Ví dụ: hủy trong cài đặt ứng dụng > gói đăng ký, gọi điện với nhân viên",
    recordedOn: (date) => `Ghi ngày ${date}`,
    evidenceSaved: "Đã lưu bản ghi hủy",
    evidenceCleared: "Đã xóa bản ghi hủy",
  },
  alt: {
    unknownTitle: "Bạn có thể hạ gói thay vì hủy",
    unknownBody: (count) =>
      `Dịch vụ này có ${count} gói. Chọn gói bạn đang dùng trong “Sửa thông tin”, chúng tôi sẽ so sánh với các gói rẻ hơn.`,
    recorded: (plan) => `Đã ghi nhận là ${plan}`,
    recordedYearly: (plan) =>
      `Đã ghi nhận là ${plan}. Hãy nhập tháng thanh toán trong “Sửa thông tin”.`,
    titleCompact: "Trước khi hủy: cách rẻ hơn",
    title: "Những việc có thể làm thay vì hủy",
    nowOn: (plan, cycle, amount, perUse) =>
      `Hiện tại ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} mỗi lần` : ""}`,
    cycleYearly: "mỗi năm",
    cycleMonthly: "mỗi tháng",
    cheapest: "Đây đã là gói rẻ nhất của dịch vụ. Muốn giảm thêm chỉ còn cách hủy.",
    toYearly: "Chuyển sang thanh toán theo năm",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (khoảng ${monthly}/tháng)` : ""}${perUse ? ` · ${perUse} mỗi lần` : ""}`,
    saves: "Mỗi năm trả ít hơn",
    confirm: (plan) =>
      `Bạn đã đổi sang ${plan} trong dịch vụ chưa? Chúng tôi sẽ sửa số tiền và gói theo gói này.`,
    confirmYes: "Đã đổi",
    switched: "Tôi đã đổi sang gói này",
    footerBase: (taxExcluded) =>
      `So sánh theo giá niêm yết${taxExcluded ? " (thuế được cộng như nhau ở cả hai)" : ""}. Mỗi gói khác nhau về quảng cáo, chất lượng hình ảnh và tính năng — hãy kiểm tra trong dịch vụ xem bạn mất gì.`,
    footerShared: " Đây là gói dùng chung nên số tiền là toàn bộ khoản bị trừ trên thẻ.",
    footerNoUsage: " Check-in trong 30 ngày gần nhất để xem cả chi phí mỗi lần dùng.",
  },
};

export const zh: Widen<typeof ko> = {
  detail: {
    ...zh0.detail,
    summary: zh0.summary,
    routes: zh0.routes,
    link: zh0.link,
    guide: zh0.guide,
    record: zh0.record,
    alt: zh0.alt,
  },
};

export const ja: Widen<typeof ko> = {
  detail: {
    ...ja0.detail,
    summary: ja0.summary,
    routes: ja0.routes,
    link: ja0.link,
    guide: ja0.guide,
    record: ja0.record,
    alt: ja0.alt,
  },
};

export const vi: Widen<typeof ko> = {
  detail: {
    ...vi0.detail,
    summary: vi0.summary,
    routes: vi0.routes,
    link: vi0.link,
    guide: vi0.guide,
    record: vi0.record,
    alt: vi0.alt,
  },
};

// 프랑스어·스페인어·독일어·포르투갈어.
const fr0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "Cet appareil n'a pas cet abonnement",
    missingBody: "Il a été ajouté ou supprimé sur un autre appareil. ",
    login: "Connectez-vous",
    missingAfter: " pour synchroniser vos données entre appareils.",
    backToList: "← Abonnements",
    saved: "Enregistré",
    checkedIn: "Check-in effectué",
    saveFailed: "Impossible d'enregistrer. Veuillez réessayer.",
    revived: (name) => `${name} est de nouveau actif`,
    killRecorded: (name) => `${name} enregistré comme résilié`,
    edit: "Modifier",
    delete: "Supprimer",
    editTitle: "Modifier l'abonnement",
    editDescription: "Corrigez le prix, le jour de paiement et le lien de résiliation.",
    back: "← Retour",
  },
  summary: {
    killed: "Résilié",
    active: "Actif",
    meta: (category, plan, cycle) =>
      `Catégorie : ${category}${plan ? ` · Formule : ${plan}` : ""} · Facturation : ${cycle}`,
    cycleYearly: "annuelle",
    cycleMonthly: "mensuelle",
    perYear: "Par an ",
    perMonth: "Par mois ",
    withTax: (amount, rate) => `Prix ${amount} + TVA ${rate} %`,
    monthlyEquiv: (amount) => `Environ ${amount}/mois`,
    monthlyOn: (day) => `Prélevé le ${day} de chaque mois`,
    yearlyOn: (month, day) => `Prélevé chaque année le ${day}/${month}`,
    yearlyUnset: "Paiement annuel · mois de paiement non défini",
    trial: (endsAt, dday) =>
      `Essai gratuit · se termine le ${endsAt} (${dday}) · non compté dans vos dépenses d'ici là`,
    nextBilling: "Prochain paiement dans : ",
    monthUnset: "Mois de paiement non défini",
    checkIn: "Indiquer l'utilisation",
    kill: "Résilier maintenant",
    killedNote: "Cet abonnement est résilié.",
    revive: "Remettre en actif",
  },
  routes: {
    title: "Comment résilier",
    account: "Compte d'inscription",
    copyId: "Copier l'identifiant",
    idCopied: "Identifiant copié",
    copyFailed: "Impossible de copier. Sélectionnez l'identifiant à l'écran",
    loginWith: " — connectez-vous avec ce compte pour voir le bouton de résiliation.",
    loginAny:
      "Connectez-vous avec le compte utilisé à l'inscription. Vous pouvez l'indiquer dans « Modifier ».",
    paymentMethod: "Moyen de paiement : ",
    paymentEntry:
      "Ce lien mène à l'accueil, pas à la liste des paiements récurrents. Suivez les indications du moyen de paiement ci-dessus pour trouver le menu de résiliation.",
    entry:
      "Ce lien mène à l'accueil ou à la page du compte, pas à une page de résiliation. Suivez le guide ci-dessous pour trouver le menu de résiliation.",
    custom: "C'est une adresse que vous avez saisie. Nous n'avons pas vérifié où elle mène.",
    openGuide: "Voir comment résilier",
    savedSteps: "Étapes de résiliation enregistrées :",
  },
  link: {
    newWindow: (label) => `${label} (nouvelle fenêtre)`,
    paymentManage: (name, direct) =>
      direct ? `Gérer les paiements récurrents dans ${name}` : `Ouvrir ${name}`,
    cancelPage: (name) => `Aller directement à la page de résiliation ${name} (nouvelle fenêtre)`,
    cancelPageOpen: (name) => `Ouvrir la page de résiliation ${name} (nouvelle fenêtre)`,
    open: (name) => `Ouvrir ${name} (nouvelle fenêtre)`,
  },
  guide: {
    title: (name) => `Résilier ${name}`,
    description: "Si un lien ne s'ouvre pas, suivez les étapes ci-dessous.",
    askTitle: "Avez-vous terminé la résiliation ?",
    askBody:
      "Vous revenez de la page de résiliation. Si c'est fait, enregistrez-le. L'application ne peut pas vérifier si vous avez résilié.",
    notYet: "Pas encore",
    done: "J'ai résilié",
    step1: "Étape 1 · Ouvrir la page de résiliation",
    paymentDirect: (method) => `Si vous avez payé avec ${method}, résiliez ici.`,
    paymentEntry: (method) =>
      `Si vous avez payé avec ${method}, résiliez ici. Ce lien mène à l'accueil, pas à la liste des paiements récurrents.`,
    direct: "Ce lien mène directement à la page de résiliation.",
    entry:
      "Ce lien mène à l'accueil ou à la page du compte, pas à une page de résiliation. Suivez les étapes ci-dessous pour trouver le menu de résiliation.",
    custom: "C'est une adresse que vous avez saisie. Nous n'avons pas vérifié où elle mène.",
    noLinks:
      "Aucun lien de résiliation enregistré. Ajoutez une adresse dans « Modifier » pour obtenir un raccourci.",
    together: "Services inclus",
    togetherNote:
      "Une offre groupée se résilie sur la page ci-dessus. Nous n'avons pas vérifié si les services inclus peuvent être résiliés séparément. Après la résiliation, vérifiez dans chaque service que l'abonnement est terminé.",
    checkStatus: (name) => `Vérifier l'état de l'abonnement ${name}`,
    openService: (name) => `Ouvrir ${name}`,
    appBack:
      "Si le lien s'ouvre dans l'application du service, le bouton retour peut rester dans cette application. Après vérification, revenez à SubSlash depuis vos applications récentes.",
    fallback: "Si le lien ne s'ouvre pas",
    tryAccount: "Essayer la page de gestion du compte",
    guessed: (url) => `${url} — supposé d'après des adresses courantes, elle peut ne pas exister.`,
    homeOf: (host) => `Ouvrir l'accueil de ${host}`,
    homeNote: "Connectez-vous, puis suivez les étapes ci-dessous.",
    step2: "Étape 2 · Le chemin vers le menu de résiliation",
    noSteps:
      "Aucune étape enregistrée. Notez-les dans « Modifier » pour vous simplifier la prochaine fois.",
    alreadyKilled:
      "Cet abonnement est déjà enregistré comme résilié. Si la résiliation n'a pas abouti, choisissez « Remettre en actif » dans le détail de l'abonnement, puis enregistrez-la à nouveau.",
    close: "Fermer",
    doneNote:
      "Appuyez ici une fois la résiliation faite. Le montant compte comme argent économisé à partir du jour de paiement. L'application ne peut pas vérifier si vous avez résilié.",
    later: "Plus tard",
  },
  record: {
    title: "Historique de résiliation",
    killedOn: (date) => `Enregistré comme résilié le ${date}.`,
    noDate: "Aucune date de résiliation enregistrée.",
    chargedAfter: "Vous avez été débité après la résiliation",
    chargedNote:
      "Message destiné au service client. Il n'utilise que les données de l'application — relisez-le et modifiez-le avant de l'envoyer.",
    copyRefund: "Copier la demande de remboursement",
    refundCopied: "Demande de remboursement copiée",
    refundTitle: "Demande de remboursement",
    lookAgain: "Date de réexamen",
    lookAgainNote: (app) =>
      `Si vous comptez le réutiliser, par exemple pour une nouvelle saison, choisissez une date. Ce jour-là, il apparaîtra dans « À décider maintenant »${app ? ", et si les notifications sont activées, nous vous préviendrons aussi" : ""}.`,
    due: (date) =>
      `Nous sommes le ${date}. Si ce n'est pas le moment de le réutiliser, effacez ou repoussez la date.`,
    save: "Enregistrer",
    saveReminder: (date) => `Nous vous le rappellerons le ${date}`,
    clear: "Effacer",
    cleared: "Date de réexamen effacée",
    evidence: "Preuve de résiliation",
    evidenceNote:
      "Notez l'objet de l'e-mail de confirmation ou un numéro de dossier : cela appuiera une demande de remboursement si vous êtes débité à nouveau. Ces données restent sur cet appareil, dans les sauvegardes et la synchronisation du compte.",
    referenceLabel: "Numéro de résiliation ou objet de l'e-mail",
    referencePlaceholder: "ex. numéro de dossier, objet de l'e-mail de confirmation",
    memoLabel: "Notes de résiliation",
    memoPlaceholder: "ex. résilié dans Réglages > Abonnements, appel avec un conseiller",
    recordedOn: (date) => `Noté le ${date}`,
    evidenceSaved: "Historique de résiliation enregistré",
    evidenceCleared: "Historique de résiliation effacé",
  },
  alt: {
    unknownTitle: "Vous pourriez changer de formule au lieu de résilier",
    unknownBody: (count) =>
      `Ce service propose ${count} formules. Choisissez la vôtre dans « Modifier » et nous la comparerons aux moins chères.`,
    recorded: (plan) => `Enregistré comme ${plan}`,
    recordedYearly: (plan) =>
      `Enregistré comme ${plan}. Indiquez le mois de paiement dans « Modifier ».`,
    titleCompact: "Avant de résilier : une option moins chère",
    title: "Ce que vous pouvez faire au lieu de résilier",
    nowOn: (plan, cycle, amount, perUse) =>
      `Actuellement ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} par utilisation` : ""}`,
    cycleYearly: "par an",
    cycleMonthly: "par mois",
    cheapest:
      "C'est déjà la formule la moins chère du service. Seule la résiliation permet d'économiser davantage.",
    toYearly: "Passer au paiement annuel",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (environ ${monthly}/mois)` : ""}${perUse ? ` · ${perUse} par utilisation` : ""}`,
    saves: "En moins par an",
    confirm: (plan) =>
      `Êtes-vous passé à ${plan} dans le service ? Nous ajusterons le prix et la formule.`,
    confirmYes: "C'est fait",
    switched: "Je suis passé à cette formule",
    footerBase: (taxExcluded) =>
      `Comparaison des prix affichés${taxExcluded ? " (la taxe s'ajoute de la même façon aux deux)" : ""}. Les formules diffèrent par la publicité, la qualité et les fonctions — vérifiez dans le service ce que vous perdriez.`,
    footerShared: " Abonnement partagé : le prix est le montant total débité sur la carte.",
    footerNoUsage:
      " Faites un check-in dans les 30 derniers jours pour voir aussi le coût par utilisation.",
  },
};

const es0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "Este dispositivo no tiene esta suscripción",
    missingBody: "Se añadió o eliminó en otro dispositivo. ",
    login: "Inicia sesión",
    missingAfter: " para sincronizar tus registros entre dispositivos.",
    backToList: "← Suscripciones",
    saved: "Guardado",
    checkedIn: "Registro hecho",
    saveFailed: "No se pudo guardar. Inténtalo de nuevo.",
    revived: (name) => `${name} vuelve a estar activa`,
    killRecorded: (name) => `${name} registrada como cancelada`,
    edit: "Editar",
    delete: "Eliminar",
    editTitle: "Editar suscripción",
    editDescription: "Corrige el precio, el día de cobro y el enlace de cancelación.",
    back: "← Volver",
  },
  summary: {
    killed: "Cancelada",
    active: "Activa",
    meta: (category, plan, cycle) =>
      `Categoría: ${category}${plan ? ` · Plan: ${plan}` : ""} · Ciclo de cobro: ${cycle}`,
    cycleYearly: "anual",
    cycleMonthly: "mensual",
    perYear: "Al año ",
    perMonth: "Al mes ",
    withTax: (amount, rate) => `Precio ${amount} + IVA ${rate} %`,
    monthlyEquiv: (amount) => `Unos ${amount}/mes`,
    monthlyOn: (day) => `Se cobra el día ${day} de cada mes`,
    yearlyOn: (month, day) => `Se cobra cada año el ${day}/${month}`,
    yearlyUnset: "Cobro anual · mes de cobro sin definir",
    trial: (endsAt, dday) =>
      `En prueba gratuita · termina el ${endsAt} (${dday}) · no cuenta en tus gastos hasta entonces`,
    nextBilling: "Hasta el próximo cobro: ",
    monthUnset: "Mes de cobro sin definir",
    checkIn: "Registrar uso",
    kill: "Cancelar ahora",
    killedNote: "Esta suscripción está cancelada.",
    revive: "Volver a activa",
  },
  routes: {
    title: "Cómo cancelar",
    account: "Cuenta de registro",
    copyId: "Copiar ID de la cuenta",
    idCopied: "ID de la cuenta copiado",
    copyFailed: "No se pudo copiar. Selecciona el ID en pantalla",
    loginWith: " — inicia sesión con esta cuenta para ver el botón de cancelar.",
    loginAny: "Inicia sesión con la cuenta con la que te registraste. Puedes anotarla en «Editar».",
    paymentMethod: "Método de pago: ",
    paymentEntry:
      "Lleva a la página de inicio, no a la lista de pagos recurrentes. Sigue las indicaciones del método de pago de arriba para encontrar el menú de cancelación.",
    entry:
      "Lleva a la página de inicio o de la cuenta, no a una página de cancelación. Sigue la guía de abajo para encontrar el menú de cancelación.",
    custom: "Es una dirección que escribiste. No hemos comprobado adónde lleva.",
    openGuide: "Ver cómo cancelar",
    savedSteps: "Pasos de cancelación guardados:",
  },
  link: {
    newWindow: (label) => `${label} (ventana nueva)`,
    paymentManage: (name, direct) =>
      direct ? `Gestionar pagos recurrentes en ${name}` : `Abrir ${name}`,
    cancelPage: (name) => `Ir directo a la página de cancelación de ${name} (ventana nueva)`,
    cancelPageOpen: (name) => `Abrir la página de cancelación de ${name} (ventana nueva)`,
    open: (name) => `Abrir ${name} (ventana nueva)`,
  },
  guide: {
    title: (name) => `Cómo cancelar ${name}`,
    description: "Si un enlace no se abre, sigue los pasos de abajo.",
    askTitle: "¿Terminaste de cancelar?",
    askBody:
      "Has vuelto de la página de cancelación. Si ya terminaste, regístralo. La app no puede comprobar si cancelaste.",
    notYet: "Todavía no",
    done: "Ya cancelé",
    step1: "Paso 1 · Abrir la página de cancelación",
    paymentDirect: (method) => `Si pagaste con ${method}, cancela aquí.`,
    paymentEntry: (method) =>
      `Si pagaste con ${method}, cancela aquí. Lleva a la página de inicio, no a la lista de pagos recurrentes.`,
    direct: "Lleva directamente a la página de cancelación.",
    entry:
      "Lleva a la página de inicio o de la cuenta, no a una página de cancelación. Sigue los pasos de abajo para encontrar el menú de cancelación.",
    custom: "Es una dirección que escribiste. No hemos comprobado adónde lleva.",
    noLinks:
      "No hay enlace de cancelación guardado. Añade una dirección en «Editar» para tener un acceso directo.",
    together: "Servicios incluidos",
    togetherNote:
      "Un paquete se cancela en la página de arriba. No hemos comprobado si los servicios incluidos se pueden cancelar por separado. Después de cancelar, comprueba en cada servicio que la suscripción terminó.",
    checkStatus: (name) => `Comprobar el estado de la suscripción de ${name}`,
    openService: (name) => `Abrir ${name}`,
    appBack:
      "Si se abre en la app del servicio, el botón atrás puede moverse dentro de esa app. Después de comprobarlo, vuelve a SubSlash desde las apps recientes.",
    fallback: "Si el enlace no se abre",
    tryAccount: "Probar la página de gestión de la cuenta",
    guessed: (url) => `${url} — deducida a partir de direcciones habituales, puede que no exista.`,
    homeOf: (host) => `Abrir la página de inicio de ${host}`,
    homeNote: "Inicia sesión y sigue los pasos de abajo.",
    step2: "Paso 2 · El camino al menú de cancelación",
    noSteps: "No hay pasos guardados. Anótalos en «Editar» para la próxima vez.",
    alreadyKilled:
      "Ya está registrada como cancelada. Si no se canceló de verdad, elige «Volver a activa» en el detalle de la suscripción y vuelve a registrarla.",
    close: "Cerrar",
    doneNote:
      "Pulsa aquí cuando hayas cancelado. Desde el día de cobro cuenta como dinero ahorrado. La app no puede comprobar si cancelaste.",
    later: "Más tarde",
  },
  record: {
    title: "Registro de cancelación",
    killedOn: (date) => `Registrada como cancelada el ${date}.`,
    noDate: "No hay registro de la fecha de cancelación.",
    chargedAfter: "Te cobraron después de cancelar",
    chargedNote:
      "Es un mensaje para atención al cliente. Solo usa los registros de la app: léelo y corrígelo antes de enviarlo.",
    copyRefund: "Copiar solicitud de reembolso",
    refundCopied: "Solicitud de reembolso copiada",
    refundTitle: "Solicitud de reembolso",
    lookAgain: "Día para volver a revisar",
    lookAgainNote: (app) =>
      `Si hay un momento en que la volverías a usar, como una nueva temporada, elige un día. Ese día aparecerá en «Para decidir ahora»${app ? " y, si tienes activadas las notificaciones de la app, también te avisaremos" : ""}.`,
    due: (date) => `Ya es ${date}. Si no es momento de volver a usarla, borra o pospón la fecha.`,
    save: "Guardar",
    saveReminder: (date) => `Te lo recordaremos el ${date}`,
    clear: "Borrar",
    cleared: "Se borró el día para volver a revisar",
    evidence: "Prueba de la cancelación",
    evidenceNote:
      "Anota el asunto del correo de confirmación o un número de referencia: servirá para pedir un reembolso si vuelven a cobrarte. Solo se guarda en este dispositivo, en las copias de seguridad y en la sincronización de la cuenta.",
    referenceLabel: "Referencia de cancelación o asunto del correo",
    referencePlaceholder: "p. ej., número de referencia, asunto del correo de confirmación",
    memoLabel: "Notas de cancelación",
    memoPlaceholder: "p. ej., cancelada en Ajustes > Suscripciones, hablé con un agente",
    recordedOn: (date) => `Anotado el ${date}`,
    evidenceSaved: "Registro de cancelación guardado",
    evidenceCleared: "Registro de cancelación borrado",
  },
  alt: {
    unknownTitle: "Podrías bajar de plan en lugar de cancelar",
    unknownBody: (count) =>
      `Este servicio tiene ${count} planes. Elige el que usas en «Editar» y lo compararemos con los más baratos.`,
    recorded: (plan) => `Registrado como ${plan}`,
    recordedYearly: (plan) => `Registrado como ${plan}. Indica el mes de cobro en «Editar».`,
    titleCompact: "Antes de cancelar: una opción más barata",
    title: "Lo que puedes hacer en lugar de cancelar",
    nowOn: (plan, cycle, amount, perUse) =>
      `Ahora ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} por uso` : ""}`,
    cycleYearly: "al año",
    cycleMonthly: "al mes",
    cheapest: "Ya es el plan más barato del servicio. Para gastar menos, solo queda cancelar.",
    toYearly: "Pasar a pago anual",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (unos ${monthly}/mes)` : ""}${perUse ? ` · ${perUse} por uso` : ""}`,
    saves: "Menos al año",
    confirm: (plan) => `¿Cambiaste a ${plan} en el servicio? Ajustaremos el precio y el plan.`,
    confirmYes: "Sí, cambié",
    switched: "Cambié a este plan",
    footerBase: (taxExcluded) =>
      `Comparado por precio de tarifa${taxExcluded ? " (el impuesto se suma igual a ambos)" : ""}. Los planes difieren en anuncios, calidad y funciones: comprueba en el servicio qué perderías.`,
    footerShared:
      " Es una suscripción compartida, así que el precio es el importe total cobrado a la tarjeta.",
    footerNoUsage: " Registra el uso en los últimos 30 días y también verás el coste por uso.",
  },
};

const de0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "Dieses Gerät hat dieses Abo nicht",
    missingBody: "Es wurde auf einem anderen Gerät hinzugefügt oder gelöscht. ",
    login: "Melde dich an",
    missingAfter: ", dann werden deine Daten zwischen Geräten abgeglichen.",
    backToList: "← Abos",
    saved: "Gespeichert",
    checkedIn: "Eingetragen",
    saveFailed: "Speichern fehlgeschlagen. Bitte versuch es erneut.",
    revived: (name) => `${name} wieder als aktiv gesetzt`,
    killRecorded: (name) => `${name} als gekündigt eingetragen`,
    edit: "Bearbeiten",
    delete: "Löschen",
    editTitle: "Abo bearbeiten",
    editDescription: "Preis, Abbuchungstag und Kündigungslink korrigieren.",
    back: "← Zurück",
  },
  summary: {
    killed: "Gekündigt",
    active: "Aktiv",
    meta: (category, plan, cycle) =>
      `Kategorie: ${category}${plan ? ` · Tarif: ${plan}` : ""} · Abrechnung: ${cycle}`,
    cycleYearly: "jährlich",
    cycleMonthly: "monatlich",
    perYear: "Jährlich ",
    perMonth: "Monatlich ",
    withTax: (amount, rate) => `Preis ${amount} + ${rate} % MwSt.`,
    monthlyEquiv: (amount) => `Etwa ${amount}/Monat`,
    monthlyOn: (day) => `Abbuchung am ${day}. jedes Monats`,
    yearlyOn: (month, day) => `Abbuchung jedes Jahr am ${day}.${month}.`,
    yearlyUnset: "Jährliche Zahlung · Abbuchungsmonat nicht festgelegt",
    trial: (endsAt, dday) =>
      `Kostenloser Test · endet am ${endsAt} (${dday}) · bis dahin nicht in deinen Ausgaben`,
    nextBilling: "Bis zur nächsten Zahlung: ",
    monthUnset: "Abbuchungsmonat nicht festgelegt",
    checkIn: "Nutzung eintragen",
    kill: "Jetzt kündigen",
    killedNote: "Dieses Abo ist gekündigt.",
    revive: "Wieder als aktiv setzen",
  },
  routes: {
    title: "So kündigst du",
    account: "Angemeldetes Konto",
    copyId: "Konto-ID kopieren",
    idCopied: "Konto-ID kopiert",
    copyFailed: "Kopieren fehlgeschlagen. Markiere die ID auf dem Bildschirm selbst",
    loginWith: " — melde dich mit diesem Konto an, um den Kündigungsbutton zu sehen.",
    loginAny:
      "Melde dich mit dem Konto an, mit dem du dich registriert hast. Du kannst es unter „Bearbeiten“ eintragen.",
    paymentMethod: "Zahlungsmethode: ",
    paymentEntry:
      "Der Link führt zur Startseite, nicht zur Liste der wiederkehrenden Zahlungen. Folge den Hinweisen zur Zahlungsmethode oben, um das Kündigungsmenü zu finden.",
    entry:
      "Der Link führt zur Start- oder Kontoseite, nicht zu einer Kündigungsseite. Folge der Anleitung unten, um das Kündigungsmenü zu finden.",
    custom: "Diese Adresse hast du selbst eingegeben. Wir haben nicht geprüft, wohin sie führt.",
    openGuide: "So kündigst du",
    savedSteps: "Gespeicherte Kündigungsschritte:",
  },
  link: {
    newWindow: (label) => `${label} (neues Fenster)`,
    paymentManage: (name, direct) =>
      direct ? `Wiederkehrende Zahlungen in ${name} verwalten` : `${name} öffnen`,
    cancelPage: (name) => `Direkt zur Kündigungsseite von ${name} (neues Fenster)`,
    cancelPageOpen: (name) => `Kündigungsseite von ${name} öffnen (neues Fenster)`,
    open: (name) => `${name} öffnen (neues Fenster)`,
  },
  guide: {
    title: (name) => `${name} kündigen`,
    description: "Wenn ein Link nicht aufgeht, folge den Schritten unten.",
    askTitle: "Hast du die Kündigung abgeschlossen?",
    askBody:
      "Du kommst von der Kündigungsseite zurück. Wenn du fertig bist, trag es ein. Die App kann nicht prüfen, ob du gekündigt hast.",
    notYet: "Noch nicht",
    done: "Ich habe gekündigt",
    step1: "Schritt 1 · Kündigungsseite öffnen",
    paymentDirect: (method) => `Wenn du mit ${method} bezahlt hast, kündige hier.`,
    paymentEntry: (method) =>
      `Wenn du mit ${method} bezahlt hast, kündige hier. Der Link führt zur Startseite, nicht zur Liste der wiederkehrenden Zahlungen.`,
    direct: "Der Link führt direkt zur Kündigungsseite.",
    entry:
      "Der Link führt zur Start- oder Kontoseite, nicht zu einer Kündigungsseite. Folge den Schritten unten, um das Kündigungsmenü zu finden.",
    custom: "Diese Adresse hast du selbst eingegeben. Wir haben nicht geprüft, wohin sie führt.",
    noLinks:
      "Kein Kündigungslink gespeichert. Trag unter „Bearbeiten“ eine Adresse ein, um eine Verknüpfung zu bekommen.",
    together: "Enthaltene Dienste",
    togetherNote:
      "Ein Paket wird auf der Kündigungsseite oben gekündigt. Ob die enthaltenen Dienste einzeln kündbar sind, haben wir nicht geprüft. Prüfe nach der Kündigung in jedem Dienst, ob das Abo beendet ist.",
    checkStatus: (name) => `Abo-Status von ${name} prüfen`,
    openService: (name) => `${name} öffnen`,
    appBack:
      "Öffnet sich die App des Dienstes, bewegt sich die Zurück-Taste eventuell nur in dieser App. Kehre danach über die zuletzt verwendeten Apps zu SubSlash zurück.",
    fallback: "Wenn der Link nicht aufgeht",
    tryAccount: "Kontoverwaltung versuchen",
    guessed: (url) =>
      `${url} — nach üblichen Adressmustern geraten, existiert daher vielleicht nicht.`,
    homeOf: (host) => `Startseite von ${host} öffnen`,
    homeNote: "Melde dich an und folge dann den Schritten unten.",
    step2: "Schritt 2 · Der Weg zum Kündigungsmenü",
    noSteps:
      "Keine Schritte gespeichert. Trag sie unter „Bearbeiten“ ein, dann ist es beim nächsten Mal leichter.",
    alreadyKilled:
      "Dieses Abo ist bereits als gekündigt eingetragen. Wenn die Kündigung nicht geklappt hat, wähle in den Abo-Details „Wieder als aktiv setzen“ und trag es erneut ein.",
    close: "Schließen",
    doneNote:
      "Tippe hier, wenn du gekündigt hast. Ab dem Abbuchungstag zählt es als gespartes Geld. Die App kann nicht prüfen, ob du gekündigt hast.",
    later: "Später",
  },
  record: {
    title: "Kündigungseintrag",
    killedOn: (date) => `Am ${date} als gekündigt eingetragen.`,
    noDate: "Es gibt keinen Eintrag zum Kündigungsdatum.",
    chargedAfter: "Nach der Kündigung wurde abgebucht",
    chargedNote:
      "Das ist eine Nachricht an den Kundenservice. Sie enthält nur Daten aus der App — lies und korrigiere sie vor dem Senden.",
    copyRefund: "Erstattungsanfrage kopieren",
    refundCopied: "Erstattungsanfrage kopiert",
    refundTitle: "Erstattungsanfrage",
    lookAgain: "Tag zum erneuten Ansehen",
    lookAgainNote: (app) =>
      `Wenn du es wieder nutzen könntest, etwa für eine neue Staffel, leg einen Tag fest. An dem Tag erscheint es unter „Jetzt entscheiden“${app ? ", und bei aktivierten App-Benachrichtigungen melden wir uns auch" : ""}.`,
    due: (date) =>
      `Heute ist der ${date}. Wenn es noch nicht Zeit ist, es wieder zu nutzen, lösch den Tag oder verschieb ihn.`,
    save: "Speichern",
    saveReminder: (date) => `Wir erinnern dich am ${date}`,
    clear: "Löschen",
    cleared: "Tag zum erneuten Ansehen gelöscht",
    evidence: "Nachweis der Kündigung",
    evidenceNote:
      "Notier den Betreff der Kündigungsbestätigung oder eine Vorgangsnummer – das stützt eine Erstattungsanfrage, falls später erneut abgebucht wird. Es wird nur auf diesem Gerät, in Backups und in der Kontosynchronisierung gespeichert.",
    referenceLabel: "Kündigungsnummer oder E-Mail-Betreff",
    referencePlaceholder: "z. B. Vorgangsnummer, Betreff der Kündigungsbestätigung",
    memoLabel: "Notizen zur Kündigung",
    memoPlaceholder: "z. B. in App-Einstellungen > Abos gekündigt, mit dem Support telefoniert",
    recordedOn: (date) => `Notiert am ${date}`,
    evidenceSaved: "Kündigungseintrag gespeichert",
    evidenceCleared: "Kündigungseintrag gelöscht",
  },
  alt: {
    unknownTitle: "Statt zu kündigen, könntest du den Tarif senken",
    unknownBody: (count) =>
      `Dieser Dienst hat ${count} Tarife. Wähl unter „Bearbeiten“ deinen Tarif, dann vergleichen wir ihn mit günstigeren.`,
    recorded: (plan) => `Als ${plan} eingetragen`,
    recordedYearly: (plan) =>
      `Als ${plan} eingetragen. Trag den Abbuchungsmonat unter „Bearbeiten“ ein.`,
    titleCompact: "Vor dem Kündigen: ein günstigerer Weg",
    title: "Was du statt einer Kündigung tun kannst",
    nowOn: (plan, cycle, amount, perUse) =>
      `Jetzt ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} pro Nutzung` : ""}`,
    cycleYearly: "jährlich",
    cycleMonthly: "monatlich",
    cheapest:
      "Das ist bereits der günstigste Tarif des Dienstes. Mehr sparen geht nur durch Kündigen.",
    toYearly: "Auf jährliche Zahlung umstellen",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (etwa ${monthly}/Monat)` : ""}${perUse ? ` · ${perUse} pro Nutzung` : ""}`,
    saves: "Weniger pro Jahr",
    confirm: (plan) => `Hast du im Dienst zu ${plan} gewechselt? Wir passen Preis und Tarif an.`,
    confirmYes: "Gewechselt",
    switched: "Ich habe zu diesem Tarif gewechselt",
    footerBase: (taxExcluded) =>
      `Verglichen nach Listenpreis${taxExcluded ? " (Steuer kommt bei beiden gleich hinzu)" : ""}. Tarife unterscheiden sich bei Werbung, Qualität und Funktionen — prüf im Dienst, was wegfällt.`,
    footerShared:
      " Das ist ein geteiltes Abo, daher ist der Preis der gesamte Betrag, der von der Karte abgebucht wird.",
    footerNoUsage:
      " Trag die Nutzung in den letzten 30 Tagen ein, dann zeigen wir auch die Kosten pro Nutzung.",
  },
};

const pt0: Widen<typeof ko0> = {
  detail: {
    missingTitle: "Este dispositivo não tem esta assinatura",
    missingBody: "Ela foi adicionada ou excluída em outro dispositivo. ",
    login: "Entre",
    missingAfter: " para sincronizar seus registros entre dispositivos.",
    backToList: "← Assinaturas",
    saved: "Salvo",
    checkedIn: "Registro feito",
    saveFailed: "Não foi possível salvar. Tente novamente.",
    revived: (name) => `${name} voltou a ficar ativa`,
    killRecorded: (name) => `${name} registrada como cancelada`,
    edit: "Editar",
    delete: "Excluir",
    editTitle: "Editar assinatura",
    editDescription: "Corrija o preço, o dia de cobrança e o link de cancelamento.",
    back: "← Voltar",
  },
  summary: {
    killed: "Cancelada",
    active: "Ativa",
    meta: (category, plan, cycle) =>
      `Categoria: ${category}${plan ? ` · Plano: ${plan}` : ""} · Ciclo de cobrança: ${cycle}`,
    cycleYearly: "anual",
    cycleMonthly: "mensal",
    perYear: "Por ano ",
    perMonth: "Por mês ",
    withTax: (amount, rate) => `Preço ${amount} + ${rate}% de imposto`,
    monthlyEquiv: (amount) => `Cerca de ${amount}/mês`,
    monthlyOn: (day) => `Cobrada no dia ${day} de cada mês`,
    yearlyOn: (month, day) => `Cobrada todo ano em ${day}/${month}`,
    yearlyUnset: "Cobrança anual · mês de cobrança não definido",
    trial: (endsAt, dday) =>
      `Em teste grátis · termina em ${endsAt} (${dday}) · fica fora dos seus gastos até lá`,
    nextBilling: "Até a próxima cobrança: ",
    monthUnset: "Mês de cobrança não definido",
    checkIn: "Registrar uso",
    kill: "Cancelar agora",
    killedNote: "Esta assinatura está cancelada.",
    revive: "Voltar para ativa",
  },
  routes: {
    title: "Como cancelar",
    account: "Conta de cadastro",
    copyId: "Copiar ID da conta",
    idCopied: "ID da conta copiado",
    copyFailed: "Não foi possível copiar. Selecione o ID na tela",
    loginWith: " — entre com esta conta para ver o botão de cancelar.",
    loginAny: "Entre com a conta usada no cadastro. Você pode anotá-la em “Editar”.",
    paymentMethod: "Forma de pagamento: ",
    paymentEntry:
      "Leva à página inicial, não à lista de pagamentos recorrentes. Siga as orientações da forma de pagamento acima para achar o menu de cancelamento.",
    entry:
      "Leva à página inicial ou da conta, não a uma página de cancelamento. Siga o guia abaixo para achar o menu de cancelamento.",
    custom: "É um endereço que você digitou. Não verificamos para onde ele leva.",
    openGuide: "Ver como cancelar",
    savedSteps: "Passos de cancelamento salvos:",
  },
  link: {
    newWindow: (label) => `${label} (nova janela)`,
    paymentManage: (name, direct) =>
      direct ? `Gerenciar pagamentos recorrentes em ${name}` : `Abrir ${name}`,
    cancelPage: (name) => `Ir direto para a página de cancelamento de ${name} (nova janela)`,
    cancelPageOpen: (name) => `Abrir a página de cancelamento de ${name} (nova janela)`,
    open: (name) => `Abrir ${name} (nova janela)`,
  },
  guide: {
    title: (name) => `Como cancelar ${name}`,
    description: "Se um link não abrir, siga os passos abaixo.",
    askTitle: "Você terminou de cancelar?",
    askBody:
      "Você voltou da página de cancelamento. Se terminou, registre. O app não consegue verificar se você cancelou.",
    notYet: "Ainda não",
    done: "Cancelei",
    step1: "Passo 1 · Abrir a página de cancelamento",
    paymentDirect: (method) => `Se você pagou com ${method}, cancele aqui.`,
    paymentEntry: (method) =>
      `Se você pagou com ${method}, cancele aqui. Leva à página inicial, não à lista de pagamentos recorrentes.`,
    direct: "Leva direto à página de cancelamento.",
    entry:
      "Leva à página inicial ou da conta, não a uma página de cancelamento. Siga os passos abaixo para achar o menu de cancelamento.",
    custom: "É um endereço que você digitou. Não verificamos para onde ele leva.",
    noLinks:
      "Nenhum link de cancelamento salvo. Adicione um endereço em “Editar” para ter um atalho.",
    together: "Serviços incluídos",
    togetherNote:
      "Um pacote é cancelado na página acima. Não verificamos se os serviços incluídos podem ser cancelados separadamente. Depois de cancelar, confira em cada serviço se a assinatura terminou.",
    checkStatus: (name) => `Verificar o status da assinatura de ${name}`,
    openService: (name) => `Abrir ${name}`,
    appBack:
      "Se abrir no app do serviço, o botão voltar pode se mover dentro desse app. Depois de conferir, volte ao SubSlash pelos apps recentes.",
    fallback: "Se o link não abrir",
    tryAccount: "Tentar a página de gerenciamento da conta",
    guessed: (url) => `${url} — deduzido a partir de endereços comuns, pode não existir.`,
    homeOf: (host) => `Abrir a página inicial de ${host}`,
    homeNote: "Entre na conta e siga os passos abaixo.",
    step2: "Passo 2 · O caminho até o menu de cancelamento",
    noSteps: "Nenhum passo salvo. Anote em “Editar” para facilitar na próxima vez.",
    alreadyKilled:
      "Já está registrada como cancelada. Se o cancelamento não deu certo, escolha “Voltar para ativa” no detalhe da assinatura e registre de novo.",
    close: "Fechar",
    doneNote:
      "Toque aqui quando tiver cancelado. A partir do dia de cobrança, conta como dinheiro economizado. O app não consegue verificar se você cancelou.",
    later: "Depois",
  },
  record: {
    title: "Registro de cancelamento",
    killedOn: (date) => `Registrada como cancelada em ${date}.`,
    noDate: "Não há registro da data de cancelamento.",
    chargedAfter: "Você foi cobrado depois de cancelar",
    chargedNote:
      "É uma mensagem para o atendimento ao cliente. Usa só os registros do app — leia e ajuste antes de enviar.",
    copyRefund: "Copiar pedido de reembolso",
    refundCopied: "Pedido de reembolso copiado",
    refundTitle: "Pedido de reembolso",
    lookAgain: "Dia para rever",
    lookAgainNote: (app) =>
      `Se houver um momento em que você usaria de novo, como uma nova temporada, escolha um dia. Nesse dia ela aparece em “Para decidir agora”${app ? " e, se as notificações do app estiverem ativas, também avisaremos você" : ""}.`,
    due: (date) => `Chegou ${date}. Se ainda não é hora de usar de novo, apague ou adie a data.`,
    save: "Salvar",
    saveReminder: (date) => `Vamos lembrar você em ${date}`,
    clear: "Apagar",
    cleared: "Dia para rever apagado",
    evidence: "Prova do cancelamento",
    evidenceNote:
      "Anote o assunto do e-mail de confirmação ou um número de protocolo: isso sustenta um pedido de reembolso se cobrarem de novo. Fica salvo só neste dispositivo, nos backups e na sincronização da conta.",
    referenceLabel: "Protocolo de cancelamento ou assunto do e-mail",
    referencePlaceholder: "ex.: número de protocolo, assunto do e-mail de confirmação",
    memoLabel: "Notas do cancelamento",
    memoPlaceholder: "ex.: cancelado em Ajustes > Assinaturas, falei com um atendente",
    recordedOn: (date) => `Anotado em ${date}`,
    evidenceSaved: "Registro de cancelamento salvo",
    evidenceCleared: "Registro de cancelamento apagado",
  },
  alt: {
    unknownTitle: "Você pode reduzir o plano em vez de cancelar",
    unknownBody: (count) =>
      `Este serviço tem ${count} planos. Escolha o seu em “Editar” e vamos compará-lo com os mais baratos.`,
    recorded: (plan) => `Registrado como ${plan}`,
    recordedYearly: (plan) => `Registrado como ${plan}. Informe o mês de cobrança em “Editar”.`,
    titleCompact: "Antes de cancelar: um jeito mais barato",
    title: "O que você pode fazer em vez de cancelar",
    nowOn: (plan, cycle, amount, perUse) =>
      `Agora ${plan} · ${cycle} ${amount}${perUse ? ` · ${perUse} por uso` : ""}`,
    cycleYearly: "por ano",
    cycleMonthly: "por mês",
    cheapest: "Este já é o plano mais barato do serviço. Para gastar menos, só cancelando.",
    toYearly: "Mudar para pagamento anual",
    line: (cycle, amount, monthly, perUse) =>
      `${cycle} ${amount}${monthly ? ` (cerca de ${monthly}/mês)` : ""}${perUse ? ` · ${perUse} por uso` : ""}`,
    saves: "A menos por ano",
    confirm: (plan) => `Você mudou para ${plan} no serviço? Vamos ajustar o preço e o plano.`,
    confirmYes: "Mudei",
    switched: "Mudei para este plano",
    footerBase: (taxExcluded) =>
      `Comparado pelo preço de tabela${taxExcluded ? " (o imposto é somado igualmente aos dois)" : ""}. Os planos diferem em anúncios, qualidade e recursos — confira no serviço o que você perderia.`,
    footerShared:
      " É uma assinatura compartilhada, então o preço é o valor total cobrado no cartão.",
    footerNoUsage: " Registre o uso nos últimos 30 dias para ver também o custo por uso.",
  },
};

export const fr: Widen<typeof ko> = {
  detail: {
    ...fr0.detail,
    summary: fr0.summary,
    routes: fr0.routes,
    link: fr0.link,
    guide: fr0.guide,
    record: fr0.record,
    alt: fr0.alt,
  },
};
export const es: Widen<typeof ko> = {
  detail: {
    ...es0.detail,
    summary: es0.summary,
    routes: es0.routes,
    link: es0.link,
    guide: es0.guide,
    record: es0.record,
    alt: es0.alt,
  },
};
export const de: Widen<typeof ko> = {
  detail: {
    ...de0.detail,
    summary: de0.summary,
    routes: de0.routes,
    link: de0.link,
    guide: de0.guide,
    record: de0.record,
    alt: de0.alt,
  },
};
export const pt: Widen<typeof ko> = {
  detail: {
    ...pt0.detail,
    summary: pt0.summary,
    routes: pt0.routes,
    link: pt0.link,
    guide: pt0.guide,
    record: pt0.record,
    alt: pt0.alt,
  },
};
