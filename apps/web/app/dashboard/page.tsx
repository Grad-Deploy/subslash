"use client";

import React, { useEffect, useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";
import { useCheckInFlow, useReminderPrompt } from "@hooks/useCheckInFlow";
import { useAddSubscriptionFlow } from "@hooks/useAddSubscriptionFlow";
import { useStore } from "../../lib/store";
import { POPULAR_SERVICES, getActionQueue, getNextBillingHint } from "@subslash/shared";
import { takeWelcomePicks } from "@lib/welcome";
import { TotalSpend } from "../../components/dashboard/TotalSpend";
import { ActionQueue } from "../../components/dashboard/ActionQueue";
import { BillingCalendar } from "../../components/dashboard/BillingCalendar";
import { MonthlyValueReport } from "../../components/dashboard/MonthlyValueReport";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import { Button } from "../../components/ui/button";
import { ExchangeRateNote } from "../../components/settings/ExchangeRateNote";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { usePhoneUsageStore } from "../../hooks/usePhoneUsage";
import { Spinner } from "../../components/ui/spinner";
import { AppStartChecklist } from "../../components/app-start/AppStartChecklist";
import { AppServicePicker } from "../../components/app-start/AppServicePicker";
import { FirstCheckInCard } from "../../components/app-start/FirstCheckInCard";
import { useToast } from "@hooks/useToast";
import { useDashboardActions } from "@hooks/useDashboardActions";
import { useT } from "@lib/i18n";
import { SavedMoneyLink } from "../../components/dashboard/SavedMoneyLink";
import {
  AppAddButton,
  AppDecisionFold,
  AppNextBilling,
  AppSubscriptionSuggestions,
  AppUnusedAlerts,
  AppUsageFindSheet,
  AppValueReceipt,
} from "../../components/dashboard/app/appParts";

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
    checkIn,
    getActiveSubscriptions,
    getKilledSubscriptions,
    getDashboardStats,
    startDemo,
    demo,
  } = useStore();
  const router = useRouter();
  const t = useT().overview.page;
  const rate = useExchangeRate();
  // 폰 사용 기록을 읽을 수 없는 곳(웹·iOS)에는 '폰 사용 기록으로 찾기'를 두지 않는다.
  const phoneUsageStatus = usePhoneUsageStore((state) => state.status);
  const [usageFindOpen, setUsageFindOpen] = useState(false);

  const mounted = useIsClient();
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);

  const { showToast, toast } = useToast();
  // 해지 안내·가격 확인 같은 '지금 결정할 것'의 처리와 그 창(hooks/useDashboardActions).
  const actions = useDashboardActions(showToast);

  // 결제 알림 묻기와 체크인 창(내 구독과 같은 흐름, hooks/useCheckInFlow).
  const reminder = useReminderPrompt(showToast);
  const checkInFlow = useCheckInFlow({
    showToast,
    reminder,
    onKill: (id) => actions.openGuide(id),
  });
  const handleOpenCheckIn = checkInFlow.open;
  // 구독 추가 창과 등록 처리(내 구독과 같은 흐름, hooks/useAddSubscriptionFlow).
  const addFlow = useAddSubscriptionFlow({ showToast, reminder });
  const openAdd = addFlow.open;
  // 앱 소개 마지막 장에서 고른 서비스가 있으면 등록 창을 차례로 연다. 요금제·결제일은 창마다 사용자가 정한다.
  useEffect(() => {
    const presets = takeWelcomePicks().flatMap((id) => {
      const preset = POPULAR_SERVICES.find((p) => p.id === id);
      return preset ? [preset] : [];
    });
    addFlow.openQueue(presets);
    // 화면을 처음 열 때 한 번만 받는다(받으면 비워진다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  const activeSubs = getActiveSubscriptions();
  const killedSubs = getKilledSubscriptions();
  const stats = getDashboardStats();

  const now = new Date();
  const queue = getActionQueue(subscriptions, usageLogs, now, rate);
  const nextBilling = getNextBillingHint(subscriptions, now);

  // 첫 사용 안내(서비스 고르기 → 첫 체크인). 웹과 앱이 같다. 체험(샘플) 중에는 보이지 않는다 —
  // 샘플은 사용자의 기록이 아니다. 기기 알림 체크리스트는 앱에만 있다(알림이 기기 기능이라).
  const startFlow = !demo;
  const appStart = IS_APP_BUILD && startFlow;
  const isEmpty = activeSubs.length === 0;
  // 서비스 고르기는 기록이 하나도 없을 때만 띄운다. 해지한 구독만 남은 사람에게는 '결제가 멈췄나요'
  // 같은 할 일이 남아 있어, 할 일 목록을 가리면 안 된다.
  const isFirstVisit = isEmpty && killedSubs.length === 0;
  // 첫 체크인은 기록이 하나도 없을 때만, 가장 최근에 등록한 구독으로 묻는다. 그다음부터는
  // 할 일 목록(ActionQueue)이 체크인할 구독을 알려준다.
  const firstCheckInSub =
    startFlow && usageLogs.length === 0
      ? [...activeSubs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : undefined;

  // 폰 기록으로 찾은 구독 후보. 샘플 체험 중에는 묻지 않는다 — 화면의 목록이 내 기록이 아니다.
  const usageSuggestions = AppSubscriptionSuggestions && !demo && (
    <AppSubscriptionSuggestions
      subscriptions={subscriptions}
      onAdd={(preset) => openAdd({ preset })}
    />
  );

  // 샘플은 내 구독에 더하지 않고 잠시 동안만 보여준다(store의 DemoSession).
  const handleLoadDemo = () => {
    startDemo();
    showToast(t.demoStarted);
  };

  // '지금 결정할 것' 목록. 앱은 접기 묶음 안에, 웹은 그대로 그린다 — 속성은 같다.
  const queueProps = {
    items: queue,
    nextBilling,
    activeCount: activeSubs.length,
    onCheckIn: handleOpenCheckIn,
    ...actions.handlers,
    onAddFirst: () => openAdd(),
  };
  const unusedAlerts = AppUnusedAlerts && (
    <AppUnusedAlerts
      subscriptions={activeSubs}
      usageLogs={usageLogs}
      onCancelGuide={actions.openGuide}
    />
  );

  return (
    <div className="space-y-6">
      {toast}

      {AppAddButton && !(startFlow && isFirstVisit) && (
        <AppAddButton
          onManual={() => openAdd()}
          onPaste={() => setIsAutoImportOpen(true)}
          onPickPreset={(preset) => openAdd({ preset })}
        />
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {/*
            구독이 없을 때는 이 버튼들 대신 아래 서비스 고르기가 할 일 하나를 보여준다. 처음 온
            사람에게 버튼 세 개와 안내 카드를 한꺼번에 내밀면 어디서 시작할지 모른다.
          */}
          {/* 앱은 이 두 버튼 대신 떠 있는 + 하나로 추가 방법을 고른다(AppAddButton). */}
          {!(startFlow && isFirstVisit) && !AppAddButton && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoImportOpen(true)}
                className="font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
              >
                {t.autoImport}
              </Button>
              <Button size="sm" onClick={() => openAdd()} className="font-bold">
                {t.addNew}
              </Button>
            </>
          )}
        </div>
      </div>

      {/*
        넓은 화면에서는 왼쪽에 할 일, 오른쪽에 요약을 둔다. 좁은 화면에서는 같은 순서로
        아래로 쌓인다(할 일 → 월 고정지출 → 다가오는 결제 → 지킨 돈).
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          {appStart ? (
            <AppStartChecklist
              hasSubscription={activeSubs.length > 0}
              hasCheckIn={usageLogs.length > 0}
              remindersOn={reminder.remindersOn}
              onAdd={() => openAdd()}
              onCheckIn={() => {
                const target = firstCheckInSub ?? activeSubs[0];
                if (target) handleOpenCheckIn(target.id);
              }}
              onReminders={() => reminder.open(activeSubs[0] ?? null)}
            />
          ) : null}

          {firstCheckInSub && (
            <FirstCheckInCard
              key={firstCheckInSub.id}
              subscription={firstCheckInSub}
              onSubmit={(count) => {
                checkIn(firstCheckInSub.id, count);
                showToast(t.checkInRecorded(firstCheckInSub.name));
                // 체크리스트의 다음 단계(결제 알림)를 바로 이어서 묻는다. 이미 켰으면 묻지 않는다.
                reminder.askNow(firstCheckInSub);
              }}
            />
          )}

          {/* 지금 결정할 것 — 이 화면의 본체 */}
          {startFlow && isFirstVisit ? (
            <>
              {usageSuggestions}
              <AppServicePicker
                onPick={(preset) => openAdd({ preset })}
                onMore={() => openAdd()}
                onEmail={() => router.push("/import")}
                onCustom={() => openAdd({ custom: true })}
                onPaste={() => setIsAutoImportOpen(true)}
                onSample={IS_APP_BUILD ? undefined : handleLoadDemo}
                onUsage={
                  AppUsageFindSheet && phoneUsageStatus !== "unsupported"
                    ? () => setUsageFindOpen(true)
                    : undefined
                }
              />
            </>
          ) : AppDecisionFold && queue.length > 0 ? (
            // 앱: 할 일이 있으면 폰 사용 기록 알림까지 한 묶음으로 접는다. 알림은 제목 아래에 둔다.
            <AppDecisionFold items={queue}>
              {(foldButton) => (
                <ActionQueue
                  {...queueProps}
                  headerAction={foldButton}
                  lead={
                    <>
                      {usageSuggestions}
                      {unusedAlerts}
                    </>
                  }
                />
              )}
            </AppDecisionFold>
          ) : (
            <>
              {usageSuggestions}
              {unusedAlerts}
              <ActionQueue {...queueProps} />
            </>
          )}

          {/*
            이번 달 어느 날에 무엇이 빠져나가는지. '다가오는 결제' 목록을 대신한다 — 목록은 다음
            다섯 건만 보여줘서 결제가 몰린 주가 보이지 않았다. 좁은 aside에는 7열 그리드가 들어가지
            않아 본문에 둔다.
          */}
          {AppNextBilling ? (
            <AppNextBilling />
          ) : (
            <BillingCalendar subscriptions={activeSubs} now={now} />
          )}

          {/* 월간 구독 가성비 리포트 (손익 영수증) */}
          {AppValueReceipt ? (
            <AppValueReceipt
              subscriptions={activeSubs}
              usageLogs={usageLogs}
              now={now}
              onCancelGuide={actions.openReceiptGuide}
              onCheckIn={handleOpenCheckIn}
            />
          ) : (
            <MonthlyValueReport
              subscriptions={activeSubs}
              usageLogs={usageLogs}
              now={now}
              onCancelGuide={actions.openGuide}
              onCheckIn={handleOpenCheckIn}
            />
          )}
        </div>

        {/* 앱은 월 고정지출과 지킨 돈 한 줄을 가성비 계산서 카드가 맡고, 자세한 절약은 절약 현황으로 넘긴다. */}
        {!IS_APP_BUILD && (
          <aside className="space-y-4 lg:sticky lg:top-20" aria-label={t.summaryLabel}>
            {/* 지출 한 줄 */}
            {/* 구독이 없을 때 '월 고정지출 ₩0'은 할 일을 가리기만 한다. */}
            {!isEmpty && (
              <>
                <TotalSpend subscriptions={activeSubs} />
                <ExchangeRateNote />
              </>
            )}

            <SavedMoneyLink
              killedSubscriptions={killedSubs}
              killedCount={stats.killedCount}
              now={now}
            />
          </aside>
        )}
      </div>

      {AppUsageFindSheet && (
        <AppUsageFindSheet
          open={usageFindOpen}
          onClose={() => setUsageFindOpen(false)}
          onPick={(preset) => openAdd({ preset })}
        />
      )}

      {addFlow.dialog}

      {addFlow.duplicateDialog}

      {checkInFlow.modal}

      {appStart && reminder.sheet}

      <AutoImportModal
        isOpen={isAutoImportOpen}
        onClose={() => {
          setIsAutoImportOpen(false);
          reminder.flush();
        }}
        onRegistered={reminder.askAfterImport}
      />

      {actions.dialogs}
    </div>
  );
}
