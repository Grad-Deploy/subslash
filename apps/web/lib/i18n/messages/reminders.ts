import { withJosa } from "../josa";
import type { Widen } from "../types";
import { countOf, monthLong } from "../english";
import { monthName } from "../months";

/**
 * 기기 알림 문구(`lib/local-reminders`·`lib/native-reminders`), 알림 켜기 창, 대시보드 '시작하기'와 빈
 * 대시보드, 구글 캘린더 등록. 알림은 거는 때의 언어로 적힌다 — 언어를 바꾸면 다시 건다.
 */
export const ko = {
  reminders: {
    notify: {
      billingTitle: (name: string, daysBefore: number) =>
        `${name} 결제 ${daysBefore === 0 ? "오늘" : `${daysBefore}일 전`}`,
      billingBody: (month: number, day: number, amount: string) =>
        `${month}월 ${day}일에 ${amount}이 결제될 예정이에요. 계속 쓸지 확인해 보세요.`,
      receiptTitle: (month: number) => `${month}월 구독 영수증이 나왔어요`,
      receiptBody: "지난달 어떤 구독에 얼마를 냈는지, 제값을 했는지 확인해 보세요.",
      resubscribeTitle: (name: string) => `${name} 다시 살펴볼 날이에요`,
      resubscribeBody: "해지할 때 오늘 알려 달라고 하셨어요. 다시 쓸 때가 됐는지 확인해 보세요.",
      channelName: "결제 알림",
      channelDescription: "구독 결제일 전에 알려 드립니다.",
      testTitle: "SubSlash 결제 알림 시험",
      testBody: "알림이 이렇게 뜹니다. 결제일 전 오전 9시에 알려 드릴게요.",
    },
    prompt: {
      close: "닫기",
      title: "결제일 전에 알려드릴까요?",
      body: (name: string | null, daysBefore: number) =>
        `${name ? `${name} ` : ""}${daysBefore === 0 ? "결제 당일" : `결제 ${daysBefore}일 전`} 오전 9시에 이 휴대폰으로 알려드려요. 서버나 이메일을 거치지 않아 로그인하지 않아도 돼요.`,
      whenLabel: "언제 알릴지",
      choice: (daysBefore: number) => (daysBefore === 0 ? "당일" : `${daysBefore}일 전`),
      unknownBilling: (name: string) =>
        `${withJosa(name, "은", "는")} 결제일을 몰라서 알림을 걸 수 없어요.`,
      addBilling: "결제일 넣기",
      denied:
        "알림 권한이 꺼져 있어요. 휴대폰 설정 › 애플리케이션 › SubSlash › 알림에서 허용한 뒤 다시 눌러 주세요.",
      checking: "확인하는 중…",
      turnOn: "알림 받기",
      later: "나중에",
    },
    start: {
      label: "시작하기",
      done: "시작 준비 끝",
      close: "시작하기 닫기",
      stepAdd: "쓰고 있는 구독 등록하기",
      stepCheckIn: "이번 달 사용 횟수 입력하기",
      stepReminders: "결제일 알림 켜기",
      allDone: "이제 매달 한 번 사용 횟수만 입력하면 돼요. 이 카드는 닫아도 돼요.",
      now: "지금",
    },
    picker: {
      title: "쓰고 있는 구독을 골라보세요",
      body: "하나만 골라도 1회당 얼마인지 바로 계산돼요.",
      more: "더 보기",
      email: "결제 메일에서 한 번에 찾기",
      usage: "폰 사용 기록으로 찾기",
      custom: "목록에 없어요 · 직접 입력",
      paste: "문자 붙여넣기",
      sample: "샘플로 둘러보기",
    },
    calendar: {
      days: [
        { value: 0, label: "결제일 아침" },
        { value: 1, label: "결제 1일 전" },
        { value: 3, label: "결제 3일 전" },
        { value: 7, label: "결제 7일 전" },
      ],
      startFailed: "캘린더 등록을 시작하지 못했습니다.",
      title: "구글 캘린더에 결제일 등록",
      /** 캘린더 이름은 웹 앱이 만드는 이름 그대로(`CALENDAR_NAME`) 받는다. */
      body: (calendar: string) =>
        `‘${calendar}’ 캘린더를 만들어 결제일을 반복 일정으로 넣어요. 다른 캘린더는 건드리지 않아요.`,
      loginBefore: "쓰려면 ",
      login: "로그인",
      loginAfter: "이 필요해요.",
      notConfigured: "이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다.",
      willSyncBefore: "지금 올릴 결제일 ",
      willSync: (count: number) => `${count}건`,
      undated: (count: number) => ` · 결제 월을 적지 않은 연간 구독 ${count}건은 뺍니다`,
      reminder: "일정 알림",
      submit: "구글 캘린더에 등록하기",
      nothing: "올릴 구독이 없어요. 연간 구독이라면 상세에서 결제 월을 적어 주세요.",
      notes: [
        "구독 이름·금액·결제일이 Google로 전달돼요. 서버는 최대 10분만 들고 있다가 지워요.",
        "구독을 고쳤다면 다시 누르세요. 자동으로 바뀌지 않아요.",
        "‘확인되지 않은 앱’ 경고가 나오면 ‘고급’에서 계속하세요.",
      ],
      stop: (calendar: string) => `그만두려면 ‘${calendar}’ 캘린더를 지우세요.`,
    },
  },
};

export const en: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name} charge ${Number(daysBefore) === 0 ? "today" : `in ${countOf(daysBefore, "day")}`}`,
      billingBody: (month, day, amount) =>
        `${amount} will be charged on ${monthLong(month)} ${day}. Check whether you'll keep using it.`,
      receiptTitle: (month) => `Your ${monthLong(month)} subscription receipt is ready`,
      receiptBody:
        "See what you paid for each subscription last month and whether it was worth it.",
      resubscribeTitle: (name) => `Time to take another look at ${name}`,
      resubscribeBody:
        "You asked us to remind you today when you cancelled. See if it's time to use it again.",
      channelName: "Billing reminders",
      channelDescription: "Reminds you before subscription billing days.",
      testTitle: "SubSlash billing reminder test",
      testBody: "This is how reminders look. We'll remind you at 9 AM before the billing day.",
    },
    prompt: {
      close: "Close",
      title: "Remind you before billing days?",
      body: (name, daysBefore) =>
        `We'll remind you on this phone at 9 AM ${Number(daysBefore) === 0 ? "on the billing day" : `${countOf(daysBefore, "day")} before billing`}${name ? ` for ${name}` : ""}. It doesn't go through a server or email, so you don't need to log in.`,
      whenLabel: "When to remind",
      choice: (daysBefore) =>
        Number(daysBefore) === 0 ? "Same day" : `${countOf(daysBefore, "day")} before`,
      unknownBilling: (name) => `${name} has no billing date, so no reminder can be set.`,
      addBilling: "Add a billing date",
      denied:
        "Notification permission is off. Allow it in Phone settings › Apps › SubSlash › Notifications, then tap again.",
      checking: "Checking…",
      turnOn: "Get reminders",
      later: "Later",
    },
    start: {
      label: "Getting started",
      done: "All set",
      close: "Close getting started",
      stepAdd: "Register a subscription you use",
      stepCheckIn: "Enter this month's uses",
      stepReminders: "Turn on billing reminders",
      allDone: "From now on, just enter your uses once a month. You can close this card.",
      now: "Now",
    },
    picker: {
      title: "Pick the subscriptions you use",
      body: "Pick just one and we'll calculate the cost per use right away.",
      more: "More",
      email: "Find them all in payment emails",
      usage: "Find from phone usage history",
      custom: "Not listed · Enter it myself",
      paste: "Paste a payment text",
      sample: "Look around with a sample",
    },
    calendar: {
      days: [
        { value: 0, label: "Morning of the billing day" },
        { value: 1, label: "1 day before billing" },
        { value: 3, label: "3 days before billing" },
        { value: 7, label: "7 days before billing" },
      ],
      startFailed: "Couldn't start adding to the calendar.",
      title: "Add billing days to Google Calendar",
      body: (calendar) =>
        `We create a “${calendar}” calendar and add billing days as recurring events. Other calendars aren't touched.`,
      loginBefore: "You need to ",
      login: "log in",
      loginAfter: " to use this.",
      notConfigured: "Google Calendar registration isn't set up on this server.",
      willSyncBefore: "Billing days to add now: ",
      willSync: (count) => `${count}`,
      undated: (count) =>
        ` · ${countOf(count, "yearly subscription")} without a billing month left out`,
      reminder: "Event reminder",
      submit: "Add to Google Calendar",
      nothing:
        "No subscriptions to add. For a yearly subscription, enter the billing month in its details.",
      notes: [
        "Subscription names, amounts, and billing days are sent to Google. Our server holds them for at most 10 minutes, then deletes them.",
        "If you changed a subscription, tap again. It doesn't update automatically.",
        "If an “unverified app” warning appears, continue from “Advanced”.",
      ],
      stop: (calendar) => `To stop, delete the “${calendar}” calendar.`,
    },
  },
};

export const zh: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name} ${Number(daysBefore) === 0 ? "今天扣款" : `${daysBefore} 天后扣款`}`,
      billingBody: (month, day, amount) =>
        `${Number(month)}月${day}日将扣款 ${amount}。看看还要不要继续用。`,
      receiptTitle: (month) => `${Number(month)}月的订阅小票出来了`,
      receiptBody: "看看上个月每个订阅付了多少、值不值。",
      resubscribeTitle: (name) => `该再看看 ${name} 了`,
      resubscribeBody: "退订时你让我们今天提醒你。看看是不是该再用了。",
      channelName: "扣款提醒",
      channelDescription: "在订阅扣款日之前提醒你。",
      testTitle: "SubSlash 扣款提醒测试",
      testBody: "提醒会这样显示。我们会在扣款日前的上午 9 点提醒你。",
    },
    prompt: {
      close: "关闭",
      title: "要在扣款日前提醒你吗？",
      body: (name, daysBefore) =>
        `我们会在${Number(daysBefore) === 0 ? "扣款当天" : `扣款前 ${daysBefore} 天`}上午 9 点${name ? `为 ${name} ` : ""}在这部手机上提醒你。不经过服务器或邮件，所以不需要登录。`,
      whenLabel: "提醒时间",
      choice: (daysBefore) => (Number(daysBefore) === 0 ? "当天" : `${daysBefore} 天前`),
      unknownBilling: (name) => `${name} 没有扣款日，无法设置提醒。`,
      addBilling: "添加扣款日",
      denied: "通知权限已关闭。请在手机设置 › 应用 › SubSlash › 通知中允许，然后再点一次。",
      checking: "正在确认…",
      turnOn: "接收提醒",
      later: "稍后",
    },
    start: {
      label: "开始使用",
      done: "全部完成",
      close: "关闭开始使用",
      stepAdd: "登记正在用的订阅",
      stepCheckIn: "输入本月使用次数",
      stepReminders: "打开扣款提醒",
      allDone: "以后每月输入一次使用次数就行。可以关闭这张卡片了。",
      now: "现在",
    },
    picker: {
      title: "选择你正在用的订阅",
      body: "只选一个，也能马上算出单次成本。",
      more: "更多",
      email: "从付款邮件中一次找到",
      usage: "从手机使用记录中查找",
      custom: "列表里没有 · 手动输入",
      paste: "粘贴付款短信",
      sample: "用示例看看",
    },
    calendar: {
      days: [
        { value: 0, label: "扣款当天早上" },
        { value: 1, label: "扣款前 1 天" },
        { value: 3, label: "扣款前 3 天" },
        { value: 7, label: "扣款前 7 天" },
      ],
      startFailed: "无法开始添加到日历。",
      title: "将扣款日添加到 Google 日历",
      body: (calendar) =>
        `我们会创建一个“${calendar}”日历，并把扣款日作为重复日程添加。其他日历不会被改动。`,
      loginBefore: "需要",
      login: "登录",
      loginAfter: "才能使用。",
      notConfigured: "此服务器未设置 Google 日历同步。",
      willSyncBefore: "现在要添加的扣款日：",
      willSync: (count) => `${count} 个`,
      undated: (count) => ` · 不包括 ${count} 个没有扣款月份的年付订阅`,
      reminder: "日程提醒",
      submit: "添加到 Google 日历",
      nothing: "没有可添加的订阅。年付订阅请在详情中填写扣款月份。",
      notes: [
        "订阅名称、金额和扣款日会发送给 Google。我们的服务器最多保存 10 分钟后删除。",
        "修改订阅后请再点一次。它不会自动更新。",
        "如果出现“未经验证的应用”警告，请从“高级”继续。",
      ],
      stop: (calendar) => `要停止时，删除“${calendar}”日历即可。`,
    },
  },
};

export const ja: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name} ${Number(daysBefore) === 0 ? "今日支払い" : `${daysBefore} 日後に支払い`}`,
      billingBody: (month, day, amount) =>
        `${Number(month)}月${day}日に ${amount} が請求されます。使い続けるか確認しましょう。`,
      receiptTitle: (month) => `${Number(month)}月のサブスクのレシートができました`,
      receiptBody: "先月それぞれのサブスクにいくら払い、元が取れたかを見てみましょう。",
      resubscribeTitle: (name) => `${name} をもう一度見直す時期です`,
      resubscribeBody:
        "解約するとき、今日知らせるよう頼まれていました。また使う時期か見てみましょう。",
      channelName: "支払い通知",
      channelDescription: "サブスクの支払日の前にお知らせします。",
      testTitle: "SubSlash 支払い通知のテスト",
      testBody: "通知はこのように表示されます。支払日の前の午前 9 時にお知らせします。",
    },
    prompt: {
      close: "閉じる",
      title: "支払日の前にお知らせしましょうか？",
      body: (name, daysBefore) =>
        `${Number(daysBefore) === 0 ? "支払日当日" : `支払日の ${daysBefore} 日前`}の午前 9 時に${name ? `${name} について` : ""}このスマホでお知らせします。サーバーやメールを通さないので、ログインは不要です。`,
      whenLabel: "お知らせのタイミング",
      choice: (daysBefore) => (Number(daysBefore) === 0 ? "当日" : `${daysBefore} 日前`),
      unknownBilling: (name) => `${name} は支払日がないため、通知を設定できません。`,
      addBilling: "支払日を追加",
      denied:
        "通知の権限がオフです。スマホの設定 › アプリ › SubSlash › 通知で許可してから、もう一度押してください。",
      checking: "確認中…",
      turnOn: "通知を受け取る",
      later: "あとで",
    },
    start: {
      label: "はじめに",
      done: "完了",
      close: "はじめにを閉じる",
      stepAdd: "使っているサブスクを登録",
      stepCheckIn: "今月の利用回数を入力",
      stepReminders: "支払い通知をオンにする",
      allDone: "これからは月に一度、利用回数を入力するだけです。このカードは閉じてかまいません。",
      now: "今",
    },
    picker: {
      title: "使っているサブスクを選んでください",
      body: "1 つ選ぶだけで、1 回あたりの単価がすぐにわかります。",
      more: "もっと見る",
      email: "支払いメールからまとめて探す",
      usage: "スマホの利用記録から探す",
      custom: "一覧にない · 手動で入力",
      paste: "支払いのメッセージを貼り付け",
      sample: "サンプルで見てみる",
    },
    calendar: {
      days: [
        { value: 0, label: "支払日の朝" },
        { value: 1, label: "支払日の 1 日前" },
        { value: 3, label: "支払日の 3 日前" },
        { value: 7, label: "支払日の 7 日前" },
      ],
      startFailed: "カレンダーへの登録を開始できませんでした。",
      title: "Google カレンダーに支払日を登録",
      body: (calendar) =>
        `「${calendar}」カレンダーを作り、支払日を繰り返しの予定として追加します。ほかのカレンダーには触れません。`,
      loginBefore: "使うには",
      login: "ログイン",
      loginAfter: "が必要です。",
      notConfigured: "このサーバーでは Google カレンダーへの登録が設定されていません。",
      willSyncBefore: "今登録する支払日: ",
      willSync: (count) => `${count} 件`,
      undated: (count) => ` · 支払月がない年払いのサブスク ${count} 件は除外`,
      reminder: "予定の通知",
      submit: "Google カレンダーに登録",
      nothing: "登録するサブスクがありません。年払いのサブスクは詳細で支払月を入力してください。",
      notes: [
        "サブスクの名前・金額・支払日が Google に送られます。私たちのサーバーは最大 10 分保管した後に削除します。",
        "サブスクを変更したら、もう一度押してください。自動では更新されません。",
        "「確認されていないアプリ」という警告が出たら、「詳細」から続けてください。",
      ],
      stop: (calendar) => `やめるときは「${calendar}」カレンダーを削除してください。`,
    },
  },
};

export const vi: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name} ${Number(daysBefore) === 0 ? "thanh toán hôm nay" : `thanh toán sau ${daysBefore} ngày`}`,
      billingBody: (month, day, amount) =>
        `${amount} sẽ bị trừ vào ngày ${day} tháng ${Number(month)}. Hãy xem bạn có tiếp tục dùng không.`,
      receiptTitle: (month) => `Hóa đơn gói đăng ký tháng ${Number(month)} đã sẵn sàng`,
      receiptBody: "Xem tháng trước bạn đã trả bao nhiêu cho mỗi gói và có đáng không.",
      resubscribeTitle: (name) => `Đến lúc xem lại ${name}`,
      resubscribeBody: "Khi hủy, bạn đã nhờ nhắc vào hôm nay. Hãy xem đã đến lúc dùng lại chưa.",
      channelName: "Nhắc thanh toán",
      channelDescription: "Nhắc bạn trước ngày thanh toán gói đăng ký.",
      testTitle: "Thử nhắc thanh toán SubSlash",
      testBody:
        "Lời nhắc sẽ hiển thị như thế này. Chúng tôi sẽ nhắc lúc 9 giờ sáng trước ngày thanh toán.",
    },
    prompt: {
      close: "Đóng",
      title: "Nhắc bạn trước ngày thanh toán?",
      body: (name, daysBefore) =>
        `Chúng tôi sẽ nhắc trên điện thoại này lúc 9 giờ sáng ${Number(daysBefore) === 0 ? "vào ngày thanh toán" : `${daysBefore} ngày trước ngày thanh toán`}${name ? ` cho ${name}` : ""}. Không qua máy chủ hay email nên không cần đăng nhập.`,
      whenLabel: "Thời điểm nhắc",
      choice: (daysBefore) => (Number(daysBefore) === 0 ? "Cùng ngày" : `${daysBefore} ngày trước`),
      unknownBilling: (name) => `${name} chưa có ngày thanh toán nên không đặt được lời nhắc.`,
      addBilling: "Thêm ngày thanh toán",
      denied:
        "Quyền thông báo đang tắt. Hãy cho phép trong Cài đặt điện thoại › Ứng dụng › SubSlash › Thông báo, rồi nhấn lại.",
      checking: "Đang kiểm tra…",
      turnOn: "Nhận lời nhắc",
      later: "Để sau",
    },
    start: {
      label: "Bắt đầu",
      done: "Đã xong",
      close: "Đóng phần bắt đầu",
      stepAdd: "Thêm gói bạn đang dùng",
      stepCheckIn: "Nhập số lần dùng tháng này",
      stepReminders: "Bật nhắc thanh toán",
      allDone: "Từ giờ, mỗi tháng chỉ cần nhập số lần dùng một lần. Bạn có thể đóng thẻ này.",
      now: "Ngay",
    },
    picker: {
      title: "Chọn gói bạn đang dùng",
      body: "Chỉ cần chọn một gói là tính ngay chi phí mỗi lần dùng.",
      more: "Thêm",
      email: "Tìm tất cả trong email thanh toán",
      usage: "Tìm từ dữ liệu sử dụng điện thoại",
      custom: "Không có trong danh sách · Tự nhập",
      paste: "Dán tin nhắn thanh toán",
      sample: "Xem thử bằng dữ liệu mẫu",
    },
    calendar: {
      days: [
        { value: 0, label: "Sáng ngày thanh toán" },
        { value: 1, label: "1 ngày trước ngày thanh toán" },
        { value: 3, label: "3 ngày trước ngày thanh toán" },
        { value: 7, label: "7 ngày trước ngày thanh toán" },
      ],
      startFailed: "Không thể bắt đầu thêm vào lịch.",
      title: "Thêm ngày thanh toán vào Google Lịch",
      body: (calendar) =>
        `Chúng tôi tạo lịch “${calendar}” và thêm ngày thanh toán dưới dạng sự kiện lặp lại. Các lịch khác không bị động đến.`,
      loginBefore: "Bạn cần ",
      login: "đăng nhập",
      loginAfter: " để dùng tính năng này.",
      notConfigured: "Máy chủ này chưa thiết lập đồng bộ Google Lịch.",
      willSyncBefore: "Số ngày thanh toán sẽ thêm: ",
      willSync: (count) => `${count}`,
      undated: (count) => ` · bỏ qua ${count} gói trả theo năm chưa có tháng thanh toán`,
      reminder: "Nhắc sự kiện",
      submit: "Thêm vào Google Lịch",
      nothing:
        "Không có gói nào để thêm. Với gói trả theo năm, hãy nhập tháng thanh toán trong chi tiết.",
      notes: [
        "Tên gói, số tiền và ngày thanh toán được gửi đến Google. Máy chủ của chúng tôi giữ tối đa 10 phút rồi xóa.",
        "Nếu đã sửa gói đăng ký, hãy nhấn lại. Lịch không tự cập nhật.",
        "Nếu thấy cảnh báo “ứng dụng chưa được xác minh”, hãy tiếp tục từ “Nâng cao”.",
      ],
      stop: (calendar) => `Muốn dừng, hãy xóa lịch “${calendar}”.`,
    },
  },
};

export const fr: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name} : paiement ${Number(daysBefore) === 0 ? "aujourd'hui" : `dans ${daysBefore} jour${Number(daysBefore) === 1 ? "" : "s"}`}`,
      billingBody: (month, day, amount) =>
        `${amount} sera débité le ${day} ${monthName("fr", month)}. Voyez si vous continuez à l'utiliser.`,
      receiptTitle: (month) => `Votre ticket d'abonnements de ${monthName("fr", month)} est prêt`,
      receiptBody:
        "Voyez ce que vous avez payé pour chaque abonnement le mois dernier et si cela en valait la peine.",
      resubscribeTitle: (name) => `Il est temps de revoir ${name}`,
      resubscribeBody:
        "En résiliant, vous avez demandé un rappel aujourd'hui. Voyez s'il est temps de le réutiliser.",
      channelName: "Rappels de paiement",
      channelDescription: "Vous prévient avant les jours de paiement des abonnements.",
      testTitle: "Test de rappel de paiement SubSlash",
      testBody:
        "Voici à quoi ressemblent les rappels. Nous vous préviendrons à 9 h avant le jour de paiement.",
    },
    prompt: {
      close: "Fermer",
      title: "Vous prévenir avant les jours de paiement ?",
      body: (name, daysBefore) =>
        `Nous vous préviendrons sur ce téléphone à 9 h ${Number(daysBefore) === 0 ? "le jour du paiement" : `${daysBefore} jour${Number(daysBefore) === 1 ? "" : "s"} avant le paiement`}${name ? ` pour ${name}` : ""}. Cela ne passe ni par un serveur ni par e-mail, pas besoin de se connecter.`,
      whenLabel: "Quand prévenir",
      choice: (daysBefore) =>
        Number(daysBefore) === 0
          ? "Le jour même"
          : `${daysBefore} jour${Number(daysBefore) === 1 ? "" : "s"} avant`,
      unknownBilling: (name) =>
        `${name} n'a pas de date de paiement, aucun rappel ne peut être programmé.`,
      addBilling: "Ajouter une date de paiement",
      denied:
        "L'autorisation des notifications est désactivée. Autorisez-la dans Réglages du téléphone › Applications › SubSlash › Notifications, puis appuyez à nouveau.",
      checking: "Vérification…",
      turnOn: "Recevoir des rappels",
      later: "Plus tard",
    },
    start: {
      label: "Pour commencer",
      done: "Terminé",
      close: "Fermer « Pour commencer »",
      stepAdd: "Ajouter un abonnement que vous utilisez",
      stepCheckIn: "Saisir les utilisations du mois",
      stepReminders: "Activer les rappels de paiement",
      allDone:
        "Désormais, saisissez simplement vos utilisations une fois par mois. Vous pouvez fermer cette carte.",
      now: "Maintenant",
    },
    picker: {
      title: "Choisissez les abonnements que vous utilisez",
      body: "Choisissez-en un seul et nous calculons tout de suite le coût par utilisation.",
      more: "Plus",
      email: "Tout trouver dans les e-mails de paiement",
      usage: "Trouver via l'historique d'utilisation du téléphone",
      custom: "Pas dans la liste · Saisir moi-même",
      paste: "Coller un SMS de paiement",
      sample: "Découvrir avec un exemple",
    },
    calendar: {
      days: [
        { value: 0, label: "Le matin du jour de paiement" },
        { value: 1, label: "1 jour avant le paiement" },
        { value: 3, label: "3 jours avant le paiement" },
        { value: 7, label: "7 jours avant le paiement" },
      ],
      startFailed: "Impossible de commencer l'ajout au calendrier.",
      title: "Ajouter les jours de paiement à Google Agenda",
      body: (calendar) =>
        `Nous créons un agenda « ${calendar} » et y ajoutons les jours de paiement comme événements récurrents. Les autres agendas ne sont pas touchés.`,
      loginBefore: "Vous devez ",
      login: "vous connecter",
      loginAfter: " pour utiliser cette fonction.",
      notConfigured: "L'ajout à Google Agenda n'est pas configuré sur ce serveur.",
      willSyncBefore: "Jours de paiement à ajouter : ",
      willSync: (count) => `${count}`,
      undated: (count) =>
        ` · ${count} abonnement${Number(count) === 1 ? "" : "s"} annuel${Number(count) === 1 ? "" : "s"} sans mois de paiement exclu${Number(count) === 1 ? "" : "s"}`,
      reminder: "Rappel d'événement",
      submit: "Ajouter à Google Agenda",
      nothing:
        "Aucun abonnement à ajouter. Pour un abonnement annuel, saisissez le mois de paiement dans son détail.",
      notes: [
        "Les noms, montants et jours de paiement des abonnements sont envoyés à Google. Notre serveur les garde au plus 10 minutes, puis les supprime.",
        "Si vous avez modifié un abonnement, appuyez à nouveau. La mise à jour n'est pas automatique.",
        "Si un avertissement « application non validée » apparaît, continuez via « Paramètres avancés ».",
      ],
      stop: (calendar) => `Pour arrêter, supprimez l'agenda « ${calendar} ».`,
    },
  },
};

export const es: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name}: cobro ${Number(daysBefore) === 0 ? "hoy" : `en ${daysBefore} día${Number(daysBefore) === 1 ? "" : "s"}`}`,
      billingBody: (month, day, amount) =>
        `Se cobrarán ${amount} el ${day} de ${monthName("es", month)}. Revisa si vas a seguir usándola.`,
      receiptTitle: (month) => `Tu ticket de suscripciones de ${monthName("es", month)} está listo`,
      receiptBody: "Mira cuánto pagaste por cada suscripción el mes pasado y si valió la pena.",
      resubscribeTitle: (name) => `Es hora de volver a mirar ${name}`,
      resubscribeBody:
        "Al cancelar pediste que te avisáramos hoy. Mira si es momento de volver a usarla.",
      channelName: "Recordatorios de cobro",
      channelDescription: "Te avisa antes de los días de cobro de las suscripciones.",
      testTitle: "Prueba de recordatorio de SubSlash",
      testBody: "Así se ven los recordatorios. Te avisaremos a las 9:00 antes del día de cobro.",
    },
    prompt: {
      close: "Cerrar",
      title: "¿Te avisamos antes de los días de cobro?",
      body: (name, daysBefore) =>
        `Te avisaremos en este móvil a las 9:00 ${Number(daysBefore) === 0 ? "el día del cobro" : `${daysBefore} día${Number(daysBefore) === 1 ? "" : "s"} antes del cobro`}${name ? ` para ${name}` : ""}. No pasa por un servidor ni por correo, así que no hace falta iniciar sesión.`,
      whenLabel: "Cuándo avisar",
      choice: (daysBefore) =>
        Number(daysBefore) === 0
          ? "El mismo día"
          : `${daysBefore} día${Number(daysBefore) === 1 ? "" : "s"} antes`,
      unknownBilling: (name) =>
        `${name} no tiene fecha de cobro, así que no se puede poner un recordatorio.`,
      addBilling: "Añadir fecha de cobro",
      denied:
        "El permiso de notificaciones está desactivado. Permítelo en Ajustes del móvil › Aplicaciones › SubSlash › Notificaciones y vuelve a pulsar.",
      checking: "Comprobando…",
      turnOn: "Recibir recordatorios",
      later: "Más tarde",
    },
    start: {
      label: "Primeros pasos",
      done: "Listo",
      close: "Cerrar primeros pasos",
      stepAdd: "Añadir una suscripción que uses",
      stepCheckIn: "Registrar los usos de este mes",
      stepReminders: "Activar recordatorios de cobro",
      allDone:
        "A partir de ahora, solo registra tus usos una vez al mes. Puedes cerrar esta tarjeta.",
      now: "Ahora",
    },
    picker: {
      title: "Elige las suscripciones que usas",
      body: "Elige solo una y calcularemos al instante el coste por uso.",
      more: "Más",
      email: "Encontrarlas todas en correos de pago",
      usage: "Buscar en el historial de uso del móvil",
      custom: "No está en la lista · Escribirla",
      paste: "Pegar un SMS de pago",
      sample: "Ver con un ejemplo",
    },
    calendar: {
      days: [
        { value: 0, label: "La mañana del día de cobro" },
        { value: 1, label: "1 día antes del cobro" },
        { value: 3, label: "3 días antes del cobro" },
        { value: 7, label: "7 días antes del cobro" },
      ],
      startFailed: "No se pudo empezar a añadir al calendario.",
      title: "Añadir días de cobro a Google Calendar",
      body: (calendar) =>
        `Creamos un calendario «${calendar}» y añadimos los días de cobro como eventos periódicos. Los demás calendarios no se tocan.`,
      loginBefore: "Necesitas ",
      login: "iniciar sesión",
      loginAfter: " para usar esto.",
      notConfigured: "Este servidor no tiene configurado el registro en Google Calendar.",
      willSyncBefore: "Días de cobro que se añadirán: ",
      willSync: (count) => `${count}`,
      undated: (count) =>
        ` · se excluye${Number(count) === 1 ? "" : "n"} ${count} suscripci${Number(count) === 1 ? "ón anual" : "ones anuales"} sin mes de cobro`,
      reminder: "Aviso del evento",
      submit: "Añadir a Google Calendar",
      nothing:
        "No hay suscripciones que añadir. Para una suscripción anual, indica el mes de cobro en su detalle.",
      notes: [
        "Los nombres, importes y días de cobro de las suscripciones se envían a Google. Nuestro servidor los guarda como máximo 10 minutos y luego los borra.",
        "Si cambiaste una suscripción, vuelve a pulsar. No se actualiza sola.",
        "Si aparece el aviso «aplicación no verificada», continúa desde «Configuración avanzada».",
      ],
      stop: (calendar) => `Para dejarlo, borra el calendario «${calendar}».`,
    },
  },
};

export const de: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name}: Abbuchung ${Number(daysBefore) === 0 ? "heute" : `in ${daysBefore} ${Number(daysBefore) === 1 ? "Tag" : "Tagen"}`}`,
      billingBody: (month, day, amount) =>
        `Am ${day}. ${monthName("de", month)} werden ${amount} abgebucht. Prüf, ob du es weiter nutzen willst.`,
      receiptTitle: (month) => `Dein Abo-Beleg für ${monthName("de", month)} ist fertig`,
      receiptBody:
        "Sieh dir an, was du letzten Monat für jedes Abo gezahlt hast und ob es sich gelohnt hat.",
      resubscribeTitle: (name) => `Zeit, ${name} noch einmal anzusehen`,
      resubscribeBody:
        "Beim Kündigen wolltest du heute erinnert werden. Schau, ob es Zeit ist, es wieder zu nutzen.",
      channelName: "Abbuchungserinnerungen",
      channelDescription: "Erinnert dich vor den Abbuchungstagen deiner Abos.",
      testTitle: "SubSlash Test-Erinnerung",
      testBody: "So sehen Erinnerungen aus. Wir erinnern dich um 9 Uhr vor dem Abbuchungstag.",
    },
    prompt: {
      close: "Schließen",
      title: "Vor Abbuchungstagen erinnern?",
      body: (name, daysBefore) =>
        `Wir erinnern dich auf diesem Handy um 9 Uhr ${Number(daysBefore) === 0 ? "am Abbuchungstag" : `${daysBefore} ${Number(daysBefore) === 1 ? "Tag" : "Tage"} vor der Abbuchung`}${name ? ` an ${name}` : ""}. Es läuft weder über einen Server noch per E-Mail, daher musst du dich nicht anmelden.`,
      whenLabel: "Wann erinnern",
      choice: (daysBefore) =>
        Number(daysBefore) === 0
          ? "Am selben Tag"
          : `${daysBefore} ${Number(daysBefore) === 1 ? "Tag" : "Tage"} vorher`,
      unknownBilling: (name) =>
        `${name} hat keinen Abbuchungstag, daher lässt sich keine Erinnerung einstellen.`,
      addBilling: "Abbuchungstag hinzufügen",
      denied:
        "Die Benachrichtigungsberechtigung ist aus. Erlaube sie unter Handy-Einstellungen › Apps › SubSlash › Benachrichtigungen und tippe dann erneut.",
      checking: "Wird geprüft…",
      turnOn: "Erinnerungen erhalten",
      later: "Später",
    },
    start: {
      label: "Erste Schritte",
      done: "Fertig",
      close: "Erste Schritte schließen",
      stepAdd: "Ein Abo eintragen, das du nutzt",
      stepCheckIn: "Nutzungen dieses Monats eingeben",
      stepReminders: "Abbuchungserinnerungen einschalten",
      allDone:
        "Ab jetzt trägst du einfach einmal im Monat deine Nutzung ein. Du kannst diese Karte schließen.",
      now: "Jetzt",
    },
    picker: {
      title: "Wähl die Abos, die du nutzt",
      body: "Wähl nur eines, und wir berechnen sofort die Kosten pro Nutzung.",
      more: "Mehr",
      email: "Alle in Zahlungs-E-Mails finden",
      usage: "Aus dem Nutzungsverlauf des Handys finden",
      custom: "Nicht in der Liste · Selbst eingeben",
      paste: "Zahlungs-SMS einfügen",
      sample: "Mit einem Beispiel ansehen",
    },
    calendar: {
      days: [
        { value: 0, label: "Am Morgen des Abbuchungstags" },
        { value: 1, label: "1 Tag vor der Abbuchung" },
        { value: 3, label: "3 Tage vor der Abbuchung" },
        { value: 7, label: "7 Tage vor der Abbuchung" },
      ],
      startFailed: "Das Hinzufügen zum Kalender konnte nicht gestartet werden.",
      title: "Abbuchungstage zu Google Kalender hinzufügen",
      body: (calendar) =>
        `Wir legen einen Kalender „${calendar}“ an und tragen die Abbuchungstage als wiederkehrende Termine ein. Andere Kalender bleiben unberührt.`,
      loginBefore: "Du musst dich ",
      login: "anmelden",
      loginAfter: ", um das zu nutzen.",
      notConfigured: "Die Eintragung in Google Kalender ist auf diesem Server nicht eingerichtet.",
      willSyncBefore: "Jetzt hinzuzufügende Abbuchungstage: ",
      willSync: (count) => `${count}`,
      undated: (count) =>
        ` · ${count} ${Number(count) === 1 ? "Jahresabo" : "Jahresabos"} ohne Abbuchungsmonat ausgelassen`,
      reminder: "Terminerinnerung",
      submit: "Zu Google Kalender hinzufügen",
      nothing:
        "Keine Abos zum Hinzufügen. Trag bei Jahresabos den Abbuchungsmonat in den Details ein.",
      notes: [
        "Namen, Beträge und Abbuchungstage der Abos werden an Google gesendet. Unser Server hält sie höchstens 10 Minuten und löscht sie dann.",
        "Wenn du ein Abo geändert hast, tippe erneut. Es aktualisiert sich nicht automatisch.",
        "Wenn eine Warnung „nicht verifizierte App“ erscheint, fahre über „Erweitert“ fort.",
      ],
      stop: (calendar) => `Zum Beenden lösch den Kalender „${calendar}“.`,
    },
  },
};

export const pt: Widen<typeof ko> = {
  reminders: {
    notify: {
      billingTitle: (name, daysBefore) =>
        `${name}: cobrança ${Number(daysBefore) === 0 ? "hoje" : `em ${daysBefore} dia${Number(daysBefore) === 1 ? "" : "s"}`}`,
      billingBody: (month, day, amount) =>
        `${amount} será cobrado em ${day} de ${monthName("pt", month)}. Veja se vai continuar usando.`,
      receiptTitle: (month) => `Seu recibo de assinaturas de ${monthName("pt", month)} está pronto`,
      receiptBody: "Veja quanto você pagou por cada assinatura no mês passado e se valeu a pena.",
      resubscribeTitle: (name) => `Hora de dar outra olhada em ${name}`,
      resubscribeBody:
        "Ao cancelar, você pediu um lembrete para hoje. Veja se é hora de usar de novo.",
      channelName: "Lembretes de cobrança",
      channelDescription: "Avisa antes dos dias de cobrança das assinaturas.",
      testTitle: "Teste de lembrete do SubSlash",
      testBody: "Os lembretes aparecem assim. Vamos avisar às 9h antes do dia de cobrança.",
    },
    prompt: {
      close: "Fechar",
      title: "Avisar antes dos dias de cobrança?",
      body: (name, daysBefore) =>
        `Vamos avisar neste celular às 9h ${Number(daysBefore) === 0 ? "no dia da cobrança" : `${daysBefore} dia${Number(daysBefore) === 1 ? "" : "s"} antes da cobrança`}${name ? ` para ${name}` : ""}. Não passa por servidor nem por e-mail, então não precisa entrar.`,
      whenLabel: "Quando avisar",
      choice: (daysBefore) =>
        Number(daysBefore) === 0
          ? "No mesmo dia"
          : `${daysBefore} dia${Number(daysBefore) === 1 ? "" : "s"} antes`,
      unknownBilling: (name) =>
        `${name} não tem data de cobrança, então não dá para criar lembrete.`,
      addBilling: "Adicionar data de cobrança",
      denied:
        "A permissão de notificações está desligada. Permita em Configurações do celular › Apps › SubSlash › Notificações e toque de novo.",
      checking: "Verificando…",
      turnOn: "Receber lembretes",
      later: "Depois",
    },
    start: {
      label: "Primeiros passos",
      done: "Tudo pronto",
      close: "Fechar primeiros passos",
      stepAdd: "Cadastrar uma assinatura que você usa",
      stepCheckIn: "Informar os usos deste mês",
      stepReminders: "Ativar lembretes de cobrança",
      allDone: "Daqui em diante, é só informar os usos uma vez por mês. Pode fechar este cartão.",
      now: "Agora",
    },
    picker: {
      title: "Escolha as assinaturas que você usa",
      body: "Escolha só uma e já calculamos o custo por uso.",
      more: "Mais",
      email: "Encontrar todas nos e-mails de pagamento",
      usage: "Buscar no histórico de uso do celular",
      custom: "Não está na lista · Digitar",
      paste: "Colar SMS de pagamento",
      sample: "Ver com um exemplo",
    },
    calendar: {
      days: [
        { value: 0, label: "Manhã do dia da cobrança" },
        { value: 1, label: "1 dia antes da cobrança" },
        { value: 3, label: "3 dias antes da cobrança" },
        { value: 7, label: "7 dias antes da cobrança" },
      ],
      startFailed: "Não foi possível começar a adicionar à agenda.",
      title: "Adicionar dias de cobrança ao Google Agenda",
      body: (calendar) =>
        `Criamos uma agenda “${calendar}” e adicionamos os dias de cobrança como eventos recorrentes. As outras agendas não são alteradas.`,
      loginBefore: "Você precisa ",
      login: "entrar",
      loginAfter: " para usar isto.",
      notConfigured: "O registro no Google Agenda não está configurado neste servidor.",
      willSyncBefore: "Dias de cobrança a adicionar agora: ",
      willSync: (count) => `${count}`,
      undated: (count) =>
        ` · ${count} assinatura${Number(count) === 1 ? " anual" : "s anuais"} sem mês de cobrança ficou${Number(count) === 1 ? "" : "aram"} de fora`.replace(
          "ficouaram",
          "ficaram",
        ),
      reminder: "Lembrete do evento",
      submit: "Adicionar ao Google Agenda",
      nothing:
        "Não há assinaturas para adicionar. Para uma assinatura anual, informe o mês de cobrança no detalhe.",
      notes: [
        "Os nomes, valores e dias de cobrança das assinaturas são enviados ao Google. Nosso servidor guarda por no máximo 10 minutos e depois apaga.",
        "Se você alterou uma assinatura, toque de novo. Não atualiza sozinho.",
        "Se aparecer o aviso “app não verificado”, continue em “Avançado”.",
      ],
      stop: (calendar) => `Para parar, apague a agenda “${calendar}”.`,
    },
  },
};
