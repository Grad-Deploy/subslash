"use client";

import React from "react";
import { POPULAR_SERVICES, ServicePreset, formatCurrency } from "@subslash/shared";
import { Subscription } from "@subslash/shared";

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
  // Normalize existing names to lowercase for comparison
  const existingNames = new Set(subscriptions.map((s) => s.name.trim().toLowerCase()));

  // Find popular presets that haven't been added yet
  const unaddedPresets = POPULAR_SERVICES.filter((preset) => {
    const nameLower = preset.name.toLowerCase();
    const nameKoLower = preset.nameKo.toLowerCase();
    return (
      !existingNames.has(nameLower) &&
      !existingNames.has(nameKoLower) &&
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
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
            <span>💡</span> 혹시 이 서비스도 구독 중이신가요?
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            놓치기 쉬운 인기 구독 서비스를 탭하여 1초 만에 간편 등록하세요.
          </p>
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
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {preset.iconEmoji}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {preset.nameKo}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  월 {formatCurrency(preset.defaultAmount, preset.currency)}
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
