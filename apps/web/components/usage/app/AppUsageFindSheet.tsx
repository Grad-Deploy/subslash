"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { POPULAR_SERVICES, type ServicePreset } from "@subslash/shared";
import { usePhoneUsage, usePhoneUsageStore } from "@hooks/usePhoneUsage";
import { realRecords, useStore } from "@lib/store";
import { lastDays } from "@lib/usage/history";
import {
  SUGGEST_MIN_COVERED_DAYS,
  SUGGEST_SIGNALS,
  SUGGESTABLE_SERVICES,
  findSubscriptionSuggestions,
} from "@lib/usage/suggest";
import { AppSheet } from "../../settings/app/AppSheet";
import { Spinner } from "../../ui/spinner";
import { useT } from "@lib/i18n";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { SuggestionCard } from "./AppSubscriptionSuggestions";

// 보는 앱의 이름으로 적는다(유튜브 프리미엄은 유튜브 뮤직 앱, 쿠팡 와우는 쿠팡플레이 앱).
const SERVICE_NAMES = SUGGESTABLE_SERVICES.map(
  (id) =>
    SUGGEST_SIGNALS[id]?.appName ??
    POPULAR_SERVICES.find((preset) => preset.id === id)?.nameKo ??
    id,
).join("·");

/**
 * '구독 추가 › 폰 사용 기록에서 찾기'(안드로이드 앱). '사용 기록 액세스'가 꺼져 있으면 먼저 켜는 안내를
 * 보여 주고, 켜고 돌아오면 곧바로 이 폰에서 쓴 OTT 중 등록하지 않은 것을 보여 준다.
 *
 * 대시보드 카드(AppSubscriptionSuggestions)와 같은 기준으로 찾되, 사용자가 직접 누른 것이라 기록이 며칠뿐이어도
 * 찾고 몇 일치 기록인지 함께 적는다. '내가 내지 않아요'로 숨긴 서비스도 보여 준다 — 찾으려고 누른 사람에게
 * 숨긴 것을 빼면 왜 없는지 알 수 없다. 등록은 여기서 하지 않고 등록 폼을 연다(onPick).
 */
export function AppUsageFindSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (preset: ServicePreset) => void;
}) {
  const f = useT().usageMore.find;
  const { status, history, refreshing } = usePhoneUsage();
  const subscriptions = useStore((state) => realRecords(state).subscriptions);
  const [bundlesFor, setBundlesFor] = useState<string | null>(null);

  // 열 때마다 최신 기록을 읽는다(방금 본 영상까지 들어가게).
  useEffect(() => {
    if (open) void usePhoneUsageStore.getState().refresh(true);
  }, [open]);

  const { suggestions, coveredDays } = useMemo(() => {
    const now = new Date();
    return {
      suggestions: findSubscriptionSuggestions(subscriptions, history, {}, now, 1),
      coveredDays: lastDays(now, 30).filter((date) => history.days[date]).length,
    };
  }, [subscriptions, history]);

  if (status === "unsupported") return null;

  // 권한을 확인하는 동안에도 누른 것이 보이게 한다.
  if (status === "loading") {
    return (
      <AppSheet open={open} onClose={onClose} label={f.label}>
        <div className="flex justify-center py-10">
          <Spinner className="size-5" />
        </div>
      </AppSheet>
    );
  }

  if (status !== "on") {
    return (
      <AppUsageAccessSheet
        open={open}
        onClose={onClose}
        title={
          <>
            {f.accessTitle1}
            <br />
            {f.accessTitle2}
          </>
        }
        description={f.accessBody(SERVICE_NAMES)}
      />
    );
  }

  const pick = (preset: ServicePreset) => {
    onClose();
    onPick(preset);
  };

  return (
    <AppSheet open={open} onClose={onClose} label={f.label}>
      <div className="space-y-4 pt-1">
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight">{f.label}</h2>
          <p className="text-xs text-muted-foreground">
            {coveredDays > 0 ? f.covered(coveredDays) : f.noRecords} {f.scope(SERVICE_NAMES)}
          </p>
        </div>

        {refreshing && suggestions.length === 0 ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-5" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.preset.id}
                suggestion={suggestion}
                showBundles={bundlesFor === suggestion.preset.id}
                onAdd={pick}
                onShowBundles={() => setBundlesFor(suggestion.preset.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/50 px-4 py-6 text-center">
            <SearchX className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-bold">{f.none}</p>
            <p className="text-xs text-muted-foreground">
              {coveredDays < SUGGEST_MIN_COVERED_DAYS ? f.fewDays(coveredDays) : f.noneEnough}
            </p>
          </div>
        )}
      </div>
    </AppSheet>
  );
}
