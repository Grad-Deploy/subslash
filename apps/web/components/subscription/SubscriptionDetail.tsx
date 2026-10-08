"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useStore } from "../../lib/store";
import {
  SubscriptionFormData,
  CheckInResponse,
  POPULAR_SERVICES,
  subscriptionFormData,
} from "@subslash/shared";
import { SubForm } from "./SubForm";
import { CheckInModal } from "./CheckInModal";
import { CancelGuideModal } from "./CancelGuideModal";
import { PlanAlternatives } from "./PlanAlternatives";
import { KillRecordCard } from "./KillRecordCard";
import { SubscriptionActionConfirm } from "./SubscriptionActionConfirm";
import { SubscriptionSummaryCard } from "./detail/SubscriptionSummaryCard";
import { CancelRoutesCard } from "./detail/CancelRoutesCard";
import { CheckInHistory } from "./detail/CheckInHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";
import { useToast } from "@hooks/useToast";
import { useT, useServiceNames } from "@lib/i18n";

// 폰 사용 기록(안드로이드 앱 전용). 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppUsageDetail = IS_APP_BUILD
  ? dynamic(() => import("../usage/app/AppUsageDetail").then((m) => m.AppUsageDetail), {
      ssr: false,
    })
  : null;

interface SubscriptionDetailProps {
  id: string;
  /** 위쪽 왼쪽 버튼. 페이지로 열면 '뒤로 가기', 목록 옆 칸으로 열면 '닫기'. */
  onClose: () => void;
  closeLabel: string;
  /** 이 구독을 떠날 때 — 삭제한 뒤, 또는 찾을 수 없는 구독을 열었을 때. */
  onLeave: () => void;
  /** 페이지에서는 h1이다. 목록 옆 칸에서는 페이지 제목(구독 관리) 아래라 h2다. */
  headingLevel?: "h1" | "h2";
  className?: string;
}

/**
 * 구독 한 개의 상세 — 요약, 해지 경로 안내, 체크인 기록, 수정·체크인·해지 창.
 *
 * `/subs/[id]` 페이지와 넓은 화면의 `/subs` 옆 칸이 같은 것을 쓴다. 두 곳이 따로
 * 그리면 한쪽에만 규칙(해지한 구독에는 체크인을 묻지 않는다 등)이 남기 쉽다.
 */
export function SubscriptionDetail({
  id,
  onClose,
  closeLabel,
  onLeave,
  headingLevel = "h1",
  className,
}: SubscriptionDetailProps) {
  const names = useServiceNames();
  const {
    subscriptions,
    usageLogs,
    updateSubscription,
    killSubscription,
    reviveSubscription,
    deleteSubscription,
    checkIn,
  } = useStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"revive" | "delete" | null>(null);

  const t = useT();
  const { showToast, toast } = useToast();

  const sub = subscriptions.find((s) => s.id === id);
  const Title = headingLevel;

  if (!sub) {
    // 왜 없는지는 모른다. 구독 기록은 기기에 있으므로, 지웠을 수도 있고 다른 기기에 있을 수도
    // 있다. "이미 삭제되었습니다"라고 단정하면 캘린더 링크를 다른 기기에서 연 사람에게 거짓말이
    // 된다 — 그 기록은 멀쩡히 살아 있다.
    return (
      <div className={cn("text-center py-20 space-y-4", className)}>
        <Title className="text-2xl font-bold">{t.detail.missingTitle}</Title>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          {t.detail.missingBody}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            {t.detail.login}
          </Link>
          {t.detail.missingAfter}
        </p>
        <Button onClick={onLeave}>{t.detail.backToList}</Button>
      </div>
    );
  }

  const subLogs = usageLogs.filter((log) => log.subscriptionId === id);
  const isKilled = sub.status === "killed";

  const handleEditSubmit = (data: SubscriptionFormData) => {
    updateSubscription(sub.id, data);
    setIsEditOpen(false);
    showToast(t.detail.saved);
  };

  const handleOpenCheckIn = () => {
    setCheckInResult(undefined);
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = (count: number) => {
    try {
      const res = checkIn(sub.id, count);
      setCheckInResult(res);
      showToast(t.detail.checkedIn);
    } catch (error) {
      console.error(error);
      showToast(t.detail.saveFailed);
    }
  };

  // 실제 해지는 서비스 쪽에서 이뤄진다. 버튼은 먼저 가이드를 열어 거기까지
  // 데려다주고, 사용자가 마쳤다고 알려줄 때만 완료로 기록한다.
  const handleKill = () => setIsGuideOpen(true);

  const executeConfirm = () => {
    if (confirmType === "revive") {
      reviveSubscription(sub.id);
      showToast(t.detail.revived(names.sub(sub)));
    } else if (confirmType === "delete") {
      deleteSubscription(sub.id);
      onLeave();
    }
    setConfirmType(null);
  };

  return (
    <div className={cn("space-y-8", className)}>
      {toast}

      {/* Top Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
        >
          {closeLabel}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            {t.detail.edit}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmType("delete")}
          >
            {t.detail.delete}
          </Button>
        </div>
      </div>

      <SubscriptionSummaryCard
        sub={sub}
        headingLevel={headingLevel}
        onCheckIn={handleOpenCheckIn}
        onKill={handleKill}
        onRevive={() => setConfirmType("revive")}
      />

      {/*
        해지 전에는 같은 서비스의 더 싼 요금제를, 해지한 뒤에는 그 해지의 기록(다시 살펴볼 날·근거·환불
        요청 글)을 보여 준다.
      */}
      {isKilled ? (
        <KillRecordCard key={sub.killedAt} subscription={sub} onMessage={showToast} />
      ) : (
        <PlanAlternatives subscription={sub} onChanged={showToast} />
      )}

      <CancelRoutesCard sub={sub} onMessage={showToast} onOpenGuide={() => setIsGuideOpen(true)} />

      {AppUsageDetail && !isKilled && <AppUsageDetail subscription={sub} />}

      <CheckInHistory sub={sub} logs={subLogs} onCheckIn={handleOpenCheckIn} />

      {/* Edit Form Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.detail.editTitle}</DialogTitle>
            <DialogDescription>{t.detail.editDescription}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              mode="edit"
              popularServices={POPULAR_SERVICES}
              initialData={subscriptionFormData(sub)}
              submitLabel={t.form.save}
              onSubmit={handleEditSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* CheckIn Modal */}
      <CheckInModal
        subscription={sub}
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
        onKill={handleKill}
        result={checkInResult}
      />

      {/* Cancel Guide Modal (Issue 14) */}
      <CancelGuideModal
        subscription={sub}
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onConfirmKilled={() => {
          // 가이드에서 '해지 완료했어요'를 누른 것이 곧 확인이다.
          killSubscription(sub.id);
          showToast(t.detail.killRecorded(names.sub(sub)));
        }}
      />

      {confirmType && (
        <SubscriptionActionConfirm
          action={{ type: confirmType, sub }}
          onClose={() => setConfirmType(null)}
          onConfirm={executeConfirm}
        />
      )}
    </div>
  );
}
