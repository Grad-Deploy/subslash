import { describe, it, expect, beforeEach } from "vitest";
import type { Subscription } from "@subslash/shared";
import { recordsHash } from "../../lib/account-sync";
import { releaseRecordsToGuest, slotKey, switchRecordsOwner } from "../../lib/records-owner";
import {
  DEFAULT_ACCOUNT_SYNC,
  DEFAULT_EXCHANGE_RATE_SETTING,
  mergePersistedState,
  useStore,
} from "../../lib/store";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

function sub(name: string): Subscription {
  return {
    id: `id-${name}`,
    name,
    amount: 10000,
    currency: "KRW",
    billingDay: 1,
    billingCycle: "monthly",
    category: "other",
    status: "active",
    createdAt: "2026-09-01T00:00:00.000Z",
  } as Subscription;
}

const names = () => useStore.getState().subscriptions.map((s) => s.name);

/** 로그인한 기기가 방금 계정과 맞춘 상태로 만든다. */
function markSynced(accountId: string) {
  const { subscriptions, usageLogs, accounts, exchangeRate } = useStore.getState();
  useStore.setState({
    accountSync: {
      ...DEFAULT_ACCOUNT_SYNC,
      accountId,
      baseSavedAt: "2026-09-25T00:00:00.000Z",
      baseHash: recordsHash({ subscriptions, usageLogs, accounts, exchangeRate }),
    },
  });
}

describe("로그인·로그아웃할 때 기록을 주인별로 나눈다", () => {
  let storage: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    storage = memoryStorage();
    useStore.setState({
      subscriptions: [sub("로그인 전 넷플릭스")],
      usageLogs: [],
      accounts: [],
      exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
      accountSync: DEFAULT_ACCOUNT_SYNC,
      recordsOwner: null,
      demo: null,
    });
  });

  it("처음 로그인하면 로그인 전 기록을 가지고 들어가고, 로그아웃하면 로그인 전 모습으로 돌아온다", () => {
    expect(switchRecordsOwner("acc-a", storage)).toBe(true);
    expect(names()).toEqual(["로그인 전 넷플릭스"]);
    expect(useStore.getState().accountSync.accountId).toBe("acc-a");

    // 로그인한 동안 받아 오거나 더한 기록은 로그아웃한 화면에 남지 않는다.
    useStore.getState().replaceAllData({
      ...useStore.getState(),
      subscriptions: [sub("계정의 유튜브"), sub("계정의 왓챠")],
    });
    switchRecordsOwner(null, storage);
    expect(names()).toEqual(["로그인 전 넷플릭스"]);
    expect(useStore.getState().recordsOwner).toBeNull();
  });

  it("계정에 올라간 기록은 기기에 남기지 않고, 다시 로그인하면 빈 기록에서 받아 오게 한다", () => {
    switchRecordsOwner("acc-a", storage);
    useStore.setState({ subscriptions: [sub("계정의 유튜브")] });
    markSynced("acc-a");

    switchRecordsOwner(null, storage);
    expect(storage.map.get(slotKey("acc-a"))).not.toContain("계정의 유튜브");

    switchRecordsOwner("acc-a", storage);
    // 빈 기록 + 판을 잊은 상태여야 첫 동기화가 '받아 오기'를 고른다. 판을 기억하면 빈 기록을 올린다.
    expect(names()).toEqual([]);
    expect(useStore.getState().accountSync).toMatchObject({
      accountId: "acc-a",
      baseSavedAt: null,
      baseHash: null,
    });
  });

  it("아직 올리지 못한 변경은 이 기기의 계정 칸에 두었다가 다시 로그인하면 돌려준다", () => {
    switchRecordsOwner("acc-a", storage);
    useStore.setState({ subscriptions: [sub("계정의 유튜브")] });
    markSynced("acc-a");
    useStore.setState({ subscriptions: [sub("계정의 유튜브"), sub("막 더한 디즈니")] });

    switchRecordsOwner(null, storage);
    expect(names()).toEqual(["로그인 전 넷플릭스"]);

    switchRecordsOwner("acc-a", storage);
    expect(names()).toEqual(["계정의 유튜브", "막 더한 디즈니"]);
    expect(useStore.getState().accountSync.baseSavedAt).toBe("2026-09-25T00:00:00.000Z");
    expect(storage.map.has(slotKey("acc-a"))).toBe(false);
  });

  it("다른 계정으로 바뀌면 앞 계정의 기록을 가지고 가지 않는다", () => {
    switchRecordsOwner("acc-a", storage);
    useStore.setState({ subscriptions: [sub("A의 유튜브")] });

    switchRecordsOwner("acc-b", storage);
    expect(names()).toEqual([]);
    expect(useStore.getState().accountSync.accountId).toBe("acc-b");
  });

  it("같은 주인이면 아무것도 바꾸지 않는다", () => {
    expect(switchRecordsOwner(null, storage)).toBe(false);
    expect(storage.map.size).toBe(0);
  });

  it("체험 중이면 체험은 두고, 칸에는 샘플이 아니라 보관해 둔 실제 기록을 넣고 바꾼다", () => {
    useStore.getState().startDemo();
    const sampleNames = names();
    switchRecordsOwner("acc-a", storage);
    useStore.setState({
      demo: {
        ...useStore.getState().demo!,
        saved: { subscriptions: [sub("계정의 유튜브")], usageLogs: [] },
      },
    });

    switchRecordsOwner(null, storage);
    expect(useStore.getState().demo).not.toBeNull();
    expect(names()).toEqual(sampleNames);
    expect(useStore.getState().demo?.saved.subscriptions.map((s) => s.name)).toEqual([
      "로그인 전 넷플릭스",
    ]);
    expect(storage.map.get(slotKey("acc-a"))).toContain("계정의 유튜브");
    expect(storage.map.get(slotKey("acc-a"))).not.toContain("demo-");
  });

  it("회원 탈퇴하면 기록을 지우지 않고 비로그인 기록으로 남긴다", () => {
    switchRecordsOwner("acc-a", storage);
    useStore.setState({ subscriptions: [sub("계정의 유튜브")] });

    releaseRecordsToGuest(storage);
    expect(names()).toEqual(["계정의 유튜브"]);
    expect(useStore.getState().recordsOwner).toBeNull();
    expect(storage.map.size).toBe(0);
    // 뒤이은 로그인 상태 확인(로그아웃됨)이 기록을 다시 바꾸지 않는다.
    expect(switchRecordsOwner(null, storage)).toBe(false);
  });

  it("주인 칸이 생기기 전 저장소는 맞춰 오던 계정을 주인으로 읽는다", () => {
    const current = useStore.getState();
    const legacy = mergePersistedState(
      { subscriptions: [], accountSync: { ...DEFAULT_ACCOUNT_SYNC, accountId: "acc-a" } },
      current,
    );
    expect(legacy.recordsOwner).toBe("acc-a");
    expect(mergePersistedState({ subscriptions: [] }, current).recordsOwner).toBeNull();
    expect(
      mergePersistedState(
        { recordsOwner: null, accountSync: { ...DEFAULT_ACCOUNT_SYNC, accountId: "acc-a" } },
        current,
      ).recordsOwner,
    ).toBeNull();
  });
});
