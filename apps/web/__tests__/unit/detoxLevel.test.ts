import { describe, it, expect } from "vitest";
import { getDetoxLevel, DETOX_LEVEL_TIERS } from "@subslash/shared";

describe("getDetoxLevel", () => {
  it("해지한 구독이 없으면 Lv.0이고 없는 성취를 만들지 않는다", () => {
    const level = getDetoxLevel(0, 0);
    expect(level.level).toBe(0);
    expect(level.levelLabel).toBe("Lv.0");
    expect(level.title).toBe("디톡스 준비");
  });

  it("금액이 1만 원에 못 미쳐도 1건이라도 해지했으면 Lv.1이다", () => {
    const level = getDetoxLevel(4900, 1);
    expect(level.level).toBe(1);
    expect(level.title).toBe("구독 새싹");
  });

  it("해지 건수가 0이면 금액만으로도 레벨이 오른다", () => {
    // 예전 데이터에 killedAt이 없더라도 방어액이 있으면 레벨은 매겨진다.
    expect(getDetoxLevel(60000, 0).level).toBe(2);
  });

  it.each([
    [10000, 1, "구독 새싹"],
    [49999, 1, "구독 새싹"],
    [50000, 2, "디톡스 탐험가"],
    [149999, 2, "디톡스 탐험가"],
    [150000, 3, "스마트 슬래셔"],
    [299999, 3, "스마트 슬래셔"],
    [300000, 4, "지출 방어 사령관"],
    [499999, 4, "지출 방어 사령관"],
    [500000, 5, "구독 킬러 · 미니멀리스트"],
    [9999999, 5, "구독 킬러 · 미니멀리스트"],
  ])("₩%d은 Lv.%d(%s)이다", (savings, expectedLevel, expectedTitle) => {
    const level = getDetoxLevel(savings as number, 3);
    expect(level.level).toBe(expectedLevel);
    expect(level.title).toBe(expectedTitle);
  });

  it("최고 레벨은 Lv.MAX로 표기하고 다음 문턱을 만들어내지 않는다", () => {
    const level = getDetoxLevel(700000, 12);
    expect(level.levelLabel).toBe("Lv.MAX");
    expect(level.nextThreshold).toBeNull();
    expect(level.nextTitle).toBeNull();
    expect(level.remainingToNext).toBeNull();
    expect(level.progressPercent).toBe(100);
  });

  it("다음 레벨까지 남은 금액과 진행률을 구간 기준으로 계산한다", () => {
    // Lv.2 구간은 50,000 ~ 150,000. 100,000이면 딱 절반.
    const level = getDetoxLevel(100000, 4);
    expect(level.level).toBe(2);
    expect(level.nextThreshold).toBe(150000);
    expect(level.nextTitle).toBe("스마트 슬래셔");
    expect(level.remainingToNext).toBe(50000);
    expect(level.progressPercent).toBe(50);
  });

  it("음수나 NaN은 0으로 보고 최저 레벨을 준다", () => {
    expect(getDetoxLevel(-50000, 0).level).toBe(0);
    expect(getDetoxLevel(Number.NaN, 0).level).toBe(0);
    expect(getDetoxLevel(Number.NaN, Number.NaN).level).toBe(0);
  });

  it("구간표는 문턱이 오름차순이다", () => {
    const thresholds = DETOX_LEVEL_TIERS.map((t) => t.minSavings);
    expect([...thresholds].sort((a, b) => a - b)).toEqual(thresholds);
  });
});
