import { METRIC_SPECS, type ValueMetric } from "@subslash/shared";
import type { Widen } from "../types";
import { one } from "../english";
import { planName } from "../../service-name";
import { monthName } from "../months";

/** 요금제 이름은 서비스 목록의 한국어 이름으로 넘어오므로 영어 문구가 바꿔 적는다(lib/service-name). */
const plan = (name: string) => planName(name, "en");

/** 한국어 원문은 `METRIC_SPECS`가 가진다. 없는 칸(힌트·단가 앞말)은 빈 글자로 둔다. */
function koMetric(metric: ValueMetric) {
  const spec = METRIC_SPECS[metric];
  return {
    question: spec.question,
    hint: spec.hint ?? "",
    unit: spec.unit,
    quantityLabel: spec.quantityLabel,
    perUnit: spec.perUnit ?? "",
  };
}

/** '약 800GB', '약 1.2TB', '1GB 미만' (한국어). */
function koGB(raw: number): string {
  const gb = Number(raw);
  if (gb < 1) return "1GB 미만";
  if (gb < 1000) return `약 ${Math.round(gb)}GB`;
  const tb = gb / 1000;
  return `약 ${Number.isInteger(Math.round(tb * 10) / 10) ? Math.round(tb) : tb.toFixed(1)}TB`;
}

/** 'times'·'days'·'hours'는 1일 때 단수로 쓴다('1 hours'로 보였다). 그 밖의 단위(KRW·%)는 그대로다. */
function enUnit(value: number, unit: string): string {
  return value === 1 && /^(times|days|hours)$/.test(unit) ? unit.slice(0, -1) : unit;
}

function enGB(raw: number): string {
  const gb = Number(raw);
  if (gb < 1) return "under 1GB";
  if (gb < 1000) return `about ${Math.round(gb)}GB`;
  const tb = gb / 1000;
  return `about ${Number.isInteger(Math.round(tb * 10) / 10) ? Math.round(tb) : tb.toFixed(1)}TB`;
}

/** 체크인: 질문·입력·결과·근거·기록·저장 공간 측정. 결과 문장은 `lib/i18n/check-in-outcome`이 이 틀에 값을 넣는다. */
export const ko = {
  metric: {
    uses: koMetric("uses"),
    days: koMetric("days"),
    hours: koMetric("hours"),
    benefit: koMetric("benefit"),
    storage: koMetric("storage"),
  },
  input: {
    presetLabel: (value: number, unit: string) => `${value}${unit}`,
    /** 숫자 옆에 붙는 단위. 영어는 1이면 단수('1 hour')로 쓴다. */
    unitFor: (_value: number, unit: string) => unit,
    presetBenefit: (value: number) =>
      value === 0 ? "0원" : value % 10000 === 0 ? `${value / 10000}만` : `${value / 1000}천`,
    choose: "골라 주세요",
    decrease: (step: number, unit: string) => `${step}${unit} 빼기`,
    increase: (step: number, unit: string) => `${step}${unit} 더하기`,
    storageOf: (plan: string, used: string) => `${plan} 중 ${used}`,
    storageGB: koGB,
    orderEvidence: (since: string, count: number) => `Gmail에서 ${since} 이후 주문 메일 ${count}통`,
    orderEvidenceNote:
      "을 찾았어요. 가져온 메일 안에서 센 것이라 실제보다 적을 수 있어요. 그 주문에서 받은 무료 배송·할인을 더해 주세요.",
    sinceDate: (month: number, day: number) => `${month}월 ${day}일`,
    benefitNumberLocale: "ko-KR",
  },
  modal: {
    title: (name: string) => `${name} 이용량 체크인`,
    usesQuestion: "최근 30일 동안 몇 번 썼어요?",
    usesQuestionBefore: "지난 30일 동안 ",
    usesQuestionAfter: "을(를)\n몇 번 썼나요?",
    timesUnit: "회",
    submit: "가성비 분석 결과 보기",
    noResult: "결과를 확인하세요",
    accountTitle: "해지 시 로그인 계정 안내",
    copied: "복사했어요",
    copyId: "ID 복사",
    accountBefore: "이 구독은 ",
    accountAfter: " 계정으로 로그인해야 해지 메뉴가 보여요.",
    accountUnknown: "가입한 계정으로 로그인하세요.",
    paymentMethod: "결제 수단: ",
    openGuide: "해지 가이드 열기",
    close: "닫기",
    newWindow: (label: string) => `${label} (새 창)`,
    cancelPage: (name: string) => `${name} 해지 페이지 바로가기 (새 창)`,
    openService: (name: string) => `${name} 열기 (새 창)`,
    paymentCancel: (name: string, direct: boolean) =>
      direct ? `${name} 정기결제 관리 열기` : `${name} 열기`,
  },
  outcome: {
    unused: (amount: string) =>
      `이번 달 ${amount}을 공중에 버리셨습니다. 지금 바로 킬(Kill) 스위치를 켜세요.`,
    once: (name: string, amount: string) => `이번 달 ${name} 1회를 ${amount}에 이용하셨습니다.`,
    perUse: (name: string, cost: string) => `이번 달 ${name} 1회당 ${cost}을 지출하셨습니다.`,
    daysNone: (name: string, monthly: string) =>
      `최근 30일 동안 ${name}을(를) 하루도 안 썼어요. ${monthly}을 그냥 냈어요.`,
    daysSome: (name: string, cost: string) => `${name}을(를) 쓴 날 하루에 ${cost}씩 냈어요.`,
    hoursNone: (name: string, monthly: string) =>
      `최근 30일 동안 ${name}을(를) 안 썼어요. ${monthly}을 그냥 냈어요.`,
    hoursSome: (name: string, cost: string) => `${name} 한 시간에 ${cost}씩 냈어요.`,
    benefitOver: (monthly: string, benefit: string) =>
      `회비 ${monthly}보다 많은 ${benefit}을 혜택으로 돌려받았어요.`,
    benefitUnder: (monthly: string, benefit: string) =>
      `회비 ${monthly} 중 ${benefit}만 혜택으로 돌려받았어요.`,
    storageEmpty: (name: string) =>
      `${name}에 아무것도 두지 않았다면 요금제가 필요 없을 수 있어요.`,
    storageUsed: (plan: string, percent: number, gb: string) =>
      `${plan} 중 ${percent}%(${gb})를 쓰고 있어요.`,
    storageSmaller: (name: string, used: string, plan: string, amount: string) =>
      `${name} ${used} ${plan} 요금제(${amount})에도 여유 있게 들어가요.`,
    storageBundled: (name: string, used: string, extras: string) =>
      `${name} ${used} 용량만 보면 더 작은 요금제에 들어가지만, 그 요금제에는 ${extras}이 없어 용량만으로 판단하지 않아요.`,
    storageNoSmaller: (name: string, used: string) =>
      `${name} ${used} 더 작은 요금제에는 여유 있게 들어가지 않아요.`,
    storageLowUnknownPlan: (name: string, percent: number) =>
      `${name} 요금제 용량의 ${percent}%를 쓰고 있어요. 요금제를 골라 두면 더 작은 요금제에 들어가는지 알려 드려요.`,
    storageUnknownPlan: (name: string, percent: number) =>
      `${name} 요금제 용량의 ${percent}%를 쓰고 있어요.`,
    freeTierEnough: "무료 요금제로도 충분했다면, 해지하지 않고 무료로 내려도 돼요.",
    tokensOver: (times: string) =>
      `PC의 토큰 사용량을 API 요금으로 환산하면 구독료의 ${times}배예요 — 쓴 날이 적어도 본전은 뽑았어요.`,
    tokensUnder: (percent: number) =>
      `PC의 토큰 사용량은 API 요금으로 구독료의 ${percent}%예요. 웹·앱에서 쓴 것은 빠져 있어 쓴 날로 판단했어요.`,
  },
  metaphor: {
    unusedComparison: (item: string) => `${item} 세이브 기회`,
    unusedMessage: (name: string, item: string, amount: string) =>
      `이번 달 ${name} 이용이 없었어요. 잠시 구독을 쉬어가면 매달 ${item} 값(${amount})을 아낄 수 있어요.`,
    movieComparison: (item: string) => `${item} 세이브 기회`,
    movieMessage: (cost: string) =>
      `이번 달 1회 이용에 그쳤다면, 잠시 일시정지하고 영화관 티켓 1장 값(${cost})을 세이브해보는 건 어떨까요?`,
    onceComparison: (item: string) => `${item} 세이브 기회`,
    onceMessage: (item: string, cost: string) =>
      `이번 달 1회 이용했어요. 지금 잠시 쉬어가면 매달 ${item} 값(${cost})을 아낄 수 있어요.`,
    warningComparison: (item: string) => `${item} 수준`,
    warningMessage: (cost: string) =>
      `1회당 ${cost} — 조금만 더 자주 쓰면 본전 달성! 알차게 즐겨보세요.`,
    cheapComparison: "커피 한 잔보다 알뜰하게",
    cheapMessage: (cost: string) =>
      `1회당 ${cost} — 커피 한 잔보다 알뜰하게 즐겼어요! 본전 달성 완료`,
    worthComparison: (item: string) => `${item} 가치`,
    worthMessage: (cost: string) => `1회당 ${cost} — 낸 돈 이상으로 알차게 활용하고 있어요!`,
  },
  gauge: {
    none: "이번 달 이용이 아직 없어요. 더 자주 쓰거나, 잠시 쉬어가며 지출을 아낄 수 있어요.",
    remaining: (n: number) => `본전까지 앞으로 ${n}회 더 이용하면 달성!`,
    done: "본전 달성 완료! 알뜰하게 활용 중이에요.",
    diet: (cost: string) => `지출 다이어트 추천 (회당 ${cost})`,
    achieved: (cost: string) => `본전 달성 완료! (회당 ${cost})`,
    baseline: "본전 기준선",
  },
  bar: {
    label: "1회 이용당 비용",
    footer: (count: number, monthly: string) => `총 ${count}회 이용 · 월 ${monthly} 기준`,
  },
  appResult: {
    green: "뽕 뽑는 중",
    yellow: "애매해요",
    red: "쉬어가도 될 구독",
    perUse: "1회당",
    unusedNote: (monthly: string) =>
      `최근 30일 동안 안 썼어요. 쉬어가면 한 달 ${monthly}를 아껴요.`,
    redNote: (monthly: string) => `쉬어가면 한 달 ${monthly}를 아껴요.`,
    remainingNote: (n: number) => `${n}번 더 쓰면 본전이에요.`,
    doneNote: "낸 돈 이상으로 쓰고 있어요.",
    summary: (count: number, monthly: string) => `최근 30일 ${count}회 · 한 달 ${monthly}`,
    toBreakEven: "본전까지",
    progress: (current: number, target: number) => `${current} / ${target}회`,
    progressLabel: "본전까지 사용 횟수",
    cancelGuide: "해지 안내 보기",
    keep: "계속 쓸게요",
    confirm: "확인",
  },
  picker: {
    unit: "회",
    chooseBar: "막대를 눌러 골라 주세요",
    notUsed: "안 썼어요",
    perUse: (cost: string) => `회당 ${cost}`,
    ariaLabel: "사용 횟수",
    valueText: (n: number, max: boolean) => (max ? "10회 이상" : `${n}회`),
    phone: "폰",
    typeExact: "10번 넘게 썼다면 직접 입력",
  },
  addCheckIn: {
    registered: "등록했어요",
    perMonth: "/월",
    note: "가성비 계산서에 바로 들어가요. 나중에 고칠 수 있어요.",
    justJoined: "최근에 가입했어요",
    done: "완료",
    later: "나중에 할게요",
  },
  history: {
    deviceApp: { android: "Android 앱", ios: "iOS 앱" },
    deviceWeb: (os: string | null, mobile: boolean) =>
      `${os ? `${os} ` : ""}${mobile ? "휴대폰" : "PC"} 웹`,
    deviceLine: (device: string, here: boolean) =>
      `체크인한 기기: ${device}${here ? " (이 기기)" : ""}`,
    phoneHours:
      "폰 기록으로 자동 체크인 · 앱을 쓴 시간과 재생 알림이 떠 있던 시간 중 긴 쪽이에요. 일시정지 시간이 섞일 수 있어요",
    phoneDays: "폰 기록으로 자동 체크인 · 이 폰에서 쓴 날이에요. PC에서 쓴 날은 빠져 있어요",
    phoneOther: "폰 기록으로 자동 체크인 · 다른 기기에서 쓴 건 빠져 있어요",
    title: (count: number) => `체크인 기록 (${count}건)`,
    add: "+ 체크인 하기",
    empty: "아직 체크인 기록이 없어요. 이번 달 이용 횟수를 넣어 보세요.",
    monthRecord: (month: string) => `${month} 사용 기록`,
    chartTitle: "달별 체크인",
    chartGap: "점선은 체크인하지 않은 달이에요. 안 쓴 달이 아니라 모르는 달이에요.",
    chartOtherMetric: (count: number) => `다른 기준으로 센 체크인 ${count}건은 막대에서 뺐어요.`,
    pcTokens: (tokens: string, apiValue: string | null) =>
      `PC 기록: 토큰 ${tokens}개${apiValue ? ` · API 요금으로 ${apiValue}` : ""}`,
  },
  evidence: {
    label: "체크인 근거",
    title: "체크인으로 본 근거",
    average: (count: number) => `최근 ${count}회 체크인 평균`,
    last: (perUnit: string) => `마지막 체크인${perUnit ? ` ${perUnit}` : ""}`,
    recorded: (date: string, quantity: string) => `${date} 기록 · ${quantity}`,
    versusPrevious: "직전 체크인 대비",
    increased: (amount: string) => `${amount} 늘었음`,
    decreased: (amount: string) => `${amount} 줄었음`,
    same: "그대로",
    costSame: (perUnit: string) => `${perUnit} 비용 그대로`,
    costUp: (perUnit: string, amount: string) => `${perUnit} ${amount} 비싸짐`,
    costDown: (perUnit: string, amount: string) => `${perUnit} ${amount} 싸짐`,
    notEnough: "비교할 기록 부족",
    notEnoughHint: "체크인이 한 번 더 쌓이면 비교합니다",
    priceChanged: "두 체크인 사이에 요금(내 몫)이 바뀌어, 단가 변화에는 요금 변화도 섞여 있습니다.",
    selfReported:
      "숫자는 체크인 때 적은 값입니다. 폰 기록으로 자동 체크인한 것은 이 폰의 기록이라, 다른 기기에서 쓴 것은 빠져 있습니다.",
    unknownDate: "날짜 모름",
    amountOf: (metric: string, n: string) => `${n}${metric}`,
    dateLocale: "ko-KR",
  },
  flow: {
    reminderOn: "결제 알림을 켰어요. 몇 초 뒤 시험 알림이 떠요.",
    done: (name: string) => `${name} 체크인 완료`,
    failed: "체크인하지 못했어요. 다시 시도해 주세요.",
  },
  storage: {
    measure: "Google 계정에서 사용량 측정",
    waiting: "열린 화면에서 Google 권한을 허용하면 비율을 채워요.",
    idle: "Google 계정의 저장 용량을 읽어 비율을 채워요. 숫자는 SubSlash 서버로 보내지 않아요.",
    noValue: "측정값을 받지 못했어요. 웹 앱 화면의 비율을 직접 적거나 다시 측정해 주세요.",
    failed: "Google에서 용량을 받지 못했어요. 잠시 뒤 다시 측정해 주세요.",
    noLimit: "이 Google 계정은 한도가 정해져 있지 않아 비율을 셀 수 없어요. 직접 적어 주세요.",
    measured: (limit: string, usage: string) =>
      `Google 계정 한도 ${limit} 중 ${usage}를 쓰고 있어요.`,
    family: (measured: string) =>
      `${measured} 가족과 나누는 구독이라 이 계정의 사용량만으로는 요금제 전체의 비율을 알 수 없어 채우지 않았어요.`,
    planMismatch: (measured: string, plan: string) =>
      `${measured} 등록한 요금제(${plan})와 한도가 달라 채우지 않았어요. 다른 계정이거나 가족·회사 계정의 한도일 수 있어요.`,
    underOne: " 1% 미만이라 1%로 채웠어요.",
    choosePlan: " 요금제를 골라 두면 한도가 요금제와 맞는지 확인해요.",
    doneReading: "측정값을 넘기는 중",
    doneFilled: "체크인에 채웠어요",
    doneFilledHint: "이 탭을 닫고 체크인 창에서 확인한 뒤 체크인을 눌러 주세요.",
    doneFailed: "측정값을 받지 못했어요",
    doneFailedHint: "이 탭을 닫고 체크인 창에서 다시 측정해 주세요.",
  },
  freeTier: {
    needed: "아니요, 유료가 필요했어요",
    enough: "네, 무료로도 됐을 거예요",
    unsure: "잘 모르겠어요",
    question: "무료 요금제로도 충분했을까요?",
    hint: "사용 한도에 걸렸거나 유료 모델·기능을 썼다면 유료가 필요했던 거예요.",
  },
  /** 체크인 링크(/check-in)로 열었는데 체크인할 수 없을 때. */
  link: {
    invalidTitle: "잘못된 체크인 링크예요",
    invalidBody: "메일의 버튼을 다시 누르거나 대시보드에서 체크인하세요.",
    missingTitle: "이 기기에는 이 구독이 없어요",
    missingBody: "등록한 기기에서 링크를 열거나, 로그인해 기기끼리 기록을 맞추세요.",
    killedTitle: "이미 해지한 구독입니다",
    killedBody: (name: string) => `'${name}'은(는) 해지한 구독이라 체크인을 남기지 않았어요.`,
    dashboard: "대시보드 →",
  },
};

export const en: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "How many times did you use it in the last 30 days?",
      hint: "",
      unit: "times",
      quantityLabel: "Uses in 30 days",
      perUnit: "Per use",
    },
    days: {
      question: "On how many of the last 30 days did you use it?",
      hint: "Several times in one day still counts as one day. Count phone and PC.",
      unit: "days",
      quantityLabel: "Days used out of 30",
      perUnit: "Per day",
    },
    hours: {
      question: "About how many hours did you use it in the last 30 days?",
      hint: "Include time on a TV or PC and listening with the screen off. 30 minutes a day is 15 hours.",
      unit: "hours",
      quantityLabel: "Hours used in 30 days",
      perUnit: "Per hour",
    },
    benefit: {
      question: "How much in benefits did you get in the last 30 days?",
      hint: "Add up what you would have paid without the membership: free shipping, discounts, points.",
      unit: "KRW",
      quantityLabel: "Benefits received in 30 days",
      perUnit: "",
    },
    storage: {
      question: "How much of your plan's storage are you using?",
      hint: "You can see it in your device's storage settings (for iCloud: Settings › your name › iCloud).",
      unit: "%",
      quantityLabel: "Share of plan storage used",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => (unit === "%" ? `${value}%` : `${value} ${enUnit(value, unit)}`),
    unitFor: enUnit,
    presetBenefit: (value) => (value === 0 ? "₩0" : `₩${value / 1000}k`),
    choose: "Pick one",
    decrease: (step, unit) => `Subtract ${step} ${enUnit(step, unit)}`,
    increase: (step, unit) => `Add ${step} ${enUnit(step, unit)}`,
    storageOf: (plan, used) => `${used} of ${plan}`,
    storageGB: enGB,
    orderEvidence: (since, count) =>
      `${count} order ${one(count) ? "email" : "emails"} in Gmail since ${since}`,
    orderEvidenceNote:
      " found. That's counted within the emails we could read, so it may be lower than the real number. Add the free shipping and discounts you got on those orders.",
    sinceDate: (month, day) =>
      `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(month) - 1] ?? month} ${day}`,
    benefitNumberLocale: "en-US",
  },
  modal: {
    title: (name) => `${name} usage check-in`,
    usesQuestion: "How many times did you use it in the last 30 days?",
    usesQuestionBefore: "In the last 30 days, how many times did you use ",
    usesQuestionAfter: "?",
    timesUnit: "×",
    submit: "See the value analysis",
    noResult: "Check the result",
    accountTitle: "Which account to log in with to cancel",
    copied: "Copied",
    copyId: "Copy ID",
    accountBefore: "You need to log in with the account ",
    accountAfter: " to see the cancel menu.",
    accountUnknown: "Log in with the account you signed up with.",
    paymentMethod: "Payment method: ",
    openGuide: "Open the cancel guide",
    close: "Close",
    newWindow: (label) => `${label} (new window)`,
    cancelPage: (name) => `Go straight to the ${name} cancel page (new window)`,
    openService: (name) => `Open ${name} (new window)`,
    paymentCancel: (name, direct) =>
      direct ? `Manage recurring payments in ${name}` : `Open ${name}`,
  },
  outcome: {
    unused: (amount) => `You threw ${amount} away this month. Flip the Kill switch right now.`,
    once: (name, amount) => `This month you used ${name} once, for ${amount}.`,
    perUse: (name, cost) => `This month ${name} cost you ${cost} per use.`,
    daysNone: (name, monthly) =>
      `You didn't use ${name} on a single day in the last 30 days. You paid ${monthly} for nothing.`,
    daysSome: (name, cost) => `You paid ${cost} for each day you used ${name}.`,
    hoursNone: (name, monthly) =>
      `You didn't use ${name} in the last 30 days. You paid ${monthly} for nothing.`,
    hoursSome: (name, cost) => `You paid ${cost} per hour of ${name}.`,
    benefitOver: (monthly, benefit) =>
      `You got back ${benefit} in benefits, more than the ${monthly} fee.`,
    benefitUnder: (monthly, benefit) =>
      `You got back only ${benefit} in benefits out of the ${monthly} fee.`,
    storageEmpty: (name) => `If you store nothing in ${name}, you may not need the plan.`,
    storageUsed: (name, percent, gb) => `You're using ${percent}% (${gb}) of ${plan(name)}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} It would fit comfortably in the ${plan(smaller)} plan (${amount}).`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} By storage alone it fits a smaller plan, but that plan doesn't include ${extras}, so we don't judge by storage alone.`,
    storageNoSmaller: (name, used) =>
      `${name}: ${used} It wouldn't fit comfortably in a smaller plan.`,
    storageLowUnknownPlan: (name, percent) =>
      `You're using ${percent}% of your ${name} plan's storage. Pick your plan and we'll tell you whether a smaller one would fit.`,
    storageUnknownPlan: (name, percent) =>
      `You're using ${percent}% of your ${name} plan's storage.`,
    freeTierEnough: "If the free plan was enough, you can drop to it instead of cancelling.",
    tokensOver: (times) =>
      `Your PC token use comes to ${times}× the fee at API prices — even on few days, you got your money's worth.`,
    tokensUnder: (percent) =>
      `Your PC token use comes to ${percent}% of the fee at API prices. Web and app use isn't included, so this is judged by days used.`,
  },
  metaphor: {
    unusedComparison: (item) => `A chance to save ${item}`,
    unusedMessage: (name, item, amount) =>
      `You didn't use ${name} this month. Pause the subscription for a bit and you could save ${item} (${amount}) every month.`,
    movieComparison: (item) => `A chance to save ${item}`,
    movieMessage: (cost) =>
      `If you only used it once this month, why not pause it and save the price of a movie ticket (${cost})?`,
    onceComparison: (item) => `A chance to save ${item}`,
    onceMessage: (item, cost) =>
      `You used it once this month. Take a break now and you could save ${item} (${cost}) every month.`,
    warningComparison: (item) => `About ${item}`,
    warningMessage: (cost) =>
      `${cost} per use — use it a little more and you break even! Enjoy it.`,
    cheapComparison: "Cheaper than a cup of coffee",
    cheapMessage: (cost) => `${cost} per use — cheaper than a cup of coffee! You've broken even`,
    worthComparison: (item) => `Worth ${item}`,
    worthMessage: (cost) => `${cost} per use — you're getting more than you paid for!`,
  },
  gauge: {
    none: "No use yet this month. Use it more, or pause it and save the money.",
    remaining: (n) => `${n} more ${one(n) ? "use" : "uses"} to break even!`,
    done: "Broken even! You're making good use of it.",
    diet: (cost) => `Trim suggested (${cost} per use)`,
    achieved: (cost) => `Broken even! (${cost} per use)`,
    baseline: "Break-even line",
  },
  bar: {
    label: "Cost per use",
    footer: (count, monthly) =>
      `${count} ${one(count) ? "use" : "uses"} in total · based on ${monthly}/month`,
  },
  appResult: {
    green: "Worth it",
    yellow: "Borderline",
    red: "Fine to pause",
    perUse: "Per use",
    unusedNote: (monthly) =>
      `You didn't use it in the last 30 days. Pause it and save ${monthly} a month.`,
    redNote: (monthly) => `Pause it and save ${monthly} a month.`,
    remainingNote: (n) => `${n} more ${one(n) ? "use" : "uses"} and you break even.`,
    doneNote: "You're getting more than you pay.",
    summary: (count, monthly) =>
      `${count} ${one(count) ? "use" : "uses"} in the last 30 days · ${monthly} a month`,
    toBreakEven: "To break even",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Uses toward break-even",
    cancelGuide: "See the cancel guide",
    keep: "I'll keep it",
    confirm: "OK",
  },
  picker: {
    unit: "×",
    chooseBar: "Tap the bar to choose",
    notUsed: "Not used",
    perUse: (cost) => `${cost} per use`,
    ariaLabel: "Number of uses",
    valueText: (n, max) => (max ? "10 or more" : `${n}`),
    phone: "Phone",
    typeExact: "Used it more than 10 times? Type it in",
  },
  addCheckIn: {
    registered: "Added",
    perMonth: "/mo",
    note: "It goes straight into your value receipt. You can edit it later.",
    justJoined: "I just signed up",
    done: "Done",
    later: "Later",
  },
  history: {
    deviceApp: { android: "Android app", ios: "iOS app" },
    deviceWeb: (os, mobile) => `${os ? `${os} ` : ""}${mobile ? "phone" : "PC"} (web)`,
    deviceLine: (device, here) => `Checked in on: ${device}${here ? " (this device)" : ""}`,
    phoneHours:
      "Auto check-in from phone records · the longer of the time the app was open and the time a playback notification was up. Paused time may be included",
    phoneDays:
      "Auto check-in from phone records · days you used it on this phone. Days on a PC are missing",
    phoneOther: "Auto check-in from phone records · use on other devices is missing",
    title: (count) => `Check-in history (${count})`,
    add: "+ Check in",
    empty: "No check-ins yet. Enter how much you used it this month.",
    monthRecord: (month) => `${month} usage`,
    chartTitle: "Check-ins by month",
    chartGap: "Dotted bars are months without a check-in. They're unknown, not unused.",
    chartOtherMetric: (count) =>
      `${count} ${count === 1 ? "check-in" : "check-ins"} measured another way ${count === 1 ? "is" : "are"} left out of the bars.`,
    pcTokens: (tokens, apiValue) =>
      `PC records: ${tokens} tokens${apiValue ? ` · ${apiValue} at API prices` : ""}`,
  },
  evidence: {
    label: "Check-in evidence",
    title: "What check-ins show",
    average: (count) => `Average of the last ${count} ${one(count) ? "check-in" : "check-ins"}`,
    last: (perUnit) => `Last check-in${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Recorded ${date} · ${quantity}`,
    versusPrevious: "Versus the previous check-in",
    increased: (amount) => `Up ${amount}`,
    decreased: (amount) => `Down ${amount}`,
    same: "No change",
    costSame: (perUnit) => `${perUnit} cost unchanged`,
    costUp: (perUnit, amount) => `${perUnit} cost up ${amount}`,
    costDown: (perUnit, amount) => `${perUnit} cost down ${amount}`,
    notEnough: "Not enough to compare",
    notEnoughHint: "We can compare once there is one more check-in",
    priceChanged:
      "Your price (your share) changed between the two check-ins, so the change in unit cost includes the price change.",
    selfReported:
      "The numbers are what you entered at check-in. Auto check-ins from phone records only cover this phone, so use on other devices is missing.",
    unknownDate: "Date unknown",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "en-US",
  },
  flow: {
    reminderOn: "Payment reminders are on. A test notification will arrive in a few seconds.",
    done: (name) => `${name} checked in`,
    failed: "Couldn't check in. Please try again.",
  },
  storage: {
    measure: "Measure usage from your Google account",
    waiting: "Allow Google access in the window that opened and we'll fill in the percentage.",
    idle: "We read your Google account's storage and fill in the percentage. The numbers are never sent to SubSlash servers.",
    noValue:
      "Didn't get a measurement. Enter the percentage from the web app screen yourself, or measure again.",
    failed: "Couldn't get the storage from Google. Please measure again in a moment.",
    noLimit:
      "This Google account has no storage limit, so a percentage can't be worked out. Please enter it yourself.",
    measured: (limit, usage) => `You're using ${usage} of this Google account's ${limit} limit.`,
    family: (measured) =>
      `${measured} This is a plan shared with family, and this account's usage alone doesn't give the share of the whole plan, so we didn't fill it in.`,
    planMismatch: (measured, registered) =>
      `${measured} The limit doesn't match the plan you registered (${plan(registered)}), so we didn't fill it in. It may be another account, or a family or work account's limit.`,
    underOne: " It was under 1%, so we filled in 1%.",
    choosePlan: " Pick your plan and we'll check the limit against it.",
    doneReading: "Passing the measurement along",
    doneFilled: "Filled into the check-in",
    doneFilledHint: "Close this tab, check it in the check-in window, then tap check in.",
    doneFailed: "Didn't get a measurement",
    doneFailedHint: "Close this tab and measure again from the check-in window.",
  },
  freeTier: {
    needed: "No, I needed the paid plan",
    enough: "Yes, free would probably have been enough",
    unsure: "Not sure",
    question: "Would the free plan have been enough?",
    hint: "If you hit usage limits or used paid models or features, you needed the paid plan.",
  },
  link: {
    invalidTitle: "This check-in link isn't valid",
    invalidBody: "Tap the button in the email again, or check in from the dashboard.",
    missingTitle: "This subscription isn't on this device",
    missingBody:
      "Open the link on the device where you added it, or log in to keep your devices in sync.",
    killedTitle: "This subscription is already cancelled",
    killedBody: (name) => `'${name}' is cancelled, so no check-in was recorded.`,
    dashboard: "Dashboard →",
  },
};

const ciPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

/** 용량 표기: 1GB 미만·약 N GB·약 N TB. 소수점은 그 언어의 구분자를 쓴다. */
function gbIn(raw: number, under: string, about: (v: string) => string, comma: boolean): string {
  const gb = Number(raw);
  if (gb < 1) return under;
  if (gb < 1000) return about(`${Math.round(gb)}GB`);
  const tb = gb / 1000;
  const text = Number.isInteger(Math.round(tb * 10) / 10) ? String(Math.round(tb)) : tb.toFixed(1);
  return about(`${comma ? text.replace(".", ",") : text}TB`);
}

/** 1이면 단수로 쓰는 단위(유럽 언어). 그 밖의 단위(원·%)는 그대로다. */
function unitIn(singular: Record<string, string>) {
  return (value: number, unit: string) =>
    Number(value) === 1 && singular[unit] ? singular[unit] : unit;
}

const frUnit = unitIn({ jours: "jour", heures: "heure" });
const esUnit = unitIn({ veces: "vez", días: "día", horas: "hora" });
const deUnit = unitIn({ Tage: "Tag", Stunden: "Stunde" });
const ptUnit = unitIn({ vezes: "vez", dias: "dia", horas: "hora" });

export const zh: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "最近 30 天用了几次？",
      hint: "",
      unit: "次",
      quantityLabel: "30 天内的使用次数",
      perUnit: "每次",
    },
    days: {
      question: "最近 30 天里用了几天？",
      hint: "一天用多次也算一天。手机和电脑上用的都算进去。",
      unit: "天",
      quantityLabel: "30 天中使用的天数",
      perUnit: "每天",
    },
    hours: {
      question: "最近 30 天大约用了几小时？",
      hint: "请把在电视、电脑上用的时间和关屏收听的时间也算进去。每天 30 分钟就是 15 小时。",
      unit: "小时",
      quantityLabel: "30 天内的使用时长",
      perUnit: "每小时",
    },
    benefit: {
      question: "最近 30 天获得了多少优惠？",
      hint: "把没有会员就要付的钱加起来：免运费、折扣、积分等。",
      unit: "韩元",
      quantityLabel: "30 天内获得的优惠",
      perUnit: "",
    },
    storage: {
      question: "套餐容量用了多少？",
      hint: "可以在设备的存储设置中查看（iCloud：设置 › 你的姓名 › iCloud）。",
      unit: "%",
      quantityLabel: "套餐容量的使用比例",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => `${value}${unit === "%" ? "%" : ` ${unit}`}`,
    unitFor: (_value, unit) => unit,
    presetBenefit: (value) =>
      value === 0 ? "0 韩元" : value % 10000 === 0 ? `${value / 10000} 万` : `${value / 1000} 千`,
    choose: "请选择",
    decrease: (step, unit) => `减少 ${step} ${unit}`,
    increase: (step, unit) => `增加 ${step} ${unit}`,
    storageOf: (plan, used) => `${plan} 中的 ${used}`,
    storageGB: (raw) => gbIn(raw, "不到 1GB", (v) => `约 ${v}`, false),
    orderEvidence: (since, count) => `Gmail 中 ${since} 以来的订单邮件 ${count} 封`,
    orderEvidenceNote:
      "。这是在导入的邮件中统计的，可能比实际少。请把这些订单中获得的免运费和折扣加上。",
    sinceDate: (month, day) => `${Number(month)}月${day}日`,
    benefitNumberLocale: "zh-CN",
  },
  modal: {
    title: (name) => `${name} 使用量签到`,
    usesQuestion: "最近 30 天用了几次？",
    usesQuestionBefore: "最近 30 天，",
    usesQuestionAfter: " 用了几次？",
    timesUnit: "次",
    submit: "查看性价比分析",
    noResult: "查看结果",
    accountTitle: "退订时要登录的账户",
    copied: "已复制",
    copyId: "复制 ID",
    accountBefore: "需要用账户 ",
    accountAfter: " 登录才能看到退订菜单。",
    accountUnknown: "请用注册时的账户登录。",
    paymentMethod: "支付方式：",
    openGuide: "打开退订指南",
    close: "关闭",
    newWindow: (label) => `${label}（新窗口）`,
    cancelPage: (name) => `直接前往 ${name} 退订页面（新窗口）`,
    openService: (name) => `打开 ${name}（新窗口）`,
    paymentCancel: (name, direct) => (direct ? `打开 ${name} 定期付款管理` : `打开 ${name}`),
  },
  outcome: {
    unused: (amount) => `这个月白白扔掉了 ${amount}。现在就按下退订开关吧。`,
    once: (name, amount) => `这个月为了用一次 ${name} 花了 ${amount}。`,
    perUse: (name, cost) => `这个月 ${name} 每次花了 ${cost}。`,
    daysNone: (name, monthly) => `最近 30 天一天也没用 ${name}。白白付了 ${monthly}。`,
    daysSome: (name, cost) => `${name} 每个使用日花了 ${cost}。`,
    hoursNone: (name, monthly) => `最近 30 天没用 ${name}。白白付了 ${monthly}。`,
    hoursSome: (name, cost) => `${name} 每小时花了 ${cost}。`,
    benefitOver: (monthly, benefit) => `收回了 ${benefit} 的优惠，超过了 ${monthly} 的会费。`,
    benefitUnder: (monthly, benefit) => `${monthly} 的会费只收回了 ${benefit} 的优惠。`,
    storageEmpty: (name) => `如果 ${name} 里什么都不放，可能不需要这个套餐。`,
    storageUsed: (name, percent, gb) =>
      `正在使用 ${planName(name, "zh")} 的 ${percent}%（${gb}）。`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}：${used} 换成 ${planName(smaller, "zh")} 套餐（${amount}）也绰绰有余。`,
    storageBundled: (name, used, extras) =>
      `${name}：${used} 只看容量可以换更小的套餐，但那个套餐不含 ${extras}，所以不只按容量判断。`,
    storageNoSmaller: (name, used) => `${name}：${used} 换成更小的套餐会不够用。`,
    storageLowUnknownPlan: (name, percent) =>
      `正在使用 ${name} 套餐容量的 ${percent}%。选择套餐后，会告诉你更小的套餐是否够用。`,
    storageUnknownPlan: (name, percent) => `正在使用 ${name} 套餐容量的 ${percent}%。`,
    freeTierEnough: "如果免费套餐就够用，也可以不退订而改用免费套餐。",
    tokensOver: (times) =>
      `电脑上的令牌用量按 API 价格相当于会费的 ${times} 倍——即使使用天数少，也已经够本了。`,
    tokensUnder: (percent) =>
      `电脑上的令牌用量按 API 价格相当于会费的 ${percent}%。不包括网页和应用中的使用，所以按使用天数判断。`,
  },
  metaphor: {
    unusedComparison: (item) => `可以省下${item}的机会`,
    unusedMessage: (name, item, amount) =>
      `这个月没用 ${name}。暂停一阵子，每个月可以省下${item}（${amount}）。`,
    movieComparison: (item) => `可以省下${item}的机会`,
    movieMessage: (cost) => `如果这个月只用了一次，不如暂停，省下一张电影票的钱（${cost}）？`,
    onceComparison: (item) => `可以省下${item}的机会`,
    onceMessage: (item, cost) => `这个月用了一次。现在休息一下，每个月可以省下${item}（${cost}）。`,
    warningComparison: (item) => `约等于${item}`,
    warningMessage: (cost) => `每次 ${cost} —— 再多用一点就够本了！好好享受吧。`,
    cheapComparison: "比一杯咖啡还便宜",
    cheapMessage: (cost) => `每次 ${cost} —— 比一杯咖啡还便宜！已经够本了`,
    worthComparison: (item) => `值${item}`,
    worthMessage: (cost) => `每次 ${cost} —— 用得比付的还多！`,
  },
  gauge: {
    none: "这个月还没用。多用一点，或者暂停省下钱吧。",
    remaining: (n) => `再用 ${n} 次就够本！`,
    done: "已经够本！用得很好。",
    diet: (cost) => `建议精简（每次 ${cost}）`,
    achieved: (cost) => `已经够本！（每次 ${cost}）`,
    baseline: "够本线",
  },
  bar: { label: "单次成本", footer: (count, monthly) => `共 ${count} 次 · 按每月 ${monthly} 计算` },
  appResult: {
    green: "物有所值",
    yellow: "处在边缘",
    red: "可以暂停",
    perUse: "每次",
    unusedNote: (monthly) => `最近 30 天没用过。暂停后每月可省 ${monthly}。`,
    redNote: (monthly) => `暂停后每月可省 ${monthly}。`,
    remainingNote: (n) => `再用 ${n} 次就够本。`,
    doneNote: "用得比付的还多。",
    summary: (count, monthly) => `最近 30 天 ${count} 次 · 每月 ${monthly}`,
    toBreakEven: "距离够本",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "距离够本的使用次数",
    cancelGuide: "查看退订指南",
    keep: "继续使用",
    confirm: "确定",
  },
  picker: {
    unit: "次",
    chooseBar: "点柱条选择",
    notUsed: "没用过",
    perUse: (cost) => `每次 ${cost}`,
    ariaLabel: "使用次数",
    valueText: (n, max) => (max ? "10 次以上" : `${n} 次`),
    phone: "手机",
    typeExact: "用了 10 次以上？直接输入",
  },
  addCheckIn: {
    registered: "已添加",
    perMonth: "/月",
    note: "会直接计入性价比小票。之后可以修改。",
    justJoined: "刚刚开通的",
    done: "完成",
    later: "稍后",
  },
  history: {
    deviceApp: { android: "Android 应用", ios: "iOS 应用" },
    deviceWeb: (os, mobile) => `${os ? `${os} ` : ""}${mobile ? "手机" : "电脑"}网页版`,
    deviceLine: (device, here) => `打卡设备：${device}${here ? "（本设备）" : ""}`,
    phoneHours:
      "根据手机记录自动签到 · 取应用打开时间和播放通知显示时间中较长者。可能包含暂停的时间",
    phoneDays: "根据手机记录自动签到 · 这部手机上使用的天数。不包括电脑上的天数",
    phoneOther: "根据手机记录自动签到 · 不包括其他设备上的使用",
    title: (count) => `签到记录（${count}）`,
    add: "+ 签到",
    empty: "还没有签到。请输入本月的使用量。",
    monthRecord: (month) => `${month} 使用量`,
    chartTitle: "按月签到",
    chartGap: "虚线表示没有签到的月份。那不是没用，而是不知道。",
    chartOtherMetric: (count) => `${count} 条按其他标准记录的签到未计入柱状图。`,
    pcTokens: (tokens, apiValue) =>
      `电脑记录：${tokens} 个令牌${apiValue ? ` · 按 API 价格 ${apiValue}` : ""}`,
  },
  evidence: {
    label: "签到依据",
    title: "签到显示的情况",
    average: (count) => `最近 ${count} 次签到的平均值`,
    last: (perUnit) => `最近一次签到${perUnit ? ` ${perUnit}` : ""}`,
    recorded: (date, quantity) => `${date} 记录 · ${quantity}`,
    versusPrevious: "与上一次签到相比",
    increased: (amount) => `增加 ${amount}`,
    decreased: (amount) => `减少 ${amount}`,
    same: "没有变化",
    costSame: (perUnit) => `${perUnit}费用不变`,
    costUp: (perUnit, amount) => `${perUnit}费用增加 ${amount}`,
    costDown: (perUnit, amount) => `${perUnit}费用减少 ${amount}`,
    notEnough: "数据不足以比较",
    notEnoughHint: "再签到一次就能比较",
    priceChanged: "两次签到之间你的价格（我的份额）变了，所以单次成本的变化包含了价格变化。",
    selfReported:
      "数字是签到时你输入的值。手机记录的自动签到只涵盖这部手机，不包括其他设备上的使用。",
    unknownDate: "日期不明",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "zh-CN",
  },
  flow: {
    reminderOn: "扣款提醒已开启。几秒后会收到测试通知。",
    done: (name) => `${name} 已签到`,
    failed: "无法签到。请重试。",
  },
  storage: {
    measure: "用 Google 账户测量使用量",
    waiting: "在打开的窗口中允许 Google 访问，就会填入比例。",
    idle: "读取你 Google 账户的存储空间并填入比例。数字不会发送到 SubSlash 服务器。",
    noValue: "没有收到测量结果。请自己输入网页应用画面上的比例，或者重新测量。",
    failed: "无法从 Google 获取存储空间。请稍后重新测量。",
    noLimit: "这个 Google 账户没有存储上限，无法算出比例。请自己输入。",
    measured: (limit, usage) => `正在使用这个 Google 账户 ${limit} 上限中的 ${usage}。`,
    family: (measured) =>
      `${measured} 这是与家人共享的套餐，仅凭这个账户的用量无法得出整个套餐的比例，所以没有填入。`,
    planMismatch: (measured, registered) =>
      `${measured} 上限与你登记的套餐（${planName(registered, "zh")}）不符，所以没有填入。可能是其他账户，或家庭、工作账户的上限。`,
    underOne: " 不到 1%，所以填入 1%。",
    choosePlan: " 选择套餐后会与上限核对。",
    doneReading: "正在传递测量结果",
    doneFilled: "已填入签到",
    doneFilledHint: "关闭这个标签页，在签到窗口中确认后点签到。",
    doneFailed: "没有收到测量结果",
    doneFailedHint: "关闭这个标签页，在签到窗口中重新测量。",
  },
  freeTier: {
    needed: "不，需要付费套餐",
    enough: "是，免费的大概就够了",
    unsure: "不确定",
    question: "免费套餐够用吗？",
    hint: "如果碰到了使用限制，或用了付费模型、付费功能，就是需要付费套餐。",
  },
  link: {
    invalidTitle: "这个签到链接无效",
    invalidBody: "请再点一次邮件中的按钮，或在仪表板上签到。",
    missingTitle: "这台设备上没有这个订阅",
    missingBody: "请在添加它的设备上打开链接，或登录让各设备保持同步。",
    killedTitle: "这个订阅已经退订",
    killedBody: (name) => `“${name}”已退订，所以没有记录签到。`,
    dashboard: "仪表板 →",
  },
};

export const ja: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "直近 30 日に何回使いましたか？",
      hint: "",
      unit: "回",
      quantityLabel: "30 日間の利用回数",
      perUnit: "1 回あたり",
    },
    days: {
      question: "直近 30 日のうち何日使いましたか？",
      hint: "1 日に何回使っても 1 日です。スマホでも PC でも数えてください。",
      unit: "日",
      quantityLabel: "30 日のうち使った日数",
      perUnit: "1 日あたり",
    },
    hours: {
      question: "直近 30 日におよそ何時間使いましたか？",
      hint: "テレビや PC で使った時間、画面を消して聞いた時間も入れてください。1 日 30 分なら 15 時間です。",
      unit: "時間",
      quantityLabel: "30 日間の利用時間",
      perUnit: "1 時間あたり",
    },
    benefit: {
      question: "直近 30 日にどれだけの特典を受けましたか？",
      hint: "送料無料・割引・ポイントなど、メンバーシップがなければ払っていたお金を足してください。",
      unit: "ウォン",
      quantityLabel: "30 日間に受けた特典",
      perUnit: "",
    },
    storage: {
      question: "プランの容量をどれだけ使っていますか？",
      hint: "端末のストレージ設定で見られます（iCloud: 設定 › ユーザ名 › iCloud）。",
      unit: "%",
      quantityLabel: "プラン容量の使用率",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => `${value}${unit === "%" ? "%" : ` ${unit}`}`,
    unitFor: (_value, unit) => unit,
    presetBenefit: (value) =>
      value === 0 ? "0 ウォン" : value % 10000 === 0 ? `${value / 10000} 万` : `${value / 1000} 千`,
    choose: "選んでください",
    decrease: (step, unit) => `${step} ${unit}減らす`,
    increase: (step, unit) => `${step} ${unit}増やす`,
    storageOf: (plan, used) => `${plan} のうち ${used}`,
    storageGB: (raw) => gbIn(raw, "1GB 未満", (v) => `約 ${v}`, false),
    orderEvidence: (since, count) => `Gmail で ${since} 以降の注文メール ${count} 通`,
    orderEvidenceNote:
      "を見つけました。取り込んだメールの中で数えたので、実際より少ないことがあります。その注文で受けた送料無料や割引を足してください。",
    sinceDate: (month, day) => `${Number(month)}月${day}日`,
    benefitNumberLocale: "ja-JP",
  },
  modal: {
    title: (name) => `${name} の利用量チェックイン`,
    usesQuestion: "直近 30 日に何回使いましたか？",
    usesQuestionBefore: "直近 30 日に ",
    usesQuestionAfter: " を何回使いましたか？",
    timesUnit: "回",
    submit: "お得度の分析を見る",
    noResult: "結果を確認",
    accountTitle: "解約するときにログインするアカウント",
    copied: "コピーしました",
    copyId: "ID をコピー",
    accountBefore: "解約メニューは ",
    accountAfter: " のアカウントでログインすると表示されます。",
    accountUnknown: "登録したアカウントでログインしてください。",
    paymentMethod: "支払い方法: ",
    openGuide: "解約ガイドを開く",
    close: "閉じる",
    newWindow: (label) => `${label}（新しいウィンドウ）`,
    cancelPage: (name) => `${name} の解約ページへ直接移動（新しいウィンドウ）`,
    openService: (name) => `${name} を開く（新しいウィンドウ）`,
    paymentCancel: (name, direct) => (direct ? `${name} の定期支払い管理を開く` : `${name} を開く`),
  },
  outcome: {
    unused: (amount) => `今月は ${amount} を捨てました。今すぐ解約スイッチを押しましょう。`,
    once: (name, amount) => `今月は ${name} を 1 回使うために ${amount} 払いました。`,
    perUse: (name, cost) => `今月 ${name} は 1 回あたり ${cost} でした。`,
    daysNone: (name, monthly) =>
      `直近 30 日に ${name} を 1 日も使いませんでした。${monthly} をそのまま払いました。`,
    daysSome: (name, cost) => `${name} は使った日 1 日あたり ${cost} でした。`,
    hoursNone: (name, monthly) =>
      `直近 30 日に ${name} を使いませんでした。${monthly} をそのまま払いました。`,
    hoursSome: (name, cost) => `${name} は 1 時間あたり ${cost} でした。`,
    benefitOver: (monthly, benefit) => `会費 ${monthly} より多い ${benefit} の特典を受けました。`,
    benefitUnder: (monthly, benefit) =>
      `会費 ${monthly} のうち ${benefit} の特典しか受けていません。`,
    storageEmpty: (name) => `${name} に何も置いていないなら、プランは要らないかもしれません。`,
    storageUsed: (name, percent, gb) =>
      `${planName(name, "ja")} の ${percent}%（${gb}）を使っています。`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} ${planName(smaller, "ja")} プラン（${amount}）でも十分に収まります。`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} 容量だけなら小さいプランで足りますが、そのプランには ${extras} が含まれないので、容量だけでは判断しません。`,
    storageNoSmaller: (name, used) => `${name}: ${used} 小さいプランでは余裕がありません。`,
    storageLowUnknownPlan: (name, percent) =>
      `${name} プランの容量の ${percent}% を使っています。プランを選ぶと、小さいプランで足りるかお知らせします。`,
    storageUnknownPlan: (name, percent) => `${name} プランの容量の ${percent}% を使っています。`,
    freeTierEnough: "無料プランで足りたなら、解約の代わりに無料プランに下げることもできます。",
    tokensOver: (times) =>
      `PC でのトークン利用は API 料金で会費の ${times} 倍です——使った日が少なくても元は取れています。`,
    tokensUnder: (percent) =>
      `PC でのトークン利用は API 料金で会費の ${percent}% です。ウェブやアプリの利用は含まれないので、使った日数で判断します。`,
  },
  metaphor: {
    unusedComparison: (item) => `${item}を節約できるチャンス`,
    unusedMessage: (name, item, amount) =>
      `今月は ${name} を使いませんでした。しばらく一時停止すれば、毎月${item}（${amount}）を節約できます。`,
    movieComparison: (item) => `${item}を節約できるチャンス`,
    movieMessage: (cost) =>
      `今月 1 回しか使っていないなら、一時停止して映画のチケット代（${cost}）を節約しませんか？`,
    onceComparison: (item) => `${item}を節約できるチャンス`,
    onceMessage: (item, cost) =>
      `今月は 1 回使いました。今ひと休みすれば、毎月${item}（${cost}）を節約できます。`,
    warningComparison: (item) => `${item}くらい`,
    warningMessage: (cost) => `1 回 ${cost} — もう少し使えば元が取れます！楽しんでください。`,
    cheapComparison: "コーヒー 1 杯より安い",
    cheapMessage: (cost) => `1 回 ${cost} — コーヒー 1 杯より安い！元が取れています`,
    worthComparison: (item) => `${item}分の価値`,
    worthMessage: (cost) => `1 回 ${cost} — 払った以上に使っています！`,
  },
  gauge: {
    none: "今月はまだ使っていません。もっと使うか、一時停止してお金を節約しましょう。",
    remaining: (n) => `あと ${n} 回で元が取れます！`,
    done: "元が取れました！よく活用しています。",
    diet: (cost) => `スリム化のおすすめ（1 回 ${cost}）`,
    achieved: (cost) => `元が取れました！（1 回 ${cost}）`,
    baseline: "元が取れるライン",
  },
  bar: {
    label: "1 回あたりの単価",
    footer: (count, monthly) => `合計 ${count} 回 · 月 ${monthly} 基準`,
  },
  appResult: {
    green: "元が取れている",
    yellow: "ぎりぎり",
    red: "一時停止してよい",
    perUse: "1 回あたり",
    unusedNote: (monthly) =>
      `直近 30 日に使っていません。一時停止すれば毎月 ${monthly} の節約です。`,
    redNote: (monthly) => `一時停止すれば毎月 ${monthly} の節約です。`,
    remainingNote: (n) => `あと ${n} 回使えば元が取れます。`,
    doneNote: "払った以上に使っています。",
    summary: (count, monthly) => `直近 30 日 ${count} 回 · 月 ${monthly}`,
    toBreakEven: "元が取れるまで",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "元が取れるまでの利用回数",
    cancelGuide: "解約ガイドを見る",
    keep: "使い続ける",
    confirm: "OK",
  },
  picker: {
    unit: "回",
    chooseBar: "棒を押して選ぶ",
    notUsed: "使っていない",
    perUse: (cost) => `1 回 ${cost}`,
    ariaLabel: "利用回数",
    valueText: (n, max) => (max ? "10 回以上" : `${n} 回`),
    phone: "スマホ",
    typeExact: "10 回以上使いましたか？ 直接入力",
  },
  addCheckIn: {
    registered: "追加しました",
    perMonth: "/月",
    note: "そのままお得度レシートに入ります。あとで直せます。",
    justJoined: "今契約したばかり",
    done: "完了",
    later: "あとで",
  },
  history: {
    deviceApp: { android: "Android アプリ", ios: "iOS アプリ" },
    deviceWeb: (os, mobile) => `${os ? `${os} の` : ""}${mobile ? "スマホ" : "PC"}（ウェブ）`,
    deviceLine: (device, here) => `チェックインした端末: ${device}${here ? "（この端末）" : ""}`,
    phoneHours:
      "スマホの記録で自動チェックイン · アプリを開いていた時間と再生通知の時間のうち長いほう。一時停止の時間が含まれることがあります",
    phoneDays:
      "スマホの記録で自動チェックイン · このスマホで使った日数。PC で使った日は含まれません",
    phoneOther: "スマホの記録で自動チェックイン · ほかの端末での利用は含まれません",
    title: (count) => `チェックインの記録（${count}）`,
    add: "+ チェックイン",
    empty: "まだチェックインしていません。今月どれだけ使ったかを入力してください。",
    monthRecord: (month) => `${month} の利用量`,
    chartTitle: "月ごとのチェックイン",
    chartGap: "点線はチェックインしていない月です。使わなかった月ではなく、分からない月です。",
    chartOtherMetric: (count) =>
      `別の基準で記録したチェックイン ${count} 件はグラフから外しています。`,
    pcTokens: (tokens, apiValue) =>
      `PC の記録: ${tokens} トークン${apiValue ? ` · API 料金で ${apiValue}` : ""}`,
  },
  evidence: {
    label: "チェックインの根拠",
    title: "チェックインからわかること",
    average: (count) => `直近 ${count} 回のチェックインの平均`,
    last: (perUnit) => `最後のチェックイン${perUnit ? ` ${perUnit}` : ""}`,
    recorded: (date, quantity) => `${date} に記録 · ${quantity}`,
    versusPrevious: "前回のチェックインと比べて",
    increased: (amount) => `${amount} 増加`,
    decreased: (amount) => `${amount} 減少`,
    same: "変化なし",
    costSame: (perUnit) => `${perUnit}の費用は変わらず`,
    costUp: (perUnit, amount) => `${perUnit}の費用が ${amount} 増加`,
    costDown: (perUnit, amount) => `${perUnit}の費用が ${amount} 減少`,
    notEnough: "比べるにはまだ足りません",
    notEnoughHint: "あと 1 回チェックインすると比べられます",
    priceChanged:
      "2 回のチェックインの間に料金（自分の負担分）が変わったので、単価の変化には料金の変化も含まれます。",
    selfReported:
      "数字はチェックインで入力した値です。スマホの記録による自動チェックインはこのスマホだけなので、ほかの端末での利用は含まれません。",
    unknownDate: "日付不明",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "ja-JP",
  },
  flow: {
    reminderOn: "支払い通知がオンになりました。数秒後にテスト通知が届きます。",
    done: (name) => `${name} をチェックインしました`,
    failed: "チェックインできませんでした。もう一度お試しください。",
  },
  storage: {
    measure: "Google アカウントで使用量を測る",
    waiting: "開いたウィンドウで Google へのアクセスを許可すると、割合が入ります。",
    idle: "Google アカウントのストレージを読み取って割合を入れます。数字は SubSlash のサーバーに送りません。",
    noValue:
      "測定結果を受け取れませんでした。ウェブアプリの画面の割合を自分で入れるか、もう一度測ってください。",
    failed: "Google からストレージを取得できませんでした。少ししてからもう一度測ってください。",
    noLimit:
      "この Google アカウントにはストレージの上限がないため、割合を出せません。自分で入力してください。",
    measured: (limit, usage) =>
      `この Google アカウントの上限 ${limit} のうち ${usage} を使っています。`,
    family: (measured) =>
      `${measured} 家族と分け合うプランで、このアカウントの使用量だけではプラン全体の割合がわからないため、入れませんでした。`,
    planMismatch: (measured, registered) =>
      `${measured} 上限が登録したプラン（${planName(registered, "ja")}）と合わないので入れませんでした。別のアカウントや、家族・仕事のアカウントの上限かもしれません。`,
    underOne: " 1% 未満だったので 1% を入れました。",
    choosePlan: " プランを選ぶと上限と照らし合わせます。",
    doneReading: "測定結果を渡しています",
    doneFilled: "チェックインに入れました",
    doneFilledHint:
      "このタブを閉じ、チェックインの画面で確認してからチェックインを押してください。",
    doneFailed: "測定結果を受け取れませんでした",
    doneFailedHint: "このタブを閉じ、チェックインの画面からもう一度測ってください。",
  },
  freeTier: {
    needed: "いいえ、有料プランが必要でした",
    enough: "はい、たぶん無料で足りました",
    unsure: "わからない",
    question: "無料プランで足りましたか？",
    hint: "利用制限に当たったり、有料のモデルや機能を使ったなら、有料プランが必要でした。",
  },
  link: {
    invalidTitle: "このチェックインのリンクは無効です",
    invalidBody: "メールのボタンをもう一度押すか、ダッシュボードでチェックインしてください。",
    missingTitle: "この端末にはこのサブスクがありません",
    missingBody: "追加した端末でリンクを開くか、ログインして端末どうしをそろえてください。",
    killedTitle: "このサブスクはすでに解約しています",
    killedBody: (name) => `「${name}」は解約済みなので、チェックインは記録しませんでした。`,
    dashboard: "ダッシュボード →",
  },
};

export const vi: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "Trong 30 ngày qua bạn dùng mấy lần?",
      hint: "",
      unit: "lần",
      quantityLabel: "Số lần dùng trong 30 ngày",
      perUnit: "Mỗi lần",
    },
    days: {
      question: "Trong 30 ngày qua bạn dùng bao nhiêu ngày?",
      hint: "Dùng nhiều lần trong một ngày vẫn tính là một ngày. Tính cả điện thoại và PC.",
      unit: "ngày",
      quantityLabel: "Số ngày dùng trong 30 ngày",
      perUnit: "Mỗi ngày",
    },
    hours: {
      question: "Trong 30 ngày qua bạn dùng khoảng bao nhiêu giờ?",
      hint: "Tính cả thời gian trên TV, PC và lúc nghe khi tắt màn hình. Mỗi ngày 30 phút là 15 giờ.",
      unit: "giờ",
      quantityLabel: "Số giờ dùng trong 30 ngày",
      perUnit: "Mỗi giờ",
    },
    benefit: {
      question: "Trong 30 ngày qua bạn nhận được bao nhiêu ưu đãi?",
      hint: "Cộng số tiền bạn lẽ ra phải trả nếu không có gói thành viên: miễn phí giao hàng, giảm giá, tích điểm.",
      unit: "won",
      quantityLabel: "Ưu đãi nhận được trong 30 ngày",
      perUnit: "",
    },
    storage: {
      question: "Bạn đang dùng bao nhiêu dung lượng của gói?",
      hint: "Xem trong cài đặt bộ nhớ của thiết bị (iCloud: Cài đặt › tên của bạn › iCloud).",
      unit: "%",
      quantityLabel: "Tỷ lệ dung lượng gói đã dùng",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => `${value}${unit === "%" ? "%" : ` ${unit}`}`,
    unitFor: (_value, unit) => unit,
    presetBenefit: (value) => (value === 0 ? "0 won" : `${value / 1000} nghìn`),
    choose: "Hãy chọn",
    decrease: (step, unit) => `Bớt ${step} ${unit}`,
    increase: (step, unit) => `Thêm ${step} ${unit}`,
    storageOf: (plan, used) => `${used} trong ${plan}`,
    storageGB: (raw) => gbIn(raw, "dưới 1GB", (v) => `khoảng ${v}`, true),
    orderEvidence: (since, count) => `${count} email đơn hàng trong Gmail từ ${since}`,
    orderEvidenceNote:
      " đã được tìm thấy. Con số này chỉ đếm trong các email đã nhập nên có thể ít hơn thực tế. Hãy cộng phần miễn phí giao hàng và giảm giá bạn nhận được trong các đơn đó.",
    sinceDate: (month, day) => `${day}/${Number(month)}`,
    benefitNumberLocale: "vi-VN",
  },
  modal: {
    title: (name) => `Check-in mức dùng ${name}`,
    usesQuestion: "Trong 30 ngày qua bạn dùng mấy lần?",
    usesQuestionBefore: "Trong 30 ngày qua, bạn dùng ",
    usesQuestionAfter: " mấy lần?",
    timesUnit: "lần",
    submit: "Xem phân tích giá trị",
    noResult: "Xem kết quả",
    accountTitle: "Tài khoản cần đăng nhập để hủy",
    copied: "Đã sao chép",
    copyId: "Sao chép ID",
    accountBefore: "Bạn cần đăng nhập bằng tài khoản ",
    accountAfter: " để thấy menu hủy.",
    accountUnknown: "Hãy đăng nhập bằng tài khoản đã đăng ký.",
    paymentMethod: "Phương thức thanh toán: ",
    openGuide: "Mở hướng dẫn hủy",
    close: "Đóng",
    newWindow: (label) => `${label} (cửa sổ mới)`,
    cancelPage: (name) => `Đi thẳng đến trang hủy ${name} (cửa sổ mới)`,
    openService: (name) => `Mở ${name} (cửa sổ mới)`,
    paymentCancel: (name, direct) =>
      direct ? `Mở quản lý thanh toán định kỳ ${name}` : `Mở ${name}`,
  },
  outcome: {
    unused: (amount) => `Tháng này bạn đã vứt đi ${amount}. Hãy hủy ngay.`,
    once: (name, amount) => `Tháng này bạn dùng ${name} một lần với giá ${amount}.`,
    perUse: (name, cost) => `Tháng này ${name} tốn ${cost} mỗi lần dùng.`,
    daysNone: (name, monthly) =>
      `Bạn không dùng ${name} ngày nào trong 30 ngày qua. Bạn đã trả ${monthly} vô ích.`,
    daysSome: (name, cost) => `Bạn trả ${cost} cho mỗi ngày dùng ${name}.`,
    hoursNone: (name, monthly) =>
      `Bạn không dùng ${name} trong 30 ngày qua. Bạn đã trả ${monthly} vô ích.`,
    hoursSome: (name, cost) => `Bạn trả ${cost} cho mỗi giờ dùng ${name}.`,
    benefitOver: (monthly, benefit) => `Bạn thu lại ${benefit} ưu đãi, nhiều hơn phí ${monthly}.`,
    benefitUnder: (monthly, benefit) => `Với phí ${monthly}, bạn chỉ thu lại ${benefit} ưu đãi.`,
    storageEmpty: (name) => `Nếu không lưu gì trong ${name}, có thể bạn không cần gói này.`,
    storageUsed: (name, percent, gb) =>
      `Bạn đang dùng ${percent}% (${gb}) của ${planName(name, "vi")}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} Gói ${planName(smaller, "vi")} (${amount}) vẫn dư sức chứa.`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} Nếu chỉ xét dung lượng thì gói nhỏ hơn là đủ, nhưng gói đó không có ${extras}, nên không chỉ xét dung lượng.`,
    storageNoSmaller: (name, used) => `${name}: ${used} Gói nhỏ hơn sẽ không đủ dư dả.`,
    storageLowUnknownPlan: (name, percent) =>
      `Bạn đang dùng ${percent}% dung lượng gói ${name}. Chọn gói để biết gói nhỏ hơn có đủ không.`,
    storageUnknownPlan: (name, percent) => `Bạn đang dùng ${percent}% dung lượng gói ${name}.`,
    freeTierEnough: "Nếu gói miễn phí là đủ, bạn có thể hạ xuống gói miễn phí thay vì hủy.",
    tokensOver: (times) =>
      `Lượng token trên PC theo giá API gấp ${times} lần phí — dù ít ngày dùng, bạn vẫn đã đủ bù.`,
    tokensUnder: (percent) =>
      `Lượng token trên PC theo giá API bằng ${percent}% phí. Chưa tính việc dùng trên web và ứng dụng nên đánh giá theo số ngày dùng.`,
  },
  metaphor: {
    unusedComparison: (item) => `Cơ hội tiết kiệm ${item}`,
    unusedMessage: (name, item, amount) =>
      `Tháng này bạn không dùng ${name}. Tạm dừng một thời gian, mỗi tháng bạn có thể tiết kiệm ${item} (${amount}).`,
    movieComparison: (item) => `Cơ hội tiết kiệm ${item}`,
    movieMessage: (cost) =>
      `Nếu tháng này chỉ dùng một lần, sao không tạm dừng và tiết kiệm tiền một vé xem phim (${cost})?`,
    onceComparison: (item) => `Cơ hội tiết kiệm ${item}`,
    onceMessage: (item, cost) =>
      `Tháng này bạn dùng một lần. Nghỉ một chút, mỗi tháng có thể tiết kiệm ${item} (${cost}).`,
    warningComparison: (item) => `Khoảng ${item}`,
    warningMessage: (cost) => `${cost} mỗi lần — dùng thêm chút nữa là đủ bù! Hãy tận hưởng.`,
    cheapComparison: "Rẻ hơn một ly cà phê",
    cheapMessage: (cost) => `${cost} mỗi lần — rẻ hơn một ly cà phê! Bạn đã đủ bù`,
    worthComparison: (item) => `Đáng giá ${item}`,
    worthMessage: (cost) => `${cost} mỗi lần — bạn dùng nhiều hơn số tiền bỏ ra!`,
  },
  gauge: {
    none: "Tháng này chưa dùng. Dùng nhiều hơn, hoặc tạm dừng để tiết kiệm.",
    remaining: (n) => `Thêm ${n} lần nữa là đủ bù!`,
    done: "Đã đủ bù! Bạn đang tận dụng tốt.",
    diet: (cost) => `Nên cắt bớt (${cost} mỗi lần)`,
    achieved: (cost) => `Đã đủ bù! (${cost} mỗi lần)`,
    baseline: "Ngưỡng đủ bù",
  },
  bar: {
    label: "Chi phí mỗi lần dùng",
    footer: (count, monthly) => `Tổng ${count} lần · theo ${monthly}/tháng`,
  },
  appResult: {
    green: "Đáng tiền",
    yellow: "Sát ngưỡng",
    red: "Có thể tạm dừng",
    perUse: "Mỗi lần",
    unusedNote: (monthly) =>
      `30 ngày qua bạn không dùng. Tạm dừng để tiết kiệm ${monthly} mỗi tháng.`,
    redNote: (monthly) => `Tạm dừng để tiết kiệm ${monthly} mỗi tháng.`,
    remainingNote: (n) => `Thêm ${n} lần nữa là đủ bù.`,
    doneNote: "Bạn dùng nhiều hơn số tiền bỏ ra.",
    summary: (count, monthly) => `${count} lần trong 30 ngày qua · ${monthly} mỗi tháng`,
    toBreakEven: "Đến khi đủ bù",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Số lần dùng đến khi đủ bù",
    cancelGuide: "Xem hướng dẫn hủy",
    keep: "Tôi sẽ giữ",
    confirm: "OK",
  },
  picker: {
    unit: "lần",
    chooseBar: "Nhấn vào thanh để chọn",
    notUsed: "Chưa dùng",
    perUse: (cost) => `${cost} mỗi lần`,
    ariaLabel: "Số lần dùng",
    valueText: (n, max) => (max ? "10 lần trở lên" : `${n} lần`),
    phone: "Điện thoại",
    typeExact: "Dùng hơn 10 lần? Nhập trực tiếp",
  },
  addCheckIn: {
    registered: "Đã thêm",
    perMonth: "/tháng",
    note: "Sẽ vào ngay hóa đơn giá trị. Bạn có thể sửa sau.",
    justJoined: "Tôi vừa đăng ký",
    done: "Xong",
    later: "Để sau",
  },
  history: {
    deviceApp: { android: "Ứng dụng Android", ios: "Ứng dụng iOS" },
    deviceWeb: (os, mobile) => `Web trên ${mobile ? "điện thoại" : "PC"}${os ? ` ${os}` : ""}`,
    deviceLine: (device, here) => `Thiết bị check-in: ${device}${here ? " (thiết bị này)" : ""}`,
    phoneHours:
      "Tự động check-in từ dữ liệu điện thoại · lấy giá trị lớn hơn giữa thời gian mở ứng dụng và thời gian hiện thông báo phát. Có thể gồm thời gian tạm dừng",
    phoneDays:
      "Tự động check-in từ dữ liệu điện thoại · số ngày dùng trên điện thoại này. Không tính ngày dùng trên PC",
    phoneOther: "Tự động check-in từ dữ liệu điện thoại · không tính việc dùng trên thiết bị khác",
    title: (count) => `Lịch sử check-in (${count})`,
    add: "+ Check-in",
    empty: "Chưa có check-in. Hãy nhập mức dùng tháng này.",
    monthRecord: (month) => `Mức dùng ${month}`,
    chartTitle: "Check-in theo tháng",
    chartGap:
      "Cột nét đứt là tháng chưa check-in. Đó là tháng chưa biết, không phải tháng không dùng.",
    chartOtherMetric: (count) =>
      `${count} lần check-in tính theo cách khác không được đưa vào biểu đồ.`,
    pcTokens: (tokens, apiValue) =>
      `Dữ liệu PC: ${tokens} token${apiValue ? ` · ${apiValue} theo giá API` : ""}`,
  },
  evidence: {
    label: "Căn cứ check-in",
    title: "Check-in cho thấy điều gì",
    average: (count) => `Trung bình ${count} lần check-in gần nhất`,
    last: (perUnit) => `Check-in gần nhất${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Ghi ngày ${date} · ${quantity}`,
    versusPrevious: "So với lần check-in trước",
    increased: (amount) => `Tăng ${amount}`,
    decreased: (amount) => `Giảm ${amount}`,
    same: "Không đổi",
    costSame: (perUnit) => `Chi phí ${perUnit.toLowerCase()} không đổi`,
    costUp: (perUnit, amount) => `Chi phí ${perUnit.toLowerCase()} tăng ${amount}`,
    costDown: (perUnit, amount) => `Chi phí ${perUnit.toLowerCase()} giảm ${amount}`,
    notEnough: "Chưa đủ để so sánh",
    notEnoughHint: "Check-in thêm một lần là so sánh được",
    priceChanged:
      "Giá (phần của bạn) đã thay đổi giữa hai lần check-in, nên thay đổi chi phí mỗi lần có cả thay đổi giá.",
    selfReported:
      "Các con số là giá trị bạn nhập khi check-in. Check-in tự động từ dữ liệu điện thoại chỉ tính điện thoại này, không gồm việc dùng trên thiết bị khác.",
    unknownDate: "Không rõ ngày",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "vi-VN",
  },
  flow: {
    reminderOn: "Đã bật nhắc thanh toán. Thông báo thử sẽ đến sau vài giây.",
    done: (name) => `Đã check-in ${name}`,
    failed: "Không check-in được. Hãy thử lại.",
  },
  storage: {
    measure: "Đo mức dùng bằng tài khoản Google",
    waiting: "Cho phép truy cập Google trong cửa sổ vừa mở, tỷ lệ sẽ được điền.",
    idle: "Đọc dung lượng tài khoản Google của bạn và điền tỷ lệ. Các con số không bao giờ được gửi đến máy chủ SubSlash.",
    noValue:
      "Chưa nhận được kết quả đo. Hãy tự nhập tỷ lệ trên màn hình ứng dụng web, hoặc đo lại.",
    failed: "Không lấy được dung lượng từ Google. Hãy đo lại sau ít phút.",
    noLimit:
      "Tài khoản Google này không có giới hạn dung lượng nên không tính được tỷ lệ. Hãy tự nhập.",
    measured: (limit, usage) =>
      `Bạn đang dùng ${usage} trong giới hạn ${limit} của tài khoản Google này.`,
    family: (measured) =>
      `${measured} Đây là gói dùng chung với gia đình, chỉ mức dùng của tài khoản này không cho biết tỷ lệ của cả gói nên chúng tôi không điền.`,
    planMismatch: (measured, registered) =>
      `${measured} Giới hạn không khớp với gói bạn đã đăng ký (${planName(registered, "vi")}) nên chúng tôi không điền. Có thể là tài khoản khác, hoặc giới hạn của tài khoản gia đình hay công việc.`,
    underOne: " Dưới 1% nên đã điền 1%.",
    choosePlan: " Chọn gói để đối chiếu với giới hạn.",
    doneReading: "Đang chuyển kết quả đo",
    doneFilled: "Đã điền vào check-in",
    doneFilledHint: "Đóng tab này, kiểm tra trong cửa sổ check-in rồi nhấn check-in.",
    doneFailed: "Chưa nhận được kết quả đo",
    doneFailedHint: "Đóng tab này và đo lại từ cửa sổ check-in.",
  },
  freeTier: {
    needed: "Không, tôi cần gói trả phí",
    enough: "Có, có lẽ miễn phí là đủ",
    unsure: "Không chắc",
    question: "Gói miễn phí có đủ không?",
    hint: "Nếu bạn chạm giới hạn sử dụng hoặc dùng mô hình, tính năng trả phí, thì bạn cần gói trả phí.",
  },
  link: {
    invalidTitle: "Đường dẫn check-in này không hợp lệ",
    invalidBody: "Hãy nhấn lại nút trong email, hoặc check-in trên bảng điều khiển.",
    missingTitle: "Thiết bị này không có gói này",
    missingBody:
      "Hãy mở đường dẫn trên thiết bị đã thêm gói, hoặc đăng nhập để đồng bộ các thiết bị.",
    killedTitle: "Gói này đã hủy",
    killedBody: (name) => `“${name}” đã hủy nên không ghi nhận check-in.`,
    dashboard: "Bảng điều khiển →",
  },
};

export const fr: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "Combien de fois l'avez-vous utilisé ces 30 derniers jours ?",
      hint: "",
      unit: "fois",
      quantityLabel: "Utilisations sur 30 jours",
      perUnit: "Par utilisation",
    },
    days: {
      question: "Combien de jours l'avez-vous utilisé sur les 30 derniers ?",
      hint: "Plusieurs fois le même jour comptent pour un jour. Comptez le téléphone et le PC.",
      unit: "jours",
      quantityLabel: "Jours d'utilisation sur 30",
      perUnit: "Par jour",
    },
    hours: {
      question: "Environ combien d'heures l'avez-vous utilisé ces 30 derniers jours ?",
      hint: "Incluez le temps sur TV ou PC et l'écoute écran éteint. 30 minutes par jour font 15 heures.",
      unit: "heures",
      quantityLabel: "Heures d'utilisation sur 30 jours",
      perUnit: "Par heure",
    },
    benefit: {
      question: "Combien d'avantages avez-vous reçus ces 30 derniers jours ?",
      hint: "Additionnez ce que vous auriez payé sans l'adhésion : livraison gratuite, remises, points.",
      unit: "KRW",
      quantityLabel: "Avantages reçus sur 30 jours",
      perUnit: "",
    },
    storage: {
      question: "Quelle part du stockage de votre formule utilisez-vous ?",
      hint: "Vous la trouvez dans les réglages de stockage de l'appareil (iCloud : Réglages › votre nom › iCloud).",
      unit: "%",
      quantityLabel: "Part du stockage utilisée",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => (unit === "%" ? `${value} %` : `${value} ${frUnit(value, unit)}`),
    unitFor: frUnit,
    presetBenefit: (value) => (value === 0 ? "0 ₩" : `${value / 1000} k₩`),
    choose: "Choisissez",
    decrease: (step, unit) => `Retirer ${step} ${frUnit(step, unit)}`,
    increase: (step, unit) => `Ajouter ${step} ${frUnit(step, unit)}`,
    storageOf: (plan, used) => `${used} sur ${plan}`,
    storageGB: (raw) =>
      gbIn(
        raw,
        "moins de 1 Go",
        (v) => `environ ${v.replace("GB", " Go").replace("TB", " To")}`,
        true,
      ),
    orderEvidence: (since, count) =>
      `${count} e-mail${ciPl(count, "", "s")} de commande dans Gmail depuis le ${since}`,
    orderEvidenceNote:
      " trouvé(s). C'est compté dans les e-mails importés, il y en a peut-être plus. Ajoutez la livraison gratuite et les remises obtenues sur ces commandes.",
    sinceDate: (month, day) => `${day} ${monthName("fr", month)}`,
    benefitNumberLocale: "fr-FR",
  },
  modal: {
    title: (name) => `Check-in de ${name}`,
    usesQuestion: "Combien de fois l'avez-vous utilisé ces 30 derniers jours ?",
    usesQuestionBefore: "Ces 30 derniers jours, combien de fois avez-vous utilisé ",
    usesQuestionAfter: " ?",
    timesUnit: "×",
    submit: "Voir l'analyse de valeur",
    noResult: "Voir le résultat",
    accountTitle: "Le compte avec lequel se connecter pour résilier",
    copied: "Copié",
    copyId: "Copier l'identifiant",
    accountBefore: "Vous devez vous connecter avec le compte ",
    accountAfter: " pour voir le menu de résiliation.",
    accountUnknown: "Connectez-vous avec le compte utilisé à l'inscription.",
    paymentMethod: "Moyen de paiement : ",
    openGuide: "Ouvrir le guide de résiliation",
    close: "Fermer",
    newWindow: (label) => `${label} (nouvelle fenêtre)`,
    cancelPage: (name) => `Aller directement à la page de résiliation ${name} (nouvelle fenêtre)`,
    openService: (name) => `Ouvrir ${name} (nouvelle fenêtre)`,
    paymentCancel: (name, direct) =>
      direct ? `Gérer les paiements récurrents dans ${name}` : `Ouvrir ${name}`,
  },
  outcome: {
    unused: (amount) => `Vous avez jeté ${amount} ce mois-ci. Résiliez dès maintenant.`,
    once: (name, amount) => `Ce mois-ci, vous avez utilisé ${name} une fois, pour ${amount}.`,
    perUse: (name, cost) => `Ce mois-ci, ${name} vous a coûté ${cost} par utilisation.`,
    daysNone: (name, monthly) =>
      `Vous n'avez pas utilisé ${name} un seul jour en 30 jours. Vous avez payé ${monthly} pour rien.`,
    daysSome: (name, cost) => `Vous avez payé ${cost} pour chaque jour d'utilisation de ${name}.`,
    hoursNone: (name, monthly) =>
      `Vous n'avez pas utilisé ${name} ces 30 derniers jours. Vous avez payé ${monthly} pour rien.`,
    hoursSome: (name, cost) => `Vous avez payé ${cost} par heure de ${name}.`,
    benefitOver: (monthly, benefit) =>
      `Vous avez récupéré ${benefit} d'avantages, plus que les ${monthly} d'abonnement.`,
    benefitUnder: (monthly, benefit) =>
      `Sur ${monthly} d'abonnement, vous n'avez récupéré que ${benefit} d'avantages.`,
    storageEmpty: (name) =>
      `Si vous ne stockez rien dans ${name}, la formule n'est peut-être pas utile.`,
    storageUsed: (name, percent, gb) =>
      `Vous utilisez ${percent} % (${gb}) de ${planName(name, "fr")}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name} : ${used} La formule ${planName(smaller, "fr")} (${amount}) suffirait largement.`,
    storageBundled: (name, used, extras) =>
      `${name} : ${used} Pour le seul stockage, une formule plus petite suffirait, mais elle n'inclut pas ${extras} : nous ne jugeons donc pas sur le stockage seul.`,
    storageNoSmaller: (name, used) =>
      `${name} : ${used} Une formule plus petite serait trop juste.`,
    storageLowUnknownPlan: (name, percent) =>
      `Vous utilisez ${percent} % du stockage de votre formule ${name}. Choisissez votre formule et nous vous dirons si une plus petite suffirait.`,
    storageUnknownPlan: (name, percent) =>
      `Vous utilisez ${percent} % du stockage de votre formule ${name}.`,
    freeTierEnough: "Si la formule gratuite suffisait, vous pouvez y passer au lieu de résilier.",
    tokensOver: (times) =>
      `Votre usage de jetons sur PC vaut ${times}× l'abonnement au prix de l'API — même avec peu de jours, il est rentabilisé.`,
    tokensUnder: (percent) =>
      `Votre usage de jetons sur PC vaut ${percent} % de l'abonnement au prix de l'API. Le web et l'appli n'étant pas inclus, on juge sur les jours d'utilisation.`,
  },
  metaphor: {
    unusedComparison: (item) => `Une occasion d'économiser ${item}`,
    unusedMessage: (name, item, amount) =>
      `Vous n'avez pas utilisé ${name} ce mois-ci. Mettez l'abonnement en pause un moment et économisez ${item} (${amount}) chaque mois.`,
    movieComparison: (item) => `Une occasion d'économiser ${item}`,
    movieMessage: (cost) =>
      `Si vous ne l'avez utilisé qu'une fois ce mois-ci, pourquoi ne pas le suspendre et économiser une place de cinéma (${cost}) ?`,
    onceComparison: (item) => `Une occasion d'économiser ${item}`,
    onceMessage: (item, cost) =>
      `Une seule utilisation ce mois-ci. Faites une pause et économisez ${item} (${cost}) chaque mois.`,
    warningComparison: (item) => `Environ ${item}`,
    warningMessage: (cost) =>
      `${cost} par utilisation — encore un peu et c'est rentabilisé ! Profitez-en.`,
    cheapComparison: "Moins cher qu'un café",
    cheapMessage: (cost) => `${cost} par utilisation — moins cher qu'un café ! C'est rentabilisé`,
    worthComparison: (item) => `L'équivalent de ${item}`,
    worthMessage: (cost) => `${cost} par utilisation — vous en tirez plus que ce que vous payez !`,
  },
  gauge: {
    none: "Pas encore utilisé ce mois-ci. Utilisez-le davantage, ou mettez-le en pause pour économiser.",
    remaining: (n) => `Encore ${n} utilisation${ciPl(n, "", "s")} pour le rentabiliser !`,
    done: "Rentabilisé ! Vous en faites bon usage.",
    diet: (cost) => `Réduction conseillée (${cost} par utilisation)`,
    achieved: (cost) => `Rentabilisé ! (${cost} par utilisation)`,
    baseline: "Seuil de rentabilité",
  },
  bar: {
    label: "Coût par utilisation",
    footer: (count, monthly) =>
      `${count} utilisation${ciPl(count, "", "s")} au total · base ${monthly}/mois`,
  },
  appResult: {
    green: "Rentable",
    yellow: "Limite",
    red: "À mettre en pause",
    perUse: "Par utilisation",
    unusedNote: (monthly) =>
      `Pas utilisé ces 30 derniers jours. Mettez-le en pause et économisez ${monthly} par mois.`,
    redNote: (monthly) => `Mettez-le en pause et économisez ${monthly} par mois.`,
    remainingNote: (n) => `Encore ${n} utilisation${ciPl(n, "", "s")} et c'est rentabilisé.`,
    doneNote: "Vous en tirez plus que ce que vous payez.",
    summary: (count, monthly) =>
      `${count} utilisation${ciPl(count, "", "s")} ces 30 derniers jours · ${monthly} par mois`,
    toBreakEven: "Pour être rentable",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Utilisations vers la rentabilité",
    cancelGuide: "Voir le guide de résiliation",
    keep: "Je le garde",
    confirm: "OK",
  },
  picker: {
    unit: "×",
    chooseBar: "Touchez la barre pour choisir",
    notUsed: "Pas utilisé",
    perUse: (cost) => `${cost} par utilisation`,
    ariaLabel: "Nombre d'utilisations",
    valueText: (n, max) => (max ? "10 ou plus" : `${n}`),
    phone: "Téléphone",
    typeExact: "Plus de 10 fois ? Saisissez-le",
  },
  addCheckIn: {
    registered: "Ajouté",
    perMonth: "/mois",
    note: "Cela va directement dans votre ticket de valeur. Vous pourrez le modifier.",
    justJoined: "Je viens de m'abonner",
    done: "Terminé",
    later: "Plus tard",
  },
  history: {
    deviceApp: { android: "Appli Android", ios: "Appli iOS" },
    deviceWeb: (os, mobile) => `Web sur ${mobile ? "téléphone" : "PC"}${os ? ` ${os}` : ""}`,
    deviceLine: (device, here) =>
      `Appareil du check-in : ${device}${here ? " (cet appareil)" : ""}`,
    phoneHours:
      "Check-in automatique depuis le téléphone · le plus long entre le temps d'ouverture de l'appli et celui de la notification de lecture. Des pauses peuvent être incluses",
    phoneDays:
      "Check-in automatique depuis le téléphone · jours d'utilisation sur ce téléphone. Les jours sur PC manquent",
    phoneOther: "Check-in automatique depuis le téléphone · l'usage sur d'autres appareils manque",
    title: (count) => `Historique des check-ins (${count})`,
    add: "+ Check-in",
    empty: "Pas encore de check-in. Indiquez votre utilisation du mois.",
    monthRecord: (month) => `Utilisation de ${month}`,
    chartTitle: "Check-ins par mois",
    chartGap:
      "Les barres en pointillés sont les mois sans check-in : on ne sait pas, ce n'est pas zéro.",
    chartOtherMetric: (count) =>
      `${count} check-in${count > 1 ? "s" : ""} mesuré${count > 1 ? "s" : ""} autrement ${count > 1 ? "sont exclus" : "est exclu"} du graphique.`,
    pcTokens: (tokens, apiValue) =>
      `Données du PC : ${tokens} jetons${apiValue ? ` · ${apiValue} au prix de l'API` : ""}`,
  },
  evidence: {
    label: "Fondement du check-in",
    title: "Ce que montrent les check-ins",
    average: (count) =>
      `Moyenne des ${count} dernier${ciPl(count, "", "s")} check-in${ciPl(count, "", "s")}`,
    last: (perUnit) => `Dernier check-in${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Enregistré le ${date} · ${quantity}`,
    versusPrevious: "Par rapport au check-in précédent",
    increased: (amount) => `+${amount}`,
    decreased: (amount) => `−${amount}`,
    same: "Pas de changement",
    costSame: (perUnit) => `Coût ${perUnit.toLowerCase()} inchangé`,
    costUp: (perUnit, amount) => `Coût ${perUnit.toLowerCase()} en hausse de ${amount}`,
    costDown: (perUnit, amount) => `Coût ${perUnit.toLowerCase()} en baisse de ${amount}`,
    notEnough: "Pas assez pour comparer",
    notEnoughHint: "Comparaison possible après un check-in de plus",
    priceChanged:
      "Votre prix (votre part) a changé entre les deux check-ins : la variation du coût unitaire inclut celle du prix.",
    selfReported:
      "Les chiffres sont ceux saisis lors du check-in. Les check-ins automatiques ne couvrent que ce téléphone : l'usage sur d'autres appareils manque.",
    unknownDate: "Date inconnue",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "fr-FR",
  },
  flow: {
    reminderOn:
      "Les rappels de paiement sont activés. Une notification de test arrive dans quelques secondes.",
    done: (name) => `Check-in de ${name} effectué`,
    failed: "Check-in impossible. Veuillez réessayer.",
  },
  storage: {
    measure: "Mesurer l'utilisation avec votre compte Google",
    waiting: "Autorisez l'accès Google dans la fenêtre ouverte et nous remplirons le pourcentage.",
    idle: "Nous lisons le stockage de votre compte Google et remplissons le pourcentage. Les chiffres ne sont jamais envoyés aux serveurs SubSlash.",
    noValue:
      "Aucune mesure reçue. Saisissez vous-même le pourcentage affiché par l'appli web, ou mesurez à nouveau.",
    failed: "Impossible d'obtenir le stockage auprès de Google. Mesurez à nouveau dans un instant.",
    noLimit:
      "Ce compte Google n'a pas de limite de stockage : impossible de calculer un pourcentage. Saisissez-le vous-même.",
    measured: (limit, usage) =>
      `Vous utilisez ${usage} sur la limite de ${limit} de ce compte Google.`,
    family: (measured) =>
      `${measured} C'est une formule partagée en famille, et l'usage de ce seul compte ne donne pas la part de toute la formule : nous ne l'avons pas rempli.`,
    planMismatch: (measured, registered) =>
      `${measured} La limite ne correspond pas à la formule enregistrée (${planName(registered, "fr")}), nous ne l'avons donc pas remplie. Il s'agit peut-être d'un autre compte, ou de la limite d'un compte famille ou professionnel.`,
    underOne: " C'était moins de 1 %, nous avons donc mis 1 %.",
    choosePlan: " Choisissez votre formule et nous la comparerons à la limite.",
    doneReading: "Transmission de la mesure",
    doneFilled: "Rempli dans le check-in",
    doneFilledHint: "Fermez cet onglet, vérifiez dans la fenêtre de check-in, puis validez.",
    doneFailed: "Aucune mesure reçue",
    doneFailedHint: "Fermez cet onglet et mesurez à nouveau depuis la fenêtre de check-in.",
  },
  freeTier: {
    needed: "Non, j'avais besoin de la formule payante",
    enough: "Oui, le gratuit aurait sans doute suffi",
    unsure: "Je ne sais pas",
    question: "La formule gratuite aurait-elle suffi ?",
    hint: "Si vous avez atteint des limites d'utilisation ou utilisé des modèles ou fonctions payants, la formule payante était nécessaire.",
  },
  link: {
    invalidTitle: "Ce lien de check-in n'est pas valide",
    invalidBody:
      "Touchez à nouveau le bouton de l'e-mail, ou faites le check-in depuis le tableau de bord.",
    missingTitle: "Cet appareil n'a pas cet abonnement",
    missingBody:
      "Ouvrez le lien sur l'appareil où vous l'avez ajouté, ou connectez-vous pour synchroniser vos appareils.",
    killedTitle: "Cet abonnement est déjà résilié",
    killedBody: (name) => `« ${name} » est résilié, aucun check-in n'a donc été enregistré.`,
    dashboard: "Tableau de bord →",
  },
};

export const es: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "¿Cuántas veces la usaste en los últimos 30 días?",
      hint: "",
      unit: "veces",
      quantityLabel: "Usos en 30 días",
      perUnit: "Por uso",
    },
    days: {
      question: "¿Cuántos de los últimos 30 días la usaste?",
      hint: "Varias veces en un mismo día cuentan como un día. Cuenta el móvil y el PC.",
      unit: "días",
      quantityLabel: "Días de uso de 30",
      perUnit: "Por día",
    },
    hours: {
      question: "¿Unas cuántas horas la usaste en los últimos 30 días?",
      hint: "Incluye el tiempo en TV o PC y lo que escuchaste con la pantalla apagada. 30 minutos al día son 15 horas.",
      unit: "horas",
      quantityLabel: "Horas de uso en 30 días",
      perUnit: "Por hora",
    },
    benefit: {
      question: "¿Cuántas ventajas recibiste en los últimos 30 días?",
      hint: "Suma lo que habrías pagado sin la membresía: envíos gratis, descuentos, puntos.",
      unit: "KRW",
      quantityLabel: "Ventajas recibidas en 30 días",
      perUnit: "",
    },
    storage: {
      question: "¿Cuánto del almacenamiento de tu plan usas?",
      hint: "Lo ves en los ajustes de almacenamiento del dispositivo (iCloud: Ajustes › tu nombre › iCloud).",
      unit: "%",
      quantityLabel: "Parte del almacenamiento usada",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => (unit === "%" ? `${value} %` : `${value} ${esUnit(value, unit)}`),
    unitFor: esUnit,
    presetBenefit: (value) => (value === 0 ? "0 ₩" : `${value / 1000} mil ₩`),
    choose: "Elige uno",
    decrease: (step, unit) => `Restar ${step} ${esUnit(step, unit)}`,
    increase: (step, unit) => `Sumar ${step} ${esUnit(step, unit)}`,
    storageOf: (plan, used) => `${used} de ${plan}`,
    storageGB: (raw) =>
      gbIn(
        raw,
        "menos de 1 GB",
        (v) => `unos ${v.replace("GB", " GB").replace("TB", " TB")}`,
        true,
      ),
    orderEvidence: (since, count) =>
      `${count} correo${ciPl(count, "", "s")} de pedidos en Gmail desde el ${since}`,
    orderEvidenceNote:
      ". Se contó entre los correos importados, así que puede haber más. Suma los envíos gratis y descuentos que obtuviste en esos pedidos.",
    sinceDate: (month, day) => `${day} de ${monthName("es", month)}`,
    benefitNumberLocale: "es-ES",
  },
  modal: {
    title: (name) => `Registro de uso de ${name}`,
    usesQuestion: "¿Cuántas veces la usaste en los últimos 30 días?",
    usesQuestionBefore: "En los últimos 30 días, ¿cuántas veces usaste ",
    usesQuestionAfter: "?",
    timesUnit: "×",
    submit: "Ver el análisis de valor",
    noResult: "Ver el resultado",
    accountTitle: "La cuenta con la que entrar para cancelar",
    copied: "Copiado",
    copyId: "Copiar ID",
    accountBefore: "Tienes que iniciar sesión con la cuenta ",
    accountAfter: " para ver el menú de cancelación.",
    accountUnknown: "Inicia sesión con la cuenta con la que te registraste.",
    paymentMethod: "Método de pago: ",
    openGuide: "Abrir la guía de cancelación",
    close: "Cerrar",
    newWindow: (label) => `${label} (ventana nueva)`,
    cancelPage: (name) => `Ir directo a la página de cancelación de ${name} (ventana nueva)`,
    openService: (name) => `Abrir ${name} (ventana nueva)`,
    paymentCancel: (name, direct) =>
      direct ? `Gestionar pagos recurrentes en ${name}` : `Abrir ${name}`,
  },
  outcome: {
    unused: (amount) => `Este mes tiraste ${amount}. Cancela ahora mismo.`,
    once: (name, amount) => `Este mes usaste ${name} una vez, por ${amount}.`,
    perUse: (name, cost) => `Este mes ${name} te costó ${cost} por uso.`,
    daysNone: (name, monthly) =>
      `No usaste ${name} ni un día en los últimos 30. Pagaste ${monthly} para nada.`,
    daysSome: (name, cost) => `Pagaste ${cost} por cada día que usaste ${name}.`,
    hoursNone: (name, monthly) =>
      `No usaste ${name} en los últimos 30 días. Pagaste ${monthly} para nada.`,
    hoursSome: (name, cost) => `Pagaste ${cost} por hora de ${name}.`,
    benefitOver: (monthly, benefit) =>
      `Recuperaste ${benefit} en ventajas, más que la cuota de ${monthly}.`,
    benefitUnder: (monthly, benefit) =>
      `De la cuota de ${monthly}, solo recuperaste ${benefit} en ventajas.`,
    storageEmpty: (name) => `Si no guardas nada en ${name}, quizá no necesites el plan.`,
    storageUsed: (name, percent, gb) => `Usas el ${percent} % (${gb}) de ${planName(name, "es")}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} Cabría de sobra en el plan ${planName(smaller, "es")} (${amount}).`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} Solo por almacenamiento cabría en un plan menor, pero ese plan no incluye ${extras}, así que no juzgamos solo por el almacenamiento.`,
    storageNoSmaller: (name, used) => `${name}: ${used} En un plan menor iría muy justo.`,
    storageLowUnknownPlan: (name, percent) =>
      `Usas el ${percent} % del almacenamiento de tu plan de ${name}. Elige tu plan y te diremos si cabría en uno menor.`,
    storageUnknownPlan: (name, percent) =>
      `Usas el ${percent} % del almacenamiento de tu plan de ${name}.`,
    freeTierEnough: "Si el plan gratuito bastaba, puedes pasarte a él en lugar de cancelar.",
    tokensOver: (times) =>
      `Tu uso de tokens en el PC equivale a ${times}× la cuota a precio de API: aunque sean pocos días, ya la amortizaste.`,
    tokensUnder: (percent) =>
      `Tu uso de tokens en el PC equivale al ${percent} % de la cuota a precio de API. No incluye la web ni la app, así que se juzga por los días de uso.`,
  },
  metaphor: {
    unusedComparison: (item) => `Una oportunidad de ahorrar ${item}`,
    unusedMessage: (name, item, amount) =>
      `Este mes no usaste ${name}. Pausa la suscripción un tiempo y podrías ahorrar ${item} (${amount}) cada mes.`,
    movieComparison: (item) => `Una oportunidad de ahorrar ${item}`,
    movieMessage: (cost) =>
      `Si solo la usaste una vez este mes, ¿por qué no pausarla y ahorrarte una entrada de cine (${cost})?`,
    onceComparison: (item) => `Una oportunidad de ahorrar ${item}`,
    onceMessage: (item, cost) =>
      `Este mes la usaste una vez. Tómate un descanso y podrías ahorrar ${item} (${cost}) cada mes.`,
    warningComparison: (item) => `Unos ${item}`,
    warningMessage: (cost) => `${cost} por uso: ¡úsala un poco más y la amortizas! Disfrútala.`,
    cheapComparison: "Más barato que un café",
    cheapMessage: (cost) => `${cost} por uso: ¡más barato que un café! Ya la amortizaste`,
    worthComparison: (item) => `Equivale a ${item}`,
    worthMessage: (cost) => `${cost} por uso: ¡le sacas más de lo que pagas!`,
  },
  gauge: {
    none: "Aún no la usaste este mes. Úsala más, o páusala y ahorra el dinero.",
    remaining: (n) => `¡${n} uso${ciPl(n, "", "s")} más para amortizarla!`,
    done: "¡Amortizada! La estás aprovechando bien.",
    diet: (cost) => `Recorte sugerido (${cost} por uso)`,
    achieved: (cost) => `¡Amortizada! (${cost} por uso)`,
    baseline: "Línea de amortización",
  },
  bar: {
    label: "Coste por uso",
    footer: (count, monthly) => `${count} uso${ciPl(count, "", "s")} en total · con ${monthly}/mes`,
  },
  appResult: {
    green: "Vale la pena",
    yellow: "Al límite",
    red: "Se puede pausar",
    perUse: "Por uso",
    unusedNote: (monthly) =>
      `No la usaste en los últimos 30 días. Páusala y ahorra ${monthly} al mes.`,
    redNote: (monthly) => `Páusala y ahorra ${monthly} al mes.`,
    remainingNote: (n) => `${n} uso${ciPl(n, "", "s")} más y la amortizas.`,
    doneNote: "Le sacas más de lo que pagas.",
    summary: (count, monthly) =>
      `${count} uso${ciPl(count, "", "s")} en los últimos 30 días · ${monthly} al mes`,
    toBreakEven: "Para amortizarla",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Usos hacia la amortización",
    cancelGuide: "Ver la guía de cancelación",
    keep: "Me la quedo",
    confirm: "Aceptar",
  },
  picker: {
    unit: "×",
    chooseBar: "Toca la barra para elegir",
    notUsed: "Sin usar",
    perUse: (cost) => `${cost} por uso`,
    ariaLabel: "Número de usos",
    valueText: (n, max) => (max ? "10 o más" : `${n}`),
    phone: "Móvil",
    typeExact: "¿Más de 10 veces? Escríbelo",
  },
  addCheckIn: {
    registered: "Añadida",
    perMonth: "/mes",
    note: "Va directo a tu ticket de valor. Puedes cambiarlo después.",
    justJoined: "Me acabo de suscribir",
    done: "Listo",
    later: "Más tarde",
  },
  history: {
    deviceApp: { android: "App de Android", ios: "App de iOS" },
    deviceWeb: (os, mobile) => `Web en ${mobile ? "móvil" : "PC"}${os ? ` ${os}` : ""}`,
    deviceLine: (device, here) =>
      `Dispositivo del check-in: ${device}${here ? " (este dispositivo)" : ""}`,
    phoneHours:
      "Registro automático con el móvil · el mayor entre el tiempo con la app abierta y el de la notificación de reproducción. Puede incluir pausas",
    phoneDays:
      "Registro automático con el móvil · días de uso en este móvil. Faltan los días en el PC",
    phoneOther: "Registro automático con el móvil · falta el uso en otros dispositivos",
    title: (count) => `Historial de registros (${count})`,
    add: "+ Registrar",
    empty: "Aún no hay registros. Indica cuánto la usaste este mes.",
    monthRecord: (month) => `Uso de ${month}`,
    chartTitle: "Check-ins por mes",
    chartGap: "Las barras punteadas son meses sin check-in: no se sabe, no es que no se usara.",
    chartOtherMetric: (count) =>
      `${count} check-in${count === 1 ? "" : "s"} medido${count === 1 ? "" : "s"} de otra forma no ${count === 1 ? "aparece" : "aparecen"} en el gráfico.`,
    pcTokens: (tokens, apiValue) =>
      `Registros del PC: ${tokens} tokens${apiValue ? ` · ${apiValue} a precio de API` : ""}`,
  },
  evidence: {
    label: "Base del registro",
    title: "Lo que muestran los registros",
    average: (count) => `Media de los últimos ${count} registro${ciPl(count, "", "s")}`,
    last: (perUnit) => `Último registro${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Registrado el ${date} · ${quantity}`,
    versusPrevious: "Frente al registro anterior",
    increased: (amount) => `Sube ${amount}`,
    decreased: (amount) => `Baja ${amount}`,
    same: "Sin cambios",
    costSame: (perUnit) => `Coste ${perUnit.toLowerCase()} sin cambios`,
    costUp: (perUnit, amount) => `Coste ${perUnit.toLowerCase()} sube ${amount}`,
    costDown: (perUnit, amount) => `Coste ${perUnit.toLowerCase()} baja ${amount}`,
    notEnough: "No basta para comparar",
    notEnoughHint: "Podremos comparar con un registro más",
    priceChanged:
      "Tu precio (tu parte) cambió entre los dos registros, así que el cambio del coste por uso incluye el del precio.",
    selfReported:
      "Las cifras son lo que escribiste al registrar. Los registros automáticos del móvil solo cubren este móvil, así que falta el uso en otros dispositivos.",
    unknownDate: "Fecha desconocida",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "es-ES",
  },
  flow: {
    reminderOn:
      "Los recordatorios de cobro están activados. En unos segundos llegará una notificación de prueba.",
    done: (name) => `${name} registrada`,
    failed: "No se pudo registrar. Inténtalo de nuevo.",
  },
  storage: {
    measure: "Medir el uso con tu cuenta de Google",
    waiting: "Permite el acceso de Google en la ventana que se abrió y rellenaremos el porcentaje.",
    idle: "Leemos el almacenamiento de tu cuenta de Google y rellenamos el porcentaje. Las cifras nunca se envían a los servidores de SubSlash.",
    noValue:
      "No llegó ninguna medición. Escribe tú el porcentaje de la pantalla de la app web o vuelve a medir.",
    failed: "No se pudo obtener el almacenamiento de Google. Vuelve a medir en un momento.",
    noLimit:
      "Esta cuenta de Google no tiene límite de almacenamiento, así que no se puede calcular un porcentaje. Escríbelo tú.",
    measured: (limit, usage) => `Usas ${usage} del límite de ${limit} de esta cuenta de Google.`,
    family: (measured) =>
      `${measured} Es un plan compartido con la familia, y el uso de esta cuenta sola no da la parte de todo el plan, así que no lo rellenamos.`,
    planMismatch: (measured, registered) =>
      `${measured} El límite no coincide con el plan registrado (${planName(registered, "es")}), así que no lo rellenamos. Puede ser otra cuenta, o el límite de una cuenta familiar o de trabajo.`,
    underOne: " Era menos del 1 %, así que pusimos 1 %.",
    choosePlan: " Elige tu plan y lo compararemos con el límite.",
    doneReading: "Pasando la medición",
    doneFilled: "Rellenado en el registro",
    doneFilledHint: "Cierra esta pestaña, revísalo en la ventana de registro y pulsa registrar.",
    doneFailed: "No llegó ninguna medición",
    doneFailedHint: "Cierra esta pestaña y vuelve a medir desde la ventana de registro.",
  },
  freeTier: {
    needed: "No, necesitaba el plan de pago",
    enough: "Sí, el gratuito probablemente bastaba",
    unsure: "No estoy seguro",
    question: "¿Habría bastado el plan gratuito?",
    hint: "Si llegaste a límites de uso o usaste modelos o funciones de pago, necesitabas el plan de pago.",
  },
  link: {
    invalidTitle: "Este enlace de registro no es válido",
    invalidBody: "Vuelve a pulsar el botón del correo o registra desde el panel.",
    missingTitle: "Este dispositivo no tiene esta suscripción",
    missingBody:
      "Abre el enlace en el dispositivo donde la añadiste, o inicia sesión para sincronizar tus dispositivos.",
    killedTitle: "Esta suscripción ya está cancelada",
    killedBody: (name) => `«${name}» está cancelada, así que no se registró nada.`,
    dashboard: "Panel →",
  },
};

export const de: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "Wie oft hast du es in den letzten 30 Tagen genutzt?",
      hint: "",
      unit: "-mal",
      quantityLabel: "Nutzungen in 30 Tagen",
      perUnit: "Pro Nutzung",
    },
    days: {
      question: "An wie vielen der letzten 30 Tage hast du es genutzt?",
      hint: "Mehrmals am selben Tag zählt als ein Tag. Zähl Handy und PC mit.",
      unit: "Tage",
      quantityLabel: "Nutzungstage von 30",
      perUnit: "Pro Tag",
    },
    hours: {
      question: "Etwa wie viele Stunden hast du es in den letzten 30 Tagen genutzt?",
      hint: "Rechne Zeit auf TV oder PC und Hören bei ausgeschaltetem Bildschirm mit. 30 Minuten am Tag sind 15 Stunden.",
      unit: "Stunden",
      quantityLabel: "Nutzungsstunden in 30 Tagen",
      perUnit: "Pro Stunde",
    },
    benefit: {
      question: "Wie viel an Vorteilen hast du in den letzten 30 Tagen bekommen?",
      hint: "Rechne zusammen, was du ohne Mitgliedschaft gezahlt hättest: kostenloser Versand, Rabatte, Punkte.",
      unit: "KRW",
      quantityLabel: "Erhaltene Vorteile in 30 Tagen",
      perUnit: "",
    },
    storage: {
      question: "Wie viel vom Speicher deines Tarifs nutzt du?",
      hint: "Das siehst du in den Speichereinstellungen des Geräts (iCloud: Einstellungen › dein Name › iCloud).",
      unit: "%",
      quantityLabel: "Genutzter Anteil am Speicher",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) =>
      unit === "%"
        ? `${value} %`
        : unit === "-mal"
          ? `${value}-mal`
          : `${value} ${deUnit(value, unit)}`,
    unitFor: deUnit,
    presetBenefit: (value) => (value === 0 ? "0 ₩" : `${value / 1000} Tsd. ₩`),
    choose: "Bitte wählen",
    decrease: (step, unit) => `${step} ${deUnit(step, unit)} abziehen`.replace(" -mal", "-mal"),
    increase: (step, unit) => `${step} ${deUnit(step, unit)} hinzufügen`.replace(" -mal", "-mal"),
    storageOf: (plan, used) => `${used} von ${plan}`,
    storageGB: (raw) =>
      gbIn(raw, "unter 1 GB", (v) => `etwa ${v.replace("GB", " GB").replace("TB", " TB")}`, true),
    orderEvidence: (since, count) =>
      `${count} Bestell-E-Mail${ciPl(count, "", "s")} in Gmail seit ${since}`,
    orderEvidenceNote:
      " gefunden. Gezählt wurde nur in den importierten E-Mails, es können also mehr sein. Rechne den kostenlosen Versand und die Rabatte dieser Bestellungen dazu.",
    sinceDate: (month, day) => `${day}. ${monthName("de", month)}`,
    benefitNumberLocale: "de-DE",
  },
  modal: {
    title: (name) => `Nutzung von ${name} eintragen`,
    usesQuestion: "Wie oft hast du es in den letzten 30 Tagen genutzt?",
    usesQuestionBefore: "Wie oft hast du in den letzten 30 Tagen ",
    usesQuestionAfter: " genutzt?",
    timesUnit: "×",
    submit: "Wertanalyse ansehen",
    noResult: "Ergebnis ansehen",
    accountTitle: "Mit welchem Konto du dich zum Kündigen anmeldest",
    copied: "Kopiert",
    copyId: "ID kopieren",
    accountBefore: "Du musst dich mit dem Konto ",
    accountAfter: " anmelden, um das Kündigungsmenü zu sehen.",
    accountUnknown: "Melde dich mit dem Konto an, mit dem du dich registriert hast.",
    paymentMethod: "Zahlungsmethode: ",
    openGuide: "Kündigungshilfe öffnen",
    close: "Schließen",
    newWindow: (label) => `${label} (neues Fenster)`,
    cancelPage: (name) => `Direkt zur Kündigungsseite von ${name} (neues Fenster)`,
    openService: (name) => `${name} öffnen (neues Fenster)`,
    paymentCancel: (name, direct) =>
      direct ? `Wiederkehrende Zahlungen in ${name} verwalten` : `${name} öffnen`,
  },
  outcome: {
    unused: (amount) => `Diesen Monat hast du ${amount} verschenkt. Kündige jetzt sofort.`,
    once: (name, amount) => `Diesen Monat hast du ${name} einmal genutzt, für ${amount}.`,
    perUse: (name, cost) => `Diesen Monat hat dich ${name} ${cost} pro Nutzung gekostet.`,
    daysNone: (name, monthly) =>
      `Du hast ${name} in den letzten 30 Tagen an keinem Tag genutzt. Du hast ${monthly} umsonst gezahlt.`,
    daysSome: (name, cost) =>
      `Du hast ${cost} für jeden Tag gezahlt, an dem du ${name} genutzt hast.`,
    hoursNone: (name, monthly) =>
      `Du hast ${name} in den letzten 30 Tagen nicht genutzt. Du hast ${monthly} umsonst gezahlt.`,
    hoursSome: (name, cost) => `Du hast ${cost} pro Stunde ${name} gezahlt.`,
    benefitOver: (monthly, benefit) =>
      `Du hast ${benefit} an Vorteilen zurückbekommen, mehr als die ${monthly} Gebühr.`,
    benefitUnder: (monthly, benefit) =>
      `Von ${monthly} Gebühr hast du nur ${benefit} an Vorteilen zurückbekommen.`,
    storageEmpty: (name) =>
      `Wenn du nichts in ${name} speicherst, brauchst du den Tarif vielleicht nicht.`,
    storageUsed: (name, percent, gb) =>
      `Du nutzt ${percent} % (${gb}) von ${planName(name, "de")}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} Es würde bequem in den Tarif ${planName(smaller, "de")} (${amount}) passen.`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} Rein vom Speicher passt ein kleinerer Tarif, aber dieser enthält ${extras} nicht, daher urteilen wir nicht nur nach dem Speicher.`,
    storageNoSmaller: (name, used) =>
      `${name}: ${used} In einen kleineren Tarif würde es nicht bequem passen.`,
    storageLowUnknownPlan: (name, percent) =>
      `Du nutzt ${percent} % des Speichers deines ${name}-Tarifs. Wähl deinen Tarif, dann sagen wir dir, ob ein kleinerer passt.`,
    storageUnknownPlan: (name, percent) =>
      `Du nutzt ${percent} % des Speichers deines ${name}-Tarifs.`,
    freeTierEnough:
      "Wenn der kostenlose Tarif gereicht hat, kannst du statt zu kündigen auf ihn wechseln.",
    tokensOver: (times) =>
      `Deine Token-Nutzung am PC entspricht zu API-Preisen dem ${times}-Fachen der Gebühr — auch an wenigen Tagen hat es sich gelohnt.`,
    tokensUnder: (percent) =>
      `Deine Token-Nutzung am PC entspricht zu API-Preisen ${percent} % der Gebühr. Web und App fehlen, daher wird nach Nutzungstagen beurteilt.`,
  },
  metaphor: {
    unusedComparison: (item) => `Eine Chance, ${item} zu sparen`,
    unusedMessage: (name, item, amount) =>
      `Du hast ${name} diesen Monat nicht genutzt. Pausier das Abo eine Weile und spar jeden Monat ${item} (${amount}).`,
    movieComparison: (item) => `Eine Chance, ${item} zu sparen`,
    movieMessage: (cost) =>
      `Wenn du es diesen Monat nur einmal genutzt hast, pausier es doch und spar den Preis eines Kinotickets (${cost}).`,
    onceComparison: (item) => `Eine Chance, ${item} zu sparen`,
    onceMessage: (item, cost) =>
      `Diesen Monat einmal genutzt. Mach jetzt eine Pause und spar jeden Monat ${item} (${cost}).`,
    warningComparison: (item) => `Etwa ${item}`,
    warningMessage: (cost) =>
      `${cost} pro Nutzung — noch ein bisschen mehr, dann lohnt es sich! Viel Spaß damit.`,
    cheapComparison: "Günstiger als ein Kaffee",
    cheapMessage: (cost) => `${cost} pro Nutzung — günstiger als ein Kaffee! Es hat sich gelohnt`,
    worthComparison: (item) => `So viel wert wie ${item}`,
    worthMessage: (cost) => `${cost} pro Nutzung — du bekommst mehr, als du zahlst!`,
  },
  gauge: {
    none: "Diesen Monat noch nicht genutzt. Nutz es mehr oder pausier es und spar das Geld.",
    remaining: (n) => `Noch ${n} ${ciPl(n, "Nutzung", "Nutzungen")}, dann lohnt es sich!`,
    done: "Hat sich gelohnt! Du nutzt es gut.",
    diet: (cost) => `Kürzen empfohlen (${cost} pro Nutzung)`,
    achieved: (cost) => `Hat sich gelohnt! (${cost} pro Nutzung)`,
    baseline: "Lohnt-sich-Linie",
  },
  bar: {
    label: "Kosten pro Nutzung",
    footer: (count, monthly) => `${count}-mal insgesamt · bei ${monthly}/Monat`,
  },
  appResult: {
    green: "Lohnt sich",
    yellow: "Grenzwertig",
    red: "Kann pausieren",
    perUse: "Pro Nutzung",
    unusedNote: (monthly) =>
      `In den letzten 30 Tagen nicht genutzt. Pausier es und spar ${monthly} im Monat.`,
    redNote: (monthly) => `Pausier es und spar ${monthly} im Monat.`,
    remainingNote: (n) => `Noch ${n} ${ciPl(n, "Nutzung", "Nutzungen")}, dann lohnt es sich.`,
    doneNote: "Du bekommst mehr, als du zahlst.",
    summary: (count, monthly) => `${count}-mal in den letzten 30 Tagen · ${monthly} im Monat`,
    toBreakEven: "Bis es sich lohnt",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Nutzungen bis es sich lohnt",
    cancelGuide: "Kündigungshilfe ansehen",
    keep: "Ich behalte es",
    confirm: "OK",
  },
  picker: {
    unit: "×",
    chooseBar: "Tippe auf den Balken",
    notUsed: "Nicht genutzt",
    perUse: (cost) => `${cost} pro Nutzung`,
    ariaLabel: "Anzahl der Nutzungen",
    valueText: (n, max) => (max ? "10 oder mehr" : `${n}`),
    phone: "Handy",
    typeExact: "Mehr als 10-mal genutzt? Gib es ein",
  },
  addCheckIn: {
    registered: "Hinzugefügt",
    perMonth: "/Mon.",
    note: "Es landet direkt in deinem Wert-Beleg. Du kannst es später ändern.",
    justJoined: "Gerade erst abonniert",
    done: "Fertig",
    later: "Später",
  },
  history: {
    deviceApp: { android: "Android-App", ios: "iOS-App" },
    deviceWeb: (os, mobile) => `Web auf ${os ? `${os}-` : ""}${mobile ? "Handy" : "PC"}`,
    deviceLine: (device, here) => `Check-in-Gerät: ${device}${here ? " (dieses Gerät)" : ""}`,
    phoneHours:
      "Automatischer Eintrag aus Handydaten · der längere Wert aus App-Öffnungszeit und Wiedergabe-Benachrichtigung. Pausen können enthalten sein",
    phoneDays:
      "Automatischer Eintrag aus Handydaten · Nutzungstage auf diesem Handy. Tage am PC fehlen",
    phoneOther: "Automatischer Eintrag aus Handydaten · Nutzung auf anderen Geräten fehlt",
    title: (count) => `Eintragsverlauf (${count})`,
    add: "+ Eintragen",
    empty: "Noch keine Einträge. Gib ein, wie viel du es diesen Monat genutzt hast.",
    monthRecord: (month) => `Nutzung ${month}`,
    chartTitle: "Check-ins nach Monat",
    chartGap: "Gestrichelte Balken sind Monate ohne Check-in – unbekannt, nicht ungenutzt.",
    chartOtherMetric: (count) =>
      `${count} anders gemessene${count === 1 ? "r" : ""} Check-in${count === 1 ? "" : "s"} ${count === 1 ? "ist" : "sind"} nicht im Diagramm.`,
    pcTokens: (tokens, apiValue) =>
      `PC-Daten: ${tokens} Tokens${apiValue ? ` · ${apiValue} zu API-Preisen` : ""}`,
  },
  evidence: {
    label: "Grundlage der Einträge",
    title: "Was die Einträge zeigen",
    average: (count) => `Durchschnitt der letzten ${count} ${ciPl(count, "Eintrag", "Einträge")}`,
    last: (perUnit) => `Letzter Eintrag${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Eingetragen am ${date} · ${quantity}`,
    versusPrevious: "Im Vergleich zum vorigen Eintrag",
    increased: (amount) => `Plus ${amount}`,
    decreased: (amount) => `Minus ${amount}`,
    same: "Unverändert",
    costSame: (perUnit) => `Kosten ${perUnit.toLowerCase()} unverändert`,
    costUp: (perUnit, amount) => `Kosten ${perUnit.toLowerCase()} um ${amount} gestiegen`,
    costDown: (perUnit, amount) => `Kosten ${perUnit.toLowerCase()} um ${amount} gesunken`,
    notEnough: "Zu wenig für einen Vergleich",
    notEnoughHint: "Mit einem weiteren Eintrag können wir vergleichen",
    priceChanged:
      "Dein Preis (dein Anteil) hat sich zwischen den beiden Einträgen geändert, daher enthält die Änderung der Kosten pro Nutzung auch die Preisänderung.",
    selfReported:
      "Die Zahlen sind deine Eingaben beim Eintragen. Automatische Einträge aus Handydaten umfassen nur dieses Handy, Nutzung auf anderen Geräten fehlt.",
    unknownDate: "Datum unbekannt",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "de-DE",
  },
  flow: {
    reminderOn:
      "Abbuchungserinnerungen sind an. In wenigen Sekunden kommt eine Test-Benachrichtigung.",
    done: (name) => `${name} eingetragen`,
    failed: "Eintragen fehlgeschlagen. Bitte versuch es erneut.",
  },
  storage: {
    measure: "Nutzung mit deinem Google-Konto messen",
    waiting:
      "Erlaube im geöffneten Fenster den Google-Zugriff, dann tragen wir den Prozentsatz ein.",
    idle: "Wir lesen den Speicher deines Google-Kontos und tragen den Prozentsatz ein. Die Zahlen gehen nie an SubSlash-Server.",
    noValue:
      "Keine Messung erhalten. Gib den Prozentsatz aus der Web-App selbst ein oder miss erneut.",
    failed: "Der Speicher konnte nicht von Google abgerufen werden. Bitte miss gleich noch einmal.",
    noLimit:
      "Dieses Google-Konto hat kein Speicherlimit, daher lässt sich kein Prozentsatz berechnen. Bitte gib ihn selbst ein.",
    measured: (limit, usage) => `Du nutzt ${usage} vom Limit ${limit} dieses Google-Kontos.`,
    family: (measured) =>
      `${measured} Das ist ein mit der Familie geteilter Tarif, und die Nutzung dieses Kontos allein ergibt nicht den Anteil am ganzen Tarif, daher haben wir nichts eingetragen.`,
    planMismatch: (measured, registered) =>
      `${measured} Das Limit passt nicht zum eingetragenen Tarif (${planName(registered, "de")}), daher haben wir nichts eingetragen. Es könnte ein anderes Konto oder das Limit eines Familien- oder Arbeitskontos sein.`,
    underOne: " Es war unter 1 %, daher haben wir 1 % eingetragen.",
    choosePlan: " Wähl deinen Tarif, dann gleichen wir das Limit ab.",
    doneReading: "Messung wird übergeben",
    doneFilled: "In den Eintrag übernommen",
    doneFilledHint: "Schließ diesen Tab, prüf es im Eintragsfenster und tippe dann auf Eintragen.",
    doneFailed: "Keine Messung erhalten",
    doneFailedHint: "Schließ diesen Tab und miss erneut aus dem Eintragsfenster.",
  },
  freeTier: {
    needed: "Nein, ich brauchte den kostenpflichtigen Tarif",
    enough: "Ja, kostenlos hätte wohl gereicht",
    unsure: "Unsicher",
    question: "Hätte der kostenlose Tarif gereicht?",
    hint: "Wenn du an Nutzungsgrenzen gestoßen bist oder kostenpflichtige Modelle oder Funktionen genutzt hast, brauchtest du den kostenpflichtigen Tarif.",
  },
  link: {
    invalidTitle: "Dieser Eintragslink ist ungültig",
    invalidBody:
      "Tippe noch einmal auf den Button in der E-Mail oder trag es in der Übersicht ein.",
    missingTitle: "Dieses Gerät hat dieses Abo nicht",
    missingBody:
      "Öffne den Link auf dem Gerät, auf dem du es hinzugefügt hast, oder melde dich an, um deine Geräte abzugleichen.",
    killedTitle: "Dieses Abo ist bereits gekündigt",
    killedBody: (name) => `„${name}“ ist gekündigt, daher wurde nichts eingetragen.`,
    dashboard: "Übersicht →",
  },
};

export const pt: Widen<typeof ko> = {
  metric: {
    uses: {
      question: "Quantas vezes você usou nos últimos 30 dias?",
      hint: "",
      unit: "vezes",
      quantityLabel: "Usos em 30 dias",
      perUnit: "Por uso",
    },
    days: {
      question: "Em quantos dos últimos 30 dias você usou?",
      hint: "Várias vezes no mesmo dia contam como um dia. Conte celular e PC.",
      unit: "dias",
      quantityLabel: "Dias de uso em 30",
      perUnit: "Por dia",
    },
    hours: {
      question: "Mais ou menos quantas horas você usou nos últimos 30 dias?",
      hint: "Inclua o tempo na TV ou no PC e o que ouviu com a tela desligada. 30 minutos por dia dão 15 horas.",
      unit: "horas",
      quantityLabel: "Horas de uso em 30 dias",
      perUnit: "Por hora",
    },
    benefit: {
      question: "Quanto você recebeu em benefícios nos últimos 30 dias?",
      hint: "Some o que você pagaria sem o plano de membro: frete grátis, descontos, pontos.",
      unit: "KRW",
      quantityLabel: "Benefícios recebidos em 30 dias",
      perUnit: "",
    },
    storage: {
      question: "Quanto do armazenamento do plano você usa?",
      hint: "Dá para ver nas configurações de armazenamento do dispositivo (iCloud: Ajustes › seu nome › iCloud).",
      unit: "%",
      quantityLabel: "Parte do armazenamento usada",
      perUnit: "",
    },
  },
  input: {
    presetLabel: (value, unit) => (unit === "%" ? `${value}%` : `${value} ${ptUnit(value, unit)}`),
    unitFor: ptUnit,
    presetBenefit: (value) => (value === 0 ? "₩0" : `₩${value / 1000} mil`),
    choose: "Escolha",
    decrease: (step, unit) => `Tirar ${step} ${ptUnit(step, unit)}`,
    increase: (step, unit) => `Somar ${step} ${ptUnit(step, unit)}`,
    storageOf: (plan, used) => `${used} de ${plan}`,
    storageGB: (raw) =>
      gbIn(
        raw,
        "menos de 1 GB",
        (v) => `cerca de ${v.replace("GB", " GB").replace("TB", " TB")}`,
        true,
      ),
    orderEvidence: (since, count) =>
      `${count} e-mail${ciPl(count, "", "s")} de pedido no Gmail desde ${since}`,
    orderEvidenceNote:
      " encontrado(s). A contagem é só nos e-mails importados, então pode haver mais. Some o frete grátis e os descontos desses pedidos.",
    sinceDate: (month, day) => `${day} de ${monthName("pt", month)}`,
    benefitNumberLocale: "pt-BR",
  },
  modal: {
    title: (name) => `Registro de uso de ${name}`,
    usesQuestion: "Quantas vezes você usou nos últimos 30 dias?",
    usesQuestionBefore: "Nos últimos 30 dias, quantas vezes você usou ",
    usesQuestionAfter: "?",
    timesUnit: "×",
    submit: "Ver a análise de valor",
    noResult: "Ver o resultado",
    accountTitle: "A conta para entrar e cancelar",
    copied: "Copiado",
    copyId: "Copiar ID",
    accountBefore: "Você precisa entrar com a conta ",
    accountAfter: " para ver o menu de cancelamento.",
    accountUnknown: "Entre com a conta usada no cadastro.",
    paymentMethod: "Forma de pagamento: ",
    openGuide: "Abrir o guia de cancelamento",
    close: "Fechar",
    newWindow: (label) => `${label} (nova janela)`,
    cancelPage: (name) => `Ir direto para a página de cancelamento de ${name} (nova janela)`,
    openService: (name) => `Abrir ${name} (nova janela)`,
    paymentCancel: (name, direct) =>
      direct ? `Gerenciar pagamentos recorrentes em ${name}` : `Abrir ${name}`,
  },
  outcome: {
    unused: (amount) => `Este mês você jogou ${amount} fora. Cancele agora mesmo.`,
    once: (name, amount) => `Este mês você usou ${name} uma vez, por ${amount}.`,
    perUse: (name, cost) => `Este mês ${name} custou ${cost} por uso.`,
    daysNone: (name, monthly) =>
      `Você não usou ${name} nem um dia nos últimos 30. Pagou ${monthly} à toa.`,
    daysSome: (name, cost) => `Você pagou ${cost} por dia de uso de ${name}.`,
    hoursNone: (name, monthly) =>
      `Você não usou ${name} nos últimos 30 dias. Pagou ${monthly} à toa.`,
    hoursSome: (name, cost) => `Você pagou ${cost} por hora de ${name}.`,
    benefitOver: (monthly, benefit) =>
      `Você recuperou ${benefit} em benefícios, mais que a mensalidade de ${monthly}.`,
    benefitUnder: (monthly, benefit) =>
      `Da mensalidade de ${monthly}, você só recuperou ${benefit} em benefícios.`,
    storageEmpty: (name) => `Se você não guarda nada no ${name}, talvez não precise do plano.`,
    storageUsed: (name, percent, gb) => `Você usa ${percent}% (${gb}) de ${planName(name, "pt")}.`,
    storageSmaller: (name, used, smaller, amount) =>
      `${name}: ${used} Caberia com folga no plano ${planName(smaller, "pt")} (${amount}).`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} Só pelo armazenamento caberia num plano menor, mas esse plano não inclui ${extras}, então não julgamos só pelo armazenamento.`,
    storageNoSmaller: (name, used) => `${name}: ${used} Num plano menor ficaria apertado.`,
    storageLowUnknownPlan: (name, percent) =>
      `Você usa ${percent}% do armazenamento do seu plano ${name}. Escolha o plano e diremos se um menor caberia.`,
    storageUnknownPlan: (name, percent) =>
      `Você usa ${percent}% do armazenamento do seu plano ${name}.`,
    freeTierEnough: "Se o plano grátis bastava, dá para mudar para ele em vez de cancelar.",
    tokensOver: (times) =>
      `Seu uso de tokens no PC equivale a ${times}× a mensalidade pelo preço da API — mesmo em poucos dias, já compensou.`,
    tokensUnder: (percent) =>
      `Seu uso de tokens no PC equivale a ${percent}% da mensalidade pelo preço da API. Web e app não entram, então a avaliação é pelos dias de uso.`,
  },
  metaphor: {
    unusedComparison: (item) => `Uma chance de economizar ${item}`,
    unusedMessage: (name, item, amount) =>
      `Você não usou ${name} este mês. Pause a assinatura por um tempo e economize ${item} (${amount}) todo mês.`,
    movieComparison: (item) => `Uma chance de economizar ${item}`,
    movieMessage: (cost) =>
      `Se usou só uma vez este mês, que tal pausar e economizar o preço de um ingresso de cinema (${cost})?`,
    onceComparison: (item) => `Uma chance de economizar ${item}`,
    onceMessage: (item, cost) =>
      `Você usou uma vez este mês. Dê uma pausa e economize ${item} (${cost}) todo mês.`,
    warningComparison: (item) => `Cerca de ${item}`,
    warningMessage: (cost) => `${cost} por uso — use um pouco mais e compensa! Aproveite.`,
    cheapComparison: "Mais barato que um café",
    cheapMessage: (cost) => `${cost} por uso — mais barato que um café! Já compensou`,
    worthComparison: (item) => `Vale ${item}`,
    worthMessage: (cost) => `${cost} por uso — você aproveita mais do que paga!`,
  },
  gauge: {
    none: "Ainda sem uso este mês. Use mais ou pause e economize.",
    remaining: (n) => `Mais ${n} uso${ciPl(n, "", "s")} para compensar!`,
    done: "Compensou! Você está aproveitando bem.",
    diet: (cost) => `Corte sugerido (${cost} por uso)`,
    achieved: (cost) => `Compensou! (${cost} por uso)`,
    baseline: "Linha de compensação",
  },
  bar: {
    label: "Custo por uso",
    footer: (count, monthly) =>
      `${count} uso${ciPl(count, "", "s")} no total · base ${monthly}/mês`,
  },
  appResult: {
    green: "Vale a pena",
    yellow: "No limite",
    red: "Pode pausar",
    perUse: "Por uso",
    unusedNote: (monthly) => `Sem uso nos últimos 30 dias. Pause e economize ${monthly} por mês.`,
    redNote: (monthly) => `Pause e economize ${monthly} por mês.`,
    remainingNote: (n) => `Mais ${n} uso${ciPl(n, "", "s")} e compensa.`,
    doneNote: "Você aproveita mais do que paga.",
    summary: (count, monthly) =>
      `${count} uso${ciPl(count, "", "s")} nos últimos 30 dias · ${monthly} por mês`,
    toBreakEven: "Para compensar",
    progress: (current, target) => `${current} / ${target}`,
    progressLabel: "Usos até compensar",
    cancelGuide: "Ver o guia de cancelamento",
    keep: "Vou manter",
    confirm: "OK",
  },
  picker: {
    unit: "×",
    chooseBar: "Toque na barra para escolher",
    notUsed: "Sem uso",
    perUse: (cost) => `${cost} por uso`,
    ariaLabel: "Número de usos",
    valueText: (n, max) => (max ? "10 ou mais" : `${n}`),
    phone: "Celular",
    typeExact: "Usou mais de 10 vezes? Digite",
  },
  addCheckIn: {
    registered: "Adicionada",
    perMonth: "/mês",
    note: "Entra direto no seu recibo de valor. Dá para mudar depois.",
    justJoined: "Acabei de assinar",
    done: "Pronto",
    later: "Depois",
  },
  history: {
    deviceApp: { android: "App Android", ios: "App iOS" },
    deviceWeb: (os, mobile) => `Web no ${mobile ? "celular" : "PC"}${os ? ` ${os}` : ""}`,
    deviceLine: (device, here) =>
      `Dispositivo do check-in: ${device}${here ? " (este dispositivo)" : ""}`,
    phoneHours:
      "Registro automático pelo celular · o maior entre o tempo com o app aberto e o da notificação de reprodução. Pode incluir pausas",
    phoneDays: "Registro automático pelo celular · dias de uso neste celular. Faltam os dias no PC",
    phoneOther: "Registro automático pelo celular · falta o uso em outros dispositivos",
    title: (count) => `Histórico de registros (${count})`,
    add: "+ Registrar",
    empty: "Ainda não há registros. Informe quanto usou este mês.",
    monthRecord: (month) => `Uso de ${month}`,
    chartTitle: "Check-ins por mês",
    chartGap: "Barras tracejadas são meses sem check-in: não se sabe, não quer dizer que não usou.",
    chartOtherMetric: (count) =>
      `${count} check-in${count === 1 ? "" : "s"} medido${count === 1 ? "" : "s"} de outro jeito ${count === 1 ? "ficou" : "ficaram"} fora do gráfico.`,
    pcTokens: (tokens, apiValue) =>
      `Registros do PC: ${tokens} tokens${apiValue ? ` · ${apiValue} pelo preço da API` : ""}`,
  },
  evidence: {
    label: "Base dos registros",
    title: "O que os registros mostram",
    average: (count) => `Média dos últimos ${count} registro${ciPl(count, "", "s")}`,
    last: (perUnit) => `Último registro${perUnit ? ` ${perUnit.toLowerCase()}` : ""}`,
    recorded: (date, quantity) => `Registrado em ${date} · ${quantity}`,
    versusPrevious: "Comparado ao registro anterior",
    increased: (amount) => `Subiu ${amount}`,
    decreased: (amount) => `Caiu ${amount}`,
    same: "Sem mudança",
    costSame: (perUnit) => `Custo ${perUnit.toLowerCase()} sem mudança`,
    costUp: (perUnit, amount) => `Custo ${perUnit.toLowerCase()} subiu ${amount}`,
    costDown: (perUnit, amount) => `Custo ${perUnit.toLowerCase()} caiu ${amount}`,
    notEnough: "Ainda não dá para comparar",
    notEnoughHint: "Com mais um registro dá para comparar",
    priceChanged:
      "Seu preço (sua parte) mudou entre os dois registros, então a variação do custo por uso inclui a mudança de preço.",
    selfReported:
      "Os números são o que você informou ao registrar. Os registros automáticos do celular cobrem só este celular, então falta o uso em outros dispositivos.",
    unknownDate: "Data desconhecida",
    amountOf: (metric, n) => `${n} ${metric}`,
    dateLocale: "pt-BR",
  },
  flow: {
    reminderOn:
      "Os lembretes de cobrança estão ligados. Uma notificação de teste chega em alguns segundos.",
    done: (name) => `${name} registrada`,
    failed: "Não foi possível registrar. Tente de novo.",
  },
  storage: {
    measure: "Medir o uso com sua conta Google",
    waiting: "Permita o acesso do Google na janela aberta e preenchemos a porcentagem.",
    idle: "Lemos o armazenamento da sua conta Google e preenchemos a porcentagem. Os números nunca vão para os servidores do SubSlash.",
    noValue: "Nenhuma medição chegou. Digite a porcentagem da tela do app web ou meça de novo.",
    failed: "Não foi possível obter o armazenamento do Google. Meça de novo em instantes.",
    noLimit:
      "Esta conta Google não tem limite de armazenamento, então não dá para calcular uma porcentagem. Digite você mesmo.",
    measured: (limit, usage) => `Você usa ${usage} do limite de ${limit} desta conta Google.`,
    family: (measured) =>
      `${measured} É um plano compartilhado com a família, e o uso só desta conta não dá a parte do plano inteiro, então não preenchemos.`,
    planMismatch: (measured, registered) =>
      `${measured} O limite não bate com o plano cadastrado (${planName(registered, "pt")}), então não preenchemos. Pode ser outra conta ou o limite de uma conta familiar ou de trabalho.`,
    underOne: " Era menos de 1%, então colocamos 1%.",
    choosePlan: " Escolha o plano e conferimos com o limite.",
    doneReading: "Passando a medição",
    doneFilled: "Preenchido no registro",
    doneFilledHint: "Feche esta aba, confira na janela de registro e toque em registrar.",
    doneFailed: "Nenhuma medição chegou",
    doneFailedHint: "Feche esta aba e meça de novo pela janela de registro.",
  },
  freeTier: {
    needed: "Não, eu precisava do plano pago",
    enough: "Sim, o grátis provavelmente bastava",
    unsure: "Não sei",
    question: "O plano grátis teria bastado?",
    hint: "Se você bateu em limites de uso ou usou modelos ou recursos pagos, precisava do plano pago.",
  },
  link: {
    invalidTitle: "Este link de registro não é válido",
    invalidBody: "Toque de novo no botão do e-mail ou registre pelo painel.",
    missingTitle: "Este dispositivo não tem esta assinatura",
    missingBody:
      "Abra o link no dispositivo onde você adicionou, ou entre para sincronizar seus dispositivos.",
    killedTitle: "Esta assinatura já está cancelada",
    killedBody: (name) => `“${name}” está cancelada, então nada foi registrado.`,
    dashboard: "Painel →",
  },
};
