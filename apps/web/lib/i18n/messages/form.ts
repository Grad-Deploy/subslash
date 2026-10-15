import { withJosa } from "../josa";
import { CUSTOM_ICON_COLORS } from "../../custom-icon";
import type { Widen } from "../types";
import { MONTHS_SHORT, one } from "../english";
import { monthName } from "../months";

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
      `${withJosa(names, "을", "를")} 이 구독으로 이미 받고 있어요. 따로 결제하면 두 번 내는 것일 수 있어요. 다른 계정으로 쓰고 있다면 등록해도 돼요.`,
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
      `${withJosa(names, "을", "를")} 이 구독 하나로 받아요. 따로 구독 중인 게 있으면 두 번 내고 있을 수 있어요.`,
    soldAs: (names: string) =>
      `${withJosa(names, "으로", "로")} 결제하고 있다면 그 결합 상품을 골라 등록해 주세요. 결합 상품은 결제 메일이 Gmail로 오지 않을 수 있어요.`,
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
    monthOption: (month) => MONTHS_SHORT[Number(month) - 1] ?? String(month),
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

const fmPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  submit: "添加订阅",
  save: "保存",
  more: (items) => `更多信息（可选）· ${items}`,
  moreItems: {
    sharing: "共用人数",
    payment: "支付方式",
    account: "注册账户",
    website: "网站",
    cancel: "退订方法",
  },
  dialog: {
    titlePreset: (name) => `添加 ${name}`,
    titleNew: "添加订阅",
    description: "选择服务或自己输入。",
    added: (name) => `已添加 ${name}`,
    addedWithCheckIn: (name, count) => `已添加 ${name} · 记录了 ${count} 次使用`,
  },
  duplicate: {
    titleBundle: "与组合套餐重复",
    titleSame: "你已经有这个订阅",
    bodyBundle: (names) =>
      `这个订阅已经包含 ${names}。另外付费可能是重复支付。如果用的是不同账户，可以继续添加。`,
    bodySame: "如果是用其他账户另外付费，可以再添加一个。",
    cancel: "不添加",
    anyway: "仍然添加",
  },
  picker: {
    searchPlaceholder: "搜索服务（例如 Netflix）",
    searchLabel: "搜索服务",
    categoryLabel: "服务类别",
    all: "全部",
    bundle: "组合套餐",
    notFound: (query) => `列表中没有“${query}”。请自己输入。`,
    customWith: (query) => `自己输入“${query}”`,
    custom: "输入列表中没有的服务",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? "，因情况而异" : " 起"}`,
    priceAsk: "请自己输入价格",
    priceMonthly: (price) => `每月 ${price}`,
    cycleYearly: "每年",
    cycleMonthly: "每月",
  },
  selected: {
    custom: "自己输入",
    notListed: "列表中没有的服务",
    pickOrType: "选择套餐；如果列表里没有，请输入你付的金额。",
    pickPlan: "选择套餐后会自动填入价格。",
    basePrice: "这是基本价格。如果不同请修改。",
    typePrice: "请输入价格。",
    change: "其他服务",
  },
  plan: {
    legend: "套餐",
    yearly: "年付",
    monthly: "月付",
    saves: (monthly, saved, percent) => `约每月 ${monthly} · 比月付每年少 ${saved}（${percent}%）`,
  },
  name: {
    label: "服务名称",
    placeholder: "例如：小区健身房",
    category: "类别",
    ott: "OTT / 视频",
    music: "音乐流媒体",
    shopping: "购物 / 会员",
    cloud: "云 / 存储",
    ai: "AI 工具 / 效率",
    other: "其他",
  },
  icon: {
    placeholderName: "请输入名称",
    preview: "在列表中会这样显示",
    icon: "图标",
    color: "颜色",
    colors: {
      gray: "灰色",
      red: "红色",
      orange: "橙色",
      yellow: "黄色",
      green: "绿色",
      blue: "蓝色",
      violet: "紫色",
    },
  },
  amount: {
    yearlyExTax: "年付价格（不含税）",
    monthlyExTax: "月付价格（不含税）",
    yearly: "年付金额",
    monthly: "月付金额",
    placeholder: "例如 17000",
    currency: "币种",
  },
  tax: {
    label: "税",
    none: "已含在价格中 · 不另加税",
    vat10: "另加 10% 增值税",
    other: (rate) => `另加 ${rate}% 税`,
    hintPreset: (name, rate) =>
      `在韩国付款时，${name} 会另加 ${rate}% 增值税。如果以企业身份付款且不加税，请改为“已含在价格中”。`,
    hintOverseas: "海外服务有时会另加 10% 增值税。请对照银行卡账单选择。",
    billed: (billed, amount, rate) => `卡上扣款：${billed}（价格 ${amount} + 增值税 ${rate}%）`,
  },
  billing: {
    paidToday: "今天付的",
    paidYesterday: "昨天",
    paidOnDay: (label, day) => `${label}（${day} 日）`,
    day: "扣款日（1-31）",
    dayPlaceholder: "例如 15",
    cycle: "周期",
    monthly: "每月扣款",
    yearly: "每年扣款",
    month: "扣款月份",
    choose: "选择",
    monthOption: (month) => `${Number(month)}月`,
    monthHint: "填写扣款月份后，D-day、提醒和日历才会准确。",
    trial: "免费试用结束日",
    optional: "（可选）",
    trialHint: "开始付费的日期。在此之前不计入支出，结束前会提醒你。不知道就留空（视为正在付费）。",
    yearlyNoPlan: (name) =>
      `${name ? `列表中没有 ${name} 的年付价格。` : ""}请输入一整年支付的金额（可能与月付价格 × 12 不同）。`,
  },
  sharing: {
    people: "共用人数",
    alone: "只有我（1 人）",
    by: (n) => `${n} 人共用`,
    myShare: "我的份额",
    optional: "（可选）",
    shareBefore: "你的份额是 ",
    shareAfter: "。留空则平均分摊。支出和节省都按这个金额计算。",
  },
  account: { label: "注册账户", placeholder: "例如：家庭账户 abc@gmail.com", payment: "支付方式" },
  link: {
    url: "服务网站或退订页面地址",
    urlPlaceholder: "例如 service.com",
    urlHint:
      "填域名即可。退订指南会显示这个地址和推测的账户管理链接（/account）。因为是推测，页面可能不存在。",
    guide: "退订方法备注",
    guidePlaceholder: "例如：\n1. 打开应用 → 设置\n2. 管理订阅 → 退订",
    guideHint: "每行写一个步骤，会显示在退订指南中。",
  },
  bundle: {
    label: "组合套餐",
    includes: (names) => `这一个订阅就包含 ${names}。如果还另外订阅了，可能是重复付费。`,
    soldAs: (names) =>
      `如果是通过 ${names} 付费，请选择那个组合套餐来添加。组合套餐可能不会向 Gmail 发送付款邮件。`,
  },
};

export const ja: Widen<typeof ko> = {
  submit: "サブスクを追加",
  save: "保存",
  more: (items) => `詳しい情報（任意）· ${items}`,
  moreItems: {
    sharing: "共有人数",
    payment: "支払い方法",
    account: "登録アカウント",
    website: "ウェブサイト",
    cancel: "解約方法",
  },
  dialog: {
    titlePreset: (name) => `${name} を追加`,
    titleNew: "サブスクを追加",
    description: "サービスを選ぶか、自分で入力してください。",
    added: (name) => `${name} を追加しました`,
    addedWithCheckIn: (name, count) => `${name} を追加 · ${count} 回の利用を記録`,
  },
  duplicate: {
    titleBundle: "セット商品と重なっています",
    titleSame: "すでにこのサブスクがあります",
    bodyBundle: (names) =>
      `このサブスクにはすでに ${names} が含まれています。別に払うと二重払いかもしれません。別のアカウントなら、そのまま追加してください。`,
    bodySame: "別のアカウントで別に払っているなら、もう一度追加できます。",
    cancel: "追加しない",
    anyway: "それでも追加",
  },
  picker: {
    searchPlaceholder: "サービスを検索（例: Netflix）",
    searchLabel: "サービスを検索",
    categoryLabel: "サービスのカテゴリ",
    all: "すべて",
    bundle: "セット商品",
    notFound: (query) => `「${query}」は一覧にありません。自分で入力してください。`,
    customWith: (query) => `「${query}」を自分で入力`,
    custom: "一覧にないサービスを入力",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? "、条件により異なる" : "〜"}`,
    priceAsk: "料金は自分で入力",
    priceMonthly: (price) => `月 ${price}`,
    cycleYearly: "年額",
    cycleMonthly: "月額",
  },
  selected: {
    custom: "自分で入力",
    notListed: "一覧にないサービス",
    pickOrType: "プランを選ぶか、一覧になければ払った金額を入力してください。",
    pickPlan: "プランを選ぶと料金が入ります。",
    basePrice: "基本料金です。違っていたら直してください。",
    typePrice: "料金を入力してください。",
    change: "別のサービス",
  },
  plan: {
    legend: "プラン",
    yearly: "年払い",
    monthly: "月払い",
    saves: (monthly, saved, percent) =>
      `月あたり約 ${monthly} · 月払いより年 ${saved} 安い（${percent}%）`,
  },
  name: {
    label: "サービス名",
    placeholder: "例: 近所のジム",
    category: "カテゴリ",
    ott: "OTT / 動画",
    music: "音楽ストリーミング",
    shopping: "ショッピング / メンバーシップ",
    cloud: "クラウド / ストレージ",
    ai: "AI ツール / 生産性",
    other: "その他",
  },
  icon: {
    placeholderName: "名前を入力",
    preview: "一覧ではこう表示されます",
    icon: "アイコン",
    color: "色",
    colors: {
      gray: "グレー",
      red: "赤",
      orange: "オレンジ",
      yellow: "黄",
      green: "緑",
      blue: "青",
      violet: "紫",
    },
  },
  amount: {
    yearlyExTax: "年額料金（税抜き）",
    monthlyExTax: "月額料金（税抜き）",
    yearly: "年間の支払額",
    monthly: "月々の支払額",
    placeholder: "例: 17000",
    currency: "通貨",
  },
  tax: {
    label: "税",
    none: "料金に含まれる · 別途の税なし",
    vat10: "付加価値税 10% を別途加算",
    other: (rate) => `税 ${rate}% を別途加算`,
    hintPreset: (name, rate) =>
      `韓国で支払うと ${name} には付加価値税 ${rate}% が加わります。事業者として支払い加算されない場合は「料金に含まれる」に変えてください。`,
    hintOverseas:
      "海外のサービスは付加価値税 10% が別に加わることがあります。カードの明細と比べて選んでください。",
    billed: (billed, amount, rate) =>
      `カードへの請求: ${billed}（料金 ${amount} + 付加価値税 ${rate}%）`,
  },
  billing: {
    paidToday: "今日支払った",
    paidYesterday: "昨日",
    paidOnDay: (label, day) => `${label}（${day} 日）`,
    day: "支払日（1〜31）",
    dayPlaceholder: "例: 15",
    cycle: "周期",
    monthly: "毎月支払い",
    yearly: "毎年支払い",
    month: "支払月",
    choose: "選択",
    monthOption: (month) => `${Number(month)}月`,
    monthHint: "支払月を入れると、D-day・通知・カレンダーが正しくなります。",
    trial: "無料体験の終了日",
    optional: "（任意）",
    trialHint:
      "有料に変わる日です。それまでは支出から除き、終わる前にお知らせします。わからなければ空欄のままで（今支払っているとみなします）。",
    yearlyNoPlan: (name) =>
      `${name ? `${name} の年額料金は一覧にありません。` : ""}1 年分として払う金額を入力してください（月額 × 12 と違うことがあります）。`,
  },
  sharing: {
    people: "共有人数",
    alone: "自分だけ（1 人）",
    by: (n) => `${n} 人で共有`,
    myShare: "自分の負担分",
    optional: "（任意）",
    shareBefore: "あなたの負担は ",
    shareAfter: " です。空欄なら均等に分けます。支出と節約はこの金額で計算します。",
  },
  account: {
    label: "登録アカウント",
    placeholder: "例: 家族アカウント abc@gmail.com",
    payment: "支払い方法",
  },
  link: {
    url: "サービスのウェブサイトまたは解約ページのアドレス",
    urlPlaceholder: "例: service.com",
    urlHint:
      "ドメインだけで十分です。解約ガイドにこのアドレスと推測したアカウント管理リンク（/account）が出ます。推測なので、ページがないこともあります。",
    guide: "解約方法のメモ",
    guidePlaceholder: "例:\n1. アプリを開く → 設定\n2. サブスク管理 → 解約",
    guideHint: "1 行に 1 ステップ書くと、解約ガイドに表示されます。",
  },
  bundle: {
    label: "セット商品",
    includes: (names) =>
      `このサブスク 1 つで ${names} が受けられます。別に契約しているなら、二重払いかもしれません。`,
    soldAs: (names) =>
      `${names} を通じて払っているなら、そのセット商品を選んで追加してください。セット商品は Gmail に支払いメールが届かないことがあります。`,
  },
};

export const vi: Widen<typeof ko> = {
  submit: "Thêm gói đăng ký",
  save: "Lưu",
  more: (items) => `Thông tin thêm (tùy chọn) · ${items}`,
  moreItems: {
    sharing: "số người dùng chung",
    payment: "phương thức thanh toán",
    account: "tài khoản đăng ký",
    website: "trang web",
    cancel: "cách hủy",
  },
  dialog: {
    titlePreset: (name) => `Thêm ${name}`,
    titleNew: "Thêm gói đăng ký",
    description: "Chọn dịch vụ hoặc tự nhập.",
    added: (name) => `Đã thêm ${name}`,
    addedWithCheckIn: (name, count) => `Đã thêm ${name} · ghi nhận ${count} lần dùng`,
  },
  duplicate: {
    titleBundle: "Trùng với gói kết hợp",
    titleSame: "Bạn đã có gói này",
    bodyBundle: (names) =>
      `Gói này đã gồm ${names}. Trả riêng có thể là trả hai lần. Nếu bạn dùng tài khoản khác, cứ thêm tiếp.`,
    bodySame: "Nếu bạn trả riêng bằng tài khoản khác, có thể thêm lần nữa.",
    cancel: "Không thêm",
    anyway: "Vẫn thêm",
  },
  picker: {
    searchPlaceholder: "Tìm dịch vụ (ví dụ: Netflix)",
    searchLabel: "Tìm dịch vụ",
    categoryLabel: "Danh mục dịch vụ",
    all: "Tất cả",
    bundle: "Gói kết hợp",
    notFound: (query) => `“${query}” không có trong danh sách. Hãy tự nhập.`,
    customWith: (query) => `Tự nhập “${query}”`,
    custom: "Nhập dịch vụ không có trong danh sách",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", tùy trường hợp" : " trở lên"}`,
    priceAsk: "Tự nhập giá",
    priceMonthly: (price) => `Mỗi tháng ${price}`,
    cycleYearly: "Mỗi năm",
    cycleMonthly: "Mỗi tháng",
  },
  selected: {
    custom: "Tự nhập",
    notListed: "Dịch vụ không có trong danh sách",
    pickOrType: "Chọn gói cước, nếu không có thì nhập số tiền bạn đã trả.",
    pickPlan: "Chọn gói cước thì giá sẽ tự điền.",
    basePrice: "Đây là giá cơ bản. Nếu khác, hãy sửa lại.",
    typePrice: "Hãy nhập giá.",
    change: "Dịch vụ khác",
  },
  plan: {
    legend: "Gói cước",
    yearly: "Theo năm",
    monthly: "Theo tháng",
    saves: (monthly, saved, percent) =>
      `Khoảng ${monthly}/tháng · ít hơn trả theo tháng ${saved} mỗi năm (${percent}%)`,
  },
  name: {
    label: "Tên dịch vụ",
    placeholder: "Ví dụ: Phòng gym gần nhà",
    category: "Danh mục",
    ott: "OTT / video",
    music: "Nghe nhạc trực tuyến",
    shopping: "Mua sắm / thành viên",
    cloud: "Đám mây / lưu trữ",
    ai: "Công cụ AI / năng suất",
    other: "Khác",
  },
  icon: {
    placeholderName: "Nhập tên",
    preview: "Trong danh sách sẽ hiển thị thế này",
    icon: "Biểu tượng",
    color: "Màu",
    colors: {
      gray: "Xám",
      red: "Đỏ",
      orange: "Cam",
      yellow: "Vàng",
      green: "Xanh lá",
      blue: "Xanh dương",
      violet: "Tím",
    },
  },
  amount: {
    yearlyExTax: "Giá theo năm (chưa thuế)",
    monthlyExTax: "Giá theo tháng (chưa thuế)",
    yearly: "Số tiền trả mỗi năm",
    monthly: "Số tiền trả mỗi tháng",
    placeholder: "ví dụ: 17000",
    currency: "Tiền tệ",
  },
  tax: {
    label: "Thuế",
    none: "Đã gồm trong giá · không cộng thuế riêng",
    vat10: "Cộng thêm VAT 10%",
    other: (rate) => `Cộng thêm thuế ${rate}%`,
    hintPreset: (name, rate) =>
      `Khi thanh toán ở Hàn Quốc, ${name} bị cộng VAT ${rate}%. Nếu bạn thanh toán bằng tư cách doanh nghiệp và không bị cộng, hãy đổi thành “Đã gồm trong giá”.`,
    hintOverseas: "Dịch vụ nước ngoài đôi khi cộng VAT 10%. Hãy đối chiếu với sao kê thẻ rồi chọn.",
    billed: (billed, amount, rate) => `Trừ trên thẻ: ${billed} (giá ${amount} + VAT ${rate}%)`,
  },
  billing: {
    paidToday: "Trả hôm nay",
    paidYesterday: "Hôm qua",
    paidOnDay: (label, day) => `${label} (ngày ${day})`,
    day: "Ngày thanh toán (1-31)",
    dayPlaceholder: "ví dụ: 15",
    cycle: "Chu kỳ",
    monthly: "Thanh toán hằng tháng",
    yearly: "Thanh toán hằng năm",
    month: "Tháng thanh toán",
    choose: "Chọn",
    monthOption: (month) => `Tháng ${Number(month)}`,
    monthHint: "Thêm tháng thanh toán để D-day, lời nhắc và lịch được chính xác.",
    trial: "Ngày kết thúc dùng thử miễn phí",
    optional: "(tùy chọn)",
    trialHint:
      "Ngày bắt đầu tính phí. Trước đó không tính vào chi tiêu, và chúng tôi sẽ nhắc trước khi kết thúc. Nếu không biết, hãy để trống (coi như đang trả tiền).",
    yearlyNoPlan: (name) =>
      `${name ? `Danh sách không có giá theo năm của ${name}. ` : ""}Hãy nhập số tiền bạn trả cho cả năm (có thể khác giá tháng × 12).`,
  },
  sharing: {
    people: "Số người dùng chung",
    alone: "Chỉ mình tôi (1)",
    by: (n) => `${n} người dùng chung`,
    myShare: "Phần của tôi",
    optional: "(tùy chọn)",
    shareBefore: "Phần của bạn là ",
    shareAfter: ". Để trống sẽ chia đều. Chi tiêu và tiết kiệm được tính theo số tiền này.",
  },
  account: {
    label: "Tài khoản đăng ký",
    placeholder: "Ví dụ: tài khoản gia đình abc@gmail.com",
    payment: "Phương thức thanh toán",
  },
  link: {
    url: "Trang web dịch vụ hoặc địa chỉ trang hủy",
    urlPlaceholder: "ví dụ: service.com",
    urlHint:
      "Chỉ cần tên miền. Hướng dẫn hủy sẽ có địa chỉ này và một đường dẫn quản lý tài khoản được đoán (/account). Vì là đoán nên trang có thể không tồn tại.",
    guide: "Ghi chú cách hủy",
    guidePlaceholder: "Ví dụ:\n1. Mở ứng dụng → Cài đặt\n2. Quản lý gói → Hủy",
    guideHint: "Mỗi dòng một bước sẽ hiện trong hướng dẫn hủy.",
  },
  bundle: {
    label: "Gói kết hợp",
    includes: (names) =>
      `Chỉ một gói này đã cho bạn ${names}. Nếu bạn còn đăng ký riêng, có thể đang trả hai lần.`,
    soldAs: (names) =>
      `Nếu bạn trả qua ${names}, hãy chọn gói kết hợp đó để thêm. Gói kết hợp có thể không gửi email thanh toán đến Gmail.`,
  },
};

export const fr: Widen<typeof ko> = {
  submit: "Ajouter l'abonnement",
  save: "Enregistrer",
  more: (items) => `Plus de détails (facultatif) · ${items}`,
  moreItems: {
    sharing: "personnes qui partagent",
    payment: "moyen de paiement",
    account: "compte d'inscription",
    website: "site web",
    cancel: "comment résilier",
  },
  dialog: {
    titlePreset: (name) => `Ajouter ${name}`,
    titleNew: "Ajouter un abonnement",
    description: "Choisissez un service ou saisissez le vôtre.",
    added: (name) => `${name} ajouté`,
    addedWithCheckIn: (name, count) =>
      `${name} ajouté · ${count} utilisation${fmPl(count, " enregistrée", "s enregistrées")}`,
  },
  duplicate: {
    titleBundle: "Cela fait doublon avec une offre groupée",
    titleSame: "Vous avez déjà cet abonnement",
    bodyBundle: (names) =>
      `Cet abonnement vous donne déjà ${names}. Le payer séparément revient peut-être à payer deux fois. Si vous utilisez un autre compte, ajoutez-le quand même.`,
    bodySame: "Si vous le payez séparément avec un autre compte, vous pouvez l'ajouter à nouveau.",
    cancel: "Ne pas ajouter",
    anyway: "Ajouter quand même",
  },
  picker: {
    searchPlaceholder: "Rechercher un service (ex. Netflix)",
    searchLabel: "Rechercher un service",
    categoryLabel: "Catégorie de service",
    all: "Tous",
    bundle: "Offres groupées",
    notFound: (query) => `« ${query} » n'est pas dans la liste. Saisissez-le vous-même.`,
    customWith: (query) => `Saisir « ${query} » moi-même`,
    custom: "Saisir un service absent de la liste",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", variable" : " et plus"}`,
    priceAsk: "Saisissez le prix vous-même",
    priceMonthly: (price) => `Par mois ${price}`,
    cycleYearly: "Par an",
    cycleMonthly: "Par mois",
  },
  selected: {
    custom: "Saisie manuelle",
    notListed: "Un service absent de la liste",
    pickOrType: "Choisissez une formule, ou si elle n'y est pas, saisissez le montant payé.",
    pickPlan: "Choisissez une formule et le prix se remplit.",
    basePrice: "C'est le prix de base. Modifiez-le si le vôtre diffère.",
    typePrice: "Saisissez le prix.",
    change: "Autre service",
  },
  plan: {
    legend: "Formule",
    yearly: "Annuel",
    monthly: "Mensuel",
    saves: (monthly, saved, percent) =>
      `Environ ${monthly}/mois · ${saved} de moins par an qu'en mensuel (${percent} %)`,
  },
  name: {
    label: "Nom du service",
    placeholder: "ex. Salle de sport du quartier",
    category: "Catégorie",
    ott: "Streaming / vidéo",
    music: "Musique en streaming",
    shopping: "Shopping / adhésion",
    cloud: "Cloud / stockage",
    ai: "Outils IA / productivité",
    other: "Autre",
  },
  icon: {
    placeholderName: "Saisissez un nom",
    preview: "Voici comment il apparaît dans la liste",
    icon: "Icône",
    color: "Couleur",
    colors: {
      gray: "Gris",
      red: "Rouge",
      orange: "Orange",
      yellow: "Jaune",
      green: "Vert",
      blue: "Bleu",
      violet: "Violet",
    },
  },
  amount: {
    yearlyExTax: "Prix annuel (HT)",
    monthlyExTax: "Prix mensuel (HT)",
    yearly: "Paiement annuel",
    monthly: "Paiement mensuel",
    placeholder: "ex. 17000",
    currency: "Devise",
  },
  tax: {
    label: "Taxe",
    none: "Incluse dans le prix · pas de taxe en plus",
    vat10: "Plus 10 % de TVA",
    other: (rate) => `Plus ${rate} % de taxe`,
    hintPreset: (name, rate) =>
      `En payant en Corée, ${rate} % de TVA s'ajoutent à ${name}. Si vous payez en tant qu'entreprise et qu'elle ne s'ajoute pas, choisissez « Incluse dans le prix ».`,
    hintOverseas:
      "Les services étrangers ajoutent parfois 10 % de TVA. Comparez avec votre relevé de carte et choisissez.",
    billed: (billed, amount, rate) =>
      `Débité sur votre carte : ${billed} (prix ${amount} + TVA ${rate} %)`,
  },
  billing: {
    paidToday: "Payé aujourd'hui",
    paidYesterday: "Hier",
    paidOnDay: (label, day) => `${label} (le ${day})`,
    day: "Jour de paiement (1-31)",
    dayPlaceholder: "ex. 15",
    cycle: "Fréquence",
    monthly: "Paiement mensuel",
    yearly: "Paiement annuel",
    month: "Mois de paiement",
    choose: "Choisir",
    monthOption: (month) => monthName("fr", month),
    monthHint:
      "Ajoutez le mois de paiement pour que le J-x, les rappels et le calendrier soient justes.",
    trial: "Fin de l'essai gratuit",
    optional: "(facultatif)",
    trialHint:
      "Le jour où il devient payant. D'ici là, il est exclu de vos dépenses et nous vous prévenons avant la fin. Si vous ne savez pas, laissez vide (nous considérons que vous payez déjà).",
    yearlyNoPlan: (name) =>
      `${name ? `Le prix annuel de ${name} n'est pas dans la liste. ` : ""}Saisissez ce que vous payez pour l'année entière (cela peut différer du prix mensuel × 12).`,
  },
  sharing: {
    people: "Personnes qui partagent",
    alone: "Moi seul (1)",
    by: (n) => `Partagé à ${n}`,
    myShare: "Ma part",
    optional: "(facultatif)",
    shareBefore: "Votre part est de ",
    shareAfter:
      ". Laissez vide pour partager équitablement. Les dépenses et économies se calculent à partir de ce montant.",
  },
  account: {
    label: "Compte d'inscription",
    placeholder: "ex. Compte famille abc@gmail.com",
    payment: "Moyen de paiement",
  },
  link: {
    url: "Site du service ou adresse de la page de résiliation",
    urlPlaceholder: "ex. service.com",
    urlHint:
      "Un nom de domaine suffit. Le guide de résiliation affiche cette adresse et un lien supposé vers la gestion du compte (/account). C'est une supposition, la page peut ne pas exister.",
    guide: "Notes sur la résiliation",
    guidePlaceholder: "ex.\n1. Ouvrir l'appli → Réglages\n2. Gérer l'abonnement → Résilier",
    guideHint: "Écrivez une étape par ligne, elles s'afficheront dans le guide de résiliation.",
  },
  bundle: {
    label: "Offre groupée",
    includes: (names) =>
      `Ce seul abonnement vous donne ${names}. Si vous y êtes aussi abonné séparément, vous payez peut-être deux fois.`,
    soldAs: (names) =>
      `Si vous payez via ${names}, choisissez cette offre groupée pour l'ajouter. Les offres groupées n'envoient pas toujours d'e-mail de paiement sur Gmail.`,
  },
};

export const es: Widen<typeof ko> = {
  submit: "Añadir suscripción",
  save: "Guardar",
  more: (items) => `Más detalles (opcional) · ${items}`,
  moreItems: {
    sharing: "personas que comparten",
    payment: "método de pago",
    account: "cuenta de registro",
    website: "sitio web",
    cancel: "cómo cancelar",
  },
  dialog: {
    titlePreset: (name) => `Añadir ${name}`,
    titleNew: "Añadir una suscripción",
    description: "Elige un servicio o escribe el tuyo.",
    added: (name) => `${name} añadida`,
    addedWithCheckIn: (name, count) =>
      `${name} añadida · ${count} uso${fmPl(count, " registrado", "s registrados")}`,
  },
  duplicate: {
    titleBundle: "Se solapa con un paquete",
    titleSame: "Ya tienes esta suscripción",
    bodyBundle: (names) =>
      `Esta suscripción ya te da ${names}. Pagarla aparte puede ser pagar dos veces. Si usas otra cuenta, añádela igualmente.`,
    bodySame: "Si la pagas aparte con otra cuenta, puedes volver a añadirla.",
    cancel: "No añadir",
    anyway: "Añadir igualmente",
  },
  picker: {
    searchPlaceholder: "Buscar servicios (p. ej., Netflix)",
    searchLabel: "Buscar servicios",
    categoryLabel: "Categoría del servicio",
    all: "Todos",
    bundle: "Paquetes",
    notFound: (query) => `«${query}» no está en la lista. Escríbelo tú.`,
    customWith: (query) => `Escribir «${query}» yo mismo`,
    custom: "Escribir un servicio que no está en la lista",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", varía" : " o más"}`,
    priceAsk: "Escribe el precio tú",
    priceMonthly: (price) => `Al mes ${price}`,
    cycleYearly: "Al año",
    cycleMonthly: "Al mes",
  },
  selected: {
    custom: "Escribir yo",
    notListed: "Un servicio que no está en la lista",
    pickOrType: "Elige un plan o, si no aparece, escribe el importe que pagaste.",
    pickPlan: "Elige un plan y el precio se rellena.",
    basePrice: "Es el precio base. Cámbialo si el tuyo es distinto.",
    typePrice: "Escribe el precio.",
    change: "Otro servicio",
  },
  plan: {
    legend: "Plan",
    yearly: "Anual",
    monthly: "Mensual",
    saves: (monthly, saved, percent) =>
      `Unos ${monthly}/mes · ${saved} menos al año que pagando mensual (${percent} %)`,
  },
  name: {
    label: "Nombre del servicio",
    placeholder: "p. ej., Gimnasio del barrio",
    category: "Categoría",
    ott: "Streaming / vídeo",
    music: "Música en streaming",
    shopping: "Compras / membresía",
    cloud: "Nube / almacenamiento",
    ai: "Herramientas IA / productividad",
    other: "Otros",
  },
  icon: {
    placeholderName: "Escribe un nombre",
    preview: "Así se ve en la lista",
    icon: "Icono",
    color: "Color",
    colors: {
      gray: "Gris",
      red: "Rojo",
      orange: "Naranja",
      yellow: "Amarillo",
      green: "Verde",
      blue: "Azul",
      violet: "Violeta",
    },
  },
  amount: {
    yearlyExTax: "Precio anual (sin impuestos)",
    monthlyExTax: "Precio mensual (sin impuestos)",
    yearly: "Pago anual",
    monthly: "Pago mensual",
    placeholder: "p. ej., 17000",
    currency: "Moneda",
  },
  tax: {
    label: "Impuesto",
    none: "Incluido en el precio · sin impuesto aparte",
    vat10: "Más 10 % de IVA",
    other: (rate) => `Más ${rate} % de impuesto`,
    hintPreset: (name, rate) =>
      `Al pagar en Corea, a ${name} se le suma un ${rate} % de IVA. Si pagas como empresa y no se suma, cámbialo a «Incluido en el precio».`,
    hintOverseas:
      "Los servicios extranjeros a veces suman un 10 % de IVA. Compara con el extracto de tu tarjeta y elige.",
    billed: (billed, amount, rate) =>
      `Cobrado a tu tarjeta: ${billed} (precio ${amount} + IVA ${rate} %)`,
  },
  billing: {
    paidToday: "Pagado hoy",
    paidYesterday: "Ayer",
    paidOnDay: (label, day) => `${label} (día ${day})`,
    day: "Día de cobro (1-31)",
    dayPlaceholder: "p. ej., 15",
    cycle: "Ciclo",
    monthly: "Cobro mensual",
    yearly: "Cobro anual",
    month: "Mes de cobro",
    choose: "Elegir",
    monthOption: (month) => monthName("es", month),
    monthHint:
      "Añade el mes de cobro para que el día D, los recordatorios y el calendario sean correctos.",
    trial: "Fin de la prueba gratuita",
    optional: "(opcional)",
    trialHint:
      "El día en que pasa a ser de pago. Hasta entonces no cuenta en tus gastos y te avisaremos antes de que termine. Si no lo sabes, déjalo vacío (lo tratamos como que ya pagas).",
    yearlyNoPlan: (name) =>
      `${name ? `El precio anual de ${name} no está en la lista. ` : ""}Escribe lo que pagas por el año entero (puede diferir del precio mensual × 12).`,
  },
  sharing: {
    people: "Personas que comparten",
    alone: "Solo yo (1)",
    by: (n) => `Compartida entre ${n}`,
    myShare: "Mi parte",
    optional: "(opcional)",
    shareBefore: "Tu parte es ",
    shareAfter:
      ". Déjalo vacío y se reparte por igual. El gasto y el ahorro se calculan con este importe.",
  },
  account: {
    label: "Cuenta de registro",
    placeholder: "p. ej., Cuenta familiar abc@gmail.com",
    payment: "Método de pago",
  },
  link: {
    url: "Sitio del servicio o dirección de la página de cancelación",
    urlPlaceholder: "p. ej., service.com",
    urlHint:
      "Basta con el dominio. La guía de cancelación muestra esta dirección y un enlace supuesto a la gestión de la cuenta (/account). Es una suposición, así que la página puede no existir.",
    guide: "Notas sobre cómo cancelar",
    guidePlaceholder: "p. ej.\n1. Abrir la app → Ajustes\n2. Gestionar suscripción → Cancelar",
    guideHint: "Escribe un paso por línea y aparecerán en la guía de cancelación.",
  },
  bundle: {
    label: "Paquete",
    includes: (names) =>
      `Esta única suscripción te da ${names}. Si también estás suscrito por separado, puede que pagues dos veces.`,
    soldAs: (names) =>
      `Si pagas a través de ${names}, elige ese paquete para añadirla. Los paquetes pueden no enviar correos de pago a Gmail.`,
  },
};

export const de: Widen<typeof ko> = {
  submit: "Abo hinzufügen",
  save: "Speichern",
  more: (items) => `Weitere Angaben (optional) · ${items}`,
  moreItems: {
    sharing: "Personen, die teilen",
    payment: "Zahlungsmethode",
    account: "Konto",
    website: "Website",
    cancel: "So kündigst du",
  },
  dialog: {
    titlePreset: (name) => `${name} hinzufügen`,
    titleNew: "Abo hinzufügen",
    description: "Wähl einen Dienst oder gib deinen eigenen ein.",
    added: (name) => `${name} hinzugefügt`,
    addedWithCheckIn: (name, count) =>
      `${name} hinzugefügt · ${count} ${fmPl(count, "Nutzung", "Nutzungen")} eingetragen`,
  },
  duplicate: {
    titleBundle: "Überschneidet sich mit einem Paket",
    titleSame: "Du hast dieses Abo bereits",
    bodyBundle: (names) =>
      `Dieses Abo enthält bereits ${names}. Separat zu zahlen bedeutet vielleicht doppelt zu zahlen. Wenn du ein anderes Konto nutzt, füg es trotzdem hinzu.`,
    bodySame: "Wenn du es mit einem anderen Konto separat zahlst, kannst du es erneut hinzufügen.",
    cancel: "Nicht hinzufügen",
    anyway: "Trotzdem hinzufügen",
  },
  picker: {
    searchPlaceholder: "Dienste suchen (z. B. Netflix)",
    searchLabel: "Dienste suchen",
    categoryLabel: "Dienstkategorie",
    all: "Alle",
    bundle: "Pakete",
    notFound: (query) => `„${query}“ ist nicht in der Liste. Gib es selbst ein.`,
    customWith: (query) => `„${query}“ selbst eingeben`,
    custom: "Einen nicht gelisteten Dienst eingeben",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", unterschiedlich" : " und mehr"}`,
    priceAsk: "Preis selbst eingeben",
    priceMonthly: (price) => `Monatlich ${price}`,
    cycleYearly: "Jährlich",
    cycleMonthly: "Monatlich",
  },
  selected: {
    custom: "Selbst eingeben",
    notListed: "Ein nicht gelisteter Dienst",
    pickOrType: "Wähl einen Tarif oder gib, falls er fehlt, den gezahlten Betrag ein.",
    pickPlan: "Wähl einen Tarif, dann wird der Preis eingetragen.",
    basePrice: "Das ist der Grundpreis. Ändere ihn, wenn deiner abweicht.",
    typePrice: "Gib den Preis ein.",
    change: "Anderer Dienst",
  },
  plan: {
    legend: "Tarif",
    yearly: "Jährlich",
    monthly: "Monatlich",
    saves: (monthly, saved, percent) =>
      `Etwa ${monthly}/Monat · ${saved} weniger im Jahr als monatlich (${percent} %)`,
  },
  name: {
    label: "Name des Dienstes",
    placeholder: "z. B. Fitnessstudio um die Ecke",
    category: "Kategorie",
    ott: "Streaming / Video",
    music: "Musik-Streaming",
    shopping: "Shopping / Mitgliedschaft",
    cloud: "Cloud / Speicher",
    ai: "KI-Tools / Produktivität",
    other: "Sonstiges",
  },
  icon: {
    placeholderName: "Namen eingeben",
    preview: "So sieht es in der Liste aus",
    icon: "Symbol",
    color: "Farbe",
    colors: {
      gray: "Grau",
      red: "Rot",
      orange: "Orange",
      yellow: "Gelb",
      green: "Grün",
      blue: "Blau",
      violet: "Violett",
    },
  },
  amount: {
    yearlyExTax: "Jahrespreis (ohne Steuer)",
    monthlyExTax: "Monatspreis (ohne Steuer)",
    yearly: "Jahreszahlung",
    monthly: "Monatszahlung",
    placeholder: "z. B. 17000",
    currency: "Währung",
  },
  tax: {
    label: "Steuer",
    none: "Im Preis enthalten · keine separate Steuer",
    vat10: "Zzgl. 10 % MwSt.",
    other: (rate) => `Zzgl. ${rate} % Steuer`,
    hintPreset: (name, rate) =>
      `Bei Zahlung in Korea kommen zu ${name} ${rate} % MwSt. hinzu. Wenn du als Unternehmen zahlst und sie nicht anfällt, stell auf „Im Preis enthalten“ um.`,
    hintOverseas:
      "Ausländische Dienste schlagen manchmal 10 % MwSt. auf. Vergleich mit deiner Kartenabrechnung und wähle.",
    billed: (billed, amount, rate) =>
      `Von der Karte abgebucht: ${billed} (Preis ${amount} + ${rate} % MwSt.)`,
  },
  billing: {
    paidToday: "Heute bezahlt",
    paidYesterday: "Gestern",
    paidOnDay: (label, day) => `${label} (am ${day}.)`,
    day: "Abbuchungstag (1–31)",
    dayPlaceholder: "z. B. 15",
    cycle: "Zyklus",
    monthly: "Monatlich abgebucht",
    yearly: "Jährlich abgebucht",
    month: "Abbuchungsmonat",
    choose: "Wählen",
    monthOption: (month) => monthName("de", month),
    monthHint: "Trag den Abbuchungsmonat ein, damit D-Day, Erinnerungen und Kalender stimmen.",
    trial: "Ende des kostenlosen Tests",
    optional: "(optional)",
    trialHint:
      "Der Tag, an dem es kostenpflichtig wird. Bis dahin zählt es nicht zu deinen Ausgaben, und wir erinnern dich vor dem Ende. Wenn du es nicht weißt, lass es leer (dann gilt: du zahlst bereits).",
    yearlyNoPlan: (name) =>
      `${name ? `Der Jahrespreis von ${name} ist nicht in der Liste. ` : ""}Gib ein, was du für das ganze Jahr zahlst (kann vom Monatspreis × 12 abweichen).`,
  },
  sharing: {
    people: "Personen, die teilen",
    alone: "Nur ich (1)",
    by: (n) => `Geteilt zu ${n}`,
    myShare: "Mein Anteil",
    optional: "(optional)",
    shareBefore: "Dein Anteil beträgt ",
    shareAfter:
      ". Leer lassen teilt gleichmäßig. Ausgaben und Ersparnis werden mit diesem Betrag berechnet.",
  },
  account: {
    label: "Konto",
    placeholder: "z. B. Familienkonto abc@gmail.com",
    payment: "Zahlungsmethode",
  },
  link: {
    url: "Website des Dienstes oder Adresse der Kündigungsseite",
    urlPlaceholder: "z. B. service.com",
    urlHint:
      "Die Domain genügt. Die Kündigungshilfe zeigt diese Adresse und einen vermuteten Link zur Kontoverwaltung (/account). Er ist geraten, die Seite existiert also vielleicht nicht.",
    guide: "Notizen zum Kündigen",
    guidePlaceholder: "z. B.\n1. App öffnen → Einstellungen\n2. Abo verwalten → Kündigen",
    guideHint: "Schreib einen Schritt pro Zeile, dann erscheinen sie in der Kündigungshilfe.",
  },
  bundle: {
    label: "Paket",
    includes: (names) =>
      `Dieses eine Abo enthält ${names}. Wenn du es zusätzlich separat abonniert hast, zahlst du vielleicht doppelt.`,
    soldAs: (names) =>
      `Wenn du über ${names} zahlst, wähl dieses Paket zum Hinzufügen. Pakete schicken eventuell keine Zahlungs-E-Mails an Gmail.`,
  },
};

export const pt: Widen<typeof ko> = {
  submit: "Adicionar assinatura",
  save: "Salvar",
  more: (items) => `Mais detalhes (opcional) · ${items}`,
  moreItems: {
    sharing: "pessoas que dividem",
    payment: "forma de pagamento",
    account: "conta de cadastro",
    website: "site",
    cancel: "como cancelar",
  },
  dialog: {
    titlePreset: (name) => `Adicionar ${name}`,
    titleNew: "Adicionar assinatura",
    description: "Escolha um serviço ou digite o seu.",
    added: (name) => `${name} adicionada`,
    addedWithCheckIn: (name, count) =>
      `${name} adicionada · ${count} uso${fmPl(count, " registrado", "s registrados")}`,
  },
  duplicate: {
    titleBundle: "Isto se sobrepõe a um pacote",
    titleSame: "Você já tem esta assinatura",
    bodyBundle: (names) =>
      `Esta assinatura já te dá ${names}. Pagar separado pode ser pagar duas vezes. Se você usa outra conta, pode adicionar mesmo assim.`,
    bodySame: "Se você paga separado com outra conta, dá para adicionar de novo.",
    cancel: "Não adicionar",
    anyway: "Adicionar mesmo assim",
  },
  picker: {
    searchPlaceholder: "Buscar serviços (ex.: Netflix)",
    searchLabel: "Buscar serviços",
    categoryLabel: "Categoria do serviço",
    all: "Todos",
    bundle: "Pacotes",
    notFound: (query) => `“${query}” não está na lista. Digite você mesmo.`,
    customWith: (query) => `Digitar “${query}”`,
    custom: "Digitar um serviço que não está na lista",
    priceFrom: (cycle, price, incomplete) =>
      `${cycle} ${price}${incomplete ? ", varia" : " ou mais"}`,
    priceAsk: "Digite o preço você mesmo",
    priceMonthly: (price) => `Por mês ${price}`,
    cycleYearly: "Por ano",
    cycleMonthly: "Por mês",
  },
  selected: {
    custom: "Digitar",
    notListed: "Um serviço que não está na lista",
    pickOrType: "Escolha um plano ou, se não estiver na lista, digite o valor que pagou.",
    pickPlan: "Escolha um plano e o preço é preenchido.",
    basePrice: "Este é o preço base. Mude se o seu for diferente.",
    typePrice: "Digite o preço.",
    change: "Outro serviço",
  },
  plan: {
    legend: "Plano",
    yearly: "Anual",
    monthly: "Mensal",
    saves: (monthly, saved, percent) =>
      `Cerca de ${monthly}/mês · ${saved} a menos por ano que no mensal (${percent}%)`,
  },
  name: {
    label: "Nome do serviço",
    placeholder: "ex.: Academia do bairro",
    category: "Categoria",
    ott: "Streaming / vídeo",
    music: "Música por streaming",
    shopping: "Compras / plano de membro",
    cloud: "Nuvem / armazenamento",
    ai: "Ferramentas de IA / produtividade",
    other: "Outros",
  },
  icon: {
    placeholderName: "Digite um nome",
    preview: "Assim aparece na lista",
    icon: "Ícone",
    color: "Cor",
    colors: {
      gray: "Cinza",
      red: "Vermelho",
      orange: "Laranja",
      yellow: "Amarelo",
      green: "Verde",
      blue: "Azul",
      violet: "Violeta",
    },
  },
  amount: {
    yearlyExTax: "Preço anual (sem impostos)",
    monthlyExTax: "Preço mensal (sem impostos)",
    yearly: "Pagamento anual",
    monthly: "Pagamento mensal",
    placeholder: "ex.: 17000",
    currency: "Moeda",
  },
  tax: {
    label: "Imposto",
    none: "Incluído no preço · sem imposto à parte",
    vat10: "Mais 10% de IVA",
    other: (rate) => `Mais ${rate}% de imposto`,
    hintPreset: (name, rate) =>
      `Ao pagar na Coreia, ${rate}% de IVA é somado a ${name}. Se você paga como empresa e não é somado, mude para “Incluído no preço”.`,
    hintOverseas:
      "Serviços estrangeiros às vezes somam 10% de IVA. Compare com a fatura do cartão e escolha.",
    billed: (billed, amount, rate) =>
      `Cobrado no cartão: ${billed} (preço ${amount} + IVA ${rate}%)`,
  },
  billing: {
    paidToday: "Paguei hoje",
    paidYesterday: "Ontem",
    paidOnDay: (label, day) => `${label} (dia ${day})`,
    day: "Dia de cobrança (1-31)",
    dayPlaceholder: "ex.: 15",
    cycle: "Ciclo",
    monthly: "Cobrança mensal",
    yearly: "Cobrança anual",
    month: "Mês de cobrança",
    choose: "Escolher",
    monthOption: (month) => monthName("pt", month),
    monthHint:
      "Informe o mês de cobrança para o dia D, os lembretes e o calendário ficarem certos.",
    trial: "Fim do teste grátis",
    optional: "(opcional)",
    trialHint:
      "O dia em que passa a ser pago. Até lá fica fora dos seus gastos, e avisamos antes de terminar. Se não souber, deixe em branco (consideramos que você já paga).",
    yearlyNoPlan: (name) =>
      `${name ? `O preço anual de ${name} não está na lista. ` : ""}Informe quanto você paga pelo ano inteiro (pode ser diferente do preço mensal × 12).`,
  },
  sharing: {
    people: "Pessoas que dividem",
    alone: "Só eu (1)",
    by: (n) => `Dividida por ${n}`,
    myShare: "Minha parte",
    optional: "(opcional)",
    shareBefore: "Sua parte é ",
    shareAfter:
      ". Deixe em branco para dividir igualmente. Gastos e economia são calculados com este valor.",
  },
  account: {
    label: "Conta de cadastro",
    placeholder: "ex.: Conta da família abc@gmail.com",
    payment: "Forma de pagamento",
  },
  link: {
    url: "Site do serviço ou endereço da página de cancelamento",
    urlPlaceholder: "ex.: service.com",
    urlHint:
      "Basta o domínio. O guia de cancelamento mostra este endereço e um link presumido para a gestão da conta (/account). É um palpite, então a página pode não existir.",
    guide: "Notas de como cancelar",
    guidePlaceholder: "ex.:\n1. Abrir o app → Configurações\n2. Gerenciar assinatura → Cancelar",
    guideHint: "Escreva um passo por linha e eles aparecem no guia de cancelamento.",
  },
  bundle: {
    label: "Pacote",
    includes: (names) =>
      `Esta única assinatura te dá ${names}. Se você também assina separado, pode estar pagando duas vezes.`,
    soldAs: (names) =>
      `Se você paga por meio de ${names}, escolha esse pacote para adicionar. Pacotes podem não enviar e-mails de pagamento ao Gmail.`,
  },
};
