import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;

/** 앱의 폰 기록으로 한 번에 체크인, 첫 체크인 카드, 대시보드·계산서의 '지킨 돈' 한 줄. */
export const ko = {
  appSmall: {
    batch: {
      title: "폰 기록으로 한 번에 체크인",
      zero: {
        uses: "폰에서는 안 열었어요 · 다른 기기에서 봤나요?",
        days: "폰에서는 안 썼어요 · 다른 기기에서 썼나요?",
        hours: "폰에서는 안 들었어요 · 다른 기기에서 썼나요?",
      },
      saved: (count: number) => `${count}개 체크인했어요`,
      close: "닫기",
      intro: (coveredDays: number) =>
        `${coveredDays < 30 ? `기록이 있는 최근 ${coveredDays}일 동안` : "최근 30일 동안"} 이 폰에서 잰 값이에요. OTT는 연 횟수, AI는 5분 넘게 쓴 날, 음악·독서는 들은 시간이에요. 확인하고 고쳐 주세요.`,
      none: "폰 기록으로 잴 수 있는 구독이 없어요. 체크인은 구독마다 직접 해 주세요.",
      pick: (name: string) => `${name} 체크인에 넣기`,
      notInstalled: "이 폰에 앱이 없어요 · 따로 체크인",
      underHour: (used: string) => `${used} 사용 · 1시간이 안 돼요`,
      used: (used: string) => `${used} 사용`,
      minus: (name: string, unit: string) => `${name} 1${unit} 빼기`,
      plus: (name: string, unit: string) => `${name} 1${unit} 더하기`,
      footer: "TV·PC·태블릿에서 본 건 빠져 있어요. 거기서도 썼다면 + 로 더해 주세요.",
      footerUnmapped: (count: number) =>
        ` 폰 기록으로 알 수 없는 구독 ${count}개는 따로 체크인해요.`,
      submit: (count: number) => `${count}개 체크인하기`,
      submitNone: "체크인할 구독을 골라 주세요",
      later: "나중에",
      duration: {
        zero: "0분",
        under1: "1분 미만",
        minutes: (m: number) => `${m}분`,
        hours: (h: number) => `${h}시간`,
        hoursMinutes: (h: number, m: number) => `${h}시간 ${m}분`,
      },
    },
    first: {
      hints: {
        red: "빨간색은 요금만큼 쓰지 못했다는 뜻이에요. 다음 달에도 그렇다면 해지를 고민해 볼 때예요.",
        yellow: "노란색은 애매하다는 뜻이에요. 다음 달에도 이 정도라면 다시 생각해 보세요.",
        green: "초록색은 요금만큼 잘 쓰고 있다는 뜻이에요.",
      },
      perMonth: (amount: string) => `월 ${amount}`,
      label: (name: string) => `${name} 첫 체크인`,
      thisMuch: "이 정도면",
      closeHint: "안내 닫기",
      record: "기록하기",
    },
    savings: {
      pending: (amount: string) => `확인 대기 ${amount}`,
      accrues: "결제일이 지나면 쌓여요",
      thisMonth: (amount: string) => `이번 달 +${amount}`,
      link: "절약 현황",
      keptBefore: "해지해서 ",
      keptAfter: " 지켰어요",
      killedCount: (count: number) => `해지 ${count}개`,
      kept: "해지로 지킨 돈",
    },
  },
};

export const en: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Check in everything from phone records",
      zero: {
        uses: "Not opened on this phone · did you watch on another device?",
        days: "Not used on this phone · did you use it on another device?",
        hours: "Not listened to on this phone · did you use it on another device?",
      },
      saved: (count) => `Checked in ${count} ${one(count) ? "subscription" : "subscriptions"}`,
      close: "Close",
      intro: (coveredDays) =>
        `These are values measured on this phone over ${Number(coveredDays) < 30 ? `the last ${coveredDays} days that have records` : "the last 30 days"}. For OTT it's the number of uses in the year, for AI the days you used it for over 5 minutes, and for music and reading the time listened. Check and edit them.`,
      none: "No subscription can be measured from phone records. Check in each one yourself.",
      pick: (name) => `Include ${name} in the check-in`,
      notInstalled: "The app isn't on this phone · check in separately",
      underHour: (used) => `${used} used · under an hour`,
      used: (used) => `${used} used`,
      minus: (name, unit) => `Subtract 1 ${unit} from ${name}`,
      plus: (name, unit) => `Add 1 ${unit} to ${name}`,
      footer: "Use on TV, PC and tablets is missing. If you used it there too, add it with +.",
      footerUnmapped: (count) =>
        ` ${count} ${one(count) ? "subscription" : "subscriptions"} that phone records can't measure ${one(count) ? "is" : "are"} checked in separately.`,
      submit: (count) => `Check in ${count}`,
      submitNone: "Pick subscriptions to check in",
      later: "Later",
      duration: {
        zero: "0 min",
        under1: "under 1 min",
        minutes: (m) => `${m} min`,
        hours: (h) => `${h} h`,
        hoursMinutes: (h, m) => `${h} h ${m} min`,
      },
    },
    first: {
      hints: {
        red: "Red means you didn't use it as much as you paid. If next month is the same, it may be time to think about cancelling.",
        yellow: "Yellow means borderline. If next month is about the same, think again.",
        green: "Green means you're getting your money's worth.",
      },
      perMonth: (amount) => `${amount}/month`,
      label: (name) => `${name} first check-in`,
      thisMuch: "At this rate",
      closeHint: "Dismiss tip",
      record: "Record",
    },
    savings: {
      pending: (amount) => `Awaiting confirmation ${amount}`,
      accrues: "Builds up after the billing date passes",
      thisMonth: (amount) => `+${amount} this month`,
      link: "Savings",
      keptBefore: "You kept ",
      keptAfter: " by cancelling",
      killedCount: (count) => `${count} cancelled`,
      kept: "Money kept by cancelling",
    },
  },
};
