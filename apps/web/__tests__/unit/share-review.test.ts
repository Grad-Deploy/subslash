import { describe, it, expect } from "vitest";
import {
  MAX_SHARED_NAMES,
  buildReviewShareSearchParams,
  readSharedReview,
} from "../../lib/share-review";

const NOW = new Date(2026, 8, 11);

const input = {
  year: 2026,
  isComplete: false,
  blocked: 204000.4,
  confirmed: 153000,
  killedCount: 2,
  names: ["넷플릭스", "Apple One (개인, 월간)"],
  spendingType: { kind: "focused" as const, category: "ott" as const, share: 0.62 },
};

describe("연말 결산 공유 링크", () => {
  it("숫자와 소비 유형을 싣고 그대로 읽는다 — 쉼표가 든 이름도 쪼개지 않는다", () => {
    const params = buildReviewShareSearchParams(input);
    expect(readSharedReview(params, NOW)).toEqual({
      year: 2026,
      isComplete: false,
      blocked: 204000,
      confirmed: 153000,
      killedCount: 2,
      names: ["넷플릭스", "Apple One (개인, 월간)"],
      spendingType: { kind: "focused", category: "ott", share: 0.62 },
    });
  });

  it("분산형은 분야 수로 싣는다", () => {
    const params = buildReviewShareSearchParams({
      ...input,
      spendingType: { kind: "spread", categoryCount: 3 },
    });
    expect(readSharedReview(params, NOW)?.spendingType).toEqual({
      kind: "spread",
      categoryCount: 3,
    });
  });

  it("형식이나 연도가 틀리면 숫자를 짐작하지 않고 통째로 받지 않는다", () => {
    expect(readSharedReview(new URLSearchParams("y=2026&blocked=1000"), NOW)).toBeNull();
    expect(readSharedReview(new URLSearchParams("v=1&y=abc"), NOW)).toBeNull();
    expect(readSharedReview(new URLSearchParams("v=1&y=2019"), NOW)).toBeNull();
    expect(readSharedReview(new URLSearchParams("v=1&y=2027"), NOW)).toBeNull();
  });

  it("올해를 끝난 해로 적은 링크는 '지금까지'로 읽는다", () => {
    expect(readSharedReview(new URLSearchParams("v=1&y=2026&done=1"), NOW)?.isComplete).toBe(false);
    expect(readSharedReview(new URLSearchParams("v=1&y=2025&done=1"), NOW)?.isComplete).toBe(true);
  });

  it("숫자가 아닌 금액은 0으로, 알 수 없는 소비 유형은 버린다", () => {
    const shared = readSharedReview(
      new URLSearchParams(
        "v=1&y=2026&blocked=NaN&saved=-5&killed=두개&type=focused&cat=toString&pct=80",
      ),
      NOW,
    );
    expect(shared).toMatchObject({ blocked: 0, confirmed: 0, killedCount: 0, spendingType: null });
  });

  it("집중형인데 비율이 절반 미만이거나 100을 넘으면 받지 않는다", () => {
    for (const pct of ["49", "101"]) {
      const shared = readSharedReview(
        new URLSearchParams(`v=1&y=2026&type=focused&cat=ott&pct=${pct}`),
        NOW,
      );
      expect(shared?.spendingType).toBeNull();
    }
  });

  it("분산형인데 분야가 하나뿐이면 받지 않는다", () => {
    const shared = readSharedReview(new URLSearchParams("v=1&y=2026&type=spread&cats=1"), NOW);
    expect(shared?.spendingType).toBeNull();
  });

  it(`해지한 서비스 이름은 ${MAX_SHARED_NAMES}개까지만 싣는다`, () => {
    const names = Array.from({ length: MAX_SHARED_NAMES + 5 }, (_, i) => `서비스${i}`);
    const params = buildReviewShareSearchParams({ ...input, names });
    expect(params.getAll("name")).toHaveLength(MAX_SHARED_NAMES);
  });
});
