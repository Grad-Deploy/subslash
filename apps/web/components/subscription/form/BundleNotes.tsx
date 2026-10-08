"use client";

import { ServicePreset, bundlesIncluding, serviceNameOf } from "@subslash/shared";
import { useT } from "@lib/i18n";

/**
 * 결합 상품이면 무엇이 들어 있는지, 결합 상품으로도 파는 서비스면 그 상품을 알린다. 결합으로
 * 결제하면서 원래 구독을 끊지 않아 두 번 내는 일이 있다.
 */
export function BundleNotes({ preset }: { preset: ServicePreset }) {
  const f = useT().form.bundle;
  const bundles = bundlesIncluding(preset.id);
  return (
    <>
      {preset.includes && preset.includes.length > 0 && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed">
          <b>{f.label}</b> · {f.includes(preset.includes.map(serviceNameOf).join(" + "))}
        </p>
      )}
      {bundles.length > 0 && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {f.soldAs(bundles.map((bundle) => bundle.nameKo).join(", "))}
        </p>
      )}
    </>
  );
}
