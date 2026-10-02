"use client";

import React, { Suspense, useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";
import {
  Subscription,
  POPULAR_SERVICES,
  ServicePreset,
  formatKRW,
  presetFormData,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import { SubCard } from "../../components/subscription/SubCard";
import { SubjectChip } from "../../components/subscription/SubjectChip";
import { SubTable } from "../../components/subscription/SubTable";
import { SubForm } from "../../components/subscription/SubForm";
import { QuickPresetRecommender } from "../../components/subscription/QuickPresetRecommender";
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
import { IS_APP_BUILD } from "@lib/platform";
import { useCheckInFlow, useReminderPrompt } from "@hooks/useCheckInFlow";
import { useAddSubscriptionFlow } from "@hooks/useAddSubscriptionFlow";
import { sortSubsForApp, type AppSubsSort } from "@lib/subs-order";
import { SubscriptionDetail } from "../../components/subscription/SubscriptionDetail";
import { GoogleCalendarSync } from "../../components/calendar/GoogleCalendarSync";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { isWideScreen } from "@lib/wide-screen";
import { SelectedSubSync } from "../../components/subscription/SelectedSubSync";
import {
  AppAddButton,
  AppKilledList,
  AppPhoneCheckInButton,
  AppSortSelect,
} from "../../components/subscription/app/appParts";
import { useIsClient } from "@hooks/useIsClient";
import { Spinner } from "../../components/ui/spinner";
import { Receipt, ShieldCheck } from "lucide-react";

/** 카드/표 중 고른 보기. 이 브라우저의 취향일 뿐이라 백업·동기화에 넣지 않는다. */
const VIEW_KEY = "subslash-subs-view";

export default function SubscriptionsPage() {
  const {
    subscriptions,
    usageLogs,
    killSubscription,
    reviveSubscription,
    deleteSubscription,
    getActiveSubscriptions,
    getKilledSubscriptions,
  } = useStore();
  const rate = useExchangeRate();
  const router = useRouter();

  const mounted = useIsClient();
  const [tab, setTab] = useState<"active" | "killed">("active");
  const [isAddOpen, setIsAddOpen] = useState(false);
  // 앱의 구독 추가 메뉴(AppAddButton). 빈 목록의 '구독 추가'도 + 버튼과 같은 메뉴를 연다.
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  // 앱: 구독 중 목록의 순서(결제일·금액·가성비).
  const [appSort, setAppSort] = useState<AppSubsSort>("billing");
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(null);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "revive" | "delete";
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

  // 결제 알림 묻기와 체크인 창(대시보드와 같은 흐름, hooks/useCheckInFlow).
  const reminder = useReminderPrompt(showToast);
  const checkInFlow = useCheckInFlow({ showToast, reminder, onKill: (id) => handleKill(id) });
  const handleOpenCheckIn = checkInFlow.open;
  // 구독 추가의 등록 처리(대시보드와 같은 흐름, hooks/useAddSubscriptionFlow).
  const addFlow = useAddSubscriptionFlow({
    showToast,
    reminder,
    onClose: () => {
      setIsAddOpen(false);
      setSelectedPreset(null);
    },
  });

  const activeSubs = getActiveSubscriptions();
  const killedSubs = getKilledSubscriptions();

  const filteredActiveRaw =
    filterCategory === "all" ? activeSubs : activeSubs.filter((s) => s.category === filterCategory);
  // 앱: 기본은 결제일이 가까운 순(결제월을 모르는 연간 구독은 맨 뒤), 칩으로 금액·가성비 순. 웹은 등록 순 그대로.
  const filteredActive = IS_APP_BUILD
    ? sortSubsForApp(filteredActiveRaw, appSort, usageLogs, rate)
    : filteredActiveRaw;

  const filteredKilled =
    filterCategory === "all" ? killedSubs : killedSubs.filter((s) => s.category === filterCategory);

  const visibleIds = (tab === "active" ? filteredActive : filteredKilled).map((s) => s.id);
  const visibleOrder = view === "table" && tableOrder.length > 0 ? tableOrder : visibleIds;
  const orderKey = visibleOrder.join("|");

  // 구독을 하나 고른 뒤에만 ↑↓로 넘긴다. 아무것도 고르지 않았을 때는 평소처럼 스크롤한다.
  // 넘길 때는 기록을 쌓지 않는다(replace) — 뒤로 가기는 눌러서 고른 구독으로 돌아간다.
  // 화면을 칠하기 전에 다시 단다(useLayoutEffect). useEffect면 뒤로 가기로 옆 칸이 바뀐 것이 보인 뒤에도
  // 잠깐 이전 선택을 들고 있어, 그때 누른 ↓가 한 칸 더 넘어갔다(E2E가 가끔 실패했다).
  useLayoutEffect(() => {
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
        <Spinner className="size-8" />
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

  // 해지 버튼은 완료 처리로 바로 가지 않는다. 실제 해지는 서비스 쪽에서
  // 해야 하므로 가이드를 먼저 열고, 사용자가 마쳤다고 알려줄 때 확인을 받는다.
  const handleKill = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) setGuideTarget(sub);
  };

  // 가이드에서 '해지 완료했어요'를 누른 것이 곧 확인이다 — 예전에는 확인 창을 한 번 더 띄웠다.
  // 잘못 눌렀으면 '다시 살리기'로 되돌린다.
  const handleConfirmKilled = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    killSubscription(sub.id);
    showToast(`${sub.name} 해지 완료로 기록`);
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
    if (type === "revive") {
      reviveSubscription(sub.id);
      showToast(`${sub.name} 구독 중으로 되돌림`);
    } else if (type === "delete") {
      deleteSubscription(sub.id);
      showToast("삭제했어요");
    }
    setConfirmAction(null);
  };

  const categories = [
    { value: "all", label: "전체" },
    { value: "ott", label: "OTT" },
    { value: "music", label: "음악" },
    { value: "shopping", label: "쇼핑" },
    { value: "cloud", label: "클라우드" },
    { value: "ai", label: "AI 툴" },
    // 없으면 노션·어도비처럼 '기타'로 등록된 구독을 분류로 걸러 볼 수 없다.
    { value: "other", label: "기타" },
  ];

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SelectedSubSync onChange={setSelectedId} />
      </Suspense>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/*
        제목과 불러오기 두 개. 앱에서 먼저 줄인 모양을 웹도 쓴다 — 긴 부제와 혼자 빨갛게 튀던 '전체
        초기화'를 뺐다(전체 초기화는 아래 설정 목록의 데이터 묶음에 있다). 넓은 화면에는 떠 있는 +
        버튼이 없으므로 '구독 추가'를 함께 둔다.
      */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">구독 관리</h1>
          <Button onClick={() => setIsAddOpen(true)} className="hidden font-bold md:inline-flex">
            + 구독 추가
          </Button>
        </div>
        {/* 앱은 이 두 버튼 대신 떠 있는 + 하나로 고른다(AppAddButton). */}
        {!AppAddButton && (
          <div className="grid grid-cols-2 gap-2 md:max-w-md">
            <Button
              variant="outline"
              onClick={() => router.push("/import")}
              className="font-semibold"
            >
              결제 메일에서 찾기
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAutoImportOpen(true)}
              className="font-semibold"
            >
              문자 붙여넣기
            </Button>
          </div>
        )}
        {/* 앱: 자동 체크인 켜기/끄기는 설정 탭에 두고, 여기에는 상태 한 줄과 '폰 기록으로 체크인' 버튼을 둔다. */}
        {AppPhoneCheckInButton && (
          <AppPhoneCheckInButton
            subscriptions={activeSubs}
            onDone={(count) => showToast(`${count}개 체크인했어요`)}
            autoSwitch={false}
            autoStatus
          />
        )}
      </div>

      {/* 앱은 환율을 설정 탭(화면)에 둔다. */}
      {!IS_APP_BUILD && <ExchangeRateNote />}

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
              {/* 앱은 숨긴 해지 구독을 목록에서 빼므로 개수도 보이는 것만 센다. */}
              해지 완료 (
              {AppKilledList ? killedSubs.filter((s) => !s.hiddenAt).length : killedSubs.length})
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
                  <Receipt className="mx-auto size-9 text-muted-foreground" aria-hidden />
                  <p className="font-bold">구독 중인 서비스가 없어요</p>
                  <p className="text-xs text-muted-foreground">구독을 등록해 보세요.</p>
                  <Button
                    size="sm"
                    onClick={() => (AppAddButton ? setAddMenuOpen(true) : setIsAddOpen(true))}
                  >
                    + 구독 추가
                  </Button>
                </div>
              ) : (
                <>
                  {AppSortSelect && (
                    <AppSortSelect
                      count={filteredActive.length}
                      value={appSort}
                      onChange={setAppSort}
                    />
                  )}
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
                  <ShieldCheck className="mx-auto size-9 text-muted-foreground" aria-hidden />
                  <p className="font-bold">아직 해지한 구독이 없어요</p>
                  <p className="text-xs text-muted-foreground">
                    &lsquo;지금 해지하기&rsquo;로 기록하면 여기에 모여요.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 앱은 이 자리에 '지킨 돈 · 절약 현황' 한 줄(AppKilledList 맨 위)을 둔다. 두 줄이 같이 있으면
                      '매달 아껴요'와 '지켰어요'가 같은 돈처럼 보인다. */}
                  {!AppKilledList && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
                      {/* 해지를 유지하면 아낄 금액이다. 이미 지킨 돈은 절약 현황이 따로 센다. */}
                      해지한 구독 {filteredKilled.length}개 · 해지를 유지하면 매달{" "}
                      <strong>{formatKRW(sumMyMonthlyKRW(filteredKilled, rate))}</strong>을 아껴요.
                    </div>
                  )}

                  {AppKilledList ? (
                    <AppKilledList
                      subscriptions={filteredKilled}
                      onRevive={handleRevive}
                      onMessage={showToast}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
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
                  지금 탭·분류의 목록에는 없는 구독이에요.
                </p>
              )}
              <SubscriptionDetail
                key={selectedId}
                id={selectedId}
                headingLevel="h2"
                closeLabel="닫기"
                onClose={clearSelection}
                onLeave={leaveSelection}
                className="space-y-6"
              />
            </div>
          ) : (
            <div className="space-y-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">구독을 고르면 여기에 자세히 보여요</p>
              <p className="text-xs">목록에서 이름을 누르세요. ↑↓ 키로 넘길 수 있어요.</p>
            </div>
          )}
        </aside>
      </div>

      {/*
        구글 캘린더 등록은 구독 목록 바로 아래에 둔다 — 금액·결제일을 확인하고 고친 뒤 그 자리에서 누르는 것이다.
        설정 화면에 두었더니 이런 기능이 있는지 찾기 어려웠다. 해지한 구독은 올리지 않으므로 구독 중 탭에만 둔다.
        측정·데이터 설정은 설정 화면(/settings)에 있다.
      */}
      {tab === "active" && isGmailAutoImportOpen() && <GoogleCalendarSync />}

      {/* Floating Action Button for Mobile — 앱은 추가 방법을 고르는 AppAddButton */}
      {AppAddButton ? (
        // 해지 완료 탭에서는 두지 않는다 — 선택 모드의 아래 버튼 줄과 겹친다.
        tab === "active" && (
          <AppAddButton
            onManual={() => setIsAddOpen(true)}
            onPaste={() => setIsAutoImportOpen(true)}
            onPickPreset={(preset) => {
              setSelectedPreset(preset);
              setIsAddOpen(true);
            }}
            menuOpen={addMenuOpen}
            onMenuOpenChange={setAddMenuOpen}
          />
        )
      ) : (
        <button
          onClick={() => setIsAddOpen(true)}
          className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
          aria-label="Add Subscription"
        >
          +
        </button>
      )}

      {/* SubForm Modal */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setSelectedPreset(null);
            addFlow.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {addFlow.checkInStep ?? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedPreset ? `${selectedPreset.nameKo} 등록` : "새 구독 추가"}
                </DialogTitle>
                <DialogDescription>서비스를 고르거나 직접 입력하세요.</DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <SubForm
                  popularServices={POPULAR_SERVICES}
                  initialData={selectedPreset ? presetFormData(selectedPreset) : undefined}
                  onSubmit={(data) => addFlow.submit(data)}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {IS_APP_BUILD && reminder.sheet}

      {addFlow.duplicateDialog}

      {checkInFlow.modal}

      {/* Auto Import Hub Modal */}
      <AutoImportModal
        isOpen={isAutoImportOpen}
        onClose={() => {
          setIsAutoImportOpen(false);
          reminder.flush();
        }}
        onRegistered={reminder.askAfterImport}
      />

      {/* Cancel Guide Modal (Issue 14) */}
      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {confirmAction && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
          // 앱: 제목은 짧게, 이름은 칩으로, 줄은 뜻이 끊기는 자리에서(ConfirmDialog의 centered).
          centered={IS_APP_BUILD}
          subject={IS_APP_BUILD ? <SubjectChip sub={confirmAction.sub} /> : undefined}
          title={
            IS_APP_BUILD
              ? confirmAction.type === "revive"
                ? "다시 살릴까요?"
                : "삭제할까요?"
              : confirmAction.type === "revive"
                ? "구독 다시 살리기"
                : "구독 영구 삭제"
          }
          description={
            IS_APP_BUILD && confirmAction.type === "revive"
              ? "구독 중으로 돌아가고,\n절약 기록에서는 빠져요."
              : IS_APP_BUILD
                ? "절약 현황에서도 빠지고\n되돌릴 수 없어요."
                : confirmAction.type === "revive"
                  ? `'${confirmAction.sub.name}'을(를) 다시 구독 중으로 바꿀까요?\n절약 기록에서 빠져요.`
                  : `'${confirmAction.sub.name}'을(를) 삭제할까요?\n되돌릴 수 없어요.`
          }
          confirmText={confirmAction.type === "revive" ? "다시 살리기" : "삭제"}
          cancelText="취소"
          variant={confirmAction.type === "revive" ? "default" : "destructive"}
        />
      )}
    </div>
  );
}
