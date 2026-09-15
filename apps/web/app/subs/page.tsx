"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "../../lib/store";
import {
  Subscription,
  SubscriptionFormData,
  CheckInResponse,
  POPULAR_SERVICES,
  ServicePreset,
  formatKRW,
  presetFormData,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import { SubCard } from "../../components/subscription/SubCard";
import { SubTable } from "../../components/subscription/SubTable";
import { SubForm } from "../../components/subscription/SubForm";
import { QuickPresetRecommender } from "../../components/subscription/QuickPresetRecommender";
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
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { ExchangeRateNote } from "../../components/settings/ExchangeRateNote";
import { DataBackupCard } from "../../components/settings/DataBackupCard";
import { SubscriptionDetail } from "../../components/subscription/SubscriptionDetail";
import { isWideScreen } from "@lib/wide-screen";
import { subscriptionDetailHref } from "@lib/routes";
import { useIsClient } from "@hooks/useIsClient";

/** 카드/표 중 고른 보기. 이 브라우저의 취향일 뿐이라 백업·동기화에 넣지 않는다. */
const VIEW_KEY = "subslash-subs-view";

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

/**
 * 주소의 `?sub=`를 옆 칸에 열 구독으로 쓴다. 주소에 두면 새로고침·링크 공유·뒤로
 * 가기가 그대로 동작한다. useSearchParams는 Suspense 안에서만 쓸 수 있어 따로 뺐다.
 */
function SelectedSubSync({ onChange }: { onChange: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selected = searchParams.get("sub");

  useEffect(() => {
    // 옆 칸은 넓은 화면에만 있다. 좁은 화면에서 이 주소로 오면 상세 페이지로 보낸다.
    if (selected && !isWideScreen()) {
      router.replace(subscriptionDetailHref(selected));
      return;
    }
    onChange(selected);
  }, [selected, onChange, router]);

  return null;
}

export default function SubscriptionsPage() {
  const {
    subscriptions,
    usageLogs,
    addSubscription,
    killSubscription,
    reviveSubscription,
    deleteSubscription,
    clearSubscriptions,
    accountSync,
    checkIn,
    getActiveSubscriptions,
    getKilledSubscriptions,
    demo,
  } = useStore();
  const rate = useExchangeRate();
  const router = useRouter();

  const mounted = useIsClient();
  const [tab, setTab] = useState<"active" | "killed">("active");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [checkInSub, setCheckInSub] = useState<Subscription | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "kill" | "revive" | "delete";
    sub: Subscription;
  } | null>(null);
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);
  // 표는 넓은 화면(md 이상)에서만 고를 수 있다. 좁은 화면은 늘 카드다.
  // 서버에는 저장소가 없어 카드로 시작한다. 하이드레이션 동안은 mounted가 false라 스피너만
  // 그리므로, 브라우저에서 처음부터 저장된 보기로 시작해도 서버 화면과 어긋나지 않는다.
  const [view, setView] = useState<"cards" | "table">(() => {
    if (typeof window === "undefined") return "cards";
    try {
      return localStorage.getItem(VIEW_KEY) === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });

  const changeView = (next: "cards" | "table") => {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  };

  // 넓은 화면에서 목록 옆 칸에 연 구독. 주소의 ?sub=가 원본이다(SelectedSubSync).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 표 보기일 때 표에 보이는 정렬 순서. ↑↓가 그 순서를 따른다.
  const [tableOrder, setTableOrder] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeSubs = getActiveSubscriptions();
  const killedSubs = getKilledSubscriptions();
  const syncedWarning =
    accountSync.enabled && accountSync.baseSavedAt
      ? "\n자동 동기화가 켜져 있어 로그인한 다른 기기의 기록도 함께 지워집니다."
      : "";

  const filteredActive =
    filterCategory === "all" ? activeSubs : activeSubs.filter((s) => s.category === filterCategory);

  const filteredKilled =
    filterCategory === "all" ? killedSubs : killedSubs.filter((s) => s.category === filterCategory);

  const visibleIds = (tab === "active" ? filteredActive : filteredKilled).map((s) => s.id);
  const visibleOrder = view === "table" && tableOrder.length > 0 ? tableOrder : visibleIds;
  const orderKey = visibleOrder.join("|");

  // 구독을 하나 고른 뒤에만 ↑↓로 넘긴다. 아무것도 고르지 않았을 때는 평소처럼 스크롤한다.
  // 넘길 때는 기록을 쌓지 않는다(replace) — 뒤로 가기는 눌러서 고른 구독으로 돌아간다.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (!selectedId || !isWideScreen() || e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='menu']"))
        return;
      if (document.querySelector("[role='dialog']")) return;
      const ids = orderKey ? orderKey.split("|") : [];
      if (ids.length === 0) return;
      e.preventDefault();
      const current = ids.indexOf(selectedId);
      const nextIndex =
        current < 0
          ? 0
          : e.key === "ArrowDown"
            ? Math.min(current + 1, ids.length - 1)
            : Math.max(current - 1, 0);
      const next = ids[nextIndex];
      if (next && next !== selectedId) {
        router.replace(`/subs?sub=${encodeURIComponent(next)}`, { scroll: false });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [orderKey, selectedId, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-3xl">✂️</div>
      </div>
    );
  }

  const selectSub = (id: string) =>
    router.push(`/subs?sub=${encodeURIComponent(id)}`, { scroll: false });
  const clearSelection = () => router.push("/subs", { scroll: false });
  // 옆 칸의 구독을 지웠을 때: 목록에서 그다음(없으면 앞) 구독으로 넘어가고, 없으면 비운다.
  const leaveSelection = () => {
    const index = selectedId ? visibleOrder.indexOf(selectedId) : -1;
    const next = index < 0 ? undefined : (visibleOrder[index + 1] ?? visibleOrder[index - 1]);
    router.replace(next ? `/subs?sub=${encodeURIComponent(next)}` : "/subs", { scroll: false });
  };
  const selectedExists = selectedId !== null && subscriptions.some((s) => s.id === selectedId);

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

  // 해지 버튼은 완료 처리로 바로 가지 않는다. 실제 해지는 서비스 쪽에서
  // 해야 하므로 가이드를 먼저 열고, 사용자가 마쳤다고 알려줄 때 확인을 받는다.
  const handleKill = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setGuideTarget(sub);
  };

  const handleConfirmKilled = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setConfirmAction({ type: "kill", sub });
  };

  const handleRevive = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setConfirmAction({ type: "revive", sub });
  };

  const handleDelete = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setConfirmAction({ type: "delete", sub });
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const { type, sub } = confirmAction;
    if (type === "kill") {
      killSubscription(sub.id);
      showToast(`🔪 ${sub.name}을(를) 해지 처리했습니다.`);
    } else if (type === "revive") {
      reviveSubscription(sub.id);
      showToast(`✨ ${sub.name}을(를) 다시 활성화했습니다.`);
    } else if (type === "delete") {
      deleteSubscription(sub.id);
      showToast("삭제되었습니다.");
    }
    setConfirmAction(null);
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
    { value: "news", label: "뉴스" },
    // 없으면 노션·어도비처럼 '기타'로 등록된 구독을 분류로 걸러 볼 수 없다.
    { value: "other", label: "기타" },
  ];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <NotifyBanner onMessage={showToast} />
        <SelectedSubSync onChange={setSelectedId} />
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
              onClick={() => setConfirmClearAll(true)}
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

      <ExchangeRateNote />

      {/* 넓은 화면(xl)에서는 목록 오른쪽에 고른 구독의 상세 칸을 둔다. */}
      <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-6 xl:space-y-0">
        <div className="min-w-0 space-y-6">
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

          {/* Category Pills + 보기 방식 */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-2 text-xs">
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
            <div
              role="group"
              aria-label="보기 방식"
              className="hidden shrink-0 items-center rounded-lg border p-0.5 text-xs md:inline-flex"
            >
              {(
                [
                  { value: "cards", label: "카드" },
                  { value: "table", label: "표" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={view === option.value}
                  onClick={() => changeView(option.value)}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    view === option.value
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
                <>
                  {view === "table" && (
                    <div className="hidden md:block">
                      <SubTable
                        subscriptions={filteredActive}
                        usageLogs={usageLogs}
                        mode="active"
                        onCheckIn={handleOpenCheckIn}
                        onKill={handleKill}
                        selectedId={selectedId}
                        onSelect={selectSub}
                        onOrderChange={setTableOrder}
                        sidePanel
                      />
                    </div>
                  )}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4${view === "table" ? " md:hidden" : ""}`}
                  >
                    {filteredActive.map((sub) => (
                      <SubCard
                        key={sub.id}
                        subscription={sub}
                        onCheckIn={handleOpenCheckIn}
                        onKill={handleKill}
                        selected={selectedId === sub.id}
                        onSelect={selectSub}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Quick Preset Recommender (Issue 19) */}
              <QuickPresetRecommender
                subscriptions={subscriptions}
                onSelectPreset={(preset) => {
                  setSelectedPreset(preset);
                  setIsAddOpen(true);
                }}
              />
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
                    {/* 해지를 유지하면 아낄 금액이다. 이미 지킨 돈은 절약 현황이 따로 센다. */}
                    해지한 구독 {filteredKilled.length}개 · 해지를 유지하면 매달{" "}
                    <strong>{formatKRW(sumMyMonthlyKRW(filteredKilled, rate))}</strong>을 아낍니다.
                    실제로 지킨 돈은 절약 현황에서 확인하세요.
                  </div>

                  {view === "table" && (
                    <div className="hidden md:block">
                      <SubTable
                        subscriptions={filteredKilled}
                        usageLogs={usageLogs}
                        mode="killed"
                        onRevive={handleRevive}
                        onDelete={handleDelete}
                        selectedId={selectedId}
                        onSelect={selectSub}
                        onOrderChange={setTableOrder}
                        sidePanel
                      />
                    </div>
                  )}
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4${view === "table" ? " md:hidden" : ""}`}
                  >
                    {filteredKilled.map((sub) => (
                      <SubCard
                        key={sub.id}
                        subscription={sub}
                        onRevive={handleRevive}
                        onDelete={handleDelete}
                        selected={selectedId === sub.id}
                        onSelect={selectSub}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside
          aria-label="구독 상세"
          className="hidden xl:block xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1"
        >
          {selectedId ? (
            <div className="space-y-3">
              {selectedExists && !visibleIds.includes(selectedId) && (
                <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                  지금 탭·분류에서는 목록에 보이지 않는 구독입니다.
                </p>
              )}
              <SubscriptionDetail
                key={selectedId}
                id={selectedId}
                headingLevel="h2"
                closeLabel="✕ 닫기"
                onClose={clearSelection}
                onLeave={leaveSelection}
                className="space-y-6"
              />
            </div>
          ) : (
            <div className="space-y-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                구독을 고르면 여기에 자세히 보여줍니다
              </p>
              <p className="text-xs">
                목록에서 이름을 누르세요. 고른 뒤에는 ↑↓ 키로 다음 구독으로 넘어갑니다.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* 이 브라우저에만 있는 데이터를 파일로 지키는 곳 */}
      <DataBackupCard onMessage={showToast} />

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
        aria-label="Add Subscription"
      >
        +
      </button>

      {/* SubForm Modal */}
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
              {selectedPreset ? `${selectedPreset.nameKo} 등록` : "새 구독 추가"}
            </DialogTitle>
            <DialogDescription>
              서비스 정보를 등록하면 D-Day 및 1회당 단가를 자동 계산합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              popularServices={POPULAR_SERVICES}
              initialData={selectedPreset ? presetFormData(selectedPreset) : undefined}
              onSubmit={handleAddSubmit}
            />
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

      {/* Cancel Guide Modal (Issue 14) */}
      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {/* 자동 동기화 중이면 빈 기록이 올라가 로그인한 다른 기기에서도 지워진다. 알고 누르게 한다. */}
      {/* Confirmation Modal */}
      {/* 활성 탭이 비어 있어도 해지한 구독이 남아 있을 수 있다. 무엇이 지워지는지 나눠 적는다. */}
      <ConfirmDialog
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={() => {
          // 체험 중이면 샘플만 치우고 체험을 끝낸다(store의 clearSubscriptions).
          const wasDemo = Boolean(demo);
          clearSubscriptions();
          showToast(
            wasDemo
              ? "샘플 체험을 끝냈습니다. 내 구독은 그대로입니다."
              : "이전 구독 기록이 모두 삭제되었습니다.",
          );
        }}
        title="전체 초기화"
        description={
          demo
            ? `샘플 구독 ${subscriptions.length}건을 치우고 체험을 끝냅니다.\n내 구독 기록은 그대로 남습니다.`
            : killedSubs.length > 0
              ? `현재 등록된 전체 구독 ${subscriptions.length}건(구독 중 ${activeSubs.length}건, 해지한 구독 ${killedSubs.length}건)을 모두 삭제하시겠습니까?\n해지한 구독의 절약 기록도 함께 지워집니다.${syncedWarning}`
              : `현재 등록된 전체 구독 ${subscriptions.length}건을 모두 삭제하시겠습니까?${syncedWarning}`
        }
        confirmText="모두 삭제"
        variant="destructive"
      />

      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
          title={
            confirmAction.type === "kill"
              ? "구독 해지 완료 처리"
              : confirmAction.type === "revive"
                ? "구독 다시 살리기"
                : "구독 영구 삭제"
          }
          description={
            confirmAction.type === "kill"
              ? `'${confirmAction.sub.name}' 구독을 해지 완료로 기록하시겠습니까?\n해지 뒤 결제일이 지나면 그만큼이 지킨 돈으로 쌓입니다.`
              : confirmAction.type === "revive"
                ? `'${confirmAction.sub.name}' 구독을 다시 활성화하시겠습니까?\n활성 구독 목록으로 복원되며, 절약 방어 자산에서 제외됩니다.`
                : `'${confirmAction.sub.name}' 구독을 영구 삭제하시겠습니까?\n삭제된 구독 데이터는 복구할 수 없습니다.`
          }
          confirmText={
            confirmAction.type === "kill"
              ? "해지 완료"
              : confirmAction.type === "revive"
                ? "다시 살리기"
                : "삭제"
          }
          cancelText="취소"
          variant={confirmAction.type === "revive" ? "default" : "destructive"}
        />
      )}
    </div>
  );
}
