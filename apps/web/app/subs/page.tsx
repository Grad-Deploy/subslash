"use client";

import React, { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
import { SubjectChip } from "../../components/subscription/SubjectChip";
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
import { SettingsList } from "../../components/settings/SettingsList";
import { IS_APP_BUILD } from "@lib/platform";
import { useLocalReminderSettings } from "@hooks/useLocalReminders";
import { ReminderPromptSheet } from "../../components/app-start/ReminderPromptSheet";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { APP_SUBS_SORT_LABEL, sortSubsForApp, type AppSubsSort } from "@lib/subs-order";
import { markReminderPrompted, shouldPromptReminder } from "@lib/reminder-prompt";
import { SubscriptionDetail } from "../../components/subscription/SubscriptionDetail";
import { isWideScreen } from "@lib/wide-screen";
import { subscriptionDetailHref } from "@lib/routes";
import { useIsClient } from "@hooks/useIsClient";
import { Spinner } from "../../components/ui/spinner";
import { Receipt, ShieldCheck } from "lucide-react";

/** 카드/표 중 고른 보기. 이 브라우저의 취향일 뿐이라 백업·동기화에 넣지 않는다. */
const VIEW_KEY = "subslash-subs-view";

/** Feedback for the redirect targets of the reminder emails' links. */
const NOTIFY_MESSAGES: Record<string, string> = {
  verified: "결제 알림이 켜졌어요. 결제일 전에 메일로 알려 드려요.",
  unsubscribed: "결제 알림을 껐어요. 서버의 구독 사본도 지웠어요.",
  invalid: "만료됐거나 잘못된 링크예요. 알림 설정에서 다시 시도해 주세요.",
  error: "알림을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
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

// 앱에서는 구독을 하나 등록한 뒤 같은 창에서 이번 달 사용 횟수를 묻는다. 웹 번들에는 넣지 않는다.
const AppDuplicateDialog = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../components/subscription/app/AppDuplicateDialog").then(
          (m) => m.AppDuplicateDialog,
        ),
      { ssr: false },
    )
  : null;

// 폰 기록으로 체크인(안드로이드 앱 전용).
const AppPhoneCheckInButton = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../components/usage/app/AppPhoneCheckInButton").then(
          (m) => m.AppPhoneCheckInButton,
        ),
      { ssr: false },
    )
  : null;
// 해지 완료 목록 정리(숨기기·삭제·여러 개 선택). 앱 전용.
const AppKilledList = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/subscription/app/AppKilledList").then((m) => m.AppKilledList),
      { ssr: false },
    )
  : null;
// 구독 추가 + 버튼(앱 전용) — 직접 등록·결제 메일·결제 문자 중 고른다.
const AppAddButton = IS_APP_BUILD
  ? dynamic(() => import("../../components/layout/app/AppAddButton").then((m) => m.AppAddButton), {
      ssr: false,
    })
  : null;
const AppAddCheckIn = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/subscription/app/AppAddCheckIn").then((m) => m.AppAddCheckIn),
      { ssr: false },
    )
  : null;

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
  // 앱: 구독 중 목록의 순서(결제일·금액·가성비).
  const [appSort, setAppSort] = useState<AppSubsSort>("billing");
  // 앱: 방금 등록한 구독. 있으면 등록 창이 사용 횟수 묻기로 바뀐다.
  const [addedSub, setAddedSub] = useState<Subscription | null>(null);
  // 앱: 같은 서비스를 또 등록하려 할 때 한 번 묻는다. data는 확인하면 그대로 등록할 폼 값이다.
  const [duplicate, setDuplicate] = useState<{
    data: SubscriptionFormData;
    existing: Subscription;
  } | null>(null);
  // 앱: 등록 직후 체크인이 이 사람의 첫 체크인인지. 맞으면 결제 알림을 한 번 묻는다.
  const [firstEverCheckIn, setFirstEverCheckIn] = useState(false);
  // 앱: 체크인·불러오기 창이 닫히면 결제 알림을 물을 구독(처음 한 번만). false면 묻지 않는다.
  const [pendingReminder, setPendingReminder] = useState<Subscription | null | false>(false);
  const [reminderSettings] = useLocalReminderSettings();
  const [reminderPromptSub, setReminderPromptSub] = useState<Subscription | null>(null);
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
      ? "\n자동 동기화가 켜져 있어 다른 기기의 기록도 지워져요."
      : "";

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

  const handleOpenCheckIn = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub) {
      setCheckInSub(sub);
      setCheckInResult(undefined);
    }
  };

  const flushPendingReminder = () => {
    if (pendingReminder === false) return;
    markReminderPrompted();
    setReminderPromptSub(pendingReminder);
    setPendingReminder(false);
  };

  // 불러오기로 구독을 처음 등록했을 때도 창이 닫히면 한 번 묻는다. 대표로 가장 최근 구독을 보여준다.
  const handleImportRegistered = () => {
    if (!shouldPromptReminder(reminderSettings.enabled)) return;
    const latest = [...useStore.getState().subscriptions]
      .filter((sub) => sub.status === "active")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    setPendingReminder(latest ?? null);
  };

  const handleCheckInSubmit = (count: number) => {
    if (!checkInSub) return;
    // 이 사람의 첫 체크인이면 체크인 창을 닫을 때 결제 알림을 한 번 묻는다(결과 화면을 가리지 않게).
    if (usageLogs.length === 0 && shouldPromptReminder(reminderSettings.enabled)) {
      setPendingReminder(checkInSub);
    }
    try {
      const res = checkIn(checkInSub.id, count);
      setCheckInResult(res);
      showToast(`${checkInSub.name} 체크인 완료`);
    } catch (error) {
      console.error(error);
      showToast("체크인하지 못했어요. 다시 시도해 주세요.");
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
      showToast(`${sub.name} 해지 완료로 기록`);
    } else if (type === "revive") {
      reviveSubscription(sub.id);
      showToast(`${sub.name} 구독 중으로 되돌림`);
    } else if (type === "delete") {
      deleteSubscription(sub.id);
      showToast("삭제했어요");
    }
    setConfirmAction(null);
  };

  const handleAddSubmit = (data: SubscriptionFormData, allowDuplicate = false) => {
    if (AppDuplicateDialog && !allowDuplicate) {
      const existing = findDuplicateSubscription(subscriptions, data);
      if (existing) {
        setDuplicate({ data, existing });
        return;
      }
    }
    const added = addSubscription(data);
    if (AppAddCheckIn) {
      setFirstEverCheckIn(usageLogs.length === 0);
      setAddedSub(added);
      return;
    }
    setIsAddOpen(false);
    showToast(`${data.name} 등록 완료`);
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
        <NotifyBanner onMessage={showToast} />
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
                  <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    + 구독 추가
                  </Button>
                </div>
              ) : (
                <>
                  {IS_APP_BUILD && (
                    <div className="flex gap-1.5" role="group" aria-label="순서">
                      {(Object.keys(APP_SUBS_SORT_LABEL) as AppSubsSort[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={appSort === key}
                          onClick={() => setAppSort(key)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            appSort === key
                              ? "border-foreground bg-foreground text-background"
                              : "text-muted-foreground"
                          }`}
                        >
                          {APP_SUBS_SORT_LABEL[key]}
                        </button>
                      ))}
                    </div>
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

      {/* 알림·연동·데이터를 한 줄씩 묶은 목록(웹·앱). 누르면 카드를 시트로 연다. */}
      {/* 앱은 이 설정 목록을 설정 탭으로 옮겼다. */}
      {!IS_APP_BUILD && (
        <SettingsList onMessage={showToast} onClearAll={() => setConfirmClearAll(true)} />
      )}

      {/* Floating Action Button for Mobile — 앱은 추가 방법을 고르는 AppAddButton */}
      {AppAddButton ? (
        // 해지 완료 탭에서는 두지 않는다 — 선택 모드의 아래 버튼 줄과 겹친다.
        tab === "active" && (
          <AppAddButton
            onManual={() => setIsAddOpen(true)}
            onPaste={() => setIsAutoImportOpen(true)}
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
            setAddedSub(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {addedSub && AppAddCheckIn ? (
            <AppAddCheckIn
              subscription={addedSub}
              onDone={(recorded) => {
                setIsAddOpen(false);
                setSelectedPreset(null);
                setAddedSub(null);
                // 이 사람의 첫 체크인이면 결제 알림을 한 번만 묻는다(대시보드 첫 체크인과 같은 흐름).
                if (
                  recorded !== undefined &&
                  firstEverCheckIn &&
                  shouldPromptReminder(reminderSettings.enabled)
                ) {
                  markReminderPrompted();
                  setReminderPromptSub(addedSub);
                }
                showToast(
                  recorded === undefined
                    ? `${addedSub.name} 등록 완료`
                    : `${addedSub.name} 등록 · ${recorded}회 기록`,
                );
              }}
            />
          ) : (
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
                  onSubmit={(data) => handleAddSubmit(data)}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {IS_APP_BUILD && (
        <ReminderPromptSheet
          open={reminderPromptSub !== null}
          subscription={reminderPromptSub ?? undefined}
          onClose={() => setReminderPromptSub(null)}
          onEnabled={() => {
            setReminderPromptSub(null);
            showToast("결제 알림을 켰어요. 몇 초 뒤 시험 알림이 떠요.");
          }}
        />
      )}

      {duplicate && AppDuplicateDialog && (
        <AppDuplicateDialog
          existing={duplicate.existing}
          candidate={duplicate.data}
          onCancel={() => setDuplicate(null)}
          onAddAnyway={() => {
            const data = duplicate.data;
            setDuplicate(null);
            handleAddSubmit(data, true);
          }}
        />
      )}

      {/* CheckIn Modal */}
      {checkInSub && (
        <CheckInModal
          subscription={checkInSub}
          isOpen={!!checkInSub}
          onClose={() => {
            setCheckInSub(null);
            flushPendingReminder();
          }}
          onSubmit={handleCheckInSubmit}
          onKill={handleKill}
          result={checkInResult}
        />
      )}

      {/* Auto Import Hub Modal */}
      <AutoImportModal
        isOpen={isAutoImportOpen}
        onClose={() => {
          setIsAutoImportOpen(false);
          flushPendingReminder();
        }}
        onRegistered={handleImportRegistered}
      />

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
            wasDemo ? "샘플 체험을 끝냈어요. 내 구독은 그대로예요." : "구독 기록을 모두 지웠어요",
          );
        }}
        title="전체 초기화"
        description={
          demo
            ? `샘플 ${subscriptions.length}건을 치우고 체험을 끝내요.\n내 구독은 그대로예요.`
            : killedSubs.length > 0
              ? `구독 ${subscriptions.length}건(구독 중 ${activeSubs.length}, 해지 ${killedSubs.length})을 모두 지울까요?\n절약 기록도 지워져요.${syncedWarning}`
              : `구독 ${subscriptions.length}건을 모두 지울까요?${syncedWarning}`
        }
        confirmText="모두 삭제"
        variant="destructive"
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
              ? confirmAction.type === "kill"
                ? "해지했나요?"
                : confirmAction.type === "revive"
                  ? "다시 살릴까요?"
                  : "삭제할까요?"
              : confirmAction.type === "kill"
                ? "구독 해지 완료 처리"
                : confirmAction.type === "revive"
                  ? "구독 다시 살리기"
                  : "구독 영구 삭제"
          }
          description={
            IS_APP_BUILD && confirmAction.type === "kill"
              ? "해지 완료로 기록하면\n결제일부터 지킨 돈으로 쌓여요."
              : IS_APP_BUILD && confirmAction.type === "revive"
                ? "구독 중으로 돌아가고,\n절약 기록에서는 빠져요."
                : IS_APP_BUILD
                  ? "절약 현황에서도 빠지고\n되돌릴 수 없어요."
                  : confirmAction.type === "kill"
                    ? `'${confirmAction.sub.name}'을(를) 해지 완료로 기록할까요?\n결제일이 지나면 지킨 돈으로 쌓여요.`
                    : confirmAction.type === "revive"
                      ? `'${confirmAction.sub.name}'을(를) 다시 구독 중으로 바꿀까요?\n절약 기록에서 빠져요.`
                      : `'${confirmAction.sub.name}'을(를) 삭제할까요?\n되돌릴 수 없어요.`
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
