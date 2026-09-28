"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { POPULAR_SERVICES, type ServicePreset } from "@subslash/shared";
import { usePhoneUsage, usePhoneUsageStore } from "@hooks/usePhoneUsage";
import { realRecords, useStore } from "@lib/store";
import { lastDays } from "@lib/usage/history";
import {
  SUGGEST_MIN_COVERED_DAYS,
  SUGGESTABLE_SERVICES,
  findSubscriptionSuggestions,
} from "@lib/usage/suggest";
import { AppSheet } from "../../settings/app/AppSheet";
import { Spinner } from "../../ui/spinner";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";
import { SuggestionCard } from "./AppSubscriptionSuggestions";

const SERVICE_NAMES = SUGGESTABLE_SERVICES.map(
  (id) => POPULAR_SERVICES.find((preset) => preset.id === id)?.nameKo ?? id,
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
      <AppSheet open={open} onClose={onClose} label="폰 사용 기록에서 찾기">
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
            폰 사용 기록으로
            <br />
            구독을 찾을까요?
          </>
        }
        description={
          <>
            안드로이드 설정의 &lsquo;사용 기록 액세스&rsquo;를 켜면, {SERVICE_NAMES} 앱을 이 폰에서
            얼마나 썼는지 보고 등록하지 않은 구독을 찾아요.
          </>
        }
      />
    );
  }

  const pick = (preset: ServicePreset) => {
    onClose();
    onPick(preset);
  };

  return (
    <AppSheet open={open} onClose={onClose} label="폰 사용 기록에서 찾기">
      <div className="space-y-4 pt-1">
        <div className="space-y-1">
          <h2 className="text-lg font-black tracking-tight">폰 사용 기록에서 찾기</h2>
          <p className="text-xs text-muted-foreground">
            {coveredDays > 0
              ? `최근 30일 중 ${coveredDays}일치 기록으로 찾았어요.`
              : "아직 읽은 기록이 없어요."}{" "}
            {SERVICE_NAMES}를 찾고, TV·PC에서 본 것은 빠져요.
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
            <p className="text-sm font-bold">등록하지 않은 OTT를 찾지 못했어요</p>
            <p className="text-xs text-muted-foreground">
              {coveredDays < SUGGEST_MIN_COVERED_DAYS
                ? `기록이 ${coveredDays}일치뿐이에요. 며칠 더 쓰고 다시 찾아보세요.`
                : "이미 모두 등록했거나, 1시간·3일 넘게 쓴 앱이 없어요."}
            </p>
          </div>
        )}
      </div>
    </AppSheet>
  );
}
