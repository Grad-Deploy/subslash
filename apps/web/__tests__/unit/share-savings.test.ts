import { describe, it, expect } from "vitest";
import { buildShareSearchParams, readSharedSavings } from "../../lib/share-savings";

describe("절약 공유 링크", () => {
  it("지킨 돈과 1년치 요금을 따로 싣고 그대로 읽는다", () => {
    const params = buildShareSearchParams({
      confirmed: 17000.4,
      annual: 334800,
      count: 2,
      verifiedCount: 1,
      names: ["넷플릭스", "멜론"],
    });
    expect(readSharedSavings(params)).toEqual({
      format: "confirmed",
      confirmed: 17000,
      annual: 334800,
      count: 2,
      verifiedCount: 1,
      names: ["넷플릭스", "멜론"],
    });
  });

  it("쉼표가 든 이름을 둘로 쪼개지 않는다", () => {
    const params = buildShareSearchParams({
      confirmed: 0,
      annual: 0,
      count: 1,
      verifiedCount: 0,
      names: ["Apple One (개인, 월간)"],
    });
    expect(readSharedSavings(params).names).toEqual(["Apple One (개인, 월간)"]);
  });

  it("예전 링크의 saved는 1년치 요금으로 읽는다 — 지킨 돈으로 보여주지 않는다", () => {
    const shared = readSharedSavings(
      new URLSearchParams("saved=204000&count=2&names=넷플릭스,멜론&equiv=아무말"),
    );
    expect(shared).toEqual({
      format: "legacy",
      annual: 204000,
      count: 2,
      names: ["넷플릭스", "멜론"],
    });
  });

  it("숫자가 아닌 칸은 없는 것으로 본다", () => {
    const shared = readSharedSavings(
      new URLSearchParams("v=2&saved=abc&annual=-5&count=x&verified=NaN"),
    );
    expect(shared).toMatchObject({
      format: "confirmed",
      confirmed: 0,
      annual: null,
      count: 0,
      verifiedCount: 0,
    });
  });
});
