import { describe, expect, it } from "vitest";
import { formatDurationPreciseText, formatDurationText } from "@lib/i18n/duration";
import { messages } from "@lib/i18n/messages";

describe("앱의 작은 조각 문구", () => {
  it("사용 시간: 한국어·영어 모두 시·분으로 쓰고, 1분이 안 되면 '1분 미만'(자세히는 초)이다", () => {
    const ko = (ms: number) => formatDurationText(messages.ko, ms);
    expect(ko(0)).toBe("0분");
    expect(ko(30_000)).toBe("1분 미만");
    expect(ko(40 * 60_000)).toBe("40분");
    expect(ko(3_600_000)).toBe("1시간");
    expect(ko((12 * 60 + 10) * 60_000)).toBe("12시간 10분");
    expect(formatDurationPreciseText(messages.ko, 500)).toBe("1초");
    expect(formatDurationPreciseText(messages.ko, 12_400)).toBe("12초");
    expect(formatDurationPreciseText(messages.en, 12_400)).toBe("12 sec");
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
