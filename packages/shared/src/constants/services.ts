import { BillingCycle, SubscriptionCategory, SubscriptionFormData, Currency } from "../types";
import { formatCurrency } from "../utils/cost-per-use";

/** 한 서비스 안의 요금제 하나. */
export interface ServicePlan {
  /** 구독에 저장하는 값(planId). 한 서비스 안에서만 겹치지 않으면 된다. */
  id: string;
  name: string;
  /** billingCycle이 yearly면 1년치 금액이다. */
  amount: number;
  /** 적지 않으면 서비스의 통화. */
  currency?: Currency;
  /** 적지 않으면 월 결제. */
  billingCycle?: BillingCycle;
}

export interface ServicePreset {
  id: string;
  name: string;
  nameKo: string;
  category: SubscriptionCategory;
  /**
   * 요금이 하나뿐인 서비스의 월 요금. 요금제가 여럿이면(plans) null이고, 요금을 확인하지
   * 못했거나 사람마다 다르면(자동충전 금액·앱스토어 묶음 등) 역시 null이다 — 그럴듯한 값을
   * 채워 두면 등록하는 사람이 그대로 믿고 저장한다. null이면 등록할 때 직접 적는다.
   */
  defaultAmount: number | null;
  /** 요금제가 여럿인 서비스. 등록할 때 사용자가 하나를 고른다 — 미리 골라 두지 않는다. */
  plans?: ServicePlan[];
  /** 결제 경로·조건에 따라 요금이 달라지는 점을 알리는 한 줄. */
  priceNote?: string;
  currency: Currency;
  cancelUrl: string;
  /**
   * Whether `cancelUrl` lands on the screen that holds the cancel button
   * ("direct"), or on a page on the way there — the service's front door or
   * its account page — leaving the user to follow `cancelGuide` from there
   * ("entry").
   *
   * The app calls these links a one-second direct route to cancellation. For
   * the entry ones that claim is false, so the UI has to say which it is
   * rather than promising the same thing for every service.
   */
  cancelUrlKind: "direct" | "entry";
  /**
   * 예전에 이 프리셋이 쓰던 해지 주소. 서비스가 주소를 바꾸면 옛 주소를 여기로 옮긴다.
   *
   * 구독은 등록할 때의 해지 주소를 그대로 저장한다. 프리셋만 고치면 이미 등록된
   * 구독은 옛 주소(404일 수도 있다)를 계속 열므로, 저장소를 불러올 때
   * `currentCancelUrl`로 지금 주소로 바꾼다.
   */
  legacyCancelUrls?: string[];
  cancelGuide: string;
  iconEmoji: string;
}

export interface PaymentMethodOption {
  value: string;
  label: string;
  directCancelUrl?: string;
  guide?: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: "credit_card", label: "신용 / 체크카드 일반결제" },
  {
    value: "kakaopay",
    label: "카카오페이 자동결제",
    directCancelUrl: "https://pay.kakao.com",
    guide: "카카오톡 > 더보기 > 카카오페이 > 결제 > 자동결제 관리 > 해당 서비스 해지",
  },
  {
    value: "naverpay",
    label: "네이버페이 정기결제",
    directCancelUrl: "https://pay.naver.com",
    guide: "네이버페이 홈 > 내 지갑 > 정기/반복결제 > 해당 서비스 해지",
  },
  {
    value: "apple_iap",
    label: "Apple App Store 인앱결제",
    directCancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    guide: "설정 > 본인 이름(Apple ID) > 구독 > 해당 구독 선택 > 구독 취소",
  },
  {
    value: "google_play",
    label: "Google Play 정기결제",
    directCancelUrl: "https://play.google.com/store/account/subscriptions",
    guide: "Google Play 앱/웹 > 프로필 > 결제 및 정기결제 > 정기결제 > 취소",
  },
  {
    value: "telecom",
    label: "통신사 결합 / 부가서비스",
    guide: "각 통신사(SKT Tworld, KT, LG U+) 고객센터 앱의 부가서비스 메뉴에서 해지",
  },
  { value: "other", label: "기타 결제수단" },
];

export const ACCOUNT_PROVIDERS = [
  { id: "google", name: "Google", icon: "🌐", defaultDomain: "@gmail.com", color: "text-red-500" },
  {
    id: "kakao",
    name: "카카오",
    icon: "🟡",
    defaultDomain: "@kakao.com",
    color: "text-yellow-500",
  },
  { id: "naver", name: "네이버", icon: "🟢", defaultDomain: "@naver.com", color: "text-green-500" },
  {
    id: "apple",
    name: "Apple ID",
    icon: "🍎",
    defaultDomain: "@icloud.com",
    color: "text-neutral-500",
  },
  {
    id: "email",
    name: "일반 이메일 / 기타",
    icon: "📧",
    defaultDomain: "",
    color: "text-blue-500",
  },
] as const;

/**
 * 서비스 목록과 요금. 요금은 2026년 9월에 확인했다 — 공식 요금표를 먼저 보고, 공식 페이지가
 * 나라마다 달리 보이거나 막혀 있으면 여러 보도·안내가 같은 값을 말할 때만 적었다. 확인하지
 * 못한 곳은 defaultAmount를 null로 두어 등록할 때 직접 적게 한다. 요금이 바뀌면 여기를
 * 고친다 — 이미 등록된 구독은 가격 확인(priceCheck)이 고른 요금제의 새 요금으로 물어본다.
 */
export const POPULAR_SERVICES: ServicePreset[] = [
  {
    id: "netflix",
    name: "Netflix Korea",
    nameKo: "넷플릭스",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "ads", name: "광고형 스탠다드", amount: 7000 },
      { id: "standard", name: "스탠다드", amount: 13500 },
      { id: "premium", name: "프리미엄", amount: 17000 },
    ],
    currency: "KRW",
    cancelUrl: "https://www.netflix.com/cancelplan",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 넷플릭스 로그인 후 우측 상단 프로필 클릭\n2. [계정] 메뉴 선택\n3. 멤버십 상세 정보에서 [멤버십 해지] 버튼 클릭\n4. [해지 완료] 버튼으로 최종 확인",
    iconEmoji: "🍿",
  },
  {
    id: "tving",
    name: "TVING",
    nameKo: "티빙",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "ads", name: "광고형 스탠다드", amount: 5500 },
      { id: "basic", name: "베이직", amount: 9500 },
      { id: "standard", name: "스탠다드", amount: 13500 },
      { id: "premium", name: "프리미엄", amount: 17000 },
    ],
    priceNote: "웹에서 결제한 요금이에요. 앱에서 결제했다면 더 비쌀 수 있어요.",
    currency: "KRW",
    cancelUrl: "https://www.tving.com/my/subscribe",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 티빙 앱 또는 웹에서 마이페이지 진입\n2. [나의 이용권] 선택\n3. 이용권 상세 페이지에서 [변경/해지] 클릭\n4. 하단의 [자동결제 해지] 선택",
    iconEmoji: "📺",
  },
  {
    id: "coupang-wow",
    name: "Coupang WOW (Coupang Play)",
    nameKo: "쿠팡 와우 (쿠팡플레이)",
    category: "ott",
    defaultAmount: 7890,
    currency: "KRW",
    cancelUrl: "https://m.coupang.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 쿠팡 앱 마이쿠팡 진입\n2. [와우 멤버십] 메뉴 선택\n3. 스크롤을 맨 아래로 내려서 [해지하기] 클릭\n4. 혜택 포기 확인 팝업에서 [내가 받고 있는 혜택 포기하기] 클릭",
    iconEmoji: "🚀",
  },
  {
    id: "wavve",
    name: "Wavve",
    nameKo: "웨이브",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "ads", name: "광고형 스탠다드", amount: 5500 },
      { id: "basic", name: "베이직", amount: 7900 },
      { id: "standard", name: "스탠다드", amount: 10900 },
      { id: "premium", name: "프리미엄", amount: 13900 },
    ],
    priceNote: "웹에서 결제한 요금이에요. 앱에서 결제했다면 더 비쌀 수 있어요.",
    currency: "KRW",
    cancelUrl: "https://www.wavve.com/my/membership",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 웨이브 로그인 후 마이페이지 진입\n2. [나의 이용권] 클릭\n3. 이용권 내역에서 [자동결제 해지] 클릭\n4. 해지 사유 선택 후 [해지하기] 완료",
    iconEmoji: "🌊",
  },
  {
    id: "watcha",
    name: "WATCHA",
    nameKo: "왓챠",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "basic", name: "베이직", amount: 7900 },
      { id: "premium", name: "프리미엄", amount: 12900 },
    ],
    currency: "KRW",
    cancelUrl: "https://watcha.com/settings",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 왓챠 설정 페이지 접속\n2. 설정 메뉴 중 [이용권 설정] 클릭\n3. [해지 신청] 클릭\n4. 팝업 확인 후 [해지 완료] 진행",
    iconEmoji: "🎬",
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium",
    nameKo: "유튜브 프리미엄",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "premium", name: "프리미엄", amount: 14900 },
      { id: "lite", name: "프리미엄 라이트", amount: 8500 },
    ],
    priceNote: "안드로이드·웹에서 결제한 요금이에요. iPhone 앱에서 결제했다면 더 비싸요.",
    currency: "KRW",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 유튜브 앱 우측 상단 프로필 클릭\n2. [구매 항목 및 멤버십] 선택\n3. Premium 멤버십 탭 클릭\n4. [비활성화] - [그대로 취소] 순서로 클릭",
    iconEmoji: "▶️",
  },
  {
    id: "disney-plus",
    name: "Disney+",
    nameKo: "디즈니플러스",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "standard", name: "스탠다드", amount: 9900 },
      { id: "premium", name: "프리미엄", amount: 13900 },
    ],
    currency: "KRW",
    // 옛 해지 주소는 디즈니플러스가 스스로 계정 화면으로 돌려보낸다. 해지 버튼은
    // 계정 화면에서 구독을 고른 뒤에 나오므로 direct가 아니다.
    cancelUrl: "https://www.disneyplus.com/commerce/account",
    cancelUrlKind: "entry",
    legacyCancelUrls: ["https://www.disneyplus.com/account/cancel-subscription"],
    cancelGuide:
      "1. 디즈니플러스 계정 설정 접속\n2. [멤버십] 섹션에서 구독 중인 플랜 선택\n3. 하단의 [멤버십 취소] 클릭\n4. 취소 사유 선택 후 [취소 완료] 클릭",
    iconEmoji: "✨",
  },
  {
    id: "apple-tv",
    name: "Apple TV+",
    nameKo: "애플 TV+ (Apple TV+)",
    category: "ott",
    // 미국 요금은 올랐지만 한국은 월 9,900원 그대로라는 보도(2025) 기준.
    defaultAmount: 9900,
    currency: "KRW",
    cancelUrl: "https://tv.apple.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. tv.apple.com 접속 또는 애플 기기 설정 > [구독] 메뉴 진입\n2. Apple TV+ 멤버십 선택\n3. 하단의 [구독 취소] 버튼 클릭하여 완료",
    iconEmoji: "📺",
  },
  {
    id: "prime-video",
    name: "Amazon Prime Video",
    nameKo: "아마존 프라임 비디오",
    category: "ott",
    defaultAmount: null,
    priceNote: "한국 요금을 확인하지 못했어요. 결제 내역의 금액을 적어주세요.",
    currency: "USD",
    cancelUrl: "https://www.primevideo.com/settings",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. Prime Video 웹사이트 접속 후 프로필 > [계정 및 설정] 선택\n2. [내 멤버십] 섹션 이동\n3. [멤버십 종료] 클릭하여 정기결제 해지 완료",
    iconEmoji: "🎬",
  },
  {
    id: "laftel",
    name: "Laftel",
    nameKo: "라프텔 (Laftel)",
    category: "ott",
    defaultAmount: null,
    plans: [
      { id: "basic", name: "베이직", amount: 9900 },
      { id: "premium", name: "프리미엄", amount: 14900 },
    ],
    priceNote: "웹에서 결제한 요금이에요. 앱에서 결제했다면 더 비쌀 수 있어요.",
    currency: "KRW",
    cancelUrl: "https://laftel.net/setting",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 라프텔 웹/앱 마이페이지 접속\n2. [멤버십/결제 정보] 선택\n3. [멤버십 해지하기] 클릭하여 다음 결제 예약 취소 완료",
    iconEmoji: "⚡",
  },
  {
    id: "spotify",
    name: "Spotify",
    nameKo: "스포티파이",
    category: "music",
    defaultAmount: null,
    plans: [
      { id: "individual", name: "개인", amount: 11990 },
      { id: "basic", name: "베이직", amount: 8690 },
      { id: "student", name: "학생", amount: 6600 },
      { id: "duo", name: "듀오", amount: 17985 },
    ],
    currency: "KRW",
    cancelUrl: "https://www.spotify.com/account/plan/manage",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 스포티파이 계정 관리 페이지 접속\n2. 내 요금제 섹션에서 [요금제 변경] 클릭\n3. 페이지 하단의 Spotify Free로 [프리미엄 취소] 클릭\n4. [예, 취소합니다] 클릭하여 확인",
    iconEmoji: "🎵",
  },
  {
    id: "melon",
    name: "Melon",
    nameKo: "멜론",
    category: "music",
    // melon.com 이용권 안내의 정기결제 요금.
    defaultAmount: null,
    plans: [
      { id: "streaming-club", name: "스트리밍클럽", amount: 8690 },
      { id: "streaming-plus", name: "스트리밍 플러스", amount: 11990 },
      { id: "hifi", name: "Hi-Fi 스트리밍클럽", amount: 13200 },
      { id: "mobile", name: "모바일 스트리밍클럽", amount: 7590 },
    ],
    currency: "KRW",
    // 옛 해지 주소는 404다. 멜론 고객센터 FAQ는 메뉴 경로만 안내하고 해지 화면
    // 주소를 밝히지 않아, 확인된 첫 화면으로 보내고 공식 경로를 안내한다.
    cancelUrl: "https://www.melon.com/",
    cancelUrlKind: "entry",
    legacyCancelUrls: ["https://member.melon.com/pay/charge/payCancel.htm"],
    cancelGuide:
      "1. 멜론 PC웹(melon.com) 로그인 후 [내정보] 진입\n2. [멜론이용권/결제정보] > [멜론이용권] 선택\n3. [이용권 해지신청] 클릭\n4. 모바일 앱은 내정보 > 이용권/쿠폰/캐시 > 변경/해지 > 결제방법 변경/해지 > 해지",
    iconEmoji: "🍈",
  },
  {
    id: "apple-music",
    name: "Apple Music",
    nameKo: "애플 뮤직",
    category: "music",
    // apple.com/kr 요금제
    defaultAmount: null,
    plans: [
      { id: "individual", name: "개인", amount: 8900 },
      { id: "family", name: "가족", amount: 13500 },
    ],
    currency: "KRW",
    // 아이클라우드·앱스토어 구독과 같은 Apple 구독 관리 화면이다. 주소가 겹치므로
    // 프리셋은 이름으로 되찾는다(findPresetForSubscription).
    cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 아이폰 [설정] 앱 > 맨 위 내 이름\n2. [구독] > [Apple Music] 선택\n3. [구독 취소] 클릭\n4. 웹에서는 Apple 계정의 구독 관리 화면에서 Apple Music을 골라 취소",
    iconEmoji: "🎶",
  },
  {
    id: "naver-plus",
    name: "Naver Plus",
    nameKo: "네이버플러스",
    category: "shopping",
    defaultAmount: 4900,
    currency: "KRW",
    cancelUrl: "https://nid.naver.com/membership/my",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 네이버플러스 멤버십 마이페이지 접속\n2. 우측 상단 설정(톱니바퀴) 아이콘 클릭\n3. [네이버플러스 멤버십 관리] 클릭\n4. 하단의 [네이버플러스 멤버십 해지하기] 클릭",
    iconEmoji: "N",
  },
  {
    id: "baemin-club",
    name: "Baemin Club",
    nameKo: "배민클럽",
    category: "shopping",
    // 2024년 9월 유료 전환 때 발표한 정가. 할인가로 가입했다면 등록할 때 고친다.
    defaultAmount: 3990,
    currency: "KRW",
    // 해지 경로는 배달의민족 앱의 마이배민 메뉴로 안내돼 있다. 웹 첫 화면으로 보내고
    // 앱 경로를 안내한다.
    cancelUrl: "https://www.baemin.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 배달의민족 앱 로그인 후 아래 [마이배민]\n2. [배민클럽] 화면으로 이동\n3. 화면 아래쪽 [해지하기] > 해지 사유 선택 후 한 번 더 [해지하기]",
    iconEmoji: "🛵",
  },
  {
    id: "naver-mybox",
    name: "Naver MYBOX",
    nameKo: "네이버 MYBOX",
    category: "cloud",
    defaultAmount: null,
    priceNote: "용량마다 요금이 달라요. 결제 내역의 금액을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://mybox.naver.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 네이버 MYBOX 웹/앱 접속 > 환경설정\n2. [용량 관리/이용권] 선택\n3. [정기결제 해지] 클릭하여 완료",
    iconEmoji: "☁️",
  },
  {
    id: "naver-vibe",
    name: "Naver VIBE",
    nameKo: "네이버 바이브 (VIBE)",
    category: "music",
    defaultAmount: null,
    priceNote: "지금 요금을 확인하지 못했어요. 결제 내역의 금액을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://vibe.naver.com/membership",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 네이버 VIBE 웹/앱 접속 > [마이페이지]\n2. [멤버십/결제] 메뉴 선택\n3. [구독 해지 예약] 또는 [정기결제 해지] 클릭\n4. 혜택 포기 확인 후 해지 완료",
    iconEmoji: "🎧",
  },
  {
    id: "naver-webtoon",
    name: "Naver Webtoon Cookie",
    nameKo: "네이버 웹툰 쿠키 자동충전",
    category: "other",
    defaultAmount: null,
    priceNote: "자동충전 금액은 직접 정한 금액이에요. 그 금액을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://m.comic.naver.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 네이버웹툰 모바일 앱/웹 > [더보기]\n2. [쿠키샵] > [자동충전 관리] 선택\n3. [자동충전 해지하기] 클릭하여 완료",
    iconEmoji: "🍪",
  },
  {
    id: "kakao-emoticon",
    name: "Kakao Emoticon Plus",
    nameKo: "카카오 이모티콘 플러스",
    category: "other",
    defaultAmount: null,
    plans: [
      { id: "web", name: "웹 결제", amount: 3900 },
      { id: "google-play", name: "구글플레이 결제", amount: 5700 },
      { id: "app-store", name: "앱스토어 결제", amount: 6900 },
    ],
    priceNote: "어디서 결제했는지에 따라 요금이 달라요.",
    currency: "KRW",
    cancelUrl: "https://my.kakao.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 카카오톡 더보기 탭에서 [My구독] 클릭\n2. [이모티콘 플러스] 선택\n3. [구독 중인 상품] 메뉴에서 [해지하기] 클릭\n4. 해지 확인 완료",
    iconEmoji: "😊",
  },
  {
    id: "apple-icloud",
    name: "Apple iCloud+",
    nameKo: "아이클라우드",
    category: "cloud",
    // Apple 지원 문서의 대한민국 요금. 한국에서는 달러가 아니라 원화로 청구된다.
    defaultAmount: null,
    plans: [
      { id: "50gb", name: "50GB", amount: 1100 },
      { id: "200gb", name: "200GB", amount: 4400 },
      { id: "2tb", name: "2TB", amount: 14000 },
      { id: "6tb", name: "6TB", amount: 44000 },
      { id: "12tb", name: "12TB", amount: 88000 },
    ],
    currency: "KRW",
    cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    cancelUrlKind: "direct",
    legacyCancelUrls: ["https://apps.apple.com/account/subscriptions"],
    cancelGuide:
      "1. 아이폰 설정 > 상단 내 이름 클릭\n2. [iCloud] - [계정 저장 공간 관리] 선택\n3. [저장 공간 요금제 변경] 클릭\n4. [다운그레이드 옵션]에서 무료 요금제(5GB) 선택 후 완료",
    iconEmoji: "☁️",
  },
  {
    id: "google-one",
    name: "Google One",
    nameKo: "구글 원",
    category: "cloud",
    // one.google.com 요금제(한국).
    defaultAmount: null,
    plans: [
      { id: "basic", name: "베이직 100GB", amount: 2400 },
      { id: "ai-plus", name: "Google AI Plus 2TB", amount: 11900 },
      { id: "ai-pro", name: "Google AI Pro 5TB", amount: 29000 },
    ],
    currency: "KRW",
    cancelUrl: "https://one.google.com/about/plans",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 구글 원 홈페이지/앱 접속 후 로그인\n2. [설정] 아이콘 클릭\n3. [멤버십 취소] 메뉴 선택\n4. [취소] 버튼 클릭하여 확인",
    iconEmoji: "☁️",
  },
  {
    id: "google-ai-pro",
    name: "Google AI Pro",
    nameKo: "Google AI Pro (Gemini Advanced)",
    category: "ai",
    defaultAmount: null,
    plans: [
      { id: "ai-plus", name: "Google AI Plus", amount: 11900 },
      { id: "ai-pro", name: "Google AI Pro", amount: 29000 },
    ],
    currency: "KRW",
    cancelUrl: "https://play.google.com/store/account/subscriptions",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. Google Play 접속 > [결제 및 정기결제] > [정기결제] 선택\n2. Google AI Pro / Google One 멤버십 선택\n3. [구독 취소] 클릭하여 해지 완료",
    iconEmoji: "✨",
  },
  {
    id: "notion",
    name: "Notion",
    nameKo: "노션",
    category: "other",
    // 멤버 1명 기준. 요금 페이지가 한국에서는 원화로 보인다.
    defaultAmount: null,
    plans: [
      { id: "plus-monthly", name: "플러스 (월 결제)", amount: 16800 },
      { id: "plus-yearly", name: "플러스 (연 결제)", amount: 168000, billingCycle: "yearly" },
    ],
    currency: "KRW",
    // 노션의 청구 설정은 앱 안의 설정 창에만 있고 고정 주소가 없다. 옛 주소
    // (/my-account)는 계정 화면이 아니라 그 이름의 페이지를 찾으러 갔다.
    cancelUrl: "https://www.notion.com/",
    cancelUrlKind: "entry",
    legacyCancelUrls: ["https://www.notion.so/my-account"],
    cancelGuide:
      "1. 노션 좌측 사이드바에서 [설정과 멤버] 클릭\n2. [청구] 메뉴 탭으로 이동\n3. 요금제 정보에서 [플랜 변경] 클릭\n4. [다운그레이드] 메뉴를 통해 무료(Free) 플랜으로 변경",
    iconEmoji: "📝",
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT",
    // '챗GPT 플러스'로 등록된 구독도 같은 서비스로 알아보도록(추천 목록의 이름 비교) 짧게 둔다.
    nameKo: "챗GPT",
    category: "ai",
    // 공식 요금 페이지는 막혀 있어, 여러 안내가 같은 값을 말하는 요금만 적었다.
    defaultAmount: null,
    plans: [
      { id: "plus", name: "Plus", amount: 20 },
      { id: "pro-100", name: "Pro ($100)", amount: 100 },
      { id: "pro-200", name: "Pro ($200)", amount: 200 },
    ],
    currency: "USD",
    cancelUrl: "https://chatgpt.com/",
    cancelUrlKind: "entry",
    legacyCancelUrls: ["https://chat.openai.com/"],
    cancelGuide:
      "1. 챗GPT 웹사이트 좌측 하단 프로필 클릭\n2. [My plan] 클릭\n3. [Manage my subscription] 클릭\n4. [Cancel plan] 버튼 클릭하여 해지 완료",
    iconEmoji: "🤖",
  },
  {
    id: "claude-pro",
    name: "Claude",
    // '클로드 프로 (Claude Pro)'로 등록된 구독도 같은 서비스로 알아보도록 짧게 둔다.
    nameKo: "Claude",
    category: "ai",
    // claude.com/pricing의 월 결제 요금.
    defaultAmount: null,
    plans: [
      { id: "pro", name: "Pro", amount: 20 },
      { id: "max-5x", name: "Max 5x", amount: 100 },
    ],
    currency: "USD",
    cancelUrl: "https://claude.ai/settings/billing",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. claude.ai 접속 후 좌측 하단 프로필/계정 클릭\n2. [Settings] > [Billing] 메뉴 선택\n3. [Cancel Plan] 또는 구독 취소 클릭하여 완료",
    iconEmoji: "🧠",
  },
  {
    id: "github-copilot-pro",
    name: "GitHub Copilot",
    nameKo: "GitHub Copilot",
    category: "ai",
    // GitHub 문서의 개인 요금.
    defaultAmount: null,
    plans: [
      { id: "pro", name: "Pro", amount: 10 },
      { id: "pro-plus", name: "Pro+", amount: 39 },
    ],
    currency: "USD",
    // GitHub 문서는 설정 메뉴 경로만 안내하고 해지 화면의 고정 주소를 밝히지 않는다.
    cancelUrl: "https://github.com/settings/billing",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. GitHub 로그인 후 오른쪽 위 프로필 사진 > [Settings]\n2. 왼쪽 'Access'의 [Billing and licensing] > [Licensing] (예전 화면은 [Plans and usage])\n3. 'GitHub Copilot' 칸의 [Manage subscription] > [Cancel subscription]\n4. [Cancel Copilot Pro]로 확인 — 이번 결제 주기가 끝나면 Copilot Free로 바뀝니다",
    iconEmoji: "🐙",
  },
  {
    id: "cursor-pro",
    name: "Cursor Pro",
    nameKo: "Cursor Pro",
    category: "ai",
    defaultAmount: 20,
    currency: "USD",
    // 결제 대시보드에서 Stripe 결제 화면을 한 번 더 열어야 해지 버튼이 나온다.
    cancelUrl: "https://cursor.com/dashboard/billing",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. cursor.com 로그인 후 대시보드의 [Billing] 화면\n2. [Manage Subscription]을 누르면 Stripe 결제 화면이 열림\n3. [Cancel subscription]으로 확인 — 이번 결제 주기가 끝나면 무료 Hobby 플랜으로 바뀝니다",
    iconEmoji: "⌨️",
  },
  {
    id: "perplexity-pro",
    name: "Perplexity",
    nameKo: "Perplexity",
    category: "ai",
    defaultAmount: null,
    plans: [
      { id: "pro", name: "Pro", amount: 20 },
      { id: "max", name: "Max", amount: 200 },
    ],
    currency: "USD",
    // 도움말은 설정 메뉴 경로만 안내한다. 첫 화면으로 보내고 경로를 안내한다.
    cancelUrl: "https://www.perplexity.ai/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 웹에서 로그인 후 왼쪽 아래 프로필 > [Settings]\n2. [Subscription] 탭 > [Manage Subscription]\n3. 열린 결제 화면에서 구독 취소\n4. 앱에서 가입했다면 App Store·Google Play의 구독 관리에서 해지",
    iconEmoji: "🔍",
  },
  {
    id: "adobe-cc",
    name: "Adobe Creative Cloud",
    nameKo: "어도비",
    category: "other",
    defaultAmount: null,
    priceNote: "플랜과 약정마다 요금이 달라요. 결제 내역의 금액을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://account.adobe.com/plans",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 어도비 계정 플랜 관리 페이지 접속\n2. 취소하려는 플랜의 [플랜 관리] 클릭\n3. [플랜 취소] 선택\n4. 취소 이유 선택 후 안내에 따라 계속 진행하여 해지",
    iconEmoji: "🎨",
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    nameKo: "마이크로소프트 365",
    category: "other",
    // Microsoft Store 한국 요금.
    defaultAmount: null,
    plans: [
      { id: "personal", name: "퍼스널 (월 결제)", amount: 12500 },
      { id: "family", name: "패밀리 (월 결제)", amount: 15500 },
      { id: "personal-yearly", name: "퍼스널 (연 결제)", amount: 125000, billingCycle: "yearly" },
      { id: "family-yearly", name: "패밀리 (연 결제)", amount: 155000, billingCycle: "yearly" },
    ],
    currency: "KRW",
    cancelUrl: "https://account.microsoft.com/services",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 마이크로소프트 계정 서비스 및 구독 페이지 접속\n2. 취소할 Microsoft 365 구독 찾기\n3. [관리] - [구독 취소] 클릭\n4. 취소 확인 화면에서 [구독 취소] 확정",
    iconEmoji: "💻",
  },
  {
    id: "millie",
    name: "Millie",
    nameKo: "밀리의 서재",
    category: "other",
    defaultAmount: null,
    plans: [
      { id: "ebook", name: "전자책", amount: 9900 },
      { id: "with-paper", name: "종이책 정기구독", amount: 19800 },
    ],
    currency: "KRW",
    cancelUrl: "https://www.millie.co.kr/v3/customer/my-subscription",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 밀리의 서재 앱 하단 [관리] 탭 진입\n2. [구독 관리] 선택\n3. [자동결제 해지] 클릭\n4. 안내 팝업 확인 후 해지 완료",
    iconEmoji: "📚",
  },
  {
    id: "ridi-select",
    name: "RIDI Select",
    nameKo: "리디셀렉트",
    category: "other",
    defaultAmount: 4900,
    currency: "KRW",
    cancelUrl: "https://ridibooks.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 리디북스 웹/앱 마이페이지 진입\n2. 리디셀렉트 관리 메뉴 선택\n3. [구독 해지 예약] 클릭\n4. 해지 확인 완료",
    iconEmoji: "📖",
  },
  {
    id: "apple-play-store",
    name: "Apple Play Store subscriptions",
    nameKo: "구글 플레이스토어 정기결제",
    category: "other",
    // 여러 앱의 정기결제를 한데 모은 항목이라 정해진 요금이 없다(예전에는 0원으로 채웠다).
    defaultAmount: null,
    priceNote: "해지하려는 앱의 요금을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://play.google.com/store/account/subscriptions",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 안드로이드 기기 구글 플레이스토어 앱 실행\n2. 우측 상단 프로필 클릭\n3. [결제 및 정기 결제] - [정기 결제] 선택\n4. 해지할 항목 선택 후 [구독 취소] 클릭",
    iconEmoji: "📱",
  },
  {
    id: "apple-app-store",
    name: "Apple App Store subscriptions",
    nameKo: "애플 앱스토어 구독",
    category: "other",
    // 여러 앱의 구독을 한데 모은 항목이라 정해진 요금이 없다(예전에는 0원으로 채웠다).
    defaultAmount: null,
    priceNote: "해지하려는 앱의 요금을 적어주세요.",
    currency: "KRW",
    cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
    cancelUrlKind: "direct",
    legacyCancelUrls: ["https://apps.apple.com/account/subscriptions"],
    cancelGuide:
      "1. 아이폰/아이패드 설정 > 최상단 프로필 이름 클릭\n2. [구독] 메뉴 선택\n3. 해지할 구독 항목 선택\n4. 하단의 [구독 취소] 클릭하여 확인",
    iconEmoji: "🍏",
  },
];

/**
 * Sample data behind the "1초 체험" buttons. Kept here so the landing page and
 * the dashboard load the exact same set.
 */
export const DEMO_SUBSCRIPTIONS: Array<{
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number;
  billingCycle: "monthly";
  category: SubscriptionCategory;
  cancelUrl: string;
  cancelGuide: string;
  iconUrl: string;
  planId?: string;
  planName?: string;
}> = [
  {
    name: "넷플릭스",
    amount: 17000,
    planId: "premium",
    planName: "프리미엄",
    currency: "KRW",
    billingDay: 3,
    billingCycle: "monthly",
    category: "ott",
    cancelUrl: "https://www.netflix.com/cancelplan",
    cancelGuide: "계정 > 멤버십 해지 > 해지 완료",
    iconUrl: "🎬",
  },
  {
    name: "유튜브 프리미엄",
    amount: 14900,
    planId: "premium",
    planName: "프리미엄",
    currency: "KRW",
    billingDay: 12,
    billingCycle: "monthly",
    category: "ott",
    cancelUrl: "https://www.youtube.com/paid_memberships",
    cancelGuide: "프로필 > 구매 항목 및 멤버십 > 비활성화",
    iconUrl: "▶️",
  },
  {
    name: "쿠팡 와우 멤버십",
    amount: 7890,
    currency: "KRW",
    billingDay: 28,
    billingCycle: "monthly",
    category: "shopping",
    cancelUrl: "https://m.coupang.com/",
    cancelGuide: "마이쿠팡 > 와우 멤버십 > 해지하기",
    iconUrl: "🛒",
  },
];

/**
 * Where a cancel URL actually lands.
 *
 * Subscriptions store only the URL, so the kind is looked up from the preset
 * table at render time. A URL the user typed themselves is "unknown": the app
 * has no basis to promise where it goes, so it must not describe it as an
 * official cancellation page.
 */
export function getCancelUrlKind(cancelUrl?: string): "direct" | "entry" | "unknown" {
  if (!cancelUrl) return "unknown";
  // 애플·구글 구독 관리 화면처럼 여러 프리셋이 같은 주소를 쓴다. 그 프리셋들의
  // 성격이 하나로 모일 때만 말한다.
  const kinds = new Set(
    POPULAR_SERVICES.filter((service) => service.cancelUrl === cancelUrl).map(
      (service) => service.cancelUrlKind,
    ),
  );
  return kinds.size === 1 ? [...kinds][0] : "unknown";
}

/**
 * 예전 프리셋 해지 주소를 지금 주소로 바꾼다. 해당하지 않으면 그대로 돌려준다.
 *
 * 프리셋이 쓰던 주소와 정확히 같을 때만 바꾼다. 사용자가 직접 적은 주소는
 * 비슷해 보여도 건드리지 않는다.
 */
export function currentCancelUrl(url: string): string {
  const preset = POPULAR_SERVICES.find((service) => service.legacyCancelUrls?.includes(url));
  return preset?.cancelUrl ?? url;
}

/**
 * 해지 링크가 열리지 않을 때 쓸 폴백 주소 — 그 서비스의 첫 화면.
 *
 * `https://{domain}/account` 같은 주소를 만들어내지 않는다. 서비스마다
 * 계정 관리 경로가 다르고, 없는 주소를 "계정 관리 페이지"라고 부르면
 * 사용자를 404로 보낸다. 여기서 확실히 아는 것은 도메인의 첫 화면뿐이므로
 * 그것만 돌려주고, 나머지는 `cancelGuide`의 단계 안내에 맡긴다.
 *
 * 주소를 해석할 수 없으면 `null`이다.
 */
export function getServiceHomeUrl(cancelUrl?: string): string | null {
  if (!cancelUrl) return null;
  try {
    const parsed = new URL(cancelUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    // 첫 화면이 곧 해지 링크라면 따로 보여줄 폴백이 없다.
    if (parsed.pathname === "/" && !parsed.search) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * `cancelGuide`의 줄글을 단계 목록으로 나눈다.
 *
 * 프리셋 가이드는 "1. ...\n2. ..." 형식이지만, 사용자가 직접 적은 가이드는
 * 번호가 없을 수도 있다. 번호를 찾지 못하면 줄 단위로만 나누고, 없는 순서를
 * 지어내지 않는다.
 */
export function parseCancelGuideSteps(cancelGuide?: string): string[] {
  if (!cancelGuide) return [];
  return cancelGuide
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * 직통 해지 링크가 죽었을 때 시도해 볼 계정 관리 주소.
 *
 * `{origin}/account`는 많은 서비스가 쓰는 관례일 뿐, 그 서비스에 실제로
 * 있는 주소인지는 확인되지 않았다. 그래서 이 값을 "공식 계정 관리
 * 페이지"라고 부르면 안 된다 — 화면은 '이동 시도'라고 적고, 열리지 않을 수
 * 있다는 것을 함께 알린 뒤 단계별 안내로 넘긴다.
 *
 * 주소를 해석할 수 없으면 `null`이다.
 */
export function getAccountFallbackUrl(cancelUrl?: string): string | null {
  if (!cancelUrl) return null;
  try {
    const parsed = new URL(cancelUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    // 이미 계정 관리 주소를 가리키고 있으면 같은 버튼을 두 번 보여줄 이유가 없다.
    if (parsed.pathname.replace(/\/$/, "").endsWith("/account")) return null;
    return `${parsed.origin}/account`;
  } catch {
    return null;
  }
}

/**
 * 사용자가 적은 서비스 주소를 링크로 쓸 수 있게 정리한다.
 *
 * "service.com"처럼 도메인만 적어도 받는다. 해지 페이지 주소까지 아는 사람은
 * 드물지만 서비스 도메인은 대부분 안다. 도메인만 있어도 해지 가이드가 그
 * 첫 화면과, 흔한 경로로 추정한 계정 관리 주소(`getAccountFallbackUrl`)를
 * 보여줄 수 있다.
 *
 * 비어 있으면 `url` 없이 통과한다. http(s) 링크로 만들 수 없으면 `error`를
 * 준다 — `javascript:` 같은 주소가 해지 버튼 뒤에 숨는 일을 막는다.
 */
export function parseServiceUrl(input: string): { url?: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const invalid = { error: "주소를 확인해주세요. (예: service.com)" };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return invalid;
    // 점이 없는 호스트(localhost, 오타 난 단어)는 공개된 서비스 주소가 아니다.
    if (!url.hostname.includes(".")) return invalid;
    return { url: url.href };
  } catch {
    return invalid;
  }
}

/**
 * 이 구독이 어느 프리셋에서 온 것인지 되찾는다.
 *
 * 구독은 프리셋 id를 저장하지 않으므로 해지 URL로 먼저 맞추고, 없으면
 * 이름으로 맞춘다. 어느 쪽으로도 확정되지 않으면 `undefined` — 이름이 비슷하다는
 * 이유만으로 남의 요금표를 그 구독의 "기준 요금"이라고 부르지 않는다.
 */
export function findPresetForSubscription(sub: {
  name: string;
  cancelUrl?: string;
}): ServicePreset | undefined {
  const normalized = sub.name.trim().toLowerCase();
  const sameName = (service: ServicePreset) =>
    normalized !== "" &&
    (service.nameKo.trim().toLowerCase() === normalized ||
      service.name.trim().toLowerCase() === normalized);

  if (sub.cancelUrl) {
    const byUrl = POPULAR_SERVICES.filter((service) => service.cancelUrl === sub.cancelUrl);
    if (byUrl.length === 1) return byUrl[0];
    // 애플·구글 구독 관리 화면처럼 여러 프리셋이 같은 주소를 쓰면 주소만으로는 어느
    // 서비스인지 모른다. 예전에는 앞의 것을 골라, 앱스토어 구독에 아이클라우드의
    // $0.99를 기준 요금으로 보여줬다. 이름이 맞는 쪽만 고르고, 없으면 고르지 않는다.
    if (byUrl.length > 1) return byUrl.find(sameName);
  }
  if (!normalized) return undefined;
  return POPULAR_SERVICES.find(sameName);
}

/** 요금제의 통화. 적지 않았으면 서비스의 통화다. */
export function planCurrency(preset: ServicePreset, plan: ServicePlan): Currency {
  return plan.currency ?? preset.currency;
}

/**
 * 서비스를 골랐을 때 등록 폼에 채울 값. 요금은 요금이 하나뿐인 서비스만 채운다 — 요금제가
 * 여럿이면 사용자가 요금제를 고를 때(planFormData) 채우고, 요금을 모르면 비워 둔다.
 * 결제일은 채우지 않는다. 15일로 채워 두면 손대지 않은 사람의 D-day가 지어낸 날짜로
 * 계산된다. 요금·요금제 칸은 undefined로라도 적어서, 앞서 고른 서비스의 값을 지운다.
 */
export function presetFormData(preset: ServicePreset): Partial<SubscriptionFormData> {
  return {
    name: preset.nameKo || preset.name,
    amount: preset.defaultAmount ?? undefined,
    currency: preset.currency,
    billingCycle: "monthly",
    category: preset.category,
    cancelUrl: preset.cancelUrl,
    cancelGuide: preset.cancelGuide,
    iconUrl: preset.iconEmoji,
    planId: undefined,
    planName: undefined,
  };
}

/** 요금제를 골랐을 때 폼에 채울 값. 요금·통화·결제 주기가 그 요금제를 따른다. */
export function planFormData(
  preset: ServicePreset,
  plan: ServicePlan,
): Partial<SubscriptionFormData> {
  return {
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    currency: planCurrency(preset, plan),
    billingCycle: plan.billingCycle ?? "monthly",
  };
}

/**
 * 목록에 보여줄 요금 한 줄. 요금제가 여럿이면 가장 싼 월 요금에 '부터'를 붙이고, 요금을
 * 모르면 '요금 직접 입력'이다. 반올림하지 않는다 — ₩7,890을 '₩8k'로 적지 않는다.
 */
export function describePresetPrice(preset: ServicePreset): string {
  if (preset.plans && preset.plans.length > 0) {
    const monthly = preset.plans.filter((plan) => (plan.billingCycle ?? "monthly") === "monthly");
    const pool = monthly.length > 0 ? monthly : preset.plans;
    const cheapest = pool.reduce((min, plan) => (plan.amount < min.amount ? plan : min));
    const cycle = (cheapest.billingCycle ?? "monthly") === "yearly" ? "연" : "월";
    return `${cycle} ${formatCurrency(cheapest.amount, planCurrency(preset, cheapest))}부터`;
  }
  if (preset.defaultAmount === null) return "요금 직접 입력";
  return `월 ${formatCurrency(preset.defaultAmount, preset.currency)}`;
}

export interface ReferencePrice {
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
}

/**
 * 가격 확인에 쓸 기준 요금. 요금제가 여럿인 서비스는 그 구독이 고른 요금제의 요금이고, 고른
 * 요금제를 모르면(요금제가 생기기 전에 등록한 구독 등) null이다 — 여러 요금 중 하나를 골라
 * '기준 요금'이라고 부르지 않는다. 요금을 모르는 서비스도 null이다.
 */
export function referencePriceFor(sub: {
  name: string;
  cancelUrl?: string;
  planId?: string;
}): ReferencePrice | null {
  const preset = findPresetForSubscription(sub);
  if (!preset) return null;
  if (preset.plans && preset.plans.length > 0) {
    const plan = preset.plans.find((candidate) => candidate.id === sub.planId);
    if (!plan) return null;
    return {
      amount: plan.amount,
      currency: planCurrency(preset, plan),
      billingCycle: plan.billingCycle ?? "monthly",
    };
  }
  if (preset.defaultAmount === null) return null;
  return { amount: preset.defaultAmount, currency: preset.currency, billingCycle: "monthly" };
}
