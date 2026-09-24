"use client";

import React, { useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";
import { useLocalReminderSettings } from "@hooks/useLocalReminders";
import { useStore } from "../../lib/store";
import {
  Subscription,
  SubscriptionFormData,
  CheckInResponse,
  POPULAR_SERVICES,
  presetFormData,
  type ServicePreset,
  formatCurrency,
  formatKRW,
  getActionQueue,
  getDetoxLevel,
  getNextBillingHint,
  getSavingsTiers,
  getMyMonthlyAmountKRW,
} from "@subslash/shared";
import { TotalSpend } from "../../components/dashboard/TotalSpend";
import { OnboardingTourCard } from "../../components/dashboard/OnboardingTourCard";
import { ActionQueue } from "../../components/dashboard/ActionQueue";
import { BillingCalendar } from "../../components/dashboard/BillingCalendar";
import { MonthlyValueReport } from "../../components/dashboard/MonthlyValueReport";
import dynamic from "next/dynamic";
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
import { Spinner } from "../../components/ui/spinner";
import { AppStartChecklist } from "../../components/app-start/AppStartChecklist";
import { AppServicePicker } from "../../components/app-start/AppServicePicker";
import { FirstCheckInCard } from "../../components/app-start/FirstCheckInCard";
import { ReminderPromptSheet } from "../../components/app-start/ReminderPromptSheet";

// 앱에서는 가성비 리포트와 월 고정지출을 계산서 카드 하나로 보여준다. 웹 사용자가 이 코드를 받지 않도록 앱 빌드에서만 불러온다.
const AppValueReceipt = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/dashboard/app/AppValueReceipt").then((m) => m.AppValueReceipt),
      { ssr: false },
    )
  : null;

const AppKillConfirmDialog = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../components/dashboard/app/AppKillConfirmDialog").then(
          (m) => m.AppKillConfirmDialog,
        ),
      { ssr: false },
    )
  : null;

const AppKillCelebration = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../components/dashboard/app/AppKillCelebration").then(
          (m) => m.AppKillCelebration,
        ),
      { ssr: false },
    )
  : null;

const AppNextKillDialog = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../components/dashboard/app/AppNextKillDialog").then((m) => m.AppNextKillDialog),
      { ssr: false },
    )
  : null;

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
    startDemo,
    demo,
  } = useStore();
  const router = useRouter();
  const [reminderSettings] = useLocalReminderSettings();
  const rate = useExchangeRate();

  const mounted = useIsClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  // 등록 창을 여는 방식(앱의 빈 대시보드에서 서비스를 눌렀는지, '직접 입력'을 눌렀는지).
  // 열 때마다 key를 바꿔 SubForm을 새로 그린다 — 앞서 연 창의 입력이 남지 않게.
  const [addInitial, setAddInitial] = useState<Partial<SubscriptionFormData> | undefined>();
  const [addCustom, setAddCustom] = useState(false);
  const [addKey, setAddKey] = useState(0);
  // 앱: 결제 알림을 켜기 전에 앱 안에서 먼저 묻는 시트. 누구의 결제일로 안내할지 함께 둔다.
  const [reminderPromptSub, setReminderPromptSub] = useState<Subscription | null | undefined>(
    undefined,
  );
  const [checkInSub, setCheckInSub] = useState<Subscription | null>(null);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);
  const [killTarget, setKillTarget] = useState<Subscription | null>(null);
  // 앱 계산서에서 '쉬어가도 될 구독'을 이어서 해지할 때의 순서. current는 지금 해지 안내를 연 구독,
  // rest는 그 뒤에 물어볼 구독이다. 계산서가 아닌 곳에서 연 해지 안내에는 쓰지 않는다.
  const [killSeries, setKillSeries] = useState<{
    current: string;
    rest: string[];
    /** 이번에 이어서 해지한 구독들의 월 내 몫. 다 끝나면 축하 화면에 합계를 보여준다. */
    done: number[];
  } | null>(null);
  const [celebration, setCelebration] = useState<{ count: number; monthlyKRW: number } | null>(
    null,
  );
  const [nextKill, setNextKill] = useState<Subscription | null>(null);

  const [chargedTarget, setChargedTarget] = useState<Subscription | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
  const tiers = getSavingsTiers(killedSubs, now, rate);
  // 레벨은 1년치 요금이 아니라 결제가 멈춘 것을 확인한 지킨 돈으로 매긴다.
  const detoxLevel = getDetoxLevel(tiers.confirmed, stats.killedCount);

  const findSub = (id: string) => subscriptions.find((s) => s.id === id);

  const openAdd = (options?: { preset?: ServicePreset; custom?: boolean }) => {
    setAddInitial(options?.preset ? presetFormData(options.preset) : undefined);
    setAddCustom(options?.custom ?? false);
    setAddKey((k) => k + 1);
    setIsAddOpen(true);
  };

  // 앱의 첫 사용 안내. 체험(샘플) 중에는 보이지 않는다 — 샘플은 사용자의 기록이 아니다.
  const appStart = IS_APP_BUILD && !demo;
  // 첫 체크인은 기록이 하나도 없을 때만, 가장 최근에 등록한 구독으로 묻는다. 그다음부터는
  // 할 일 목록(ActionQueue)이 체크인할 구독을 알려준다.
  const firstCheckInSub =
    appStart && usageLogs.length === 0
      ? [...activeSubs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : undefined;

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
      showToast(`${checkInSub.name} 체크인 완료`);
    } catch (error) {
      console.error(error);
      showToast("체크인하지 못했어요. 다시 시도해 주세요.");
    }
  };

  // 실제 해지는 서비스 쪽에서 해야 하므로 가이드를 먼저 열고, 마쳤다고
  // 알려줄 때만 완료로 기록한다.
  const handleCancelGuide = (id: string) => {
    const sub = findSub(id);
    if (sub) setGuideTarget(sub);
  };

  // 계산서에서 해지 안내를 열 때. 뒤에 남은 구독을 기억해 두었다가 해지를 마치면 다음 것을 묻는다.
  const handleReceiptCancelGuide = (id: string, rest: string[] = []) => {
    setKillSeries({ current: id, rest, done: [] });
    handleCancelGuide(id);
  };

  // 해지를 기록한 뒤 이어서 물어볼 다음 구독. 그 사이 이미 해지했거나 지운 구독은 건너뛴다.
  // 마지막 하나까지 해지하면 축하 화면을 띄운다. 중간에 그만두면 띄우지 않는다.
  const advanceKillSeries = (killed: Subscription) => {
    if (!killSeries || killSeries.current !== killed.id) return;
    const done = [...killSeries.done, getMyMonthlyAmountKRW(killed, rate)];
    const remaining = killSeries.rest.filter((id) => {
      const sub = findSub(id);
      return sub && sub.status === "active";
    });
    const next = remaining[0] ? findSub(remaining[0]) : undefined;
    if (next) {
      setKillSeries({ current: next.id, rest: remaining.slice(1), done });
      setNextKill(next);
    } else {
      setKillSeries(null);
      setCelebration({ count: done.length, monthlyKRW: done.reduce((a, b) => a + b, 0) });
    }
  };

  const confirmKill = (target: Subscription) => {
    killSubscription(target.id);
    showToast(`${target.name} 해지 완료로 기록`);
    setKillTarget(null);
    advanceKillSeries(target);
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
        ? `${sub.name} 요금을 ${formatCurrency(newAmount, sub.currency)}으로 바꿨어요.`
        : `${sub.name} 요금 확인 완료`,
    );
  };

  // 해지 뒤 첫 결제일에 결제가 없었다는 답만이 해지를 확인해 준다.
  const handleKillNotCharged = (id: string) => {
    const sub = findSub(id);
    if (!sub) return;
    confirmKillVerified(id);
    showToast(`${sub.name} 결제 멈춤 확인`);
  };

  const handleKillCharged = (id: string) => {
    const sub = findSub(id);
    if (sub) setChargedTarget(sub);
  };

  const handleAddSubmit = (data: SubscriptionFormData) => {
    addSubscription(data);
    setIsAddOpen(false);
    showToast(`${data.name} 등록 완료`);
  };

  // 샘플은 내 구독에 더하지 않고 잠시 동안만 보여준다(store의 DemoSession).
  const handleLoadDemo = () => {
    startDemo();
    showToast("샘플 체험 시작 · 내 구독과 섞이지 않아요");
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
          <p className="text-sm text-muted-foreground">결정이 필요한 구독만 모았어요.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 앱에서 구독이 없을 때는 이 버튼들 대신 아래 빈 화면이 할 일을 보여준다. */}
          {!(appStart && activeSubs.length === 0) && (
            <>
              {activeSubs.length === 0 && (
                <Button variant="outline" size="sm" onClick={handleLoadDemo}>
                  샘플 불러오기
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoImportOpen(true)}
                className="font-semibold border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
              >
                자동 불러오기
              </Button>
              <Button size="sm" onClick={() => openAdd()} className="font-bold">
                + 새 구독 등록
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
              remindersOn={reminderSettings.enabled}
              onAdd={() => openAdd()}
              onCheckIn={() => {
                const target = firstCheckInSub ?? activeSubs[0];
                if (target) handleOpenCheckIn(target.id);
              }}
              onReminders={() => setReminderPromptSub(activeSubs[0] ?? null)}
            />
          ) : (
            <OnboardingTourCard onStartAdd={() => openAdd()} activeCount={activeSubs.length} />
          )}

          {firstCheckInSub && (
            <FirstCheckInCard
              key={firstCheckInSub.id}
              subscription={firstCheckInSub}
              onSubmit={(count) => {
                checkIn(firstCheckInSub.id, count);
                showToast(`${firstCheckInSub.name} 사용 횟수를 기록했습니다.`);
                // 체크리스트의 다음 단계(결제 알림)를 바로 이어서 묻는다. 이미 켰으면 묻지 않는다.
                if (!reminderSettings.enabled) setReminderPromptSub(firstCheckInSub);
              }}
            />
          )}

          {/* 지금 결정할 것 — 이 화면의 본체 */}
          {appStart && activeSubs.length === 0 ? (
            <AppServicePicker
              onPick={(preset) => openAdd({ preset })}
              onMore={() => openAdd()}
              onEmail={() => router.push("/import")}
              onCustom={() => openAdd({ custom: true })}
              onPaste={() => setIsAutoImportOpen(true)}
            />
          ) : (
            <ActionQueue
              items={queue}
              nextBilling={nextBilling}
              activeCount={activeSubs.length}
              onCheckIn={handleOpenCheckIn}
              onCancelGuide={handleCancelGuide}
              onConfirmPrice={handleConfirmPrice}
              onKillNotCharged={handleKillNotCharged}
              onKillCharged={handleKillCharged}
              onAddFirst={() => openAdd()}
            />
          )}

          {/*
            이번 달 어느 날에 무엇이 빠져나가는지. '다가오는 결제' 목록을 대신한다 — 목록은 다음
            다섯 건만 보여줘서 결제가 몰린 주가 보이지 않았다. 좁은 aside에는 7열 그리드가 들어가지
            않아 본문에 둔다.
          */}
          <BillingCalendar subscriptions={activeSubs} now={now} />

          {/* 월간 구독 가성비 리포트 (손익 영수증) */}
          {AppValueReceipt ? (
            <AppValueReceipt
              subscriptions={activeSubs}
              usageLogs={usageLogs}
              now={now}
              onCancelGuide={handleReceiptCancelGuide}
              onCheckIn={handleOpenCheckIn}
            />
          ) : (
            <MonthlyValueReport
              subscriptions={activeSubs}
              usageLogs={usageLogs}
              now={now}
              onCancelGuide={handleCancelGuide}
              onCheckIn={handleOpenCheckIn}
            />
          )}
        </div>

        {/* 앱은 월 고정지출을 가성비 계산서 카드가, 절약 성과를 아래 탭의 절약 현황이 맡는다. */}
        {!IS_APP_BUILD && (
          <aside className="space-y-4 lg:sticky lg:top-20" aria-label="이번 달 요약">
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
                    지킨 돈
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
                <span className="text-sm font-semibold text-muted-foreground shrink-0">
                  절약 현황 →
                </span>
              </Link>
            )}
          </aside>
        )}
      </div>

      {/* SubForm Modal for Adding */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>새 구독 등록</DialogTitle>
            <DialogDescription>서비스를 고르거나 직접 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              key={addKey}
              popularServices={POPULAR_SERVICES}
              initialData={addInitial}
              openCustom={addCustom}
              onSubmit={handleAddSubmit}
            />
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

      {appStart && (
        <ReminderPromptSheet
          open={reminderPromptSub !== undefined}
          subscription={reminderPromptSub ?? undefined}
          onClose={() => setReminderPromptSub(undefined)}
          onEnabled={() => {
            setReminderPromptSub(undefined);
            showToast("결제 알림을 켰어요. 몇 초 뒤 시험 알림이 떠요.");
          }}
        />
      )}

      <AutoImportModal isOpen={isAutoImportOpen} onClose={() => setIsAutoImportOpen(false)} />

      <CancelGuideModal
        subscription={guideTarget}
        isOpen={!!guideTarget}
        onClose={() => setGuideTarget(null)}
        onConfirmKilled={handleConfirmKilled}
      />

      {killTarget &&
        (AppKillConfirmDialog ? (
          <AppKillConfirmDialog
            subscription={killTarget}
            onConfirm={() => confirmKill(killTarget)}
            onCancel={() => {
              setKillTarget(null);
              setKillSeries(null);
            }}
          />
        ) : (
          <ConfirmDialog
            isOpen={!!killTarget}
            onClose={() => setKillTarget(null)}
            onConfirm={() => confirmKill(killTarget)}
            title="구독 해지 완료 처리"
            description={`'${killTarget.name}'을(를) 해지 완료로 기록할까요?\n결제일이 지나면 지킨 돈으로 쌓여요.`}
            confirmText="해지 완료"
            cancelText="취소"
            variant="destructive"
          />
        ))}

      {/* 앱 계산서에서 이어서 해지할 때만 뜬다(killSeries는 계산서에서만 채운다). */}
      {nextKill && AppNextKillDialog && (
        <AppNextKillDialog
          subscription={nextKill}
          remaining={killSeries?.rest.length ?? 0}
          onContinue={() => {
            const next = nextKill;
            setNextKill(null);
            setGuideTarget(next);
          }}
          onStop={() => {
            setNextKill(null);
            setKillSeries(null);
          }}
        />
      )}

      {celebration && AppKillCelebration && (
        <AppKillCelebration
          count={celebration.count}
          monthlyKRW={celebration.monthlyKRW}
          onDone={() => setCelebration(null)}
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
            showToast(`${chargedTarget.name} 구독 중으로 되돌림`);
            setChargedTarget(null);
          }}
          title="해지가 안 됐을 수 있어요"
          description={`해지 후에도 결제됐다면 해지가 끝나지 않았을 수 있어요.\n구독 중으로 되돌리고 해지 가이드를 열어요.`}
          confirmText="되돌리고 가이드 열기"
          cancelText="취소"
        />
      )}
    </div>
  );
}
