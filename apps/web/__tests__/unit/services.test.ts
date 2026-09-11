import { describe, it, expect } from "vitest";
import {
  POPULAR_SERVICES,
  currentCancelUrl,
  getAccountFallbackUrl,
  getCancelUrlKind,
  getServiceHomeUrl,
  parseServiceUrl,
} from "@subslash/shared";

describe("직접 입력한 서비스 주소", () => {
  it("도메인만 적어도 https 링크로 만든다", () => {
    expect(parseServiceUrl("service.com")).toEqual({ url: "https://service.com/" });
  });

  it("전체 주소는 그대로 받는다", () => {
    expect(parseServiceUrl("  https://www.example.co.kr/my/subscribe ")).toEqual({
      url: "https://www.example.co.kr/my/subscribe",
    });
  });

  it("비어 있으면 주소 없이 통과한다", () => {
    expect(parseServiceUrl("   ")).toEqual({});
  });

  it.each(["javascript:alert(1)", "ftp://files.example.com", "localhost", "그냥 글자", "http://"])(
    "링크로 쓸 수 없는 %s 은(는) 거부한다",
    (value) => {
      expect(parseServiceUrl(value).error).toBeDefined();
      expect(parseServiceUrl(value).url).toBeUndefined();
    },
  );

  it("도메인만 적은 주소로도 해지 가이드에 계정 관리 추정 링크가 생긴다", () => {
    const { url } = parseServiceUrl("service.com");
    expect(getAccountFallbackUrl(url)).toBe("https://service.com/account");
    // 저장된 링크가 곧 첫 화면이므로 '첫 화면 열기' 버튼을 따로 만들지 않는다.
    expect(getServiceHomeUrl(url)).toBeNull();
    // 사용자가 적은 주소라 '해지 페이지'라고 부르지 않는다.
    expect(getCancelUrlKind(url)).toBe("unknown");
  });
});

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

describe("바뀐 해지 주소", () => {
  it("옛 프리셋 주소는 지금 주소로 바꾼다", () => {
    expect(currentCancelUrl("https://member.melon.com/pay/charge/payCancel.htm")).toBe(
      "https://www.melon.com/",
    );
    expect(currentCancelUrl("https://apps.apple.com/account/subscriptions")).toBe(
      "https://account.apple.com/account/manage/section/subscriptions",
    );
    expect(currentCancelUrl("https://chat.openai.com/")).toBe("https://chatgpt.com/");
  });

  it("지금 주소와 사용자가 적은 주소는 그대로 둔다", () => {
    expect(currentCancelUrl("https://www.netflix.com/cancelplan")).toBe(
      "https://www.netflix.com/cancelplan",
    );
    // 옛 주소와 비슷해도 정확히 같지 않으면 사용자가 적은 것이다.
    const typed = "https://member.melon.com/pay/charge/payCancel.htm?from=me";
    expect(currentCancelUrl(typed)).toBe(typed);
  });

  it("옛 주소가 어느 프리셋의 지금 주소와도 겹치지 않는다", () => {
    // 겹치면 멀쩡한 링크를 다른 곳으로 바꿔 버린다.
    const current = new Set(POPULAR_SERVICES.map((service) => service.cancelUrl));
    const legacy = POPULAR_SERVICES.flatMap((service) => service.legacyCancelUrls ?? []);
    expect(legacy.filter((url) => current.has(url))).toEqual([]);
  });

  it("같은 옛 주소를 쓰던 프리셋들은 같은 곳으로 옮겨 간다", () => {
    // 옛 주소 하나가 두 곳으로 갈리면 어느 쪽으로 바꿀지 정할 수 없다.
    const targets = new Map<string, Set<string>>();
    for (const service of POPULAR_SERVICES) {
      for (const url of service.legacyCancelUrls ?? []) {
        targets.set(url, (targets.get(url) ?? new Set()).add(service.cancelUrl));
      }
    }
    const split = [...targets].filter(([, destinations]) => destinations.size > 1);
    expect(split).toEqual([]);
  });

  it("바꾼 링크 중 해지 화면을 확인하지 못한 곳은 direct라고 하지 않는다", () => {
    // 멜론·노션은 해지 화면 주소가 공개돼 있지 않고, 디즈니플러스는 계정 화면이다.
    for (const id of ["melon", "notion", "disney-plus", "chatgpt-plus"]) {
      expect(POPULAR_SERVICES.find((service) => service.id === id)?.cancelUrlKind).toBe("entry");
    }
  });
});
