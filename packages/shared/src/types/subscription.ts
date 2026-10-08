export type SubscriptionCategory = "ott" | "music" | "cloud" | "shopping" | "ai" | "other";

export type SubscriptionStatus = "active" | "killed";
export type RiskLevel = "green" | "yellow" | "red";
export type Currency = "KRW" | "USD";
export type BillingCycle = "monthly" | "yearly";

export type AccountProvider = "google" | "kakao" | "naver" | "apple" | "email";

export interface LinkedAccount {
  id: string;
  provider: AccountProvider;
  name: string;
  emailOrId: string;
  color?: string;
  createdAt: string;
}

export type PaymentMethod =
  "credit_card" | "kakaopay" | "naverpay" | "apple_iap" | "google_play" | "telecom" | "other";

/** 결제 메일 한 통이 보여 주는 결제. `date`는 메일을 받은 날(`YYYY-MM-DD`), `amount`는 구독 통화의 청구액. */
export interface ChargeRecord {
  date: string;
  amount: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number;
  billingCycle: BillingCycle;
  /**
   * Which month a yearly plan is charged in (1-12). Meaningless for monthly
   * plans, and absent on yearly subscriptions registered before the field
   * existed — code that needs a date must handle "not known yet".
   */
  billingMonth?: number;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  cancelUrl?: string;
  cancelGuide?: string;
  iconUrl?: string;
  /**
   * 목록에 없는 서비스를 직접 등록할 때 고른 아이콘 타일 색. 정해진 색 이름(`gray`·`red` 등,
   * apps/web/lib/custom-icon.ts) 중 하나다. 알려진 서비스는 실제 브랜드 마크를 쓰므로 없다.
   * 없으면 중립 회색 타일로 그린다.
   */
  iconColor?: string;
  /**
   * 요금제가 여럿인 서비스에서 고른 요금제(ServicePlan.id). 가격 확인이 이 요금제의 요금과
   * 비교한다. 요금제를 고르지 않았거나 요금제가 없는 서비스면 없다.
   */
  planId?: string;
  /** 고른 요금제 이름. 서비스 목록이 바뀌어도 남도록 함께 저장한다. */
  planName?: string;
  /**
   * 요금 외에 결제할 때 따로 붙는 세금의 비율(%). 해외 서비스 중에는 요금표 가격에 세금이
   * 빠져 있어, 한국에서 결제하면 부가세 10%가 더해져 청구되는 곳이 있다. 이때 `amount`는
   * 요금표 가격이고 카드에 찍히는 금액은 `getBilledAmount`로 계산한다. 없으면 `amount`가 곧
   * 청구액이다(세금 포함이거나 붙지 않음).
   */
  taxRate?: number;
  /**
   * 무료 체험이 끝나 유료로 바뀌는 날(`YYYY-MM-DD`). 없으면 체험 중이 아니라는 뜻이 아니라,
   * **모른다**는 뜻이다 — 앱은 추측해서 채우지 않는다.
   *
   * 이 날이 오기 전까지는 카드에서 나가는 돈이 없다. 그래서 지출 합계와 결제 캘린더는 체험 중인
   * 구독을 빼고 센다. 넣으면 내지도 않은 돈을 이번 달 지출로 보여주게 된다.
   */
  trialEndsAt?: string;
  createdAt: string;
  killedAt?: string;
  /**
   * 해지한 구독을 '구독 관리 › 해지 완료' 목록에서 숨긴 시각(앱). 목록에서만 빠지고 절약 현황에는
   * 그대로 남는다 — 목록을 비우려고 지우면 지킨 돈까지 사라졌다. 다시 보이면 지운다. 해지한 구독에만 쓴다.
   */
  hiddenAt?: string;
  /**
   * 해지로 기록한 뒤에 결제 메일이 온 사실. 결제가 멈추지 않았다는 **증거**다.
   *
   * `killVerifiedAt`(사용자가 "안 나갔다"고 답한 것)과 다르다. 그쪽은 기억이고 이쪽은 영수증이다.
   * Gmail 가져오기가 해지한 서비스의 결제 메일을 찾으면 적고, 다시 해지를 확인했거나 구독을
   * 되살리면 지운다. 메일 날짜(`YYYY.MM.DD`)와 그 메일에 적힌 금액(구독 통화)이다.
   */
  chargedAfterKillAt?: string;
  chargedAfterKillAmount?: number;
  /**
   * 결제 메일에서 읽은 마지막 결제액이 등록된 청구액(`getBilledAmount`)과 달랐던 사실.
   *
   * `lastPriceCheckedAt`(요금 확인)과 다르다. 그쪽은 "오래돼서 확인해 달라"는 **추측**이고,
   * 이쪽은 "이번엔 이만큼 빠져나갔다"는 **관측**이다. 앱은 서비스 요금표를 조회하지 않으므로
   * "요금이 올랐다"고 단정하지 않고, 두 숫자를 나란히 보여주고 사용자가 판단하게 한다.
   *
   * 금액은 영수증에 적힌 값(구독 통화, 세금 포함된 청구액)이고 날짜는 메일 날짜(`YYYY.MM.DD`)다.
   * 요금을 확인해 주거나 금액을 고치면 지운다.
   */
  observedAmount?: number;
  observedAmountAt?: string;
  /**
   * 구독 중인 서비스의 가장 최근 메일이 해지·취소 알림이었던 사실(메일 날짜 `YYYY.MM.DD`).
   *
   * 해지했다는 **증거는 아니다** — 해지 알림은 제목의 낱말(해지·취소·환불·만료·종료·cancel)로 가려서
   * 요금제 변경·환불·체험 종료 안내도 걸린다. 그래서 해지로 기록하지 않고 행동 큐에서 묻는다
   * (`cancel-notice`). 해지로 기록하거나 되살리면 지우고, "아직 구독 중"이라고 답하면 그 메일 날짜를
   * `cancelNoticeDismissedAt`에 남겨 같은 메일을 다시 가져와도 묻지 않는다.
   */
  cancelNoticeAt?: string;
  cancelNoticeDismissedAt?: string;

  /**
   * 체크인에서 "무료 요금제로도 충분했을까요?"에 한 답(utils/valueMetric의 `FreeTierAnswer`). 무료
   * 요금제가 있는 AI·업무 도구(`asksFreeTier`)만 묻는다. 체크인 기록이 아니라 구독에 두는 까닭은, 폰
   * 기록으로 적는 자동 체크인과 한꺼번에 체크인에서도 같은 판단을 쓰기 위해서다. 체크인 화면은 이 값을
   * 미리 골라 두고, 다시 답하면 바꾼다.
   */
  freeTierAnswer?: "needed" | "enough" | "unsure";

  /**
   * 멤버십 혜택을 적을 때 기댈 근거: Gmail 가져오기에서 찾은 최근 30일 주문 메일 수
   * (utils/orderEvidence). 가져온 메일 안에서 센 것이라 **최소**이고, 금액으로 바꾸지 않는다 — 주문마다
   * 받은 혜택(배송비·할인)은 사용자가 안다. 다시 가져오면 바뀐다.
   */
  orderEvidence?: { count: number; since: string; checkedAt: string };

  /**
   * Gmail 가져오기에서 찾은 이 서비스의 결제 메일들(utils/chargeHistory). 메일을 받은 날과 그 메일에 적힌
   * 금액(구독 통화, 카드에 청구된 값)이다. 영수증이 등록한 달보다 앞선 달을 채울 때 이것만 쓴다 — 메일이
   * 없는 달은 구독 중이었는지 모른다. 가져오기가 찾은 범위(약 1년) 안의 것이라 첫 줄이 처음 구독한 날이
   * 아니다. 다시 가져오면 날짜별로 합친다.
   */
  chargeHistory?: ChargeRecord[];

  /**
   * 사용자가 "이 금액이 지금도 맞다"고 마지막으로 확인해 준 시각.
   *
   * 없으면 등록 이후 한 번도 확인한 적이 없다는 뜻이다. 앱은 이 값을
   * 추측해서 채우지 않는다 — 확인 버튼을 누른 순간에만 기록된다.
   */
  lastPriceCheckedAt?: string;

  /**
   * 해지 뒤 첫 결제일에 결제가 없었다고 사용자가 확인해 준 시각.
   *
   * 없으면 해지가 실제로 결제를 멈췄는지 아직 모른다는 뜻이다. 앱은 이 값을
   * 추측해서 채우지 않는다 — 사용자가 "결제 안 됐어요"를 누른 순간에만
   * 기록되고, 다시 해지하거나 되살리면 지워진다.
   */
  killVerifiedAt?: string;

  /**
   * 해지한 구독을 다시 살펴보라고 알려 달라고 사용자가 고른 날(`YYYY-MM-DD`).
   *
   * 스포츠 시즌·새 시즌 공개처럼 다시 쓸 때가 정해진 구독을 부담 없이 끊게 하려는 것이다. 앱이
   * 날짜를 정하거나 추천하지 않는다 — 사용자가 고른 날에만 행동 큐와 앱 알림에 올린다. 해지한
   * 구독에만 쓰고, 되살리면 지운다.
   */
  resubscribeRemindOn?: string;

  /**
   * 해지를 마쳤다는 근거로 사용자가 적어 둔 것. 해지 확인 메일의 제목·접수 번호·상담 내용 같은
   * 글이다. 해지 뒤에 결제되면(`chargedAfterKillAt`) 환불을 요청할 때 그대로 인용한다.
   *
   * 앱이 해지를 확인한 것이 아니라 사용자의 기록이다. 해지 한 번에 딸린 기록이라 되살리면 지운다.
   */
  killEvidence?: {
    /** 해지 확인 번호·메일 제목 등 서비스가 준 것. */
    reference?: string;
    /** 그 밖의 메모(상담원 이름, 해지한 경로 등). */
    memo?: string;
    /** 이 기록을 적은 시각(ISO 8601). */
    recordedAt: string;
  };

  /**
   * How many people split this plan, the payer included. Absent or 1 means the
   * user carries the whole bill.
   */
  sharingCount?: number;
  /**
   * What the user actually pays, in this subscription's currency, when the
   * split is not even. Absent means `amount / sharingCount`.
   */
  myShareAmount?: number;

  // Linked account & payment method fields
  linkedAccountId?: string;
  linkedAccountName?: string;
  paymentMethod?: PaymentMethod;
  accountMemo?: string;
}

/**
 * 사용자가 폼에서 적는 칸만. 앱이 스스로 적는 사실(해지 확인, 영수증 관측 등)은 뺀다 — 폼이
 * 건드릴 수 있는 값으로 두면 실수로 덮어쓸 수 있다.
 */
export type SubscriptionFormData = Omit<
  Subscription,
  | "id"
  | "status"
  | "createdAt"
  | "killedAt"
  | "hiddenAt"
  | "lastPriceCheckedAt"
  | "killVerifiedAt"
  | "resubscribeRemindOn"
  | "killEvidence"
  | "chargedAfterKillAt"
  | "chargedAfterKillAmount"
  | "observedAmount"
  | "observedAmountAt"
  | "cancelNoticeAt"
  | "cancelNoticeDismissedAt"
  | "freeTierAnswer"
  | "orderEvidence"
  | "chargeHistory"
>;

export type EmailType = "payment" | "cancellation" | "refund" | "onetime";

export interface EmailReceipt {
  id: string;
  sender: string;
  senderEmail: string;
  recipientEmail?: string;
  subject: string;
  receivedDate: string; // YYYY-MM-DD
  daysAgo: number;
  amount: number;
  currency: Currency;
  serviceName: string;
  matchedPresetId?: string;
  billingDay: number;
  snippet: string;
  isWithin30Days: boolean;
  cancelUrl?: string;
  cancelGuide?: string;
  category: SubscriptionCategory;
  paymentMethod?: PaymentMethod;
  provider?: "google" | "naver";
  emailType?: EmailType;
}

export interface DiscoveredSubscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  billingDay: number;
  billingCycle: BillingCycle;
  /** Set only for yearly plans, when the receipt said which month. */
  billingMonth?: number;
  category: SubscriptionCategory;
  cancelUrl?: string;
  cancelGuide?: string;
  paymentMethod?: PaymentMethod;
  linkedAccountId?: string;
  linkedAccountName?: string;
  recipientEmail?: string;
  source: "gmail" | "sms" | "manual";
  /** 알려진 서비스 목록(POPULAR_SERVICES)과 맞았으면 그 id. 이름만 추측한 후보에는 없다. */
  presetId?: string;
  /** 결제 메일의 보낸 사람. 메일에서 찾은 후보에만 있다. */
  sender?: string;
  emailProvider?: "google" | "naver";
  sourceSnippet?: string;
  confidence: "high" | "medium";
  selected: boolean;
  receiptDate?: string;
  /** 같은 서비스의 결제 메일들(가장 최근 것 포함, 이른 순). 해지 알림은 넣지 않는다. */
  chargeHistory?: ChargeRecord[];
  daysAgo?: number;
  /** 왜 이 후보가 이 상태인지. 문장은 화면이 언어에 맞게 만든다. */
  statusReason?: DiscoveryStatus;
  /**
   * 마지막 결제 메일이 아직 최근인지. 이름과 달리 기준은 결제 주기마다 다르다
   * (`STALE_AFTER_DAYS` — 월간 35일·연간 370일). 연간 구독의 영수증은 1년에 한 번뿐이라
   * 30일로 재면 늘 오래된 것이 된다.
   */
  isWithin30Days?: boolean;
  isCanceled?: boolean;
  cancellationDate?: string;
  cancellationSnippet?: string;
}

/**
 * 불러오기 후보의 상태 이유.
 * - `sms-canceled`·`sms-paid`: 붙여 넣은 문자에서 해지 알림 / 결제 승인을 봤다
 * - `mail-canceled`: 가장 최근 메일이 해지·취소 알림이다
 * - `stale`: 마지막 결제 메일이 오래돼 지금도 결제 중인지 모른다
 * - `recent`: 며칠 전 결제 메일을 확인했다
 * - `killed-charged`: 해지로 기록한 서비스인데 결제 메일이 왔다
 * - `unsure`: 결제 메일에서 찾았지만 어떤 서비스인지 확실하지 않다
 */
export type DiscoveryStatus =
  | { type: "sms-canceled" }
  | { type: "sms-paid" }
  | { type: "mail-canceled" }
  | { type: "stale"; daysAgo: number }
  | { type: "recent"; daysAgo: number }
  | { type: "killed-charged" }
  | { type: "unsure" };
