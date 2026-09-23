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
  | "lastPriceCheckedAt"
  | "killVerifiedAt"
  | "chargedAfterKillAt"
  | "chargedAfterKillAmount"
  | "observedAmount"
  | "observedAmountAt"
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
  daysAgo?: number;
  statusReason?: string;
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
