"use client";

import { ServicePreset, bundlesIncluding, serviceNameOf } from "@subslash/shared";

/**
 * 결합 상품이면 무엇이 들어 있는지, 결합 상품으로도 파는 서비스면 그 상품을 알린다. 결합으로
 * 결제하면서 원래 구독을 끊지 않아 두 번 내는 일이 있다.
 */
export function BundleNotes({ preset }: { preset: ServicePreset }) {
  const bundles = bundlesIncluding(preset.id);
  return (
    <>
      {preset.includes && preset.includes.length > 0 && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed">
          <b>결합 상품</b> · {preset.includes.map(serviceNameOf).join(" + ")}을(를) 이 구독 하나로
          받아요. 따로 구독 중인 게 있으면 두 번 내고 있을 수 있어요.
        </p>
      )}
      {bundles.length > 0 && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {bundles.map((bundle) => bundle.nameKo).join(", ")}
          (으)로 결제하고 있다면 그 결합 상품을 골라 등록해 주세요. 결합 상품은 결제 메일이 Gmail로
          오지 않을 수 있어요.
        </p>
      )}
    </>
  );
}
