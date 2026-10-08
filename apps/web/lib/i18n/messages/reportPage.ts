import { AGE_BAND_LABELS } from "../../stats";
import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const plural = (n: number, singular: string, pluralForm: string) =>
  one(n) ? singular : pluralForm;

/**
 * 구독 리포트(/report). 영수증 화면과 '리포트에 물어보기'의 답은 서버·기록에서 문장을 만드는 별도 영역이라
 * 여기에 없다.
 */
export const ko = {
  reportPage: {
    title: "구독 리포트",
    subtitle: "지금 내는 돈과, 제값을 하는지 한눈에.",
    emptyTitle: "아직 등록한 구독이 없어요",
    emptyHint: "구독을 등록하면 여기서 정리해 드려요.",
    register: "구독 등록하러 가기",
    peerSoon: "다른 사용자와의 비교는 준비 중이에요.",
    receipts: {
      label: "구독 영수증",
      month: (month: number) => `${month}월 영수증`,
      year: (year: number) => `${year}년 결산 영수증`,
    },
    summary: {
      label: "지출 요약",
      month: "한 달",
      year: "1년이면",
      subs: "구독",
      count: (count: number) => `${count}개`,
    },
    overlap: {
      label: "결합 상품과 겹치는 구독",
      title: "두 번 내고 있을 수 있어요",
      middle: (services: string) => `에 ${services}이(가) 들어 있는데 `,
      after: "도 따로 구독 중이에요. 다른 계정으로 쓰는 게 아니라면 한 쪽을 해지해도 돼요.",
    },
    ranking: {
      title: "1회 단가 순위",
      monthly: (amount: string) => `한 달 ${amount}`,
      used: (count: number) => ` · ${count}번 사용`,
      beforeCheckIn: "체크인 전",
      unused: "안 썼어요",
      perUse: "1회",
      note: "‘체크인 전’인 구독은 대시보드에서 이번 달 사용 횟수를 알려 주면 1회 단가가 나와요.",
    },
    other: {
      title: "횟수 말고 다른 기준으로 재는 구독",
      note: "음악은 들은 시간, AI·업무 도구는 쓴 날, 멤버십은 받은 혜택, 저장 공간은 쓰는 용량으로 봐요.",
    },
    age: {
      pickNote: "내 연령대를 고르면 같은 연령대와 비교해요.",
      myBand: "내 연령대",
      labels: AGE_BAND_LABELS,
      caption: "연령대별 한 달 구독 지출(보통)",
      notEnough: (participants: number, min: number) =>
        `${participants}명 참여 · ${min}명이 모이면 보여 드려요`,
      me: "나",
      tooFew: (band: string, participants: number) =>
        `${band}는 아직 ${participants}명이라 비교할 수 없어요.`,
      more: (band: string, diff: string, year: string) =>
        `${band} 보통보다 한 달 ${diff} 더 내요. 1년이면 ${year}.`,
      less: (band: string, diff: string) => `${band} 보통보다 한 달 ${diff} 덜 내요.`,
      same: (band: string) => `${band} 보통과 같아요.`,
    },
    peer: {
      title: "다른 사용자와 비교",
      sample: "가상 사용자와 비교한 미리보기예요.",
      real: "참여한 사용자의 익명 통계예요.",
      whatDoWeCollect: "무엇을 모으나요?",
      sampleCount: (count: number) => `가상 ${count}명`,
      realCount: (count: number) => `${count}명 참여`,
      sampleNote: (count: number) =>
        `테스트 빌드용 가상 데이터예요. 실제 사용자가 아니라, 자주 쓰는 구독을 조합해 만든 가상 사용자 ${count}명으로 비교 화면을 보여 드려요.`,
      loadFailed: "비교 통계를 불러오지 못했어요.",
      leaveFailed: "참여를 그만두지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
      typicalBefore: "참여자의 한 달 구독 지출은 보통 ",
      typicalMid: " · 나는 ",
      barMore: (diff: string, year: string) => `보통보다 한 달 ${diff} 더 내요. 1년이면 ${year}.`,
      barLess: (diff: string) => `보통보다 한 달 ${diff} 덜 내요.`,
      barSame: "보통과 같아요.",
      gathering: (min: number, participants: number) =>
        `${min}명이 모이면 비교를 보여 드려요. 지금 ${participants}명이 참여했어요.`,
      typicalAmount: (amount: string) => `보통 ${amount}`,
      typicalUses: (count: number) => `보통 ${count}번`,
      meAmount: (amount: string) => `나 ${amount}`,
      meBeforeCheckIn: "나 체크인 전",
      meUses: (count: number) => `나 ${count}번`,
      contributing: "내 구독 요약을 익명으로 보태는 중이에요.",
      leave: "그만두기",
      signedOutBefore: "로그인하지 않은 동안은 보태지 않아요. ",
      login: "로그인",
      signedOutAfter: "하면 다시 보태요.",
      joinNote: "서비스·금액·사용 횟수만 이름 없이 보태요. 언제든 그만두면 바로 지워져요.",
      join: "익명으로 참여하기",
      loginInviteAfter:
        "하면 서비스·금액·사용 횟수만 이름 없이 보탤 수 있어요. 계정과 묶어 저장하지는 않아요.",
    },
    ask: {
      label: "리포트에 물어보기",
      title: "리포트에 물어보기",
      unavailable: "지금은 답할 수 없어요.",
      goHelp: "도움말에서 찾아보기",
      source: (source: string) => `계산: ${source} · 숫자는 이 기기에서 계산했어요`,
      placeholder: "직접 물어보기",
      inputLabel: "리포트에 물어볼 질문",
      send: "묻기",
      privacy:
        "질문 문장만 AI로 보내요. 내 구독 목록과 금액은 보내지 않아요. 이름·연락처 같은 개인정보는 적지 마세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  reportPage: {
    title: "Subscription report",
    subtitle: "What you pay now, and whether it's worth it, at a glance.",
    emptyTitle: "No subscriptions yet",
    emptyHint: "Add a subscription and we'll sum it up here.",
    register: "Add a subscription",
    peerSoon: "Comparison with other users is coming soon.",
    receipts: {
      label: "Subscription receipts",
      month: (month) => `${monthName(month)} receipt`,
      year: (year) => `${year} year-end receipt`,
    },
    summary: {
      label: "Spending summary",
      month: "A month",
      year: "In a year",
      subs: "Subscriptions",
      count: (count) => String(count),
    },
    overlap: {
      label: "Subscriptions that overlap with a bundle",
      title: "You may be paying twice",
      middle: (services) => ` includes ${services}, but you also subscribe to `,
      after: " separately. Unless it's a different account, you can cancel one of them.",
    },
    ranking: {
      title: "Cost per use ranking",
      monthly: (amount) => `${amount} a month`,
      used: (count) => ` · used ${count} ${plural(count, "time", "times")}`,
      beforeCheckIn: "No check-in yet",
      unused: "Not used",
      perUse: "per use",
      note: "For subscriptions with “No check-in yet”, tell us this month's usage on the dashboard and the cost per use appears.",
    },
    other: {
      title: "Subscriptions measured another way",
      note: "Music is measured by hours listened, AI and work tools by days used, memberships by benefits received, and storage by space used.",
    },
    age: {
      pickNote: "Pick your age group to compare with the same group.",
      myBand: "My age group",
      labels: {
        "10s": "Teens",
        "20s": "20s",
        "30s": "30s",
        "40s": "40s",
        "50s": "50s",
        "60s+": "60 and over",
      },
      caption: "Typical monthly subscription spending by age group",
      notEnough: (participants, min) => `${participants} joined · shown once ${min} have joined`,
      me: "Me",
      tooFew: (band, participants) =>
        `Only ${participants} ${plural(participants, "person", "people")} in ${band} so far, so it can't be compared.`,
      more: (band, diff, year) =>
        `You pay ${diff} more a month than the typical person in ${band}. That's ${year} a year.`,
      less: (band, diff) => `You pay ${diff} less a month than the typical person in ${band}.`,
      same: (band) => `Same as the typical person in ${band}.`,
    },
    peer: {
      title: "Compare with other users",
      sample: "A preview compared with sample users.",
      real: "Anonymous statistics from users who joined.",
      whatDoWeCollect: "What do we collect?",
      sampleCount: (count) => `${count} sample users`,
      realCount: (count) => `${count} joined`,
      sampleNote: (count) =>
        `This is sample data for test builds. They aren't real users: the comparison uses ${count} sample users made from commonly used subscriptions.`,
      loadFailed: "Couldn't load the comparison statistics.",
      leaveFailed: "Couldn't stop sharing. Please try again in a moment.",
      typicalBefore: "Participants typically spend ",
      typicalMid: " a month on subscriptions · you spend ",
      barMore: (diff, year) => `You pay ${diff} more a month than typical. That's ${year} a year.`,
      barLess: (diff) => `You pay ${diff} less a month than typical.`,
      barSame: "Same as typical.",
      gathering: (min, participants) =>
        `The comparison appears once ${min} have joined. ${participants} ${plural(participants, "person has", "people have")} joined so far.`,
      typicalAmount: (amount) => `Typical ${amount}`,
      typicalUses: (count) => `Typical ${count} ${plural(count, "use", "uses")}`,
      meAmount: (amount) => `You ${amount}`,
      meBeforeCheckIn: "You: no check-in yet",
      meUses: (count) => `You ${count} ${plural(count, "use", "uses")}`,
      contributing: "You're anonymously contributing a summary of your subscriptions.",
      leave: "Stop sharing",
      signedOutBefore: "We don't contribute while you're logged out. ",
      login: "Log in",
      signedOutAfter: " and we'll contribute again.",
      joinNote:
        "Only the service, amount and number of uses are added, without your name. Stop any time and they are deleted right away.",
      join: "Join anonymously",
      loginInviteAfter:
        " to contribute only the service, amount and number of uses without your name. They aren't stored together with your account.",
    },
    ask: {
      label: "Ask your report",
      title: "Ask your report",
      unavailable: "Can't answer right now.",
      goHelp: "Look it up in Help",
      source: (source) => `Calculated from: ${source} · the numbers were worked out on this device`,
      placeholder: "Ask your own question",
      inputLabel: "Question about your report",
      send: "Ask",
      privacy:
        "Only the question text goes to the AI. Your subscription list and amounts aren't sent. Don't include personal details such as your name or contacts.",
    },
  },
};

const EN_MONTHS = [
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
function monthName(month: number): string {
  return EN_MONTHS[Number(month) - 1] ?? String(month);
}
