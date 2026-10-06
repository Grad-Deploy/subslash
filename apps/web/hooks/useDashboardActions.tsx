"use client";

import React, { useState } from "react";
import { formatCurrency, type Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { CancelGuideModal } from "../components/subscription/CancelGuideModal";
import { ConfirmDialog } from "../components/ui/confirm-dialog";
import { useKillSeries } from "./useKillSeries";

/**
 * 대시보드의 '지금 결정할 것'(ActionQueue)과 계산서가 부르는 처리. 해지 안내·해지 확인·가격 확인·해지 알림
 * 답하기와, 그 처리가 띄우는 창(해지 안내, '해지가 안 됐을 수 있어요', 이어서 해지하기)을 함께 둔다 — 화면은
 * 무엇을 어디에 그릴지만 정한다.
 *
 * 실제 해지는 서비스 쪽에서 해야 하므로 가이드를 먼저 열고, 마쳤다고 알려줄 때만 완료로 기록한다.
 */
export function useDashboardActions(showToast: (message: string) => void) {
  const {
    killSubscription,
    reviveSubscription,
    confirmKillVerified,
    dismissCancelNotice,
    confirmSubscriptionPrice,
  } = useStore();
  const [guideTarget, setGuideTarget] = useState<Subscription | null>(null);
  const [chargedTarget, setChargedTarget] = useState<Subscription | null>(null);
  // 앱 계산서에서 이어서 해지하기(hooks/useKillSeries).
  const killSeries = useKillSeries((sub) => setGuideTarget(sub));

  const findSub = (id: string) => useStore.getState().subscriptions.find((s) => s.id === id);

  const openGuide = (id: string) => {
    const sub = findSub(id);
    if (sub) setGuideTarget(sub);
  };

  const confirmKill = (target: Subscription) => {
    killSubscription(target.id);
    showToast(`${target.name} 해지 완료로 기록`);
    killSeries.advance(target);
  };

  // 가이드에서 '해지 완료했어요'를 누른 것이 곧 확인이다 — 예전에는 확인 창을 한 번 더 띄웠다.
  // 해지 알림 메일이 온 구독도 사용자가 해지했다고 답해야 기록한다 — 메일은 제목 낱말로 가린 것이다.
  const confirmKillById = (id: string) => {
    const sub = findSub(id);
    if (sub) confirmKill(sub);
  };

  const handlers = {
    onCancelGuide: openGuide,
    onConfirmPrice: (id: string, newAmount?: number) => {
      const sub = findSub(id);
      if (!sub) return;
      confirmSubscriptionPrice(id, newAmount);
      showToast(
        newAmount !== undefined
          ? `${sub.name} 요금을 ${formatCurrency(newAmount, sub.currency)}으로 바꿨어요.`
          : `${sub.name} 요금 확인 완료`,
      );
    },
    // 해지 뒤 첫 결제일에 결제가 없었다는 답만이 해지를 확인해 준다.
    onKillNotCharged: (id: string) => {
      const sub = findSub(id);
      if (!sub) return;
      confirmKillVerified(id);
      showToast(`${sub.name} 결제 멈춤 확인`);
    },
    onKillCharged: (id: string) => {
      const sub = findSub(id);
      if (sub) setChargedTarget(sub);
    },
    onCancelNoticeKilled: confirmKillById,
    onCancelNoticeDismissed: (id: string) => {
      const sub = findSub(id);
      if (!sub) return;
      dismissCancelNotice(id);
      showToast(`${sub.name}은(는) 구독 중으로 둘게요`);
    },
  };

  return {
    /** 해지 안내를 연다. */
    openGuide,
    /** 계산서에서 해지 안내를 열 때. 뒤에 남은 구독을 기억해 두었다가 해지를 마치면 다음 것을 묻는다. */
    openReceiptGuide: (id: string, rest: string[] = []) => {
      killSeries.start(id, rest);
      openGuide(id);
    },
    /** '지금 결정할 것' 목록에 그대로 넘기는 처리. */
    handlers,
    dialogs: (
      <>
        <CancelGuideModal
          subscription={guideTarget}
          isOpen={!!guideTarget}
          onClose={() => setGuideTarget(null)}
          onConfirmKilled={confirmKillById}
        />

        {/* 앱 계산서에서 이어서 해지할 때만 뜬다. */}
        {killSeries.dialogs}

        {chargedTarget && (
          <ConfirmDialog
            isOpen={!!chargedTarget}
            onClose={() => setChargedTarget(null)}
            onConfirm={() => {
              // 결제가 됐다면 지금도 돈이 나가는 구독이다. 해지 기록을 지우고 가이드를
              // 다시 연다. 해지를 마치고 다시 완료를 누르면 해지일이 오늘로 잡혀,
              // 이미 나간 달은 절약에서 저절로 빠진다.
              reviveSubscription(chargedTarget.id);
              const revived = findSub(chargedTarget.id);
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
      </>
    ),
  };
}
