import type { Widen } from "../types";
import { monthLong, one } from "../english";
import { monthName } from "../months";

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
    monthLabel: (year, month) => `${monthLong(month)} ${year}`,
    dayWithCount: (month, day, count) =>
      `${monthLong(month)} ${day}, ${count} ${one(count) ? "payment" : "payments"}`,
    dayNone: (month, day) => `${monthLong(month)} ${day}, no payments`,
    noSubscriptions: "No subscriptions yet. Add one and its billing date shows up on the calendar.",
    noneThisMonth: "No subscription is billed this month.",
    summary: (days, count) =>
      `This month: ${days} ${one(days) ? "day" : "days"} · ${count} ${one(count) ? "payment" : "payments"} · `,
    pickHint: " — tap a dotted date to see what is charged",
    undated: (count) =>
      `${count} without a billing month couldn't be placed because the date is unknown — `,
    undatedLink: "Set the billing month of yearly subscriptions",
    dayHeading: (month, day) => `Charged on ${monthLong(month)} ${day}`,
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
    title: (month) => `Billing dates in ${monthLong(month)}`,
    passed: "Billing dates passed since cancelling",
    upcoming: "Billing dates left (if you stay cancelled)",
    none: "No billing date falls after a cancellation this month.",
    unverified:
      "Some cancellations are included whose charge you haven't confirmed stopped. Confirmed amounts are in “Money kept” above.",
    unknown: (count) =>
      `${count} yearly ${one(count) ? "subscription" : "subscriptions"} with an unknown billing month can't be placed in this month, so ${one(count) ? "it is" : "they are"} left out of the total. Set the billing month in the subscription details to include ${one(count) ? "it" : "them"}.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Charges blocked by cancelling: ${monthLong(cur)} ${curAmount} · ${monthLong(prev)} ${prevAmount} — `,
    more: (amount) => `${amount} more than last month`,
    less: (amount) => `${amount} less than last month`,
    same: "Same as last month",
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
const ovPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  page: {
    title: "今日订阅检查",
    subtitle: "只汇集需要做决定的订阅。",
    autoImport: "自动导入",
    addNew: "+ 添加订阅",
    summaryLabel: "本月摘要",
    demoStarted: "开始示例体验 · 不会和你的订阅混在一起",
    checkInRecorded: (name) => `已记录 ${name} 的使用情况。`,
  },
  totalSpend: {
    title: "每月固定支出",
    inTrial: (count, amount) => `${count} 个免费试用中的订阅不计入 · 结束后每月增加 ${amount}`,
    shared: (count, billed) => `含 ${count} 个分摊的订阅 · 卡上扣款：每月 ${billed}`,
    byCategory: "按类别的每月支出",
    moreCategories: (count) => `还有 ${count} 个类别`,
  },
  savings: {
    title: "守住的钱",
    confirmedNote: "退订后，已确认扣款日没有扣款的金额。",
    nothingPassed: "退订后还没有经过扣款日。第一个扣款日过后，我们会问你是否停止了扣款。",
    pending: (amount, count) => `待确认 ${amount}（${count} 个）`,
    pendingNote: "扣款日已过，但你还没告诉我们是否停止了扣款。回答后就会计入守住的钱。",
    answerOnDashboard: "在仪表板上回答 →",
    ahead: "今后",
    runRate: (amount) => `保持这些退订，每年可省 ${amount}`,
    unknown: (count) =>
      `${count} 个扣款月份或退订日期不明的订阅无法放到时间线上，所以未计入守住的钱和待确认金额。`,
    link: {
      pendingPrefix: (amount) => `待确认 ${amount} · `,
      summary: (runRate, level, title) => `每年节省 ${runRate} · ${level} ${title}`,
      unknownExcluded: (count) => ` · 未计入 ${count} 个没有扣款月份的订阅`,
      goSavings: "节省 →",
    },
  },
  risk: { green: "保留", yellow: "注意", red: "建议退订", title: (label) => `风险：${label}` },
  dday: { billingMonthUnset: "未设置扣款月份", tellYearlyDate: "请告诉我们年付的扣款日" },
  calendar: {
    title: "扣款日历",
    thisMonth: "本月",
    prevMonth: "上个月",
    nextMonth: "下个月",
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    monthLabel: (year, month) => `${year}年${Number(month)}月`,
    dayWithCount: (month, day, count) => `${Number(month)}月${day}日，${count} 笔扣款`,
    dayNone: (month, day) => `${Number(month)}月${day}日，没有扣款`,
    noSubscriptions: "还没有订阅。添加后扣款日会显示在日历上。",
    noneThisMonth: "本月没有扣款的订阅。",
    summary: (days, count) => `本月：${days} 天 · ${count} 笔扣款 · `,
    pickHint: " —— 点有圆点的日期查看扣款内容",
    undated: (count) => `${count} 个没有扣款月份的订阅因日期不明无法显示 —— `,
    undatedLink: "设置年付订阅的扣款月份",
    dayHeading: (month, day) => `${Number(month)}月${day}日扣款`,
    total: "合计",
    converted: "（按你设置的汇率换算）",
    sheet: "扣款日历",
    sheetSoon: (days) => `扣款日历 · ${days} 天内有扣款`,
    next: "下次扣款",
    noKnownDate: "没有已知扣款日的订阅",
    leftThisMonth: (count) => `本月还剩 ${count} 笔扣款 · `,
    viewCalendar: "查看日历",
  },
  defense: {
    title: (month) => `${Number(month)}月的扣款日`,
    passed: "退订后已过的扣款日",
    upcoming: "剩下的扣款日（保持退订的话）",
    none: "本月没有在退订之后的扣款日。",
    unverified: "其中包括尚未确认是否停止扣款的退订。已确认的金额在上方的“守住的钱”中。",
    unknown: (count) =>
      `${count} 个扣款月份不明的年付订阅无法放到本月，所以未计入合计。在订阅详情中设置扣款月份即可计入。`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `通过退订挡住的扣款：${Number(cur)}月 ${curAmount} · ${Number(prev)}月 ${prevAmount} —— `,
    more: (amount) => `比上个月多 ${amount}`,
    less: (amount) => `比上个月少 ${amount}`,
    same: "与上个月相同",
  },
};

export const ja: Widen<typeof ko> = {
  page: {
    title: "今日のサブスク点検",
    subtitle: "決める必要があるサブスクだけを集めました。",
    autoImport: "自動取り込み",
    addNew: "+ サブスクを追加",
    summaryLabel: "今月のまとめ",
    demoStarted: "サンプル体験を開始 · あなたのサブスクとは混ざりません",
    checkInRecorded: (name) => `${name} の利用状況を記録しました。`,
  },
  totalSpend: {
    title: "毎月の固定支出",
    inTrial: (count, amount) =>
      `無料体験中の ${count} 件は含めていません · 終わると月 ${amount} が加わります`,
    shared: (count, billed) => `共有サブスク ${count} 件を含む · カードへの請求: 月 ${billed}`,
    byCategory: "カテゴリ別の毎月の支出",
    moreCategories: (count) => `ほか ${count} カテゴリ`,
  },
  savings: {
    title: "守ったお金",
    confirmedNote: "解約後、支払日に請求されなかったと確認した金額です。",
    nothingPassed:
      "解約してからまだ支払日が来ていません。最初の支払日が過ぎたら、請求が止まったかお聞きします。",
    pending: (amount, count) => `確定待ち ${amount}（${count} 件）`,
    pendingNote:
      "支払日は過ぎましたが、請求が止まったかまだ教えてもらっていません。答えると守ったお金に加わります。",
    answerOnDashboard: "ダッシュボードで答える →",
    ahead: "これから",
    runRate: (amount) => `この解約を続ければ年 ${amount} の節約`,
    unknown: (count) =>
      `支払月か解約日がわからない ${count} 件は時期を決められないため、守ったお金と確定待ちの金額から除いています。`,
    link: {
      pendingPrefix: (amount) => `確定待ち ${amount} · `,
      summary: (runRate, level, title) => `年 ${runRate} 節約 · ${level} ${title}`,
      unknownExcluded: (count) => ` · 支払月のない ${count} 件は除外`,
      goSavings: "節約 →",
    },
  },
  risk: { green: "継続", yellow: "注意", red: "解約推奨", title: (label) => `危険度: ${label}` },
  dday: { billingMonthUnset: "支払月が未設定", tellYearlyDate: "年払いの支払日を教えてください" },
  calendar: {
    title: "支払いカレンダー",
    thisMonth: "今月",
    prevMonth: "前の月",
    nextMonth: "次の月",
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
    monthLabel: (year, month) => `${year}年${Number(month)}月`,
    dayWithCount: (month, day, count) => `${Number(month)}月${day}日、支払い ${count} 件`,
    dayNone: (month, day) => `${Number(month)}月${day}日、支払いなし`,
    noSubscriptions: "まだサブスクがありません。登録すると支払日がカレンダーに表示されます。",
    noneThisMonth: "今月支払いのあるサブスクはありません。",
    summary: (days, count) => `今月: ${days} 日 · 支払い ${count} 件 · `,
    pickHint: " — 点のある日付を押すと請求内容が見られます",
    undated: (count) => `支払月がない ${count} 件は日付がわからないため表示できません — `,
    undatedLink: "年払いサブスクの支払月を設定",
    dayHeading: (month, day) => `${Number(month)}月${day}日の請求`,
    total: "合計",
    converted: "（設定したレートで換算）",
    sheet: "支払いカレンダー",
    sheetSoon: (days) => `支払いカレンダー · ${days} 日以内に支払い`,
    next: "次の支払い",
    noKnownDate: "支払日がわかるサブスクがありません",
    leftThisMonth: (count) => `今月の残り支払い ${count} 件 · `,
    viewCalendar: "カレンダーを見る",
  },
  defense: {
    title: (month) => `${Number(month)}月の支払日`,
    passed: "解約後に過ぎた支払日",
    upcoming: "残りの支払日（解約したままなら）",
    none: "今月は解約後に来る支払日がありません。",
    unverified:
      "請求が止まったか確認していない解約も含まれています。確認した金額は上の「守ったお金」にあります。",
    unknown: (count) =>
      `支払月がわからない年払いのサブスク ${count} 件は今月に置けないため、合計から除いています。サブスクの詳細で支払月を設定すると含まれます。`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `解約で防いだ請求: ${Number(cur)}月 ${curAmount} · ${Number(prev)}月 ${prevAmount} — `,
    more: (amount) => `先月より ${amount} 多い`,
    less: (amount) => `先月より ${amount} 少ない`,
    same: "先月と同じ",
  },
};

export const vi: Widen<typeof ko> = {
  page: {
    title: "Kiểm tra gói đăng ký hôm nay",
    subtitle: "Chỉ những gói cần quyết định.",
    autoImport: "Nhập tự động",
    addNew: "+ Thêm gói đăng ký",
    summaryLabel: "Tóm tắt tháng này",
    demoStarted: "Đã bắt đầu dùng thử với dữ liệu mẫu · không trộn với gói của bạn",
    checkInRecorded: (name) => `Đã ghi nhận mức sử dụng ${name}.`,
  },
  totalSpend: {
    title: "Chi cố định hằng tháng",
    inTrial: (count, amount) =>
      `${count} gói đang dùng thử chưa được tính · sẽ cộng ${amount}/tháng khi kết thúc`,
    shared: (count, billed) => `Gồm ${count} gói dùng chung · trừ trên thẻ: ${billed}/tháng`,
    byCategory: "Chi hằng tháng theo danh mục",
    moreCategories: (count) => `và ${count} danh mục khác`,
  },
  savings: {
    title: "Tiền giữ lại",
    confirmedNote: "Số tiền đã xác nhận không bị trừ vào ngày thanh toán sau khi bạn hủy.",
    nothingPassed:
      "Chưa có ngày thanh toán nào trôi qua kể từ khi hủy. Khi ngày đầu tiên qua, chúng tôi sẽ hỏi việc trừ tiền đã dừng chưa.",
    pending: (amount, count) => `Chờ xác nhận ${amount} (${count})`,
    pendingNote:
      "Đã qua ngày thanh toán nhưng bạn chưa cho biết việc trừ tiền đã dừng chưa. Trả lời để cộng vào tiền giữ lại.",
    answerOnDashboard: "Trả lời trên bảng điều khiển →",
    ahead: "Sắp tới",
    runRate: (amount) => `Giữ nguyên các gói đã hủy giúp tiết kiệm ${amount} mỗi năm`,
    unknown: (count) =>
      `${count} gói không rõ tháng thanh toán hoặc ngày hủy nên không xếp được theo thời gian, vì vậy không tính vào tiền giữ lại và khoản chờ xác nhận.`,
    link: {
      pendingPrefix: (amount) => `Chờ xác nhận ${amount} · `,
      summary: (runRate, level, title) => `Tiết kiệm ${runRate} mỗi năm · ${level} ${title}`,
      unknownExcluded: (count) => ` · bỏ qua ${count} gói chưa có tháng thanh toán`,
      goSavings: "Tiết kiệm →",
    },
  },
  risk: { green: "Giữ", yellow: "Chú ý", red: "Nên hủy", title: (label) => `Rủi ro: ${label}` },
  dday: {
    billingMonthUnset: "Chưa đặt tháng thanh toán",
    tellYearlyDate: "Hãy cho biết ngày thanh toán hằng năm",
  },
  calendar: {
    title: "Lịch thanh toán",
    thisMonth: "Tháng này",
    prevMonth: "Tháng trước",
    nextMonth: "Tháng sau",
    weekdays: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    monthLabel: (year, month) => `Tháng ${Number(month)}/${year}`,
    dayWithCount: (month, day, count) =>
      `Ngày ${day} tháng ${Number(month)}, ${count} khoản thanh toán`,
    dayNone: (month, day) => `Ngày ${day} tháng ${Number(month)}, không có thanh toán`,
    noSubscriptions: "Chưa có gói đăng ký. Thêm gói thì ngày thanh toán sẽ hiện trên lịch.",
    noneThisMonth: "Tháng này không có gói nào bị trừ tiền.",
    summary: (days, count) => `Tháng này: ${days} ngày · ${count} khoản · `,
    pickHint: " — nhấn vào ngày có chấm để xem khoản bị trừ",
    undated: (count) =>
      `${count} gói chưa có tháng thanh toán không hiển thị được vì không rõ ngày — `,
    undatedLink: "Đặt tháng thanh toán cho gói trả theo năm",
    dayHeading: (month, day) => `Trừ tiền ngày ${day} tháng ${Number(month)}`,
    total: "Tổng",
    converted: " (quy đổi theo tỷ giá của bạn)",
    sheet: "Lịch thanh toán",
    sheetSoon: (days) => `Lịch thanh toán · có khoản trong ${days} ngày`,
    next: "Lần thanh toán tới",
    noKnownDate: "Chưa gói nào có ngày thanh toán",
    leftThisMonth: (count) => `Còn ${count} khoản trong tháng này · `,
    viewCalendar: "Xem lịch",
  },
  defense: {
    title: (month) => `Ngày thanh toán tháng ${Number(month)}`,
    passed: "Ngày thanh toán đã qua kể từ khi hủy",
    upcoming: "Ngày thanh toán còn lại (nếu vẫn hủy)",
    none: "Tháng này không có ngày thanh toán nào sau khi hủy.",
    unverified:
      "Có cả những gói đã hủy mà bạn chưa xác nhận việc trừ tiền đã dừng. Số tiền đã xác nhận nằm ở “Tiền giữ lại” phía trên.",
    unknown: (count) =>
      `${count} gói trả theo năm không rõ tháng thanh toán nên không xếp vào tháng này và không được tính vào tổng. Đặt tháng thanh toán trong chi tiết gói để tính vào.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Khoản bị chặn nhờ hủy: tháng ${Number(cur)} ${curAmount} · tháng ${Number(prev)} ${prevAmount} — `,
    more: (amount) => `Nhiều hơn tháng trước ${amount}`,
    less: (amount) => `Ít hơn tháng trước ${amount}`,
    same: "Bằng tháng trước",
  },
};

export const fr: Widen<typeof ko> = {
  page: {
    title: "Le point abonnements du jour",
    subtitle: "Seulement les abonnements qui demandent une décision.",
    autoImport: "Import automatique",
    addNew: "+ Ajouter un abonnement",
    summaryLabel: "Résumé du mois",
    demoStarted: "Essai avec exemple lancé · il ne se mélange pas à vos abonnements",
    checkInRecorded: (name) => `Utilisation de ${name} enregistrée.`,
  },
  totalSpend: {
    title: "Dépenses fixes mensuelles",
    inTrial: (count, amount) =>
      `${count} en essai gratuit ${ovPl(count, "n'est pas compté", "ne sont pas comptés")} · ${amount}/mois s'ajouteront à la fin`,
    shared: (count, billed) =>
      `Dont ${count} ${ovPl(count, "abonnement partagé", "abonnements partagés")} · débité sur votre carte : ${billed}/mois`,
    byCategory: "Dépenses mensuelles par catégorie",
    moreCategories: (count) => `et ${count} ${ovPl(count, "autre catégorie", "autres catégories")}`,
  },
  savings: {
    title: "Argent économisé",
    confirmedNote:
      "Le montant confirmé comme non débité au jour de paiement après votre résiliation.",
    nothingPassed:
      "Aucune date de paiement n'est encore passée depuis la résiliation. Nous vous demanderons si le prélèvement s'est arrêté après la première.",
    pending: (amount, count) => `En attente de confirmation ${amount} (${count})`,
    pendingNote:
      "La date de paiement est passée mais vous n'avez pas indiqué si le prélèvement s'est arrêté. Répondez pour l'ajouter à l'argent économisé.",
    answerOnDashboard: "Répondre sur le tableau de bord →",
    ahead: "À venir",
    runRate: (amount) => `Rester résilié vous fait économiser ${amount} par an`,
    unknown: (count) =>
      `${count} sans mois de paiement ou date de résiliation connus ne peuvent pas être placés dans le temps : ils sont exclus de l'argent économisé et du montant en attente.`,
    link: {
      pendingPrefix: (amount) => `En attente ${amount} · `,
      summary: (runRate, level, title) => `${runRate} économisés par an · ${level} ${title}`,
      unknownExcluded: (count) => ` · ${count} sans mois de paiement exclu${ovPl(count, "", "s")}`,
      goSavings: "Économies →",
    },
  },
  risk: {
    green: "À garder",
    yellow: "Attention",
    red: "Résiliation conseillée",
    title: (label) => `Risque : ${label}`,
  },
  dday: {
    billingMonthUnset: "Mois de paiement non défini",
    tellYearlyDate: "Indiquez la date de paiement annuelle",
  },
  calendar: {
    title: "Calendrier des paiements",
    thisMonth: "Ce mois-ci",
    prevMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    weekdays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
    monthLabel: (year, month) => `${monthName("fr", month)} ${year}`,
    dayWithCount: (month, day, count) =>
      `${day} ${monthName("fr", month)}, ${count} paiement${ovPl(count, "", "s")}`,
    dayNone: (month, day) => `${day} ${monthName("fr", month)}, aucun paiement`,
    noSubscriptions:
      "Pas encore d'abonnement. Ajoutez-en un et sa date de paiement apparaîtra sur le calendrier.",
    noneThisMonth: "Aucun abonnement n'est prélevé ce mois-ci.",
    summary: (days, count) =>
      `Ce mois-ci : ${days} jour${ovPl(days, "", "s")} · ${count} paiement${ovPl(count, "", "s")} · `,
    pickHint: " — touchez une date marquée pour voir ce qui est prélevé",
    undated: (count) =>
      `${count} sans mois de paiement n'ont pas pu être placés, la date étant inconnue — `,
    undatedLink: "Définir le mois de paiement des abonnements annuels",
    dayHeading: (month, day) => `Prélevé le ${day} ${monthName("fr", month)}`,
    total: "Total",
    converted: " (converti à votre taux)",
    sheet: "Calendrier des paiements",
    sheetSoon: (days) => `Calendrier des paiements · un paiement dans ${days} jours`,
    next: "Prochain paiement",
    noKnownDate: "Aucun abonnement n'a de date de paiement connue",
    leftThisMonth: (count) =>
      `${count} paiement${ovPl(count, "", "s")} restant${ovPl(count, "", "s")} ce mois-ci · `,
    viewCalendar: "Voir le calendrier",
  },
  defense: {
    title: (month) => `Dates de paiement en ${monthName("fr", month)}`,
    passed: "Dates de paiement passées depuis la résiliation",
    upcoming: "Dates de paiement restantes (si vous restez résilié)",
    none: "Aucune date de paiement ne tombe après une résiliation ce mois-ci.",
    unverified:
      "Sont incluses des résiliations dont vous n'avez pas confirmé l'arrêt du prélèvement. Les montants confirmés sont dans « Argent économisé » ci-dessus.",
    unknown: (count) =>
      `${count} ${ovPl(count, "abonnement annuel", "abonnements annuels")} sans mois de paiement connu ne peuvent pas être placés ce mois-ci et sont exclus du total. Définissez le mois de paiement dans le détail de l'abonnement pour les inclure.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Prélèvements évités grâce aux résiliations : ${monthName("fr", cur)} ${curAmount} · ${monthName("fr", prev)} ${prevAmount} — `,
    more: (amount) => `${amount} de plus que le mois dernier`,
    less: (amount) => `${amount} de moins que le mois dernier`,
    same: "Comme le mois dernier",
  },
};

export const es: Widen<typeof ko> = {
  page: {
    title: "Revisión de suscripciones de hoy",
    subtitle: "Solo las suscripciones que necesitan una decisión.",
    autoImport: "Importación automática",
    addNew: "+ Añadir suscripción",
    summaryLabel: "Resumen del mes",
    demoStarted: "Prueba con ejemplo iniciada · no se mezcla con tus suscripciones",
    checkInRecorded: (name) => `Se registró el uso de ${name}.`,
  },
  totalSpend: {
    title: "Gasto fijo mensual",
    inTrial: (count, amount) =>
      `${count} en prueba gratuita no se ${ovPl(count, "cuenta", "cuentan")} · se sumarán ${amount}/mes al terminar`,
    shared: (count, billed) =>
      `Incluye ${count} ${ovPl(count, "suscripción compartida", "suscripciones compartidas")} · cobrado a tu tarjeta: ${billed}/mes`,
    byCategory: "Gasto mensual por categoría",
    moreCategories: (count) => `y ${count} ${ovPl(count, "categoría más", "categorías más")}`,
  },
  savings: {
    title: "Dinero ahorrado",
    confirmedNote: "El importe confirmado como no cobrado en el día de cobro tras cancelar.",
    nothingPassed:
      "Aún no ha pasado ningún día de cobro desde que cancelaste. Cuando pase el primero, te preguntaremos si se detuvo el cobro.",
    pending: (amount, count) => `Pendiente de confirmar ${amount} (${count})`,
    pendingNote:
      "Pasó el día de cobro pero no nos has dicho si se detuvo el cobro. Responde para sumarlo al dinero ahorrado.",
    answerOnDashboard: "Responder en el panel →",
    ahead: "Lo que viene",
    runRate: (amount) => `Mantener estas cancelaciones ahorra ${amount} al año`,
    unknown: (count) =>
      `${count} sin mes de cobro o fecha de cancelación conocidos no se pueden ubicar en el tiempo, así que quedan fuera del dinero ahorrado y del importe pendiente.`,
    link: {
      pendingPrefix: (amount) => `Pendiente ${amount} · `,
      summary: (runRate, level, title) => `Ahorras ${runRate} al año · ${level} ${title}`,
      unknownExcluded: (count) => ` · ${count} sin mes de cobro excluida${ovPl(count, "", "s")}`,
      goSavings: "Ahorro →",
    },
  },
  risk: {
    green: "Mantener",
    yellow: "Atención",
    red: "Cancelar recomendado",
    title: (label) => `Riesgo: ${label}`,
  },
  dday: {
    billingMonthUnset: "Mes de cobro sin definir",
    tellYearlyDate: "Indica la fecha de cobro anual",
  },
  calendar: {
    title: "Calendario de cobros",
    thisMonth: "Este mes",
    prevMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    weekdays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    monthLabel: (year, month) => `${monthName("es", month)} de ${year}`,
    dayWithCount: (month, day, count) =>
      `${day} de ${monthName("es", month)}, ${count} cobro${ovPl(count, "", "s")}`,
    dayNone: (month, day) => `${day} de ${monthName("es", month)}, sin cobros`,
    noSubscriptions:
      "Aún no hay suscripciones. Añade una y su fecha de cobro aparecerá en el calendario.",
    noneThisMonth: "Ninguna suscripción se cobra este mes.",
    summary: (days, count) =>
      `Este mes: ${days} día${ovPl(days, "", "s")} · ${count} cobro${ovPl(count, "", "s")} · `,
    pickHint: " — toca una fecha con punto para ver qué se cobra",
    undated: (count) =>
      `${count} sin mes de cobro no se pudieron ubicar porque se desconoce la fecha — `,
    undatedLink: "Fija el mes de cobro de las suscripciones anuales",
    dayHeading: (month, day) => `Cobrado el ${day} de ${monthName("es", month)}`,
    total: "Total",
    converted: " (convertido a tu tipo de cambio)",
    sheet: "Calendario de cobros",
    sheetSoon: (days) => `Calendario de cobros · un cobro en ${days} días`,
    next: "Próximo cobro",
    noKnownDate: "Ninguna suscripción tiene fecha de cobro conocida",
    leftThisMonth: (count) => `Quedan ${count} cobro${ovPl(count, "", "s")} este mes · `,
    viewCalendar: "Ver calendario",
  },
  defense: {
    title: (month) => `Días de cobro de ${monthName("es", month)}`,
    passed: "Días de cobro pasados desde la cancelación",
    upcoming: "Días de cobro restantes (si sigues sin suscripción)",
    none: "Este mes no hay días de cobro después de una cancelación.",
    unverified:
      "Incluye cancelaciones cuyo cobro no has confirmado que se detuviera. Los importes confirmados están en «Dinero ahorrado» arriba.",
    unknown: (count) =>
      `${count} ${ovPl(count, "suscripción anual", "suscripciones anuales")} sin mes de cobro conocido no se pueden ubicar en este mes, así que quedan fuera del total. Fija el mes de cobro en el detalle de la suscripción para incluirlas.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Cobros evitados al cancelar: ${monthName("es", cur)} ${curAmount} · ${monthName("es", prev)} ${prevAmount} — `,
    more: (amount) => `${amount} más que el mes pasado`,
    less: (amount) => `${amount} menos que el mes pasado`,
    same: "Igual que el mes pasado",
  },
};

export const de: Widen<typeof ko> = {
  page: {
    title: "Heutiger Abo-Check",
    subtitle: "Nur die Abos, bei denen eine Entscheidung ansteht.",
    autoImport: "Automatischer Import",
    addNew: "+ Abo hinzufügen",
    summaryLabel: "Zusammenfassung des Monats",
    demoStarted: "Test mit Beispieldaten gestartet · wird nicht mit deinen Abos vermischt",
    checkInRecorded: (name) => `Nutzung von ${name} eingetragen.`,
  },
  totalSpend: {
    title: "Monatliche Fixkosten",
    inTrial: (count, amount) =>
      `${count} im kostenlosen Test ${ovPl(count, "wird", "werden")} nicht gezählt · nach Ende kommen ${amount}/Monat hinzu`,
    shared: (count, billed) =>
      `Inklusive ${count} geteilte${ovPl(count, "s Abo", " Abos")} · von der Karte abgebucht: ${billed}/Monat`,
    byCategory: "Monatliche Ausgaben nach Kategorie",
    moreCategories: (count) => `und ${count} weitere ${ovPl(count, "Kategorie", "Kategorien")}`,
  },
  savings: {
    title: "Gespartes Geld",
    confirmedNote:
      "Der Betrag, der nach der Kündigung am Abbuchungstag bestätigt nicht abgebucht wurde.",
    nothingPassed:
      "Seit der Kündigung ist noch kein Abbuchungstag vergangen. Nach dem ersten fragen wir, ob die Abbuchung gestoppt ist.",
    pending: (amount, count) => `Wartet auf Bestätigung ${amount} (${count})`,
    pendingNote:
      "Der Abbuchungstag ist vorbei, aber du hast noch nicht gesagt, ob die Abbuchung gestoppt ist. Antworte, um es zum gesparten Geld zu zählen.",
    answerOnDashboard: "In der Übersicht antworten →",
    ahead: "Ausblick",
    runRate: (amount) => `Bleiben diese gekündigt, sparst du ${amount} im Jahr`,
    unknown: (count) =>
      `${count} ohne bekannten Abbuchungsmonat oder Kündigungstermin lassen sich zeitlich nicht einordnen und fehlen daher beim gesparten und beim ausstehenden Betrag.`,
    link: {
      pendingPrefix: (amount) => `Ausstehend ${amount} · `,
      summary: (runRate, level, title) => `${runRate} pro Jahr gespart · ${level} ${title}`,
      unknownExcluded: (count) => ` · ${count} ohne Abbuchungsmonat ausgelassen`,
      goSavings: "Ersparnis →",
    },
  },
  risk: {
    green: "Behalten",
    yellow: "Achtung",
    red: "Kündigen empfohlen",
    title: (label) => `Risiko: ${label}`,
  },
  dday: {
    billingMonthUnset: "Abbuchungsmonat nicht festgelegt",
    tellYearlyDate: "Nenn uns das jährliche Abbuchungsdatum",
  },
  calendar: {
    title: "Abbuchungskalender",
    thisMonth: "Dieser Monat",
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    monthLabel: (year, month) => `${monthName("de", month)} ${year}`,
    dayWithCount: (month, day, count) =>
      `${day}. ${monthName("de", month)}, ${count} ${ovPl(count, "Abbuchung", "Abbuchungen")}`,
    dayNone: (month, day) => `${day}. ${monthName("de", month)}, keine Abbuchungen`,
    noSubscriptions:
      "Noch keine Abos. Füg eines hinzu, dann erscheint sein Abbuchungstag im Kalender.",
    noneThisMonth: "Diesen Monat wird kein Abo abgebucht.",
    summary: (days, count) =>
      `Dieser Monat: ${days} ${ovPl(days, "Tag", "Tage")} · ${count} ${ovPl(count, "Abbuchung", "Abbuchungen")} · `,
    pickHint: " — tippe auf ein markiertes Datum, um zu sehen, was abgebucht wird",
    undated: (count) =>
      `${count} ohne Abbuchungsmonat konnten mangels Datum nicht eingetragen werden — `,
    undatedLink: "Abbuchungsmonat für Jahresabos festlegen",
    dayHeading: (month, day) => `Abbuchung am ${day}. ${monthName("de", month)}`,
    total: "Gesamt",
    converted: " (zu deinem Kurs umgerechnet)",
    sheet: "Abbuchungskalender",
    sheetSoon: (days) => `Abbuchungskalender · eine Abbuchung in ${days} Tagen`,
    next: "Nächste Abbuchung",
    noKnownDate: "Kein Abo hat einen bekannten Abbuchungstag",
    leftThisMonth: (count) =>
      `Noch ${count} ${ovPl(count, "Abbuchung", "Abbuchungen")} diesen Monat · `,
    viewCalendar: "Kalender ansehen",
  },
  defense: {
    title: (month) => `Abbuchungstage im ${monthName("de", month)}`,
    passed: "Seit der Kündigung vergangene Abbuchungstage",
    upcoming: "Verbleibende Abbuchungstage (wenn gekündigt bleibt)",
    none: "Diesen Monat fällt kein Abbuchungstag nach einer Kündigung.",
    unverified:
      "Enthalten sind auch Kündigungen, bei denen du das Ende der Abbuchung nicht bestätigt hast. Bestätigte Beträge stehen oben unter „Gespartes Geld“.",
    unknown: (count) =>
      `${count} ${ovPl(count, "Jahresabo", "Jahresabos")} ohne bekannten Abbuchungsmonat lassen sich diesem Monat nicht zuordnen und fehlen in der Summe. Leg den Abbuchungsmonat in den Abo-Details fest, um sie einzubeziehen.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Durch Kündigen verhinderte Abbuchungen: ${monthName("de", cur)} ${curAmount} · ${monthName("de", prev)} ${prevAmount} — `,
    more: (amount) => `${amount} mehr als letzten Monat`,
    less: (amount) => `${amount} weniger als letzten Monat`,
    same: "Gleich wie letzten Monat",
  },
};

export const pt: Widen<typeof ko> = {
  page: {
    title: "Revisão de assinaturas de hoje",
    subtitle: "Só as assinaturas que pedem uma decisão.",
    autoImport: "Importação automática",
    addNew: "+ Adicionar assinatura",
    summaryLabel: "Resumo do mês",
    demoStarted: "Teste com exemplo iniciado · não se mistura com suas assinaturas",
    checkInRecorded: (name) => `Uso de ${name} registrado.`,
  },
  totalSpend: {
    title: "Gasto fixo mensal",
    inTrial: (count, amount) =>
      `${count} em teste grátis não ${ovPl(count, "é contada", "são contadas")} · ${amount}/mês entram quando terminar`,
    shared: (count, billed) =>
      `Inclui ${count} ${ovPl(count, "assinatura compartilhada", "assinaturas compartilhadas")} · cobrado no cartão: ${billed}/mês`,
    byCategory: "Gasto mensal por categoria",
    moreCategories: (count) => `e mais ${count} ${ovPl(count, "categoria", "categorias")}`,
  },
  savings: {
    title: "Dinheiro economizado",
    confirmedNote: "O valor confirmado como não cobrado no dia de cobrança depois de cancelar.",
    nothingPassed:
      "Ainda não passou nenhum dia de cobrança desde o cancelamento. Quando passar o primeiro, vamos perguntar se a cobrança parou.",
    pending: (amount, count) => `Aguardando confirmação ${amount} (${count})`,
    pendingNote:
      "O dia de cobrança passou, mas você ainda não disse se a cobrança parou. Responda para somar ao dinheiro economizado.",
    answerOnDashboard: "Responder no painel →",
    ahead: "Daqui para frente",
    runRate: (amount) => `Manter estes cancelamentos economiza ${amount} por ano`,
    unknown: (count) =>
      `${count} sem mês de cobrança ou data de cancelamento conhecidos não podem ser posicionadas no tempo, então ficam fora do dinheiro economizado e do valor pendente.`,
    link: {
      pendingPrefix: (amount) => `Pendente ${amount} · `,
      summary: (runRate, level, title) => `Economia de ${runRate} por ano · ${level} ${title}`,
      unknownExcluded: (count) => ` · ${count} sem mês de cobrança de fora`,
      goSavings: "Economia →",
    },
  },
  risk: {
    green: "Manter",
    yellow: "Atenção",
    red: "Cancelar recomendado",
    title: (label) => `Risco: ${label}`,
  },
  dday: {
    billingMonthUnset: "Mês de cobrança não definido",
    tellYearlyDate: "Informe a data de cobrança anual",
  },
  calendar: {
    title: "Calendário de cobranças",
    thisMonth: "Este mês",
    prevMonth: "Mês anterior",
    nextMonth: "Próximo mês",
    weekdays: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
    monthLabel: (year, month) => `${monthName("pt", month)} de ${year}`,
    dayWithCount: (month, day, count) =>
      `${day} de ${monthName("pt", month)}, ${count} cobrança${ovPl(count, "", "s")}`,
    dayNone: (month, day) => `${day} de ${monthName("pt", month)}, sem cobranças`,
    noSubscriptions:
      "Ainda não há assinaturas. Adicione uma e a data de cobrança aparece no calendário.",
    noneThisMonth: "Nenhuma assinatura é cobrada este mês.",
    summary: (days, count) =>
      `Este mês: ${days} dia${ovPl(days, "", "s")} · ${count} cobrança${ovPl(count, "", "s")} · `,
    pickHint: " — toque numa data com ponto para ver o que é cobrado",
    undated: (count) =>
      `${count} sem mês de cobrança não puderam ser posicionadas porque a data é desconhecida — `,
    undatedLink: "Definir o mês de cobrança das assinaturas anuais",
    dayHeading: (month, day) => `Cobrado em ${day} de ${monthName("pt", month)}`,
    total: "Total",
    converted: " (convertido pela sua taxa)",
    sheet: "Calendário de cobranças",
    sheetSoon: (days) => `Calendário de cobranças · uma cobrança em ${days} dias`,
    next: "Próxima cobrança",
    noKnownDate: "Nenhuma assinatura tem data de cobrança conhecida",
    leftThisMonth: (count) => `Faltam ${count} cobrança${ovPl(count, "", "s")} este mês · `,
    viewCalendar: "Ver calendário",
  },
  defense: {
    title: (month) => `Dias de cobrança de ${monthName("pt", month)}`,
    passed: "Dias de cobrança passados desde o cancelamento",
    upcoming: "Dias de cobrança restantes (se continuar cancelada)",
    none: "Este mês não há dia de cobrança depois de um cancelamento.",
    unverified:
      "Inclui cancelamentos cuja parada da cobrança você não confirmou. Os valores confirmados estão em “Dinheiro economizado” acima.",
    unknown: (count) =>
      `${count} ${ovPl(count, "assinatura anual", "assinaturas anuais")} sem mês de cobrança conhecido não podem ser posicionadas neste mês e ficam fora do total. Defina o mês de cobrança no detalhe da assinatura para incluí-las.`,
    blocked: (cur, curAmount, prev, prevAmount) =>
      `Cobranças evitadas ao cancelar: ${monthName("pt", cur)} ${curAmount} · ${monthName("pt", prev)} ${prevAmount} — `,
    more: (amount) => `${amount} a mais que o mês passado`,
    less: (amount) => `${amount} a menos que o mês passado`,
    same: "Igual ao mês passado",
  },
};
