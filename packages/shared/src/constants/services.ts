import { SubscriptionCategory, Currency } from "../types";

export interface ServicePreset {
  id: string;
  name: string;
  nameKo: string;
  category: SubscriptionCategory;
  defaultAmount: number;
  currency: Currency;
  cancelUrl: string;
  /**
   * Whether `cancelUrl` lands on the screen that holds the cancel button
   * ("direct"), or merely on the service's front door, leaving the user to
   * follow `cancelGuide` from there ("entry").
   *
   * The app calls these links a one-second direct route to cancellation. For
   * the entry ones that claim is false, so the UI has to say which it is
   * rather than promising the same thing for every service.
   */
  cancelUrlKind: "direct" | "entry";
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
    directCancelUrl: "https://apps.apple.com/account/subscriptions",
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

export const POPULAR_SERVICES: ServicePreset[] = [
  {
    id: "netflix",
    name: "Netflix Korea",
    nameKo: "넷플릭스",
    category: "ott",
    defaultAmount: 17000,
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
    defaultAmount: 13900,
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
    defaultAmount: 13900,
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
    defaultAmount: 7900,
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
    defaultAmount: 14900,
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
    defaultAmount: 13900,
    currency: "KRW",
    cancelUrl: "https://www.disneyplus.com/account/cancel-subscription",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 디즈니플러스 계정 설정 접속\n2. [멤버십] 섹션에서 구독 중인 플랜 선택\n3. 하단의 [멤버십 취소] 클릭\n4. 취소 사유 선택 후 [취소 완료] 클릭",
    iconEmoji: "✨",
  },
  {
    id: "apple-tv",
    name: "Apple TV+",
    nameKo: "애플 TV+ (Apple TV+)",
    category: "ott",
    defaultAmount: 6500,
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
    defaultAmount: 5.99,
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
    defaultAmount: 9900,
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
    defaultAmount: 10900,
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
    defaultAmount: 10900,
    currency: "KRW",
    cancelUrl: "https://member.melon.com/pay/charge/payCancel.htm",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 멜론 로그인 후 [내 정보] 진입\n2. [이용권 해지신청] 메뉴 클릭\n3. 비밀번호 재확인\n4. [혜택 포기하고 해지] 버튼 클릭",
    iconEmoji: "🍈",
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
    id: "naver-mybox",
    name: "Naver MYBOX",
    nameKo: "네이버 MYBOX",
    category: "cloud",
    defaultAmount: 1650,
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
    defaultAmount: 8500,
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
    defaultAmount: 10000,
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
    defaultAmount: 4900,
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
    defaultAmount: 0.99,
    currency: "USD",
    cancelUrl: "https://apps.apple.com/account/subscriptions",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 아이폰 설정 > 상단 내 이름 클릭\n2. [iCloud] - [계정 저장 공간 관리] 선택\n3. [저장 공간 요금제 변경] 클릭\n4. [다운그레이드 옵션]에서 무료 요금제(5GB) 선택 후 완료",
    iconEmoji: "☁️",
  },
  {
    id: "google-one",
    name: "Google One",
    nameKo: "구글 원",
    category: "cloud",
    defaultAmount: 2400,
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
    defaultAmount: 29000,
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
    defaultAmount: 10,
    currency: "USD",
    cancelUrl: "https://www.notion.so/my-account",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. 노션 좌측 사이드바에서 [설정과 멤버] 클릭\n2. [청구] 메뉴 탭으로 이동\n3. 요금제 정보에서 [플랜 변경] 클릭\n4. [다운그레이드] 메뉴를 통해 무료(Free) 플랜으로 변경",
    iconEmoji: "📝",
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    nameKo: "챗GPT 플러스",
    category: "ai",
    defaultAmount: 20,
    currency: "USD",
    cancelUrl: "https://chat.openai.com/",
    cancelUrlKind: "entry",
    cancelGuide:
      "1. 챗GPT 웹사이트 좌측 하단 프로필 클릭\n2. [My plan] 클릭\n3. [Manage my subscription] 클릭\n4. [Cancel plan] 버튼 클릭하여 해지 완료",
    iconEmoji: "🤖",
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    nameKo: "클로드 프로 (Claude Pro)",
    category: "ai",
    defaultAmount: 20,
    currency: "USD",
    cancelUrl: "https://claude.ai/settings/billing",
    cancelUrlKind: "direct",
    cancelGuide:
      "1. claude.ai 접속 후 좌측 하단 프로필/계정 클릭\n2. [Settings] > [Billing] 메뉴 선택\n3. [Cancel Plan] 또는 구독 취소 클릭하여 완료",
    iconEmoji: "🧠",
  },
  {
    id: "adobe-cc",
    name: "Adobe Creative Cloud",
    nameKo: "어도비",
    category: "other",
    defaultAmount: 30800,
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
    defaultAmount: 8900,
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
    defaultAmount: 9900,
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
    defaultAmount: 9900,
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
    defaultAmount: 0,
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
    defaultAmount: 0,
    currency: "KRW",
    cancelUrl: "https://apps.apple.com/account/subscriptions",
    cancelUrlKind: "direct",
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
}> = [
  {
    name: "넷플릭스",
    amount: 17000,
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
  const preset = POPULAR_SERVICES.find((service) => service.cancelUrl === cancelUrl);
  return preset?.cancelUrlKind ?? "unknown";
}
