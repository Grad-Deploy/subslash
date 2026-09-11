import { describe, it, expect } from "vitest";
import { CHECK_IN_EVIDENCE_WINDOW, getCheckInEvidence } from "@subslash/shared";

const log = (usageCount: number, costPerUse: number, checkedAt: string) => ({
  usageCount,
  costPerUse,
  checkedAt,
});

describe("getCheckInEvidence", () => {
  it("체크인이 없으면 근거도 없다", () => {
    expect(getCheckInEvidence([])).toBeNull();
  });

  it("한 번뿐이면 변화를 말하지 않는다", () => {
    // 0으로 채우면 "변화 없음"이라고 말하는 셈이다.
    const evidence = getCheckInEvidence([log(4, 4250, "2026-09-01T00:00:00.000Z")]);

    expect(evidence?.averageUsage).toBe(4);
    expect(evidence?.change).toBeNull();
  });

  it(`최근 ${CHECK_IN_EVIDENCE_WINDOW}회만 평균 내고, 순서가 섞여 있어도 시각으로 줄 세운다`, () => {
    const evidence = getCheckInEvidence([
      log(10, 1700, "2026-06-01T00:00:00.000Z"),
      log(2, 8500, "2026-09-01T00:00:00.000Z"),
      log(4, 4250, "2026-07-01T00:00:00.000Z"),
      log(6, 17000 / 6, "2026-08-01T00:00:00.000Z"),
    ]);

    expect(evidence?.recent.map((l) => l.checkedAt.slice(0, 7))).toEqual([
      "2026-09",
      "2026-08",
      "2026-07",
    ]);
    expect(evidence?.averageUsage).toBe((2 + 6 + 4) / 3);
    expect(evidence?.latest.usageCount).toBe(2);
  });

  it("직전 체크인보다 덜 썼으면 이용 횟수는 줄고 1회당 비용은 오른다", () => {
    const evidence = getCheckInEvidence([
      log(6, 17000 / 6, "2026-08-01T00:00:00.000Z"),
      log(2, 8500, "2026-09-01T00:00:00.000Z"),
    ]);

    expect(evidence?.change?.usage).toBe(-4);
    expect(evidence?.change?.costPerUse).toBeCloseTo(8500 - 17000 / 6);
    expect(evidence?.change?.priceChanged).toBe(false);
  });

  it("시각이 같으면 나중에 기록한 것을 최신으로 본다", () => {
    const at = "2026-09-01T00:00:00.000Z";
    const evidence = getCheckInEvidence([log(3, 1, at), log(5, 1, at)]);

    expect(evidence?.latest.usageCount).toBe(5);
  });

  it("그 사이 요금이 바뀌었으면 1회당 변화에 요금 변화가 섞였다고 알린다", () => {
    // 한 달치 17,000원(4회 → 4,250원)에서 13,900원(4회 → 3,475원)으로 바뀌었다.
    const evidence = getCheckInEvidence([
      log(4, 4250, "2026-08-01T00:00:00.000Z"),
      log(4, 3475, "2026-09-01T00:00:00.000Z"),
    ]);

    expect(evidence?.change?.usage).toBe(0);
    expect(evidence?.change?.priceChanged).toBe(true);
  });

  it("0회 체크인은 한 달치 전체를 1회당 비용으로 기록하므로 그 금액을 요금으로 본다", () => {
    const evidence = getCheckInEvidence([
      log(0, 17000, "2026-08-01T00:00:00.000Z"),
      log(2, 8500, "2026-09-01T00:00:00.000Z"),
    ]);

    expect(evidence?.change?.priceChanged).toBe(false);
  });
});
