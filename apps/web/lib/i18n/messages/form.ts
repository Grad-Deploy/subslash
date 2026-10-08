import { CUSTOM_ICON_COLORS } from "../../custom-icon";
import type { Widen } from "../types";

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
/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const colorLabel = (id: (typeof CUSTOM_ICON_COLORS)[number]["id"]): string =>
  CUSTOM_ICON_COLORS.find((color) => color.id === id)?.label ?? id;

/** 구독 등록·수정 폼. 서비스 이름·요금제 이름·결제 수단은 서비스 목록의 내용이라 옮기지 않는다. */
export const ko = {
  submit: "구독 등록하기",
  save: "저장",
  more: (items: string) => `자세히 입력 (선택) · ${items}`,
  moreItems: {
    sharing: "공유 인원",
    payment: "결제 수단",
    account: "가입한 계정",
    website: "웹사이트",
    cancel: "해지 방법",
  },
  dialog: {
    titlePreset: (name: string) => `${name} 등록`,
    titleNew: "새 구독 등록",
    description: "서비스를 고르거나 직접 입력하세요.",
    added: (name: string) => `${name} 등록 완료`,
    addedWithCheckIn: (name: string, count: number) => `${name} 등록 · ${count}회 기록`,
  },
  duplicate: {
    titleBundle: "결합 상품과 겹쳐요",
    titleSame: "이미 등록된 구독이에요",
    bodyBundle: (names: string) =>
      `${names}을(를) 이 구독으로 이미 받고 있어요. 따로 결제하면 두 번 내는 것일 수 있어요. 다른 계정으로 쓰고 있다면 등록해도 돼요.`,
    bodySame: "다른 계정으로 따로 내고 있다면 또 등록해도 돼요.",
    cancel: "등록 안 할게요",
    anyway: "그래도 등록",
  },
  picker: {
    searchPlaceholder: "서비스 이름 검색 (예: 넷플릭스)",
    searchLabel: "서비스 이름 검색",
    categoryLabel: "서비스 분류",
    all: "전체",
    bundle: "결합 상품",
    notFound: (query: string) => `‘${query}’은(는) 목록에 없어요. 직접 입력하세요.`,
    customWith: (query: string) => `'${query}' 직접 입력하기`,
    custom: "목록에 없는 서비스 직접 입력",
    priceFrom: (cycle: string, price: string, incomplete: boolean) =>
      `${cycle} ${price}${incomplete ? " 등" : "부터"}`,
    priceAsk: "요금 직접 입력",
    priceMonthly: (price: string) => `월 ${price}`,
    cycleYearly: "연",
    cycleMonthly: "월",
  },
  selected: {
    custom: "직접 입력",
    notListed: "목록에 없는 서비스",
    pickOrType: "요금제를 고르거나, 목록에 없으면 결제한 금액을 적어 주세요.",
    pickPlan: "요금제를 고르면 요금이 채워져요.",
    basePrice: "기본 요금이에요. 다르면 고쳐 주세요.",
    typePrice: "요금을 적어 주세요.",
    change: "다른 서비스",
  },
  plan: {
    legend: "요금제",
    yearly: "연",
    monthly: "월",
    saves: (monthly: string, saved: string, percent: number) =>
      `월 ${monthly}꼴 · 월 결제보다 연 ${saved} 적게 (${percent}%)`,
  },
  name: {
    label: "서비스 이름",
    placeholder: "예: 동네 헬스장",
    category: "카테고리",
    ott: "OTT / 동영상",
    music: "음악 스트리밍",
    shopping: "쇼핑 / 멤버십",
    cloud: "클라우드 / 저장공간",
    ai: "AI 툴 / 생산성",
    other: "기타",
  },
  icon: {
    placeholderName: "이름을 적어주세요",
    preview: "목록에서 이렇게 보여요",
    icon: "아이콘",
    color: "색",
    colors: {
      gray: colorLabel("gray"),
      red: colorLabel("red"),
      orange: colorLabel("orange"),
      yellow: colorLabel("yellow"),
      green: colorLabel("green"),
      blue: colorLabel("blue"),
      violet: colorLabel("violet"),
    },
  },
  amount: {
    yearlyExTax: "연 요금 (세금 제외)",
    monthlyExTax: "월 요금 (세금 제외)",
    yearly: "연 결제 금액",
    monthly: "월 결제 금액",
    placeholder: "예: 17000",
    currency: "통화",
  },
  tax: {
    label: "세금",
    none: "금액에 포함 · 따로 붙지 않음",
    vat10: "부가세 10% 별도",
    other: (rate: number) => `세금 ${rate}% 별도`,
    hintPreset: (name: string, rate: number) =>
      `한국 결제 시 ${name}에 부가세 ${rate}%가 붙어요. 사업자 결제라 안 붙으면 '금액에 포함'으로 바꾸세요.`,
    hintOverseas: "해외 서비스는 부가세 10%가 붙기도 해요. 카드 명세서와 비교해 고르세요.",
    billed: (billed: string, amount: string, rate: number) =>
      `카드에 청구되는 금액: ${billed} (요금 ${amount} + 부가세 ${rate}%)`,
  },
  billing: {
    paidToday: "오늘 결제했어요",
    paidYesterday: "어제",
    paidOnDay: (label: string, day: number) => `${label}(${day}일)`,
    day: "결제일 (1-31)",
    dayPlaceholder: "예: 15",
    cycle: "주기",
    monthly: "매월 결제",
    yearly: "매년 결제",
    month: "결제 월",
    choose: "선택해주세요",
    monthOption: (month: number) => `${month}월`,
    monthHint: "결제 월을 넣어야 D-day·알림·캘린더가 맞아요.",
    trial: "무료 체험 종료일",
    optional: "(선택)",
    trialHint:
      "유료로 바뀌는 날이에요. 그전까지는 지출에서 빼고, 끝나기 전에 알려 드려요. 모르면 비워 두세요(지금 결제 중으로 봐요).",
    yearlyNoPlan: (name: string | null) =>
      `${name ? `${name}의 연 요금은 목록에 없어요. ` : ""}1년치 결제액을 적어 주세요(월 요금 × 12와 다를 수 있어요).`,
  },
  sharing: {
    people: "함께 쓰는 인원",
    alone: "나 혼자 (1명)",
    by: (n: number) => `${n}명이서 나눔`,
    myShare: "내 부담금",
    optional: "(선택)",
    shareBefore: "내가 내는 몫은 ",
    shareAfter: "이에요. 비워 두면 인원수로 나눠요. 지출·절약은 이 금액으로 계산해요.",
  },
  account: {
    label: "가입한 계정",
    placeholder: "예: 가족 계정 abc@gmail.com",
    payment: "결제 수단",
  },
  link: {
    url: "서비스 웹사이트 또는 해지 페이지 주소",
    urlPlaceholder: "예: service.com",
    urlHint:
      "도메인만 적어도 돼요. 해지 가이드에 이 주소와 추정한 계정 관리 링크(/account)가 생겨요. 추정이라 없는 페이지일 수 있어요.",
    guide: "해지 방법 메모",
    guidePlaceholder: "예:\n1. 앱 실행 → 설정\n2. 구독 관리 → 해지",
    guideHint: "한 줄에 한 단계씩 적으면 해지 가이드에 보여요.",
  },
  bundle: {
    label: "결합 상품",
    includes: (names: string) =>
      `${names}을(를) 이 구독 하나로 받아요. 따로 구독 중인 게 있으면 두 번 내고 있을 수 있어요.`,
    soldAs: (names: string) =>
      `${names}(으)로 결제하고 있다면 그 결합 상품을 골라 등록해 주세요. 결합 상품은 결제 메일이 Gmail로 오지 않을 수 있어요.`,
  },
};

export const en: Widen<typeof ko> = {
  submit: "Add subscription",
  save: "Save",
  more: (items) => `More details (optional) · ${items}`,
  moreItems: {
    sharing: "people sharing",
    payment: "payment method",
    account: "sign-up account",
    website: "website",
    cancel: "how to cancel",
  },
  dialog: {
    titlePreset: (name) => `Add ${name}`,
    titleNew: "Add a subscription",
    description: "Pick a service or enter your own.",
    added: (name) => `${name} added`,
    addedWithCheckIn: (name, count) =>
      `${name} added · recorded ${count} ${one(count) ? "use" : "uses"}`,
  },
  duplicate: {
    titleBundle: "This overlaps with a bundle",
    titleSame: "You already have this subscription",
    bodyBundle: (names) =>
      `This subscription already gives you ${names}. Paying for it separately may mean paying twice. If you use a different account, go ahead and add it.`,
    bodySame: "If you pay for it separately with another account, you can add it again.",
    cancel: "Don't add",
    anyway: "Add anyway",
  },
  picker: {
    searchPlaceholder: "Search services (e.g. Netflix)",
    searchLabel: "Search services",
    categoryLabel: "Service category",
    all: "All",
    bundle: "Bundles",
    notFound: (query) => `‘${query}’ isn't in the list. Enter it yourself.`,
    customWith: (query) => `Enter '${query}' yourself`,
    custom: "Enter a service that isn't listed",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", varies" : " and up"}`,
    priceAsk: "Enter the price yourself",
    priceMonthly: (price) => `Monthly ${price}`,
    cycleYearly: "Yearly",
    cycleMonthly: "Monthly",
  },
  selected: {
    custom: "Enter yourself",
    notListed: "A service that isn't listed",
    pickOrType: "Pick a plan, or if it isn't listed, enter the amount you paid.",
    pickPlan: "Pick a plan and the price is filled in.",
    basePrice: "This is the base price. Change it if yours differs.",
    typePrice: "Enter the price.",
    change: "Another service",
  },
  plan: {
    legend: "Plan",
    yearly: "Yearly",
    monthly: "Monthly",
    saves: (monthly, saved, percent) =>
      `About ${monthly}/month · ${saved} a year less than paying monthly (${percent}%)`,
  },
  name: {
    label: "Service name",
    placeholder: "e.g. Neighborhood gym",
    category: "Category",
    ott: "OTT / video",
    music: "Music streaming",
    shopping: "Shopping / membership",
    cloud: "Cloud / storage",
    ai: "AI tools / productivity",
    other: "Other",
  },
  icon: {
    placeholderName: "Enter a name",
    preview: "This is how it looks in the list",
    icon: "Icon",
    color: "Color",
    colors: {
      gray: "Gray",
      red: "Red",
      orange: "Orange",
      yellow: "Yellow",
      green: "Green",
      blue: "Blue",
      violet: "Violet",
    },
  },
  amount: {
    yearlyExTax: "Yearly price (excl. tax)",
    monthlyExTax: "Monthly price (excl. tax)",
    yearly: "Yearly payment",
    monthly: "Monthly payment",
    placeholder: "e.g. 17000",
    currency: "Currency",
  },
  tax: {
    label: "Tax",
    none: "Included in the price · no separate tax",
    vat10: "Plus 10% VAT",
    other: (rate) => `Plus ${rate}% tax`,
    hintPreset: (name, rate) =>
      `When paying in Korea, ${rate}% VAT is added to ${name}. If you pay as a business and it isn't added, change this to “Included in the price”.`,
    hintOverseas:
      "Overseas services sometimes add 10% VAT. Compare with your card statement and choose.",
    billed: (billed, amount, rate) =>
      `Charged to your card: ${billed} (price ${amount} + ${rate}% VAT)`,
  },
  billing: {
    paidToday: "Paid today",
    paidYesterday: "Yesterday",
    paidOnDay: (label, day) => `${label} (day ${day})`,
    day: "Billing day (1-31)",
    dayPlaceholder: "e.g. 15",
    cycle: "Cycle",
    monthly: "Billed monthly",
    yearly: "Billed yearly",
    month: "Billing month",
    choose: "Choose",
    monthOption: (month) => EN_MONTHS[Number(month) - 1] ?? String(month),
    monthHint: "Add the billing month so the D-day, reminders and calendar are right.",
    trial: "Free trial end date",
    optional: "(optional)",
    trialHint:
      "The day it turns paid. Until then it's left out of your spending, and we'll tell you before it ends. If you don't know, leave it blank (we treat it as paying now).",
    yearlyNoPlan: (name) =>
      `${name ? `The yearly price of ${name} isn't in the list. ` : ""}Enter what you pay for the whole year (it may differ from the monthly price × 12).`,
  },
  sharing: {
    people: "People sharing",
    alone: "Just me (1)",
    by: (n) => `Shared by ${n}`,
    myShare: "My share",
    optional: "(optional)",
    shareBefore: "Your share is ",
    shareAfter:
      ". Leave it blank and it's split evenly. Spending and savings are worked out from this amount.",
  },
  account: {
    label: "Sign-up account",
    placeholder: "e.g. Family account abc@gmail.com",
    payment: "Payment method",
  },
  link: {
    url: "Service website or cancel page address",
    urlPlaceholder: "e.g. service.com",
    urlHint:
      "A domain is enough. The cancel guide gets this address and a guessed account-management link (/account). It's a guess, so the page may not exist.",
    guide: "Notes on how to cancel",
    guidePlaceholder: "e.g.\n1. Open the app → Settings\n2. Manage subscription → Cancel",
    guideHint: "Write one step per line and they show up in the cancel guide.",
  },
  bundle: {
    label: "Bundle",
    includes: (names) =>
      `This one subscription gives you ${names}. If you also subscribe to it separately, you may be paying twice.`,
    soldAs: (names) =>
      `If you pay through ${names}, pick that bundle to add it. Bundles may not send payment emails to Gmail.`,
  },
};
