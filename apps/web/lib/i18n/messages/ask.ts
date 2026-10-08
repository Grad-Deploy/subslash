import { josa } from "../../ask/josa";
import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * '리포트에 물어보기'의 답 문장 틀. AI는 도구와 인자만 고르고, 기기가 자기 기록으로 계산해 이 틀에 넣는다
 * (`lib/ask/answer`). 한국어의 조사(은/는, 이에요/예요)는 이름의 받침으로 고른다(`lib/ask/josa`).
 */
export const ko = {
  ask: {
    suggestions: [
      "한 달에 구독비 얼마 나가?",
      "제일 아까운 구독 뭐야?",
      "OTT에 얼마 쓰고 있어?",
      "이번 주에 빠져나갈 돈 얼마야?",
      "겹치는 구독 있어?",
    ],
    noSubs: {
      headline: "아직 등록한 구독이 없어요.",
      source: "등록한 구독",
      note: "구독을 등록하면 물어볼 수 있어요.",
    },
    help: { headline: "앱 사용법은 도움말에서 찾아 드릴게요.", source: "도움말" },
    unsupported: {
      headline: "그건 답할 수 없는 질문이에요.",
      source: "물어볼 수 있는 것",
      note: (list: string) => `이런 걸 물어볼 수 있어요: ${list}`,
    },
    trialNote: (count: number) => `무료 체험 중인 ${count}개는 아직 돈이 나가지 않아 뺐어요.`,
    spend: {
      month: (count: number, amount: string) => `구독 ${count}개에 한 달 ${amount}을 내요.`,
      year: (count: number, amount: string) => `구독 ${count}개에 1년 ${amount}을 내요.`,
      sourceMonth: "내 몫 한 달 합계",
      sourceYear: "내 몫 1년 합계",
    },
    category: {
      none: (label: string) => `${label}${josa(label, "으로", "로")} 등록한 구독이 없어요.`,
      some: (label: string, count: number, amount: string, share: number) =>
        `${label} ${count}개에 한 달 ${amount}을 내요. 전체 구독비의 ${share}%예요.`,
      source: "분류별 내 몫 한 달 합계",
    },
    rank: {
      none: "1회 단가를 계산할 체크인이 없어요.",
      noneNote: "구독마다 최근 30일 동안 몇 번 썼는지 체크인하면 계산할 수 있어요.",
      source: "리포트의 1회 단가 순위(최근 30일 체크인)",
      sourceNone: "리포트 1회 단가 순위",
      worst: (name: string, per: string) =>
        `가장 아까운 구독은 ${name}${josa(name, "이에요", "예요")}. ${per}.`,
      best: (name: string, per: string) =>
        `가성비가 가장 좋은 구독은 ${name}${josa(name, "이에요", "예요")}. ${per}.`,
      perZero: "0회 (한 번도 안 씀)",
      perUse: (amount: string) => `1회 ${amount}`,
      skipped: "체크인하지 않았거나 횟수로 재지 않는 구독은 순위에서 빠졌어요.",
    },
    low: {
      source: "최근 30일 체크인 평가",
      unknown: (count: number) =>
        `최근 30일 체크인이 없는 ${count}개는 쓰는지 몰라서 넣지 않았어요.`,
      none: "최근 체크인 기준으로 거의 안 쓰는 구독은 없어요.",
      some: (count: number) => `거의 안 쓰는 구독이 ${count}개 있어요.`,
      monthly: (amount: string) => `한 달 ${amount}`,
    },
    upcoming: {
      unknown: (count: number) =>
        `결제 월을 모르는 연간 구독 ${count}개는 날짜를 몰라 넣지 않았어요.`,
      sourceNone: "다음 결제일",
      none: (days: number) => `${days}일 안에 결제되는 구독은 없어요.`,
      some: (days: number, count: number) => `${days}일 안에 ${count}건이 결제돼요.`,
      source: "다음 결제일 · 한 번에 내는 내 몫",
      date: (month: number, day: number) => `${month}월 ${day}일`,
      row: (date: string, name: string) => `${date} ${name}`,
    },
    trials: {
      source: "체험 종료일",
      none: (days: number) => `${days}일 안에 무료 체험이 끝나는 구독은 없어요.`,
      noneNote: "체험 종료일을 적은 구독만 알 수 있어요.",
      some: (count: number, days: number) => `${count}개의 무료 체험이 ${days}일 안에 끝나요.`,
      today: "오늘 끝나요",
      left: (days: number) => `${days}일 남음`,
    },
    overlaps: {
      source: "결합 상품 구성 · 분류",
      bundleValue: (services: string) => `${services} 겹침`,
      crowdedLabel: (label: string, count: number) => `${label} ${count}개`,
      none: "겹치는 구독은 없어요.",
      bundleHead: "두 번 내고 있을 수 있는 구독이 있어요.",
      crowdedHead: "같은 분류에 여러 개 구독하고 있어요.",
      note: "같은 분류라도 쓰임이 다를 수 있어요. 겹치는지는 직접 판단해 주세요.",
    },
    service: {
      source: "등록한 구독 이름",
      notFound: (query: string) => `'${query}'로 등록한 구독을 찾지 못했어요.`,
      notFoundNote: "이름을 바꿔 물어보세요.",
      many: (query: string, count: number) =>
        `'${query}'에 맞는 구독이 ${count}개예요. 이름을 더 정확히 적어 주세요.`,
      plansSource: "서비스 요금제 목록",
      noPlans: (name: string) => `${name}${josa(name, "은", "는")} 비교할 요금제 목록이 없어요.`,
      planUnknown: (name: string) => `${name}의 지금 요금제를 몰라 비교할 수 없어요.`,
      planUnknownNote: "구독 정보에서 요금제를 고르면 비교할 수 있어요.",
      cheapest: (name: string) => `${name}${josa(name, "은", "는")} 이미 가장 싼 요금제예요.`,
      best: (plan: string, saving: string) =>
        `${plan}${josa(plan, "으로", "로")} 바꾸면 1년에 ${saving} 덜 내요.`,
      bestSource: "서비스 요금제 목록 · 요금표 가격",
      saving: (amount: string) => `1년 ${amount} 절약`,
      current: (plan: string) => `지금 요금제: ${plan}`,
      shared: "나눠 내는 구독이라 금액은 카드에 찍히는 전체 요금 기준이에요.",
      detail: (name: string, amount: string) => `${name}: 한 달 ${amount}`,
      detailSource: "구독 정보 · 체크인 기록",
      nextBilling: "다음 결제일",
      inTrial: "무료 체험 중",
      unset: "결제 월 미설정",
      checkIn: "최근 30일 체크인",
      noRecord: "기록 없음",
    },
    saved: {
      none: "아직 해지한 구독이 없어요.",
      source: "해지 기록",
      month: (amount: string) => `해지해서 이번 달 ${amount}을 지켰어요.`,
      year: (amount: string) => `해지해서 올해 ${amount}을 지켰어요.`,
      sourceMonth: "이번 달 지킨 돈",
      sourceYear: "올해 지킨 돈",
      unknown: (count: number) => `결제 월이나 해지 날을 몰라 ${count}개는 넣지 못했어요.`,
    },
    compare: {
      note: "앱에는 달마다 쓴 돈의 기록이 없어, 이번 달에 등록·해지한 구독으로만 비교해요.",
      none: "이번 달에 새로 등록하거나 해지한 구독이 없어요.",
      noneSource: "등록일 · 해지일",
      same: "이번 달에 바뀐 구독의 금액이 같아요.",
      up: (amount: string) => `이번 달에 한 달 구독비가 ${amount} 늘었어요.`,
      down: (amount: string) => `이번 달에 한 달 구독비가 ${amount} 줄었어요.`,
      source: "이번 달 등록일 · 해지일 · 내 몫 한 달 금액",
      killed: (name: string) => `해지 ${name}`,
      added: (name: string) => `등록 ${name}`,
    },
  },
};

export const en: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "How much do my subscriptions cost a month?",
      "Which subscription is the biggest waste?",
      "How much am I spending on OTT?",
      "How much is charged this week?",
      "Do any of my subscriptions overlap?",
    ],
    noSubs: {
      headline: "You haven't added any subscriptions yet.",
      source: "Your subscriptions",
      note: "Add a subscription and you can ask about it.",
    },
    help: { headline: "I'll look up how to use the app in Help.", source: "Help" },
    unsupported: {
      headline: "That's not something I can answer.",
      source: "What you can ask",
      note: (list) => `You can ask things like: ${list}`,
    },
    trialNote: (count) =>
      `${count} on a free trial ${one(count) ? "isn't" : "aren't"} charged yet, so ${one(count) ? "it was" : "they were"} left out.`,
    spend: {
      month: (count, amount) =>
        `You pay ${amount} a month for ${count} ${one(count) ? "subscription" : "subscriptions"}.`,
      year: (count, amount) =>
        `You pay ${amount} a year for ${count} ${one(count) ? "subscription" : "subscriptions"}.`,
      sourceMonth: "Your share, monthly total",
      sourceYear: "Your share, yearly total",
    },
    category: {
      none: (label) => `You have no subscriptions in ${label}.`,
      some: (label, count, amount, share) =>
        `You pay ${amount} a month for ${count} in ${label}. That's ${share}% of your total.`,
      source: "Your share by category, monthly total",
    },
    rank: {
      none: "There are no check-ins to work out a cost per use from.",
      noneNote:
        "Check in how many times you used each subscription in the last 30 days and it can be worked out.",
      source: "The report's cost-per-use ranking (last 30 days of check-ins)",
      sourceNone: "The report's cost-per-use ranking",
      worst: (name, per) => `The biggest waste is ${name}. ${per}.`,
      best: (name, per) => `The best value is ${name}. ${per}.`,
      perZero: "0 uses (not used once)",
      perUse: (amount) => `${amount} per use`,
      skipped:
        "Subscriptions without a check-in, or not measured by uses, are left out of the ranking.",
    },
    low: {
      source: "Evaluation of the last 30 days of check-ins",
      unknown: (count) =>
        `${count} with no check-in in the last 30 days ${one(count) ? "was" : "were"} left out because we don't know if you use ${one(count) ? "it" : "them"}.`,
      none: "Going by recent check-ins, none of your subscriptions is barely used.",
      some: (count) =>
        `${count} ${one(count) ? "subscription is" : "subscriptions are"} barely used.`,
      monthly: (amount) => `${amount} a month`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} yearly ${one(count) ? "subscription" : "subscriptions"} with an unknown billing month ${one(count) ? "was" : "were"} left out because the date is unknown.`,
      sourceNone: "Next billing dates",
      none: (days) => `No subscription is charged in the next ${days} days.`,
      some: (days, count) =>
        `${count} ${one(count) ? "payment is" : "payments are"} due in the next ${days} days.`,
      source: "Next billing dates · your share of each payment",
      date: (month, day) => `${EN_MONTHS[Number(month) - 1] ?? month} ${day}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Trial end dates",
      none: (days) => `No free trial ends in the next ${days} days.`,
      noneNote: "Only subscriptions with a trial end date can be known.",
      some: (count, days) =>
        `${count} free ${one(count) ? "trial ends" : "trials end"} in the next ${days} days.`,
      today: "Ends today",
      left: (days) => `${days} ${one(days) ? "day" : "days"} left`,
    },
    overlaps: {
      source: "Bundle contents · categories",
      bundleValue: (services) => `${services} overlap`,
      crowdedLabel: (label, count) => `${label}: ${count}`,
      none: "None of your subscriptions overlap.",
      bundleHead: "You may be paying twice for some subscriptions.",
      crowdedHead: "You have several subscriptions in the same category.",
      note: "Even in the same category, they may serve different purposes. Decide for yourself whether they overlap.",
    },
    service: {
      source: "Names of your subscriptions",
      notFound: (query) => `Couldn't find a subscription matching '${query}'.`,
      notFoundNote: "Try asking with a different name.",
      many: (query, count) =>
        `${count} subscriptions match '${query}'. Please be more specific about the name.`,
      plansSource: "The service's plan list",
      noPlans: (name) => `${name} has no plan list to compare.`,
      planUnknown: (name) => `We don't know ${name}'s current plan, so it can't be compared.`,
      planUnknownNote: "Pick the plan in the subscription details and it can be compared.",
      cheapest: (name) => `${name} is already on the cheapest plan.`,
      best: (plan, saving) => `Switching to ${plan} saves you ${saving} a year.`,
      bestSource: "The service's plan list · list prices",
      saving: (amount) => `Saves ${amount} a year`,
      current: (plan) => `Current plan: ${plan}`,
      shared:
        "This is a shared subscription, so the amounts are the full price charged to the card.",
      detail: (name, amount) => `${name}: ${amount} a month`,
      detailSource: "Subscription details · check-ins",
      nextBilling: "Next billing date",
      inTrial: "On a free trial",
      unset: "Billing month not set",
      checkIn: "Check-in, last 30 days",
      noRecord: "No record",
    },
    saved: {
      none: "You haven't cancelled any subscriptions yet.",
      source: "Cancellation records",
      month: (amount) => `Cancelling kept ${amount} this month.`,
      year: (amount) => `Cancelling kept ${amount} this year.`,
      sourceMonth: "Money kept this month",
      sourceYear: "Money kept this year",
      unknown: (count) =>
        `${count} couldn't be included because the billing month or cancellation date is unknown.`,
    },
    compare: {
      note: "The app has no record of what you spent each month, so this only compares subscriptions added or cancelled this month.",
      none: "No subscription was added or cancelled this month.",
      noneSource: "Added dates · cancelled dates",
      same: "The subscriptions that changed this month add up to the same amount.",
      up: (amount) => `Your monthly subscription cost went up ${amount} this month.`,
      down: (amount) => `Your monthly subscription cost went down ${amount} this month.`,
      source: "This month's added dates · cancelled dates · your monthly share",
      killed: (name) => `Cancelled ${name}`,
      added: (name) => `Added ${name}`,
    },
  },
};
