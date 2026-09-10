"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "../../lib/store";
import {
  Subscription,
  SubscriptionFormData,
  CheckInResponse,
  DEMO_SUBSCRIPTIONS,
  POPULAR_SERVICES,
  ServicePreset,
  getDaysUntilBillingFor,
} from "@subslash/shared";
import { TotalSpend } from "../../components/dashboard/TotalSpend";
import { SavingsPot } from "../../components/dashboard/SavingsPot";
import { OnboardingTourCard } from "../../components/dashboard/OnboardingTourCard";
import { MonthlyDefenseWidget } from "../../components/dashboard/MonthlyDefenseWidget";
import { PriceCheckBanner } from "../../components/dashboard/PriceCheckBanner";
import { DetoxLevelBadge } from "../../components/savings/DetoxLevelBadge";
import { QuickPresetRecommender } from "../../components/subscription/QuickPresetRecommender";
import { SubCard } from "../../components/subscription/SubCard";
import { SubForm } from "../../components/subscription/SubForm";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { CancelGuideModal } from "../../components/subscription/CancelGuideModal";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { ExchangeRateNote } from "../../components/settings/ExchangeRateNote";

export default function Dashboard() {
  const {
    subscriptions,
    addSubscription,
    killSubscription,
    checkIn,
    getActiveSubscriptions,
    getKilledSubscriptions,
    getDashboardStats,
    getAtRiskSubscriptions,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [checkInSub, setCheckInSub] = useState<Subscription | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [killTarget, setKillTarget] = useState<Subscription | null>(null);
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-3xl">✂️</div>
      </div>
    );
  }

  const activeSubs = getActiveSubscriptions();
  const killedSubs = getKilledSubscriptions();
  const atRiskSubs = getAtRiskSubscriptions();
  const stats = getDashboardStats();

  // Sort upcoming subscriptions by days until billing. A yearly plan with no
  // billing month has no date, so it sorts last rather than pretending to be
  // due today.
  const sortedActiveSubs = [...activeSubs].sort((a, b) => {
    const left = getDaysUntilBillingFor(a) ?? Number.POSITIVE_INFINITY;
    const right = getDaysUntilBillingFor(b) ?? Number.POSITIVE_INFINITY;
    return left - right;
  });

  const handleOpenCheckIn = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) {
      setCheckInSub(sub);
      setCheckInResult(undefined);
    }
  };

  const handleCheckInSubmit = (count: number) => {
    if (!checkInSub) return;
    try {
      const res = checkIn(checkInSub.id, count);
      setCheckInResult(res);
      showToast(`${checkInSub.name} 체크인이 완료되었습니다.`);
    } catch (error) {
      console.error(error);
      showToast("체크인 중 오류가 발생했습니다.");
    }
  };

  // 해지 버튼은 곧바로 완료 처리하지 않는다. 실제 해지는 서비스 쪽에서
  // 해야 하므로, 먼저 가이드를 열어 거기까지 데려다준 뒤 확인을 받는다.
  const handleKill = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setGuideTarget(sub);
  };

  const handleConfirmKilled = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setKillTarget(sub);
  };

  const handleAddSubmit = (data: SubscriptionFormData) => {
    addSubscription(data);
    setIsAddOpen(false);
    showToast(`✅ ${data.name} 구독이 등록되었습니다.`);
  };

  const handleLoadDemo = () => {
    const existingNames = new Set(useStore.getState().subscriptions.map((sub) => sub.name));
    const added = DEMO_SUBSCRIPTIONS.filter((item) => !existingNames.has(item.name));
    added.forEach((item) => addSubscription(item));
    showToast(
      added.length > 0
        ? `샘플 구독 ${added.length}개가 등록되었습니다.`
        : "샘플 구독이 이미 모두 등록되어 있습니다.",
    );
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">구독 디톡스 대시보드</h1>
          <p className="text-sm text-muted-foreground">
            현재 구독 상태를 점검하고 불필요한 결제를 차단하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSubs.length === 0 && (
            <Button variant="outline" size="sm" onClick={handleLoadDemo}>
              ✨ 샘플 불러오기
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoImportOpen(true)}
            className="font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
          >
            <span>⚡</span> 자동 불러오기
          </Button>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="font-bold">
            + 새 구독 등록
          </Button>
        </div>
      </div>

      {/* Onboarding Tour Card for New/Early Users (Issue 17) */}
      <OnboardingTourCard onStartAdd={() => setIsAddOpen(true)} activeCount={activeSubs.length} />

      {/* Price Check Prompt (Issue 13) */}
      <PriceCheckBanner subscriptions={activeSubs} />

      {/* Top Section: Total Monthly Spend Hero */}
      <TotalSpend subscriptions={activeSubs} />

      <ExchangeRateNote />

      {/* 4 Quick Stat Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 border rounded-2xl bg-card shadow-sm text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">활성 구독</p>
          <p className="text-2xl font-black text-foreground">{stats.activeCount}개</p>
        </div>
        <div className="p-4 border rounded-2xl bg-card shadow-sm text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">방어(해지) 완료</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">
            {stats.killedCount}개
          </p>
        </div>
        <div className="p-4 border rounded-2xl bg-card shadow-sm text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">월 고정지출</p>
          <p className="text-2xl font-black text-foreground">
            ₩{stats.totalMonthlySpend.toLocaleString()}
          </p>
        </div>
        <div className="p-4 border rounded-2xl bg-card shadow-sm text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">연간 절약 방어액</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₩{stats.totalSaved.toLocaleString()}
          </p>
        </div>
      </section>

      {/* At Risk Alert Section */}
      {atRiskSubs.length > 0 && (
        <section className="p-5 border-2 border-destructive/30 bg-destructive/5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-destructive font-black text-base">
            <span>🚨</span>
            <h2>가성비 위험 구독 ({atRiskSubs.length}건)</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            이용 횟수 대비 1회당 단가가 비정상적으로 높습니다. 지금 바로 킬(Kill) 스위치를 켜세요.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {atRiskSubs.map((sub) => (
              <SubCard
                key={sub.id}
                subscription={sub}
                onCheckIn={handleOpenCheckIn}
                onKill={handleKill}
              />
            ))}
          </div>
        </section>
      )}

      {/* Saved Pot (Defended Subscriptions) Section */}
      {killedSubs.length > 0 && (
        <section className="space-y-4">
          {/* This month's defended spend (Issue 8) */}
          <MonthlyDefenseWidget killedSubscriptions={killedSubs} />
          {/* Detox level & title (Phase 3) */}
          <DetoxLevelBadge annualSavings={stats.totalSaved} killCount={stats.killedCount} />
          <SavingsPot killedSubscriptions={killedSubs} />
        </section>
      )}

      {/* Main Subscriptions List: Sorted by D-Day */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            🔥 다음 결제 임박 순 ({sortedActiveSubs.length})
          </h2>
          <span className="text-xs text-muted-foreground">D-Day 순으로 자동 정렬됩니다</span>
        </div>

        {sortedActiveSubs.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-2xl space-y-4">
            <div className="text-4xl">🎉</div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">등록된 활성 구독이 없습니다</h3>
              <p className="text-sm text-muted-foreground">
                매달 나가는 고정 구독을 등록하고 1회당 사용 가치를 점검해보세요.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => setIsAddOpen(true)}>+ 첫 구독 등록하기</Button>
              <Button variant="outline" onClick={handleLoadDemo}>
                ✨ 샘플 데이터 불러오기
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedActiveSubs.map((sub) => (
              <SubCard
                key={sub.id}
                subscription={sub}
                onCheckIn={handleOpenCheckIn}
                onKill={handleKill}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Preset Recommender (Issue 19) */}
      <QuickPresetRecommender
        subscriptions={subscriptions}
        onSelectPreset={(preset) => {
          setSelectedPreset(preset);
          setIsAddOpen(true);
        }}
      />

      {/* SubForm Modal for Adding */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) setSelectedPreset(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPreset ? `${selectedPreset.nameKo} 등록` : "새 구독 등록"}
            </DialogTitle>
            <DialogDescription>인기 서비스를 선택하거나 직접 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              popularServices={POPULAR_SERVICES}
              initialData={
                selectedPreset
                  ? {
                      name: selectedPreset.nameKo || selectedPreset.name,
                      amount: selectedPreset.defaultAmount,
                      currency: selectedPreset.currency,
                      cancelUrl: selectedPreset.cancelUrl,
                      cancelGuide: selectedPreset.cancelGuide,
                      category: selectedPreset.category,
                      iconUrl: selectedPreset.iconEmoji,
                    }
                  : undefined
              }
              onSubmit={handleAddSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* CheckIn Modal for Calculating CPU */}
      {checkInSub && (
        <CheckInModal
          subscription={checkInSub}
          isOpen={!!checkInSub}
          onClose={() => setCheckInSub(null)}
          onSubmit={handleCheckInSubmit}
          onKill={handleKill}
          result={checkInResult}
        />
      )}

      {/* Auto Import Hub Modal */}
      <AutoImportModal isOpen={isAutoImportOpen} onClose={() => setIsAutoImportOpen(false)} />

      {/* Cancel Guide Modal (Issue 14) */}
      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {/* Kill Confirmation Modal */}
      {killTarget && (
        <ConfirmDialog
          isOpen={!!killTarget}
          onClose={() => setKillTarget(null)}
          onConfirm={() => {
            if (killTarget) {
              killSubscription(killTarget.id);
              showToast(`🔪 ${killTarget.name}을(를) 성공적으로 차단했습니다!`);
              setKillTarget(null);
            }
          }}
          title="구독 해지 완료 처리"
          description={`'${killTarget.name}' 구독을 해지(방어) 완료 상태로 전환하시겠습니까?\n방어 성공 자산으로 기록되며 대시보드와 절약 현황에 반영됩니다.`}
          confirmText="해지 완료"
          cancelText="취소"
          variant="destructive"
        />
      )}
    </div>
  );
}
