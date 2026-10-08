import { describe, expect, it } from "vitest";
import { formatDuration } from "@lib/usage/history";
import { formatDurationText } from "@lib/i18n/duration";
import { messages } from "@lib/i18n/messages";

describe("앱의 작은 조각 문구", () => {
  it("사용 시간: 한국어는 formatDuration과 같고 영어는 단위를 영어로 쓴다", () => {
    for (const ms of [0, 30_000, 60_000, 40 * 60_000, 3_600_000, 12 * 3_600_000 + 10 * 60_000]) {
      expect(formatDurationText(messages.ko, ms)).toBe(formatDuration(ms));
    }
    expect(formatDurationText(messages.en, 12 * 3_600_000 + 10 * 60_000)).toBe("12 h 10 min");
    expect(formatDurationText(messages.en, 40 * 60_000)).toBe("40 min");
    expect(formatDurationText(messages.en, 30_000)).toBe("under 1 min");
  });

  it("한꺼번에 체크인 안내는 기록이 있는 일수를 말한다", () => {
    expect(messages.en.appSmall.batch.intro(12)).toContain("the last 12 days that have records");
    expect(messages.en.appSmall.batch.intro(30)).toContain("the last 30 days");
    expect(messages.ko.appSmall.batch.intro(12)).toContain("기록이 있는 최근 12일 동안");
  });
});
