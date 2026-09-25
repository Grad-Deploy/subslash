/**
 * 로그인·로그아웃할 때 구독 기록을 주인별로 나눈다.
 *
 * 화면의 기록(lib/store)은 한 벌뿐이라, 예전에는 로그아웃해도 로그인한 동안 받아 오거나 고친 기록이
 * 그대로 남아 비로그인 화면에 보였다. 이제 기록에 주인(`recordsOwner`)을 적고, 주인이 바뀌면 떠나는
 * 주인의 기록을 칸에 넣고 들어오는 주인의 칸을 꺼낸다.
 *
 * - 비로그인 → 로그인: 이 기기에서 처음 로그인하는 계정이면 로그인 전 기록을 가지고 들어간다(비로그인으로
 *   쓰다가 계정에 저장하는 흐름, 첫 동기화가 올리거나 어느 쪽을 쓸지 묻는다). 로그인 전 기록은 비로그인
 *   칸에 그대로 남아, 로그아웃하면 로그인하기 전 모습으로 돌아온다.
 * - 로그인 → 로그아웃: 계정에 이미 올라간 기록은 기기에 남기지 않는다 — 다음 로그인 때 받아 온다. 아직
 *   올리지 못한 변경(동기화를 껐거나 막 고쳤다)이 있을 때만 이 기기의 계정 칸에 두어 잃지 않게 한다.
 * - 다른 계정으로 바로 바뀌면(세션이 끝난 뒤 다른 아이디로 로그인) 앞 계정의 기록을 가지고 가지 않는다.
 *
 * 체험 중이면 체험은 두고 보관해 둔 실제 기록을 칸에 넣고 바꾼다. 기기마다 다른 것(알림 설정 `notify`)은
 * 주인과 상관없이 그대로 둔다.
 */
import type { StateStorage } from "zustand/middleware";
import { recordsHash } from "./account-sync";
import { recordStorage } from "./mirrored-storage";
import {
  DEFAULT_ACCOUNT_SYNC,
  realRecords,
  useStore,
  type AccountSyncState,
  type BackupData,
} from "./store";

type SlotStorage = Pick<StateStorage, "getItem" | "setItem" | "removeItem">;

interface RecordSlot extends BackupData {
  accountSync: AccountSyncState;
}

export const GUEST_SLOT_KEY = "subslash-records:guest";

export function slotKey(owner: string | null): string {
  return owner === null ? GUEST_SLOT_KEY : `subslash-records:account:${owner}`;
}

function readSlot(storage: SlotStorage, key: string): RecordSlot | null {
  try {
    const raw = storage.getItem(key);
    if (typeof raw !== "string") return null;
    const slot = JSON.parse(raw) as Partial<RecordSlot>;
    if (!Array.isArray(slot.subscriptions) || !Array.isArray(slot.usageLogs)) return null;
    return {
      subscriptions: slot.subscriptions,
      usageLogs: slot.usageLogs,
      accounts: Array.isArray(slot.accounts) ? slot.accounts : [],
      exchangeRate: slot.exchangeRate ?? useStore.getState().exchangeRate,
      accountSync: { ...DEFAULT_ACCOUNT_SYNC, ...slot.accountSync },
    };
  } catch {
    return null;
  }
}

/** 지금 주인의 실제 기록. 체험 중이면 화면의 샘플이 아니라 보관해 둔 기록이다. */
function currentSlot(): RecordSlot {
  const state = useStore.getState();
  const { accounts, exchangeRate, accountSync } = state;
  return { ...realRecords(state), accounts, exchangeRate, accountSync };
}

/** 계정에 올라간 판과 지금 기록이 같다. 기기에 남기지 않아도 다음 로그인 때 받아 올 수 있다. */
function isSyncedToAccount(slot: RecordSlot, owner: string): boolean {
  const sync = slot.accountSync;
  return (
    sync.enabled &&
    sync.accountId === owner &&
    sync.baseSavedAt !== null &&
    sync.baseHash === recordsHash(slot)
  );
}

/** 떠나는 주인의 칸. 계정에 이미 있는 기록이면 비워 두고, 다음 로그인 때 받아 오게 판을 잊는다. */
function slotToKeep(slot: RecordSlot, owner: string | null): RecordSlot {
  if (owner === null || !isSyncedToAccount(slot, owner)) return slot;
  return {
    subscriptions: [],
    usageLogs: [],
    accounts: [],
    exchangeRate: slot.exchangeRate,
    // 판을 기억한 채 빈 기록을 두면 '이 기기에서 모두 지웠다'로 읽혀 계정의 기록을 비운다.
    accountSync: { ...DEFAULT_ACCOUNT_SYNC, accountId: owner, enabled: slot.accountSync.enabled },
  };
}

/**
 * 화면의 기록을 `next`(비로그인이면 null)의 것으로 바꾼다. 이미 그 주인이면 아무것도 하지 않고
 * false를 준다.
 */
export function switchRecordsOwner(
  next: string | null,
  storage: SlotStorage = recordStorage(),
): boolean {
  const current = useStore.getState().recordsOwner;
  if (current === next) return false;

  const leaving = currentSlot();

  // 계정에 이미 있는 기록이어도 빈 칸을 남긴다. 칸이 없으면 다시 로그인할 때 '이 기기에서 처음'으로
  // 읽혀 비로그인 기록을 가지고 들어가고, 계정의 기록과 어느 쪽을 쓸지 묻게 된다.
  storage.setItem(slotKey(current), JSON.stringify(slotToKeep(leaving, current)));

  const saved = readSlot(storage, slotKey(next));
  let incoming: RecordSlot;
  if (saved) {
    incoming = saved;
  } else if (next !== null && current === null) {
    // 이 기기에서 처음 로그인하는 계정. 로그인 전 기록을 가지고 들어간다.
    incoming = { ...leaving, accountSync: { ...DEFAULT_ACCOUNT_SYNC, accountId: next } };
  } else {
    incoming = {
      subscriptions: [],
      usageLogs: [],
      accounts: [],
      exchangeRate: leaving.exchangeRate,
      accountSync: { ...DEFAULT_ACCOUNT_SYNC, accountId: next },
    };
  }

  // 체험 중이면 체험은 그대로 두고 보관해 둔 실제 기록만 바꾼다. 로그인 확인은 화면을 연 뒤에 끝나서,
  // 체험을 막 시작한 사람의 체험이 까닭 없이 끝나면 안 된다.
  const demo = useStore.getState().demo;
  const sample = {
    subscriptions: useStore.getState().subscriptions,
    usageLogs: useStore.getState().usageLogs,
  };
  useStore.getState().replaceAllData(incoming);
  const real = useStore.getState();
  useStore.setState({
    accountSync: incoming.accountSync,
    recordsOwner: next,
    ...(demo && {
      demo: { ...demo, saved: { subscriptions: real.subscriptions, usageLogs: real.usageLogs } },
      ...sample,
    }),
  });
  // 꺼낸 계정 칸은 지운다 — 계정의 기록을 공용 기기에 필요 이상 남기지 않는다. 비로그인 칸은 남긴다.
  // 로그인한 채 남은 다른 탭이 저장하면 이 탭이 꺼낸 비로그인 기록을 덮어쓰는데, 칸마저 지웠으면 되찾을
  // 곳이 없다. 다음에 비로그인에서 떠날 때 새 기록으로 덮으므로 남겨도 오래된 사본이 쓰이지 않는다.
  if (saved && next !== null) storage.removeItem(slotKey(next));
  return true;
}

/**
 * 회원 탈퇴한 뒤. 탈퇴 안내대로 이 기기의 기록은 지우지 않고 비로그인 기록으로 남긴다. 다시 로그인할
 * 수 없는 계정의 칸과, 그 기록에 밀려날 로그인 전 칸은 지운다.
 */
export function releaseRecordsToGuest(storage: SlotStorage = recordStorage()): void {
  const owner = useStore.getState().recordsOwner;
  if (owner === null) return;
  storage.removeItem(slotKey(owner));
  storage.removeItem(GUEST_SLOT_KEY);
  useStore.setState({ recordsOwner: null, accountSync: DEFAULT_ACCOUNT_SYNC });
}
