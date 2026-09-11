"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import {
  DEMO_SUBSCRIPTIONS,
  POPULAR_SERVICES,
  ServicePreset,
  SubscriptionFormData,
} from "@subslash/shared";
import { SubForm } from "../components/subscription/SubForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function Home() {
  const router = useRouter();
  const { subscriptions, addSubscription } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Partial<SubscriptionFormData> | undefined>(
    undefined,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    setSelectedPreset(undefined);
    setIsFormOpen(true);
  };

  const handlePresetClick = (preset: ServicePreset) => {
    setSelectedPreset({
      name: preset.nameKo,
      amount: preset.defaultAmount,
      currency: preset.currency,
      category: preset.category,
      cancelUrl: preset.cancelUrl,
      cancelGuide: preset.cancelGuide,
      iconUrl: preset.iconEmoji,
      // 결제일은 채우지 않는다. 15일로 채워 두면 손대지 않은 사람의 D-day가
      // 지어낸 날짜로 계산된다.
      billingCycle: "monthly",
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: SubscriptionFormData) => {
    addSubscription(data);
    setIsFormOpen(false);
    router.push("/dashboard");
  };

  // Demo sample loader — skips anything already registered so repeat clicks
  // do not pile up duplicates.
  const handleLoadDemo = () => {
    const existingNames = new Set(useStore.getState().subscriptions.map((sub) => sub.name));
    DEMO_SUBSCRIPTIONS.filter((item) => !existingNames.has(item.name)).forEach((item) =>
      addSubscription(item),
    );
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-8 max-w-2xl mx-auto text-center">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          ⚡ 능동형 디지털 구독 디톡스
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          구독은 자산이 아니라 <br />
          <span className="text-destructive underline decoration-wavy underline-offset-8">
            부채
          </span>
          입니다.
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
          매달 자동 결제되는 고정지출, 정말 그만한 가치가 있나요?
          <br />
          <strong>1회당 실제 사용 단가</strong>를 계산하고, 돈값을 못 하는 구독은 해지 방법까지
          안내받아 끊으세요.
        </p>
      </div>

      {/* Existing Subscriptions Banner */}
      {mounted && subscriptions.length > 0 && (
        <div className="w-full bg-secondary/80 border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="font-bold text-sm">
              현재 {subscriptions.length}개의 구독이 등록되어 있습니다.
            </p>
            <p className="text-xs text-muted-foreground">대시보드에서 가성비 상태를 점검하세요.</p>
          </div>
          <Button onClick={() => router.push("/dashboard")} variant="default">
            대시보드로 가기 →
          </Button>
        </div>
      )}

      {/* Primary CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button
          size="lg"
          className="h-14 px-8 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          onClick={handleStart}
        >
          ✂️ 지금 바로 시작하기
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 px-6 text-base font-medium rounded-xl border-2"
          onClick={handleLoadDemo}
        >
          ✨ 샘플 데이터로 1초 체험
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        🔒 별도 회원가입 없이 브라우저에 저장됩니다. 결제 알림을 켤 때만 이메일을 받습니다.
      </p>

      {/* Quick Add Presets Carousel / Grid */}
      <div className="w-full space-y-3 pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          자주 이용하는 서비스 빠른 등록
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_SERVICES.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border text-sm font-medium hover:bg-muted hover:border-primary/50 transition-all shadow-sm active:scale-95"
            >
              <span>{preset.iconEmoji}</span>
              <span>{preset.nameKo}</span>
              <span className="text-xs text-muted-foreground">
                ₩{(preset.defaultAmount / 1000).toFixed(0)}k
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3 Core Mechanisms */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 text-left">
        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="text-2xl">🚨</div>
          <h3 className="font-bold text-base">충격 요법 CPU 연산</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            월 17,000원 OTT를 지난달 1회 시청했다면? &ldquo;이번 달 영화 1편을 17,000원에
            보셨네요.&rdquo; 현실을 직시하게 만듭니다.
          </p>
        </div>
        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="text-2xl">⚡</div>
          <h3 className="font-bold text-base">해지 링크 + 단계별 안내</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            해지 메뉴가 깊숙이 숨어 있어도 찾아갈 수 있게 돕습니다. 해지 화면으로 바로 가는 링크가
            있는 서비스는 그리로, 없는 곳은 어디서 몇 단계를 더 가야 하는지 알려드립니다.
          </p>
        </div>
        <div className="p-5 border rounded-2xl bg-card shadow-sm space-y-2">
          <div className="text-2xl">💰</div>
          <h3 className="font-bold text-base">방어 성공 자산 시각화</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            해지를 마치고 기록하면 연간 절약 금액으로 환산되어 &ldquo;치킨 5마리&rdquo;,
            &ldquo;제주도 항공권&rdquo; 등의 실물 보상으로 치환됩니다.
          </p>
        </div>
      </div>

      {/* Subscription Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md text-left">
          <DialogHeader>
            <DialogTitle>새 구독 등록하기</DialogTitle>
            <DialogDescription>관리할 구독 서비스의 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              popularServices={POPULAR_SERVICES}
              initialData={selectedPreset}
              onSubmit={handleFormSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
