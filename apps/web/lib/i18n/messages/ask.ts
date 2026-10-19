import { withJosa } from "../josa";
import type { Widen } from "../types";
import { MONTHS_SHORT, one } from "../english";
import { monthName } from "../months";

/**
 * '리포트에 물어보기'의 답 문장 틀. AI는 도구와 인자만 고르고, 기기가 자기 기록으로 계산해 이 틀에 넣는다
 * (`lib/ask/answer`). 한국어의 조사(은/는, 이에요/예요)는 이름의 받침으로 고른다(`lib/i18n/josa`).
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
      none: (label: string) => `${withJosa(label, "으로", "로")} 등록한 구독이 없어요.`,
      some: (label: string, count: number, amount: string, share: number) =>
        `${label} ${count}개에 한 달 ${amount}을 내요. 전체 구독비의 ${share}%예요.`,
      source: "분류별 내 몫 한 달 합계",
      someYear: (label: string, count: number, amount: string, share: number) =>
        `${label} ${count}개에 1년 ${amount}을 내요. 전체 구독비의 ${share}%예요.`,
      sourceYear: "분류별 내 몫 1년 합계",
    },
    rank: {
      none: "1회 단가를 계산할 체크인이 없어요.",
      noneNote: "구독마다 최근 30일 동안 몇 번 썼는지 체크인하면 계산할 수 있어요.",
      source: "리포트의 1회 단가 순위(최근 30일 체크인)",
      sourceNone: "리포트 1회 단가 순위",
      worst: (name: string, per: string) =>
        `가장 아까운 구독은 ${withJosa(name, "이에요", "예요")}. ${per}.`,
      best: (name: string, per: string) =>
        `가성비가 가장 좋은 구독은 ${withJosa(name, "이에요", "예요")}. ${per}.`,
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
      manyUnnamed: (count: number) => `맞는 구독이 ${count}개예요. 이름을 더 정확히 적어 주세요.`,
      many: (query: string, count: number) =>
        `'${query}'에 맞는 구독이 ${count}개예요. 이름을 더 정확히 적어 주세요.`,
      plansSource: "서비스 요금제 목록",
      noPlans: (name: string) => `${withJosa(name, "은", "는")} 비교할 요금제 목록이 없어요.`,
      planUnknown: (name: string) => `${name}의 지금 요금제를 몰라 비교할 수 없어요.`,
      planUnknownNote: "구독 정보에서 요금제를 고르면 비교할 수 있어요.",
      cheapest: (name: string) => `${withJosa(name, "은", "는")} 이미 가장 싼 요금제예요.`,
      best: (plan: string, saving: string) =>
        `${withJosa(plan, "으로", "로")} 바꾸면 1년에 ${saving} 덜 내요.`,
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
      someYear: (label, count, amount, share) =>
        `You pay ${amount} a year for ${count} in ${label}. That's ${share}% of your total.`,
      sourceYear: "Your share by category, yearly total",
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
      date: (month, day) => `${MONTHS_SHORT[Number(month) - 1] ?? month} ${day}`,
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
      manyUnnamed: (count) =>
        `${count} subscriptions match. Please be more specific about the name.`,
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

// 숫자는 기기가 계산하고 여기서는 문장 틀만 만든다.
const akPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "我每月在订阅上花多少？",
      "哪个订阅最浪费？",
      "我在 OTT 上花了多少？",
      "这周要扣多少钱？",
      "我的订阅有重复的吗？",
    ],
    noSubs: {
      headline: "你还没有添加订阅。",
      source: "你的订阅",
      note: "添加订阅后就可以提问了。",
    },
    help: { headline: "我会在帮助中查找使用方法。", source: "帮助" },
    unsupported: {
      headline: "这个问题我回答不了。",
      source: "可以问的内容",
      note: (list) => `你可以这样问：${list}`,
    },
    trialNote: (count) => `${count} 个免费试用中的订阅还没有扣款，所以未计入。`,
    spend: {
      month: (count, amount) => `你每月为 ${count} 个订阅支付 ${amount}。`,
      year: (count, amount) => `你每年为 ${count} 个订阅支付 ${amount}。`,
      sourceMonth: "我的份额，每月合计",
      sourceYear: "我的份额，每年合计",
    },
    category: {
      none: (label) => `你在${label}中没有订阅。`,
      some: (label, count, amount, share) =>
        `你每月在${label}的 ${count} 个订阅上支付 ${amount}，占总额的 ${share}%。`,
      source: "按类别的我的份额，每月合计",
      someYear: (label, count, amount, share) =>
        `你每年在${label}的 ${count} 个订阅上支付 ${amount}，占总额的 ${share}%。`,
      sourceYear: "按类别的我的份额，每年合计",
    },
    rank: {
      none: "没有可以计算单次成本的签到。",
      noneNote: "签到每个订阅在过去 30 天的使用次数后就能算出来。",
      source: "报告中的单次成本排行（最近 30 天签到）",
      sourceNone: "报告中的单次成本排行",
      worst: (name, per) => `最浪费的是 ${name}。${per}。`,
      best: (name, per) => `最划算的是 ${name}。${per}。`,
      perZero: "使用 0 次（一次都没用）",
      perUse: (amount) => `每次 ${amount}`,
      skipped: "没有签到或不是按次数衡量的订阅不在排行中。",
    },
    low: {
      source: "最近 30 天签到的评价",
      unknown: (count) => `${count} 个最近 30 天没有签到的订阅，因为不知道是否在用，所以未计入。`,
      none: "从最近的签到看，没有几乎不用的订阅。",
      some: (count) => `有 ${count} 个订阅几乎没用。`,
      monthly: (amount) => `每月 ${amount}`,
    },
    upcoming: {
      unknown: (count) => `${count} 个扣款月份不明的年付订阅因日期不明未计入。`,
      sourceNone: "下次扣款日",
      none: (days) => `未来 ${days} 天内没有扣款的订阅。`,
      some: (days, count) => `未来 ${days} 天内有 ${count} 笔扣款。`,
      source: "下次扣款日 · 每笔中我的份额",
      date: (month, day) => `${Number(month)}月${day}日`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "试用结束日期",
      none: (days) => `未来 ${days} 天内没有结束的免费试用。`,
      noneNote: "只能知道填写了试用结束日期的订阅。",
      some: (count, days) => `未来 ${days} 天内有 ${count} 个免费试用结束。`,
      today: "今天结束",
      left: (days) => `还剩 ${days} 天`,
    },
    overlaps: {
      source: "组合套餐内容 · 类别",
      bundleValue: (services) => `${services} 重复`,
      crowdedLabel: (label, count) => `${label}：${count} 个`,
      none: "你的订阅没有重复。",
      bundleHead: "有些订阅你可能付了两次钱。",
      crowdedHead: "同一类别中有好几个订阅。",
      note: "即使类别相同，用途也可能不同。是否重复请自行判断。",
    },
    service: {
      source: "你的订阅名称",
      notFound: (query) => `找不到与“${query}”相符的订阅。`,
      notFoundNote: "换个名称再问问看。",
      manyUnnamed: (count) => `有 ${count} 个订阅相符。请把名称说得更具体些。`,
      many: (query, count) => `有 ${count} 个订阅与“${query}”相符。请把名称说得更具体些。`,
      plansSource: "该服务的套餐列表",
      noPlans: (name) => `${name} 没有可比较的套餐列表。`,
      planUnknown: (name) => `不知道 ${name} 目前的套餐，无法比较。`,
      planUnknownNote: "在订阅详情中选择套餐后就能比较。",
      cheapest: (name) => `${name} 已经是最便宜的套餐。`,
      best: (plan, saving) => `换成 ${plan} 每年可省 ${saving}。`,
      bestSource: "该服务的套餐列表 · 价目表价格",
      saving: (amount) => `每年省 ${amount}`,
      current: (plan) => `当前套餐：${plan}`,
      shared: "这是分摊的订阅，所以金额是卡上扣的全部费用。",
      detail: (name, amount) => `${name}：每月 ${amount}`,
      detailSource: "订阅详情 · 签到",
      nextBilling: "下次扣款日",
      inTrial: "免费试用中",
      unset: "未设置扣款月份",
      checkIn: "签到（最近 30 天）",
      noRecord: "没有记录",
    },
    saved: {
      none: "你还没有退订任何订阅。",
      source: "退订记录",
      month: (amount) => `本月通过退订守住了 ${amount}。`,
      year: (amount) => `今年通过退订守住了 ${amount}。`,
      sourceMonth: "本月守住的钱",
      sourceYear: "今年守住的钱",
      unknown: (count) => `${count} 个因扣款月份或退订日期不明，未计入。`,
    },
    compare: {
      note: "应用没有每月支出的记录，所以只比较本月添加或退订的订阅。",
      none: "本月没有添加或退订的订阅。",
      noneSource: "添加日期 · 退订日期",
      same: "本月变动的订阅加起来金额相同。",
      up: (amount) => `本月每月订阅费用增加了 ${amount}。`,
      down: (amount) => `本月每月订阅费用减少了 ${amount}。`,
      source: "本月的添加日期 · 退订日期 · 每月我的份额",
      killed: (name) => `退订 ${name}`,
      added: (name) => `添加 ${name}`,
    },
  },
};

export const ja: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "サブスクに毎月いくら払っている？",
      "一番もったいないサブスクは？",
      "OTT にいくら使っている？",
      "今週はいくら引き落とされる？",
      "重なっているサブスクはある？",
    ],
    noSubs: {
      headline: "まだサブスクを登録していません。",
      source: "あなたのサブスク",
      note: "サブスクを登録すると質問できます。",
    },
    help: { headline: "使い方はヘルプで探します。", source: "ヘルプ" },
    unsupported: {
      headline: "その質問には答えられません。",
      source: "質問できること",
      note: (list) => `たとえばこう聞けます: ${list}`,
    },
    trialNote: (count) => `無料体験中の ${count} 件はまだ請求されていないので除きました。`,
    spend: {
      month: (count, amount) => `サブスク ${count} 件に毎月 ${amount} 払っています。`,
      year: (count, amount) => `サブスク ${count} 件に年間 ${amount} 払っています。`,
      sourceMonth: "自分の負担分、月の合計",
      sourceYear: "自分の負担分、年の合計",
    },
    category: {
      none: (label) => `${label}のサブスクはありません。`,
      some: (label, count, amount, share) =>
        `${label}の ${count} 件に毎月 ${amount} 払っています。全体の ${share}% です。`,
      source: "カテゴリ別の自分の負担分、月の合計",
      someYear: (label, count, amount, share) =>
        `${label}の ${count} 件に年間 ${amount} 払っています。全体の ${share}% です。`,
      sourceYear: "カテゴリ別の自分の負担分、年の合計",
    },
    rank: {
      none: "1 回あたりの単価を計算できるチェックインがありません。",
      noneNote: "それぞれ過去 30 日に何回使ったかチェックインすると計算できます。",
      source: "レポートの 1 回あたり単価ランキング（直近 30 日のチェックイン）",
      sourceNone: "レポートの 1 回あたり単価ランキング",
      worst: (name, per) => `一番もったいないのは ${name} です。${per}。`,
      best: (name, per) => `一番お得なのは ${name} です。${per}。`,
      perZero: "0 回（一度も使っていません）",
      perUse: (amount) => `1 回 ${amount}`,
      skipped: "チェックインがないサブスクや回数で測らないサブスクはランキングから除いています。",
    },
    low: {
      source: "直近 30 日のチェックインの評価",
      unknown: (count) =>
        `直近 30 日にチェックインがない ${count} 件は、使っているかわからないので除きました。`,
      none: "最近のチェックインを見ると、ほとんど使っていないサブスクはありません。",
      some: (count) => `ほとんど使っていないサブスクが ${count} 件あります。`,
      monthly: (amount) => `月 ${amount}`,
    },
    upcoming: {
      unknown: (count) =>
        `支払月がわからない年払いのサブスク ${count} 件は日付がわからないので除きました。`,
      sourceNone: "次の支払日",
      none: (days) => `今後 ${days} 日間に支払いのあるサブスクはありません。`,
      some: (days, count) => `今後 ${days} 日間に支払いが ${count} 件あります。`,
      source: "次の支払日 · 各支払いの自分の負担分",
      date: (month, day) => `${Number(month)}月${day}日`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "体験の終了日",
      none: (days) => `今後 ${days} 日間に終わる無料体験はありません。`,
      noneNote: "体験の終了日を入れたサブスクだけがわかります。",
      some: (count, days) => `今後 ${days} 日間に無料体験が ${count} 件終わります。`,
      today: "今日終了",
      left: (days) => `あと ${days} 日`,
    },
    overlaps: {
      source: "セット商品の内容 · カテゴリ",
      bundleValue: (services) => `${services} が重複`,
      crowdedLabel: (label, count) => `${label}: ${count} 件`,
      none: "重なっているサブスクはありません。",
      bundleHead: "二重に払っているかもしれないサブスクがあります。",
      crowdedHead: "同じカテゴリにいくつもサブスクがあります。",
      note: "同じカテゴリでも用途が違うことがあります。重なっているかはご自身で判断してください。",
    },
    service: {
      source: "あなたのサブスクの名前",
      notFound: (query) => `「${query}」に合うサブスクが見つかりませんでした。`,
      notFoundNote: "別の名前で聞いてみてください。",
      manyUnnamed: (count) =>
        `合うサブスクが ${count} 件あります。名前をもう少し詳しく教えてください。`,
      many: (query, count) =>
        `「${query}」に合うサブスクが ${count} 件あります。名前をもう少し詳しく教えてください。`,
      plansSource: "サービスのプラン一覧",
      noPlans: (name) => `${name} には比べられるプラン一覧がありません。`,
      planUnknown: (name) => `${name} の今のプランがわからないので比べられません。`,
      planUnknownNote: "サブスクの詳細でプランを選ぶと比べられます。",
      cheapest: (name) => `${name} はすでに一番安いプランです。`,
      best: (plan, saving) => `${plan} に変えると年 ${saving} 安くなります。`,
      bestSource: "サービスのプラン一覧 · 料金表の価格",
      saving: (amount) => `年 ${amount} の節約`,
      current: (plan) => `今のプラン: ${plan}`,
      shared: "分け合うサブスクなので、金額はカードに請求される全額です。",
      detail: (name, amount) => `${name}: 月 ${amount}`,
      detailSource: "サブスクの詳細 · チェックイン",
      nextBilling: "次の支払日",
      inTrial: "無料体験中",
      unset: "支払月が未設定",
      checkIn: "チェックイン（直近 30 日）",
      noRecord: "記録なし",
    },
    saved: {
      none: "まだ解約したサブスクがありません。",
      source: "解約の記録",
      month: (amount) => `今月は解約で ${amount} を守りました。`,
      year: (amount) => `今年は解約で ${amount} を守りました。`,
      sourceMonth: "今月守ったお金",
      sourceYear: "今年守ったお金",
      unknown: (count) => `${count} 件は支払月か解約日がわからないので含められませんでした。`,
    },
    compare: {
      note: "アプリには月ごとの支出の記録がないので、今月登録・解約したサブスクだけで比べます。",
      none: "今月登録・解約したサブスクはありません。",
      noneSource: "登録日 · 解約日",
      same: "今月変わったサブスクを合わせると同じ金額です。",
      up: (amount) => `今月、毎月のサブスク代が ${amount} 増えました。`,
      down: (amount) => `今月、毎月のサブスク代が ${amount} 減りました。`,
      source: "今月の登録日 · 解約日 · 毎月の自分の負担分",
      killed: (name) => `${name} を解約`,
      added: (name) => `${name} を登録`,
    },
  },
};

export const vi: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "Mỗi tháng tôi tốn bao nhiêu cho gói đăng ký?",
      "Gói nào lãng phí nhất?",
      "Tôi chi bao nhiêu cho OTT?",
      "Tuần này bị trừ bao nhiêu?",
      "Có gói nào bị trùng không?",
    ],
    noSubs: {
      headline: "Bạn chưa thêm gói đăng ký nào.",
      source: "Gói đăng ký của bạn",
      note: "Thêm gói đăng ký để có thể hỏi.",
    },
    help: { headline: "Tôi sẽ tìm cách dùng ứng dụng trong Trợ giúp.", source: "Trợ giúp" },
    unsupported: {
      headline: "Tôi không trả lời được câu này.",
      source: "Những gì bạn có thể hỏi",
      note: (list) => `Bạn có thể hỏi kiểu: ${list}`,
    },
    trialNote: (count) =>
      `${count} gói đang dùng thử miễn phí chưa bị trừ tiền nên không được tính.`,
    spend: {
      month: (count, amount) => `Bạn trả ${amount} mỗi tháng cho ${count} gói đăng ký.`,
      year: (count, amount) => `Bạn trả ${amount} mỗi năm cho ${count} gói đăng ký.`,
      sourceMonth: "Phần của bạn, tổng mỗi tháng",
      sourceYear: "Phần của bạn, tổng mỗi năm",
    },
    category: {
      none: (label) => `Bạn không có gói nào trong ${label}.`,
      some: (label, count, amount, share) =>
        `Bạn trả ${amount} mỗi tháng cho ${count} gói ${label}, chiếm ${share}% tổng.`,
      source: "Phần của bạn theo danh mục, tổng mỗi tháng",
      someYear: (label, count, amount, share) =>
        `Bạn trả ${amount} mỗi năm cho ${count} gói ${label}, chiếm ${share}% tổng.`,
      sourceYear: "Phần của bạn theo danh mục, tổng mỗi năm",
    },
    rank: {
      none: "Không có check-in nào để tính chi phí mỗi lần dùng.",
      noneNote: "Check-in số lần dùng mỗi gói trong 30 ngày qua là tính được.",
      source: "Xếp hạng chi phí mỗi lần dùng của báo cáo (check-in 30 ngày gần nhất)",
      sourceNone: "Xếp hạng chi phí mỗi lần dùng của báo cáo",
      worst: (name, per) => `Lãng phí nhất là ${name}. ${per}.`,
      best: (name, per) => `Đáng tiền nhất là ${name}. ${per}.`,
      perZero: "0 lần (chưa dùng lần nào)",
      perUse: (amount) => `${amount} mỗi lần`,
      skipped: "Gói chưa check-in hoặc không đo theo số lần không có trong xếp hạng.",
    },
    low: {
      source: "Đánh giá check-in 30 ngày gần nhất",
      unknown: (count) =>
        `${count} gói không có check-in trong 30 ngày gần nhất bị bỏ qua vì không biết bạn có dùng không.`,
      none: "Theo các check-in gần đây, không có gói nào gần như không dùng.",
      some: (count) => `Có ${count} gói gần như không dùng.`,
      monthly: (amount) => `${amount} mỗi tháng`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} gói trả theo năm không rõ tháng thanh toán bị bỏ qua vì không rõ ngày.`,
      sourceNone: "Ngày thanh toán tới",
      none: (days) => `Không có gói nào bị trừ trong ${days} ngày tới.`,
      some: (days, count) => `Có ${count} khoản thanh toán trong ${days} ngày tới.`,
      source: "Ngày thanh toán tới · phần của bạn mỗi khoản",
      date: (month, day) => `${day}/${Number(month)}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Ngày kết thúc dùng thử",
      none: (days) => `Không có bản dùng thử nào kết thúc trong ${days} ngày tới.`,
      noneNote: "Chỉ biết được những gói có ngày kết thúc dùng thử.",
      some: (count, days) => `${count} bản dùng thử miễn phí kết thúc trong ${days} ngày tới.`,
      today: "Kết thúc hôm nay",
      left: (days) => `Còn ${days} ngày`,
    },
    overlaps: {
      source: "Nội dung gói kết hợp · danh mục",
      bundleValue: (services) => `${services} bị trùng`,
      crowdedLabel: (label, count) => `${label}: ${count}`,
      none: "Không có gói nào bị trùng.",
      bundleHead: "Có thể bạn đang trả hai lần cho một số gói.",
      crowdedHead: "Bạn có nhiều gói trong cùng một danh mục.",
      note: "Dù cùng danh mục, mục đích có thể khác nhau. Hãy tự quyết định chúng có trùng không.",
    },
    service: {
      source: "Tên các gói đăng ký của bạn",
      notFound: (query) => `Không tìm thấy gói nào khớp với “${query}”.`,
      notFoundNote: "Hãy thử hỏi bằng tên khác.",
      manyUnnamed: (count) => `Có ${count} gói khớp. Hãy nói tên cụ thể hơn.`,
      many: (query, count) => `Có ${count} gói khớp với “${query}”. Hãy nói tên cụ thể hơn.`,
      plansSource: "Danh sách gói cước của dịch vụ",
      noPlans: (name) => `${name} không có danh sách gói cước để so sánh.`,
      planUnknown: (name) => `Không biết gói hiện tại của ${name} nên không so sánh được.`,
      planUnknownNote: "Chọn gói trong chi tiết gói đăng ký là so sánh được.",
      cheapest: (name) => `${name} đã ở gói rẻ nhất.`,
      best: (plan, saving) => `Đổi sang ${plan} giúp bạn tiết kiệm ${saving} mỗi năm.`,
      bestSource: "Danh sách gói cước của dịch vụ · giá niêm yết",
      saving: (amount) => `Tiết kiệm ${amount} mỗi năm`,
      current: (plan) => `Gói hiện tại: ${plan}`,
      shared: "Đây là gói dùng chung nên số tiền là toàn bộ khoản bị trừ trên thẻ.",
      detail: (name, amount) => `${name}: ${amount} mỗi tháng`,
      detailSource: "Chi tiết gói đăng ký · check-in",
      nextBilling: "Ngày thanh toán tới",
      inTrial: "Đang dùng thử miễn phí",
      unset: "Chưa đặt tháng thanh toán",
      checkIn: "Check-in, 30 ngày gần nhất",
      noRecord: "Không có dữ liệu",
    },
    saved: {
      none: "Bạn chưa hủy gói nào.",
      source: "Bản ghi hủy",
      month: (amount) => `Tháng này bạn giữ lại ${amount} nhờ hủy.`,
      year: (amount) => `Năm nay bạn giữ lại ${amount} nhờ hủy.`,
      sourceMonth: "Tiền giữ lại tháng này",
      sourceYear: "Tiền giữ lại năm nay",
      unknown: (count) =>
        `${count} gói không được tính vì không rõ tháng thanh toán hoặc ngày hủy.`,
    },
    compare: {
      note: "Ứng dụng không có dữ liệu chi tiêu từng tháng, nên chỉ so sánh các gói thêm hoặc hủy trong tháng này.",
      none: "Tháng này không có gói nào được thêm hay hủy.",
      noneSource: "Ngày thêm · ngày hủy",
      same: "Các gói thay đổi trong tháng này cộng lại bằng nhau.",
      up: (amount) => `Chi phí đăng ký hằng tháng của bạn tăng ${amount} trong tháng này.`,
      down: (amount) => `Chi phí đăng ký hằng tháng của bạn giảm ${amount} trong tháng này.`,
      source: "Ngày thêm · ngày hủy tháng này · phần của bạn mỗi tháng",
      killed: (name) => `Đã hủy ${name}`,
      added: (name) => `Đã thêm ${name}`,
    },
  },
};

export const fr: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "Combien me coûtent mes abonnements par mois ?",
      "Quel abonnement est le plus gaspillé ?",
      "Combien je dépense en streaming ?",
      "Combien est prélevé cette semaine ?",
      "Est-ce que certains abonnements font doublon ?",
    ],
    noSubs: {
      headline: "Vous n'avez encore ajouté aucun abonnement.",
      source: "Vos abonnements",
      note: "Ajoutez un abonnement pour pouvoir poser des questions.",
    },
    help: { headline: "Je vais chercher comment utiliser l'appli dans l'aide.", source: "Aide" },
    unsupported: {
      headline: "Je ne peux pas répondre à cela.",
      source: "Ce que vous pouvez demander",
      note: (list) => `Vous pouvez demander par exemple : ${list}`,
    },
    trialNote: (count) =>
      `${count} en essai gratuit ${akPl(count, "n'est", "ne sont")} pas encore ${akPl(count, "débité", "débités")}, ${akPl(count, "il a été écarté", "ils ont été écartés")}.`,
    spend: {
      month: (count, amount) =>
        `Vous payez ${amount} par mois pour ${count} abonnement${akPl(count, "", "s")}.`,
      year: (count, amount) =>
        `Vous payez ${amount} par an pour ${count} abonnement${akPl(count, "", "s")}.`,
      sourceMonth: "Votre part, total mensuel",
      sourceYear: "Votre part, total annuel",
    },
    category: {
      none: (label) => `Vous n'avez aucun abonnement dans ${label}.`,
      some: (label, count, amount, share) =>
        `Vous payez ${amount} par mois pour ${count} abonnement${akPl(count, "", "s")} dans ${label}, soit ${share} % de votre total.`,
      source: "Votre part par catégorie, total mensuel",
      someYear: (label, count, amount, share) =>
        `Vous payez ${amount} par an pour ${count} abonnement${akPl(count, "", "s")} dans ${label}, soit ${share} % de votre total.`,
      sourceYear: "Votre part par catégorie, total annuel",
    },
    rank: {
      none: "Aucun check-in ne permet de calculer un coût par utilisation.",
      noneNote:
        "Indiquez combien de fois vous avez utilisé chaque abonnement ces 30 derniers jours et il sera calculé.",
      source: "Classement du coût par utilisation du rapport (check-ins des 30 derniers jours)",
      sourceNone: "Classement du coût par utilisation du rapport",
      worst: (name, per) => `Le plus gaspillé est ${name}. ${per}.`,
      best: (name, per) => `Le plus rentable est ${name}. ${per}.`,
      perZero: "0 utilisation (pas une seule fois)",
      perUse: (amount) => `${amount} par utilisation`,
      skipped:
        "Les abonnements sans check-in ou non mesurés en utilisations sont exclus du classement.",
    },
    low: {
      source: "Évaluation des check-ins des 30 derniers jours",
      unknown: (count) =>
        `${count} sans check-in sur les 30 derniers jours ${akPl(count, "a été écarté", "ont été écartés")}, car nous ne savons pas si vous ${akPl(count, "l'utilisez", "les utilisez")}.`,
      none: "D'après vos check-ins récents, aucun abonnement n'est quasi inutilisé.",
      some: (count) =>
        `${count} abonnement${akPl(count, " est quasi inutilisé", "s sont quasi inutilisés")}.`,
      monthly: (amount) => `${amount} par mois`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} abonnement${akPl(count, " annuel", "s annuels")} sans mois de paiement ${akPl(count, "a été écarté", "ont été écartés")}, la date étant inconnue.`,
      sourceNone: "Prochaines dates de paiement",
      none: (days) => `Aucun abonnement n'est prélevé dans les ${days} prochains jours.`,
      some: (days, count) =>
        `${count} paiement${akPl(count, " est prévu", "s sont prévus")} dans les ${days} prochains jours.`,
      source: "Prochaines dates de paiement · votre part de chaque paiement",
      date: (month, day) => `${day} ${monthName("fr", month)}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Dates de fin d'essai",
      none: (days) => `Aucun essai gratuit ne se termine dans les ${days} prochains jours.`,
      noneNote: "Seuls les abonnements avec une date de fin d'essai peuvent être connus.",
      some: (count, days) =>
        `${count} essai${akPl(count, " gratuit se termine", "s gratuits se terminent")} dans les ${days} prochains jours.`,
      today: "Se termine aujourd'hui",
      left: (days) => `encore ${days} jour${akPl(days, "", "s")}`,
    },
    overlaps: {
      source: "Contenu des offres groupées · catégories",
      bundleValue: (services) => `${services} en double`,
      crowdedLabel: (label, count) => `${label} : ${count}`,
      none: "Aucun de vos abonnements ne fait doublon.",
      bundleHead: "Vous payez peut-être deux fois certains abonnements.",
      crowdedHead: "Vous avez plusieurs abonnements dans la même catégorie.",
      note: "Même dans une catégorie, ils peuvent avoir des usages différents. À vous de juger s'ils font doublon.",
    },
    service: {
      source: "Noms de vos abonnements",
      notFound: (query) => `Aucun abonnement ne correspond à « ${query} ».`,
      notFoundNote: "Essayez avec un autre nom.",
      manyUnnamed: (count) => `${count} abonnements correspondent. Précisez le nom.`,
      many: (query, count) => `${count} abonnements correspondent à « ${query} ». Précisez le nom.`,
      plansSource: "Liste des formules du service",
      noPlans: (name) => `${name} n'a pas de liste de formules à comparer.`,
      planUnknown: (name) =>
        `Nous ne connaissons pas la formule actuelle de ${name}, impossible de comparer.`,
      planUnknownNote:
        "Choisissez la formule dans le détail de l'abonnement pour pouvoir comparer.",
      cheapest: (name) => `${name} est déjà sur la formule la moins chère.`,
      best: (plan, saving) => `Passer à ${plan} vous fait économiser ${saving} par an.`,
      bestSource: "Liste des formules du service · prix affichés",
      saving: (amount) => `${amount} économisés par an`,
      current: (plan) => `Formule actuelle : ${plan}`,
      shared: "Abonnement partagé : les montants sont le prix total débité sur la carte.",
      detail: (name, amount) => `${name} : ${amount} par mois`,
      detailSource: "Détail de l'abonnement · check-ins",
      nextBilling: "Prochaine date de paiement",
      inTrial: "En essai gratuit",
      unset: "Mois de paiement non défini",
      checkIn: "Check-in, 30 derniers jours",
      noRecord: "Aucune donnée",
    },
    saved: {
      none: "Vous n'avez encore résilié aucun abonnement.",
      source: "Historique de résiliation",
      month: (amount) => `Les résiliations vous ont fait économiser ${amount} ce mois-ci.`,
      year: (amount) => `Les résiliations vous ont fait économiser ${amount} cette année.`,
      sourceMonth: "Argent économisé ce mois-ci",
      sourceYear: "Argent économisé cette année",
      unknown: (count) =>
        `${count} n'ont pas pu être inclus : mois de paiement ou date de résiliation inconnus.`,
    },
    compare: {
      note: "L'appli n'enregistre pas vos dépenses mois par mois : seule la comparaison des abonnements ajoutés ou résiliés ce mois-ci est possible.",
      none: "Aucun abonnement ajouté ou résilié ce mois-ci.",
      noneSource: "Dates d'ajout · dates de résiliation",
      same: "Les abonnements modifiés ce mois-ci s'équilibrent.",
      up: (amount) => `Votre coût mensuel d'abonnements a augmenté de ${amount} ce mois-ci.`,
      down: (amount) => `Votre coût mensuel d'abonnements a baissé de ${amount} ce mois-ci.`,
      source: "Dates d'ajout · de résiliation de ce mois · votre part mensuelle",
      killed: (name) => `${name} résilié`,
      added: (name) => `${name} ajouté`,
    },
  },
};

export const es: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "¿Cuánto me cuestan mis suscripciones al mes?",
      "¿Qué suscripción es la más desaprovechada?",
      "¿Cuánto gasto en streaming?",
      "¿Cuánto se cobra esta semana?",
      "¿Se solapan algunas de mis suscripciones?",
    ],
    noSubs: {
      headline: "Aún no has añadido ninguna suscripción.",
      source: "Tus suscripciones",
      note: "Añade una suscripción y podrás preguntar.",
    },
    help: { headline: "Buscaré en la ayuda cómo usar la app.", source: "Ayuda" },
    unsupported: {
      headline: "No puedo responder a eso.",
      source: "Lo que puedes preguntar",
      note: (list) => `Puedes preguntar cosas como: ${list}`,
    },
    trialNote: (count) =>
      `${count} en prueba gratuita aún no se ${akPl(count, "cobra", "cobran")}, así que se ${akPl(count, "dejó", "dejaron")} fuera.`,
    spend: {
      month: (count, amount) =>
        `Pagas ${amount} al mes por ${count} suscripci${akPl(count, "ón", "ones")}.`,
      year: (count, amount) =>
        `Pagas ${amount} al año por ${count} suscripci${akPl(count, "ón", "ones")}.`,
      sourceMonth: "Tu parte, total mensual",
      sourceYear: "Tu parte, total anual",
    },
    category: {
      none: (label) => `No tienes suscripciones en ${label}.`,
      some: (label, count, amount, share) =>
        `Pagas ${amount} al mes por ${count} en ${label}. Es el ${share} % de tu total.`,
      source: "Tu parte por categoría, total mensual",
      someYear: (label, count, amount, share) =>
        `Pagas ${amount} al año por ${count} en ${label}. Es el ${share} % de tu total.`,
      sourceYear: "Tu parte por categoría, total anual",
    },
    rank: {
      none: "No hay registros para calcular un coste por uso.",
      noneNote:
        "Registra cuántas veces usaste cada suscripción en los últimos 30 días y se podrá calcular.",
      source: "Ranking de coste por uso del informe (registros de los últimos 30 días)",
      sourceNone: "Ranking de coste por uso del informe",
      worst: (name, per) => `La más desaprovechada es ${name}. ${per}.`,
      best: (name, per) => `La más rentable es ${name}. ${per}.`,
      perZero: "0 usos (ni una vez)",
      perUse: (amount) => `${amount} por uso`,
      skipped:
        "Las suscripciones sin registro o que no se miden por usos quedan fuera del ranking.",
    },
    low: {
      source: "Evaluación de los registros de los últimos 30 días",
      unknown: (count) =>
        `${count} sin registro en los últimos 30 días se ${akPl(count, "dejó", "dejaron")} fuera porque no sabemos si ${akPl(count, "la usas", "las usas")}.`,
      none: "Según tus registros recientes, ninguna suscripción está casi sin usar.",
      some: (count) => `${count} suscripci${akPl(count, "ón está", "ones están")} casi sin usar.`,
      monthly: (amount) => `${amount} al mes`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} suscripci${akPl(count, "ón anual", "ones anuales")} sin mes de cobro se ${akPl(count, "dejó", "dejaron")} fuera porque se desconoce la fecha.`,
      sourceNone: "Próximas fechas de cobro",
      none: (days) => `Ninguna suscripción se cobra en los próximos ${days} días.`,
      some: (days, count) =>
        `Hay ${count} cobro${akPl(count, "", "s")} en los próximos ${days} días.`,
      source: "Próximas fechas de cobro · tu parte de cada cobro",
      date: (month, day) => `${day} de ${monthName("es", month)}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Fechas de fin de prueba",
      none: (days) => `Ninguna prueba gratuita termina en los próximos ${days} días.`,
      noneNote: "Solo se pueden conocer las suscripciones con fecha de fin de prueba.",
      some: (count, days) =>
        `${count} prueba${akPl(count, " gratuita termina", "s gratuitas terminan")} en los próximos ${days} días.`,
      today: "Termina hoy",
      left: (days) => `faltan ${days} día${akPl(days, "", "s")}`,
    },
    overlaps: {
      source: "Contenido de los paquetes · categorías",
      bundleValue: (services) => `${services} se solapa`,
      crowdedLabel: (label, count) => `${label}: ${count}`,
      none: "Ninguna de tus suscripciones se solapa.",
      bundleHead: "Puede que estés pagando dos veces algunas suscripciones.",
      crowdedHead: "Tienes varias suscripciones en la misma categoría.",
      note: "Aunque sean de la misma categoría, pueden tener usos distintos. Decide tú si se solapan.",
    },
    service: {
      source: "Nombres de tus suscripciones",
      notFound: (query) => `No se encontró una suscripción que coincida con «${query}».`,
      notFoundNote: "Prueba a preguntar con otro nombre.",
      manyUnnamed: (count) => `${count} suscripciones coinciden. Concreta un poco más el nombre.`,
      many: (query, count) =>
        `${count} suscripciones coinciden con «${query}». Concreta un poco más el nombre.`,
      plansSource: "Lista de planes del servicio",
      noPlans: (name) => `${name} no tiene una lista de planes para comparar.`,
      planUnknown: (name) => `No sabemos el plan actual de ${name}, así que no se puede comparar.`,
      planUnknownNote: "Elige el plan en el detalle de la suscripción y se podrá comparar.",
      cheapest: (name) => `${name} ya está en el plan más barato.`,
      best: (plan, saving) => `Cambiar a ${plan} te ahorra ${saving} al año.`,
      bestSource: "Lista de planes del servicio · precios de tarifa",
      saving: (amount) => `Ahorras ${amount} al año`,
      current: (plan) => `Plan actual: ${plan}`,
      shared:
        "Es una suscripción compartida, así que los importes son el precio total cobrado a la tarjeta.",
      detail: (name, amount) => `${name}: ${amount} al mes`,
      detailSource: "Detalle de la suscripción · registros",
      nextBilling: "Próxima fecha de cobro",
      inTrial: "En prueba gratuita",
      unset: "Mes de cobro sin definir",
      checkIn: "Registro, últimos 30 días",
      noRecord: "Sin registro",
    },
    saved: {
      none: "Aún no has cancelado ninguna suscripción.",
      source: "Registros de cancelación",
      month: (amount) => `Este mes cancelar te ahorró ${amount}.`,
      year: (amount) => `Este año cancelar te ahorró ${amount}.`,
      sourceMonth: "Dinero ahorrado este mes",
      sourceYear: "Dinero ahorrado este año",
      unknown: (count) =>
        `${count} no se pudieron incluir porque se desconoce el mes de cobro o la fecha de cancelación.`,
    },
    compare: {
      note: "La app no guarda lo que gastaste cada mes, así que solo compara las suscripciones añadidas o canceladas este mes.",
      none: "Este mes no se añadió ni canceló ninguna suscripción.",
      noneSource: "Fechas de alta · fechas de cancelación",
      same: "Las suscripciones que cambiaron este mes suman lo mismo.",
      up: (amount) => `Tu coste mensual de suscripciones subió ${amount} este mes.`,
      down: (amount) => `Tu coste mensual de suscripciones bajó ${amount} este mes.`,
      source: "Fechas de alta · de cancelación de este mes · tu parte mensual",
      killed: (name) => `Cancelada ${name}`,
      added: (name) => `Añadida ${name}`,
    },
  },
};

export const de: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "Wie viel kosten mich meine Abos im Monat?",
      "Welches Abo ist die größte Verschwendung?",
      "Wie viel gebe ich für Streaming aus?",
      "Wie viel wird diese Woche abgebucht?",
      "Überschneiden sich einige meiner Abos?",
    ],
    noSubs: {
      headline: "Du hast noch keine Abos hinzugefügt.",
      source: "Deine Abos",
      note: "Füg ein Abo hinzu, dann kannst du Fragen stellen.",
    },
    help: { headline: "Ich suche in der Hilfe, wie die App funktioniert.", source: "Hilfe" },
    unsupported: {
      headline: "Darauf kann ich nicht antworten.",
      source: "Was du fragen kannst",
      note: (list) => `Du kannst zum Beispiel fragen: ${list}`,
    },
    trialNote: (count) =>
      `${count} im kostenlosen Test ${akPl(count, "wird", "werden")} noch nicht abgebucht und ${akPl(count, "wurde", "wurden")} daher ausgelassen.`,
    spend: {
      month: (count, amount) =>
        `Du zahlst ${amount} im Monat für ${count} ${akPl(count, "Abo", "Abos")}.`,
      year: (count, amount) =>
        `Du zahlst ${amount} im Jahr für ${count} ${akPl(count, "Abo", "Abos")}.`,
      sourceMonth: "Dein Anteil, Monatssumme",
      sourceYear: "Dein Anteil, Jahressumme",
    },
    category: {
      none: (label) => `Du hast keine Abos in ${label}.`,
      some: (label, count, amount, share) =>
        `Du zahlst ${amount} im Monat für ${count} in ${label}. Das sind ${share} % deiner Gesamtsumme.`,
      source: "Dein Anteil nach Kategorie, Monatssumme",
      someYear: (label, count, amount, share) =>
        `Du zahlst ${amount} im Jahr für ${count} in ${label}. Das sind ${share} % deiner Gesamtsumme.`,
      sourceYear: "Dein Anteil nach Kategorie, Jahressumme",
    },
    rank: {
      none: "Es gibt keine Einträge, aus denen sich Kosten pro Nutzung berechnen lassen.",
      noneNote:
        "Trag ein, wie oft du jedes Abo in den letzten 30 Tagen genutzt hast, dann lässt es sich berechnen.",
      source: "Ranking der Kosten pro Nutzung im Bericht (Einträge der letzten 30 Tage)",
      sourceNone: "Ranking der Kosten pro Nutzung im Bericht",
      worst: (name, per) => `Die größte Verschwendung ist ${name}. ${per}.`,
      best: (name, per) => `Am meisten lohnt sich ${name}. ${per}.`,
      perZero: "0 Nutzungen (kein einziges Mal)",
      perUse: (amount) => `${amount} pro Nutzung`,
      skipped: "Abos ohne Eintrag oder nicht nach Nutzungen gemessen fehlen im Ranking.",
    },
    low: {
      source: "Bewertung der Einträge der letzten 30 Tage",
      unknown: (count) =>
        `${count} ohne Eintrag in den letzten 30 Tagen ${akPl(count, "wurde", "wurden")} ausgelassen, weil wir nicht wissen, ob du ${akPl(count, "es", "sie")} nutzt.`,
      none: "Nach deinen letzten Einträgen wird keines deiner Abos kaum genutzt.",
      some: (count) => `${count} ${akPl(count, "Abo wird", "Abos werden")} kaum genutzt.`,
      monthly: (amount) => `${amount} im Monat`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} ${akPl(count, "Jahresabo", "Jahresabos")} ohne bekannten Abbuchungsmonat ${akPl(count, "wurde", "wurden")} ausgelassen, da das Datum unbekannt ist.`,
      sourceNone: "Nächste Abbuchungstage",
      none: (days) => `In den nächsten ${days} Tagen wird kein Abo abgebucht.`,
      some: (days, count) =>
        `In den nächsten ${days} Tagen ${akPl(count, "steht", "stehen")} ${count} ${akPl(count, "Abbuchung", "Abbuchungen")} an.`,
      source: "Nächste Abbuchungstage · dein Anteil an jeder Zahlung",
      date: (month, day) => `${day}. ${monthName("de", month)}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Testende",
      none: (days) => `In den nächsten ${days} Tagen endet kein kostenloser Test.`,
      noneNote: "Bekannt sind nur Abos mit eingetragenem Testende.",
      some: (count, days) =>
        `${count} ${akPl(count, "kostenloser Test endet", "kostenlose Tests enden")} in den nächsten ${days} Tagen.`,
      today: "Endet heute",
      left: (days) => `noch ${days} ${akPl(days, "Tag", "Tage")}`,
    },
    overlaps: {
      source: "Paketinhalte · Kategorien",
      bundleValue: (services) => `${services} doppelt`,
      crowdedLabel: (label, count) => `${label}: ${count}`,
      none: "Keines deiner Abos überschneidet sich.",
      bundleHead: "Für manche Abos zahlst du vielleicht doppelt.",
      crowdedHead: "Du hast mehrere Abos in derselben Kategorie.",
      note: "Auch in derselben Kategorie können sie unterschiedlichen Zwecken dienen. Entscheide selbst, ob sie sich überschneiden.",
    },
    service: {
      source: "Namen deiner Abos",
      notFound: (query) => `Kein Abo passt zu „${query}“.`,
      notFoundNote: "Frag mit einem anderen Namen.",
      manyUnnamed: (count) => `${count} Abos passen. Bitte nenn den Namen genauer.`,
      many: (query, count) => `${count} Abos passen zu „${query}“. Bitte nenn den Namen genauer.`,
      plansSource: "Tarifliste des Dienstes",
      noPlans: (name) => `${name} hat keine Tarifliste zum Vergleichen.`,
      planUnknown: (name) =>
        `Der aktuelle Tarif von ${name} ist unbekannt, daher kein Vergleich möglich.`,
      planUnknownNote: "Wähl den Tarif in den Abo-Details, dann lässt er sich vergleichen.",
      cheapest: (name) => `${name} ist bereits im günstigsten Tarif.`,
      best: (plan, saving) => `Ein Wechsel zu ${plan} spart dir ${saving} im Jahr.`,
      bestSource: "Tarifliste des Dienstes · Listenpreise",
      saving: (amount) => `${amount} im Jahr gespart`,
      current: (plan) => `Aktueller Tarif: ${plan}`,
      shared:
        "Das ist ein geteiltes Abo, daher sind die Beträge der volle Preis, der von der Karte abgebucht wird.",
      detail: (name, amount) => `${name}: ${amount} im Monat`,
      detailSource: "Abo-Details · Einträge",
      nextBilling: "Nächster Abbuchungstag",
      inTrial: "Im kostenlosen Test",
      unset: "Abbuchungsmonat nicht festgelegt",
      checkIn: "Eintrag, letzte 30 Tage",
      noRecord: "Kein Eintrag",
    },
    saved: {
      none: "Du hast noch keine Abos gekündigt.",
      source: "Kündigungseinträge",
      month: (amount) => `Durch Kündigen hast du diesen Monat ${amount} gespart.`,
      year: (amount) => `Durch Kündigen hast du dieses Jahr ${amount} gespart.`,
      sourceMonth: "Diesen Monat gespartes Geld",
      sourceYear: "Dieses Jahr gespartes Geld",
      unknown: (count) =>
        `${count} konnten nicht einbezogen werden, weil Abbuchungsmonat oder Kündigungsdatum unbekannt ist.`,
    },
    compare: {
      note: "Die App speichert keine monatlichen Ausgaben, daher werden nur die diesen Monat hinzugefügten oder gekündigten Abos verglichen.",
      none: "Diesen Monat wurde kein Abo hinzugefügt oder gekündigt.",
      noneSource: "Hinzufügedaten · Kündigungsdaten",
      same: "Die diesen Monat geänderten Abos gleichen sich aus.",
      up: (amount) => `Deine monatlichen Abokosten sind diesen Monat um ${amount} gestiegen.`,
      down: (amount) => `Deine monatlichen Abokosten sind diesen Monat um ${amount} gesunken.`,
      source: "Hinzufüge- · Kündigungsdaten dieses Monats · dein Monatsanteil",
      killed: (name) => `${name} gekündigt`,
      added: (name) => `${name} hinzugefügt`,
    },
  },
};

export const pt: Widen<typeof ko> = {
  ask: {
    suggestions: [
      "Quanto minhas assinaturas custam por mês?",
      "Qual assinatura é o maior desperdício?",
      "Quanto gasto com streaming?",
      "Quanto vai ser cobrado esta semana?",
      "Alguma das minhas assinaturas se sobrepõe?",
    ],
    noSubs: {
      headline: "Você ainda não adicionou nenhuma assinatura.",
      source: "Suas assinaturas",
      note: "Adicione uma assinatura e você poderá perguntar.",
    },
    help: { headline: "Vou procurar na ajuda como usar o app.", source: "Ajuda" },
    unsupported: {
      headline: "Não consigo responder isso.",
      source: "O que você pode perguntar",
      note: (list) => `Você pode perguntar coisas como: ${list}`,
    },
    trialNote: (count) =>
      `${count} em teste grátis ainda não ${akPl(count, "foi cobrada", "foram cobradas")}, então ${akPl(count, "ficou", "ficaram")} de fora.`,
    spend: {
      month: (count, amount) =>
        `Você paga ${amount} por mês por ${count} assinatura${akPl(count, "", "s")}.`,
      year: (count, amount) =>
        `Você paga ${amount} por ano por ${count} assinatura${akPl(count, "", "s")}.`,
      sourceMonth: "Sua parte, total mensal",
      sourceYear: "Sua parte, total anual",
    },
    category: {
      none: (label) => `Você não tem assinaturas em ${label}.`,
      some: (label, count, amount, share) =>
        `Você paga ${amount} por mês por ${count} em ${label}. Isso é ${share}% do seu total.`,
      source: "Sua parte por categoria, total mensal",
      someYear: (label, count, amount, share) =>
        `Você paga ${amount} por ano por ${count} em ${label}. Isso é ${share}% do seu total.`,
      sourceYear: "Sua parte por categoria, total anual",
    },
    rank: {
      none: "Não há registros para calcular o custo por uso.",
      noneNote:
        "Registre quantas vezes usou cada assinatura nos últimos 30 dias e dá para calcular.",
      source: "Ranking de custo por uso do relatório (registros dos últimos 30 dias)",
      sourceNone: "Ranking de custo por uso do relatório",
      worst: (name, per) => `O maior desperdício é ${name}. ${per}.`,
      best: (name, per) => `A que mais compensa é ${name}. ${per}.`,
      perZero: "0 usos (nenhuma vez)",
      perUse: (amount) => `${amount} por uso`,
      skipped: "Assinaturas sem registro ou não medidas por usos ficam fora do ranking.",
    },
    low: {
      source: "Avaliação dos registros dos últimos 30 dias",
      unknown: (count) =>
        `${count} sem registro nos últimos 30 dias ${akPl(count, "ficou", "ficaram")} de fora porque não sabemos se você ${akPl(count, "a usa", "as usa")}.`,
      none: "Pelos registros recentes, nenhuma assinatura está quase sem uso.",
      some: (count) => `${count} assinatura${akPl(count, " está", "s estão")} quase sem uso.`,
      monthly: (amount) => `${amount} por mês`,
    },
    upcoming: {
      unknown: (count) =>
        `${count} assinatura${akPl(count, " anual", "s anuais")} sem mês de cobrança ${akPl(count, "ficou", "ficaram")} de fora porque a data é desconhecida.`,
      sourceNone: "Próximas datas de cobrança",
      none: (days) => `Nenhuma assinatura é cobrada nos próximos ${days} dias.`,
      some: (days, count) =>
        `Há ${count} cobrança${akPl(count, "", "s")} nos próximos ${days} dias.`,
      source: "Próximas datas de cobrança · sua parte de cada cobrança",
      date: (month, day) => `${day} de ${monthName("pt", month)}`,
      row: (date, name) => `${date} ${name}`,
    },
    trials: {
      source: "Datas de fim do teste",
      none: (days) => `Nenhum teste grátis termina nos próximos ${days} dias.`,
      noneNote: "Só dá para saber das assinaturas com data de fim do teste.",
      some: (count, days) =>
        `${count} teste${akPl(count, " grátis termina", "s grátis terminam")} nos próximos ${days} dias.`,
      today: "Termina hoje",
      left: (days) => `faltam ${days} dia${akPl(days, "", "s")}`,
    },
    overlaps: {
      source: "Conteúdo dos pacotes · categorias",
      bundleValue: (services) => `${services} se sobrepõe`,
      crowdedLabel: (label, count) => `${label}: ${count}`,
      none: "Nenhuma das suas assinaturas se sobrepõe.",
      bundleHead: "Você pode estar pagando duas vezes por algumas assinaturas.",
      crowdedHead: "Você tem várias assinaturas na mesma categoria.",
      note: "Mesmo na mesma categoria, podem servir a usos diferentes. Decida você se elas se sobrepõem.",
    },
    service: {
      source: "Nomes das suas assinaturas",
      notFound: (query) => `Não encontramos uma assinatura que corresponda a “${query}”.`,
      notFoundNote: "Tente perguntar com outro nome.",
      manyUnnamed: (count) => `${count} assinaturas correspondem. Seja mais específico no nome.`,
      many: (query, count) =>
        `${count} assinaturas correspondem a “${query}”. Seja mais específico no nome.`,
      plansSource: "Lista de planos do serviço",
      noPlans: (name) => `${name} não tem lista de planos para comparar.`,
      planUnknown: (name) => `Não sabemos o plano atual de ${name}, então não dá para comparar.`,
      planUnknownNote: "Escolha o plano no detalhe da assinatura e dá para comparar.",
      cheapest: (name) => `${name} já está no plano mais barato.`,
      best: (plan, saving) => `Mudar para ${plan} economiza ${saving} por ano.`,
      bestSource: "Lista de planos do serviço · preços de tabela",
      saving: (amount) => `Economia de ${amount} por ano`,
      current: (plan) => `Plano atual: ${plan}`,
      shared:
        "É uma assinatura compartilhada, então os valores são o preço total cobrado no cartão.",
      detail: (name, amount) => `${name}: ${amount} por mês`,
      detailSource: "Detalhe da assinatura · registros",
      nextBilling: "Próxima data de cobrança",
      inTrial: "Em teste grátis",
      unset: "Mês de cobrança não definido",
      checkIn: "Registro, últimos 30 dias",
      noRecord: "Sem registro",
    },
    saved: {
      none: "Você ainda não cancelou nenhuma assinatura.",
      source: "Registros de cancelamento",
      month: (amount) => `Cancelar economizou ${amount} este mês.`,
      year: (amount) => `Cancelar economizou ${amount} este ano.`,
      sourceMonth: "Dinheiro economizado este mês",
      sourceYear: "Dinheiro economizado este ano",
      unknown: (count) =>
        `${count} não puderam entrar porque o mês de cobrança ou a data de cancelamento é desconhecida.`,
    },
    compare: {
      note: "O app não guarda quanto você gastou em cada mês, então só compara as assinaturas adicionadas ou canceladas este mês.",
      none: "Nenhuma assinatura foi adicionada ou cancelada este mês.",
      noneSource: "Datas de cadastro · datas de cancelamento",
      same: "As assinaturas que mudaram este mês somam o mesmo valor.",
      up: (amount) => `Seu custo mensal com assinaturas subiu ${amount} este mês.`,
      down: (amount) => `Seu custo mensal com assinaturas caiu ${amount} este mês.`,
      source: "Datas de cadastro · de cancelamento deste mês · sua parte mensal",
      killed: (name) => `${name} cancelada`,
      added: (name) => `${name} adicionada`,
    },
  },
};
