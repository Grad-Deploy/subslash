import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const plural = (n: number, word: string) => `${n} ${one(n) ? word : `${word}s`}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * 앱의 폰 사용 기록 화면(리포트의 구독 사용 현황·구독 상세의 사용 현황). 평가 기준(`lib/usage/value`)과
 * 시간 계산은 그대로 쓰고 말만 옮긴다.
 */
export const ko = {
  usageApp: {
    range: { week: "1주", month: "1달", year: "1년" },
    rangeLabel: "기간",
    level: { red: "비쌈", yellow: "애매", green: "잘 씀" },
    per: { uses: "1회당", days: "하루당", hours: "시간당" },
    /** '잘 씀' 기준·잰 양: '4회' · '10일' · '10시간'. */
    goal: {
      uses: (n: number) => `${n}회`,
      days: (n: number) => `${n}일`,
      hours: (n: number) => `${n}시간`,
    },
    month: (m: number) => `${m}월`,
    monthDay: (m: number, d: number) => `${m}월 ${d}일`,
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    seconds: (s: number) => `${s}초`,
    noRecord: "기록 없음",
    times: (n: number) => `${n}회`,
    timesUnit: "회",
    usedTime: "사용 시간",
    opens: "쓴 횟수",
    unused: "안 씀",
    pending: (days: number) => `평가까지 ${days}일`,
    connect: "폰 사용 기록 연결하기",
    title: "구독 사용 현황",
    thisPhone: "이 폰 기준",
    line: {
      unopenedFor: (days: number) => `${days}일 동안 안 열었어요`,
      daysUsed: (days: number) => `${days}일 사용`,
      notInstalled: "이 폰에 앱이 없어요",
      noData: "이 기간에는 기록이 없어요",
      spentIn: (duration: string) => `${duration}에`,
      unusedDetail: (days: number) => `${days}일 동안 이 폰에서 한 번도 안 열었어요`,
      captionPending: (days: number, have: string, goal: string) =>
        `${days}일 동안 ${have} · 잘 씀 기준은 30일에 ${goal}`,
      captionMonth: (have: string, goal: string) => `한 달에 ${have} · 잘 씀 기준 ${goal}`,
      shareTime: (percent: number) => `구독 앱 전체 사용 시간의 ${percent}%`,
      shareOpens: (percent: number) => `구독 앱 전체 쓴 횟수의 ${percent}%`,
    },
    detail: {
      connectBody: "이 구독 앱을 얼마나 썼는지 기간별로 보여 드려요",
      title: "사용 현황",
      notInstalled: "이 폰에 앱이 없어요. 다른 기기에서 쓴다면 체크인으로 알려 주세요.",
      listenNote:
        "사용 시간에는 화면을 끄고 들은 재생 시간(재생 알림이 떠 있던 시간)도 들어가요. 일시정지 시간이 섞일 수 있어요.",
      dashed: "점선은 기록이 없는 때예요.",
      valueTitle: "이 구독의 가성비",
      shortLabel: "쓴 시간 동안 낸 돈",
      measuredUses: (days: number, count: number) => `최근 ${days}일 ${count}회`,
      measuredDays: (days: number, count: number) => `최근 ${days}일 중 ${count}일`,
      measuredHours: (days: number, used: string) => `최근 ${days}일 ${used}`,
      shortNote: (used: string) => `${used}만 써서 시간당은 계산하지 않았어요`,
      noneUses: (days: number) => `최근 ${days}일 동안 1분 넘게 연 적이 없어요`,
      noneDays: (days: number) => `최근 ${days}일 동안 쓴 날이 없어요`,
      noneHours: (days: number) => `최근 ${days}일 동안 안 썼어요`,
      activeDays: "쓴 날",
      days: (n: number) => `${n}일`,
      opened: (days: number, count: number) => `최근 ${days}일 · ${count}회 열었어요`,
      tvNote: "TV·PC에서 쓴 건 빠져 있어요. 체크인은 이 숫자를 채워 두고 고칠 수 있게 해요.",
    },
    card: {
      building: "오늘부터 이 폰의 사용 기록을 쌓는 중이에요.",
      barShare: "막대는 전체 사용 시간 중 차지하는 몫이에요.",
      neverOpened: (days: number, names: string) => `${days}일 동안 한 번도 안 연 구독: ${names}`,
      priceyBefore: "아까운 구독 ",
      priceyCount: (count: number) => `${count}개`,
      priceyMonthly: (names: string, amount: string) => `${names} — 한 달 ${amount}`,
      allGood: "모두 제값을 하고 있어요",
      allGoodNote: "이 폰에서 잰 것 기준이에요",
      fullBar: "막대가 꽉 차면 ‘잘 씀’이에요.",
      recorded: (days: number) => `이 폰 · 기록 ${days}일`,
      recent: "이 폰 · 최근 30일",
      pendingFooter: (days: number) => `가성비 평가까지 ${days}일`,
      totalFooter: (duration: string, count: string) => `사용 ${duration} · ${count}회`,
      more: "자세히 보기",
    },
    report: {
      sort: { value: "가성비", time: "사용 시간", opens: "쓴 횟수" },
      sortLabel: "정렬",
      offBody: "폰 사용 기록을 연결하면 구독 앱을 얼마나 썼는지, 시간당 얼마였는지 보여 드려요.",
      recordedSuffix: (days: number) => ` · 기록 ${days}일`,
      totalTime: "구독 앱 사용 시간",
      totalOpens: "구독 앱 쓴 횟수",
      empty: "아직 쌓인 기록이 없어요. 내일부터 이 폰의 사용 기록이 여기에 쌓여요.",
      valueRecent: "가성비는 기간과 관계없이 최근 30일로 봐요.",
      legendValue:
        "막대가 꽉 차면 '잘 씀'이에요(한 달에 OTT 4회 · AI 10일(하루 5분 이상) · 음악 10시간, 체크인과 같은 기준). 평가는 기록이 30일 쌓이면 나와요.",
      legendShare: "막대를 모두 더하면 100%예요. 색은 가성비 평가예요.",
      tvMissing: "TV·PC에서 본 건 빠져 있어요.",
      unmapped: (count: number) =>
        ` 멤버십이나 PC에서 쓰는 구독 ${count}개는 폰 기록으로 알 수 없어 빠졌어요.`,
      yearTitle: "1년 추이",
      yearSub: "달별 사용 시간",
      since: (date: string) => `${date}부터 이 폰에 쌓은 기록이에요. 점선은 기록이 없는 달이에요.`,
    },
  },
};

export const en: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 week", month: "1 month", year: "1 year" },
    rangeLabel: "Period",
    level: { red: "Pricey", yellow: "So-so", green: "Good value" },
    per: { uses: "per use", days: "per day", hours: "per hour" },
    goal: {
      uses: (n) => plural(n, "use"),
      days: (n) => plural(n, "day"),
      hours: (n) => plural(n, "hour"),
    },
    month: (m) => MONTHS[Number(m) - 1] ?? String(m),
    monthDay: (m, d) => `${MONTHS[Number(m) - 1] ?? m} ${d}`,
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    seconds: (s) => `${s} sec`,
    noRecord: "no record",
    times: (n) => plural(n, "time"),
    timesUnit: "times",
    usedTime: "Time used",
    opens: "Times used",
    unused: "Unused",
    pending: (days) => `${plural(days, "day")} until rated`,
    connect: "Connect phone usage history",
    title: "Subscription usage",
    thisPhone: "On this phone",
    line: {
      unopenedFor: (days) => `Not opened in ${plural(days, "day")}`,
      daysUsed: (days) => `Used ${plural(days, "day")}`,
      notInstalled: "The app isn't on this phone",
      noData: "No records for this period",
      spentIn: (duration) => `for ${duration}`,
      unusedDetail: (days) => `Not opened once on this phone in ${plural(days, "day")}`,
      captionPending: (days, have, goal) =>
        `${have} in ${plural(days, "day")} · “Good value” is ${goal} in 30 days`,
      captionMonth: (have, goal) => `${have} a month · “Good value” is ${goal}`,
      shareTime: (percent) => `${percent}% of all subscription app time`,
      shareOpens: (percent) => `${percent}% of all subscription app uses`,
    },
    detail: {
      connectBody: "We show how much you used this subscription's app, by period",
      title: "Usage",
      notInstalled:
        "The app isn't on this phone. If you use it on another device, tell us with a check-in.",
      listenNote:
        "Time used includes playback with the screen off (while the playback notification was showing). Paused time may be mixed in.",
      dashed: "Dashed lines are times with no record.",
      valueTitle: "This subscription's value",
      shortLabel: "Paid for the time used",
      measuredUses: (days, count) => `${plural(count, "time")} in the last ${plural(days, "day")}`,
      measuredDays: (days, count) => `${count} of the last ${plural(days, "day")}`,
      measuredHours: (days, used) => `${used} in the last ${plural(days, "day")}`,
      shortNote: (used) => `Only ${used} used, so no per-hour cost`,
      noneUses: (days) => `Not opened for over a minute in the last ${plural(days, "day")}`,
      noneDays: (days) => `No days used in the last ${plural(days, "day")}`,
      noneHours: (days) => `Not used in the last ${plural(days, "day")}`,
      activeDays: "Days used",
      days: (n) => plural(n, "day"),
      opened: (days, count) => `Last ${plural(days, "day")} · opened ${plural(count, "time")}`,
      tvNote:
        "Use on a TV or PC isn't included. Check-in fills in this number and lets you correct it.",
    },
    card: {
      building: "This phone's usage history starts building from today.",
      barShare: "Each bar is its share of the total time used.",
      neverOpened: (days, names) => `Not opened once in ${plural(days, "day")}: ${names}`,
      priceyBefore: "Poor-value subscriptions: ",
      priceyCount: (count) => `${count}`,
      priceyMonthly: (names, amount) => `${names} — ${amount} a month`,
      allGood: "They're all worth the money",
      allGoodNote: "Based on what this phone measured",
      fullBar: "A full bar means “Good value”.",
      recorded: (days) => `This phone · ${plural(days, "day")} recorded`,
      recent: "This phone · last 30 days",
      pendingFooter: (days) => `${plural(days, "day")} until the value rating`,
      totalFooter: (duration, count) => `Used ${duration} · ${count} times`,
      more: "See details",
    },
    report: {
      sort: { value: "Value", time: "Time used", opens: "Times used" },
      sortLabel: "Sort",
      offBody:
        "Connect your phone usage history to see how much you used your subscription apps and what they cost per hour.",
      recordedSuffix: (days) => ` · ${plural(days, "day")} recorded`,
      totalTime: "Subscription app time",
      totalOpens: "Subscription app uses",
      empty: "No records yet. From tomorrow, this phone's usage history builds up here.",
      valueRecent: "Value is always based on the last 30 days, whatever the period.",
      legendValue:
        "A full bar means “Good value” (a month of 4 OTT uses · 10 AI days (5+ minutes a day) · 10 hours of music, the same as check-ins). The rating appears once 30 days are recorded.",
      legendShare: "All bars add up to 100%. The color is the value rating.",
      tvMissing: "Watching on a TV or PC isn't included.",
      unmapped: (count) =>
        ` ${plural(count, "subscription")} used as a membership or on a PC can't be measured from phone records and are left out.`,
      yearTitle: "1-year trend",
      yearSub: "Time used per month",
      since: (date) =>
        `Records built up on this phone since ${date}. Dashed lines are months with no record.`,
    },
  },
};
