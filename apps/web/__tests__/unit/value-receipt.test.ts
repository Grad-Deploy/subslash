import { describe, expect, it } from "vitest";
import type { Subscription, UsageLog } from "@subslash/shared";
import {
  buildValueReceipt,
  receiptDate,
  receiptDetail,
  receiptFooter,
  receiptSections,
  sheetActions,
  spaced,
  wasteOrder,
  won,
} from "../../components/dashboard/app/valueReceipt";

const RATE = 1400;
const NOW = new Date("2026-10-07T12:00:00");

function sub(id: string, amount: number, extra: Partial<Subscription> = {}): Subscription {
  return {
    id,
    name: `구독${id}`,
    amount,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

function log(subscriptionId: string, usageCount: number, riskLevel: "green" | "red"): UsageLog {
  return {
    id: `log-${subscriptionId}`,
    subscriptionId,
    month: "2026-10",
    usageCount,
    costPerUse: usageCount > 0 ? 1000 : 10000,
    riskLevel,
    checkedAt: "2026-10-01T00:00:00.000Z",
  };
}

describe("영수증 금액 표기", () => {
  it("통화 기호와 숫자 사이를 한 칸 띄우고, 부호는 기호 앞에 둔다", () => {
    expect(won(17000)).toBe("₩ 17,000");
    expect(spaced("-₩17,000")).toBe("-₩ 17,000");
    expect(spaced("$9.99")).toBe("$ 9.99");
  });

  it("날짜는 0을 채운 점 구분이다", () => {
    expect(receiptDate(new Date("2026-03-05T00:00:00"))).toBe("2026.03.05");
  });
});

describe("buildValueReceipt", () => {
  it("체험 중인 구독은 월 고정지출에서 빼고 따로 센다", () => {
    const subs = [sub("a", 10000), sub("b", 5000, { trialEndsAt: "2026-10-20" })];
    const receipt = buildValueReceipt(subs, [], RATE, NOW);
    expect(receipt.fixedKRW).toBe(10000);
    expect(receipt.trialKRW).toBe(5000);
    expect(receipt.inTrial.map((s) => s.id)).toEqual(["b"]);
  });

  it("공유 구독은 내 몫으로 세고, 카드 청구액은 따로 둔다", () => {
    const subs = [sub("a", 20000, { sharingCount: 4 })];
    const receipt = buildValueReceipt(subs, [], RATE, NOW);
    expect(receipt.fixedKRW).toBe(5000);
    expect(receipt.billedKRW).toBe(20000);
    expect(receipt.sharedCount).toBe(1);
  });

  it("해지한 구독은 넣지 않고, 분류별 금액은 큰 순서다", () => {
    const subs = [
      sub("a", 3000, { category: "music" }),
      sub("b", 10000),
      sub("c", 50000, { status: "killed" }),
    ];
    const receipt = buildValueReceipt(subs, [], RATE, NOW);
    expect(receipt.active.map((s) => s.id)).toEqual(["a", "b"]);
    expect(receipt.categories).toEqual([
      { category: "ott", amount: 10000 },
      { category: "music", amount: 3000 },
    ]);
  });
});

describe("receiptDetail", () => {
  it("체크인이 없으면 단가를 지어내지 않는다", () => {
    const [item] = buildValueReceipt([sub("a", 10000)], [], RATE, NOW).summary.unknownItems;
    expect(receiptDetail(item)).toBe("얼마나 썼는지 몰라요");
  });

  it("0회면 미사용, 쓴 만큼은 회당 단가를 적는다", () => {
    const { summary } = buildValueReceipt(
      [sub("a", 10000), sub("b", 10000)],
      [log("a", 0, "red"), log("b", 10, "green")],
      RATE,
      NOW,
    );
    expect(receiptDetail(summary.wastedItems[0])).toBe("이번 달 미사용");
    expect(receiptDetail(summary.worthItItems[0])).toBe("10회 · 회당 ₩ 1,000");
  });
});

describe("receiptSections", () => {
  const many = Array.from({ length: 7 }, (_, i) => sub(`s${i}`, 1000 * (i + 1)));

  it("줄이 여섯 개 이하면 접지 않는다", () => {
    const receipt = buildValueReceipt(many.slice(0, 6), [], RATE, NOW);
    const result = receiptSections(receipt, false);
    expect(result.collapsible).toBe(false);
    expect(result.sections[0].shown).toHaveLength(6);
  });

  it("일곱 줄부터 구역마다 두 줄만 보이고 숨긴 줄 수를 센다", () => {
    const receipt = buildValueReceipt(many, [], RATE, NOW);
    const folded = receiptSections(receipt, false);
    expect(folded.collapsed).toBe(true);
    expect(folded.sections[0].shown).toHaveLength(2);
    expect(folded.hiddenCount).toBe(5);

    const open = receiptSections(receipt, true);
    expect(open.collapsed).toBe(false);
    expect(open.sections[0].shown).toHaveLength(7);
    expect(open.hiddenCount).toBe(0);
  });

  it("빈 구역은 그리지 않는다", () => {
    const receipt = buildValueReceipt([sub("a", 1000)], [log("a", 5, "green")], RATE, NOW);
    expect(receiptSections(receipt, false).sections.map((s) => s.key)).toEqual(["worth"]);
  });
});

describe("해지 순서와 아래 버튼", () => {
  const subs = [sub("a", 5000), sub("b", 20000), sub("c", 10000), sub("d", 3000)];
  const logs = [log("a", 0, "red"), log("b", 0, "red"), log("c", 0, "red")];

  it("먼저 연 구독을 빼고 나머지를 금액이 큰 순서로 잇는다", () => {
    const { summary } = buildValueReceipt(subs, logs, RATE, NOW);
    expect(wasteOrder(summary.wastedItems, "c")).toEqual(["b", "a"]);
  });

  it("버튼은 금액이 가장 큰 구독부터 열고, 여럿이면 '부터'라고 적는다", () => {
    const { summary } = buildValueReceipt(subs, logs, RATE, NOW);
    const { cancel, checkIn } = sheetActions(summary);
    expect(cancel).toEqual({ id: "b", label: "구독b부터 해지 안내", rest: ["c", "a"] });
    expect(checkIn).toEqual({ id: "d", label: "구독d 체크인" });
  });

  it("할 일이 없으면 버튼도 없다", () => {
    const { summary } = buildValueReceipt([sub("a", 1000)], [log("a", 5, "green")], RATE, NOW);
    expect(sheetActions(summary)).toEqual({ cancel: null, checkIn: null });
  });
});

describe("receiptFooter", () => {
  it("체크인이 하나도 없으면 체크인을 권한다", () => {
    const { summary } = buildValueReceipt([sub("a", 1000)], [], RATE, NOW);
    expect(receiptFooter(summary)).toBe(
      "이번 달에 몇 번 썼는지 알려주면 회당 단가를 계산해 드려요.",
    );
  });
});
