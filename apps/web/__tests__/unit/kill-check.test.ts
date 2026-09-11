import { describe, it, expect, beforeEach } from "vitest";
import {
  formatKillCheckDate,
  getActionQueue,
  getFirstBillingDateAfterKill,
  getKillCheckStatus,
  getMyMonthDefendedAmountKRW,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { useStore } from "../../lib/store";

/** 현지 시각 정오. 표준시가 달라도 날짜가 밀리지 않게 한다. */
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/** 2026년 9월 5일에 해지한, 매월 15일 결제 넷플릭스. */
function killedSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "killed",
    createdAt: at(2026, 1, 1).toISOString(),
    killedAt: at(2026, 9, 5).toISOString(),
    ...overrides,
  };
}

describe("getFirstBillingDateAfterKill", () => {
  it("결제일 전에 해지하면 그달 결제일", () => {
    expect(getFirstBillingDateAfterKill(killedSub())).toEqual(day(2026, 9, 15));
  });

  it("결제일 당일에 해지하면 그날이 첫 결제일", () => {
    const sub = killedSub({ killedAt: at(2026, 9, 15, 23).toISOString() });
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2026, 9, 15));
  });

  it("방어액 계산과 같은 기준을 쓴다 — 당일 해지는 그 달을 지킨 것으로 세고, 그 달을 확인한다", () => {
    const sub = killedSub({ killedAt: at(2026, 9, 15).toISOString() });
    expect(getMyMonthDefendedAmountKRW(sub, 2026, 9)).toBeGreaterThan(0);
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2026, 9, 15));
  });

  it("결제일 다음 날 해지하면 다음 달 결제일", () => {
    const sub = killedSub({ killedAt: at(2026, 9, 16).toISOString() });
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2026, 10, 15));
  });

  it("매월 1일에 해지해도 전달로 넘어가지 않는다", () => {
    const sub = killedSub({ billingDay: 1, killedAt: at(2026, 10, 1).toISOString() });
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2026, 10, 1));
  });

  it("31일 결제는 30일까지인 달에 말일로 본다", () => {
    const sub = killedSub({ billingDay: 31, killedAt: at(2026, 9, 10).toISOString() });
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2026, 9, 30));
  });

  it("연말에 해지하면 해를 넘긴다", () => {
    const sub = killedSub({ billingDay: 5, killedAt: at(2026, 12, 20).toISOString() });
    expect(getFirstBillingDateAfterKill(sub)).toEqual(day(2027, 1, 5));
  });

  it("연간 구독은 결제 월의 결제일", () => {
    const yearly = { billingCycle: "yearly" as const, billingMonth: 6, amount: 99000 };
    expect(
      getFirstBillingDateAfterKill(
        killedSub({ ...yearly, killedAt: at(2026, 3, 1).toISOString() }),
      ),
    ).toEqual(day(2026, 6, 15));
    expect(
      getFirstBillingDateAfterKill(
        killedSub({ ...yearly, killedAt: at(2026, 7, 1).toISOString() }),
      ),
    ).toEqual(day(2027, 6, 15));
  });

  it("날짜를 정할 수 없으면 null — 짐작하지 않는다", () => {
    expect(
      getFirstBillingDateAfterKill(killedSub({ billingCycle: "yearly", billingMonth: undefined })),
    ).toBeNull();
    expect(getFirstBillingDateAfterKill(killedSub({ killedAt: undefined }))).toBeNull();
    expect(getFirstBillingDateAfterKill(killedSub({ killedAt: "not-a-date" }))).toBeNull();
  });
});

describe("getKillCheckStatus", () => {
  it("해지하지 않은 구독에는 묻지 않는다", () => {
    expect(getKillCheckStatus(killedSub({ status: "active" }), at(2026, 9, 20))).toBeNull();
  });

  it("첫 결제일 전에는 기다린다", () => {
    const status = getKillCheckStatus(killedSub(), at(2026, 9, 14));
    expect(status).toEqual({ state: "waiting", billingDate: day(2026, 9, 15) });
  });

  it("결제일 당일에도 묻지 않는다 — 결제 문자가 아직 안 왔을 수 있다", () => {
    expect(getKillCheckStatus(killedSub(), at(2026, 9, 15, 23))?.state).toBe("waiting");
  });

  it("결제일 다음 날부터 묻는다", () => {
    const status = getKillCheckStatus(killedSub(), at(2026, 9, 16, 0));
    expect(status).toEqual({ state: "due", billingDate: day(2026, 9, 15) });
  });

  it("확인해 줬으면 다시 묻지 않는다", () => {
    const sub = killedSub({ killVerifiedAt: at(2026, 9, 17).toISOString() });
    expect(getKillCheckStatus(sub, at(2026, 12, 1))).toEqual({ state: "verified" });
  });

  it("결제 월을 모르는 연간 구독은 판단할 수 없다고 한다", () => {
    const sub = killedSub({ billingCycle: "yearly", billingMonth: undefined });
    expect(getKillCheckStatus(sub, at(2026, 12, 1))).toEqual({ state: "unknown" });
  });
});

describe("formatKillCheckDate", () => {
  it("올해면 월·일만, 아니면 연도를 붙인다", () => {
    expect(formatKillCheckDate(day(2026, 9, 15), at(2026, 9, 20))).toBe("9월 15일");
    expect(formatKillCheckDate(day(2026, 12, 5), at(2027, 1, 10))).toBe("2026년 12월 5일");
  });
});

describe("행동 큐의 해지 확인", () => {
  const NOW = at(2026, 9, 20, 9);

  it("첫 결제일이 지난 해지는 결제가 됐는지 묻는다", () => {
    const [item] = getActionQueue([killedSub()], [], NOW);
    expect(item.kind).toBe("verify-kill");
    expect(item.verb).toBe("verify-kill");
    expect(item.reason).toContain("9월 15일");
    // 카드에 찍히는 것은 전체 금액이다.
    expect(item.reason).toContain("₩17,000");
    expect(item.daysUntilBilling).toBeNull();
  });

  it("공유 구독도 카드에 찍히는 전체 금액으로 묻는다", () => {
    const [item] = getActionQueue([killedSub({ sharingCount: 4 })], [], NOW);
    expect(item.reason).toContain("₩17,000");
  });

  it("첫 결제일 전이거나 이미 확인한 해지는 올리지 않는다", () => {
    expect(getActionQueue([killedSub()], [], at(2026, 9, 10))).toEqual([]);
    expect(
      getActionQueue([killedSub({ killVerifiedAt: at(2026, 9, 16).toISOString() })], [], NOW),
    ).toEqual([]);
  });

  it("결제 임박 다음, 가성비 위험보다 앞에 온다", () => {
    const recent = at(2026, 9, 15).toISOString();
    const soon: Subscription = {
      ...killedSub({ id: "soon", name: "유튜브", status: "active", killedAt: undefined }),
      billingDay: 23,
      lastPriceCheckedAt: recent,
    };
    const risky: Subscription = {
      ...killedSub({ id: "risky", name: "멜론", status: "active", killedAt: undefined }),
      billingDay: 10,
      lastPriceCheckedAt: recent,
    };
    const riskyLog: UsageLog = {
      id: "log-risky",
      subscriptionId: "risky",
      month: "2026-09",
      usageCount: 1,
      costPerUse: 17000,
      riskLevel: "red",
      checkedAt: recent,
    };

    const kinds = getActionQueue([risky, killedSub(), soon], [riskyLog], NOW).map((i) => i.kind);
    expect(kinds).toEqual(["billing-soon", "verify-kill", "risky"]);
  });
});

describe("스토어의 해지 확인 기록", () => {
  beforeEach(() => {
    useStore.setState({ subscriptions: [], usageLogs: [] });
  });

  it("해지한 구독에 확인 시각을 남긴다", () => {
    useStore.setState({ subscriptions: [killedSub()] });
    useStore.getState().confirmKillVerified("netflix");
    expect(useStore.getState().subscriptions[0].killVerifiedAt).toBeDefined();
  });

  it("해지하지 않은 구독에는 남기지 않는다", () => {
    useStore.setState({ subscriptions: [killedSub({ status: "active", killedAt: undefined })] });
    useStore.getState().confirmKillVerified("netflix");
    expect(useStore.getState().subscriptions[0].killVerifiedAt).toBeUndefined();
  });

  it("다시 해지하면 이전 확인을 지운다", () => {
    const verified = killedSub({ killVerifiedAt: at(2026, 9, 16).toISOString() });
    useStore.setState({ subscriptions: [verified] });
    useStore.getState().killSubscription("netflix");
    expect(useStore.getState().subscriptions[0].killVerifiedAt).toBeUndefined();
  });

  it("되살리면 확인도 지운다", () => {
    const verified = killedSub({ killVerifiedAt: at(2026, 9, 16).toISOString() });
    useStore.setState({ subscriptions: [verified] });
    useStore.getState().reviveSubscription("netflix");
    const [sub] = useStore.getState().subscriptions;
    expect(sub.status).toBe("active");
    expect(sub.killVerifiedAt).toBeUndefined();
  });
});
