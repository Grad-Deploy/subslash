import { beforeEach, describe, expect, it } from "vitest";
import { countMembershipOrders, type ReceiptEmail } from "@subslash/shared";
import { useStore } from "@lib/store";

const NOW = new Date("2026-09-26T12:00:00+09:00");

function mail(overrides: Partial<ReceiptEmail>): ReceiptEmail {
  return {
    from: "쿠팡 <no-reply@coupang.com>",
    subject: "[쿠팡] 주문하신 상품의 결제가 완료되었습니다",
    date: "2026-09-20T10:00:00+09:00",
    body: "",
    ...overrides,
  };
}

describe("countMembershipOrders", () => {
  it("최근 30일의 쿠팡 주문 메일만 센다", () => {
    const counts = countMembershipOrders(
      [
        mail({}),
        mail({ from: "Coupang <order@mail.coupang.com>" }),
        // 30일보다 오래됐다
        mail({ date: "2026-08-01T10:00:00+09:00" }),
        // 멤버십 결제·취소는 주문이 아니다
        mail({ subject: "[쿠팡] 와우 멤버십 결제 안내" }),
        mail({ subject: "[쿠팡] 주문 취소가 완료되었습니다" }),
        // 다른 곳에서 온 '주문'
        mail({ from: "shop <a@example.com>" }),
      ],
      NOW,
    );
    expect(counts).toEqual([{ presetId: "coupang-wow", count: 2, since: "2026-08-27" }]);
  });

  it("한 통도 없으면 0으로 적지 않는다(가져온 메일에 없을 뿐이다)", () => {
    expect(countMembershipOrders([], NOW)).toEqual([]);
  });
});

describe("recordOrderEvidence", () => {
  beforeEach(() => {
    useStore.setState({
      demo: null,
      subscriptions: [
        {
          id: "wow",
          name: "쿠팡 와우 (쿠팡플레이)",
          amount: 7890,
          currency: "KRW",
          billingCycle: "monthly",
          billingDay: 1,
          category: "ott",
          status: "active",
          cancelUrl: "https://m.coupang.com/",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "netflix",
          name: "넷플릭스",
          amount: 17000,
          currency: "KRW",
          billingCycle: "monthly",
          billingDay: 1,
          category: "ott",
          status: "active",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    } as never);
  });

  it("그 멤버십 구독에만 적는다", () => {
    useStore
      .getState()
      .recordOrderEvidence([{ presetId: "coupang-wow", count: 4, since: "2026-08-27" }]);
    const [wow, netflix] = useStore.getState().subscriptions;
    expect(wow.orderEvidence).toMatchObject({ count: 4, since: "2026-08-27" });
    expect(netflix.orderEvidence).toBeUndefined();
  });
});
