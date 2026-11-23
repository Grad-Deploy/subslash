import { describe, expect, it } from "vitest";
import { POPULAR_SERVICES, findBundleDowngrades, type Subscription } from "@subslash/shared";
import { USAGE_PACKAGES } from "@lib/usage/packages";

const nameOf = (id: string) => POPULAR_SERVICES.find((s) => s.id === id)!.nameKo!;

function bundle(id: string, amount: number, overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: `sub-${id}`,
    name: nameOf(id),
    amount,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const NOW = new Date("2026-11-23T12:00:00");
/** 폰 기록이 '안 씀'이라고 본 서비스. */
const unused = (map: Record<string, string[]>) => (sub: Subscription) => map[sub.id] ?? [];
const find = (subs: Subscription[], map: Record<string, string[]>) =>
  findBundleDowngrades(subs, 1350, NOW, unused(map));

describe("findBundleDowngrades — 결합 상품에서 하나만 쓰면 따로 내기", () => {
  it("티빙 더블에서 디즈니+를 안 쓰면 티빙 스탠다드만 내는 편이 4,500원 싸다", () => {
    const sub = bundle("tving-double-disney", 18000);
    const [found] = find([sub], { [sub.id]: ["disney-plus"] });
    expect(found.keep.id).toBe("tving");
    expect(found.keepPlan?.id).toBe("standard");
    expect(found.soloMonthly).toBe(13500);
    expect(found.saving).toBe(4500);
  });

  it("티빙 더블에서 티빙을 안 쓰면 디즈니+ 스탠다드(9,900)로 8,100원 싸다", () => {
    const sub = bundle("tving-double-disney", 18000);
    const [found] = find([sub], { [sub.id]: ["tving"] });
    expect(found.keep.id).toBe("disney-plus");
    expect(found.saving).toBe(8100);
  });

  it("티빙 3 PACK에서 티빙만 쓰면 티빙 스탠다드로 8,000원 싸다", () => {
    const sub = bundle("tving-3pack", 21500);
    const [found] = find([sub], { [sub.id]: ["disney-plus", "wavve"] });
    expect(found.keep.id).toBe("tving");
    expect(found.saving).toBe(8000);
  });

  it("티빙·웨이브 더블은 내 요금제 등급의 단독 요금과 견준다", () => {
    // 프리미엄 더블(19,500)에서 웨이브를 안 쓰면 티빙 프리미엄(17,000)
    const premium = bundle("tving-wavve-double", 19500, { planId: "premium" });
    expect(find([premium], { [premium.id]: ["wavve"] })[0]).toMatchObject({
      soloMonthly: 17000,
      saving: 2500,
    });
    // 광고형 더블(7,000)에서 티빙을 안 쓰면 웨이브 광고형(5,500)
    const ads = bundle("tving-wavve-double", 7000, { planId: "ad-standard" });
    expect(find([ads], { [ads.id]: ["tving"] })[0]).toMatchObject({
      keep: expect.objectContaining({ id: "wavve" }),
      saving: 1500,
    });
  });

  it("결합 상품의 요금제를 모르거나, 결합이 주는 등급을 모르면 견주지 않는다", () => {
    const noPlan = bundle("tving-wavve-double", 15000);
    expect(find([noPlan], { [noPlan.id]: ["wavve"] })).toEqual([]);
    // 베이직 더블은 각 서비스의 어느 요금제를 주는지 적혀 있지 않다
    const basic = bundle("tving-wavve-double", 13500, { planId: "basic" });
    expect(find([basic], { [basic.id]: ["wavve"] })).toEqual([]);
  });

  it("요금제 목록이 없는 서비스는 한 달 요금으로 견준다 — 유튜브를 안 쓰면 배민클럽(3,990)만", () => {
    const sub = bundle("baemin-youtube-premium", 13990, { planId: "discounted" });
    const [found] = find([sub], { [sub.id]: ["youtube-premium"] });
    expect(found.keep.id).toBe("baemin-club");
    expect(found.keepPlan).toBeNull();
    expect(found.saving).toBe(10000);
  });

  it("단독이 더 비싸거나 같으면 권하지 않는다", () => {
    // 배민클럽 + 유튜브 프리미엄(13,990) → 유튜브 프리미엄 단독 14,900
    const baemin = bundle("baemin-youtube-premium", 13990, { planId: "discounted" });
    expect(find([baemin], { [baemin.id]: ["baemin-club"] })).toEqual([]);
    // 네이버플러스 + 넷플릭스 광고형(4,900) → 네이버플러스 단독 4,900
    const naver = bundle("naver-plus-netflix", 4900, { planId: "ads" });
    expect(find([naver], { [naver.id]: ["netflix"] })).toEqual([]);
  });

  it("안 쓴다고 확인된 것이 없거나, 남는 서비스가 둘 이상이거나, 다 안 쓰면 권하지 않는다", () => {
    const pack = bundle("tving-3pack", 21500);
    expect(find([pack], {})).toEqual([]);
    expect(find([pack], { [pack.id]: ["wavve"] })).toEqual([]);
    expect(find([pack], { [pack.id]: ["tving", "disney-plus", "wavve"] })).toEqual([]);
  });

  it("나눠 내는 구독, 체험 중인 구독, 해지한 구독은 뺀다", () => {
    const map = (s: Subscription) => ({ [s.id]: ["disney-plus"] });
    const shared = bundle("tving-double-disney", 18000, { sharingCount: 2 });
    const trial = bundle("tving-double-disney", 18000, { trialEndsAt: "2026-12-01" });
    const killed = bundle("tving-double-disney", 18000, { status: "killed" });
    for (const s of [shared, trial, killed]) expect(find([s], map(s))).toEqual([]);
  });

  it("결합 상품이 아닌 구독에는 아무것도 하지 않는다", () => {
    const tving = bundle("tving", 13500, { planId: "standard" });
    expect(find([tving], { [tving.id]: ["tving"] })).toEqual([]);
  });

  it("서비스 목록의 모든 결합 상품 — 폰으로 잴 수 있는 나머지를 안 쓰면 하나만 따로 내는 편과 견준다", () => {
    // 결합 상품 × 요금제 × 남길 서비스마다, 앱처럼 나머지 중 폰으로 잴 수 있는 서비스만 '안 씀'으로 준다.
    // 잴 수 없는 서비스(네이버플러스·배민클럽·아이클라우드)는 늘 남으므로 그것만 남는 경우만 나온다.
    const got: string[] = [];
    for (const preset of POPULAR_SERVICES.filter((s) => s.includes?.length)) {
      const plans = preset.plans?.length
        ? preset.plans
        : [{ id: undefined, amount: preset.defaultAmount }];
      for (const plan of plans) {
        if (typeof plan.amount !== "number") continue;
        for (const keepId of preset.includes!) {
          const sub = bundle(preset.id, plan.amount, { planId: plan.id });
          const others = preset.includes!.filter((id) => id !== keepId && USAGE_PACKAGES[id]);
          for (const found of find([sub], { [sub.id]: others })) {
            got.push(
              `${preset.id}/${plan.id ?? "-"} → ${found.keep.id} ${found.soloMonthly} (−${found.saving})`,
            );
          }
        }
      }
    }
    expect([...new Set(got)].sort()).toEqual(
      [
        "apple-one/family → apple-icloud 4400 (−16500)",
        "apple-one/individual → apple-icloud 1100 (−13800)",
        "baemin-youtube-premium/discounted → baemin-club 3990 (−10000)",
        "baemin-youtube-premium/list → baemin-club 3990 (−12000)",
        "naver-plus-netflix-spotify/- → naver-plus 4900 (−5900)",
        "naver-plus-netflix/premium → naver-plus 4900 (−10000)",
        "naver-plus-netflix/standard → naver-plus 4900 (−6500)",
        "tving-3pack/- → disney-plus 9900 (−11600)",
        "tving-3pack/- → tving 13500 (−8000)",
        "tving-3pack/- → wavve 10900 (−10600)",
        "tving-double-disney/- → disney-plus 9900 (−8100)",
        "tving-double-disney/- → tving 13500 (−4500)",
        "tving-wavve-double/ad-standard → tving 5500 (−1500)",
        "tving-wavve-double/ad-standard → wavve 5500 (−1500)",
        "tving-wavve-double/premium → tving 17000 (−2500)",
        "tving-wavve-double/premium → wavve 13900 (−5600)",
        "tving-wavve-double/standard → tving 13500 (−1500)",
        "tving-wavve-double/standard → wavve 10900 (−4100)",
      ].sort(),
    );
  });
});
