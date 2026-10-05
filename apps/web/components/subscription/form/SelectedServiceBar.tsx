import React from "react";
import { SquarePen } from "lucide-react";
import type { ServicePreset, SubscriptionFormData } from "@subslash/shared";
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
          <p className="text-sm font-bold truncate">{isCustom ? "직접 입력" : formData.name}</p>
          <p className="text-[11px] text-muted-foreground break-keep">
            {isCustom
              ? "목록에 없는 서비스"
              : plans.length > 0
                ? preset?.plansIncomplete
                  ? "요금제를 고르거나, 목록에 없으면 결제한 금액을 적어 주세요."
                  : "요금제를 고르면 요금이 채워져요."
                : typeof preset?.defaultAmount === "number"
                  ? "기본 요금이에요. 다르면 고쳐 주세요."
                  : "요금을 적어 주세요."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChangeService}
        className="shrink-0 text-xs font-semibold text-primary hover:underline"
      >
        다른 서비스
      </button>
    </div>
  );
}
