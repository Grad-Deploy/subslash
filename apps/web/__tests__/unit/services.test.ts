import { describe, it, expect } from "vitest";
import { POPULAR_SERVICES, getCancelUrlKind } from "@subslash/shared";

describe("해지 링크 분류", () => {
  it("direct로 표시한 링크는 첫 화면이 아니라 경로가 있는 주소다", () => {
    // 이 검사가 막는 것: 홈페이지 URL을 direct로 두어 앱이 "해지 페이지
    // 바로가기"라고 말하게 되는 상황.
    const bareHomepages = POPULAR_SERVICES.filter((service) => {
      if (service.cancelUrlKind !== "direct") return false;
      const path = new URL(service.cancelUrl).pathname;
      return path === "/" || path === "";
    });

    expect(bareHomepages.map((service) => service.id)).toEqual([]);
  });

  it("모든 프리셋이 링크 성격을 밝히고 안내 문구를 갖는다", () => {
    for (const service of POPULAR_SERVICES) {
      expect(["direct", "entry"]).toContain(service.cancelUrlKind);
      expect(service.cancelGuide.trim().length).toBeGreaterThan(0);
    }
  });

  it("entry로 분류한 서비스는 해지 화면 URL을 약속하지 않는다", () => {
    const coupang = POPULAR_SERVICES.find((service) => service.id === "coupang-wow");

    expect(coupang?.cancelUrlKind).toBe("entry");
    expect(getCancelUrlKind(coupang?.cancelUrl)).toBe("entry");
  });

  it("사용자가 직접 넣은 주소는 unknown이다", () => {
    expect(getCancelUrlKind("https://example.com/whatever")).toBe("unknown");
    expect(getCancelUrlKind(undefined)).toBe("unknown");
  });

  it("넷플릭스처럼 해지 화면이 고정 URL인 곳은 direct다", () => {
    expect(getCancelUrlKind("https://www.netflix.com/cancelplan")).toBe("direct");
  });
});
