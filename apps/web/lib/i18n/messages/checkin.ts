import { METRIC_SPECS, type ValueMetric } from "@subslash/shared";
import type { Widen } from "../types";
import { one } from "../english";

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
    phoneHours:
      "폰 기록으로 자동 체크인 · 앱을 쓴 시간과 재생 알림이 떠 있던 시간 중 긴 쪽이에요. 일시정지 시간이 섞일 수 있어요",
    phoneDays: "폰 기록으로 자동 체크인 · 이 폰에서 쓴 날이에요. PC에서 쓴 날은 빠져 있어요",
    phoneOther: "폰 기록으로 자동 체크인 · 다른 기기에서 쓴 건 빠져 있어요",
    title: (count: number) => `체크인 기록 (${count}건)`,
    add: "+ 체크인 하기",
    empty: "아직 체크인 기록이 없어요. 이번 달 이용 횟수를 넣어 보세요.",
    monthRecord: (month: string) => `${month} 사용 기록`,
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
      hint: "Include time you listened with the screen off. 30 minutes a day is 15 hours.",
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
    presetLabel: (value, unit) => (unit === "%" ? `${value}%` : `${value} ${unit}`),
    presetBenefit: (value) => (value === 0 ? "₩0" : `₩${value / 1000}k`),
    choose: "Pick one",
    decrease: (step, unit) => `Subtract ${step} ${unit}`,
    increase: (step, unit) => `Add ${step} ${unit}`,
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
    storageUsed: (plan, percent, gb) => `You're using ${percent}% (${gb}) of ${plan}.`,
    storageSmaller: (name, used, plan, amount) =>
      `${name}: ${used} It would fit comfortably in the ${plan} plan (${amount}).`,
    storageBundled: (name, used, extras) =>
      `${name}: ${used} By storage alone it fits a smaller plan, but that plan doesn't include ${extras}, so we don't judge by storage alone.`,
    storageNoSmaller: (name, used) =>
      `${name}: ${used} It wouldn't fit comfortably in a smaller plan.`,
    storageLowUnknownPlan: (name, percent) =>
      `You're using ${percent}% of your ${name} plan's storage. Pick your plan and we'll tell you whether a smaller one would fit.`,
    storageUnknownPlan: (name, percent) =>
      `You're using ${percent}% of your ${name} plan's storage.`,
    freeTierEnough: "If the free plan was enough, you can drop to it instead of cancelling.",
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
    phoneHours:
      "Auto check-in from phone records · the longer of the time the app was open and the time a playback notification was up. Paused time may be included",
    phoneDays:
      "Auto check-in from phone records · days you used it on this phone. Days on a PC are missing",
    phoneOther: "Auto check-in from phone records · use on other devices is missing",
    title: (count) => `Check-in history (${count})`,
    add: "+ Check in",
    empty: "No check-ins yet. Enter how much you used it this month.",
    monthRecord: (month) => `${month} usage`,
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
    planMismatch: (measured, plan) =>
      `${measured} The limit doesn't match the plan you registered (${plan}), so we didn't fill it in. It may be another account, or a family or work account's limit.`,
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
};
