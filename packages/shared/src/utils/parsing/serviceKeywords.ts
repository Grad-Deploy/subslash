import type { PaymentMethod } from "../../types";

// Known keyword mapping for popular services
export const SERVICE_KEYWORDS: {
  keywords: string[];
  presetId: string;
  defaultPaymentMethod?: PaymentMethod;
  /**
   * 이 서비스가 영수증을 보내는 도메인. 하위 도메인(email.openai.com)도 같은 서비스로 본다.
   *
   * 보낸 사람이 여기 맞으면 제목·본문보다 먼저 믿는다. 반대로 여러 서비스가 함께 쓰는
   * 도메인(google.com·apple.com·naver.com)은 어느 서비스인지 가리지 못하므로 적지 않고,
   * 확인하지 못한 도메인도 적지 않는다 — 틀린 도메인을 적으면 남의 메일을 이 서비스의
   * 영수증으로 읽는다.
   */
  senderDomains?: string[];
}[] = [
  {
    keywords: ["넷플릭스", "netflix", "넷플릭스코리아"],
    presetId: "netflix",
    senderDomains: ["netflix.com"],
  },
  {
    keywords: ["유튜브", "youtube", "youtube premium", "유튜브 프리미엄", "구글페이먼트(유튜브)"],
    presetId: "youtube-premium",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: ["쿠팡", "와우", "coupang", "와우멤버십", "쿠팡플레이", "coupang play"],
    presetId: "coupang-wow",
    senderDomains: ["coupang.com"],
  },
  { keywords: ["티빙", "tving"], presetId: "tving", senderDomains: ["tving.com"] },
  {
    keywords: ["웨이브", "wavve", "콘텐츠웨이브"],
    presetId: "wavve",
    senderDomains: ["wavve.com"],
  },
  { keywords: ["왓챠", "watcha", "왓챠플레이"], presetId: "watcha", senderDomains: ["watcha.com"] },
  {
    keywords: ["디즈니", "disney", "디즈니플러스", "disney+", "디즈니+"],
    presetId: "disney-plus",
    senderDomains: ["disneyplus.com"],
  },
  {
    keywords: ["애플tv", "애플티비", "apple tv", "apple tv+", "애플 tv", "appletv"],
    presetId: "apple-tv",
    defaultPaymentMethod: "apple_iap",
  },
  {
    keywords: ["프라임 비디오", "아마존 프라임", "prime video", "amazon prime", "primevideo"],
    presetId: "prime-video",
    defaultPaymentMethod: "credit_card",
  },
  {
    keywords: ["라프텔", "laftel", "애니메이션 라프텔"],
    presetId: "laftel",
    senderDomains: ["laftel.net"],
  },
  { keywords: ["스포티파이", "spotify"], presetId: "spotify", senderDomains: ["spotify.com"] },
  { keywords: ["멜론", "melon", "로엔"], presetId: "melon" },
  {
    keywords: ["네이버플러스", "네이버 멤버십", "네이버페이 멤버십"],
    presetId: "naver-plus",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: [
      "naver mybox",
      "마이박스",
      "mybox",
      "네이버 클라우드",
      "네이버클라우드",
      "naver cloud",
    ],
    presetId: "naver-mybox",
    defaultPaymentMethod: "naverpay",
  },
  {
    keywords: ["카카오 이모티콘", "이모티콘 플러스", "톡서랍"],
    presetId: "kakao-emoticon",
    defaultPaymentMethod: "kakaopay",
  },
  {
    // "apple.com"을 넣어 두었더니 애플이 보낸 영수증이 모두 아이클라우드가 됐다(보낸 사람
    // 주소에 그 글자가 들어 있다). 애플 결제라는 사실만으로는 어느 앱인지 알 수 없다.
    keywords: ["아이클라우드", "icloud"],
    presetId: "apple-icloud",
    defaultPaymentMethod: "apple_iap",
  },
  {
    keywords: ["굿노트", "goodnotes", "good notes"],
    presetId: "goodnotes",
    senderDomains: ["goodnotes.com"],
  },
  {
    keywords: ["구글원", "google one", "google storage"],
    presetId: "google-one",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: [
      "google ai pro",
      "google ai",
      "구글 ai 프로",
      "구글 ai",
      "구글ai",
      "gemini advanced",
      "제미나이",
      "google one ai",
      "ai pro",
      "google ai premium",
    ],
    presetId: "google-ai-pro",
    defaultPaymentMethod: "google_play",
  },
  {
    keywords: ["notion", "노션"],
    presetId: "notion",
    senderDomains: ["notion.so", "makenotion.com"],
  },
  {
    keywords: ["chatgpt", "openai", "챗gpt"],
    presetId: "chatgpt-plus",
    senderDomains: ["openai.com"],
  },
  {
    keywords: [
      "claude",
      "클로드",
      "anthropic",
      "앤트로픽",
      "앤쓰로픽",
      "claude pro",
      "클로드 프로",
      "claude ai",
      "claude.ai",
    ],
    presetId: "claude-pro",
    senderDomains: ["anthropic.com"],
    defaultPaymentMethod: "credit_card",
  },
  { keywords: ["어도비", "adobe"], presetId: "adobe-cc", senderDomains: ["adobe.com"] },
  {
    keywords: ["마이크로소프트", "microsoft", "ms 365", "m365"],
    presetId: "microsoft-365",
    senderDomains: ["microsoft.com"],
  },
  { keywords: ["밀리", "밀리의 서재", "millie"], presetId: "millie" },
  { keywords: ["리디", "리디셀렉트", "ridi"], presetId: "ridi-select" },
];

/**
 * 영수증을 보내는 것으로 확인된 서비스의 발신 도메인(`senderDomains`)을 모은 것. Gmail 가져오기가
 * 이 도메인의 메일을 따로 찾는 데 쓴다 — 쇼핑 주문이 많은 메일함에서도 1년에 한 번 오는 연간 구독
 * 영수증이 검색 상한 밖으로 밀리지 않게 하려는 것이다. 여러 서비스가 함께 쓰는 도메인(google.com·
 * apple.com)은 표에 없고, 그쪽은 플랫폼 영수증 검색이 맡는다.
 */
export const KNOWN_RECEIPT_SENDER_DOMAINS: readonly string[] = [
  ...new Set(SERVICE_KEYWORDS.flatMap((item) => item.senderDomains ?? [])),
].sort();

/**
 * Wording that marks a receipt as a yearly plan.
 *
 * Deliberately narrow: reading a monthly plan as yearly divides the reported
 * cost by twelve, which is just as wrong in the other direction.
 */
export const YEARLY_HINT =
  /연간|연\s*결제|1년|12개월|년\s*이용권|연회비|annual|yearly|per\s*year|\/\s*yr/i;

/**
 * Every preset the keyword table points at.
 *
 * Exported so a test can prove each one resolves: a typo here fails silently —
 * the lookup returns undefined, the receipt keeps scanning other keywords, and
 * the subscription is imported with no cancel URL, no category and a fallback
 * name, without anything reporting an error.
 */
export const SERVICE_KEYWORD_PRESET_IDS = SERVICE_KEYWORDS.map((item) => item.presetId);
