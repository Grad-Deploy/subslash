"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";

interface OnboardingTourCardProps {
  onStartAdd: () => void;
  activeCount: number;
}

const STORAGE_KEY = "subslash_onboarding_dismissed";

export function OnboardingTourCard({ onStartAdd, activeCount }: OnboardingTourCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(true); // default true until client checks storage

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setDismissed(true);
  };

  // If dismissed or if user already has 5+ subscriptions, hide automatically
  if (dismissed || activeCount >= 5) {
    return null;
  }

  return (
    <div className="p-5 border border-primary/20 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-secondary/30 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary mb-1.5">
            <span>✨</span> 3단계 디지털 구독 디톡스 루틴
          </div>
          <h3 className="font-bold text-base text-foreground">
            처음 오셨나요? SubSlash는 이렇게 사용합니다
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            매달 통장에서 조용히 빠져나가는 구독료, 단 3단계로 현실을 직시하고 통제하세요.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-muted-foreground hover:text-foreground font-medium p-1 rounded-lg hover:bg-muted transition-colors"
          title="가이드 닫기"
        >
          ✕ 닫기
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
            자주 쓰는 서비스를 목록에서 고르거나, 결제 문자를 붙여넣어 등록하세요.
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
            <span className="font-bold text-xs text-foreground">월간 이용 체크인</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            지난 30일 동안 몇 번 썼는지 고르면 1회 사용 단가가 나옵니다.
          </p>
          <div className="pt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md text-center">
            &ldquo;영화 1편을 ₩17,000에 보셨네요&rdquo;
          </div>
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
            돈값을 못 하는 구독은 해지 가이드를 따라 서비스에서 해지하세요. 해지 화면으로 바로 가는
            링크가 없는 곳은 메뉴까지 가는 단계를 안내합니다.
          </p>
          <div className="pt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md text-center">
            아낀 돈은 방어 자산으로 누적 💰
          </div>
        </div>
      </div>
    </div>
  );
}
