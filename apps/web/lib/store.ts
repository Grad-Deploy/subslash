import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { recordStorage } from "./mirrored-storage";
import type {
  Subscription,
  UsageLog,
  SubscriptionFormData,
  CheckInResponse,
  DashboardStats,
  LinkedAccount,
} from "@subslash/shared";
import {
  calculateCostPerUse,
  getRiskLevel,
  formatShockMessage,
  getMyMonthlyShareAmount,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
  sumMyAnnualKRW,
  DEFAULT_EXCHANGE_RATE,
  DEMO_SUBSCRIPTIONS,
  currentCancelUrl,
  currentCategory,
} from "@subslash/shared";
import {
  DEFAULT_EXCHANGE_RATE_SETTING,
  isValidExchangeRate,
  type ExchangeRateSetting,
  type ExchangeRateSource,
} from "./exchange-rate";

/**
 * Accounts that early builds seeded into every new browser.
 *
 * The addresses were invented, but the app presents a linked account as "log in
 * with this one and the cancel button appears", and even offers to copy the ID
 * to the clipboard. Handing someone `myaccount@gmail.com` for that walks them
 * into a dead end, so a new store now starts with no accounts at all.
 */
const SEEDED_DEMO_ACCOUNTS: ReadonlyArray<Pick<LinkedAccount, "id" | "name" | "emailOrId">> = [
  { id: "acc-google-1", name: "Google 개인 계정", emailOrId: "myaccount@gmail.com" },
  { id: "acc-naver-1", name: "네이버 개인 계정", emailOrId: "myaccount@naver.com" },
  { id: "acc-kakao-1", name: "카카오 로그인 계정", emailOrId: "kakao_user@kakao.com" },
  { id: "acc-apple-1", name: "Apple ID (App Store)", emailOrId: "apple_user@icloud.com" },
];

type PersistedState = Pick<
  SubSlashStore,
  | "subscriptions"
  | "usageLogs"
  | "accounts"
  | "notify"
  | "exchangeRate"
  | "accountSync"
  | "recordsOwner"
>;

/**
 * 백업 파일에 담는 데이터. 알림 설정(`notify`)은 뺀다 — 거기 든 동기화
 * 토큰은 이 기기의 자격증명이라 파일로 돌아다니면 안 된다.
 */
export type BackupData = Pick<
  SubSlashStore,
  "subscriptions" | "usageLogs" | "accounts" | "exchangeRate"
>;

/**
 * Strips the seeded demo accounts out of a store that already has them, and
 * unlinks every subscription that pointed at one.
 *
 * An account whose name or address the user changed is left alone: once they
 * typed their own address into it, it stopped being invented data.
 */
export function migrateSeededAccounts(state: Partial<PersistedState>): Partial<PersistedState> {
  const accounts = state.accounts ?? [];
  const seededIds = new Set(
    accounts
      .filter((acc) =>
        SEEDED_DEMO_ACCOUNTS.some(
          (seed) =>
            seed.id === acc.id && seed.name === acc.name && seed.emailOrId === acc.emailOrId,
        ),
      )
      .map((acc) => acc.id),
  );
  if (seededIds.size === 0) return state;

  return {
    ...state,
    accounts: accounts.filter((acc) => !seededIds.has(acc.id)),
    subscriptions: (state.subscriptions ?? []).map((sub) =>
      sub.linkedAccountId && seededIds.has(sub.linkedAccountId)
        ? { ...sub, linkedAccountId: undefined, linkedAccountName: undefined }
        : sub,
    ),
  };
}

/**
 * Rewrites cancel links that still point at an address a preset has retired.
 *
 * A subscription keeps the cancel URL it was created with, so fixing a preset
 * alone would leave existing subscriptions opening the old address — Melon's
 * old one is a 404. Only exact matches of a retired preset URL change; a URL
 * the user typed stays as it is.
 */
export function migrateLegacyCancelUrls(state: Partial<PersistedState>): Partial<PersistedState> {
  if (!state.subscriptions) return state;
  return {
    ...state,
    subscriptions: state.subscriptions.map((sub) =>
      sub.cancelUrl ? { ...sub, cancelUrl: currentCancelUrl(sub.cancelUrl) } : sub,
    ),
  };
}

/**
 * Moves subscriptions saved under a category the app no longer offers.
 *
 * A subscription keeps the category it was created with, so dropping one from
 * the list alone would leave those subscriptions filtered out of every chip in
 * 내 구독, and the edit form would have nothing to select for them. They move
 * to 기타 here, on load, the same way retired cancel links are rewritten.
 */
export function migrateRetiredCategories(state: Partial<PersistedState>): Partial<PersistedState> {
  if (!state.subscriptions) return state;
  return {
    ...state,
    subscriptions: state.subscriptions.map((sub) => {
      const category = currentCategory(sub.category);
      return category === sub.category ? sub : { ...sub, category };
    }),
  };
}

/**
 * How a saved store is laid over the fresh one on load.
 *
 * Retired cancel links are rewritten here, on every load, rather than in
 * `migrate` behind a version bump — adding an old URL to a preset's
 * `legacyCancelUrls` is then all a link fix takes, with no version number to
 * remember.
 */
export function mergePersistedState(persisted: unknown, current: SubSlashStore): SubSlashStore {
  const saved = (persisted ?? {}) as Partial<PersistedState>;
  return {
    ...current,
    ...migrateRetiredCategories(migrateLegacyCancelUrls(saved)),
    recordsOwner: legacyRecordsOwner(saved),
  };
}

/**
 * 주인 칸이 생기기 전의 저장소는 로그아웃해도 계정의 기록을 그대로 두었다. 이 기기가 맞춰 온
 * 계정이 있으면 지금 기록은 그 계정의 것이다 — 비로그인 기록으로 읽으면 로그아웃한 화면에 계정의
 * 기록이 계속 보인다.
 */
function legacyRecordsOwner(saved: Partial<PersistedState>): string | null {
  if (saved.recordsOwner !== undefined) return saved.recordsOwner;
  return saved.accountSync?.accountId ?? null;
}

/**
 * Email-reminder opt-in. The token authenticates this browser's uploads to the
 * server mirror; localStorage remains the source of truth for the data itself.
 */
export interface NotifySettings {
  email: string | null;
  syncToken: string | null;
  verified: boolean;
  reminderDays: number;
  lastSyncedAt: string | null;
  /**
   * The calendar feed URL, which embeds a read-only token. Only its hash is
   * stored server-side, so this browser copy is the only way back to it; losing
   * it means rotating rather than recovering.
   */
  calendarUrl: string | null;
  /**
   * 서버가 이 브라우저의 동기화 토큰을 거절한 시각(`markNotifyRejected`). 알림 설정은 꺼진 상태로
   * 돌아가고, 화면은 사용자가 끄지 않았는데 꺼졌다는 것과 그 이유를 알린다. 다시 신청하면 지운다.
   */
  rejectedAt?: string;
}

export const DEFAULT_NOTIFY: NotifySettings = {
  email: null,
  syncToken: null,
  verified: false,
  reminderDays: 3,
  lastSyncedAt: null,
  calendarUrl: null,
};

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

// 환율 설정은 서버(계정에 저장한 기록의 검증)도 쓰므로 스토어 밖에 둔다. 이 모듈에서
// 가져다 쓰던 곳이 그대로 동작하도록 다시 내보낸다.
export { DEFAULT_EXCHANGE_RATE_SETTING, isValidExchangeRate };
export type { ExchangeRateSetting, ExchangeRateSource };

/** 샘플 체험이 스스로 끝나기까지의 시간. 새로고침하거나 '체험 끝내기'를 누르면 그 전에 끝난다. */
export const DEMO_DURATION_MS = 30 * 60 * 1000;

/**
 * 샘플 체험.
 *
 * 체험하는 동안 화면의 `subscriptions`·`usageLogs`는 샘플이고, 실제 기록은 `saved`에 보관한다.
 * 예전에는 샘플을 실제 목록에 그대로 더해서, 쓰던 구독과 섞인 채 저장소에 남았다. 이제
 * 저장소(localStorage)에는 체험 중에도 실제 기록만 저장하므로(partialize) 새로고침하면 체험이
 * 끝나고 실제 기록으로 돌아온다. 체험 중에 누른 체크인·해지도 샘플에만 남는다.
 */
export interface DemoSession {
  startedAt: string;
  saved: { subscriptions: Subscription[]; usageLogs: UsageLog[] };
}

/** 체험이 정해진 시간을 넘겼는지. 시작 시각을 읽을 수 없으면 끝난 것으로 본다. */
export function isDemoExpired(demo: DemoSession, now: Date = new Date()): boolean {
  const started = Date.parse(demo.startedAt);
  return Number.isNaN(started) || now.getTime() - started >= DEMO_DURATION_MS;
}

/**
 * 실제 기록. 체험 중이면 보관해 둔 것이다. 서버로 나가는 것(알림 미러·계정 저장)과 백업은
 * 이것을 써야 한다 — 화면의 목록을 쓰면 샘플이 실제 기록처럼 내보내진다.
 */
export function realRecords(state: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  demo: DemoSession | null;
}): { subscriptions: Subscription[]; usageLogs: UsageLog[] } {
  return state.demo
    ? state.demo.saved
    : { subscriptions: state.subscriptions, usageLogs: state.usageLogs };
}

function demoSubscriptions(now: string): Subscription[] {
  return DEMO_SUBSCRIPTIONS.map((item, index) => ({
    ...item,
    id: `demo-${index + 1}`,
    status: "active",
    createdAt: now,
  }));
}

interface SubSlashStore {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  accounts: LinkedAccount[];
  notify: NotifySettings;
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
  /**
   * 백업에서 복원한다. 병합하지 않고 통째로 바꾼다. 알림 설정은 이 기기의
   * 것을 그대로 둔다.
   */
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
   * 해지로 기록한 구독인데 그 뒤에 결제 메일이 온 사실을 적는다. Gmail 가져오기만 부른다.
   * 사용자의 기억이 아니라 영수증이므로, 이미 '확인'해 둔 구독에도 적는다.
   */
  markChargedAfterKill: (id: string, receiptDate: string, amount: number) => void;
  /**
   * 결제 메일의 금액이 등록된 청구액과 달랐던 사실을 적는다. Gmail 가져오기만 부른다.
   * 요금을 확인해 주거나 금액을 고치면 지워진다.
   */
  markObservedAmount: (id: string, receiptDate: string, amount: number) => void;
  deleteSubscription: (id: string) => void;
  checkIn: (subscriptionId: string, usageCount: number) => CheckInResponse;
  getActiveSubscriptions: () => Subscription[];
  getKilledSubscriptions: () => Subscription[];
  getDashboardStats: () => DashboardStats;
  getAtRiskSubscriptions: () => Subscription[];

  // Email reminder actions
  setNotify: (settings: Partial<NotifySettings>) => void;
  clearNotify: () => void;
  /**
   * 서버가 `syncToken`을 모른다고 답했을 때. 그 토큰이 아직 이 브라우저의 토큰일 때만 알림을
   * 꺼진 상태로 돌린다 — 응답을 기다리는 사이 다시 신청했다면 새 신청을 건드리지 않는다.
   */
  markNotifyRejected: (syncToken: string) => void;
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

/** localStorage에 저장하는 칸. 체험 중에도 실제 기록만 담는다 — 샘플은 이 탭의 메모리에만 있다. */
export function toPersistedState(state: SubSlashStore): PersistedState {
  return {
    ...realRecords(state),
    accounts: state.accounts,
    notify: state.notify,
    exchangeRate: state.exchangeRate,
    accountSync: state.accountSync,
    recordsOwner: state.recordsOwner,
  };
}

export const useStore = create<SubSlashStore>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      notify: DEFAULT_NOTIFY,
      exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
      demo: null,
      accountSync: DEFAULT_ACCOUNT_SYNC,
      recordsOwner: null,

      addSubscription: (data) => {
        const newSub: Subscription = {
          ...data,
          id: crypto.randomUUID(),
          status: "active",
          createdAt: new Date().toISOString(),
          currency: data.currency || "KRW",
          billingCycle: data.billingCycle || "monthly",
          category: data.category || "other",
        };
        // 체험 중에 등록하면 체험을 끝내고 실제 목록에 더한다. 샘플 사이에 넣으면 체험을 끝낼 때
        // 함께 사라진다.
        set((state) => {
          const real = realRecords(state);
          return {
            demo: null,
            subscriptions: [...real.subscriptions, newSub],
            usageLogs: real.usageLogs,
          };
        });
        return newSub;
      },
      addBatchSubscriptions: (dataList, options) => {
        const now = new Date().toISOString();
        const newSubs: Subscription[] = dataList.map((data) => ({
          ...data,
          id: crypto.randomUUID(),
          status: "active",
          createdAt: now,
          currency: data.currency || "KRW",
          billingCycle: data.billingCycle || "monthly",
          category: data.category || "other",
        }));
        set((state) => {
          const real = realRecords(state);
          return {
            demo: null,
            subscriptions: options?.clearPrevious ? newSubs : [...real.subscriptions, ...newSubs],
            usageLogs: options?.clearPrevious ? [] : real.usageLogs,
          };
        });
        return newSubs;
      },
      clearSubscriptions: () => {
        // 체험 중의 '전체 초기화'는 샘플을 치우는 것이다. 보관해 둔 실제 기록까지 지우지 않는다.
        if (get().demo) {
          get().endDemo();
          return;
        }
        set({ subscriptions: [], usageLogs: [] });
      },
      clearAllData: () => {
        // The reminder opt-in is deliberately preserved: it lives on the server
        // too, so silently forgetting the token here would orphan that record.
        set({ subscriptions: [], usageLogs: [], accounts: [], demo: null });
      },
      replaceAllData: (data) => {
        // 불러올 때와 같은 교정을 거친다. 옛 백업에 든 폐기된 해지 링크가
        // 복원 뒤에도 404로 남지 않게.
        const { subscriptions = [] } = migrateLegacyCancelUrls({
          subscriptions: data.subscriptions,
        });
        set({
          subscriptions,
          usageLogs: data.usageLogs,
          accounts: data.accounts,
          exchangeRate: data.exchangeRate,
          // 복원한 것이 실제 기록이다. 체험 중이었으면 끝낸다.
          demo: null,
        });
      },
      startDemo: () => {
        if (get().demo) return;
        const now = new Date().toISOString();
        set((state) => ({
          demo: {
            startedAt: now,
            saved: { subscriptions: state.subscriptions, usageLogs: state.usageLogs },
          },
          subscriptions: demoSubscriptions(now),
          usageLogs: [],
        }));
      },
      endDemo: () => {
        const demo = get().demo;
        if (!demo) return;
        set({
          demo: null,
          subscriptions: demo.saved.subscriptions,
          usageLogs: demo.saved.usageLogs,
        });
      },
      updateSubscription: (id, data) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  ...data,
                  // 금액을 고쳤으면 "영수증과 다르다"는 표식은 더 이상 맞지 않는다.
                  ...(data.amount !== undefined
                    ? { observedAmount: undefined, observedAmountAt: undefined }
                    : {}),
                }
              : sub,
          ),
        }));
      },
      confirmSubscriptionPrice: (id, newAmount) => {
        const checkedAt = new Date().toISOString();
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  amount:
                    typeof newAmount === "number" && Number.isFinite(newAmount) && newAmount > 0
                      ? newAmount
                      : sub.amount,
                  lastPriceCheckedAt: checkedAt,
                  // 사용자가 답을 줬으니 관측 표식을 내린다. 또 다른 금액이 오면 다시 적힌다.
                  observedAmount: undefined,
                  observedAmountAt: undefined,
                }
              : sub,
          ),
        }));
      },
      // 해지 확인은 해지 한 번에 딸린 기록이다. 되살리면 확인을 지워, 되살렸다가
      // 다시 해지했을 때 이전 확인이 새 해지를 확인한 것처럼 남지 않게 한다.
      //
      // 이미 해지한 구독은 다시 해지로 기록하지 않는다. 예전에는 상세 화면의
      // 해지 가이드나 해지 전에 받은 체크인 메일에서 '해지 완료'를 한 번 더
      // 누르면 해지일이 오늘로 바뀌고 확인이 지워져, 쌓인 지킨 돈이 사라졌다.
      killSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.status !== "killed"
              ? {
                  ...sub,
                  status: "killed",
                  killedAt: new Date().toISOString(),
                  killVerifiedAt: undefined,
                }
              : sub,
          ),
        }));
      },
      reviveSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? {
                  ...sub,
                  status: "active",
                  killedAt: undefined,
                  killVerifiedAt: undefined,
                  // 다시 구독 중이면 "해지했는데 결제됐다"는 더 이상 이상한 일이 아니다.
                  chargedAfterKillAt: undefined,
                  chargedAfterKillAmount: undefined,
                }
              : sub,
          ),
        }));
      },
      markObservedAmount: (id, receiptDate, amount) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.status === "active"
              ? { ...sub, observedAmount: amount, observedAmountAt: receiptDate }
              : sub,
          ),
        }));
      },
      markChargedAfterKill: (id, receiptDate, amount) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.status === "killed"
              ? { ...sub, chargedAfterKillAt: receiptDate, chargedAfterKillAmount: amount }
              : sub,
          ),
        }));
      },
      confirmKillVerified: (id) => {
        const verifiedAt = new Date().toISOString();
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.status === "killed"
              ? {
                  ...sub,
                  killVerifiedAt: verifiedAt,
                  // 다시 확인해 줬으니 예전 영수증 증거는 내린다. 또 오면 다시 적힌다.
                  chargedAfterKillAt: undefined,
                  chargedAfterKillAmount: undefined,
                }
              : sub,
          ),
        }));
      },
      deleteSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
          usageLogs: state.usageLogs.filter((log) => log.subscriptionId !== id),
        }));
      },
      checkIn: (subscriptionId, usageCount) => {
        const state = get();
        const sub = state.subscriptions.find((s) => s.id === subscriptionId);
        if (!sub) throw new Error("Subscription not found");

        // A check-in counts uses over the last 30 days, so it has to be divided
        // into one month of cost — and into the part of it this user actually
        // pays. Feeding it the raw `amount` reported a yearly plan's per-use
        // cost twelve times too high, and ignored every shared plan's split.
        const monthlyShare = getMyMonthlyShareAmount(sub);
        const costPerUse = calculateCostPerUse(monthlyShare, usageCount);
        const riskLevel = getRiskLevel(costPerUse, monthlyShare, usageCount);
        const shockMessage = formatShockMessage(sub.name, monthlyShare, usageCount, sub.currency);
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const newLog: UsageLog = {
          id: crypto.randomUUID(),
          subscriptionId,
          month: monthStr,
          usageCount,
          costPerUse,
          riskLevel,
          checkedAt: now.toISOString(),
        };

        set((s) => ({ usageLogs: [...s.usageLogs, newLog] }));
        return { shockMessage, riskLevel, costPerUse };
      },
      getActiveSubscriptions: () => {
        return get().subscriptions.filter((s) => s.status === "active");
      },
      getKilledSubscriptions: () => {
        return get().subscriptions.filter((s) => s.status === "killed");
      },
      getDashboardStats: () => {
        const state = get();
        const active = state.getActiveSubscriptions();
        const killed = state.getKilledSubscriptions();
        // Normalised to KRW/month so USD and yearly plans are not summed as if
        // they were monthly won amounts.
        const rate = state.getExchangeRate();
        // Spend and savings are the user's own burden: on a plan split four
        // ways they pay a quarter, and cancelling it saves them a quarter.
        // The gross figure is kept alongside so the card charge is still
        // visible where it matters.
        const totalMonthlySpend = sumMyMonthlyKRW(active, rate);
        const totalMonthlyBilled = sumMonthlyKRW(active, rate);
        const totalSaved = sumMyAnnualKRW(killed, rate);
        const atRisk = state.getAtRiskSubscriptions();
        return {
          totalMonthlySpend,
          totalMonthlyBilled,
          activeCount: active.length,
          killedCount: killed.length,
          totalSaved,
          atRiskCount: atRisk.length,
        };
      },
      getAtRiskSubscriptions: () => {
        const state = get();
        const active = state.getActiveSubscriptions();
        return active.filter((sub) => {
          const logs = state.usageLogs
            .filter((log) => log.subscriptionId === sub.id)
            .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
          if (logs.length > 0) {
            return logs[0].riskLevel === "red";
          }
          return false;
        });
      },

      setNotify: (settings) => {
        set((state) => ({ notify: { ...state.notify, ...settings } }));
      },
      clearNotify: () => {
        set({ notify: DEFAULT_NOTIFY });
      },
      markNotifyRejected: (syncToken) => {
        if (get().notify.syncToken !== syncToken) return;
        // 서버에 이 브라우저의 기록이 없다. '켜짐'으로 남겨 두면 오지 않을 알림을 기다리게 된다.
        // 알림 시점만 남겨 다시 신청할 때 그대로 쓴다.
        set((state) => ({
          notify: {
            ...DEFAULT_NOTIFY,
            reminderDays: state.notify.reminderDays,
            rejectedAt: new Date().toISOString(),
          },
        }));
      },

      setAccountSync: (next) => {
        set((state) => ({ accountSync: { ...state.accountSync, ...next } }));
      },
      setExchangeRate: (rate, source) => {
        if (!isValidExchangeRate(rate)) return;
        set({ exchangeRate: { rate, source, updatedAt: new Date().toISOString() } });
      },
      resetExchangeRate: () => {
        set({ exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING });
      },
      getExchangeRate: () => get().exchangeRate.rate ?? DEFAULT_EXCHANGE_RATE,

      // Linked Accounts implementation
      addAccount: (accountData) => {
        const newAccount: LinkedAccount = {
          ...accountData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ accounts: [...(state.accounts || []), newAccount] }));
        return newAccount;
      },
      updateAccount: (id, data) => {
        set((state) => ({
          accounts: (state.accounts || []).map((acc) =>
            acc.id === id ? { ...acc, ...data } : acc,
          ),
        }));
      },
      deleteAccount: (id) => {
        // Unlink subscriptions that were linked to this account — including the
        // real ones set aside while a sample demo is showing.
        const unlink = (subs: Subscription[]) =>
          subs.map((sub) =>
            sub.linkedAccountId === id
              ? { ...sub, linkedAccountId: undefined, linkedAccountName: undefined }
              : sub,
          );
        set((state) => ({
          accounts: (state.accounts || []).filter((acc) => acc.id !== id),
          subscriptions: unlink(state.subscriptions),
          demo: state.demo
            ? {
                ...state.demo,
                saved: {
                  ...state.demo.saved,
                  subscriptions: unlink(state.demo.saved.subscriptions),
                },
              }
            : null,
        }));
      },
      getAccountById: (id) => {
        return (get().accounts || []).find((acc) => acc.id === id);
      },
      getSubscriptionsByAccount: (accountId) => {
        return get().subscriptions.filter((sub) => sub.linkedAccountId === accountId);
      },
    }),
    {
      name: "subslash-storage",
      storage: createJSONStorage(() => recordStorage()),
      version: 1,
      // Stores written before v1 carry the seeded demo accounts; drop them on
      // the first load rather than leaving invented addresses in place.
      migrate: (persisted, version) =>
        version >= 1
          ? (persisted as Partial<PersistedState>)
          : migrateSeededAccounts(persisted as Partial<PersistedState>),
      merge: mergePersistedState,
      partialize: toPersistedState,
    },
  ),
);
