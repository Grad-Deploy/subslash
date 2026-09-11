import { describe, it, expect } from "vitest";
import {
  getDefendedBetweenKRW,
  getSavingsTiers,
  splitThisMonthDefendedKRW,
  sumMyAnnualKRW,
  type Subscription,
} from "@subslash/shared";

/** 현지 시각 정오. 표준시가 달라도 날짜가 밀리지 않게 한다. */
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/** 2026년 9월 5일에 해지한, 매월 15일 결제 넷플릭스. */
function killed(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category: "ott",
    status: "killed",
    createdAt: at(2026, 1, 1).toISOString(),
    killedAt: at(2026, 9, 5).toISOString(),
    ...overrides,
  };
}

describe("getDefendedBetweenKRW", () => {
  it("결제일 당일은 아직 세지 않고, 다음 날부터 센다", () => {
    expect(getDefendedBetweenKRW(killed(), { to: day(2026, 9, 15) })).toBe(0);
    expect(getDefendedBetweenKRW(killed(), { to: day(2026, 9, 16) })).toBe(17000);
  });

  it("해를 넘겨 쌓인다", () => {
    const sub = killed({ killedAt: at(2025, 11, 20).toISOString() });
    // 2025-12-15, 2026-01-15, 02-15, 03-15
    expect(getDefendedBetweenKRW(sub, { to: day(2026, 3, 16) })).toBe(17000 * 4);
  });

  it("구간 시작을 주면 그 뒤 결제일만 센다", () => {
    const sub = killed({ killedAt: at(2025, 11, 20).toISOString() });
    expect(getDefendedBetweenKRW(sub, { from: day(2026, 1, 1), to: day(2026, 3, 16) })).toBe(
      17000 * 3,
    );
  });

  it("해지한 날이 결제일이면 그날도 센다 — 방어액 계산과 같은 기준", () => {
    const sub = killed({ killedAt: at(2026, 9, 15, 20).toISOString() });
    expect(getDefendedBetweenKRW(sub, { to: day(2026, 9, 16) })).toBe(17000);
  });

  it("공유 구독은 내 몫만 센다", () => {
    const sub = killed({ sharingCount: 4 });
    expect(getDefendedBetweenKRW(sub, { to: day(2026, 9, 16) })).toBe(4250);
  });

  it("연간 구독은 결제 월에 1년치가 한 번 빠진다", () => {
    const sub = killed({
      billingCycle: "yearly",
      billingMonth: 6,
      amount: 120000,
      killedAt: at(2025, 3, 1).toISOString(),
    });
    // 2025-06-15, 2026-06-15
    expect(getDefendedBetweenKRW(sub, { to: day(2026, 7, 1) })).toBe(240000);
  });

  it("결제일을 정할 수 없으면 null — 짐작하지 않는다", () => {
    expect(
      getDefendedBetweenKRW(killed({ billingCycle: "yearly", billingMonth: undefined }), {
        to: day(2026, 12, 1),
      }),
    ).toBeNull();
    expect(getDefendedBetweenKRW(killed({ killedAt: undefined }), { to: day(2026, 12, 1) })).toBe(
      null,
    );
  });
});

describe("getSavingsTiers", () => {
  const NOW = at(2026, 11, 20, 9);

  it("확인한 해지는 지킨 돈, 답하지 않은 해지는 확인 대기로 나눈다", () => {
    const subs: Subscription[] = [
      // 9/15, 10/15, 11/15 → 확인됨
      killed({ killVerifiedAt: at(2026, 9, 16).toISOString() }),
      // 같은 날짜들, 아직 답하지 않음
      killed({ id: "melon", name: "멜론", amount: 10900 }),
      // 첫 결제일(11/25)이 오지 않았다
      killed({
        id: "wavve",
        name: "웨이브",
        amount: 7900,
        billingDay: 25,
        killedAt: at(2026, 11, 18).toISOString(),
      }),
      // 결제 월을 모르는 연간 구독
      killed({ id: "yearly", name: "연간", billingCycle: "yearly", billingMonth: undefined }),
      // 해지하지 않은 구독은 세지 않는다
      killed({ id: "active", name: "활성", status: "active", killedAt: undefined }),
    ];

    const tiers = getSavingsTiers(subs, NOW);
    expect(tiers.confirmed).toBe(17000 * 3);
    expect(tiers.pending).toBe(10900 * 3);
    expect(tiers.pendingCount).toBe(1);
    expect(tiers.unknownCount).toBe(1);
    expect(tiers.annualRunRate).toBe(sumMyAnnualKRW(subs.filter((s) => s.status === "killed")));
  });

  it("해지만 하고 결제일이 오지 않았으면 지킨 돈도 확인 대기도 0이다", () => {
    const tiers = getSavingsTiers([killed()], at(2026, 9, 10));
    expect(tiers).toMatchObject({ confirmed: 0, pending: 0, pendingCount: 0 });
    expect(tiers.annualRunRate).toBe(17000 * 12);
  });

  it("구간을 주면 그 해 결제일만 센다", () => {
    const sub = killed({
      killedAt: at(2025, 11, 20).toISOString(),
      killVerifiedAt: at(2025, 12, 16).toISOString(),
    });
    const now = at(2026, 3, 20);
    expect(getSavingsTiers([sub], now).confirmed).toBe(17000 * 4);
    expect(
      getSavingsTiers([sub], now, undefined, { from: day(2026, 1, 1), to: day(2027, 1, 1) })
        .confirmed,
    ).toBe(17000 * 3);
  });

  it("구간 끝이 오늘보다 뒤여도 오지 않은 결제일은 세지 않는다", () => {
    const sub = killed({ killVerifiedAt: at(2026, 9, 16).toISOString() });
    expect(
      getSavingsTiers([sub], NOW, undefined, { from: day(2026, 1, 1), to: day(2027, 1, 1) })
        .confirmed,
    ).toBe(17000 * 3);
  });
});

describe("splitThisMonthDefendedKRW", () => {
  it("이번 달 결제일이 지난 것과 남은 것을 나눈다", () => {
    const now = at(2026, 9, 20);
    const subs: Subscription[] = [
      killed(), // 9/15 — 지남
      killed({ id: "melon", amount: 10900, billingDay: 25 }), // 9/25 — 남음
      killed({ id: "late", amount: 5000, killedAt: at(2026, 9, 18).toISOString() }), // 결제 뒤 해지
      killed({ id: "yearly", billingCycle: "yearly", billingMonth: undefined }), // 알 수 없음
      killed({ id: "march", billingCycle: "yearly", billingMonth: 3, amount: 99000 }), // 이번 달 아님
    ];
    expect(splitThisMonthDefendedKRW(subs, now)).toEqual({
      passed: 17000,
      upcoming: 10900,
      unknownCount: 1,
    });
  });

  it("결제일 당일은 아직 남은 쪽이다", () => {
    expect(splitThisMonthDefendedKRW([killed()], at(2026, 9, 15, 23))).toEqual({
      passed: 0,
      upcoming: 17000,
      unknownCount: 0,
    });
  });
});
