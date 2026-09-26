import { describe, it, expect, beforeEach } from "vitest";
import {
  useStore,
  migrateSeededAccounts,
  migrateLegacyCancelUrls,
  migrateRetiredCategories,
  mergePersistedState,
  isValidExchangeRate,
  isDemoExpired,
  realRecords,
  toPersistedState,
  DEFAULT_EXCHANGE_RATE_SETTING,
} from "../../lib/store";
import {
  DEFAULT_EXCHANGE_RATE,
  DEMO_SUBSCRIPTIONS,
  type Subscription,
  type SubscriptionFormData,
  type UsageLog,
} from "@subslash/shared";

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

  describe("해지 목록 정리(앱)", () => {
    const base = {
      amount: 9900,
      currency: "KRW" as const,
      billingDay: 3,
      billingCycle: "monthly" as const,
      category: "ott",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    beforeEach(() => {
      useStore.setState({
        subscriptions: [
          {
            ...base,
            id: "k1",
            name: "넷플릭스",
            status: "killed",
            killedAt: "2026-06-03T00:00:00.000Z",
          },
          {
            ...base,
            id: "k2",
            name: "디즈니+",
            status: "killed",
            killedAt: "2026-07-12T00:00:00.000Z",
          },
          { ...base, id: "a1", name: "왓챠", status: "active" },
        ] as Subscription[],
        usageLogs: [
          {
            id: "l1",
            subscriptionId: "k2",
            month: "2026-06",
            usageCount: 1,
            costPerUse: 9900,
            riskLevel: "red",
            checkedAt: "2026-06-01T00:00:00.000Z",
          },
        ] as UsageLog[],
      });
    });

    it("숨기기는 해지한 구독만 숨기고, 해지 기록(절약 현황)은 그대로 둔다", () => {
      useStore.getState().hideSubscriptions(["k1", "a1"]);
      const subs = useStore.getState().subscriptions;
      expect(subs.find((s) => s.id === "k1")?.hiddenAt).toBeDefined();
      expect(subs.find((s) => s.id === "k1")?.killedAt).toBe("2026-06-03T00:00:00.000Z");
      // 구독 중인 것은 숨기지 않는다 — 목록에서 사라지면 결제를 놓친다.
      expect(subs.find((s) => s.id === "a1")?.hiddenAt).toBeUndefined();

      useStore.getState().unhideSubscriptions(["k1"]);
      expect(
        useStore.getState().subscriptions.find((s) => s.id === "k1")?.hiddenAt,
      ).toBeUndefined();
    });

    it("여러 개 삭제는 체크인 기록까지 함께 지운다", () => {
      useStore.getState().deleteSubscriptions(["k1", "k2"]);
      const state = useStore.getState();
      expect(state.subscriptions.map((s) => s.id)).toEqual(["a1"]);
      expect(state.usageLogs).toHaveLength(0);
    });

    it("숨긴 구독을 되살리면 숨김도 풀린다", () => {
      useStore.getState().hideSubscriptions(["k1"]);
      useStore.getState().reviveSubscription("k1");
      const sub = useStore.getState().subscriptions.find((s) => s.id === "k1");
      expect(sub?.status).toBe("active");
      expect(sub?.hiddenAt).toBeUndefined();
    });
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

describe("환율 설정", () => {
  beforeEach(() => {
    useStore.setState({
      subscriptions: [],
      usageLogs: [],
      exchangeRate: DEFAULT_EXCHANGE_RATE_SETTING,
    });
  });

  it("아무도 설정하지 않았으면 기본 환율을 쓴다", () => {
    expect(useStore.getState().getExchangeRate()).toBe(DEFAULT_EXCHANGE_RATE);
  });

  it("사용자가 정한 환율을 출처·시각과 함께 기록한다", () => {
    useStore.getState().setExchangeRate(1420, "manual");

    const { exchangeRate, getExchangeRate } = useStore.getState();
    expect(getExchangeRate()).toBe(1420);
    expect(exchangeRate.source).toBe("manual");
    expect(exchangeRate.updatedAt).not.toBeNull();
  });

  it("쓸 수 없는 값은 무시해 기존 환율을 유지한다", () => {
    useStore.getState().setExchangeRate(1420, "manual");
    useStore.getState().setExchangeRate(0, "manual");
    useStore.getState().setExchangeRate(Number.NaN, "ecb");

    expect(useStore.getState().getExchangeRate()).toBe(1420);
  });

  it("기본값으로 되돌리면 다시 기본 환율을 쓴다", () => {
    useStore.getState().setExchangeRate(1420, "ecb");
    useStore.getState().resetExchangeRate();

    expect(useStore.getState().getExchangeRate()).toBe(DEFAULT_EXCHANGE_RATE);
    expect(useStore.getState().exchangeRate.source).toBe("default");
  });

  it("대시보드 합계가 설정된 환율로 환산된다", () => {
    useStore.getState().addSubscription({
      name: "Claude Pro",
      amount: 20,
      currency: "USD",
      billingDay: 10,
      billingCycle: "monthly",
      category: "ai",
    });

    expect(useStore.getState().getDashboardStats().totalMonthlySpend).toBe(
      20 * DEFAULT_EXCHANGE_RATE,
    );

    useStore.getState().setExchangeRate(1420, "manual");

    expect(useStore.getState().getDashboardStats().totalMonthlySpend).toBe(20 * 1420);
  });

  it("isValidExchangeRate가 총액을 망가뜨릴 값을 거른다", () => {
    expect(isValidExchangeRate(1350)).toBe(true);
    expect(isValidExchangeRate(0)).toBe(false);
    expect(isValidExchangeRate(-1)).toBe(false);
    expect(isValidExchangeRate(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidExchangeRate(100001)).toBe(false);
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

describe("migrateRetiredCategories", () => {
  const subIn = (id: string, category: string) =>
    ({
      id,
      name: "동네 헬스장",
      amount: 60000,
      currency: "KRW" as const,
      billingDay: 5,
      billingCycle: "monthly" as const,
      category,
      status: "active" as const,
      createdAt: "2026-01-01T00:00:00.000Z",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 지금은 없는 분류로 저장된 옛 기록을 흉내 낸다.
    }) as any;

  it("없앤 분류로 저장된 구독을 '기타'로 옮긴다", () => {
    // 분류를 목록에서 빼기만 하면 이 구독은 '내 구독'의 어느 칩으로도 걸러지지 않는다.
    const migrated = migrateRetiredCategories({
      subscriptions: [subIn("sub-1", "fitness"), subIn("sub-2", "news")],
    });

    expect(migrated.subscriptions?.map((sub) => sub.category)).toEqual(["other", "other"]);
  });

  it("옮기면서 구독의 다른 값은 건드리지 않는다", () => {
    const before = subIn("sub-3", "fitness");

    const after = migrateRetiredCategories({ subscriptions: [before] }).subscriptions?.[0];

    expect(after).toEqual({ ...before, category: "other" });
  });

  it("지금 쓰는 분류는 그대로 둔다", () => {
    const kept = subIn("sub-4", "ott");

    const migrated = migrateRetiredCategories({ subscriptions: [kept] });

    expect(migrated.subscriptions).toEqual([kept]);
  });

  it("저장소를 불러올 때마다 적용된다", () => {
    const merged = mergePersistedState(
      { subscriptions: [subIn("sub-5", "news")] },
      useStore.getState(),
    );

    expect(merged.subscriptions[0].category).toBe("other");
  });
});

describe("migrateLegacyCancelUrls", () => {
  const subWith = (id: string, cancelUrl?: string) => ({
    id,
    name: "멜론",
    amount: 10900,
    currency: "KRW" as const,
    billingDay: 12,
    billingCycle: "monthly" as const,
    category: "music" as const,
    status: "active" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    cancelUrl,
  });

  it("예전 프리셋 주소로 저장된 구독의 해지 링크를 지금 주소로 바꾼다", () => {
    // 멜론의 옛 해지 주소는 404다. 프리셋만 고치면 이미 등록한 구독은 계속 404를 연다.
    const migrated = migrateLegacyCancelUrls({
      subscriptions: [subWith("sub-1", "https://member.melon.com/pay/charge/payCancel.htm")],
    });

    expect(migrated.subscriptions?.[0].cancelUrl).toBe("https://www.melon.com/");
  });

  it("사용자가 적은 주소와 링크가 없는 구독은 그대로 둔다", () => {
    const typed = subWith("sub-2", "https://my.melon.example/cancel");
    const none = subWith("sub-3");

    const migrated = migrateLegacyCancelUrls({ subscriptions: [typed, none] });

    expect(migrated.subscriptions).toEqual([typed, none]);
  });

  it("저장소를 불러올 때마다 적용된다", () => {
    // 버전을 올려야만 도는 migrate가 아니라 merge에 걸어 두었다. 앞으로 옛 주소를
    // 프리셋에 더하기만 하면 기존 구독도 따라 바뀐다.
    const merged = mergePersistedState(
      { subscriptions: [subWith("sub-4", "https://chat.openai.com/")] },
      useStore.getState(),
    );

    expect(merged.subscriptions[0].cancelUrl).toBe("https://chatgpt.com/");
  });
});

describe("체크인 1회 단가", () => {
  beforeEach(() => {
    useStore.setState({ subscriptions: [], usageLogs: [] });
  });

  function addAndCheckIn(data: SubscriptionFormData, count: number) {
    const sub = useStore.getState().addSubscription(data);
    return useStore.getState().checkIn(sub.id, count);
  }

  it("월간 구독은 결제액을 사용 횟수로 나눈다", () => {
    const result = addAndCheckIn(
      {
        name: "넷플릭스",
        amount: 17000,
        currency: "KRW",
        billingDay: 15,
        billingCycle: "monthly",
        category: "ott",
      },
      2,
    );

    expect(result.costPerUse).toBe(8500);
  });

  it("연간 구독은 한 달치로 나눈다", () => {
    // 체크인은 '지난 30일 동안 몇 번'을 묻는다. 연 결제액을 그대로 나누면
    // 1회 단가가 12배로 나온다.
    const result = addAndCheckIn(
      {
        name: "노션",
        amount: 120000,
        currency: "KRW",
        billingDay: 3,
        billingCycle: "yearly",
        billingMonth: 6,
        category: "ai",
      },
      2,
    );

    expect(result.costPerUse).toBe(5000);
    expect(result.shockMessage).toContain("₩5,000");
  });

  it("나눠 쓰는 구독은 내 몫으로만 계산한다", () => {
    const result = addAndCheckIn(
      {
        name: "유튜브 프리미엄",
        amount: 14900,
        currency: "KRW",
        billingDay: 10,
        billingCycle: "monthly",
        category: "ott",
        sharingCount: 4,
      },
      1,
    );

    expect(result.costPerUse).toBe(3725);
  });
});

describe("Store addBatchSubscriptions", () => {
  beforeEach(() => {
    useStore.setState({ subscriptions: [], usageLogs: [] });
  });

  it("여러 구독을 한 번에 일괄 추가하고 고유 ID를 부여한다", () => {
    const newSubs = useStore.getState().addBatchSubscriptions([
      {
        name: "서비스 A",
        amount: 10000,
        currency: "KRW",
        billingDay: 5,
        billingCycle: "monthly",
        category: "ott",
      },
      {
        name: "서비스 B",
        amount: 20000,
        currency: "KRW",
        billingDay: 15,
        billingCycle: "monthly",
        category: "music",
      },
    ]);

    expect(newSubs).toHaveLength(2);
    expect(newSubs[0].id).toBeDefined();
    expect(newSubs[1].id).toBeDefined();
    expect(newSubs[0].id).not.toBe(newSubs[1].id);

    const storeSubs = useStore.getState().subscriptions;
    expect(storeSubs).toHaveLength(2);
    expect(useStore.getState().getDashboardStats().totalMonthlySpend).toBe(30000);
  });
});

describe("샘플 체험", () => {
  const real: Subscription = {
    id: "real-1",
    name: "내 노션",
    amount: 16800,
    currency: "KRW",
    billingDay: 5,
    billingCycle: "monthly",
    category: "other",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    linkedAccountId: "acc-1",
    linkedAccountName: "내 구글 (me@gmail.com)",
  };
  const realLog: UsageLog = {
    id: "log-1",
    subscriptionId: "real-1",
    month: "2026-09",
    usageCount: 3,
    costPerUse: 5600,
    riskLevel: "yellow",
    checkedAt: "2026-09-01T00:00:00.000Z",
  };
  /** localStorage에 쓰일 모양(persist의 partialize와 같은 함수). */
  const persisted = () => toPersistedState(useStore.getState());
  const sampleNames = DEMO_SUBSCRIPTIONS.map((item) => item.name);

  beforeEach(() => {
    useStore.setState({ subscriptions: [real], usageLogs: [realLog], accounts: [], demo: null });
  });

  it("체험을 시작하면 화면에는 샘플만 보이고, 저장소에는 실제 기록만 남는다", () => {
    useStore.getState().startDemo();
    const state = useStore.getState();
    expect(state.subscriptions.map((sub) => sub.name)).toEqual(sampleNames);
    expect(state.usageLogs).toEqual([]);
    expect(persisted().subscriptions).toEqual([real]);
    expect(persisted().usageLogs).toEqual([realLog]);
  });

  it("체험 중의 체크인·해지는 샘플에만 남고, 끝내면 실제 기록이 그대로 돌아온다", () => {
    useStore.getState().startDemo();
    const sample = useStore.getState().subscriptions[0];
    useStore.getState().checkIn(sample.id, 2);
    useStore.getState().killSubscription(sample.id);
    expect(persisted().subscriptions).toEqual([real]);
    expect(persisted().usageLogs).toEqual([realLog]);

    useStore.getState().endDemo();
    const state = useStore.getState();
    expect(state.demo).toBeNull();
    expect(state.subscriptions).toEqual([real]);
    expect(state.usageLogs).toEqual([realLog]);
  });

  it("두 번 눌러도 샘플이 겹치지 않고, 보관한 실제 기록이 샘플로 바뀌지 않는다", () => {
    useStore.getState().startDemo();
    useStore.getState().startDemo();
    expect(useStore.getState().subscriptions).toHaveLength(sampleNames.length);
    useStore.getState().endDemo();
    expect(useStore.getState().subscriptions).toEqual([real]);
  });

  it("체험 중에 등록하면 체험을 끝내고 실제 목록에 더한다", () => {
    useStore.getState().startDemo();
    useStore.getState().addSubscription({
      name: "새 구독",
      amount: 9900,
      currency: "KRW",
      billingDay: 10,
      billingCycle: "monthly",
      category: "other",
    });
    const state = useStore.getState();
    expect(state.demo).toBeNull();
    expect(state.subscriptions.map((sub) => sub.name)).toEqual(["내 노션", "새 구독"]);
    expect(state.usageLogs).toEqual([realLog]);
  });

  it("체험 중의 전체 초기화는 체험만 끝내고 실제 기록은 지우지 않는다", () => {
    useStore.getState().startDemo();
    useStore.getState().clearSubscriptions();
    expect(useStore.getState().demo).toBeNull();
    expect(useStore.getState().subscriptions).toEqual([real]);
  });

  it("알림 미러·백업이 쓰는 실제 기록은 체험 중에도 실제 기록이다", () => {
    useStore.getState().startDemo();
    expect(realRecords(useStore.getState())).toEqual({
      subscriptions: [real],
      usageLogs: [realLog],
    });
  });

  it("체험 중에 연동 계정을 지우면 보관한 실제 구독에서도 연결을 끊는다", () => {
    useStore.getState().startDemo();
    useStore.getState().deleteAccount("acc-1");
    useStore.getState().endDemo();
    expect(useStore.getState().subscriptions[0].linkedAccountId).toBeUndefined();
  });

  it("체험은 30분이 지나면 끝난 것으로 본다", () => {
    const demo = {
      startedAt: "2026-09-15T10:00:00.000Z",
      saved: { subscriptions: [], usageLogs: [] },
    };
    expect(isDemoExpired(demo, new Date("2026-09-15T10:29:59.000Z"))).toBe(false);
    expect(isDemoExpired(demo, new Date("2026-09-15T10:30:00.000Z"))).toBe(true);
    expect(isDemoExpired({ ...demo, startedAt: "언제" })).toBe(true);
  });
});
