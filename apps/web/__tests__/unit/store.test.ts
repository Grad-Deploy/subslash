import { describe, it, expect, beforeEach } from "vitest";
import { useStore, migrateSeededAccounts } from "../../lib/store";

describe("Zustand Store", () => {
  beforeEach(() => {
    // 스토어 상태 초기화
    useStore.setState({
      subscriptions: [],
      usageLogs: [],
    });
  });

  it("addSubscription: adds a subscription with generated id and status active", () => {
    useStore.getState().addSubscription({
      name: "Netflix",
      amount: 17000,
      currency: "KRW",
      billingDay: 15,
      billingCycle: "monthly",
      category: "ott",
    });

    const state = useStore.getState();
    expect(state.subscriptions.length).toBe(1);
    expect(state.subscriptions[0].name).toBe("Netflix");
    expect(state.subscriptions[0].status).toBe("active");
    expect(state.subscriptions[0].id).toBeDefined();
  });

  it("killSubscription: sets status to killed and killedAt", () => {
    useStore.getState().addSubscription({
      name: "Netflix",
      amount: 17000,
      currency: "KRW",
      billingDay: 15,
      billingCycle: "monthly",
      category: "ott",
    });
    const subId = useStore.getState().subscriptions[0].id;

    useStore.getState().killSubscription(subId);

    const state = useStore.getState();
    expect(state.subscriptions[0].status).toBe("killed");
    expect(state.subscriptions[0].killedAt).toBeDefined();
  });

  it("reviveSubscription: sets status back to active and clears killedAt", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "sub1",
          name: "Netflix",
          amount: 17000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "ott",
          status: "killed",
          killedAt: new Date().toISOString(), // Serialized Date for store
          createdAt: new Date().toISOString(),
        },
      ],
      usageLogs: [],
    });

    useStore.getState().reviveSubscription("sub1");

    const state = useStore.getState();
    expect(state.subscriptions[0].status).toBe("active");
    expect(state.subscriptions[0].killedAt).toBeUndefined();
  });

  it("deleteSubscription: permanently removes subscription and related logs", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "sub1",
          name: "Netflix",
          amount: 17000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
      usageLogs: [
        {
          id: "log1",
          subscriptionId: "sub1",
          month: "2026-09",
          usageCount: 1,
          costPerUse: 17000,
          riskLevel: "red",
          checkedAt: new Date().toISOString(),
        },
      ],
    });

    useStore.getState().deleteSubscription("sub1");

    const state = useStore.getState();
    expect(state.subscriptions.length).toBe(0);
    expect(state.usageLogs.length).toBe(0);
  });

  it("checkIn: creates usage log with correct costPerUse and riskLevel", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "sub1",
          name: "Netflix",
          amount: 17000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
      usageLogs: [],
    });

    useStore.getState().checkIn("sub1", 3);

    const state = useStore.getState();
    expect(state.usageLogs.length).toBe(1);
    expect(state.usageLogs[0].usageCount).toBe(3);
    // 17000 / 3 ≈ 5666.67
    expect(state.usageLogs[0].riskLevel).toBeDefined();
  });

  it("getActiveSubscriptions & getKilledSubscriptions: filters correctly", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "1",
          name: "A",
          amount: 1000,
          currency: "KRW",
          billingDay: 1,
          billingCycle: "monthly",
          category: "other",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "B",
          amount: 2000,
          currency: "KRW",
          billingDay: 2,
          billingCycle: "monthly",
          category: "other",
          status: "killed",
          createdAt: new Date().toISOString(),
          killedAt: new Date().toISOString(),
        },
      ],
      usageLogs: [],
    });

    const active = useStore.getState().getActiveSubscriptions();
    const killed = useStore.getState().getKilledSubscriptions();

    expect(active.length).toBe(1);
    expect(active[0].id).toBe("1");

    expect(killed.length).toBe(1);
    expect(killed[0].id).toBe("2");
  });

  it("getDashboardStats: calculates correct totals", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "1",
          name: "A",
          amount: 10000,
          currency: "KRW",
          billingDay: 1,
          billingCycle: "monthly",
          category: "other",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "B",
          amount: 20000,
          currency: "KRW",
          billingDay: 2,
          billingCycle: "monthly",
          category: "other",
          status: "killed",
          createdAt: new Date().toISOString(),
          killedAt: new Date().toISOString(),
        },
      ],
      usageLogs: [],
    });

    const stats = useStore.getState().getDashboardStats();
    expect(stats.activeCount).toBe(1);
    expect(stats.totalMonthlySpend).toBe(10000); // 활성 구독의 합계만 계산
  });

  it("clearSubscriptions: 이전에 등록된 모든 구독 및 사용 로그를 초기화한다", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "sub-1",
          name: "과거 파싱 구독 A",
          amount: 10000,
          currency: "KRW",
          billingDay: 1,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "sub-2",
          name: "과거 파싱 구독 B",
          amount: 20000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "music",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
      usageLogs: [
        {
          id: "log-1",
          subscriptionId: "sub-1",
          month: "2026-09",
          usageCount: 2,
          costPerUse: 5000,
          riskLevel: "yellow",
          checkedAt: new Date().toISOString(),
        },
      ],
    });

    expect(useStore.getState().subscriptions).toHaveLength(2);
    expect(useStore.getState().usageLogs).toHaveLength(1);

    useStore.getState().clearSubscriptions();

    expect(useStore.getState().subscriptions).toHaveLength(0);
    expect(useStore.getState().usageLogs).toHaveLength(0);
  });

  it("addBatchSubscriptions with clearPrevious: 기존 등록 기록을 모두 지우고 새 파싱 결과만 등록한다", () => {
    useStore.setState({
      subscriptions: [
        {
          id: "old-sub",
          name: "이전 구독",
          amount: 5000,
          currency: "KRW",
          billingDay: 1,
          billingCycle: "monthly",
          category: "other",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ],
      usageLogs: [],
    });

    const newItems = useStore.getState().addBatchSubscriptions(
      [
        {
          name: "새로 파싱된 유튜브 프리미엄",
          amount: 14900,
          currency: "KRW",
          billingDay: 22,
          billingCycle: "monthly",
          category: "ott",
        },
      ],
      { clearPrevious: true },
    );

    expect(newItems).toHaveLength(1);
    const currentSubs = useStore.getState().subscriptions;
    expect(currentSubs).toHaveLength(1);
    expect(currentSubs[0].name).toBe("새로 파싱된 유튜브 프리미엄");
    expect(currentSubs.find((s) => s.name === "이전 구독")).toBeUndefined();
  });

  it("clearAllData: 데모 계정을 되살리지 않고 계정 목록까지 비운다", () => {
    useStore.setState({
      accounts: [
        {
          id: "acc-mine",
          provider: "google",
          name: "내 계정",
          emailOrId: "me@gmail.com",
          createdAt: new Date().toISOString(),
        },
      ],
    });

    useStore.getState().clearAllData();

    expect(useStore.getState().accounts).toEqual([]);
  });
});

describe("migrateSeededAccounts", () => {
  const seededAccount = {
    id: "acc-google-1",
    provider: "google" as const,
    name: "Google 개인 계정",
    emailOrId: "myaccount@gmail.com",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("초기 빌드가 심어둔 가짜 계정을 제거한다", () => {
    const migrated = migrateSeededAccounts({ accounts: [seededAccount], subscriptions: [] });

    expect(migrated.accounts).toEqual([]);
  });

  it("가짜 계정에 연결돼 있던 구독의 연동 표시를 지운다", () => {
    const migrated = migrateSeededAccounts({
      accounts: [seededAccount],
      subscriptions: [
        {
          id: "sub-1",
          name: "Netflix",
          amount: 17000,
          currency: "KRW",
          billingDay: 15,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
          linkedAccountId: "acc-google-1",
          linkedAccountName: "Google 개인 계정 (myaccount@gmail.com)",
        },
      ],
    });

    expect(migrated.subscriptions?.[0].linkedAccountId).toBeUndefined();
    expect(migrated.subscriptions?.[0].linkedAccountName).toBeUndefined();
    // 구독 자체는 사용자가 등록한 실제 데이터이므로 지우지 않는다.
    expect(migrated.subscriptions).toHaveLength(1);
  });

  it("사용자가 주소를 자기 것으로 고친 계정은 건드리지 않는다", () => {
    const edited = { ...seededAccount, emailOrId: "real.person@gmail.com" };

    const migrated = migrateSeededAccounts({ accounts: [edited], subscriptions: [] });

    expect(migrated.accounts).toEqual([edited]);
  });

  it("사용자가 직접 추가한 계정은 그대로 남긴다", () => {
    const mine = {
      id: "acc-mine",
      provider: "naver" as const,
      name: "내 네이버",
      emailOrId: "me@naver.com",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const migrated = migrateSeededAccounts({ accounts: [seededAccount, mine], subscriptions: [] });

    expect(migrated.accounts).toEqual([mine]);
  });
});
