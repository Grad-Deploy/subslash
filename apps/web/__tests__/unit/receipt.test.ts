import { describe, it, expect } from "vitest";
import { buildReceipt, previousMonth, type Subscription, type UsageLog } from "@subslash/shared";
import { describeReceiptLine, receiptFootnotes } from "@lib/receipt-view";
import { messages } from "@lib/i18n/messages";

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

  it("이번 달은 지금 구독 중인 것을 모두 적고, 결제일이 오지 않은 것은 결제 예정으로 둔다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 5 }), sub({ id: "sub-2", name: "왓챠", billingDay: 30 })],
      [],
      SEPTEMBER,
      RATE,
      NOW,
    );
    expect(receipt.isComplete).toBe(false);
    expect(receipt.lines.map((line) => [line.name, line.chargeDates, line.upcomingDates])).toEqual([
      ["넷플릭스", ["2026-09-05"], []],
      ["왓챠", ["2026-09-30"], ["2026-09-30"]],
    ]);
    expect(receipt.upcomingCount).toBe(1);
    expect(receipt.totalKRW).toBe(13500 * 2);
  });

  it("결제일 뒤에 등록한 구독도 등록한 달에는 구독 중이던 것으로 적는다", () => {
    // 9월 27일에 등록한 배민클럽 + 유튜브 프리미엄(결제일 10일). 예전에는 '등록하기 전의 결제일'로 빠졌다.
    const bundle = sub({
      name: "배민클럽 + 유튜브 프리미엄",
      createdAt: new Date(2026, 8, 27, 8).toISOString(),
    });
    const september = buildReceipt([bundle], [], SEPTEMBER, RATE, NOW);
    expect(september.lines.map((line) => [line.name, line.chargeDates])).toEqual([
      ["배민클럽 + 유튜브 프리미엄", ["2026-09-10"]],
    ]);
    expect(september.excluded.beforeRegistration).toBe(0);
    // 등록한 달보다 앞선 달은 구독 중이었는지 모른다.
    const august = buildReceipt([bundle], [], AUGUST, RATE, NOW);
    expect(august.lines).toEqual([]);
    expect(august.excluded.beforeRegistration).toBe(1);
  });

  it("해지한 구독은 결제 예정으로 적지 않는다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 30, status: "killed", killedAt: new Date(2026, 8, 20).toISOString() })],
      [],
      SEPTEMBER,
      RATE,
      NOW,
    );
    expect(receipt.lines).toEqual([]);
    expect(receipt.upcomingCount).toBe(0);
  });

  it("등록한 달보다 앞선 달·체험 중 결제일·결제 월 모르는 연간 구독은 줄로 만들지 않고 센다", () => {
    const receipt = buildReceipt(
      [
        sub({ createdAt: new Date(2026, 8, 2).toISOString() }),
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

  it("이번 달의 결제 예정은 넣고, 다음 달 이후는 넣지 않는다", () => {
    const receipt = buildReceipt(
      [sub({ billingDay: 30 })],
      [],
      { kind: "year", year: 2026 },
      RATE,
      NOW,
    );
    expect(receipt.lines[0].chargeDates).toHaveLength(9); // 1~8월 + 9월 30일(예정)
    expect(receipt.lines[0].upcomingDates).toEqual(["2026-09-30"]);
  });
});

describe("previousMonth", () => {
  it("1월이면 지난해 12월이다", () => {
    expect(previousMonth(new Date(2027, 0, 3))).toEqual({ year: 2026, month: 12 });
  });
});

describe("buildReceipt — 등록하기 전 달의 결제 메일", () => {
  // 9월 5일에 등록했지만 Gmail에서 7·8월 결제 메일을 찾은 넷플릭스. 6월 메일은 없다.
  const imported = (overrides: Partial<Subscription> = {}) =>
    sub({
      createdAt: new Date(2026, 8, 5).toISOString(),
      chargeHistory: [
        { date: "2026-07-10", amount: 12000 },
        { date: "2026-08-10", amount: 13500 },
        { date: "2026-09-10", amount: 13500 },
      ],
      ...overrides,
    });

  it("메일이 있는 달은 그 메일의 날짜와 금액으로 넣는다", () => {
    const august = buildReceipt([imported()], [], AUGUST, RATE, NOW);
    expect(
      august.lines.map((line) => [line.chargeDates, line.evidencedDates, line.amountKRW]),
    ).toEqual([[["2026-08-10"], ["2026-08-10"], 13500]]);
    expect(august.evidencedCount).toBe(1);
    expect(august.excluded.beforeRegistration).toBe(0);

    // 요금이 달랐던 달은 지금 금액이 아니라 그 메일의 금액이다.
    const july = buildReceipt([imported()], [], { kind: "month", year: 2026, month: 7 }, RATE, NOW);
    expect(july.totalKRW).toBe(12000);
  });

  it("메일이 없는 달은 여전히 모른다", () => {
    const june = buildReceipt([imported()], [], { kind: "month", year: 2026, month: 6 }, RATE, NOW);
    expect(june.lines).toEqual([]);
    expect(june.excluded.beforeRegistration).toBe(1);
  });

  it("등록한 달부터는 메일이 아니라 기록으로 계산하고, 한 번만 센다", () => {
    const september = buildReceipt([imported()], [], SEPTEMBER, RATE, NOW);
    expect(september.lines[0].chargeDates).toEqual(["2026-09-10"]);
    expect(september.lines[0].evidencedDates).toEqual([]);

    const year = buildReceipt([imported()], [], { kind: "year", year: 2026 }, RATE, NOW);
    expect(year.lines[0].chargeDates).toEqual(["2026-07-10", "2026-08-10", "2026-09-10"]);
    expect(year.lines[0].evidencedDates).toEqual(["2026-07-10", "2026-08-10"]);
    expect(year.totalKRW).toBe(12000 + 13500 + 13500);
    // 1~6월은 메일이 없어 모른다.
    expect(year.excluded.beforeRegistration).toBe(1);
  });

  it("나눠 내면 메일의 청구액을 지금 나누는 비율로 나눈다", () => {
    const august = buildReceipt([imported({ sharingCount: 2 })], [], AUGUST, RATE, NOW);
    expect(august.lines[0].billedKRW).toBe(13500);
    expect(august.lines[0].amountKRW).toBe(6750);
  });

  it("해지했다가 다시 등록한 서비스는 예전 구독이 센 달을 메일로 한 번 더 세지 않는다", () => {
    const before = sub({
      id: "old",
      createdAt: new Date(2026, 0, 1).toISOString(),
      status: "killed",
      killedAt: new Date(2026, 7, 20).toISOString(),
    });
    const august = buildReceipt([before, imported()], [], AUGUST, RATE, NOW);
    expect(august.lines.map((line) => line.subscriptionId)).toEqual(["old"]);
    expect(august.evidencedCount).toBe(0);
  });

  it("결제 월을 모르는 연간 구독도 메일이 있는 달은 넣는다", () => {
    const goodnotes = sub({
      name: "굿노트",
      amount: 13000,
      billingCycle: "yearly",
      billingMonth: undefined,
      createdAt: new Date(2026, 8, 5).toISOString(),
      chargeHistory: [{ date: "2026-03-12", amount: 13000 }],
    });
    const year = buildReceipt([goodnotes], [], { kind: "year", year: 2026 }, RATE, NOW);
    expect(year.lines.map((line) => [line.chargeDates, line.amountKRW])).toEqual([
      [["2026-03-12"], 13000],
    ]);
    expect(year.excluded.undated).toBe(1);
  });
});

describe("영수증 문구 — 결제 메일로 넣은 줄", () => {
  it("줄에는 메일로 확인했다고, 밑에는 몇 건을 어디서 넣었는지 적는다", () => {
    const shared = sub({
      sharingCount: 2,
      createdAt: new Date(2026, 8, 5).toISOString(),
      chargeHistory: [{ date: "2026-08-10", amount: 13500 }],
    });
    const august = buildReceipt([shared], [], AUGUST, RATE, NOW);
    expect(describeReceiptLine(messages.ko, august.lines[0], AUGUST)).toContain(
      "08.10 결제 · 결제 메일로 확인",
    );
    expect(receiptFootnotes(messages.ko, august)).toContain(
      "등록하기 전 결제 1건은 Gmail에서 찾은 결제 메일의 날짜와 금액으로 넣었어요. 나눠 내는 구독의 내 몫은 지금 나누는 비율로 계산했어요.",
    );
  });
});
