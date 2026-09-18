import { describe, it, expect } from "vitest";
import { POPULAR_SERVICES, type Subscription } from "@subslash/shared";
import {
  discoveryToCandidate,
  discoveryToFormData,
  planDiscoveries,
  type GmailDiscovery,
} from "../../lib/gmail-auto-client";

const discovery = (overrides: Partial<GmailDiscovery>): GmailDiscovery => ({
  id: "d1",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 10,
  billingCycle: "monthly",
  billingMonth: null,
  category: "ott",
  presetId: "netflix",
  paymentMethod: "credit_card",
  receiptDate: "2026.09.10",
  sender: "Netflix <info@account.netflix.com>",
  tier: "auto",
  ...overrides,
});

const subscription = (overrides: Partial<Subscription>): Subscription => ({
  id: "s1",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 10,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("planDiscoveries", () => {
  it("확실한 후보는 등록, 확실하지 않은 후보는 확인 목록으로 나눈다", () => {
    const plan = planDiscoveries(
      [discovery({}), discovery({ id: "d2", name: "알 수 없는 결제 (₩8,900)", tier: "review" })],
      [],
    );

    expect(plan.register.map((d) => d.id)).toEqual(["d1"]);
    expect(plan.review.map((d) => d.id)).toEqual(["d2"]);
  });

  it("이미 구독 중인 서비스의 다음 달 영수증은 등록하지 않는다", () => {
    const plan = planDiscoveries([discovery({})], [subscription({ name: " 넷플릭스 " })]);

    expect(plan.register).toEqual([]);
    expect(plan.alreadyTracked.map((d) => d.id)).toEqual(["d1"]);
  });

  it("해지로 기록한 서비스의 결제 메일은 되살리지 않고 확인 목록에 둔다", () => {
    const subs = [subscription({ status: "killed" })];
    const plan = planDiscoveries([discovery({})], subs);

    expect(plan.register).toEqual([]);
    expect(plan.review.map((d) => d.id)).toEqual(["d1"]);
    const candidate = discoveryToCandidate(plan.review[0], subs);
    expect(candidate.selected).toBe(false);
    expect(candidate.statusReason).toContain("해지로 기록한 서비스");
  });

  it("해지한 구독에 결제 메일이 왔다는 사실을 그 구독에 적을 수 있게 넘긴다", () => {
    const subs = [subscription({ id: "sub-1", status: "killed" })];
    const plan = planDiscoveries([discovery({})], subs);

    // 행동 큐가 "해지했는데 결제됐다"를 가장 위에 올리는 근거다.
    expect(plan.chargedAfterKill).toEqual([{ subscriptionId: "sub-1", discovery: plan.review[0] }]);
  });

  it("구독 중인데 영수증 금액이 다르면 그 사실을 넘긴다", () => {
    const subs = [subscription({ id: "sub-1", amount: 13900 })];
    const plan = planDiscoveries([discovery({ amount: 17000 })], subs);

    expect(plan.alreadyTracked.map((d) => d.id)).toEqual(["d1"]);
    expect(plan.amountChanged).toEqual([
      { subscriptionId: "sub-1", discovery: plan.alreadyTracked[0] },
    ]);
  });

  it("세금이 따로 붙는 구독은 청구액과 견준다 — 세금만큼 다르다고 하지 않는다", () => {
    const subs = [subscription({ id: "sub-1", amount: 10, currency: "USD", taxRate: 10 })];
    // $10 + 10% = $11이 카드에 찍힌다. 영수증이 $11이면 다르지 않다.
    expect(
      planDiscoveries([discovery({ amount: 11, currency: "USD" })], subs).amountChanged,
    ).toEqual([]);
  });

  it("결제 주기가 다르면 견주지 않는다 — 연 결제 영수증과 월 요금은 늘 다르다", () => {
    const subs = [subscription({ id: "sub-1", amount: 13900 })];
    const yearly = discovery({ amount: 139000, billingCycle: "yearly" });
    expect(planDiscoveries([yearly], subs).amountChanged).toEqual([]);
  });

  it("금액이 같으면 적지 않는다", () => {
    const subs = [subscription({ id: "sub-1", amount: 13900 })];
    expect(planDiscoveries([discovery({ amount: 13900 })], subs).amountChanged).toEqual([]);
  });

  it("구독 중이거나 처음 보는 서비스면 그 사실을 적지 않는다", () => {
    expect(planDiscoveries([discovery({})], [subscription({})]).chargedAfterKill).toEqual([]);
    expect(planDiscoveries([discovery({})], []).chargedAfterKill).toEqual([]);
  });

  it("통화가 다르면 다른 구독으로 본다", () => {
    const plan = planDiscoveries([discovery({ currency: "USD" })], [subscription({})]);
    expect(plan.register.map((d) => d.id)).toEqual(["d1"]);
  });
});

describe("discoveryToFormData", () => {
  it("해지 링크·안내는 서비스 목록에서 채우고, 메일 금액이 청구액이라 세율은 채우지 않는다", () => {
    const netflix = POPULAR_SERVICES.find((service) => service.id === "netflix");
    const form = discoveryToFormData(discovery({}));

    expect(form.cancelUrl).toBe(netflix?.cancelUrl);
    expect(form.cancelGuide).toBe(netflix?.cancelGuide);
    expect(form.taxRate).toBeUndefined();
    expect(form.billingMonth).toBeUndefined();
  });
});
