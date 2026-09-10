import { describe, it, expect } from "vitest";
import {
  getActionQueue,
  getNextBillingHint,
  BILLING_SOON_DAYS,
  STALE_CHECK_IN_DAYS,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";

const NOW = new Date("2026-09-10T09:00:00+09:00");
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * MS_PER_DAY).toISOString();
}

/**
 * NOW로부터 `days` 뒤에 결제되는 월간 구독.
 *
 * 기본값으로 요금을 최근에 확인해 둔다. 그러지 않으면 오래된 등록일 때문에
 * 모든 픽스처가 '요금 확인' 대상으로도 걸려, 검사하려는 이유가 가려진다.
 */
function subDueIn(days: number, overrides: Partial<Subscription> = {}): Subscription {
  const due = new Date(NOW.getTime() + days * MS_PER_DAY);
  return {
    id: overrides.id ?? "sub-1",
    name: overrides.name ?? "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: due.getDate(),
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: daysAgo(200),
    lastPriceCheckedAt: daysAgo(5),
    ...overrides,
  };
}

function log(subscriptionId: string, overrides: Partial<UsageLog> = {}): UsageLog {
  return {
    id: `log-${subscriptionId}`,
    subscriptionId,
    month: "2026-09",
    usageCount: 1,
    costPerUse: 17000,
    riskLevel: "red",
    checkedAt: daysAgo(2),
    ...overrides,
  };
}

describe("getActionQueue", () => {
  it("할 일이 없는 구독은 큐에 올리지 않는다", () => {
    // 결제도 멀고, 최근에 체크인했고, 가성비도 괜찮다.
    const sub = subDueIn(20);
    const logs = [log(sub.id, { riskLevel: "green", usageCount: 12, checkedAt: daysAgo(1) })];
    expect(getActionQueue([sub], logs, NOW)).toEqual([]);
  });

  it("해지된 구독은 큐에 올리지 않는다", () => {
    const sub = subDueIn(1, { status: "killed" });
    expect(getActionQueue([sub], [], NOW)).toEqual([]);
  });

  it("결제 임박 + 위험이 가장 급하다", () => {
    const sub = subDueIn(3);
    const [item] = getActionQueue([sub], [log(sub.id)], NOW);
    expect(item.kind).toBe("billing-soon-risky");
    expect(item.priority).toBe(1);
    expect(item.verb).toBe("cancel-guide");
  });

  it("결제 임박 항목은 이번에 빠져나갈 내 몫을 알려준다", () => {
    const sub = subDueIn(3);
    const [item] = getActionQueue([sub], [log(sub.id)], NOW);
    expect(item.amountAtStake).toBe(17000);
    expect(item.reason).toContain("₩17,000");
  });

  it("공유 구독은 내 몫만 걸린 금액으로 센다", () => {
    const sub = subDueIn(3, { sharingCount: 4 });
    const [item] = getActionQueue([sub], [log(sub.id)], NOW);
    expect(item.amountAtStake).toBe(17000 / 4);
  });

  it("연간 플랜은 이번 결제에 연 결제액이 통째로 나간다", () => {
    const due = new Date(NOW.getTime() + 3 * MS_PER_DAY);
    const sub = subDueIn(3, {
      billingCycle: "yearly",
      billingMonth: due.getMonth() + 1,
      amount: 120000,
    });
    const [item] = getActionQueue([sub], [], NOW);
    expect(item.amountAtStake).toBe(120000);
  });

  it(`D-${BILLING_SOON_DAYS}까지는 임박, 그 너머는 아니다`, () => {
    const inside = subDueIn(BILLING_SOON_DAYS, { id: "inside" });
    const outside = subDueIn(BILLING_SOON_DAYS + 3, { id: "outside" });
    const logs = [
      log("inside", { riskLevel: "green", usageCount: 10, checkedAt: daysAgo(1) }),
      log("outside", { riskLevel: "green", usageCount: 10, checkedAt: daysAgo(1) }),
    ];
    const kinds = getActionQueue([inside, outside], logs, NOW).map((i) => [
      i.subscriptionId,
      i.kind,
    ]);
    expect(kinds).toEqual([["inside", "billing-soon"]]);
  });

  it("체크인한 적 없는 구독은 판단 근거가 없다고 알린다", () => {
    const sub = subDueIn(20);
    const [item] = getActionQueue([sub], [], NOW);
    expect(item.kind).toBe("never-checked-in");
    expect(item.verb).toBe("check-in");
  });

  it(`체크인이 ${STALE_CHECK_IN_DAYS}일을 넘기면 낡은 것으로 본다`, () => {
    const sub = subDueIn(20);
    const logs = [
      log(sub.id, {
        riskLevel: "green",
        usageCount: 10,
        checkedAt: daysAgo(STALE_CHECK_IN_DAYS + 5),
      }),
    ];
    const [item] = getActionQueue([sub], logs, NOW);
    expect(item.kind).toBe("stale-check-in");
    expect(item.reason).toContain(`${STALE_CHECK_IN_DAYS + 5}일 전`);
  });

  it("가장 최근 체크인만 본다", () => {
    const sub = subDueIn(20);
    const logs = [
      log(sub.id, { id: "old", riskLevel: "red", checkedAt: daysAgo(40) }),
      log(sub.id, { id: "new", riskLevel: "green", usageCount: 12, checkedAt: daysAgo(1) }),
    ];
    expect(getActionQueue([sub], logs, NOW)).toEqual([]);
  });

  it("요금 확인이 필요하면 큐에 올린다", () => {
    // 확인해 준 적이 없고 등록한 지 오래됐다.
    const sub = subDueIn(20, { lastPriceCheckedAt: undefined, createdAt: daysAgo(200) });
    const logs = [log(sub.id, { riskLevel: "green", usageCount: 12, checkedAt: daysAgo(1) })];
    const [item] = getActionQueue([sub], logs, NOW);
    expect(item.kind).toBe("price-check");
    expect(item.verb).toBe("confirm-price");
    // 넷플릭스 프리셋 기준 요금이 함께 실려, '최신 요금으로 갱신'을 그릴 수 있다.
    expect(item.presetAmount).toBe(17000);
  });

  it("비교할 프리셋이 없으면 갱신할 기준 요금도 주지 않는다", () => {
    const sub = subDueIn(20, {
      name: "동네 필라테스",
      amount: 120000,
      lastPriceCheckedAt: undefined,
      createdAt: daysAgo(200),
    });
    const logs = [log(sub.id, { riskLevel: "green", usageCount: 12, checkedAt: daysAgo(1) })];
    const [item] = getActionQueue([sub], logs, NOW);
    expect(item.kind).toBe("price-check");
    expect(item.presetAmount).toBeNull();
  });

  it("요금 확인이 아닌 항목에는 기준 요금을 달지 않는다", () => {
    const sub = subDueIn(3);
    expect(getActionQueue([sub], [log(sub.id)], NOW)[0].presetAmount).toBeNull();
  });

  it("더 급한 이유가 있으면 요금 확인은 밀린다", () => {
    const sub = subDueIn(2, { lastPriceCheckedAt: undefined, createdAt: daysAgo(200) });
    const logs = [log(sub.id, { riskLevel: "green", usageCount: 12, checkedAt: daysAgo(1) })];
    expect(getActionQueue([sub], logs, NOW)[0].kind).toBe("billing-soon");
  });

  it("결제 월을 모르는 연간 구독은 계산할 수 없다고 알린다", () => {
    const sub = subDueIn(5, { billingCycle: "yearly", billingMonth: undefined, amount: 120000 });
    const [item] = getActionQueue([sub], [], NOW);
    expect(item.kind).toBe("missing-billing-month");
    expect(item.verb).toBe("set-billing-month");
    // 날짜를 모르므로 "끊으면 얼마를 지킨다"고 말하지 않는다.
    expect(item.daysUntilBilling).toBeNull();
    expect(item.amountAtStake).toBeNull();
  });

  it("한 구독은 가장 급한 이유 하나로만 올라온다", () => {
    const sub = subDueIn(2);
    const items = getActionQueue([sub], [log(sub.id)], NOW);
    expect(items).toHaveLength(1);
  });

  it("급한 순으로 정렬하고, 같은 급함이면 결제가 가까운 쪽이 먼저다", () => {
    const risky = subDueIn(2, { id: "risky", name: "위험" });
    const soonFar = subDueIn(6, { id: "soon-far", name: "임박-멂" });
    const soonNear = subDueIn(1, { id: "soon-near", name: "임박-가까움" });
    const never = subDueIn(25, { id: "never", name: "체크인없음" });

    const logs = [
      log("risky"),
      log("soon-far", { riskLevel: "green", usageCount: 10, checkedAt: daysAgo(1) }),
      log("soon-near", { riskLevel: "green", usageCount: 10, checkedAt: daysAgo(1) }),
    ];

    const order = getActionQueue([never, soonFar, risky, soonNear], logs, NOW).map(
      (i) => i.subscriptionId,
    );
    expect(order).toEqual(["risky", "soon-near", "soon-far", "never"]);
  });

  it("USD 구독은 넘겨준 환율로 환산한다", () => {
    const sub = subDueIn(3, { currency: "USD", amount: 10 });
    const [withRate] = getActionQueue([sub], [], NOW, 1400);
    expect(withRate.amountAtStake).toBe(14000);
  });
});

describe("getNextBillingHint", () => {
  it("결제일을 아는 활성 구독 중 가장 가까운 것을 알려준다", () => {
    const near = subDueIn(4, { id: "near", name: "가까움" });
    const far = subDueIn(20, { id: "far", name: "멂" });
    expect(getNextBillingHint([far, near], NOW)).toEqual({
      name: "가까움",
      daysUntilBilling: 4,
    });
  });

  it("해지된 구독은 세지 않는다", () => {
    const killed = subDueIn(1, { id: "killed", status: "killed" });
    const active = subDueIn(10, { id: "active", name: "활성" });
    expect(getNextBillingHint([killed, active], NOW)?.name).toBe("활성");
  });

  it("결제일을 아는 구독이 하나도 없으면 null이다", () => {
    const unknown = subDueIn(5, { billingCycle: "yearly", billingMonth: undefined });
    expect(getNextBillingHint([unknown], NOW)).toBeNull();
    expect(getNextBillingHint([], NOW)).toBeNull();
  });
});
