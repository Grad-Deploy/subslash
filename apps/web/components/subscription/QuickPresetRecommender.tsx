"use client";

import React from "react";
import { POPULAR_SERVICES, ServicePreset, findPresetForSubscription } from "@subslash/shared";
import { Subscription } from "@subslash/shared";
import { useServiceNames, useT } from "@lib/i18n";
import { describePresetPriceText } from "@lib/i18n/preset-price";
import { ServiceLogo } from "./ServiceLogo";

interface QuickPresetRecommenderProps {
  subscriptions: Subscription[];
  onSelectPreset: (preset: ServicePreset) => void;
  maxItems?: number;
}

export function QuickPresetRecommender({
  subscriptions,
  onSelectPreset,
  maxItems = 6,
}: QuickPresetRecommenderProps) {
  const all = useT();
  const t = all.subs.recommend;
  const names = useServiceNames();
  // Normalize existing names to lowercase for comparison
  const existingNames = new Set(subscriptions.map((s) => s.name.trim().toLowerCase()));
  // 이름을 고쳐 적은 구독('쿠팡 와우 멤버십')은 이름으로는 목록과 맞지 않는다. 해지 주소로도 찾아 뺀다 —
  // 이름으로만 견줄 때는 이미 등록한 쿠팡 와우를 '혹시 구독 중이신가요?'로 다시 권했다.
  // 결합 상품이 함께 주는 서비스도 뺀다. 티빙 x 웨이브 더블 이용권을 등록한 사람에게 티빙·웨이브를 권하면 두 번
  // 내라는 말이 된다(리포트는 그 경우를 '두 번 내고 있을 수 있어요'로 알린다).
  const existingPresetIds = new Set(
    subscriptions.flatMap((s) => {
      const preset = findPresetForSubscription(s);
      return preset ? [preset.id, ...(preset.includes ?? [])] : [];
    }),
  );

  // Find popular presets that haven't been added yet
  const unaddedPresets = POPULAR_SERVICES.filter((preset) => {
    const nameLower = preset.name.toLowerCase();
    const nameKoLower = preset.nameKo.toLowerCase();
    // 영어 화면에서 등록하면 영문 이름(nameEn)으로 저장된다.
    const nameEnLower = preset.nameEn?.toLowerCase();
    return (
      !existingPresetIds.has(preset.id) &&
      !existingNames.has(nameLower) &&
      !existingNames.has(nameKoLower) &&
      !(nameEnLower && existingNames.has(nameEnLower)) &&
      !Array.from(existingNames).some(
        (existing) => existing.includes(nameKoLower) || nameKoLower.includes(existing),
      )
    );
  }).slice(0, maxItems);

  if (unaddedPresets.length === 0) {
    return null;
  }

  return (
    <section className="p-4 sm:p-5 border rounded-2xl bg-card shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">{t.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.hint}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        {unaddedPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="flex items-center justify-between p-3 rounded-xl border bg-background hover:bg-muted/80 hover:border-primary/40 text-left transition-all group shadow-xs active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ServiceLogo
                presetId={preset.id}
                name={preset.nameKo}
                size={28}
                className="group-hover:scale-110 transition-transform"
              />
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {names.preset(preset)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {describePresetPriceText(all, preset)}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary opacity-80 group-hover:opacity-100 ml-1">
              +
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
