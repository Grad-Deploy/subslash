"use client";

import React, { useEffect, useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import { IS_APP_BUILD } from "@lib/platform";
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
    body: "서비스를 고르면 요금과 해지 방법이 채워져요.",
  },
  {
    title: "한 달에 한 번 체크인",
    body: "몇 번 썼는지 답하면 1회당 단가가 나와요.",
  },
  {
    title: "해지 방법 안내",
    body: "해지 화면이나 메뉴 경로를 알려 드려요. 해지는 서비스에서 직접 해요.",
  },
  {
    title: "지킨 돈 기록",
    body: "해지 후 결제가 멈춘 걸 확인하면 절약액으로 쌓여요.",
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

  // 앱의 첫 화면은 대시보드다. 앱을 켜면 이 페이지(index.html)부터 열리지만, 실행 화면(인트로·짧은
  // 로고)이 가린 사이에 대시보드로 옮긴다. 소개용 홈은 웹에서만 쓴다.
  useEffect(() => {
    if (IS_APP_BUILD) router.replace("/dashboard");
  }, [router]);

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
                <p className="font-bold text-sm">구독 중 {activeCount}개</p>
                {killedCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    해지한 {killedCount}개는 절약 현황에 있어요.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-sm">구독 중인 서비스 없음</p>
                <p className="text-xs text-muted-foreground">
                  해지한 {killedCount}개는 절약 현황에 있어요.
                </p>
              </>
            )}
          </div>
          {activeCount > 0 ? (
            <Button onClick={() => router.push("/dashboard")} variant="default">
              대시보드 →
            </Button>
          ) : (
            <Button onClick={() => router.push("/savings")} variant="default">
              절약 현황 →
            </Button>
          )}
        </div>
      )}

      {/* SubSlash가 하는 일 */}
      <section className="w-full space-y-4" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-xl font-bold tracking-tight">
          이렇게 써요
        </h2>
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
          바로 등록
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
            <DialogTitle>구독 등록</DialogTitle>
            <DialogDescription>서비스를 고르고 요금을 확인하세요.</DialogDescription>
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
