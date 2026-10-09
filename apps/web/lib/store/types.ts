import type {
  CheckInResponse,
  ChargeRecord,
  Currency,
  DashboardStats,
  FreeTierAnswer,
  LinkedAccount,
  OrderCount,
  Subscription,
  SubscriptionFormData,
  UsageLog,
  ValueMetric,
} from "@subslash/shared";
import type { ExchangeRateSetting, ExchangeRateSource } from "../exchange-rate";
import type { DemoSession } from "./demo";

/**
 * 계정 기록 자동 동기화에서 이 기기가 기억하는 것(lib/account-sync, hooks/useAccountSync). 기기마다
 * 다르므로 백업·계정 저장에는 넣지 않는다.
 */
export interface AccountSyncState {
  /** 이 기기가 맞춰 온 계정. 다른 계정으로 로그인하면 처음부터 다시 맞춘다. */
  accountId: string | null;
  /** 이 기기에서 자동 동기화를 쓰는지. 로그인하면 켜져 있고, 사용자가 끄면 false다. */
  enabled: boolean;
  /** 마지막으로 서버와 맞춘 판(계정 기록의 savedAt). */
  baseSavedAt: string | null;
  /** 그때 이 기기 기록의 지문. 지금 지문과 다르면 이 기기에서 바뀐 것이다. */
  baseHash: string | null;
  lastSyncedAt: string | null;
  /** 사용자가 끄지 않았는데 멈춘 이유. 다른 기기에서 계정의 기록을 지웠으면 다시 올리지 않는다. */
  stoppedReason: "deleted-elsewhere" | null;
}

export const DEFAULT_ACCOUNT_SYNC: AccountSyncState = {
  accountId: null,
  enabled: true,
  baseSavedAt: null,
  baseHash: null,
  lastSyncedAt: null,
  stoppedReason: null,
};

export interface SubSlashStore {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  accounts: LinkedAccount[];
  exchangeRate: ExchangeRateSetting;
  accountSync: AccountSyncState;
  /**
   * 지금 화면의 기록이 누구의 것인지. 비로그인이면 null, 로그인했으면 그 계정 ID다. 로그인·로그아웃할
   * 때 기록을 주인별 칸으로 바꿔 끼운다(lib/records-owner).
   */
  recordsOwner: string | null;
  /** 샘플 체험 중이면 그 상태. 저장소에 저장하지 않는다 — 새로고침하면 체험이 끝난다. */
  demo: DemoSession | null;
  /** 샘플로 체험을 시작한다. 이미 체험 중이면 그대로 둔다. */
  startDemo: () => void;
  /** 체험을 끝내고 실제 기록으로 돌아간다. */
  endDemo: () => void;

  // Subscription actions
  addSubscription: (data: SubscriptionFormData) => Subscription;
  addBatchSubscriptions: (
    dataList: SubscriptionFormData[],
    options?: { clearPrevious?: boolean },
  ) => Subscription[];
  clearSubscriptions: () => void;
  clearAllData: () => void;
  /** 백업에서 복원한다. 병합하지 않고 통째로 바꾼다. 기기마다 다른 설정은 그대로 둔다. */
  replaceAllData: (data: BackupData) => void;
  updateSubscription: (id: string, data: Partial<SubscriptionFormData>) => void;
  /**
   * 사용자가 요금을 확인해 준 사실을 기록한다. `newAmount`를 주면 금액도
   * 함께 바꾼다. 확인 시각은 이 액션을 통해서만 생기므로, 앱이 임의로
   * "확인됨"을 만들어내지 않는다.
   */
  confirmSubscriptionPrice: (id: string, newAmount?: number) => void;
  killSubscription: (id: string) => void;
  reviveSubscription: (id: string) => void;
  /**
   * 해지 뒤 첫 결제일에 결제가 없었다고 사용자가 확인해 준 사실을 기록한다.
   * 해지한 구독에만 기록되고, 확인 시각은 이 액션을 통해서만 생긴다.
   */
  confirmKillVerified: (id: string) => void;
  /**
   * 해지한 구독을 다시 살펴볼 날(`YYYY-MM-DD`)을 적거나(null이면) 지운다. 해지한 구독에만 적힌다.
   */
  setResubscribeReminder: (id: string, date: string | null) => void;
  /** 해지 근거(확인 번호·메모)를 적거나, 둘 다 비었으면 지운다. 해지한 구독에만 적힌다. */
  setKillEvidence: (id: string, evidence: { reference?: string; memo?: string }) => void;
  /**
   * 해지로 기록한 구독인데 그 뒤에 결제 메일이 온 사실을 적는다. Gmail 가져오기만 부른다.
   * 사용자의 기억이 아니라 영수증이므로, 이미 '확인'해 둔 구독에도 적는다.
   */
  markChargedAfterKill: (id: string, receiptDate: string, amount: number) => void;
  /**
   * 결제 메일의 금액이 등록된 청구액과 달랐던 사실을 적는다. Gmail 가져오기만 부른다.
   * 요금을 확인해 주거나 금액을 고치면 지워진다.
   */
  markObservedAmount: (id: string, receiptDate: string, amount: number) => void;
  /**
   * Gmail 가져오기에서 센 멤버십 주문 메일 수를 그 멤버십 구독에 적는다(utils/orderEvidence). 혜택 금액을
   * 적을 때 옆에 보이는 근거일 뿐 체크인이 아니다. 체험 중에는 적지 않는다(화면의 목록이 샘플이다).
   */
  recordOrderEvidence: (counts: OrderCount[]) => void;
  /**
   * Gmail 가져오기에서 찾은 결제 메일들을 같은 서비스(이름·통화)의 구독에 날짜별로 합쳐 적는다
   * (utils/chargeHistory). 이미 등록한 구독에도 적는다 — 영수증이 등록하기 전 달을 채우는 근거다.
   * 맞는 구독이 없는 후보는 버린다. 체험 중에는 적지 않는다(화면의 목록이 샘플이다).
   */
  recordChargeHistory: (
    found: { name: string; currency: Currency; chargeHistory?: ChargeRecord[] }[],
  ) => void;
  /**
   * Gmail 가져오기에서 찾은 해지·취소 알림을 구독 중인 같은 서비스의 구독에 적는다(utils/cancelNotice).
   * 해지로 기록하지 않는다 — 행동 큐가 묻는다. 체험 중에는 적지 않는다(화면의 목록이 샘플이다).
   */
  recordCancelNotices: (
    found: { name: string; currency: Currency; isCanceled?: boolean; receiptDate?: string }[],
  ) => void;
  /** 해지 알림에 "아직 구독 중"이라고 답했다. 같은 메일로 다시 묻지 않는다. */
  dismissCancelNotice: (id: string) => void;
  /** 체크인의 "무료 요금제로도 충분했을까요?" 답을 적는다(무료 요금제가 있는 AI·업무 도구). */
  setFreeTierAnswer: (id: string, answer: FreeTierAnswer) => void;
  deleteSubscription: (id: string) => void;
  /** 여러 구독을 한 번에 지운다(체크인 기록도). 절약 현황에서도 빠진다. */
  deleteSubscriptions: (ids: string[]) => void;
  /** 해지한 구독을 해지 목록에서 숨긴다. 절약 현황에는 남는다. */
  hideSubscriptions: (ids: string[]) => void;
  unhideSubscriptions: (ids: string[]) => void;
  /**
   * 체크인을 적는다. `source: "phone"`은 폰 사용 기록으로 자동으로 적는 것이고(useAutoCheckIn만
   * 부른다), `replaceLogId`를 주면 새 줄을 더하지 않고 그 줄을 바꾼다 — 같은 달의 자동 체크인을
   * 날마다 새로 쌓지 않으려는 것이다.
   */
  checkIn: (
    subscriptionId: string,
    usageCount: number,
    options?: {
      source?: "phone";
      replaceLogId?: string;
      metric?: ValueMetric;
      /** PC의 Claude Code·Codex 기록에서 본 토큰 근거(/pc-usage에서 체크인할 때). */
      tokens?: { count: number; apiUsd: number | null };
    },
  ) => CheckInResponse;
  getActiveSubscriptions: () => Subscription[];
  getKilledSubscriptions: () => Subscription[];
  getDashboardStats: () => DashboardStats;
  getAtRiskSubscriptions: () => Subscription[];

  setAccountSync: (next: Partial<AccountSyncState>) => void;

  // Exchange rate actions
  setExchangeRate: (rate: number, source: Exclude<ExchangeRateSource, "default">) => void;
  resetExchangeRate: () => void;
  /** The rate to convert with, falling back to the built-in default. */
  getExchangeRate: () => number;

  // Linked Account actions
  addAccount: (account: Omit<LinkedAccount, "id" | "createdAt">) => LinkedAccount;
  updateAccount: (id: string, data: Partial<Omit<LinkedAccount, "id" | "createdAt">>) => void;
  deleteAccount: (id: string) => void;
  getAccountById: (id: string) => LinkedAccount | undefined;
  getSubscriptionsByAccount: (accountId: string) => Subscription[];
}

export type PersistedState = Pick<
  SubSlashStore,
  "subscriptions" | "usageLogs" | "accounts" | "exchangeRate" | "accountSync" | "recordsOwner"
>;

/** 백업 파일에 담는 데이터. 기기마다 다른 것(계정 동기화 상태 등)은 뺀다. */
export type BackupData = Pick<
  SubSlashStore,
  "subscriptions" | "usageLogs" | "accounts" | "exchangeRate"
>;
