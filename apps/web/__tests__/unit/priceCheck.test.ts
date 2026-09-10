import { describe, it, expect } from "vitest";
import {
  getPriceCheckCandidates,
  PRICE_CHECK_INTERVAL_DAYS,
  POPULAR_SERVICES,
  findPresetForSubscription,
  getServiceHomeUrl,
  getAccountFallbackUrl,
  parseCancelGuideSteps,
  type PriceCheckSubscription,
} from "@subslash/shared";

const NOW = new Date("2026-09-10T00:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const netflix = POPULAR_SERVICES.find((s) => s.id === "netflix")!;

function makeSub(overrides: Partial<PriceCheckSubscription> = {}): PriceCheckSubscription {
  return {
    id: "sub-1",
    name: netflix.nameKo,
    amount: netflix.defaultAmount,
    currency: "KRW",
    billingCycle: "monthly",
    cancelUrl: netflix.cancelUrl,
    createdAt: daysAgo(400),
    ...overrides,
  };
}

describe("getPriceCheckCandidates", () => {
  it("등록한 지 얼마 안 됐고 프리셋 요금과도 같으면 묻지 않는다", () => {
    const subs = [makeSub({ createdAt: daysAgo(10) })];
    expect(getPriceCheckCandidates(subs, NOW)).toEqual([]);
  });

  it("90일이 안 지났어도 프리셋 요금과 다르면 바로 묻는다", () => {
    // 계획서의 조건은 '90일 경과' 또는 '프리셋 요금과 불일치' 둘 중 하나다.
    const subs = [makeSub({ createdAt: daysAgo(3), amount: 13500 })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("preset-mismatch");
    expect(candidate.presetAmount).toBe(netflix.defaultAmount);
  });

  it("'요금 유지'를 누른 뒤에는 프리셋과 달라도 90일 동안 조용하다", () => {
    const subs = [makeSub({ amount: 13500, lastPriceCheckedAt: daysAgo(5) })];
    expect(getPriceCheckCandidates(subs, NOW)).toEqual([]);
  });

  it("확인 후 90일이 지나면 프리셋 불일치를 다시 묻는다", () => {
    const subs = [
      makeSub({ amount: 13500, lastPriceCheckedAt: daysAgo(PRICE_CHECK_INTERVAL_DAYS + 1) }),
    ];
    expect(getPriceCheckCandidates(subs, NOW)[0].reason).toBe("preset-mismatch");
  });

  it("확인한 지 오래된 구독은 stale로 잡는다", () => {
    const subs = [makeSub({ lastPriceCheckedAt: daysAgo(PRICE_CHECK_INTERVAL_DAYS + 5) })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("stale");
    expect(candidate.everChecked).toBe(true);
    expect(candidate.daysSinceChecked).toBe(PRICE_CHECK_INTERVAL_DAYS + 5);
  });

  it("확인 직후에는 다시 묻지 않는다", () => {
    const subs = [makeSub({ lastPriceCheckedAt: daysAgo(1) })];
    expect(getPriceCheckCandidates(subs, NOW)).toEqual([]);
  });

  it("프리셋 기준 요금과 다르면 preset-mismatch로 잡고 그 금액을 함께 준다", () => {
    const subs = [makeSub({ amount: 13500 })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("preset-mismatch");
    expect(candidate.presetAmount).toBe(netflix.defaultAmount);
    expect(candidate.currentAmount).toBe(13500);
  });

  it("연간 플랜은 월 기준 프리셋 요금과 비교하지 않는다", () => {
    const subs = [makeSub({ billingCycle: "yearly", amount: 200000 })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("stale");
    expect(candidate.presetAmount).toBeNull();
  });

  it("통화가 다르면 환율을 끼워 비교하지 않는다", () => {
    const subs = [makeSub({ currency: "USD", amount: 12 })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("stale");
    expect(candidate.presetAmount).toBeNull();
  });

  it("맞는 프리셋이 없으면 기준 요금을 지어내지 않는다", () => {
    const subs = [makeSub({ name: "동네 헬스장", cancelUrl: undefined, amount: 55000 })];
    const [candidate] = getPriceCheckCandidates(subs, NOW);
    expect(candidate.reason).toBe("stale");
    expect(candidate.presetAmount).toBeNull();
  });

  it("프리셋과 어긋난 구독을 오래된 구독보다 먼저 보여준다", () => {
    const subs = [
      makeSub({ id: "stale", createdAt: daysAgo(500) }),
      makeSub({ id: "mismatch", amount: 9900 }),
    ];
    const ordered = getPriceCheckCandidates(subs, NOW).map((c) => c.subscriptionId);
    expect(ordered[0]).toBe("mismatch");
  });

  it("날짜가 깨진 구독은 건너뛴다", () => {
    const subs = [makeSub({ createdAt: "not-a-date" })];
    expect(getPriceCheckCandidates(subs, NOW)).toEqual([]);
  });
});

describe("findPresetForSubscription", () => {
  it("해지 URL이 같으면 이름이 달라도 찾아낸다", () => {
    expect(findPresetForSubscription({ name: "내 넷플", cancelUrl: netflix.cancelUrl })?.id).toBe(
      "netflix",
    );
  });

  it("URL이 없으면 이름으로 찾는다", () => {
    expect(findPresetForSubscription({ name: netflix.nameKo })?.id).toBe("netflix");
  });

  it("어느 쪽으로도 확정되지 않으면 undefined다", () => {
    expect(findPresetForSubscription({ name: "동네 필라테스" })).toBeUndefined();
  });
});

describe("getAccountFallbackUrl", () => {
  it("해지 URL의 도메인에 /account를 붙인 주소를 준다", () => {
    expect(getAccountFallbackUrl("https://www.netflix.com/cancelplan")).toBe(
      "https://www.netflix.com/account",
    );
  });

  it("해지 URL이 첫 화면이어도 계정 주소는 따로 만들어 준다", () => {
    expect(getAccountFallbackUrl("https://m.coupang.com/")).toBe("https://m.coupang.com/account");
  });

  it("이미 /account를 가리키는 링크에는 같은 버튼을 또 만들지 않는다", () => {
    expect(getAccountFallbackUrl("https://example.com/account")).toBeNull();
    expect(getAccountFallbackUrl("https://example.com/account/")).toBeNull();
  });

  it("주소가 없거나 해석되지 않으면 null이다", () => {
    expect(getAccountFallbackUrl(undefined)).toBeNull();
    expect(getAccountFallbackUrl("고객센터에 전화")).toBeNull();
    expect(getAccountFallbackUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("getServiceHomeUrl", () => {
  it("해지 URL에서 첫 화면 주소만 뽑는다", () => {
    expect(getServiceHomeUrl("https://www.netflix.com/cancelplan")).toBe("https://www.netflix.com");
  });

  it("첫 화면 주소에는 경로를 덧붙이지 않는다", () => {
    expect(getServiceHomeUrl("https://www.netflix.com/cancelplan")).not.toContain("/account");
  });

  it("이미 첫 화면인 링크는 폴백을 따로 만들지 않는다", () => {
    expect(getServiceHomeUrl("https://m.coupang.com/")).toBeNull();
  });

  it("주소가 없거나 해석되지 않으면 null이다", () => {
    expect(getServiceHomeUrl(undefined)).toBeNull();
    expect(getServiceHomeUrl("해지하려면 고객센터에 전화")).toBeNull();
    expect(getServiceHomeUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("parseCancelGuideSteps", () => {
  it("번호가 붙은 줄글을 단계 목록으로 나눈다", () => {
    const steps = parseCancelGuideSteps(netflix.cancelGuide);
    expect(steps.length).toBe(4);
    expect(steps[0]).not.toMatch(/^\d+\./);
  });

  it("번호가 없어도 줄 단위로 나눈다", () => {
    expect(parseCancelGuideSteps("앱 열기\n설정 진입")).toEqual(["앱 열기", "설정 진입"]);
  });

  it("가이드가 없으면 빈 배열이다", () => {
    expect(parseCancelGuideSteps(undefined)).toEqual([]);
    expect(parseCancelGuideSteps("   ")).toEqual([]);
  });
});
