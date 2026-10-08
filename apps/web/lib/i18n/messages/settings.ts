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
