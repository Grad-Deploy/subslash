import { describe, expect, it } from "vitest";
import { evaluateMetric, formatStorageGB, storagePlanFit } from "@subslash/shared";

const icloud = (planId?: string) => ({
  name: "아이클라우드",
  cancelUrl: "https://account.apple.com/account/manage/section/subscriptions",
  planId,
});

describe("저장 공간 요금제 계산", () => {
  it("2TB의 40%(약 800GB)는 200GB 요금제에 들어가지 않는다", () => {
    const fit = storagePlanFit(icloud("2tb"), 40);
    expect(fit?.usedGB).toBe(800);
    expect(fit?.smaller).toBeNull();
  });

  it("2TB의 5%(약 100GB)는 200GB 요금제에 들어간다 — 가장 싼 것을 고른다", () => {
    const fit = storagePlanFit(icloud("2tb"), 5);
    expect(fit?.smaller).toEqual({ planName: "200GB", capacityGB: 200, amount: 4400 });
  });

  it("작은 요금제가 꽉 차게 되면(80% 넘게) 권하지 않는다", () => {
    // 200GB의 90% = 180GB → 50GB에 안 들어가고, 200GB 자신보다 싼 곳이 없다.
    expect(storagePlanFit(icloud("200gb"), 90)?.smaller).toBeNull();
    // 2TB의 9% = 180GB → 200GB의 90%라 여유가 없다.
    expect(storagePlanFit(icloud("2tb"), 9)?.smaller).toBeNull();
  });

  it("용량이 같은 다른 결제처의 요금제는 '더 작은 요금제'가 아니다", () => {
    // 네이버 MYBOX는 웹 2TB(11,000원)가 App Store 2TB(14,300원)보다 싸다. 같은 2TB를 작다고 하지 않는다.
    const mybox = {
      name: "네이버 MYBOX",
      cancelUrl: "https://mybox.naver.com/",
      planId: "2tb-ios",
    };
    expect(storagePlanFit(mybox, 50)?.smaller).toBeNull();
    expect(storagePlanFit(mybox, 10)?.smaller?.capacityGB).toBeLessThan(2000);
  });

  it("요금제를 모르면 계산하지 않는다", () => {
    expect(storagePlanFit(icloud(), 10)).toBeNull();
    expect(storagePlanFit({ name: "네이버 MYBOX", planId: "x" }, 10)).toBeNull();
  });

  it("구글 원도 계산한다", () => {
    const fit = storagePlanFit(
      { name: "구글 원", cancelUrl: "https://one.google.com/about/plans", planId: "ai-plus" },
      3,
    );
    expect(fit?.usedGB).toBe(60);
    expect(fit?.smaller?.planName).toBe("베이직 100GB");
  });

  it("체크인 결과: 요금제를 알면 추측하지 않고 계산으로 말한다", () => {
    const fits = evaluateMetric(
      "storage",
      "아이클라우드",
      14000,
      5,
      "KRW",
      storagePlanFit(icloud("2tb"), 5),
    );
    expect(fits.riskLevel).toBe("yellow");
    expect(fits.shockMessage).toContain("200GB 요금제(₩4,400)");

    const tooBig = evaluateMetric(
      "storage",
      "아이클라우드",
      14000,
      40,
      "KRW",
      storagePlanFit(icloud("2tb"), 40),
    );
    expect(tooBig.riskLevel).toBe("green");
    expect(tooBig.shockMessage).toContain("약 800GB");
    expect(tooBig.shockMessage).toContain("들어가지 않아요");

    const unknown = evaluateMetric("storage", "아이클라우드", 14000, 40, "KRW", null);
    expect(unknown.shockMessage).not.toContain("충분할 수 있어요");
  });

  it("용량 글자", () => {
    expect(formatStorageGB(0.5)).toBe("1GB 미만");
    expect(formatStorageGB(800)).toBe("약 800GB");
    expect(formatStorageGB(1200)).toBe("약 1.2TB");
    expect(formatStorageGB(2000)).toBe("약 2TB");
  });
});
