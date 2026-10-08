import { presetPriceParts, type ServicePreset } from "@subslash/shared";
import type { Messages } from "./messages";

/** 서비스 목록의 가격 한 마디: '월 ₩9,900부터', '요금 직접 입력'. `describePresetPrice`와 같은 뜻을 지금 언어로 만든다. */
export function describePresetPriceText(t: Messages, preset: ServicePreset): string {
  const p = t.form.picker;
  const parts = presetPriceParts(preset);
  switch (parts.type) {
    case "plans":
      return p.priceFrom(
        parts.cycle === "yearly" ? p.cycleYearly : p.cycleMonthly,
        parts.price,
        parts.incomplete,
      );
    case "ask":
      return p.priceAsk;
    case "monthly":
      return p.priceMonthly(parts.price);
  }
}
