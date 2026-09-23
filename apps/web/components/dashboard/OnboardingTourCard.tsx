"use client";

import React from "react";
import { Button } from "../ui/button";
import { useStoredFlag } from "@hooks/useStoredFlag";

interface OnboardingTourCardProps {
  onStartAdd: () => void;
  activeCount: number;
}

const STORAGE_KEY = "subslash_onboarding_dismissed";

export function OnboardingTourCard({ onStartAdd, activeCount }: OnboardingTourCardProps) {
  // 서버와 하이드레이션 동안은 숨겨 둔다. 닫은 사람에게 한 번 번쩍이지 않게.
  const [dismissed, handleDismiss] = useStoredFlag(STORAGE_KEY, true);

  // If dismissed or if user already has 5+ subscriptions, hide automatically
  if (dismissed || activeCount >= 5) {
    return null;
  }

  return (
    <div className="p-5 border border-primary/20 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/30 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary mb-1.5">
            시작하기
          </div>
          <h3 className="font-bold text-base text-foreground">3단계로 시작해요</h3>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 whitespace-nowrap text-xs text-muted-foreground hover:text-foreground font-medium p-1 rounded-lg hover:bg-muted transition-colors"
          title="가이드 닫기"
        >
          닫기
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              1
            </span>
            <span className="font-bold text-xs text-foreground">구독 등록하기</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            목록에서 서비스를 고르세요.
          </p>
          <div className="pt-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs h-8 font-semibold"
              onClick={onStartAdd}
            >
              + 지금 등록
            </Button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              2
            </span>
            <span className="font-bold text-xs text-foreground">한 달에 한 번 체크인</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            몇 번 썼는지 고르면 1회 단가가 나와요.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 rounded-xl border bg-card/80 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-destructive/10 text-destructive text-xs font-bold">
              3
            </span>
            <span className="font-bold text-xs text-foreground">해지하고 기록하기</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            해지 가이드를 따라 서비스에서 해지하세요.
          </p>
          <div className="pt-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md text-center">
            결제일이 지나면 지킨 돈으로 쌓여요
          </div>
        </div>
      </div>
    </div>
  );
}
