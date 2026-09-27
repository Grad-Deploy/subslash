import { describe, expect, it } from "vitest";
import {
  AGE_BANDS,
  STATS_MIN_PARTICIPANTS,
  STATS_MIN_PER_AGE_BAND,
  STATS_MIN_PER_SERVICE,
  parseContribution,
} from "../../lib/stats";
import {
  SAMPLE_CONTRIBUTORS,
  STATS_SAMPLE_ENABLED,
  sampleStatsSummary,
} from "../../lib/stats-sample";

describe("가상 참여자(테스트 빌드의 비교 미리보기)", () => {
  it("60명이고, 모두 연령대가 있으며, 서버가 받는 모양 그대로다", () => {
    expect(SAMPLE_CONTRIBUTORS).toHaveLength(60);
    for (const row of SAMPLE_CONTRIBUTORS) {
      expect(row.ageBand).toBeTruthy();
      expect(parseContribution({ v: 1, ...row })).not.toBeNull();
    }
  });

  it("실제 통계와 같은 문턱을 넘어 전체·서비스별 비교가 보인다", () => {
    const summary = sampleStatsSummary();
    expect(summary.participants).toBeGreaterThanOrEqual(STATS_MIN_PARTICIPANTS);
    expect(summary.overall).not.toBeNull();
    const ids = summary.services.map((service) => service.presetId);
    expect(ids).toEqual(
      expect.arrayContaining(["netflix", "youtube-premium", "coupang-wow", "chatgpt-plus"]),
    );
    for (const service of summary.services) {
      expect(service.participants).toBeGreaterThanOrEqual(STATS_MIN_PER_SERVICE);
    }
  });

  it("연령대별: 10~50대는 비교가 나오고, 문턱보다 적은 60대 이상은 숫자 없이 인원만", () => {
    const byAge = sampleStatsSummary().byAge ?? [];
    expect(byAge.map((row) => row.ageBand)).toEqual([...AGE_BANDS]);
    for (const row of byAge) {
      if (row.ageBand === "60s+") {
        expect(row.participants).toBeLessThan(STATS_MIN_PER_AGE_BAND);
        expect(row.medianMonthlyKRW).toBeNull();
      } else {
        expect(row.participants).toBeGreaterThanOrEqual(STATS_MIN_PER_AGE_BAND);
        expect(row.medianMonthlyKRW).toBeGreaterThan(0);
      }
    }
  });

  it("연령대마다 지출이 다르다 — 30대가 10대보다 많이 낸다", () => {
    const byAge = sampleStatsSummary().byAge ?? [];
    const of = (band: string) => byAge.find((row) => row.ageBand === band)?.medianMonthlyKRW ?? 0;
    expect(of("30s")).toBeGreaterThan(of("10s"));
  });

  it("플래그 없이 만든 빌드에서는 꺼져 있다", () => {
    expect(STATS_SAMPLE_ENABLED).toBe(false);
  });
});

describe("연령대를 실은 요약", () => {
  it("모르는 연령대는 요약을 통째로 받지 않는다", () => {
    expect(
      parseContribution({ v: 1, totalMonthlyKRW: 0, activeCount: 0, ageBand: "25s", items: [] }),
    ).toBeNull();
  });

  it("연령대가 없으면 없는 채로 받는다(연령대 비교를 열기 전의 기기)", () => {
    const parsed = parseContribution({ v: 1, totalMonthlyKRW: 0, activeCount: 0, items: [] });
    expect(parsed).not.toBeNull();
    expect(parsed?.ageBand).toBeUndefined();
  });
});
