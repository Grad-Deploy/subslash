import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { recordStorage } from "../mirrored-storage";
import type { LinkedAccount, Subscription } from "@subslash/shared";
import {
  findPresetForSubscription,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
  sumMyAnnualKRW,
  DEFAULT_EXCHANGE_RATE,
  parseDateOnly,
  chargeHistoryTarget,
  matchCancelNotices,
  mergeChargeHistory,
  type ChargeRecord,
} from "@subslash/shared";
import {
  DEFAULT_EXCHANGE_RATE_SETTING,
  isValidExchangeRate,
  type ExchangeRateSource,
} from "../exchange-rate";
import { demoSubscriptions, realRecords } from "./demo";
import {
  mergePersistedState,
  migrateLegacyCancelUrls,
  migrateSeededAccounts,
  toPersistedState,
} from "./persistence";
import {
  buildCheckInLog,
  createSubscription,
  isAtRisk,
  killedRecord,
  revivedRecord,
} from "./records";
import { DEFAULT_ACCOUNT_SYNC, type PersistedState, type SubSlashStore } from "./types";

/**
 * 구독 기록 저장소(zustand + localStorage). 이 파일은 액션이 어느 기록을 바꾸는지만 정한다.
 *
 * - types: 저장소의 모양과 액션 설명
 * - records: 해지·되살리기·체크인처럼 기록 한 줄을 바꾸는 규칙
 * - persistence: 저장할 칸과 예전 저장분의 이전·교정
 * - demo: 샘플 체험(실제 기록을 보관해 두고 샘플을 보여 준다)
 */

export type { AccountSyncState, BackupData } from "./types";
export { DEFAULT_ACCOUNT_SYNC } from "./types";
export { DEMO_DURATION_MS, isDemoExpired, realRecords, type DemoSession } from "./demo";
export {
  mergePersistedState,
  migrateLegacyCancelUrls,
  migrateRetiredCategories,
  migrateSeededAccounts,
  toPersistedState,
} from "./persistence";

// 환율 설정은 서버(계정에 저장한 기록의 검증)도 쓰므로 스토어 밖에 둔다. 이 모듈에서
// 가져다 쓰던 곳이 그대로 동작하도록 다시 내보낸다.
export { DEFAULT_EXCHANGE_RATE_SETTING, isValidExchangeRate };
export type { ExchangeRateSource };

export const useStore = create<SubSlashStore>()(
  persist(
    (set, get) => {
      /** 조건에 맞는 구독만 바꾼다. 화면의 목록(체험 중이면 샘플)에 적용된다. */
      const patchSubscriptions = (
        matches: (sub: Subscription) => boolean,
        change: (sub: Subscription) => Subscription,
      ) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) => (matches(sub) ? change(sub) : sub)),
        }));

      return {
        subscriptions: [],
        usageLogs: [],
        accounts: [],
        exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
        demo: null,
        accountSync: DEFAULT_ACCOUNT_SYNC,
        recordsOwner: null,

        addSubscription: (data) => {
          const newSub = createSubscription(data, crypto.randomUUID(), new Date().toISOString());
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
          const newSubs = dataList.map((data) =>
            createSubscription(data, crypto.randomUUID(), now),
          );
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
          patchSubscriptions(
            (sub) => sub.id === id,
            (sub) => ({
              ...sub,
              ...data,
              // 금액을 고쳤으면 "영수증과 다르다"는 표식은 더 이상 맞지 않는다.
              ...(data.amount !== undefined
                ? { observedAmount: undefined, observedAmountAt: undefined }
                : {}),
            }),
          );
        },
        confirmSubscriptionPrice: (id, newAmount) => {
          const checkedAt = new Date().toISOString();
          patchSubscriptions(
            (sub) => sub.id === id,
            (sub) => ({
              ...sub,
              amount:
                typeof newAmount === "number" && Number.isFinite(newAmount) && newAmount > 0
                  ? newAmount
                  : sub.amount,
              lastPriceCheckedAt: checkedAt,
              // 사용자가 답을 줬으니 관측 표식을 내린다. 또 다른 금액이 오면 다시 적힌다.
              observedAmount: undefined,
              observedAmountAt: undefined,
            }),
          );
        },
        // 이미 해지한 구독은 다시 해지로 기록하지 않는다. 예전에는 상세 화면의 해지 가이드나 해지 전에
        // 받은 체크인 메일에서 '해지 완료'를 한 번 더 누르면 해지일이 오늘로 바뀌고 확인이 지워져, 쌓인
        // 지킨 돈이 사라졌다.
        killSubscription: (id) => {
          const killedAt = new Date().toISOString();
          patchSubscriptions(
            (sub) => sub.id === id && sub.status !== "killed",
            (sub) => killedRecord(sub, killedAt),
          );
        },
        reviveSubscription: (id) => {
          patchSubscriptions((sub) => sub.id === id, revivedRecord);
        },
        recordOrderEvidence: (counts) => {
          if (get().demo || counts.length === 0) return;
          const checkedAt = new Date().toISOString();
          set((state) => ({
            subscriptions: state.subscriptions.map((sub) => {
              if (sub.status !== "active" || sub.currency !== "KRW") return sub;
              const presetId = findPresetForSubscription(sub)?.id;
              const found = counts.find((count) => count.presetId === presetId);
              return found
                ? { ...sub, orderEvidence: { count: found.count, since: found.since, checkedAt } }
                : sub;
            }),
          }));
        },
        recordChargeHistory: (found) => {
          if (get().demo) return;
          const incoming = new Map<string, ChargeRecord[]>();
          const subscriptions = get().subscriptions;
          for (const item of found) {
            if (!item.chargeHistory?.length) continue;
            const target = chargeHistoryTarget(subscriptions, item);
            if (!target) continue;
            incoming.set(target.id, [...(incoming.get(target.id) ?? []), ...item.chargeHistory]);
          }
          if (incoming.size === 0) return;
          patchSubscriptions(
            (sub) => incoming.has(sub.id),
            (sub) => ({
              ...sub,
              chargeHistory: mergeChargeHistory(sub.chargeHistory, incoming.get(sub.id)!),
            }),
          );
        },
        recordCancelNotices: (found) => {
          if (get().demo) return;
          const matches = matchCancelNotices(get().subscriptions, found);
          if (matches.length === 0) return;
          const byId = new Map(matches.map((match) => [match.subscriptionId, match.receiptDate]));
          patchSubscriptions(
            (sub) => byId.has(sub.id),
            (sub) => ({ ...sub, cancelNoticeAt: byId.get(sub.id) }),
          );
        },
        setFreeTierAnswer: (id, answer) => {
          patchSubscriptions(
            (sub) => sub.id === id,
            (sub) => ({ ...sub, freeTierAnswer: answer }),
          );
        },
        dismissCancelNotice: (id) => {
          patchSubscriptions(
            (sub) => sub.id === id && !!sub.cancelNoticeAt,
            (sub) => ({
              ...sub,
              cancelNoticeDismissedAt: sub.cancelNoticeAt,
              cancelNoticeAt: undefined,
            }),
          );
        },
        markObservedAmount: (id, receiptDate, amount) => {
          patchSubscriptions(
            (sub) => sub.id === id && sub.status === "active",
            (sub) => ({ ...sub, observedAmount: amount, observedAmountAt: receiptDate }),
          );
        },
        markChargedAfterKill: (id, receiptDate, amount) => {
          patchSubscriptions(
            (sub) => sub.id === id && sub.status === "killed",
            (sub) => ({ ...sub, chargedAfterKillAt: receiptDate, chargedAfterKillAmount: amount }),
          );
        },
        confirmKillVerified: (id) => {
          const verifiedAt = new Date().toISOString();
          patchSubscriptions(
            (sub) => sub.id === id && sub.status === "killed",
            (sub) => ({
              ...sub,
              killVerifiedAt: verifiedAt,
              // 다시 확인해 줬으니 예전 영수증 증거는 내린다. 또 오면 다시 적힌다.
              chargedAfterKillAt: undefined,
              chargedAfterKillAmount: undefined,
            }),
          );
        },
        setResubscribeReminder: (id, date) => {
          const valid = date !== null && parseDateOnly(date) !== null;
          patchSubscriptions(
            (sub) => sub.id === id && sub.status === "killed",
            (sub) => ({ ...sub, resubscribeRemindOn: valid ? date : undefined }),
          );
        },
        setKillEvidence: (id, evidence) => {
          const reference = evidence.reference?.trim() || undefined;
          const memo = evidence.memo?.trim() || undefined;
          patchSubscriptions(
            (sub) => sub.id === id && sub.status === "killed",
            (sub) => ({
              ...sub,
              killEvidence:
                reference || memo
                  ? { reference, memo, recordedAt: new Date().toISOString() }
                  : undefined,
            }),
          );
        },
        deleteSubscription: (id) => {
          get().deleteSubscriptions([id]);
        },
        deleteSubscriptions: (ids) => {
          const drop = new Set(ids);
          set((state) => ({
            subscriptions: state.subscriptions.filter((sub) => !drop.has(sub.id)),
            usageLogs: state.usageLogs.filter((log) => !drop.has(log.subscriptionId)),
          }));
        },
        hideSubscriptions: (ids) => {
          const hide = new Set(ids);
          const at = new Date().toISOString();
          // 해지한 구독만 숨긴다 — 구독 중인 것이 목록에서 사라지면 결제를 놓친다.
          patchSubscriptions(
            (sub) => hide.has(sub.id) && sub.status === "killed",
            (sub) => ({ ...sub, hiddenAt: at }),
          );
        },
        unhideSubscriptions: (ids) => {
          const show = new Set(ids);
          patchSubscriptions(
            (sub) => show.has(sub.id) && !!sub.hiddenAt,
            (sub) => ({ ...sub, hiddenAt: undefined }),
          );
        },
        checkIn: (subscriptionId, usageCount, options) => {
          const sub = get().subscriptions.find((s) => s.id === subscriptionId);
          if (!sub) throw new Error("Subscription not found");

          const { log, response } = buildCheckInLog(
            sub,
            usageCount,
            { ...options, exchangeRate: get().getExchangeRate() },
            new Date(),
            crypto.randomUUID(),
          );
          const replaceId = options?.replaceLogId;
          set((s) => ({
            usageLogs:
              replaceId && s.usageLogs.some((l) => l.id === replaceId)
                ? s.usageLogs.map((l) => (l.id === replaceId ? { ...log, id: replaceId } : l))
                : [...s.usageLogs, log],
          }));
          return response;
        },
        getActiveSubscriptions: () => get().subscriptions.filter((s) => s.status === "active"),
        getKilledSubscriptions: () => get().subscriptions.filter((s) => s.status === "killed"),
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
          return {
            totalMonthlySpend: sumMyMonthlyKRW(active, rate),
            totalMonthlyBilled: sumMonthlyKRW(active, rate),
            activeCount: active.length,
            killedCount: killed.length,
            totalSaved: sumMyAnnualKRW(killed, rate),
            atRiskCount: state.getAtRiskSubscriptions().length,
          };
        },
        getAtRiskSubscriptions: () => {
          const state = get();
          return state.getActiveSubscriptions().filter((sub) => isAtRisk(sub, state.usageLogs));
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
        getAccountById: (id) => (get().accounts || []).find((acc) => acc.id === id),
        getSubscriptionsByAccount: (accountId) =>
          get().subscriptions.filter((sub) => sub.linkedAccountId === accountId),
      };
    },
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
