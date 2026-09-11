import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  currentCancelUrl,
} from "@subslash/shared";

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
  "subscriptions" | "usageLogs" | "accounts" | "notify" | "exchangeRate"
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
 * How a saved store is laid over the fresh one on load.
 *
 * Retired cancel links are rewritten here, on every load, rather than in
 * `migrate` behind a version bump — adding an old URL to a preset's
 * `legacyCancelUrls` is then all a link fix takes, with no version number to
 * remember.
 */
export function mergePersistedState(persisted: unknown, current: SubSlashStore): SubSlashStore {
  return {
    ...current,
    ...migrateLegacyCancelUrls((persisted ?? {}) as Partial<PersistedState>),
  };
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
}

export const DEFAULT_NOTIFY: NotifySettings = {
  email: null,
  syncToken: null,
  verified: false,
  reminderDays: 3,
  lastSyncedAt: null,
  calendarUrl: null,
};

/** Where the USD → KRW rate in use came from. */
export type ExchangeRateSource = "default" | "manual" | "ecb";

/**
 * The rate every USD subscription is converted with.
 *
 * A single hardcoded constant put every won total slightly off whenever the
 * market moved, with nothing on screen to say so. The rate is now part of the
 * user's data: they can type the one their card statement implies, or pull the
 * latest published reference rate, and the app shows which one it used.
 */
export interface ExchangeRateSetting {
  /** Null while nobody has chosen one; reads fall back to DEFAULT_EXCHANGE_RATE. */
  rate: number | null;
  source: ExchangeRateSource;
  /** ISO timestamp of when this rate was set or published. */
  updatedAt: string | null;
}

export const DEFAULT_EXCHANGE_RATE_SETTING: ExchangeRateSetting = {
  rate: null,
  source: "default",
  updatedAt: null,
};

/** Rejects rates that would silently corrupt every total. */
export function isValidExchangeRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0 && rate <= 100000;
}

interface SubSlashStore {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  accounts: LinkedAccount[];
  notify: NotifySettings;
  exchangeRate: ExchangeRateSetting;

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
  deleteSubscription: (id: string) => void;
  checkIn: (subscriptionId: string, usageCount: number) => CheckInResponse;
  getActiveSubscriptions: () => Subscription[];
  getKilledSubscriptions: () => Subscription[];
  getDashboardStats: () => DashboardStats;
  getAtRiskSubscriptions: () => Subscription[];

  // Email reminder actions
  setNotify: (settings: Partial<NotifySettings>) => void;
  clearNotify: () => void;

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

export const useStore = create<SubSlashStore>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      notify: DEFAULT_NOTIFY,
      exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,

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
        set((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
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
        set((state) => ({
          subscriptions: options?.clearPrevious ? newSubs : [...state.subscriptions, ...newSubs],
          usageLogs: options?.clearPrevious ? [] : state.usageLogs,
        }));
        return newSubs;
      },
      clearSubscriptions: () => {
        set({ subscriptions: [], usageLogs: [] });
      },
      clearAllData: () => {
        // The reminder opt-in is deliberately preserved: it lives on the server
        // too, so silently forgetting the token here would orphan that record.
        set({ subscriptions: [], usageLogs: [], accounts: [] });
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
        });
      },
      updateSubscription: (id, data) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...data } : sub,
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
              ? { ...sub, status: "active", killedAt: undefined, killVerifiedAt: undefined }
              : sub,
          ),
        }));
      },
      confirmKillVerified: (id) => {
        const verifiedAt = new Date().toISOString();
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id && sub.status === "killed" ? { ...sub, killVerifiedAt: verifiedAt } : sub,
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
        set((state) => ({
          accounts: (state.accounts || []).filter((acc) => acc.id !== id),
          // Unlink subscriptions that were linked to this account
          subscriptions: state.subscriptions.map((sub) =>
            sub.linkedAccountId === id
              ? { ...sub, linkedAccountId: undefined, linkedAccountName: undefined }
              : sub,
          ),
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
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Stores written before v1 carry the seeded demo accounts; drop them on
      // the first load rather than leaving invented addresses in place.
      migrate: (persisted, version) =>
        version >= 1
          ? (persisted as Partial<PersistedState>)
          : migrateSeededAccounts(persisted as Partial<PersistedState>),
      merge: mergePersistedState,
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        usageLogs: state.usageLogs,
        accounts: state.accounts,
        notify: state.notify,
        exchangeRate: state.exchangeRate,
      }),
    },
  ),
);
