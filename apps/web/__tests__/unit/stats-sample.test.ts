import { describe, expect, it } from "vitest";
import { STATS_MIN_PARTICIPANTS, STATS_MIN_PER_SERVICE, parseContribution } from "../../lib/stats";
import {
  SAMPLE_CONTRIBUTORS,
  STATS_SAMPLE_ENABLED,
  sampleStatsSummary,
} from "../../lib/stats-sample";

describe("가상 참여자(테스트 빌드의 비교 미리보기)", () => {
  it("40명이고, 서버가 받는 모양 그대로다", () => {
    expect(SAMPLE_CONTRIBUTORS).toHaveLength(40);
    for (const row of SAMPLE_CONTRIBUTORS) {
      expect(parseContribution({ v: 1, ...row })).not.toBeNull();
    }
  });

  it("실제 통계와 같은 문턱을 넘어 전체·서비스별 비교가 보인다", () => {
    const summary = sampleStatsSummary();
    expect(summary.participants).toBeGreaterThanOrEqual(STATS_MIN_PARTICIPANTS);
    expect(summary.overall).not.toBeNull();
    const ids = summary.services.map((service) => service.presetId);
    expect(ids).toEqual(
      expect.arrayContaining([
        "netflix",
        "youtube-premium",
        "coupang-wow",
        "chatgpt-plus",
        "tving",
      ]),
    );
    for (const service of summary.services) {
      expect(service.participants).toBeGreaterThanOrEqual(STATS_MIN_PER_SERVICE);
    }
  });

  it("문턱을 넘지 못한 서비스는 비교에 나오지 않는다", () => {
    const ids = sampleStatsSummary().services.map((service) => service.presetId);
    expect(ids).not.toContain("wavve");
  });

  it("플래그 없이 만든 빌드에서는 꺼져 있다", () => {
    expect(STATS_SAMPLE_ENABLED).toBe(false);
  });
});
