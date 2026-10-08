import type { Widen } from "../types";
import { countOf } from "../english";

/**
 * 앱의 폰 사용 기록 중 체크인 칸의 한 줄·자동 체크인·구독 후보·안 쓴 구독 알림·켜기 안내. 앱 이름(유튜브 뮤직
 * 등)은 서비스 목록처럼 그대로 쓴다.
 */
export const ko = {
  usageMore: {
    phoneBadge: "폰 기록",
    tvTabletMissing: "TV·PC·태블릿에서 본 건 빠져 있어요.",
    within: (covered: number) =>
      covered < 30 ? `기록이 있는 ${covered}일 동안` : "최근 30일 동안",
    hint: {
      notOpened: "이 폰에서는 안 열었어요.",
      notOpenedAfter: " TV·PC·태블릿에서 썼다면 막대로 골라 주세요.",
      usedBefore: (within: string) => `이 폰에서 ${within} `,
      usedOpens: (opens: number, duration: string) => `${opens}번 · ${duration}`,
      usedAfter: " 썼어요. 막대를 여기에 맞춰 뒀어요.",
      notInstalledBar:
        "이 폰에는 이 서비스의 앱이 없어요. 다른 기기에서 썼다면 막대로 골라 주세요.",
      notInstalledInput:
        "이 폰에는 이 서비스의 앱이 없어요. 다른 기기에서 썼다면 직접 적어 주세요.",
      building: "이 폰의 사용 기록은 오늘부터 쌓여요. 내일부터 여기서 채울 수 있어요.",
      fill: "폰 사용 기록으로 채우기",
      fillOpens: "이 폰에서 몇 번 썼는지 불러와요",
      fillDays: "이 폰에서 며칠 썼는지 불러와요",
      fillHours: "이 폰에서 몇 시간 썼는지 불러와요",
      usedDays: (days: number, duration: string) => `${days}일 · ${duration}`,
      usedAfterPlain: " 썼어요. ",
      fitted: "칸을 여기에 맞춰 뒀어요.",
      underHour: "1시간이 안 돼 칸은 비워 뒀어요.",
      listenMissing: "화면을 끄고 들은 재생은 아직 재지 못한 날이 있어 빠져 있을 수 있어요. ",
    },
    auto: {
      title: "폰 기록으로 자동 체크인",
      off: "꺼져 있어요. 체크인은 직접 해 주세요.",
      waiting: (days: number) => `폰 기록이 ${days}일 쌓이면 알아서 해요.`,
      on: "최근 30일 폰 기록으로 알아서 체크인해요. 이 폰에서 안 쓴 구독과 직접 센 숫자가 더 큰 구독은 그대로 둬요.",
      progress: (done: number, total: number) => `${done} / ${total}일`,
      left: (days: number) => `${days}일 남았어요`,
      status: (on: boolean) => `자동 체크인 ${on ? "켜짐" : "꺼짐"}`,
      statusOff: "직접 체크인해 주세요",
      statusWaiting: (days: number) => `폰 기록이 ${days}일 쌓이면 알아서 해요`,
      statusSoon: (days: number) => `${days}일 뒤부터 알아서 해요`,
      statusOn: "폰 기록으로 알아서 맞춰요",
      settings: "설정",
      turnOn: "켜기",
      batch: "폰 기록으로 체크인",
    },
    suggest: {
      sectionLabel: "폰 기록으로 찾은 구독",
      recent: (days: number) => (days >= 30 ? "최근 30일" : `최근 ${days}일`),
      killedTitle: (name: string) => `해지한 ${name}, 다시 쓰고 있어요`,
      title: (name: string) => `${name}, 구독 중인가요?`,
      used: (period: string, app: string | null, duration: string, days: number) =>
        `${period} 이 폰${app ? `의 ${app} 앱` : ""}에서 ${duration}, ${days}일 썼어요.`,
      killedBody: "다시 구독했다면 새로 등록해요.",
      newBody: "등록하지 않은 서비스예요.",
      share: "가족·친구와 나눠 내면 등록할 때 인원을 적어요.",
      notes: {
        "youtube-premium": "유튜브 뮤직만 따로 내면(뮤직 프리미엄) 직접 입력으로 등록해요.",
        "coupang-wow": "쿠팡플레이는 와우 회원이 아니어도 광고를 보며 무료로 볼 수 있어요.",
      } as Record<string, string>,
      whichBundle: "어느 상품으로 받나요?",
      resubscribed: "다시 구독했어요",
      subscribed: "내가 구독 중",
      viaBundle: "결합 상품으로 받아요",
      notPaying: "내가 내지 않아요",
      notPayingNote: (days: number) =>
        `‘내가 내지 않아요’는 가족 계정·무료 시청·구독 안 함이에요. ${days}일 동안 묻지 않아요.`,
    },
    alerts: {
      sectionLabel: "폰 기록으로 본 구독",
      unusedTitle: (name: string, days: number) => `${name} 앱을 ${days}일 동안 안 열었어요`,
      unusedReason: (days: number, amount: string) =>
        `${days === 0 ? "오늘" : `${days}일 뒤`} ${amount}이 결제돼요. 노트북·태블릿에서도 안 봤다면 쉬어가도 괜찮아요.`,
      priceyTitle: (name: string, amount: string) => `${name}, 시간당 ${amount}`,
      priceyReason: (days: number, duration: string, ratio: number) =>
        `최근 ${days}일 ${duration}만 썼어요. 내 다른 구독보다 ${ratio}배 비싸요.`,
      cancelGuide: "해지 안내 보기",
      otherDevice: "다른 기기에서 봤어요",
      fine: "괜찮아요",
      batchTitle: "폰 기록으로 한 번에 체크인",
      batchBody: (count: number) => `체크인 필요 ${count}개를 채워요`,
      fillButton: "채우기",
    },
    access: {
      label: "폰 사용 기록 연결",
      title1: "폰 사용 기록으로",
      title2: "체크인을 채울까요?",
      body: "안드로이드 설정의 ‘사용 기록 액세스’를 켜면, 구독한 서비스 앱을 얼마나 열고 썼는지 불러와요.",
      points: [
        {
          title: "구독한 서비스 앱의 사용 시간·쓴 횟수·재생 시간만 읽어요",
          body: "재생 시간은 음악 앱이 재생 알림을 띄워 둔 시간이에요. 다른 앱의 기록과 화면 내용은 쓰지 않아요",
        },
        {
          title: "이 폰 안에서만 계산해요",
          body: "서버나 계정으로 보내지 않아요. 여러 기기 합산은 설정에서 따로 켤 때만 올려요",
        },
        {
          title: "TV·PC에서 본 건 빠져요",
          body: "기록이 30일 쌓이면 체크인을 알아서 적어요. '내 구독'에서 끌 수 있고, 적힌 숫자는 언제든 다시 체크인해 고칠 수 있어요",
        },
        {
          title: "언제든 끌 수 있어요",
          body: "설정 › 사용 기록 액세스 › SubSlash",
        },
      ],
      waiting: "설정에서 SubSlash를 켜고 돌아와 주세요.",
      failed: "설정 화면을 열지 못했어요. 설정 › 사용 기록 액세스에서 직접 켜 주세요.",
      openSettings: "설정에서 켜기",
      later: "직접 입력할게요",
    },
    find: {
      label: "폰 사용 기록에서 찾기",
      accessTitle1: "폰 사용 기록으로",
      accessTitle2: "구독을 찾을까요?",
      accessBody: (names: string) =>
        `안드로이드 설정의 ‘사용 기록 액세스’를 켜면, ${names} 앱을 이 폰에서 얼마나 썼는지 보고 등록하지 않은 구독을 찾아요.`,
      covered: (days: number) => `최근 30일 중 ${days}일치 기록으로 찾았어요.`,
      noRecords: "아직 읽은 기록이 없어요.",
      scope: (names: string) => `${names}를 찾고, TV·PC에서 본 것은 빠져요.`,
      none: "등록하지 않은 OTT를 찾지 못했어요",
      fewDays: (days: number) => `기록이 ${days}일치뿐이에요. 며칠 더 쓰고 다시 찾아보세요.`,
      noneEnough: "이미 모두 등록했거나, 1시간·3일 넘게 쓴 앱이 없어요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Phone record",
    tvTabletMissing: "Watching on a TV, PC, or tablet isn't included.",
    within: (covered) =>
      Number(covered) < 30 ? `in the ${countOf(covered, "day")} on record` : "in the last 30 days",
    hint: {
      notOpened: "Not opened on this phone.",
      notOpenedAfter: " If you used it on a TV, PC, or tablet, pick on the bar.",
      usedBefore: (within) => `On this phone, ${within} you used it `,
      usedOpens: (opens, duration) => `${countOf(opens, "time")} · ${duration}`,
      usedAfter: ". We set the bar to match.",
      notInstalledBar:
        "This service's app isn't on this phone. If you used it on another device, pick on the bar.",
      notInstalledInput:
        "This service's app isn't on this phone. If you used it on another device, enter it yourself.",
      building: "This phone's usage history starts today. You can fill this in from tomorrow.",
      fill: "Fill in from phone usage history",
      fillOpens: "Load how many times you used it on this phone",
      fillDays: "Load how many days you used it on this phone",
      fillHours: "Load how many hours you used it on this phone",
      usedDays: (days, duration) => `${countOf(days, "day")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "We filled the field to match.",
      underHour: "Under an hour, so the field is left empty.",
      listenMissing:
        "Some days couldn't measure playback with the screen off yet, so it may be missing. ",
    },
    auto: {
      title: "Auto check-in from phone records",
      off: "It's off. Please check in yourself.",
      waiting: (days) =>
        `Starts on its own once ${countOf(days, "day")} of phone records build up.`,
      on: "Checks in on its own from the last 30 days of phone records. Subscriptions not used on this phone and ones where your own count is higher are left as they are.",
      progress: (done, total) => `${done} / ${countOf(total, "day")}`,
      left: (days) => `${countOf(days, "day")} left`,
      status: (on) => `Auto check-in ${on ? "on" : "off"}`,
      statusOff: "Please check in yourself",
      statusWaiting: (days) => `Starts once ${countOf(days, "day")} of phone records build up`,
      statusSoon: (days) => `Starts in ${countOf(days, "day")}`,
      statusOn: "Matches your phone records automatically",
      settings: "Settings",
      turnOn: "Turn on",
      batch: "Check in from phone records",
    },
    suggest: {
      sectionLabel: "Subscriptions found in phone records",
      recent: (days) =>
        Number(days) >= 30 ? "In the last 30 days" : `In the last ${countOf(days, "day")}`,
      killedTitle: (name) => `You cancelled ${name}, but you're using it again`,
      title: (name) => `${name} — are you subscribed?`,
      used: (period, app, duration, days) =>
        `${period}, you used ${app ? `the ${app} app` : "it"} on this phone for ${duration} on ${countOf(days, "day")}.`,
      killedBody: "If you subscribed again, register it anew.",
      newBody: "It's a service you haven't registered.",
      share: "If you split it with family or friends, enter how many when you register.",
      notes: {
        "youtube-premium":
          "If you only pay for YouTube Music (Music Premium), register it as a custom entry.",
        "coupang-wow": "Coupang Play can be watched free with ads even without a Wow membership.",
      },
      whichBundle: "Which bundle do you get it through?",
      resubscribed: "I subscribed again",
      subscribed: "I'm subscribed",
      viaBundle: "I get it in a bundle",
      notPaying: "I don't pay for it",
      notPayingNote: (days) =>
        `“I don't pay for it” covers a family account, free viewing, or not subscribing. We won't ask for ${countOf(days, "day")}.`,
    },
    alerts: {
      sectionLabel: "Subscriptions seen in phone records",
      unusedTitle: (name, days) => `You haven't opened the ${name} app in ${countOf(days, "day")}`,
      unusedReason: (days, amount) =>
        `${amount} will be charged ${Number(days) === 0 ? "today" : `in ${countOf(days, "day")}`}. If you haven't watched on a laptop or tablet either, it's fine to take a break.`,
      priceyTitle: (name, amount) => `${name}, ${amount} per hour`,
      priceyReason: (days, duration, ratio) =>
        `Used only ${duration} in the last ${countOf(days, "day")}. That's ${ratio}× pricier than your other subscriptions.`,
      cancelGuide: "See how to cancel",
      otherDevice: "I watched on another device",
      fine: "It's fine",
      batchTitle: "Check in all at once from phone records",
      batchBody: (count) => `Fill in ${countOf(count, "subscription")} that need a check-in`,
      fillButton: "Fill in",
    },
    access: {
      label: "Connect phone usage history",
      title1: "Fill in check-ins",
      title2: "from phone usage history?",
      body: "Turn on “Usage access” in Android settings and we'll load how much you opened and used your subscribed services' apps.",
      points: [
        {
          title: "Only reads time used, times used, and playback time of subscribed services' apps",
          body: "Playback time is how long a music app showed its playback notification. Other apps' records and screen contents aren't used",
        },
        {
          title: "Calculated only on this phone",
          body: "Not sent to a server or your account. Totals across devices are uploaded only if you turn that on separately in settings",
        },
        {
          title: "Watching on a TV or PC isn't included",
          body: "Once 30 days are recorded, check-ins are filled in automatically. You can turn this off in “My subscriptions”, and you can always check in again to correct the numbers",
        },
        {
          title: "You can turn it off anytime",
          body: "Settings › Usage access › SubSlash",
        },
      ],
      waiting: "Turn on SubSlash in settings and come back.",
      failed: "Couldn't open settings. Turn it on yourself in Settings › Usage access.",
      openSettings: "Turn on in settings",
      later: "I'll enter it myself",
    },
    find: {
      label: "Find in phone usage history",
      accessTitle1: "Find subscriptions",
      accessTitle2: "from phone usage history?",
      accessBody: (names) =>
        `Turn on “Usage access” in Android settings and we'll check how much you used the ${names} apps on this phone to find subscriptions you haven't registered.`,
      covered: (days) => `Found using ${countOf(days, "day")} of records from the last 30 days.`,
      noRecords: "No records read yet.",
      scope: (names) => `We look for ${names}; watching on a TV or PC isn't included.`,
      none: "No unregistered streaming services found",
      fewDays: (days) =>
        `Only ${countOf(days, "day")} of records so far. Use it a few more days and look again.`,
      noneEnough: "You've registered them all, or no app was used for over 1 hour or 3 days.",
    },
  },
};
