"use client";

import React, { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../lib/store";
import { Subscription, formatKRW, sumMyMonthlyKRW } from "@subslash/shared";
import { SubscriptionActionConfirm } from "../../components/subscription/SubscriptionActionConfirm";
import { QuickPresetRecommender } from "../../components/subscription/QuickPresetRecommender";
import { CancelGuideModal } from "../../components/subscription/CancelGuideModal";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import { SubsEmptyState, SubsList } from "../../components/subscription/list/SubsList";
import {
  SubsFilterBar,
  SubsTabs,
  type SubsTab,
} from "../../components/subscription/list/SubsToolbar";
import { SubsDetailAside } from "../../components/subscription/list/SubsDetailAside";
import { useSubsView } from "../../components/subscription/list/useSubsView";
import { useSubsSelection } from "../../components/subscription/list/useSubsSelection";
import { Button } from "../../components/ui/button";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { ExchangeRateNote } from "../../components/settings/ExchangeRateNote";
import { IS_APP_BUILD } from "@lib/platform";
import { useCheckInFlow, useReminderPrompt } from "@hooks/useCheckInFlow";
import { useAddSubscriptionFlow } from "@hooks/useAddSubscriptionFlow";
import { sortSubsForApp, type AppSubsSort } from "@lib/subs-order";
import { GoogleCalendarSync } from "../../components/calendar/GoogleCalendarSync";
import { isGmailAutoImportOpen } from "@lib/privacy";
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
import { useToast } from "@hooks/useToast";
import { useLatestT, useT } from "@lib/i18n";

/**
 * 내 구독. 위에서부터 제목·불러오기, 구독 중/해지 완료 탭, 분류·보기 방식, 목록이고, 넓은 화면(xl)에서는
 * 목록 오른쪽에 고른 구독의 상세 칸을 둔다. 칸마다의 모양은 components/subscription/list에 있다.
 */
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
  const t = useT().subs;
  const tRef = useLatestT();

  const mounted = useIsClient();
  const [tab, setTab] = useState<SubsTab>("active");
  // 앱의 구독 추가 메뉴(AppAddButton). 빈 목록의 '구독 추가'도 + 버튼과 같은 메뉴를 연다.
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  // 앱: 구독 중 목록의 순서(결제일·금액·가성비).
  const [appSort, setAppSort] = useState<AppSubsSort>("billing");
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: "revive" | "delete";
    sub: Subscription;
  } | null>(null);
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);
  const [view, changeView] = useSubsView();
  // 표 보기일 때 표에 보이는 정렬 순서. ↑↓가 그 순서를 따른다.
  const [tableOrder, setTableOrder] = useState<string[]>([]);

  const { showToast, toast } = useToast();

  // 결제 알림 묻기와 체크인 창(대시보드와 같은 흐름, hooks/useCheckInFlow).
  const reminder = useReminderPrompt(showToast);
  const checkInFlow = useCheckInFlow({ showToast, reminder, onKill: (id) => handleKill(id) });
  // 구독 추가 창과 등록 처리(대시보드와 같은 흐름, hooks/useAddSubscriptionFlow).
  const addFlow = useAddSubscriptionFlow({ showToast, reminder });

  const activeSubs = getActiveSubscriptions();
  const killedSubs = getKilledSubscriptions();

  const inCategory = (subs: Subscription[]) =>
    filterCategory === "all" ? subs : subs.filter((s) => s.category === filterCategory);
  // 앱: 기본은 결제일이 가까운 순(결제월을 모르는 연간 구독은 맨 뒤), 칩으로 금액·가성비 순. 웹은 등록 순 그대로.
  const filteredActive = IS_APP_BUILD
    ? sortSubsForApp(inCategory(activeSubs), appSort, usageLogs, rate)
    : inCategory(activeSubs);
  const filteredKilled = inCategory(killedSubs);

  const visibleIds = (tab === "active" ? filteredActive : filteredKilled).map((s) => s.id);
  const visibleOrder = view === "table" && tableOrder.length > 0 ? tableOrder : visibleIds;
  const selection = useSubsSelection(visibleOrder);
  const { selectedId } = selection;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  const selectedExists = selectedId !== null && subscriptions.some((s) => s.id === selectedId);
  const findSub = (id: string) => subscriptions.find((s) => s.id === id);

  // 해지 버튼은 완료 처리로 바로 가지 않는다. 실제 해지는 서비스 쪽에서
  // 해야 하므로 가이드를 먼저 열고, 사용자가 마쳤다고 알려줄 때 확인을 받는다.
  const handleKill = (id: string) => {
    const sub = findSub(id);
    if (sub) setGuideTarget(sub);
  };

  // 가이드에서 '해지 완료했어요'를 누른 것이 곧 확인이다 — 예전에는 확인 창을 한 번 더 띄웠다.
  // 잘못 눌렀으면 '다시 살리기'로 되돌린다.
  const handleConfirmKilled = (id: string) => {
    const sub = findSub(id);
    if (!sub) return;
    killSubscription(sub.id);
    showToast(tRef.current.subs.page.killRecorded(sub.name));
  };

  const askConfirm = (type: "revive" | "delete") => (id: string) => {
    const sub = findSub(id);
    if (sub) setConfirmAction({ type, sub });
  };
  const handleRevive = askConfirm("revive");
  const handleDelete = askConfirm("delete");

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    const { type, sub } = confirmAction;
    if (type === "revive") {
      reviveSubscription(sub.id);
      showToast(tRef.current.subs.page.revived(sub.name));
    } else {
      deleteSubscription(sub.id);
      showToast(tRef.current.subs.page.deleted);
    }
    setConfirmAction(null);
  };

  const listProps = {
    usageLogs,
    view,
    selectedId,
    onSelect: selection.select,
    onOrderChange: setTableOrder,
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SelectedSubSync onChange={selection.setSelectedId} />
      </Suspense>

      {toast}

      {/*
        제목과 불러오기 두 개. 앱에서 먼저 줄인 모양을 웹도 쓴다 — 긴 부제와 혼자 빨갛게 튀던 '전체
        초기화'를 뺐다(전체 초기화는 아래 설정 목록의 데이터 묶음에 있다). 넓은 화면에는 떠 있는 +
        버튼이 없으므로 '구독 추가'를 함께 둔다.
      */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black tracking-tight">{t.page.title}</h1>
          <Button onClick={() => addFlow.open()} className="hidden font-bold md:inline-flex">
            {t.page.add}
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
              {t.page.findInMail}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAutoImportOpen(true)}
              className="font-semibold"
            >
              {t.page.pasteText}
            </Button>
          </div>
        )}
        {/* 앱: 자동 체크인 켜기/끄기는 설정 탭에 두고, 여기에는 상태 한 줄과 '폰 기록으로 체크인' 버튼을 둔다. */}
        {AppPhoneCheckInButton && (
          <AppPhoneCheckInButton
            subscriptions={activeSubs}
            onDone={(count) => showToast(tRef.current.subs.page.checkedIn(count))}
            autoSwitch={false}
            autoStatus
          />
        )}
      </div>

      {/* 앱은 환율을 설정 탭(화면)에 둔다. */}
      {!IS_APP_BUILD && <ExchangeRateNote />}

      <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start xl:gap-6 xl:space-y-0">
        <div className="min-w-0 space-y-6">
          <SubsTabs
            tab={tab}
            onChange={setTab}
            activeCount={activeSubs.length}
            // 앱은 숨긴 해지 구독을 목록에서 빼므로 개수도 보이는 것만 센다.
            killedCount={
              AppKilledList ? killedSubs.filter((s) => !s.hiddenAt).length : killedSubs.length
            }
          />
          <SubsFilterBar
            category={filterCategory}
            onCategoryChange={setFilterCategory}
            view={view}
            onViewChange={changeView}
          />

          {tab === "active" ? (
            <div className="space-y-4">
              {filteredActive.length === 0 ? (
                <SubsEmptyState
                  Icon={Receipt}
                  title={t.page.emptyActive}
                  action={
                    <Button
                      size="sm"
                      onClick={() => (AppAddButton ? setAddMenuOpen(true) : addFlow.open())}
                    >
                      {t.page.add}
                    </Button>
                  }
                >
                  {t.page.emptyActiveHint}
                </SubsEmptyState>
              ) : (
                <>
                  {AppSortSelect && (
                    <AppSortSelect
                      count={filteredActive.length}
                      value={appSort}
                      onChange={setAppSort}
                    />
                  )}
                  <SubsList
                    {...listProps}
                    subscriptions={filteredActive}
                    handlers={{ mode: "active", onCheckIn: checkInFlow.open, onKill: handleKill }}
                  />
                </>
              )}

              <QuickPresetRecommender
                subscriptions={subscriptions}
                onSelectPreset={(preset) => addFlow.open({ preset })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredKilled.length === 0 ? (
                <SubsEmptyState Icon={ShieldCheck} title={t.page.emptyKilled}>
                  {t.page.emptyKilledHint}
                </SubsEmptyState>
              ) : (
                <div className="space-y-3">
                  {/* 앱은 이 자리에 '지킨 돈 · 절약 현황' 한 줄(AppKilledList 맨 위)을 둔다. 두 줄이 같이 있으면
                      '매달 아껴요'와 '지켰어요'가 같은 돈처럼 보인다. */}
                  {!AppKilledList && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300">
                      {/* 해지를 유지하면 아낄 금액이다. 이미 지킨 돈은 절약 현황이 따로 센다. */}
                      {t.page.killedSummary(
                        filteredKilled.length,
                        formatKRW(sumMyMonthlyKRW(filteredKilled, rate)),
                      )}
                    </div>
                  )}

                  {AppKilledList ? (
                    <AppKilledList
                      subscriptions={filteredKilled}
                      onRevive={handleRevive}
                      onMessage={showToast}
                    />
                  ) : (
                    <SubsList
                      {...listProps}
                      subscriptions={filteredKilled}
                      handlers={{ mode: "killed", onRevive: handleRevive, onDelete: handleDelete }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <SubsDetailAside
          selectedId={selectedId}
          outsideList={selectedExists && !visibleIds.includes(selectedId)}
          onClose={selection.clear}
          onLeave={selection.leave}
        />
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
            onManual={() => addFlow.open()}
            onPaste={() => setIsAutoImportOpen(true)}
            onPickPreset={(preset) => addFlow.open({ preset })}
            menuOpen={addMenuOpen}
            onMenuOpenChange={setAddMenuOpen}
          />
        )
      ) : (
        <button
          onClick={() => addFlow.open()}
          className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl text-2xl font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30"
          aria-label={t.page.addAria}
        >
          +
        </button>
      )}

      {addFlow.dialog}

      {IS_APP_BUILD && reminder.sheet}

      {addFlow.duplicateDialog}

      {checkInFlow.modal}

      <AutoImportModal
        isOpen={isAutoImportOpen}
        onClose={() => {
          setIsAutoImportOpen(false);
          reminder.flush();
        }}
        onRegistered={reminder.askAfterImport}
      />

      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {confirmAction && (
        <SubscriptionActionConfirm
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
        />
      )}
    </div>
  );
}
