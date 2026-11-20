import { describe, expect, it } from "vitest";
import {
  findBundleOpportunities,
  POPULAR_SERVICES,
  type RiskLevel,
  type Subscription,
} from "@subslash/shared";
import { answerAsk } from "@lib/ask/answer";
import { localAskCall } from "@lib/ask/local";
import { messages } from "@lib/i18n/messages";

const NOW = new Date(2026, 10, 20, 12);
const RATE = 1400;

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: overrides.id ?? "s",
    name: "",
    amount: 10000,
    currency: "KRW",
    billingCycle: "monthly",
    billingDay: 1,
    category: "ott",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Subscription;
}

const TVING = sub({ id: "tv", name: "티빙", amount: 13500, planId: "standard" });
const DISNEY = sub({ id: "dp", name: "디즈니플러스", amount: 9900, planId: "standard" });
const WAVVE = sub({ id: "wv", name: "웨이브", amount: 10900, planId: "standard" });
const YOUTUBE = sub({ id: "yt", name: "유튜브 프리미엄", amount: 14900, planId: "premium" });

const find = (subs: Subscription[], levels: Record<string, RiskLevel> = {}, now = NOW) =>
  findBundleOpportunities(subs, RATE, now, (s) => levels[s.id] ?? null);

describe("결합 상품 절약 추천 — 조건·기간·체크인", () => {
  it("티빙·웨이브를 같은 등급으로 따로 내면 더블 이용권과 견준다", () => {
    const premium = find([
      { ...TVING, amount: 17000, planId: "premium" },
      { ...WAVVE, amount: 13900, planId: "premium" },
    ]);
    expect(premium.map((o) => o.bundle.id)).toEqual(["tving-wavve-double"]);
    expect(premium[0].saving).toEqual({ min: 17000 + 13900 - 19500, max: 17000 + 13900 - 19500 });
    expect(premium[0].availableUntil).toBeNull();
  });

  it("기간 한정 가격은 판매 마지막 날까지만 쓰고 그 날을 함께 돌려준다", () => {
    const onSale = find([TVING, DISNEY, WAVVE]).find((o) => o.bundle.id === "tving-3pack");
    expect(onSale?.availableUntil).toBe("2027-01-31");
    const afterSale = find([TVING, DISNEY, WAVVE], {}, new Date(2027, 1, 1, 12)).map(
      (o) => o.bundle.id,
    );
    expect(afterSale).not.toContain("tving-3pack");
    expect(afterSale).not.toContain("tving-double-disney");
    expect(afterSale).not.toContain("tving-wavve-double");
  });

  it("조건이 붙은 요금(쿠폰·연간권·프로모션)으로는 권하지 않는다", () => {
    const netflix = sub({ id: "nf", name: "넷플릭스", amount: 13500, planId: "standard" });
    const gemini = sub({
      id: "ai",
      name: "구글 AI 프로",
      amount: 29000,
      planId: "ai-pro",
      category: "ai",
    });
    const ids = [...find([YOUTUBE, gemini]), ...find([YOUTUBE, netflix])].map((o) => o.bundle.id);
    expect(ids).not.toContain("uplus-google-ai-youtube");
    expect(ids).not.toContain("uplus-double-streaming");
  });

  it("체크인이 애매하면 결합과 해지를 나란히, 거의 안 쓰면 해지를 권한다", () => {
    const both = find([TVING, DISNEY, WAVVE], { wv: "yellow" }).find(
      (o) => o.bundle.id === "tving-3pack",
    );
    expect(both?.advice).toBe("both");
    expect(both?.cancelTargets.map((s) => s.id)).toEqual(["wv"]);
    expect(both?.cancelMonthly).toBe(10900);

    const cancel = find([TVING, DISNEY, WAVVE], { wv: "yellow", dp: "red" }).find(
      (o) => o.bundle.id === "tving-3pack",
    );
    expect(cancel?.advice).toBe("cancel");
    expect(cancel?.cancelTargets.map((s) => s.id)).toEqual(["dp"]);

    expect(find([TVING, DISNEY, WAVVE])[0].advice).toBe("bundle");
  });

  it("결합 상품의 등급 표는 포함된 서비스의 실제 요금제를 가리킨다", () => {
    for (const bundle of POPULAR_SERVICES.filter((preset) => preset.includes?.length)) {
      const maps = [bundle.includedPlans, ...(bundle.plans ?? []).map((p) => p.includedPlans)];
      for (const map of maps) {
        for (const [serviceId, planId] of Object.entries(map ?? {})) {
          expect(bundle.includes, `${bundle.id} → ${serviceId}`).toContain(serviceId);
          const service = POPULAR_SERVICES.find((preset) => preset.id === serviceId);
          expect(
            service?.plans?.map((p) => p.id),
            `${bundle.id} → ${planId}`,
          ).toContain(planId);
        }
      }
    }
  });
});

describe("리포트에 물어보기 — 결합 상품", () => {
  const ctx = (subscriptions: Subscription[]) => ({
    subscriptions,
    usageLogs: [],
    rate: RATE,
    now: NOW,
    t: messages.ko,
  });

  it("숫자가 없는 답(도움말·답할 수 없음)에만 noFigures를 둔다", () => {
    expect(answerAsk({ tool: "help" }, ctx([TVING])).noFigures).toBe(true);
    expect(answerAsk({ tool: "unsupported" }, ctx([TVING])).noFigures).toBe(true);
    expect(answerAsk({ tool: "bundleSavings" }, ctx([TVING])).noFigures).toBeUndefined();
  });

  it("결합 질문은 기기 규칙이 bundleSavings로 읽고, 겹침 질문은 그대로 overlaps다", () => {
    expect(localAskCall("결합 상품 쓰면 더 싸?", { now: NOW })).toEqual({ tool: "bundleSavings" });
    expect(localAskCall("결합 상품이랑 겹치는 거 있어?", { now: NOW })).toEqual({
      tool: "overlaps",
    });
  });

  it("리포트 칸과 같은 함수로 금액과 결합에 든 서비스를 답한다", () => {
    const subs = [TVING, DISNEY, WAVVE];
    const [best] = findBundleOpportunities(subs, RATE, NOW);
    const result = answerAsk({ tool: "bundleSavings" }, ctx(subs));
    expect(result.headline).toContain(best.saving.min.toLocaleString("ko-KR"));
    expect(result.notes.join(" ")).toContain("웨이브");
    expect(result.notes.join(" ")).toContain("2027년 1월 31일");
  });

  it("덜 내는 경우가 없으면 그렇게 말한다", () => {
    const result = answerAsk(
      { tool: "bundleSavings" },
      ctx([sub({ id: "w", name: "왓챠", amount: 7900 })]),
    );
    expect(result.headline).toBe(messages.ko.ask.bundleSavings.none);
  });
});

describe("리포트 결합 문구 — 조사", () => {
  const b = messages.ko.reportPage.bundleSaving;

  it("받침 있는 상품 이름 뒤에는 '으로'를 쓴다", () => {
    expect(b.line("티빙", "티빙 x 웨이브 더블 이용권", "₩15,000", "₩9,400")).toContain(
      "티빙 x 웨이브 더블 이용권으로 합치면 월 ₩15,000",
    );
    expect(b.cancelCompare("티빙 x 웨이브 더블 이용권", "₩9,400")).toBe(
      "티빙 x 웨이브 더블 이용권으로 합치면 한 달 ₩9,400 덜 내요.",
    );
  });

  it("끝 글자의 받침으로 고른다('+'·ㄹ 받침 뒤는 '로')", () => {
    expect(b.cancelCompare("유독 더블스트리밍", "₩1,000")).toContain("더블스트리밍으로");
    expect(b.cancelCompare("배민클럽 + 유튜브 프리미엄", "₩1,000")).toContain("프리미엄으로");
    expect(b.cancelCompare("Apple One 개인", "₩1,000")).toContain("개인으로");
    expect(b.cancelCompare("티빙 3 PACK 디즈니+", "₩1,000")).toContain("디즈니+로");
    expect(b.cancelCompare("구글 원 플랜 메일", "₩1,000")).toContain("메일로");
  });
});
