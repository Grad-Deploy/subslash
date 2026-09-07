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
  sumMonthlyKRW,
  sumAnnualKRW,
} from "@subslash/shared";

export const DEFAULT_ACCOUNTS: LinkedAccount[] = [
  {
    id: "acc-google-1",
    provider: "google",
    name: "Google 개인 계정",
    emailOrId: "myaccount@gmail.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "acc-naver-1",
    provider: "naver",
    name: "네이버 개인 계정",
    emailOrId: "myaccount@naver.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "acc-kakao-1",
    provider: "kakao",
    name: "카카오 로그인 계정",
    emailOrId: "kakao_user@kakao.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "acc-apple-1",
    provider: "apple",
    name: "Apple ID (App Store)",
    emailOrId: "apple_user@icloud.com",
    createdAt: new Date().toISOString(),
  },
];

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
}

export const DEFAULT_NOTIFY: NotifySettings = {
  email: null,
  syncToken: null,
  verified: false,
  reminderDays: 3,
  lastSyncedAt: null,
};

interface SubSlashStore {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  accounts: LinkedAccount[];
  notify: NotifySettings;

  // Subscription actions
  addSubscription: (data: SubscriptionFormData) => Subscription;
  addBatchSubscriptions: (
    dataList: SubscriptionFormData[],
    options?: { clearPrevious?: boolean },
  ) => Subscription[];
  clearSubscriptions: () => void;
  clearAllData: () => void;
  updateSubscription: (id: string, data: Partial<SubscriptionFormData>) => void;
  killSubscription: (id: string) => void;
  reviveSubscription: (id: string) => void;
  deleteSubscription: (id: string) => void;
  checkIn: (subscriptionId: string, usageCount: number) => CheckInResponse;
  getActiveSubscriptions: () => Subscription[];
  getKilledSubscriptions: () => Subscription[];
  getDashboardStats: () => DashboardStats;
  getAtRiskSubscriptions: () => Subscription[];

  // Email reminder actions
  setNotify: (settings: Partial<NotifySettings>) => void;
  clearNotify: () => void;

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
      accounts: DEFAULT_ACCOUNTS,
      notify: DEFAULT_NOTIFY,

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
        set({ subscriptions: [], usageLogs: [], accounts: DEFAULT_ACCOUNTS });
      },
      updateSubscription: (id, data) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...data } : sub,
          ),
        }));
      },
      killSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: "killed", killedAt: new Date().toISOString() } : sub,
          ),
        }));
      },
      reviveSubscription: (id) => {
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: "active", killedAt: undefined } : sub,
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

        const costPerUse = calculateCostPerUse(sub.amount, usageCount);
        const riskLevel = getRiskLevel(costPerUse, sub.amount, usageCount);
        const shockMessage = formatShockMessage(sub.name, sub.amount, usageCount, sub.currency);
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
        const totalMonthlySpend = sumMonthlyKRW(active);
        const totalSaved = sumAnnualKRW(killed);
        const atRisk = state.getAtRiskSubscriptions();
        return {
          totalMonthlySpend,
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
      partialize: (state) => ({
        subscriptions: state.subscriptions,
        usageLogs: state.usageLogs,
        accounts: state.accounts,
        notify: state.notify,
      }),
    },
  ),
);
