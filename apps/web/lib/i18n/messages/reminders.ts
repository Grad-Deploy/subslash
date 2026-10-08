import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const plural = (n: number, word: string) => `${n} ${one(n) ? word : `${word}s`}`;
const MONTHS = [
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
const monthName = (m: number) => MONTHS[Number(m) - 1] ?? String(m);

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
      unknownBilling: (name: string) => `${name}은(는) 결제일을 몰라서 알림을 걸 수 없어요.`,
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
        `${name} charge ${Number(daysBefore) === 0 ? "today" : `in ${plural(daysBefore, "day")}`}`,
      billingBody: (month, day, amount) =>
        `${amount} will be charged on ${monthName(month)} ${day}. Check whether you'll keep using it.`,
      receiptTitle: (month) => `Your ${monthName(month)} subscription receipt is ready`,
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
        `We'll remind you on this phone at 9 AM ${Number(daysBefore) === 0 ? "on the billing day" : `${plural(daysBefore, "day")} before billing`}${name ? ` for ${name}` : ""}. It doesn't go through a server or email, so you don't need to log in.`,
      whenLabel: "When to remind",
      choice: (daysBefore) =>
        Number(daysBefore) === 0 ? "Same day" : `${plural(daysBefore, "day")} before`,
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
        ` · ${plural(count, "yearly subscription")} without a billing month left out`,
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
