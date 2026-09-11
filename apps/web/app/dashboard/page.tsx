"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";
import {
  Subscription,
  SubscriptionFormData,
  CheckInResponse,
  DEMO_SUBSCRIPTIONS,
  POPULAR_SERVICES,
  formatCurrency,
  formatKRW,
  getActionQueue,
  getDetoxLevel,
  getNextBillingHint,
  getSavingsTiers,
} from "@subslash/shared";
import { TotalSpend } from "../../components/dashboard/TotalSpend";
import { OnboardingTourCard } from "../../components/dashboard/OnboardingTourCard";
import { ActionQueue } from "../../components/dashboard/ActionQueue";
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
import { useExchangeRate } from "../../hooks/useExchangeRate";

/**
 * 대시보드는 "지금 무엇을 결정할까"에만 답한다.
 *
 * 예전에는 구독 카드 그리드, 추천 프리셋, 절약 위젯을 한 화면에 모아둬서
 * /subs와 /savings를 요약해 붙여놓은 모양이었다. 세 탭이 서로 비슷해 보였던
 * 이유이고, 대시보드에 고유한 일이 없었던 이유이기도 하다.
 *
 * 이제 목록은 /subs, 성과는 /savings, 행동은 여기다.
 */
export default function Dashboard() {
  const {
    subscriptions,
    usageLogs,
    addSubscription,
    killSubscription,
    reviveSubscription,
    confirmKillVerified,
    confirmSubscriptionPrice,
    checkIn,
    getActiveSubscriptions,
    getKilledSubscriptions,
    getDashboardStats,
  } = useStore();
  const rate = useExchangeRate();

  const [mounted, setMounted] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [checkInSub, setCheckInSub] = useState<Subscription | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);
  const [killTarget, setKillTarget] = useState<Subscription | null>(null);
  const [chargedTarget, setChargedTarget] = useState<Subscription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const stats = getDashboardStats();

  const now = new Date();
  const queue = getActionQueue(subscriptions, usageLogs, now, rate);
  const nextBilling = getNextBillingHint(subscriptions, now);
  const tiers = getSavingsTiers(killedSubs, now, rate);
  const detoxLevel = getDetoxLevel(stats.totalSaved, stats.killedCount);

  const findSub = (id: string) => subscriptions.find((s) => s.id === id);

  const handleOpenCheckIn = (id: string) => {
    const sub = findSub(id);
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

  // 실제 해지는 서비스 쪽에서 해야 하므로 가이드를 먼저 열고, 마쳤다고
  // 알려줄 때만 완료로 기록한다.
  const handleCancelGuide = (id: string) => {
    const sub = findSub(id);
    if (sub) setGuideTarget(sub);
  };

  const handleConfirmKilled = (id: string) => {
    const sub = findSub(id);
    if (sub) setKillTarget(sub);
  };

  const handleConfirmPrice = (id: string, newAmount?: number) => {
    const sub = findSub(id);
    if (!sub) return;
    confirmSubscriptionPrice(id, newAmount);
    showToast(
      newAmount !== undefined
        ? `${sub.name} 요금을 ${formatCurrency(newAmount, sub.currency)}으로 갱신했습니다.`
        : `${sub.name} 요금을 확인한 것으로 기록했습니다.`,
    );
  };

  // 해지 뒤 첫 결제일에 결제가 없었다는 답만이 해지를 확인해 준다.
  const handleKillNotCharged = (id: string) => {
    const sub = findSub(id);
    if (!sub) return;
    confirmKillVerified(id);
    showToast(`✅ ${sub.name} 결제가 멈춘 것을 확인했습니다.`);
  };

  const handleKillCharged = (id: string) => {
    const sub = findSub(id);
    if (sub) setChargedTarget(sub);
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
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">오늘의 구독 점검</h1>
          <p className="text-sm text-muted-foreground">
            결정이 필요한 구독만 모았습니다. 전체 목록은 &lsquo;내 구독&rsquo;에 있습니다.
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

      <OnboardingTourCard onStartAdd={() => setIsAddOpen(true)} activeCount={activeSubs.length} />

      {/* 지금 결정할 것 — 이 화면의 본체 */}
      <ActionQueue
        items={queue}
        nextBilling={nextBilling}
        activeCount={activeSubs.length}
        onCheckIn={handleOpenCheckIn}
        onCancelGuide={handleCancelGuide}
        onConfirmPrice={handleConfirmPrice}
        onKillNotCharged={handleKillNotCharged}
        onKillCharged={handleKillCharged}
        onAddFirst={() => setIsAddOpen(true)}
      />

      {/* 지출 한 줄 */}
      <TotalSpend subscriptions={activeSubs} />
      <ExchangeRateNote />

      {/*
        절약 성과는 /savings가 전담한다. 여기서는 이번 달 실제로 막은 금액과
        레벨만 한 줄로 보여주고 넘긴다 — 같은 위젯을 두 화면에 두면 어느 쪽이
        본체인지 알 수 없게 된다.
      */}
      {killedSubs.length > 0 && (
        <Link
          href="/savings"
          className="flex items-center justify-between gap-3 p-4 border rounded-2xl bg-card hover:bg-muted transition-colors"
        >
          <div className="min-w-0">
            {/* 머리 숫자는 결제가 멈춘 것을 확인한 돈뿐이다. 1년치 요금은 아끼는 속도로 적는다. */}
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              ✅ 지킨 돈
            </p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatKRW(tiers.confirmed)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {tiers.pending > 0 && `⏳ 확인 대기 ${formatKRW(tiers.pending)} · `}연{" "}
              {formatKRW(tiers.annualRunRate)} 아끼는 중 · {detoxLevel.emoji}{" "}
              {detoxLevel.levelLabel} {detoxLevel.title}
              {tiers.unknownCount > 0 && ` · 결제 월 미설정 ${tiers.unknownCount}건 제외`}
            </p>
          </div>
          <span className="text-sm font-semibold text-muted-foreground shrink-0">절약 현황 →</span>
        </Link>
      )}

      {/* SubForm Modal for Adding */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 구독 등록</DialogTitle>
            <DialogDescription>인기 서비스를 선택하거나 직접 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm popularServices={POPULAR_SERVICES} onSubmit={handleAddSubmit} />
          </div>
        </DialogContent>
      </Dialog>

      {checkInSub && (
        <CheckInModal
          subscription={checkInSub}
          isOpen={!!checkInSub}
          onClose={() => setCheckInSub(null)}
          onSubmit={handleCheckInSubmit}
          onKill={handleCancelGuide}
          result={checkInResult}
        />
      )}

      <AutoImportModal isOpen={isAutoImportOpen} onClose={() => setIsAutoImportOpen(false)} />

      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {killTarget && (
        <ConfirmDialog
          isOpen={!!killTarget}
          onClose={() => setKillTarget(null)}
          onConfirm={() => {
            if (killTarget) {
              killSubscription(killTarget.id);
              showToast(`🔪 ${killTarget.name}을(를) 해지한 구독으로 기록했습니다.`);
              setKillTarget(null);
            }
          }}
          title="구독 해지 완료 처리"
          description={`'${killTarget.name}' 구독을 해지 완료로 기록하시겠습니까?\n해지 뒤 결제일이 지나면 그만큼이 지킨 돈으로 쌓입니다.`}
          confirmText="해지 완료"
          cancelText="취소"
          variant="destructive"
        />
      )}

      {chargedTarget && (
        <ConfirmDialog
          isOpen={!!chargedTarget}
          onClose={() => setChargedTarget(null)}
          onConfirm={() => {
            // 결제가 됐다면 지금도 돈이 나가는 구독이다. 해지 기록을 지우고 가이드를
            // 다시 연다. 해지를 마치고 다시 완료를 누르면 해지일이 오늘로 잡혀,
            // 이미 나간 달은 절약에서 저절로 빠진다.
            reviveSubscription(chargedTarget.id);
            const revived = useStore
              .getState()
              .subscriptions.find((s) => s.id === chargedTarget.id);
            if (revived) setGuideTarget(revived);
            showToast(`${chargedTarget.name}을(를) 구독 중으로 되돌렸습니다.`);
            setChargedTarget(null);
          }}
          title="해지가 아직 안 됐을 수 있습니다"
          description={`'${chargedTarget.name}' 해지 후 첫 결제일에 결제가 됐다면, 해지가 끝나지 않았을 수 있습니다.\n구독 중으로 되돌리고 해지 가이드를 엽니다. 해지를 마치고 다시 '해지 완료했어요'를 누르면 그날부터 절약으로 셉니다.`}
          confirmText="되돌리고 가이드 열기"
          cancelText="취소"
        />
      )}
    </div>
  );
}
