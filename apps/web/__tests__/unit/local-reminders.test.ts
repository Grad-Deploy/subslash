import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  MAX_SCHEDULED,
  OCCURRENCES_PER_SUBSCRIPTION,
  planReminders,
  reminderId,
} from "@lib/local-reminders";

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 15,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

// 2026-09-10 12:00 (기기 시간대)
const NOW = new Date(2026, 8, 10, 12, 0, 0);

describe("planReminders", () => {
  it("월간 구독은 결제일 N일 전 오전 9시에, 앞으로 몇 번의 결제까지 건다", () => {
    const plan = planReminders([sub()], 3, NOW);
    expect(plan).toHaveLength(OCCURRENCES_PER_SUBSCRIPTION);
    expect(plan.map((r) => r.at)).toEqual([
      new Date(2026, 8, 12, 9),
      new Date(2026, 9, 12, 9),
      new Date(2026, 10, 12, 9),
    ]);
    expect(plan[0]).toMatchObject({
      subscriptionId: "sub-1",
      title: "넷플릭스 결제 3일 전",
      body: "9월 15일에 ₩17,000이 결제될 예정이에요. 계속 쓸지 확인해 보세요.",
    });
  });

  it("알릴 시각이 이미 지난 결제는 건너뛰고 늦게 보내지 않는다", () => {
    // 결제일(9/11)이 내일이라 3일 전 알림 시각(9/8)은 지났다.
    const plan = planReminders([sub({ billingDay: 11 })], 3, NOW);
    expect(plan[0].at).toEqual(new Date(2026, 9, 8, 9));
  });

  it("결제 월을 모르는 연간 구독은 알리지 않는다", () => {
    const plan = planReminders([sub({ billingCycle: "yearly", billingMonth: undefined })], 3, NOW);
    expect(plan).toEqual([]);
  });

  it("결제 월을 아는 연간 구독은 해마다 알린다", () => {
    const plan = planReminders(
      [sub({ billingCycle: "yearly", billingMonth: 11, billingDay: 1, amount: 99000 })],
      7,
      NOW,
    );
    expect(plan.map((r) => r.at)).toEqual([
      new Date(2026, 9, 25, 9),
      new Date(2027, 9, 25, 9),
      new Date(2028, 9, 25, 9),
    ]);
    expect(plan[0].body).toContain("₩99,000");
  });

  it("해지한 구독은 알리지 않는다", () => {
    expect(planReminders([sub({ status: "killed" })], 3, NOW)).toEqual([]);
  });

  it("세금이 붙는 구독은 카드에 찍히는 금액으로 알린다", () => {
    const plan = planReminders([sub({ amount: 20, currency: "USD", taxRate: 10 })], 1, NOW);
    expect(plan[0].body).toContain("$22.00");
  });

  it("당일 알림은 '오늘'이라고 쓴다", () => {
    expect(planReminders([sub()], 0, NOW)[0].title).toBe("넷플릭스 결제 오늘");
  });

  it("시각 순으로 정렬하고 상한을 넘기지 않는다", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      sub({ id: `sub-${i}`, billingDay: (i % 28) + 1 }),
    );
    const plan = planReminders(many, 1, NOW);
    expect(plan).toHaveLength(MAX_SCHEDULED);
    const times = plan.map((r) => r.at.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});

describe("reminderId", () => {
  it("같은 구독의 같은 결제일은 같은 id, 다르면 다른 id다", () => {
    const day = new Date(2026, 8, 15);
    expect(reminderId("sub-1", day)).toBe(reminderId("sub-1", new Date(2026, 8, 15, 23)));
    expect(reminderId("sub-1", day)).not.toBe(reminderId("sub-2", day));
    expect(reminderId("sub-1", day)).not.toBe(reminderId("sub-1", new Date(2026, 9, 15)));
  });

  it("32비트 양의 정수다", () => {
    const id = reminderId("아주-긴-구독-아이디-".repeat(10), new Date(2026, 0, 1));
    expect(Number.isInteger(id)).toBe(true);
    expect(id).toBeGreaterThan(0);
    expect(id).toBeLessThanOrEqual(0x7fffffff);
  });
});
