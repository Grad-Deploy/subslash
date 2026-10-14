import { describe, expect, it } from "vitest";
import { buildReceipt, nextAmountHistory, priceAsOf, type Subscription } from "@subslash/shared";
import { createBackup, parseBackup } from "@lib/backup";
import { receiptFootnotes } from "@lib/receipt-view";
import { messages } from "@lib/i18n/messages";

const RATE = 1400;

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
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

describe("nextAmountHistory — 금액을 고친 기록", () => {
  const changedOn = new Date(2026, 8, 20, 9, 0);

  it("금액을 고치면 고친 날·전·후를 남긴다", () => {
    const history = nextAmountHistory(sub(), { amount: 17000, currency: "KRW" }, changedOn);
    expect(history).toEqual([
      {
        changedAt: changedOn.toISOString(),
        before: { amount: 13500, currency: "KRW" },
        after: { amount: 17000, currency: "KRW" },
      },
    ]);
  });

  it("결제액이 그대로면 기록하지 않는다", () => {
    expect(nextAmountHistory(sub(), { amount: 13500, currency: "KRW" }, changedOn)).toBeUndefined();
  });

  it("등록한 날 고친 것은 등록한 값을 바로잡은 것이라 기록하지 않는다", () => {
    const fresh = sub({ createdAt: new Date(2026, 8, 20, 8, 0).toISOString() });
    expect(nextAmountHistory(fresh, { amount: 17000, currency: "KRW" }, changedOn)).toBeUndefined();
  });

  it("같은 날 다시 고치면 하나로 합치고, 처음 값으로 되돌리면 기록을 지운다", () => {
    const first = nextAmountHistory(sub(), { amount: 1700, currency: "KRW" }, changedOn);
    const fixed = sub({ amount: 1700, amountHistory: first });
    const later = new Date(2026, 8, 20, 10, 0);
    expect(nextAmountHistory(fixed, { amount: 17000, currency: "KRW" }, later)).toEqual([
      {
        changedAt: later.toISOString(),
        before: { amount: 13500, currency: "KRW" },
        after: { amount: 17000, currency: "KRW" },
      },
    ]);
    expect(nextAmountHistory(fixed, { amount: 13500, currency: "KRW" }, later)).toBeUndefined();
  });

  it("나눠 내기도 결제액을 정하는 칸이라 함께 남긴다", () => {
    const history = nextAmountHistory(
      sub(),
      { amount: 13500, currency: "KRW", sharingCount: 4 },
      changedOn,
    );
    expect(history?.[0].after).toEqual({ amount: 13500, currency: "KRW", sharingCount: 4 });
  });
});

describe("priceAsOf·buildReceipt — 고친 날부터 새 금액", () => {
  const changedAt = new Date(2026, 8, 20, 9, 0).toISOString();
  const raised = sub({
    amount: 17000,
    amountHistory: [
      {
        changedAt,
        before: { amount: 13500, currency: "KRW" },
        after: { amount: 17000, currency: "KRW" },
      },
    ],
  });

  it("고친 날보다 앞선 결제는 고치기 전 금액이다", () => {
    expect(priceAsOf(raised, new Date(2026, 8, 10)).amount).toBe(13500);
    expect(priceAsOf(raised, new Date(2026, 8, 20)).amount).toBe(17000);
    expect(priceAsOf(raised, new Date(2026, 9, 10)).amount).toBe(17000);
  });

  it("지난 달 영수증은 그때 금액으로 셈하고 그렇게 셈한 건수를 적는다", () => {
    const now = new Date(2026, 9, 14, 9, 0);
    const september = buildReceipt(
      [raised],
      [],
      { kind: "month", year: 2026, month: 9 },
      RATE,
      now,
    );
    expect(september.totalKRW).toBe(13500);
    expect(september.priorAmount).toBe(1);
    expect(receiptFootnotes(messages.ko, september).join(" ")).toContain("고치기 전 금액");

    const october = buildReceipt([raised], [], { kind: "month", year: 2026, month: 10 }, RATE, now);
    expect(october.totalKRW).toBe(17000);
    expect(october.priorAmount).toBe(0);
  });

  it("나눠 내기 전의 결제는 그때 낸 몫 그대로다", () => {
    const split = sub({
      sharingCount: 2,
      amountHistory: [
        {
          changedAt,
          before: { amount: 13500, currency: "KRW" },
          after: { amount: 13500, currency: "KRW", sharingCount: 2 },
        },
      ],
    });
    const now = new Date(2026, 9, 14, 9, 0);
    const receipt = buildReceipt([split], [], { kind: "month", year: 2026, month: 9 }, RATE, now);
    expect(receipt.totalKRW).toBe(13500);
  });
});

describe("백업", () => {
  it("금액 변경 기록을 검사하고, 틀린 기록은 받지 않는다", () => {
    const good = sub({
      amountHistory: [
        {
          changedAt: new Date(2026, 8, 20).toISOString(),
          before: { amount: 13500, currency: "KRW" },
          after: { amount: 17000, currency: "KRW" },
        },
      ],
    });
    const backup = (s: unknown) =>
      JSON.stringify(
        createBackup({
          subscriptions: [s as Subscription],
          usageLogs: [],
          accounts: [],
          exchangeRate: { rate: RATE, source: "manual", updatedAt: "2026-09-01T00:00:00.000Z" },
        }),
      );
    expect(parseBackup(backup(good)).ok).toBe(true);
    const bad = { ...good, amountHistory: [{ changedAt: "어제", before: {}, after: {} }] };
    expect(parseBackup(backup(bad)).ok).toBe(false);
  });
});
