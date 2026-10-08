import React from "react";
import { SquarePen } from "lucide-react";
import type { ServicePreset, SubscriptionFormData } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { ServiceLogo } from "../ServiceLogo";

/** 새로 등록할 때 폼 맨 위의 '고른 서비스' 줄. 요금을 어떻게 채우는지 한 줄로 알리고, 다른 서비스로 돌아간다. */
export function SelectedServiceBar({
  isCustom,
  preset,
  formData,
  onChangeService,
}: {
  isCustom: boolean;
  preset: ServicePreset | undefined;
  formData: Partial<SubscriptionFormData>;
  onChangeService: () => void;
}) {
  const f = useT().form.selected;
  const plans = preset?.plans ?? [];
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-muted/40">
      <div className="flex items-center gap-2.5 min-w-0">
        {isCustom ? (
          <SquarePen className="size-7 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ServiceLogo
            presetId={preset?.id}
            name={formData.name ?? ""}
            cancelUrl={formData.cancelUrl}
            fallbackEmoji={formData.iconUrl}
            size={28}
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{isCustom ? f.custom : formData.name}</p>
          <p className="text-[11px] text-muted-foreground break-keep">
            {isCustom
              ? f.notListed
              : plans.length > 0
                ? preset?.plansIncomplete
                  ? f.pickOrType
                  : f.pickPlan
                : typeof preset?.defaultAmount === "number"
                  ? f.basePrice
                  : f.typePrice}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChangeService}
        className="shrink-0 text-xs font-semibold text-primary hover:underline"
      >
        {f.change}
      </button>
    </div>
  );
}
