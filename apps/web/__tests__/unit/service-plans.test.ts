import { describe, it, expect } from "vitest";
import {
  POPULAR_SERVICES,
  describePresetPrice,
  planFormData,
  presetFormData,
  referencePriceFor,
} from "@subslash/shared";

function byId(id: string) {
  const preset = POPULAR_SERVICES.find((s) => s.id === id);
  if (!preset) throw new Error(`서비스 목록에 ${id}가 없습니다`);
  return preset;
}

const unknownPrice = POPULAR_SERVICES.filter((s) => s.defaultAmount === null && !s.plans?.length);

describe("서비스 목록의 요금", () => {
  it("요금제가 여럿인 서비스는 요금 하나를 기본값으로 두지 않는다", () => {
    for (const preset of POPULAR_SERVICES.filter((s) => s.plans?.length)) {
      expect(preset.defaultAmount, preset.id).toBeNull();
    }
  });

  it("요금은 0보다 크고, 요금제 ID는 한 서비스 안에서 겹치지 않는다", () => {
    // 예전에는 앱스토어·플레이스토어 묶음을 0원으로 채워 두었다.
    for (const preset of POPULAR_SERVICES) {
      if (preset.defaultAmount !== null) expect(preset.defaultAmount, preset.id).toBeGreaterThan(0);
      const plans = preset.plans ?? [];
      expect(new Set(plans.map((p) => p.id)).size, preset.id).toBe(plans.length);
      for (const plan of plans) expect(plan.amount, `${preset.id}/${plan.id}`).toBeGreaterThan(0);
    }
  });

  it("요금을 모르는 서비스는 등록할 때 무엇을 적을지 안내한다", () => {
    expect(unknownPrice.length).toBeGreaterThan(0);
    for (const preset of unknownPrice) expect(preset.priceNote, preset.id).toBeTruthy();
  });
});

describe("describePresetPrice", () => {
  it("요금제가 여럿이면 가장 싼 월 요금에 '부터'를 붙인다", () => {
    expect(describePresetPrice(byId("netflix"))).toBe("월 ₩7,000부터");
  });

  it("요금이 하나면 반올림하지 않고 적는다", () => {
    // 예전 홈 화면은 ₩7,890을 '₩8k'로 적었다.
    expect(describePresetPrice(byId("coupang-wow"))).toBe("월 ₩7,890");
  });

  it("요금을 모르면 지어내지 않는다", () => {
    expect(describePresetPrice(unknownPrice[0])).toBe("요금 직접 입력");
  });
});

describe("등록 폼에 채울 값", () => {
  it("요금제가 여럿인 서비스를 고르면 요금을 비워 둔다", () => {
    const data = presetFormData(byId("netflix"));
    expect(data.name).toBe("넷플릭스");
    expect(data.amount).toBeUndefined();
    expect(data.planId).toBeUndefined();
  });

  it("요금이 하나인 서비스는 요금을 채우고, 결제일은 채우지 않는다", () => {
    const data = presetFormData(byId("coupang-wow"));
    expect(data.amount).toBe(7890);
    expect(data.billingDay).toBeUndefined();
  });

  it("요금제를 고르면 요금·결제 주기·요금제 이름이 그 요금제를 따른다", () => {
    const notion = byId("notion");
    const yearly = notion.plans!.find((p) => p.id === "plus-yearly")!;
    expect(planFormData(notion, yearly)).toEqual({
      planId: "plus-yearly",
      planName: "플러스 (연 결제)",
      amount: 168000,
      currency: "KRW",
      billingCycle: "yearly",
    });
  });
});

describe("referencePriceFor", () => {
  it("요금제가 여럿인 서비스는 고른 요금제의 요금을 기준으로 삼는다", () => {
    expect(referencePriceFor({ name: "넷플릭스", planId: "standard" })).toEqual({
      amount: 13500,
      currency: "KRW",
      billingCycle: "monthly",
    });
  });

  it("요금제를 고르지 않았으면 여러 요금 중 하나를 골라 기준으로 삼지 않는다", () => {
    expect(referencePriceFor({ name: "넷플릭스" })).toBeNull();
  });

  it("목록에 없는 요금제 ID도 기준이 되지 않는다", () => {
    expect(referencePriceFor({ name: "넷플릭스", planId: "gold" })).toBeNull();
  });

  it("요금을 모르는 서비스는 기준 요금이 없다", () => {
    expect(referencePriceFor({ name: unknownPrice[0].nameKo })).toBeNull();
  });
});
