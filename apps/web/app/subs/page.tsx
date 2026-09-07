"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "../../lib/store";
import {
  Subscription,
  SubscriptionFormData,
  CheckInResponse,
  POPULAR_SERVICES,
  sumMonthlyKRW,
} from "@subslash/shared";
import { SubCard } from "../../components/subscription/SubCard";
import { SubForm } from "../../components/subscription/SubForm";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

/** Feedback for the redirect targets of the reminder emails' links. */
const NOTIFY_MESSAGES: Record<string, string> = {
  verified: "🔔 결제 알림이 켜졌습니다. 결제일 전에 메일로 알려드릴게요.",
  unsubscribed: "🔕 결제 알림을 껐습니다. 서버에 있던 구독 사본도 삭제했습니다.",
  invalid: "링크가 만료되었거나 올바르지 않습니다. 알림 설정에서 다시 시도해주세요.",
  error: "알림 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

function NotifyBanner({ onMessage }: { onMessage: (message: string) => void }) {
  const searchParams = useSearchParams();
  const setNotify = useStore((state) => state.setNotify);
  const clearNotify = useStore((state) => state.clearNotify);
  const notifyResult = searchParams.get("notify");

  useEffect(() => {
    if (!notifyResult) return;

    const message = NOTIFY_MESSAGES[notifyResult];
    if (message) onMessage(message);

    // The link acted on the server; mirror the outcome locally so the header
    // badge and settings modal do not keep showing a stale state.
    if (notifyResult === "verified") setNotify({ verified: true });
    if (notifyResult === "unsubscribed") clearNotify();

    window.history.replaceState(null, "", window.location.pathname);
  }, [notifyResult, onMessage, setNotify, clearNotify]);

  return null;
}

export default function SubscriptionsPage() {
  const {
    subscriptions,
    addSubscription,
    killSubscription,
    reviveSubscription,
    deleteSubscription,
    clearSubscriptions,
    checkIn,
    getActiveSubscriptions,
    getKilledSubscriptions,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"active" | "killed">("active");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [checkInSub, setCheckInSub] = useState<Subscription | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

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

  const filteredActive =
    filterCategory === "all" ? activeSubs : activeSubs.filter((s) => s.category === filterCategory);

  const filteredKilled =
    filterCategory === "all" ? killedSubs : killedSubs.filter((s) => s.category === filterCategory);

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
      showToast("체크인 오류가 발생했습니다.");
    }
  };

  const handleKill = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    killSubscription(id);
    showToast(`🔪 ${sub?.name || "구독"}을(를) 해지 처리했습니다.`);
  };

  const handleRevive = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    reviveSubscription(id);
    showToast(`✨ ${sub?.name || "구독"}을(를) 다시 활성화했습니다.`);
  };

  const handleDelete = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (confirm(`'${sub?.name || "이 구독"}'을(를) 영구 삭제하시겠습니까?`)) {
      deleteSubscription(id);
      showToast("삭제되었습니다.");
    }
  };

  const handleAddSubmit = (data: SubscriptionFormData) => {
    addSubscription(data);
    setIsAddOpen(false);
    showToast(`✅ ${data.name} 구독이 추가되었습니다.`);
  };

  const categories = [
    { value: "all", label: "전체" },
    { value: "ott", label: "OTT" },
    { value: "music", label: "음악" },
    { value: "shopping", label: "쇼핑" },
    { value: "cloud", label: "클라우드" },
    { value: "ai", label: "AI 툴" },
    { value: "fitness", label: "피트니스" },
  ];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <NotifyBanner onMessage={showToast} />
      </Suspense>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">구독 관리</h1>
          <p className="text-sm text-muted-foreground">
            등록된 구독 목록을 확인하고, 1회 단가 점검 및 해지 관리를 진행하세요.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {subscriptions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    `현재 등록된 전체 구독 ${subscriptions.length}건을 모두 삭제하시겠습니까?`,
                  )
                ) {
                  clearSubscriptions();
                  showToast("이전 구독 기록이 모두 삭제되었습니다.");
                }
              }}
              className="font-medium text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 gap-1"
            >
              <span>🗑️</span> 전체 초기화
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsAutoImportOpen(true)}
            className="font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
          >
            <span>⚡</span> 자동 불러오기
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="font-bold shadow-md">
            + 구독 추가
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 font-bold text-sm transition-colors border-b-2 ${
            tab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("active")}
        >
          활성 구독 ({activeSubs.length})
        </button>
        <button
          className={`flex-1 py-3 font-bold text-sm transition-colors border-b-2 ${
            tab === "killed"
              ? "border-destructive text-destructive"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("killed")}
        >
          해지 완료 ({killedSubs.length})
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              filterCategory === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Active Tab */}
      {tab === "active" ? (
        <div className="space-y-4">
          {filteredActive.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl space-y-3">
              <div className="text-3xl">📭</div>
              <p className="font-bold">등록된 활성 구독이 없습니다.</p>
              <p className="text-xs text-muted-foreground">
                새 구독을 추가하여 고정비 관리를 시작하세요.
              </p>
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                + 지금 추가하기
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActive.map((sub) => (
                <SubCard
                  key={sub.id}
                  subscription={sub}
                  onCheckIn={handleOpenCheckIn}
                  onKill={handleKill}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Killed Tab */
        <div className="space-y-4">
          {filteredKilled.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl space-y-3">
              <div className="text-3xl">🛡️</div>
              <p className="font-bold">아직 해지(방어)한 구독이 없습니다.</p>
              <p className="text-xs text-muted-foreground">
                활성 구독에서 불필요한 결제에 대해 &lsquo;해지하기&rsquo;를 누르면 이곳에 방어
                자산으로 기록됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
                🎉 축하합니다! {filteredKilled.length}개의 불필요한 구독을 차단하여 매달 총{" "}
                <strong>₩{sumMonthlyKRW(filteredKilled).toLocaleString()}</strong>을 방어하고
                계십니다!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredKilled.map((sub) => (
                  <SubCard
                    key={sub.id}
                    subscription={sub}
                    onRevive={handleRevive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
        aria-label="Add Subscription"
      >
        +
      </button>

      {/* SubForm Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 구독 추가</DialogTitle>
            <DialogDescription>
              서비스 정보를 등록하면 D-Day 및 1회당 단가를 자동 계산합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm popularServices={POPULAR_SERVICES} onSubmit={handleAddSubmit} />
          </div>
        </DialogContent>
      </Dialog>

      {/* CheckIn Modal */}
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
    </div>
  );
}
