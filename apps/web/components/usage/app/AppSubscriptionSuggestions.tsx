"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ServicePreset, Subscription } from "@subslash/shared";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { formatDuration } from "@lib/usage/history";
import { readDeviceValue, SUGGEST_DISMISSED_KEY, writeDeviceValue } from "@lib/usage/storage";
import {
  dismissUntil,
  findSubscriptionSuggestions,
  SUGGEST_DISMISS_DAYS,
  type SubscriptionSuggestion,
  type SuggestDismissMap,
} from "@lib/usage/suggest";
import { ServiceLogo } from "../../subscription/ServiceLogo";
import { Button } from "../../ui/button";

/** 한 번에 보여 줄 후보 수. 많이 쓴 순으로 앞에서부터. */
const MAX_SHOWN = 2;

function parseDismissed(raw: string | null): SuggestDismissMap {
  try {
    const parsed = JSON.parse(raw ?? "{}") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as SuggestDismissMap) : {};
  } catch {
    return {};
  }
}

/**
 * 폰 기록으로 찾은 '등록하지 않았는데 쓰고 있는 구독'을 묻는 카드(안드로이드 앱, 대시보드).
 *
 * 등록은 사용자가 '내가 구독 중'을 누르고 폼에서 요금제를 고를 때만 한다 — 쓰는 것만으로는 누가 얼마를 내는지
 * 모른다(lib/usage/suggest). 가족·친구와 나눠 내면 폼에서 인원을 적는다. '내가 내지 않아요'는 가족 계정·무료
 * 시청·구독 안 함을 모두 담고, 90일 동안 다시 묻지 않는다.
 */
export function AppSubscriptionSuggestions({
  subscriptions,
  onAdd,
}: {
  /** 해지한 것까지 모든 구독. 해지한 서비스는 '다시 쓰고 있어요'로 묻는다. */
  subscriptions: Subscription[];
  onAdd: (preset: ServicePreset) => void;
}) {
  const { status, history } = usePhoneUsage();
  const [dismissed, setDismissed] = useState<SuggestDismissMap | null>(null);
  const [bundlesFor, setBundlesFor] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void readDeviceValue(SUGGEST_DISMISSED_KEY).then((raw) => {
      if (alive) setDismissed(parseDismissed(raw));
    });
    return () => {
      alive = false;
    };
  }, []);

  const suggestions = useMemo(
    () =>
      dismissed
        ? findSubscriptionSuggestions(subscriptions, history, dismissed, new Date()).slice(
            0,
            MAX_SHOWN,
          )
        : [],
    [subscriptions, history, dismissed],
  );

  if (status !== "on" || suggestions.length === 0) return null;

  const dismiss = (id: string) => {
    const next = { ...(dismissed ?? {}), [id]: dismissUntil(new Date()) };
    writeDeviceValue(SUGGEST_DISMISSED_KEY, JSON.stringify(next));
    setDismissed(next);
  };

  return (
    <section className="space-y-2" aria-label="폰 기록으로 찾은 구독">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.preset.id}
          suggestion={suggestion}
          showBundles={bundlesFor === suggestion.preset.id}
          onAdd={onAdd}
          onShowBundles={() => setBundlesFor(suggestion.preset.id)}
          onDismiss={() => dismiss(suggestion.preset.id)}
        />
      ))}
    </section>
  );
}

/** 후보 하나. 대시보드 카드와 '폰 사용 기록에서 찾기'가 함께 쓴다. */
export function SuggestionCard({
  suggestion,
  showBundles,
  onAdd,
  onShowBundles,
  onDismiss,
}: {
  suggestion: SubscriptionSuggestion;
  showBundles: boolean;
  onAdd: (preset: ServicePreset) => void;
  onShowBundles: () => void;
  /** '내가 내지 않아요'. 주지 않으면 그 버튼과 안내를 두지 않는다(사용자가 직접 찾은 목록). */
  onDismiss?: () => void;
}) {
  const { preset, totals, killed, bundles, appName, note } = suggestion;
  const name = preset.nameKo || preset.name;
  // 기록이 30일을 다 덮지 못했으면 덮은 날만큼이라고 적는다.
  const period = totals.coveredDays >= 30 ? "최근 30일" : `최근 ${totals.coveredDays}일`;

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <ServiceLogo presetId={preset.id} name={name} cancelUrl={preset.cancelUrl} size={32} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">
              {killed ? `해지한 ${name}, 다시 쓰고 있어요` : `${name}, 구독 중인가요?`}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">폰 기록</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {period} 이 폰{appName ? `의 ${appName} 앱` : ""}에서 {formatDuration(totals.usedMs)},{" "}
            {totals.activeDays}일 썼어요.{" "}
            {killed ? "다시 구독했다면 새로 등록해요." : "등록하지 않은 서비스예요."} 가족·친구와
            나눠 내면 등록할 때 인원을 적어요.{note ? ` ${note}` : ""}
          </p>
        </div>
      </div>

      {showBundles ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">어느 상품으로 받나요?</p>
          <div className="flex flex-wrap gap-2">
            {bundles.map((bundle) => (
              <Button
                key={bundle.id}
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onAdd(bundle)}
              >
                {bundle.nameKo || bundle.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="flex-1 text-xs font-bold" onClick={() => onAdd(preset)}>
            {killed ? "다시 구독했어요" : "내가 구독 중"}
          </Button>
          {bundles.length > 0 && (
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={onShowBundles}>
              결합 상품으로 받아요
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={onDismiss}>
              내가 내지 않아요
            </Button>
          )}
        </div>
      )}
      {onDismiss && (
        <p className="text-[11px] text-muted-foreground">
          &lsquo;내가 내지 않아요&rsquo;는 가족 계정·무료 시청·구독 안 함이에요.{" "}
          {SUGGEST_DISMISS_DAYS}일 동안 묻지 않아요.
        </p>
      )}
    </div>
  );
}
