import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildReceipt,
  buildYearInReview,
  getSavingsTiers,
  rateOnFromTable,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { receiptFootnotes } from "@lib/receipt-view";
import { messages } from "@lib/i18n/messages";
import { GET } from "@/api/fx/history/route";

/**
 * 지난 달러 결제를 결제일의 고시 환율로 바꾸기. 예전에는 영수증의 모든 달러 결제를 지금 환율 하나로 바꿔,
 * 환율이 움직인 만큼 그때 낸 돈과 다른 숫자가 나왔다.
 */

// 2026년 9월 27일(일) 오전 9시.
const NOW = new Date(2026, 8, 27, 9, 0);
const CURRENT = 1400;
// 8월 10일(월)·9월 10일(목)의 고시 환율. 9월 12일·13일은 주말이라 고시가 없다.
const TABLE = { "2026-08-10": 1300, "2026-09-10": 1350, "2026-09-11": 1360 };

function usd(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: overrides.id ?? "chatgpt",
    name: "ChatGPT Plus",
    amount: 20,
    currency: "USD",
    billingDay: 10,
    billingCycle: "monthly",
    category: "ai",
    status: "active",
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

describe("rateOnFromTable", () => {
  const rateOn = rateOnFromTable(TABLE);

  it("결제일의 고시 환율을 쓴다", () => {
    expect(rateOn("2026-08-10")).toBe(1300);
  });

  it("주말·연휴처럼 고시가 없는 날은 그 전 가장 가까운 고시일의 환율을 쓴다", () => {
    expect(rateOn("2026-09-13")).toBe(1360);
  });

  it("며칠을 거슬러도 없으면 지어내지 않고 모른다고 한다", () => {
    expect(rateOn("2026-07-01")).toBeNull();
    expect(rateOn("not-a-date")).toBeNull();
  });
});

describe("buildReceipt — 지난 달러 결제의 환율", () => {
  const rateOn = rateOnFromTable(TABLE);

  it("한 해 영수증에서 달마다 그 결제일의 환율로 바꾸고, 몇 건을 그렇게 바꿨는지 센다", () => {
    const receipt = buildReceipt(
      [usd({ createdAt: new Date(2026, 7, 1).toISOString() })],
      [],
      { kind: "year", year: 2026 },
      CURRENT,
      NOW,
      rateOn,
    );
    // 8월 10일 20달러 × 1,300 + 9월 10일 20달러 × 1,350. 지금 환율(1,400)이 아니다.
    expect(receipt.lines[0].amountKRW).toBe(20 * 1300 + 20 * 1350);
    expect(receipt.lines[0].billedKRW).toBe(20 * 1300 + 20 * 1350);
    expect(receipt.fx).toEqual({ historical: 2, current: 0 });
  });

  it("그날 환율을 모르면 지금 환율로 계산하고 그렇다고 센다", () => {
    const receipt = buildReceipt(
      [usd({ createdAt: new Date(2026, 6, 1).toISOString() })],
      [],
      { kind: "month", year: 2026, month: 7 },
      CURRENT,
      NOW,
      rateOn,
    );
    expect(receipt.lines[0].amountKRW).toBe(20 * CURRENT);
    expect(receipt.fx).toEqual({ historical: 0, current: 1 });
    expect(receiptFootnotes(messages.ko, receipt).join("\n")).toContain(
      "지난 달러 결제 1건은 그날 환율을 받지 못해 지금 설정한 환율로 계산했어요.",
    );
  });

  it("아직 오지 않은 결제(결제 예정)는 앞으로의 환율을 모르니 지금 환율로 계산하고 세지 않는다", () => {
    const receipt = buildReceipt(
      [usd({ billingDay: 30 })],
      [],
      { kind: "month", year: 2026, month: 9 },
      CURRENT,
      NOW,
      rateOn,
    );
    expect(receipt.lines[0].upcomingDates).toEqual(["2026-09-30"]);
    expect(receipt.lines[0].amountKRW).toBe(20 * CURRENT);
    expect(receipt.fx).toEqual({ historical: 0, current: 0 });
  });

  it("결제 메일로 넣은 등록 전 결제도 그 메일 날짜의 환율로 바꾼다", () => {
    const receipt = buildReceipt(
      [
        usd({
          createdAt: new Date(2026, 8, 15).toISOString(),
          chargeHistory: [{ date: "2026-08-10", amount: 22 }],
        }),
      ],
      [],
      { kind: "month", year: 2026, month: 8 },
      CURRENT,
      NOW,
      rateOn,
    );
    expect(receipt.lines[0].billedKRW).toBe(22 * 1300);
    expect(receiptFootnotes(messages.ko, receipt).join("\n")).toContain(
      "결제일의 고시 환율(ECB 기준)",
    );
  });

  it("고시 환율을 넘기지 않으면 예전처럼 지금 환율로 계산한다", () => {
    const receipt = buildReceipt(
      [usd({ createdAt: new Date(2026, 7, 1).toISOString() })],
      [],
      { kind: "month", year: 2026, month: 8 },
      CURRENT,
      NOW,
    );
    expect(receipt.lines[0].amountKRW).toBe(20 * CURRENT);
  });

  it("원화 구독은 환율과 관계없다", () => {
    const receipt = buildReceipt(
      [usd({ currency: "KRW", amount: 13500 })],
      [],
      { kind: "month", year: 2026, month: 8 },
      CURRENT,
      NOW,
      rateOn,
    );
    expect(receipt.lines[0].amountKRW).toBe(13500);
    expect(receipt.fx).toEqual({ historical: 0, current: 0 });
  });
});

describe("연말 결산 — 지난 달러 결제의 환율", () => {
  // 7월 5일에 해지하고 결제가 멈춘 것을 확인한 20달러 구독. 7·8·9월 10일 결제가 막혔고, 10~12월은 앞으로다.
  const killed = usd({
    id: "killed",
    status: "killed",
    killedAt: new Date(2026, 6, 5).toISOString(),
    killVerifiedAt: new Date(2026, 6, 11).toISOString(),
  });
  const rateOn = rateOnFromTable({ "2026-07-10": 1250, "2026-08-10": 1300, "2026-09-10": 1350 });
  const yearRange = { from: new Date(2026, 0, 1), to: new Date(2027, 0, 1) };

  it("막은 결제는 그 결제일의 환율로, 앞으로 지킬 금액은 지금 환율로 센다", () => {
    const review = buildYearInReview([killed], [], 2026, CURRENT, NOW, rateOn);
    expect(review.defended.pastAmount).toBe(20 * (1250 + 1300 + 1350));
    expect(review.defended.scheduledAmount).toBe(3 * 20 * CURRENT);
    expect(review.defended.months[7].amount).toBe(20 * 1300);
  });

  it("결제가 멈춘 것을 확인한 지킨 돈도 결제일의 환율로 센다", () => {
    const tiers = getSavingsTiers([killed], NOW, CURRENT, yearRange, rateOn);
    expect(tiers.confirmed).toBe(20 * (1250 + 1300 + 1350));
    // 넘기지 않으면 예전처럼 지금 환율이다.
    expect(getSavingsTiers([killed], NOW, CURRENT, yearRange).confirmed).toBe(3 * 20 * CURRENT);
  });

  it("체크인 1회당 비용은 체크인한 날의 환율로 바꾼다", () => {
    const log: UsageLog = {
      id: "log-1",
      subscriptionId: "chatgpt",
      month: "2026-08",
      usageCount: 4,
      costPerUse: 5,
      riskLevel: "yellow",
      checkedAt: new Date(2026, 7, 10, 12).toISOString(),
    };
    const review = buildYearInReview([usd()], [log], 2026, CURRENT, NOW, rateOn);
    expect(review.checkIns[0].costPerUseKRW).toBe(5 * 1300);
    // 지출 구성은 앞으로 1년의 예상이라 지금 환율이다.
    expect(review.activeAnnualKRW).toBe(20 * 12 * CURRENT);
  });
});

describe("GET /api/fx/history", () => {
  let upstream: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    upstream = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            rates: {
              "2026-08-10": { KRW: 1300 },
              "2026-08-11": { KRW: "bad" },
            },
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", upstream);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const get = (query: string) => GET(new NextRequest(`http://localhost/api/fx/history?${query}`));

  it("날짜별 고시 환율을 돌려주고, 숫자가 아닌 값은 버린다", async () => {
    const response = await get("from=2026-08-01&to=2026-08-31");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rates: { "2026-08-10": 1300 }, source: "ecb" });
    expect(String(upstream.mock.calls[0][0])).toContain("2026-08-01..2026-08-31");
  });

  it("잘못된 날짜나 너무 긴 구간은 거절한다", async () => {
    expect((await get("from=2026-13-01&to=2026-12-31")).status).toBe(400);
    expect((await get("from=2026-09-01&to=2026-08-01")).status).toBe(400);
    expect((await get("from=2024-01-01&to=2026-08-01")).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("환율을 받지 못하면 502로 알린다", async () => {
    upstream.mockResolvedValueOnce(new Response("", { status: 503 }));
    expect((await get("from=2026-08-01&to=2026-08-31")).status).toBe(502);
  });
});
