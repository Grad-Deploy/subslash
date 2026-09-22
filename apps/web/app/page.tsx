"use client";

import React, { useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import {
  POPULAR_SERVICES,
  ServicePreset,
  SubscriptionFormData,
  describePresetPrice,
  presetFormData,
} from "@subslash/shared";
import { SubForm } from "../components/subscription/SubForm";
import { UnitCostHero } from "../components/home/UnitCostHero";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { ServiceLogo } from "@components/subscription/ServiceLogo";

/**
 * 처음 온 사람이 "여기가 뭐 하는 곳인지" 알 수 있게, 앱이 실제로 하는 일을
 * 순서대로 적는다. 앱이 대신 해주지 않는 일(해지 자체)은 대신 해준다고 쓰지 않는다.
 */
const HOW_IT_WORKS = [
  {
    title: "구독 등록",
    body: "목록에서 서비스를 고르면 요금과 해지 방법이 채워집니다. 결제 문자·영수증을 붙여 넣어 한 번에 불러올 수도 있어요.",
  },
  {
    title: "한 달에 한 번 체크인",
    body: "“지난 30일 동안 몇 번 썼나요?”에 답하면 1회당 실제 단가와 초록·노랑·빨강 신호가 나옵니다.",
  },
  {
    title: "해지 방법 안내",
    body: "해지는 각 서비스에서 직접 합니다. 해지 화면으로 바로 가는 링크가 있으면 그리로, 없으면 어느 메뉴로 가야 하는지 단계별로 알려드려요.",
  },
  {
    title: "지킨 돈 기록",
    body: "해지 후 첫 결제일이 지나 결제가 정말 멈췄는지 확인하면, 그 금액이 절약 현황에 ‘지킨 돈’으로 쌓입니다.",
  },
] as const;

export default function Home() {
  const router = useRouter();
  const { subscriptions, addSubscription, startDemo } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Partial<SubscriptionFormData> | undefined>(
    undefined,
  );
  const mounted = useIsClient();
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;
  const killedCount = subscriptions.filter((sub) => sub.status === "killed").length;

  const handleStart = () => {
    setSelectedPreset(undefined);
    setIsFormOpen(true);
  };

  const handlePresetClick = (preset: ServicePreset) => {
    setSelectedPreset(presetFormData(preset));
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: SubscriptionFormData) => {
    addSubscription(data);
    setIsFormOpen(false);
    router.push("/dashboard");
  };

  // 샘플은 내 구독에 더하지 않고 잠시 동안만 보여준다(store의 DemoSession).
  const handleLoadDemo = () => {
    startDemo();
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-10 py-4">
      <UnitCostHero onStart={handleStart} onDemo={handleLoadDemo} />

      {/*
        구독 중인 것과 해지한 것을 따로 센다. 예전에는 해지한 구독까지 합쳐
        "N개의 구독이 등록되어 있습니다"라고 하고 대시보드로 보냈는데, 대시보드와
        내 구독의 활성 탭에는 하나도 없었다.
      */}
      {mounted && subscriptions.length > 0 && (
        <div className="w-full bg-secondary/80 border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            {activeCount > 0 ? (
              <>
                <p className="font-bold text-sm">
                  현재 구독 중인 서비스가 {activeCount}개 있습니다.
                </p>
                <p className="text-xs text-muted-foreground">
                  대시보드에서 가성비 상태를 점검하세요.
                  {killedCount > 0 && ` 해지한 구독 ${killedCount}개는 절약 현황에 있습니다.`}
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-sm">지금 구독 중인 서비스는 없습니다.</p>
                <p className="text-xs text-muted-foreground">
                  해지한 구독 {killedCount}개는 절약 현황에서 볼 수 있습니다.
                </p>
              </>
            )}
          </div>
          {activeCount > 0 ? (
            <Button onClick={() => router.push("/dashboard")} variant="default">
              대시보드로 가기 →
            </Button>
          ) : (
            <Button onClick={() => router.push("/savings")} variant="default">
              절약 현황 보기 →
            </Button>
          )}
        </div>
      )}

      {/* SubSlash가 하는 일 */}
      <section className="w-full space-y-4" aria-labelledby="how-it-works">
        <div className="space-y-1">
          <h2 id="how-it-works" className="text-xl font-bold tracking-tight">
            SubSlash는 이렇게 도와드려요
          </h2>
          <p className="text-sm text-muted-foreground">
            매달 빠져나가는 구독을 모아 두고, 실제로 쓴 만큼 값을 하는지 확인해 돈값을 못 하는
            구독을 끊도록 돕는 가계부입니다.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="space-y-2 rounded-2xl border bg-card p-5 shadow-sm">
              {/* 순서는 1단계라는 글자가 말한다. 앞에 붙던 이모지는 같은 말을 되풀이했다. */}
              <span className="text-xs font-semibold text-muted-foreground">{i + 1}단계</span>
              <h3 className="text-base font-bold">{step.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Quick Add Presets */}
      <section className="w-full space-y-3" aria-labelledby="quick-add">
        <h2
          id="quick-add"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          자주 이용하는 서비스 빠른 등록
        </h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SERVICES.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border text-sm font-medium hover:bg-muted hover:border-primary/50 transition-all shadow-sm active:scale-95"
            >
              <ServiceLogo presetId={preset.id} name={preset.nameKo} size={18} />
              <span>{preset.nameKo}</span>
              <span className="text-xs text-muted-foreground">{describePresetPrice(preset)}</span>
            </button>
          ))}
        </div>
      </section>

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
