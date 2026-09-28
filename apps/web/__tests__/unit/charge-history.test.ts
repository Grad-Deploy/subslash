import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_CHARGE_HISTORY,
  chargeHistoryTarget,
  mergeChargeHistory,
  parseReceiptEmails,
  type Subscription,
} from "@subslash/shared";
import { useStore } from "@lib/store";

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("mergeChargeHistory", () => {
  it("날짜별로 합치고 이른 순으로 두며, 같은 날은 새로 온 쪽을 쓴다", () => {
    expect(
      mergeChargeHistory(
        [
          { date: "2026-08-15", amount: 17000 },
          { date: "2026-06-15", amount: 13500 },
        ],
        [
          { date: "2026-08-15", amount: 17500 },
          { date: "2026-07-15", amount: 13500 },
        ],
      ),
    ).toEqual([
      { date: "2026-06-15", amount: 13500 },
      { date: "2026-07-15", amount: 13500 },
      { date: "2026-08-15", amount: 17500 },
    ]);
  });

  it("형식이 틀린 줄은 버리고, 넘치면 오래된 것부터 버린다", () => {
    expect(
      mergeChargeHistory(
        [
          { date: "2026.08.15", amount: 17000 },
          { date: "2026-02-30", amount: 17000 },
          { date: "2026-08-15", amount: 0 },
        ],
        undefined,
      ),
    ).toEqual([]);

    const many = Array.from({ length: MAX_CHARGE_HISTORY + 5 }, (_, i) => ({
      date: new Date(Date.UTC(2020, i, 1)).toISOString().slice(0, 10),
      amount: 1000,
    }));
    const merged = mergeChargeHistory(many, []);
    expect(merged).toHaveLength(MAX_CHARGE_HISTORY);
    expect(merged[0].date).toBe(many[5].date);
  });
});

describe("chargeHistoryTarget", () => {
  it("같은 서비스 중 구독 중인 것, 없으면 가장 늦게 등록한 해지 구독을 고른다", () => {
    const old = sub({ id: "old", status: "killed", createdAt: "2025-01-01T00:00:00.000Z" });
    const later = sub({ id: "later", status: "killed", createdAt: "2026-01-01T00:00:00.000Z" });
    const active = sub({ id: "active", name: " 넷플릭스 " });
    const found = { name: "넷플릭스", currency: "KRW" as const };

    expect(chargeHistoryTarget([old, later, active], found)?.id).toBe("active");
    expect(chargeHistoryTarget([old, later], found)?.id).toBe("later");
    expect(chargeHistoryTarget([old], { name: "넷플릭스", currency: "USD" })).toBeNull();
  });
});

describe("parseReceiptEmails — 이전 결제 메일", () => {
  const NOW = new Date("2026-09-15T03:00:00.000Z");
  const netflix = (date: string, body = "결제금액 : 17,000원", subject = "넷플릭스 결제 안내") => ({
    from: "Netflix <info@account.netflix.com>",
    subject,
    body,
    date,
  });

  it("후보는 가장 최근 메일로 하나만 만들고, 이른 영수증은 날짜와 금액만 결제 기록에 남긴다", () => {
    const found = parseReceiptEmails(
      [
        netflix("2026-07-10T03:00:00.000Z", "결제금액 : 13,500원"),
        netflix("2026-09-10T03:00:00.000Z"),
        netflix("2026-08-10T03:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(found).toHaveLength(1);
    expect(found[0].amount).toBe(17000);
    expect(found[0].receiptDate).toBe("2026.09.10");
    expect(found[0].chargeHistory).toEqual([
      { date: "2026-07-10", amount: 13500 },
      { date: "2026-08-10", amount: 17000 },
      { date: "2026-09-10", amount: 17000 },
    ]);
  });

  it("해지 알림은 결제 기록에 넣지 않는다", () => {
    const [item] = parseReceiptEmails(
      [
        netflix("2026-09-10T03:00:00.000Z", "결제금액 : 17,000원", "넷플릭스 멤버십 해지 완료"),
        netflix("2026-08-10T03:00:00.000Z"),
      ],
      { now: NOW },
    );

    expect(item.isCanceled).toBe(true);
    expect(item.chargeHistory).toEqual([{ date: "2026-08-10", amount: 17000 }]);
  });
});

describe("recordChargeHistory", () => {
  beforeEach(() => {
    useStore.setState({
      demo: null,
      subscriptions: [
        sub({ chargeHistory: [{ date: "2026-06-15", amount: 13500 }] }),
        sub({ id: "tving", name: "티빙" }),
      ],
    } as never);
  });

  it("같은 서비스의 구독에 날짜별로 합쳐 적고, 맞는 구독이 없으면 버린다", () => {
    useStore.getState().recordChargeHistory([
      {
        name: "넷플릭스",
        currency: "KRW",
        chargeHistory: [
          { date: "2026-07-15", amount: 17000 },
          { date: "2026-06-15", amount: 13500 },
        ],
      },
      { name: "왓챠", currency: "KRW", chargeHistory: [{ date: "2026-07-01", amount: 7900 }] },
    ]);

    const [netflix, tving] = useStore.getState().subscriptions;
    expect(netflix.chargeHistory).toEqual([
      { date: "2026-06-15", amount: 13500 },
      { date: "2026-07-15", amount: 17000 },
    ]);
    expect(tving.chargeHistory).toBeUndefined();
    expect(useStore.getState().subscriptions).toHaveLength(2);
  });

  it("체험 중에는 적지 않는다(화면의 목록이 샘플이다)", () => {
    const before = useStore.getState().subscriptions;
    useStore.setState({
      demo: { startedAt: "2026-09-20T00:00:00.000Z", saved: { subscriptions: [], usageLogs: [] } },
    } as never);
    useStore
      .getState()
      .recordChargeHistory([
        { name: "넷플릭스", currency: "KRW", chargeHistory: [{ date: "2026-07-15", amount: 1 }] },
      ]);
    expect(useStore.getState().subscriptions).toBe(before);
  });
});
