import { currentCancelUrl, currentCategory, type LinkedAccount } from "@subslash/shared";
import { realRecords } from "./demo";
import type { PersistedState, SubSlashStore } from "./types";

/**
 * 저장소(localStorage)에 무엇을 어떻게 남기고, 예전에 저장한 것을 어떻게 지금 모양으로 읽는지.
 * 버전을 올리는 이전(`migrate`)과 불러올 때마다 거치는 교정(`mergePersistedState`)이 있다.
 */

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

/** localStorage에 저장하는 칸. 체험 중에도 실제 기록만 담는다 — 샘플은 이 탭의 메모리에만 있다. */
export function toPersistedState(state: SubSlashStore): PersistedState {
  return {
    ...realRecords(state),
    accounts: state.accounts,
    exchangeRate: state.exchangeRate,
    accountSync: state.accountSync,
    recordsOwner: state.recordsOwner,
  };
}
