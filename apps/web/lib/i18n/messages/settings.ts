import type { Widen } from "../types";

/** 설정 화면(SettingsScreen·SettingsList)과 그 안의 환율·기기 결제 알림 칸. */
export const ko = {
  title: "설정",
  loginOrSignup: "로그인 / 회원가입",
  storageNote: {
    app: "지금 기록은 이 폰에만 저장돼요",
    web: "지금 기록은 이 브라우저에만 저장돼요",
  },
  language: {
    title: "언어 · Language",
    system: "기기 설정 따라",
    note: "서비스 목록·요금·개인정보처리방침은 한국 기준이고, 아직 영어로 옮기지 않은 화면은 한국어로 보여요.",
  },
  exchangeRate: {
    section: "환율",
    sources: { default: "기본값", manual: "직접 입력", ecb: "ECB 고시 환율 · 자동" },
    convertedAt: (rate: string) => `USD 구독은 $1 = ₩${rate} 기준으로 환산했습니다`,
    change: "환율 변경",
    inputLabel: "USD 대비 원화 환율",
    save: "저장",
    fetching: "불러오는 중...",
    auto: "자동으로 맞추기",
    autoNote:
      "자동이면 ECB 고시 환율(영업일마다 한 번 바뀜)로 저절로 맞춰요. 직접 저장하면 그 값을 계속 쓰고 자동으로 바꾸지 않아요.",
    cancel: "취소",
    cardNote:
      "고시 환율은 카드사 청구액과 다릅니다. 카드사는 자체 수수료를 더해 청구하므로, 명세서와 맞추려면 그 금액에서 역산한 값을 직접 넣는 편이 정확합니다.",
    invalid: "1보다 크고 100,000 이하인 숫자를 입력해주세요.",
    fetchFailed: "환율을 불러오지 못했습니다. 지금 값을 그대로 사용합니다.",
  },
  info: {
    section: "정보",
    help: "도움말 · 문의",
    helpDetail: "자주 묻는 질문과 문의 메일",
    privacy: "개인정보처리방침",
  },
  /** 앱 설정의 체크인 칸(폰 사용 기록). */
  appCheckIn: {
    title: "체크인",
    connect: "폰 사용 기록 연결하기",
    connectDetail: "구독 앱을 얼마나 썼는지 재서 알아서 체크인해요",
  },
  list: {
    reminders: "알림",
    reminderTitle: "이 기기 결제 알림",
    reminderDetail: "결제일 전에 이 휴대폰으로 알려요",
    off: "꺼짐",
    on: "켜짐",
    reminderAt: (daysBefore: number) =>
      `${daysBefore === 0 ? "당일" : `${daysBefore}일 전`} 오전 9시`,
    measurement: "측정",
    usageTitle: "여러 기기 사용 측정",
    usageDetail: "기기를 오가며 쓴 구독을 이어서 세요",
    data: "데이터",
    backupTitle: "백업 · 계정 저장",
    backupSyncing: "계정과 자동으로 맞추는 중",
    backupDetail: "파일로 저장하거나 로그인해 두기",
    endDemo: "샘플 체험 끝내기",
    endDemoDetail: (count: number) => `샘플 구독 ${count}건 치우기`,
    clearAll: "전체 초기화",
    clearAllDetail: (count: number) => `구독 ${count}건과 기록 삭제`,
  },
  clear: {
    syncedWarning: "\n자동 동기화가 켜져 있어 다른 기기의 기록도 지워져요.",
    demoEnded: "샘플 체험을 끝냈어요. 내 구독은 그대로예요.",
    cleared: "구독 기록을 모두 지웠어요",
    demoTitle: "샘플 체험을 끝낼까요?",
    title: "모두 지울까요?",
    demoDescription: (count: number) => `샘플 ${count}건을 치워요.\n내 구독은 그대로예요.`,
    withKilled: (total: number, active: number, killed: number) =>
      `구독 ${total}건(구독 중 ${active}, 해지 ${killed})과\n절약 기록이 지워져요.`,
    onlyActive: (total: number) => `구독 ${total}건이 지워져요.`,
    demoConfirm: "체험 끝내기",
    confirm: "모두 삭제",
  },
  reminder: {
    title: "이 기기 결제 알림",
    intro:
      "결제일 전 오전 9시에 이 휴대폰에 알림을 띄웁니다. 매달 1일에는 지난달 구독 영수증을, 해지할 때 정한 ‘다시 살펴볼 날’에는 그 구독을 알려 드려요. 서버나 이메일을 거치지 않아 로그인하지 않아도 됩니다.",
    checking: "알림 권한을 확인하는 중…",
    onWith: (count: number) => `켜짐 · 걸어 둔 알림 ${count}개`,
    blocked: "켜 두었지만 알림 권한이 꺼져 있어 알림이 뜨지 않습니다.",
    off: "꺼짐",
    when: "언제",
    sameDay: "당일",
    daysBefore: (days: number) => `${days}일 전`,
    turnOff: "알림 끄기",
    sendTest: "시험 알림 보내기",
    turnOn: "알림 켜기",
    turnedOn: "이 기기에서 결제 알림을 켰습니다.",
    testSent: "몇 초 뒤 시험 알림이 뜹니다.",
    testFailed: "시험 알림을 보내지 못했습니다.",
    deniedHelp:
      "알림 권한이 꺼져 있어요. 휴대폰 설정에서 SubSlash의 알림을 허용한 뒤 다시 켜 주세요(안드로이드: 설정 › 애플리케이션 › SubSlash › 알림, iOS: 설정 › SubSlash › 알림).",
    unknownDates: (count: number) =>
      `결제 월을 적지 않은 연간 구독 ${count}개는 결제일을 알 수 없어 알리지 않습니다.`,
  },
};

export const en: Widen<typeof ko> = {
  title: "Settings",
  loginOrSignup: "Log in / Sign up",
  storageNote: {
    app: "Your records are saved only on this phone for now",
    web: "Your records are saved only in this browser for now",
  },
  language: {
    title: "Language",
    system: "Follow device",
    note: "The service list, prices and privacy policy are for Korea, and screens not yet translated still appear in Korean.",
  },
  exchangeRate: {
    section: "Exchange rate",
    sources: { default: "default", manual: "entered by you", ecb: "ECB reference rate · auto" },
    convertedAt: (rate) => `USD subscriptions are converted at $1 = ₩${rate}`,
    change: "Change rate",
    inputLabel: "KRW per USD",
    save: "Save",
    fetching: "Loading...",
    auto: "Update automatically",
    autoNote:
      "When automatic, it follows the ECB reference rate (updated once each business day). If you save a rate yourself, that rate stays and isn't changed automatically.",
    cancel: "Cancel",
    cardNote:
      "Reference rates differ from what your card company charges, since card companies add their own fees. To match your statement, enter the rate worked out from the charged amount.",
    invalid: "Enter a number greater than 1 and up to 100,000.",
    fetchFailed: "Couldn't load the exchange rate. The current rate is still in use.",
  },
  info: {
    section: "About",
    help: "Help & contact",
    helpDetail: "FAQ and contact email",
    privacy: "Privacy policy",
  },
  appCheckIn: {
    title: "Check-ins",
    connect: "Connect phone usage",
    connectDetail: "Measure how much you use subscription apps and check in automatically",
  },
  list: {
    reminders: "Reminders",
    reminderTitle: "Billing reminders on this device",
    reminderDetail: "Get notified on this phone before billing days",
    off: "Off",
    on: "On",
    reminderAt: (daysBefore) =>
      `${daysBefore === 0 ? "On the day" : `${daysBefore} ${daysBefore === 1 ? "day" : "days"} before`}, 9 AM`,
    measurement: "Measurement",
    usageTitle: "Usage across devices",
    usageDetail: "Count use that continues across devices as one",
    data: "Data",
    backupTitle: "Backup & account storage",
    backupSyncing: "Syncing with your account automatically",
    backupDetail: "Save to a file or log in",
    endDemo: "End sample trial",
    endDemoDetail: (count) =>
      `Clear ${count} sample ${count === 1 ? "subscription" : "subscriptions"}`,
    clearAll: "Reset everything",
    clearAllDetail: (count) =>
      `Delete ${count} ${count === 1 ? "subscription" : "subscriptions"} and their records`,
  },
  clear: {
    syncedWarning: "\nAuto sync is on, so records on your other devices will be deleted too.",
    demoEnded: "Sample trial ended. Your subscriptions are unchanged.",
    cleared: "All subscription records deleted",
    demoTitle: "End the sample trial?",
    title: "Delete everything?",
    demoDescription: (count) =>
      `${count} sample ${count === 1 ? "subscription" : "subscriptions"} will be cleared.\nYour subscriptions are unchanged.`,
    withKilled: (total, active, killed) =>
      `${total} ${total === 1 ? "subscription" : "subscriptions"} (${active} active, ${killed} cancelled)\nand your savings record will be deleted.`,
    onlyActive: (total) =>
      `${total} ${total === 1 ? "subscription" : "subscriptions"} will be deleted.`,
    demoConfirm: "End trial",
    confirm: "Delete all",
  },
  reminder: {
    title: "Billing reminders on this device",
    intro:
      "Shows a notification on this phone at 9 AM before each billing day. On the 1st of each month you'll get last month's subscription receipt, and on the ‘check again’ date you set when cancelling, a reminder about that subscription. Nothing goes through a server or email, so you don't need to log in.",
    checking: "Checking notification permission…",
    onWith: (count) => `On · ${count} ${count === 1 ? "reminder" : "reminders"} scheduled`,
    blocked: "Turned on, but notifications are blocked, so no reminders will appear.",
    off: "Off",
    when: "When",
    sameDay: "On the day",
    daysBefore: (days) => `${days} ${days === 1 ? "day" : "days"} before`,
    turnOff: "Turn off",
    sendTest: "Send a test reminder",
    turnOn: "Turn on reminders",
    turnedOn: "Billing reminders are on for this device.",
    testSent: "A test reminder will appear in a few seconds.",
    testFailed: "Couldn't send the test reminder.",
    deniedHelp:
      "Notifications are blocked. Allow notifications for SubSlash in your phone settings, then turn this on again (Android: Settings › Apps › SubSlash › Notifications, iOS: Settings › SubSlash › Notifications).",
    unknownDates: (count) =>
      `${count} yearly ${count === 1 ? "subscription has" : "subscriptions have"} no billing month set, so ${count === 1 ? "its" : "their"} billing date is unknown and no reminder is sent.`,
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta). language.note는 이 언어가 베타라는 것까지 알린다.
const stPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  title: "设置",
  loginOrSignup: "登录 / 注册",
  storageNote: { app: "目前记录只保存在这部手机上", web: "目前记录只保存在这个浏览器中" },
  language: {
    title: "语言 · Language",
    system: "跟随设备",
    note: "中文是测试版翻译，尚未经母语人士审校。服务列表、价格和隐私政策以韩国为准；退订指南和价格说明保留韩语原文，隐私政策显示英文版。",
  },
  exchangeRate: {
    section: "汇率",
    sources: { default: "默认值", manual: "手动输入", ecb: "ECB 参考汇率 · 自动" },
    convertedAt: (rate) => `美元订阅按 $1 = ₩${rate} 换算`,
    change: "修改汇率",
    inputLabel: "1 美元兑韩元汇率",
    save: "保存",
    fetching: "加载中...",
    auto: "自动更新",
    autoNote:
      "自动时会按 ECB 参考汇率（每个工作日更新一次）自动调整。手动保存后会一直使用该值，不会自动更改。",
    cancel: "取消",
    cardNote:
      "参考汇率与发卡机构的扣款金额不同。发卡机构会另加手续费，要与账单一致，最好输入根据扣款金额反推的汇率。",
    invalid: "请输入大于 1 且不超过 100,000 的数字。",
    fetchFailed: "无法载入汇率。仍在使用当前汇率。",
  },
  info: {
    section: "信息",
    help: "帮助与咨询",
    helpDetail: "常见问题和咨询邮箱",
    privacy: "隐私政策",
  },
  appCheckIn: {
    title: "签到",
    connect: "连接手机使用记录",
    connectDetail: "测量订阅应用的使用情况并自动签到",
  },
  list: {
    reminders: "提醒",
    reminderTitle: "本设备扣款提醒",
    reminderDetail: "在扣款日前通过这部手机提醒",
    off: "关闭",
    on: "开启",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "当天" : `${daysBefore} 天前`}上午 9 点`,
    measurement: "测量",
    usageTitle: "多设备使用测量",
    usageDetail: "跨设备接着用的部分算作一次",
    data: "数据",
    backupTitle: "备份与账户保存",
    backupSyncing: "正在自动与账户同步",
    backupDetail: "保存为文件或登录",
    endDemo: "结束示例体验",
    endDemoDetail: (count) => `清除 ${count} 个示例订阅`,
    clearAll: "全部重置",
    clearAllDetail: (count) => `删除 ${count} 个订阅及其记录`,
  },
  clear: {
    syncedWarning: "\n自动同步已开启，其他设备上的记录也会被删除。",
    demoEnded: "示例体验已结束。你的订阅没有改变。",
    cleared: "已删除所有订阅记录",
    demoTitle: "结束示例体验吗？",
    title: "要全部删除吗？",
    demoDescription: (count) => `将清除 ${count} 个示例订阅。\n你的订阅不会改变。`,
    withKilled: (total, active, killed) =>
      `将删除 ${total} 个订阅（订阅中 ${active} 个，已退订 ${killed} 个）\n以及节省记录。`,
    onlyActive: (total) => `将删除 ${total} 个订阅。`,
    demoConfirm: "结束体验",
    confirm: "全部删除",
  },
  reminder: {
    title: "本设备扣款提醒",
    intro:
      "在每个扣款日前的上午 9 点在这部手机上显示通知。每月 1 日会收到上个月的订阅小票，退订时设置的“再次查看”日期也会提醒你。不经过服务器或邮件，所以不需要登录。",
    checking: "正在确认通知权限…",
    onWith: (count) => `已开启 · 已安排 ${count} 条提醒`,
    blocked: "已开启，但通知被阻止，所以不会显示提醒。",
    off: "关闭",
    when: "时间",
    sameDay: "当天",
    daysBefore: (days) => `${days} 天前`,
    turnOff: "关闭",
    sendTest: "发送测试提醒",
    turnOn: "开启提醒",
    turnedOn: "已为这台设备开启扣款提醒。",
    testSent: "测试提醒会在几秒后出现。",
    testFailed: "无法发送测试提醒。",
    deniedHelp:
      "通知被阻止。请在手机设置中允许 SubSlash 的通知后重新开启（Android：设置 › 应用 › SubSlash › 通知，iOS：设置 › SubSlash › 通知）。",
    unknownDates: (count) => `${count} 个年付订阅没有设置扣款月份，扣款日不明，因此不会发送提醒。`,
  },
};

export const ja: Widen<typeof ko> = {
  title: "設定",
  loginOrSignup: "ログイン / 会員登録",
  storageNote: {
    app: "今の記録はこのスマホにだけ保存されています",
    web: "今の記録はこのブラウザにだけ保存されています",
  },
  language: {
    title: "言語 · Language",
    system: "端末に合わせる",
    note: "日本語はネイティブのチェック前のベータ版翻訳です。サービス一覧・料金・プライバシーポリシーは韓国基準で、解約ガイドと料金の説明は韓国語の原文のまま、プライバシーポリシーは英語版を表示します。",
  },
  exchangeRate: {
    section: "為替レート",
    sources: { default: "初期値", manual: "手動入力", ecb: "ECB 参照レート · 自動" },
    convertedAt: (rate) => `ドルのサブスクは $1 = ₩${rate} で換算しました`,
    change: "レートを変更",
    inputLabel: "1 ドルあたりのウォン",
    save: "保存",
    fetching: "読み込み中...",
    auto: "自動で合わせる",
    autoNote:
      "自動にすると ECB 参照レート（営業日ごとに 1 回更新）に合わせます。自分で保存した値はそのまま使い、自動では変えません。",
    cancel: "キャンセル",
    cardNote:
      "参照レートはカード会社の請求額と違います。カード会社は独自の手数料を加えるので、明細と合わせるには請求額から逆算した値を入れるのが正確です。",
    invalid: "1 より大きく 100,000 以下の数字を入力してください。",
    fetchFailed: "為替レートを読み込めませんでした。今のレートを使い続けます。",
  },
  info: {
    section: "情報",
    help: "ヘルプ・お問い合わせ",
    helpDetail: "よくある質問と問い合わせメール",
    privacy: "プライバシーポリシー",
  },
  appCheckIn: {
    title: "チェックイン",
    connect: "スマホの利用記録をつなぐ",
    connectDetail: "サブスクアプリの利用を測って自動でチェックイン",
  },
  list: {
    reminders: "通知",
    reminderTitle: "この端末の支払い通知",
    reminderDetail: "支払日の前にこのスマホでお知らせ",
    off: "オフ",
    on: "オン",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "当日" : `${daysBefore} 日前`} 午前 9 時`,
    measurement: "測定",
    usageTitle: "複数端末の利用測定",
    usageDetail: "端末をまたいで続けて使った分を 1 回と数える",
    data: "データ",
    backupTitle: "バックアップ・アカウント保存",
    backupSyncing: "アカウントと自動で同期中",
    backupDetail: "ファイルに保存するかログイン",
    endDemo: "サンプル体験を終える",
    endDemoDetail: (count) => `サンプルのサブスク ${count} 件を消去`,
    clearAll: "すべてリセット",
    clearAllDetail: (count) => `サブスク ${count} 件と記録を削除`,
  },
  clear: {
    syncedWarning: "\n自動同期がオンなので、ほかの端末の記録も削除されます。",
    demoEnded: "サンプル体験を終えました。あなたのサブスクはそのままです。",
    cleared: "すべてのサブスクの記録を削除しました",
    demoTitle: "サンプル体験を終えますか？",
    title: "すべて削除しますか？",
    demoDescription: (count) =>
      `サンプルのサブスク ${count} 件を消去します。\nあなたのサブスクは変わりません。`,
    withKilled: (total, active, killed) =>
      `サブスク ${total} 件（契約中 ${active} 件、解約 ${killed} 件）\nと節約の記録が削除されます。`,
    onlyActive: (total) => `サブスク ${total} 件が削除されます。`,
    demoConfirm: "体験を終える",
    confirm: "すべて削除",
  },
  reminder: {
    title: "この端末の支払い通知",
    intro:
      "各支払日の前の午前 9 時にこのスマホに通知を表示します。毎月 1 日には先月のサブスクのレシート、解約時に決めた「見直す日」にはそのサブスクのお知らせも届きます。サーバーやメールを通さないので、ログインは不要です。",
    checking: "通知の権限を確認中…",
    onWith: (count) => `オン · 通知 ${count} 件を予定`,
    blocked: "オンにしましたが、通知がブロックされているため表示されません。",
    off: "オフ",
    when: "タイミング",
    sameDay: "当日",
    daysBefore: (days) => `${days} 日前`,
    turnOff: "オフにする",
    sendTest: "テスト通知を送る",
    turnOn: "通知をオンにする",
    turnedOn: "この端末の支払い通知をオンにしました。",
    testSent: "数秒後にテスト通知が表示されます。",
    testFailed: "テスト通知を送れませんでした。",
    deniedHelp:
      "通知がブロックされています。スマホの設定で SubSlash の通知を許可してから、もう一度オンにしてください（Android: 設定 › アプリ › SubSlash › 通知、iOS: 設定 › SubSlash › 通知）。",
    unknownDates: (count) =>
      `年払いのサブスク ${count} 件は支払月が未設定で支払日がわからないため、通知を送りません。`,
  },
};

export const vi: Widen<typeof ko> = {
  title: "Cài đặt",
  loginOrSignup: "Đăng nhập / Đăng ký",
  storageNote: {
    app: "Hiện dữ liệu chỉ được lưu trên điện thoại này",
    web: "Hiện dữ liệu chỉ được lưu trong trình duyệt này",
  },
  language: {
    title: "Ngôn ngữ · Language",
    system: "Theo thiết bị",
    note: "Tiếng Việt là bản dịch thử nghiệm (beta), chưa được người bản ngữ kiểm tra. Danh sách dịch vụ, giá và chính sách quyền riêng tư theo tiêu chuẩn Hàn Quốc; hướng dẫn hủy và ghi chú giá giữ nguyên bản tiếng Hàn, chính sách quyền riêng tư hiển thị bản tiếng Anh.",
  },
  exchangeRate: {
    section: "Tỷ giá",
    sources: { default: "mặc định", manual: "tự nhập", ecb: "tỷ giá tham chiếu ECB · tự động" },
    convertedAt: (rate) => `Gói tính bằng USD được quy đổi theo $1 = ₩${rate}`,
    change: "Đổi tỷ giá",
    inputLabel: "Số won cho 1 USD",
    save: "Lưu",
    fetching: "Đang tải...",
    auto: "Tự động cập nhật",
    autoNote:
      "Khi tự động, tỷ giá theo tỷ giá tham chiếu ECB (cập nhật mỗi ngày làm việc). Nếu bạn tự lưu tỷ giá, giá trị đó được giữ nguyên và không tự đổi.",
    cancel: "Hủy",
    cardNote:
      "Tỷ giá tham chiếu khác với số tiền ngân hàng phát hành thẻ trừ, vì họ cộng thêm phí riêng. Để khớp sao kê, hãy nhập tỷ giá tính ngược từ số tiền đã bị trừ.",
    invalid: "Nhập số lớn hơn 1 và không quá 100.000.",
    fetchFailed: "Không tải được tỷ giá. Vẫn dùng tỷ giá hiện tại.",
  },
  info: {
    section: "Thông tin",
    help: "Trợ giúp & liên hệ",
    helpDetail: "Câu hỏi thường gặp và email liên hệ",
    privacy: "Chính sách quyền riêng tư",
  },
  appCheckIn: {
    title: "Check-in",
    connect: "Kết nối dữ liệu sử dụng điện thoại",
    connectDetail: "Đo mức dùng ứng dụng đăng ký và tự động check-in",
  },
  list: {
    reminders: "Nhắc nhở",
    reminderTitle: "Nhắc thanh toán trên thiết bị này",
    reminderDetail: "Thông báo trên điện thoại này trước ngày thanh toán",
    off: "Tắt",
    on: "Bật",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "Cùng ngày" : `${daysBefore} ngày trước`}, 9 giờ sáng`,
    measurement: "Đo lường",
    usageTitle: "Mức sử dụng trên nhiều thiết bị",
    usageDetail: "Việc dùng tiếp qua nhiều thiết bị được tính là một",
    data: "Dữ liệu",
    backupTitle: "Sao lưu & lưu vào tài khoản",
    backupSyncing: "Đang tự động đồng bộ với tài khoản",
    backupDetail: "Lưu thành tệp hoặc đăng nhập",
    endDemo: "Kết thúc dùng thử",
    endDemoDetail: (count) => `Xóa ${count} gói mẫu`,
    clearAll: "Đặt lại tất cả",
    clearAllDetail: (count) => `Xóa ${count} gói và dữ liệu liên quan`,
  },
  clear: {
    syncedWarning: "\nĐồng bộ tự động đang bật nên dữ liệu trên các thiết bị khác cũng sẽ bị xóa.",
    demoEnded: "Đã kết thúc dùng thử. Gói đăng ký của bạn không thay đổi.",
    cleared: "Đã xóa toàn bộ dữ liệu đăng ký",
    demoTitle: "Kết thúc dùng thử?",
    title: "Xóa tất cả?",
    demoDescription: (count) => `${count} gói mẫu sẽ bị xóa.\nGói đăng ký của bạn không thay đổi.`,
    withKilled: (total, active, killed) =>
      `${total} gói (${active} đang dùng, ${killed} đã hủy)\nvà dữ liệu tiết kiệm sẽ bị xóa.`,
    onlyActive: (total) => `${total} gói sẽ bị xóa.`,
    demoConfirm: "Kết thúc dùng thử",
    confirm: "Xóa tất cả",
  },
  reminder: {
    title: "Nhắc thanh toán trên thiết bị này",
    intro:
      "Hiển thị thông báo trên điện thoại này lúc 9 giờ sáng trước mỗi ngày thanh toán. Ngày 1 hằng tháng bạn nhận hóa đơn gói đăng ký tháng trước, và vào ngày “xem lại” đặt khi hủy, bạn nhận lời nhắc về gói đó. Không qua máy chủ hay email nên không cần đăng nhập.",
    checking: "Đang kiểm tra quyền thông báo…",
    onWith: (count) => `Đang bật · đã lên lịch ${count} lời nhắc`,
    blocked: "Đã bật, nhưng thông báo bị chặn nên sẽ không hiện lời nhắc.",
    off: "Tắt",
    when: "Thời điểm",
    sameDay: "Cùng ngày",
    daysBefore: (days) => `${days} ngày trước`,
    turnOff: "Tắt",
    sendTest: "Gửi lời nhắc thử",
    turnOn: "Bật nhắc nhở",
    turnedOn: "Đã bật nhắc thanh toán cho thiết bị này.",
    testSent: "Lời nhắc thử sẽ hiện sau vài giây.",
    testFailed: "Không gửi được lời nhắc thử.",
    deniedHelp:
      "Thông báo đang bị chặn. Hãy cho phép thông báo của SubSlash trong cài đặt điện thoại rồi bật lại (Android: Cài đặt › Ứng dụng › SubSlash › Thông báo, iOS: Cài đặt › SubSlash › Thông báo).",
    unknownDates: (count) =>
      `${count} gói trả theo năm chưa đặt tháng thanh toán nên không rõ ngày thanh toán và sẽ không có lời nhắc.`,
  },
};

export const fr: Widen<typeof ko> = {
  title: "Réglages",
  loginOrSignup: "Connexion / Inscription",
  storageNote: {
    app: "Pour l'instant, vos données ne sont enregistrées que sur ce téléphone",
    web: "Pour l'instant, vos données ne sont enregistrées que dans ce navigateur",
  },
  language: {
    title: "Langue · Language",
    system: "Suivre l'appareil",
    note: "Le français est une traduction bêta, pas encore relue par un locuteur natif. La liste des services, les prix et la politique de confidentialité sont ceux de la Corée ; les guides de résiliation et notes de prix restent en coréen original, et la politique de confidentialité s'affiche en anglais.",
  },
  exchangeRate: {
    section: "Taux de change",
    sources: {
      default: "par défaut",
      manual: "saisi par vous",
      ecb: "taux de référence BCE · auto",
    },
    convertedAt: (rate) => `Les abonnements en USD sont convertis à 1 $ = ₩${rate}`,
    change: "Changer le taux",
    inputLabel: "Wons pour 1 USD",
    save: "Enregistrer",
    fetching: "Chargement...",
    auto: "Mettre à jour automatiquement",
    autoNote:
      "En automatique, le taux suit le taux de référence de la BCE (mis à jour chaque jour ouvré). Si vous enregistrez un taux vous-même, il est conservé et n'est pas modifié automatiquement.",
    cancel: "Annuler",
    cardNote:
      "Les taux de référence diffèrent de ce que facture votre banque, qui ajoute ses propres frais. Pour correspondre à votre relevé, saisissez le taux calculé à partir du montant débité.",
    invalid: "Saisissez un nombre supérieur à 1 et jusqu'à 100 000.",
    fetchFailed: "Impossible de charger le taux de change. Le taux actuel reste utilisé.",
  },
  info: {
    section: "À propos",
    help: "Aide et contact",
    helpDetail: "FAQ et e-mail de contact",
    privacy: "Politique de confidentialité",
  },
  appCheckIn: {
    title: "Check-ins",
    connect: "Connecter l'utilisation du téléphone",
    connectDetail:
      "Mesurer l'utilisation des applis d'abonnement et faire le check-in automatiquement",
  },
  list: {
    reminders: "Rappels",
    reminderTitle: "Rappels de paiement sur cet appareil",
    reminderDetail: "Être prévenu sur ce téléphone avant les jours de paiement",
    off: "Désactivé",
    on: "Activé",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "Le jour même" : `${daysBefore} jour${stPl(daysBefore, "", "s")} avant`}, 9 h`,
    measurement: "Mesure",
    usageTitle: "Utilisation sur plusieurs appareils",
    usageDetail: "Compter une seule fois l'utilisation poursuivie d'un appareil à l'autre",
    data: "Données",
    backupTitle: "Sauvegarde et compte",
    backupSyncing: "Synchronisation automatique avec votre compte",
    backupDetail: "Enregistrer un fichier ou se connecter",
    endDemo: "Terminer l'essai",
    endDemoDetail: (count) =>
      `Effacer ${count} ${stPl(count, "abonnement d'exemple", "abonnements d'exemple")}`,
    clearAll: "Tout réinitialiser",
    clearAllDetail: (count) =>
      `Supprimer ${count} ${stPl(count, "abonnement", "abonnements")} et leurs données`,
  },
  clear: {
    syncedWarning:
      "\nLa synchronisation automatique est activée : les données de vos autres appareils seront aussi supprimées.",
    demoEnded: "Essai terminé. Vos abonnements sont inchangés.",
    cleared: "Toutes les données d'abonnement ont été supprimées",
    demoTitle: "Terminer l'essai ?",
    title: "Tout supprimer ?",
    demoDescription: (count) =>
      `${count} ${stPl(count, "abonnement d'exemple sera effacé", "abonnements d'exemple seront effacés")}.\nVos abonnements sont inchangés.`,
    withKilled: (total, active, killed) =>
      `${total} ${stPl(total, "abonnement", "abonnements")} (${active} actif${stPl(active, "", "s")}, ${killed} résilié${stPl(killed, "", "s")})\net votre historique d'économies seront supprimés.`,
    onlyActive: (total) =>
      `${total} ${stPl(total, "abonnement sera supprimé", "abonnements seront supprimés")}.`,
    demoConfirm: "Terminer l'essai",
    confirm: "Tout supprimer",
  },
  reminder: {
    title: "Rappels de paiement sur cet appareil",
    intro:
      "Affiche une notification sur ce téléphone à 9 h avant chaque jour de paiement. Le 1er de chaque mois, vous recevez le ticket d'abonnements du mois précédent, et à la date « à revoir » choisie lors d'une résiliation, un rappel pour cet abonnement. Rien ne passe par un serveur ni par e-mail : pas besoin de se connecter.",
    checking: "Vérification de l'autorisation de notification…",
    onWith: (count) =>
      `Activé · ${count} rappel${stPl(count, "", "s")} programmé${stPl(count, "", "s")}`,
    blocked: "Activé, mais les notifications sont bloquées : aucun rappel ne s'affichera.",
    off: "Désactivé",
    when: "Quand",
    sameDay: "Le jour même",
    daysBefore: (days) => `${days} jour${stPl(days, "", "s")} avant`,
    turnOff: "Désactiver",
    sendTest: "Envoyer un rappel de test",
    turnOn: "Activer les rappels",
    turnedOn: "Les rappels de paiement sont activés sur cet appareil.",
    testSent: "Un rappel de test apparaîtra dans quelques secondes.",
    testFailed: "Impossible d'envoyer le rappel de test.",
    deniedHelp:
      "Les notifications sont bloquées. Autorisez les notifications de SubSlash dans les réglages du téléphone, puis réactivez (Android : Réglages › Applications › SubSlash › Notifications, iOS : Réglages › SubSlash › Notifications).",
    unknownDates: (count) =>
      `${count} ${stPl(count, "abonnement annuel n'a", "abonnements annuels n'ont")} pas de mois de paiement : la date est inconnue et aucun rappel n'est envoyé.`,
  },
};

export const es: Widen<typeof ko> = {
  title: "Ajustes",
  loginOrSignup: "Iniciar sesión / Registrarse",
  storageNote: {
    app: "Por ahora tus registros solo se guardan en este móvil",
    web: "Por ahora tus registros solo se guardan en este navegador",
  },
  language: {
    title: "Idioma · Language",
    system: "Según el dispositivo",
    note: "El español es una traducción beta, aún sin revisar por un hablante nativo. La lista de servicios, los precios y la política de privacidad son de Corea; las guías de cancelación y notas de precio siguen en coreano original, y la política de privacidad se muestra en inglés.",
  },
  exchangeRate: {
    section: "Tipo de cambio",
    sources: {
      default: "predeterminado",
      manual: "introducido por ti",
      ecb: "tipo de referencia del BCE · automático",
    },
    convertedAt: (rate) => `Las suscripciones en USD se convierten a 1 $ = ₩${rate}`,
    change: "Cambiar tipo",
    inputLabel: "Wones por 1 USD",
    save: "Guardar",
    fetching: "Cargando...",
    auto: "Actualizar automáticamente",
    autoNote:
      "En automático sigue el tipo de referencia del BCE (se actualiza cada día hábil). Si guardas un tipo tú mismo, se mantiene y no cambia solo.",
    cancel: "Cancelar",
    cardNote:
      "Los tipos de referencia difieren de lo que cobra tu banco, que añade sus propias comisiones. Para que coincida con tu extracto, introduce el tipo calculado a partir del importe cobrado.",
    invalid: "Introduce un número mayor que 1 y hasta 100.000.",
    fetchFailed: "No se pudo cargar el tipo de cambio. Se sigue usando el actual.",
  },
  info: {
    section: "Información",
    help: "Ayuda y contacto",
    helpDetail: "Preguntas frecuentes y correo de contacto",
    privacy: "Política de privacidad",
  },
  appCheckIn: {
    title: "Registros",
    connect: "Conectar el uso del móvil",
    connectDetail: "Mide el uso de las apps de suscripción y registra automáticamente",
  },
  list: {
    reminders: "Recordatorios",
    reminderTitle: "Recordatorios de cobro en este dispositivo",
    reminderDetail: "Avisos en este móvil antes de los días de cobro",
    off: "Desactivado",
    on: "Activado",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "El mismo día" : `${daysBefore} día${stPl(daysBefore, "", "s")} antes`}, 9:00`,
    measurement: "Medición",
    usageTitle: "Uso en varios dispositivos",
    usageDetail: "Contar una vez el uso que sigue entre dispositivos",
    data: "Datos",
    backupTitle: "Copia y cuenta",
    backupSyncing: "Sincronizando con tu cuenta automáticamente",
    backupDetail: "Guardar en un archivo o iniciar sesión",
    endDemo: "Terminar prueba con ejemplo",
    endDemoDetail: (count) =>
      `Borrar ${count} ${stPl(count, "suscripción de ejemplo", "suscripciones de ejemplo")}`,
    clearAll: "Restablecer todo",
    clearAllDetail: (count) =>
      `Borrar ${count} ${stPl(count, "suscripción", "suscripciones")} y sus registros`,
  },
  clear: {
    syncedWarning:
      "\nLa sincronización automática está activada, así que también se borrarán los registros de tus otros dispositivos.",
    demoEnded: "Prueba terminada. Tus suscripciones no cambian.",
    cleared: "Se borraron todos los registros de suscripciones",
    demoTitle: "¿Terminar la prueba con ejemplo?",
    title: "¿Borrar todo?",
    demoDescription: (count) =>
      `Se borrará${stPl(count, "", "n")} ${count} ${stPl(count, "suscripción de ejemplo", "suscripciones de ejemplo")}.\nTus suscripciones no cambian.`,
    withKilled: (total, active, killed) =>
      `Se borrarán ${total} ${stPl(total, "suscripción", "suscripciones")} (${active} activa${stPl(active, "", "s")}, ${killed} cancelada${stPl(killed, "", "s")})\ny tu historial de ahorro.`,
    onlyActive: (total) =>
      `Se borrará${stPl(total, "", "n")} ${total} ${stPl(total, "suscripción", "suscripciones")}.`,
    demoConfirm: "Terminar prueba",
    confirm: "Borrar todo",
  },
  reminder: {
    title: "Recordatorios de cobro en este dispositivo",
    intro:
      "Muestra una notificación en este móvil a las 9:00 antes de cada día de cobro. El día 1 de cada mes recibes el ticket de suscripciones del mes anterior, y en la fecha de «volver a revisar» que fijaste al cancelar, un aviso sobre esa suscripción. No pasa por un servidor ni por correo, así que no hace falta iniciar sesión.",
    checking: "Comprobando el permiso de notificaciones…",
    onWith: (count) =>
      `Activado · ${count} recordatorio${stPl(count, "", "s")} programado${stPl(count, "", "s")}`,
    blocked:
      "Activado, pero las notificaciones están bloqueadas, así que no aparecerán recordatorios.",
    off: "Desactivado",
    when: "Cuándo",
    sameDay: "El mismo día",
    daysBefore: (days) => `${days} día${stPl(days, "", "s")} antes`,
    turnOff: "Desactivar",
    sendTest: "Enviar recordatorio de prueba",
    turnOn: "Activar recordatorios",
    turnedOn: "Los recordatorios de cobro están activados en este dispositivo.",
    testSent: "Un recordatorio de prueba aparecerá en unos segundos.",
    testFailed: "No se pudo enviar el recordatorio de prueba.",
    deniedHelp:
      "Las notificaciones están bloqueadas. Permite las notificaciones de SubSlash en los ajustes del móvil y vuelve a activarlo (Android: Ajustes › Aplicaciones › SubSlash › Notificaciones; iOS: Ajustes › SubSlash › Notificaciones).",
    unknownDates: (count) =>
      `${count} ${stPl(count, "suscripción anual no tiene", "suscripciones anuales no tienen")} mes de cobro, así que la fecha se desconoce y no se envía recordatorio.`,
  },
};

export const de: Widen<typeof ko> = {
  title: "Einstellungen",
  loginOrSignup: "Anmelden / Registrieren",
  storageNote: {
    app: "Deine Daten sind derzeit nur auf diesem Handy gespeichert",
    web: "Deine Daten sind derzeit nur in diesem Browser gespeichert",
  },
  language: {
    title: "Sprache · Language",
    system: "Wie das Gerät",
    note: "Deutsch ist eine Beta-Übersetzung, noch nicht von Muttersprachlern geprüft. Dienstliste, Preise und Datenschutzerklärung gelten für Korea; Kündigungsanleitungen und Preishinweise bleiben im koreanischen Original, die Datenschutzerklärung wird auf Englisch angezeigt.",
  },
  exchangeRate: {
    section: "Wechselkurs",
    sources: {
      default: "Standard",
      manual: "selbst eingegeben",
      ecb: "EZB-Referenzkurs · automatisch",
    },
    convertedAt: (rate) => `USD-Abos werden zu $1 = ₩${rate} umgerechnet`,
    change: "Kurs ändern",
    inputLabel: "Won pro 1 USD",
    save: "Speichern",
    fetching: "Wird geladen...",
    auto: "Automatisch anpassen",
    autoNote:
      "Automatisch folgt der Kurs dem EZB-Referenzkurs (einmal pro Werktag aktualisiert). Speicherst du selbst einen Kurs, bleibt er und wird nicht automatisch geändert.",
    cancel: "Abbrechen",
    cardNote:
      "Referenzkurse weichen von dem ab, was deine Kartenfirma abrechnet, da sie eigene Gebühren aufschlägt. Damit es zur Abrechnung passt, gib den aus dem abgebuchten Betrag errechneten Kurs ein.",
    invalid: "Gib eine Zahl größer als 1 und bis 100.000 ein.",
    fetchFailed:
      "Der Wechselkurs konnte nicht geladen werden. Der aktuelle Kurs bleibt in Gebrauch.",
  },
  info: {
    section: "Info",
    help: "Hilfe & Kontakt",
    helpDetail: "FAQ und Kontakt-E-Mail",
    privacy: "Datenschutzerklärung",
  },
  appCheckIn: {
    title: "Einträge",
    connect: "Handynutzung verbinden",
    connectDetail: "Nutzung von Abo-Apps messen und automatisch eintragen",
  },
  list: {
    reminders: "Erinnerungen",
    reminderTitle: "Abbuchungserinnerungen auf diesem Gerät",
    reminderDetail: "Vor Abbuchungstagen auf diesem Handy benachrichtigen",
    off: "Aus",
    on: "An",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "Am selben Tag" : `${daysBefore} ${stPl(daysBefore, "Tag", "Tage")} vorher`}, 9 Uhr`,
    measurement: "Messung",
    usageTitle: "Nutzung über mehrere Geräte",
    usageDetail: "Geräteübergreifende Nutzung als eine zählen",
    data: "Daten",
    backupTitle: "Sicherung & Konto",
    backupSyncing: "Automatische Synchronisierung mit deinem Konto",
    backupDetail: "In eine Datei speichern oder anmelden",
    endDemo: "Test mit Beispieldaten beenden",
    endDemoDetail: (count) => `${count} ${stPl(count, "Beispiel-Abo", "Beispiel-Abos")} entfernen`,
    clearAll: "Alles zurücksetzen",
    clearAllDetail: (count) => `${count} ${stPl(count, "Abo", "Abos")} und die Einträge löschen`,
  },
  clear: {
    syncedWarning:
      "\nDie automatische Synchronisierung ist an, daher werden auch die Daten auf deinen anderen Geräten gelöscht.",
    demoEnded: "Test beendet. Deine Abos sind unverändert.",
    cleared: "Alle Abo-Daten gelöscht",
    demoTitle: "Test mit Beispieldaten beenden?",
    title: "Alles löschen?",
    demoDescription: (count) =>
      `${count} ${stPl(count, "Beispiel-Abo wird", "Beispiel-Abos werden")} entfernt.\nDeine Abos bleiben unverändert.`,
    withKilled: (total, active, killed) =>
      `${total} ${stPl(total, "Abo", "Abos")} (${active} aktiv, ${killed} gekündigt)\nund deine Ersparnis-Einträge werden gelöscht.`,
    onlyActive: (total) => `${total} ${stPl(total, "Abo wird", "Abos werden")} gelöscht.`,
    demoConfirm: "Test beenden",
    confirm: "Alles löschen",
  },
  reminder: {
    title: "Abbuchungserinnerungen auf diesem Gerät",
    intro:
      "Zeigt auf diesem Handy um 9 Uhr vor jedem Abbuchungstag eine Benachrichtigung. Am 1. jedes Monats bekommst du den Abo-Beleg des Vormonats, und am beim Kündigen festgelegten Tag zum erneuten Ansehen eine Erinnerung zu diesem Abo. Nichts läuft über einen Server oder per E-Mail, daher musst du dich nicht anmelden.",
    checking: "Benachrichtigungsberechtigung wird geprüft…",
    onWith: (count) => `An · ${count} ${stPl(count, "Erinnerung", "Erinnerungen")} geplant`,
    blocked:
      "Eingeschaltet, aber Benachrichtigungen sind blockiert, daher erscheinen keine Erinnerungen.",
    off: "Aus",
    when: "Wann",
    sameDay: "Am selben Tag",
    daysBefore: (days) => `${days} ${stPl(days, "Tag", "Tage")} vorher`,
    turnOff: "Ausschalten",
    sendTest: "Test-Erinnerung senden",
    turnOn: "Erinnerungen einschalten",
    turnedOn: "Abbuchungserinnerungen sind auf diesem Gerät eingeschaltet.",
    testSent: "Eine Test-Erinnerung erscheint in wenigen Sekunden.",
    testFailed: "Die Test-Erinnerung konnte nicht gesendet werden.",
    deniedHelp:
      "Benachrichtigungen sind blockiert. Erlaube in den Handy-Einstellungen Benachrichtigungen für SubSlash und schalte es dann erneut ein (Android: Einstellungen › Apps › SubSlash › Benachrichtigungen, iOS: Einstellungen › SubSlash › Mitteilungen).",
    unknownDates: (count) =>
      `${count} ${stPl(count, "Jahresabo hat", "Jahresabos haben")} keinen Abbuchungsmonat, daher ist der Termin unbekannt und es kommt keine Erinnerung.`,
  },
};

export const pt: Widen<typeof ko> = {
  title: "Configurações",
  loginOrSignup: "Entrar / Cadastrar",
  storageNote: {
    app: "Por enquanto seus registros ficam só neste celular",
    web: "Por enquanto seus registros ficam só neste navegador",
  },
  language: {
    title: "Idioma · Language",
    system: "Seguir o dispositivo",
    note: "O português é uma tradução beta, ainda não revisada por um falante nativo. A lista de serviços, os preços e a política de privacidade são da Coreia; os guias de cancelamento e notas de preço ficam no coreano original, e a política de privacidade aparece em inglês.",
  },
  exchangeRate: {
    section: "Câmbio",
    sources: {
      default: "padrão",
      manual: "informado por você",
      ecb: "taxa de referência do BCE · automático",
    },
    convertedAt: (rate) => `Assinaturas em USD são convertidas a US$ 1 = ₩${rate}`,
    change: "Mudar taxa",
    inputLabel: "Wons por 1 USD",
    save: "Salvar",
    fetching: "Carregando...",
    auto: "Atualizar automaticamente",
    autoNote:
      "No automático, segue a taxa de referência do BCE (atualizada uma vez por dia útil). Se você salvar uma taxa, ela fica e não muda sozinha.",
    cancel: "Cancelar",
    cardNote:
      "As taxas de referência diferem do que a operadora do cartão cobra, porque ela acrescenta tarifas próprias. Para bater com a fatura, informe a taxa calculada a partir do valor cobrado.",
    invalid: "Informe um número maior que 1 e até 100.000.",
    fetchFailed: "Não foi possível carregar o câmbio. A taxa atual continua em uso.",
  },
  info: {
    section: "Sobre",
    help: "Ajuda e contato",
    helpDetail: "Perguntas frequentes e e-mail de contato",
    privacy: "Política de privacidade",
  },
  appCheckIn: {
    title: "Registros",
    connect: "Conectar uso do celular",
    connectDetail: "Medir o uso dos apps de assinatura e registrar automaticamente",
  },
  list: {
    reminders: "Lembretes",
    reminderTitle: "Lembretes de cobrança neste dispositivo",
    reminderDetail: "Avisos neste celular antes dos dias de cobrança",
    off: "Desligado",
    on: "Ligado",
    reminderAt: (daysBefore) =>
      `${Number(daysBefore) === 0 ? "No mesmo dia" : `${daysBefore} dia${stPl(daysBefore, "", "s")} antes`}, 9h`,
    measurement: "Medição",
    usageTitle: "Uso em vários dispositivos",
    usageDetail: "Contar como um o uso que continua entre dispositivos",
    data: "Dados",
    backupTitle: "Backup e conta",
    backupSyncing: "Sincronizando com sua conta automaticamente",
    backupDetail: "Salvar em arquivo ou entrar",
    endDemo: "Encerrar teste com exemplo",
    endDemoDetail: (count) =>
      `Apagar ${count} ${stPl(count, "assinatura de exemplo", "assinaturas de exemplo")}`,
    clearAll: "Redefinir tudo",
    clearAllDetail: (count) =>
      `Apagar ${count} ${stPl(count, "assinatura", "assinaturas")} e seus registros`,
  },
  clear: {
    syncedWarning:
      "\nA sincronização automática está ativada, então os registros dos seus outros dispositivos também serão apagados.",
    demoEnded: "Teste encerrado. Suas assinaturas não mudaram.",
    cleared: "Todos os registros de assinaturas foram apagados",
    demoTitle: "Encerrar o teste com exemplo?",
    title: "Apagar tudo?",
    demoDescription: (count) =>
      `${count} ${stPl(count, "assinatura de exemplo será apagada", "assinaturas de exemplo serão apagadas")}.\nSuas assinaturas não mudam.`,
    withKilled: (total, active, killed) =>
      `${total} ${stPl(total, "assinatura", "assinaturas")} (${active} ativa${stPl(active, "", "s")}, ${killed} cancelada${stPl(killed, "", "s")})\ne seu histórico de economia serão apagados.`,
    onlyActive: (total) =>
      `${total} ${stPl(total, "assinatura será apagada", "assinaturas serão apagadas")}.`,
    demoConfirm: "Encerrar teste",
    confirm: "Apagar tudo",
  },
  reminder: {
    title: "Lembretes de cobrança neste dispositivo",
    intro:
      "Mostra uma notificação neste celular às 9h antes de cada dia de cobrança. No dia 1º de cada mês você recebe o recibo de assinaturas do mês anterior, e na data de “rever” definida ao cancelar, um lembrete daquela assinatura. Nada passa por servidor ou e-mail, então não precisa entrar.",
    checking: "Verificando a permissão de notificações…",
    onWith: (count) =>
      `Ligado · ${count} lembrete${stPl(count, "", "s")} agendado${stPl(count, "", "s")}`,
    blocked: "Ligado, mas as notificações estão bloqueadas, então nenhum lembrete vai aparecer.",
    off: "Desligado",
    when: "Quando",
    sameDay: "No mesmo dia",
    daysBefore: (days) => `${days} dia${stPl(days, "", "s")} antes`,
    turnOff: "Desligar",
    sendTest: "Enviar lembrete de teste",
    turnOn: "Ligar lembretes",
    turnedOn: "Os lembretes de cobrança estão ligados neste dispositivo.",
    testSent: "Um lembrete de teste vai aparecer em alguns segundos.",
    testFailed: "Não foi possível enviar o lembrete de teste.",
    deniedHelp:
      "As notificações estão bloqueadas. Permita as notificações do SubSlash nas configurações do celular e ligue de novo (Android: Configurações › Apps › SubSlash › Notificações; iOS: Ajustes › SubSlash › Notificações).",
    unknownDates: (count) =>
      `${count} ${stPl(count, "assinatura anual não tem", "assinaturas anuais não têm")} mês de cobrança, então a data é desconhecida e nenhum lembrete é enviado.`,
  },
};
