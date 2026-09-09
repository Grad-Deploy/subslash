export type SubscriptionCategory =
  "ott" | "music" | "cloud" | "news" | "fitness" | "shopping" | "ai" | "other";

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
  createdAt: string;
  killedAt?: string;

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

export type SubscriptionFormData = Omit<Subscription, "id" | "status" | "createdAt" | "killedAt">;

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
  emailProvider?: "google" | "naver";
  sourceSnippet?: string;
  confidence: "high" | "medium";
  selected: boolean;
  receiptDate?: string;
  daysAgo?: number;
  statusReason?: string;
  isWithin30Days?: boolean;
  isCanceled?: boolean;
  cancellationDate?: string;
  cancellationSnippet?: string;
}
