import { describe, it, expect } from "vitest";
import { POPULAR_SERVICES } from "@subslash/shared";
import { SAMPLES, sampleName, type Sample } from "../../components/home/samples";

const sampleOf = (id: string, planName: string | null): Sample => {
  const preset = POPULAR_SERVICES.find((s) => s.id === id)!;
  return { preset, planName, amount: 1, currency: "KRW" };
};

describe("sampleName", () => {
  it("서비스 이름 뒤에 요금제를 붙인다", () => {
    expect(sampleName(sampleOf("netflix", "프리미엄"))).toBe("넷플릭스 프리미엄");
  });

  // 그대로 붙이면 '유튜브 프리미엄 프리미엄'이 됐다.
  it("서비스 이름 끝과 요금제 이름 앞이 겹치면 한 번만 쓴다", () => {
    expect(sampleName(sampleOf("youtube-premium", "프리미엄"))).toBe("유튜브 프리미엄");
    expect(sampleName(sampleOf("youtube-premium", "프리미엄 라이트"))).toBe(
      "유튜브 프리미엄 라이트",
    );
    expect(sampleName(sampleOf("youtube-premium", "프리미엄"), "en")).toBe("YouTube Premium");
  });

  it("견본 이름에 같은 낱말이 잇달아 나오지 않는다", () => {
    for (const sample of SAMPLES) {
      for (const locale of ["ko", "en"] as const) {
        const words = sampleName(sample, locale).toLowerCase().split(/\s+/);
        expect(words.some((w, i) => i > 0 && w === words[i - 1])).toBe(false);
      }
    }
  });
});
