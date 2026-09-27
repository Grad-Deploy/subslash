import { describe, it, expect } from "vitest";
import { buildReceipt, previousMonth, type Subscription, type UsageLog } from "@subslash/shared";

// 2026년 9월 27일 오전 9시(기기 시간대).
const NOW = new Date(2026, 8, 27, 9, 0);
const RATE = 1400;
const AUGUST = { kind: "month", year: 2026, month: 8 } as const;
const SEPTEMBER = { kind: "month", year: 2026, month: 9 } as const;

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: overrides.id ?? "sub-1",
    name: "넷플릭스",
    amount: 13500,
    currency: "KRW",
    billingDay: 10,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

function uses(subscriptionId: string, count: number, checkedAt: Date): UsageLog {
  return {
    id: `log-${subscriptionId}-${checkedAt.getTime()}`,
    subscriptionId,
    month: "",
    usageCount: count,
    costPerUse: 13500 / count,
    riskLevel: "yellow",
    checkedAt: checkedAt.toISOString(),
  };
}

describe("buildReceipt — 한 달", () => {
  it("그 달 결제일에 구독 중이던 것을 내 몫으로 적는다", () => {
    const receipt = buildReceipt(
      [sub(), sub({ id: "sub-2", name: "유튜브", amount: 14900, sharingCount: 2 })],
      [],
      AUGUST,
      RATE,
      NOW,
    );
    expect(receipt.isComplete).toBe(true);
    expect(receipt.lines.map((line) => [line.name, line.chargeDates, line.amountKRW])).toEqual([
      ["넷플릭스", ["2026-08-10"], 13500],
      ["유튜브", ["2026-08-10"], 7450],
    ]);
    expect(receipt.totalKRW).toBe(13500 + 7450);
    expect(receipt.billedTotalKRW).toBe(13500 + 14900);
  });

  it("이번 달은 결제일이 지난 것만 적는다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 5 }), sub({ id: "sub-2", name: "왓챠", billingDay: 30 })],
      [],
      SEPTEMBER,
      RATE,
      NOW,
    );
    expect(receipt.isComplete).toBe(false);
    expect(receipt.lines.map((line) => line.name)).toEqual(["넷플릭스"]);
  });

  it("등록 전 결제일·체험 중 결제일·결제 월 모르는 연간 구독은 줄로 만들지 않고 센다", () => {
    const receipt = buildReceipt(
      [
        sub({ createdAt: new Date(2026, 7, 20).toISOString() }),
        sub({ id: "trial", trialEndsAt: "2026-09-01" }),
        sub({ id: "yearly", billingCycle: "yearly", billingMonth: undefined, amount: 99000 }),
      ],
      [],
      AUGUST,
      RATE,
      NOW,
    );
    expect(receipt.lines).toEqual([]);
    expect(receipt.excluded).toEqual({ undated: 1, beforeRegistration: 1, trial: 1 });
  });

  it("연간 구독은 결제 월에만 1년치를 적는다", () => {
    const yearly = sub({ billingCycle: "yearly", billingMonth: 8, amount: 120000 });
    expect(buildReceipt([yearly], [], AUGUST, RATE, NOW).totalKRW).toBe(120000);
    expect(buildReceipt([yearly], [], SEPTEMBER, RATE, NOW).lines).toEqual([]);
  });

  it("결제일 전에 해지한 구독은 청구 대신 지킨 돈으로 센다", () => {
    const receipt = buildReceipt(
      [sub({ status: "killed", killedAt: new Date(2026, 7, 3, 12).toISOString() })],
      [],
      AUGUST,
      RATE,
      NOW,
    );
    expect(receipt.lines).toEqual([]);
    expect(receipt.defendedKRW).toBe(13500);
    expect(receipt.killed.map((k) => k.killedOn)).toEqual(["2026-08-03"]);
  });

  it("결제일 뒤에 해지했으면 그 달은 청구됐다", () => {
    const receipt = buildReceipt(
      [sub({ status: "killed", killedAt: new Date(2026, 7, 20, 12).toISOString() })],
      [],
      AUGUST,
      RATE,
      NOW,
    );
    expect(receipt.lines[0]).toMatchObject({ killedOn: "2026-08-20", amountKRW: 13500 });
    expect(receipt.defendedKRW).toBe(0);
  });

  it("아직 오지 않은 결제일의 방어액은 이번 달 영수증에 넣지 않는다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 30, status: "killed", killedAt: new Date(2026, 8, 1).toISOString() })],
      [],
      SEPTEMBER,
      RATE,
      NOW,
    );
    expect(receipt.defendedKRW).toBe(0);
  });

  it("그 달의 마지막 횟수 체크인으로 1회 단가를 적고, 없으면 모른다고 둔다", () => {
    const receipt = buildReceipt(
      [sub(), sub({ id: "sub-2", name: "왓챠" })],
      [uses("sub-1", 3, new Date(2026, 7, 15)), uses("sub-1", 5, new Date(2026, 7, 25))],
      AUGUST,
      RATE,
      NOW,
    );
    const netflix = receipt.lines.find((line) => line.subscriptionId === "sub-1");
    const watcha = receipt.lines.find((line) => line.subscriptionId === "sub-2");
    expect(netflix?.usage).toMatchObject({ count: 5, costPerUseKRW: 13500 / 5 });
    expect(watcha?.usage).toBeNull();
    // 비교할 체크인이 하나뿐이면 '가장 비싼 1회'를 말하지 않는다.
    expect(receipt.priciestPerUse).toBeNull();
  });

  it("달러 구독은 사용자 환율로 원 환산한다", () => {
    const receipt = buildReceipt(
      [sub({ currency: "USD", amount: 20, taxRate: 10 })],
      [],
      AUGUST,
      RATE,
      NOW,
    );
    expect(receipt.totalKRW).toBe(22 * RATE);
  });
});

describe("buildReceipt — 한 해", () => {
  it("오늘까지 결제일마다 한 번씩 적는다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 5 })],
      [],
      { kind: "year", year: 2026 },
      RATE,
      NOW,
    );
    expect(receipt.isComplete).toBe(false);
    expect(receipt.lines[0].chargeDates).toHaveLength(9);
    expect(receipt.totalKRW).toBe(13500 * 9);
  });
});

describe("previousMonth", () => {
  it("1월이면 지난해 12월이다", () => {
    expect(previousMonth(new Date(2027, 0, 3))).toEqual({ year: 2026, month: 12 });
  });
});
