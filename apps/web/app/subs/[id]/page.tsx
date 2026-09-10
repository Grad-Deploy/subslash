"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../../lib/store";
import {
  SubscriptionFormData,
  CheckInResponse,
  POPULAR_SERVICES,
  PAYMENT_METHOD_OPTIONS,
  formatCurrency,
  getCancelUrlKind,
  getDaysUntilBillingFor,
} from "@subslash/shared";
import { SubForm } from "../../../components/subscription/SubForm";
import { CheckInModal } from "../../../components/subscription/CheckInModal";
import { CancelGuideModal } from "../../../components/subscription/CancelGuideModal";
import { RiskBadge } from "../../../components/dashboard/RiskBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const {
    subscriptions,
    usageLogs,
    updateSubscription,
    killSubscription,
    reviveSubscription,
    deleteSubscription,
    checkIn,
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"kill" | "revive" | "delete" | null>(null);

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

  const sub = subscriptions.find((s) => s.id === id);

  if (!sub) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">구독을 찾을 수 없습니다</h2>
        <p className="text-sm text-muted-foreground">이미 삭제되었거나 존재하지 않는 구독입니다.</p>
        <Button onClick={() => router.push("/subs")}>← 구독 목록으로 돌아가기</Button>
      </div>
    );
  }

  const subLogs = usageLogs.filter((log) => log.subscriptionId === id);
  const isKilled = sub.status === "killed";
  const daysLeft = getDaysUntilBillingFor(sub);
  const cancelUrlKind = getCancelUrlKind(sub.cancelUrl);
  // 연간 구독에 "매월 결제일"이라고 적으면 1년에 한 번인 결제가 매달 있는 것처럼 읽힌다.
  const billingScheduleLabel =
    sub.billingCycle !== "yearly"
      ? `매월 ${sub.billingDay}일 결제`
      : typeof sub.billingMonth === "number"
        ? `매년 ${sub.billingMonth}월 ${sub.billingDay}일 결제`
        : "연간 결제 · 결제 월 미설정";

  const handleEditSubmit = (data: SubscriptionFormData) => {
    updateSubscription(sub.id, data);
    setIsEditOpen(false);
    showToast("구독 정보가 수정되었습니다.");
  };

  const handleOpenCheckIn = () => {
    setCheckInResult(undefined);
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = (count: number) => {
    try {
      const res = checkIn(sub.id, count);
      setCheckInResult(res);
      showToast("체크인이 기록되었습니다.");
    } catch (error) {
      console.error(error);
      showToast("오류가 발생했습니다.");
    }
  };

  // 실제 해지는 서비스 쪽에서 이뤄진다. 버튼은 먼저 가이드를 열어 거기까지
  // 데려다주고, 사용자가 마쳤다고 알려줄 때만 완료로 기록한다.
  const handleKill = () => setIsGuideOpen(true);

  const executeConfirm = () => {
    if (confirmType === "kill") {
      killSubscription(sub.id);
      showToast(`🔪 ${sub.name} 해지가 완료되었습니다.`);
    } else if (confirmType === "revive") {
      reviveSubscription(sub.id);
      showToast(`✨ ${sub.name} 구독을 다시 활성화했습니다.`);
    } else if (confirmType === "delete") {
      deleteSubscription(sub.id);
      router.push("/subs");
    }
    setConfirmType(null);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Top Back & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
        >
          ← 뒤로 가기
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            ✏️ 정보 수정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmType("delete")}
          >
            삭제
          </Button>
        </div>
      </div>

      {/* Subscription Hero Card */}
      <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl">
              {sub.iconUrl || "📦"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{sub.name}</h1>
                <Badge variant={isKilled ? "secondary" : "default"}>
                  {isKilled ? "해지 완료" : "구독 중"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                카테고리: {sub.category} · 결제 주기:{" "}
                {sub.billingCycle === "yearly" ? "매년" : "매월"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-foreground">
              <span className="text-sm font-semibold text-muted-foreground">
                {sub.billingCycle === "yearly" ? "연 " : "월 "}
              </span>
              {formatCurrency(sub.amount, sub.currency)}
            </div>
            <div className="text-xs text-muted-foreground">{billingScheduleLabel}</div>
          </div>
        </div>

        {!isKilled ? (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
            <div className="text-sm font-medium">
              다음 결제까지:{" "}
              {daysLeft === null ? (
                <span className="font-bold text-muted-foreground">
                  연간 결제 월이 등록되지 않았습니다
                </span>
              ) : (
                <span className="font-bold text-destructive">D-{daysLeft}일</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleOpenCheckIn}>
                📊 이용 횟수 체크인
              </Button>
              <Button size="sm" variant="destructive" onClick={handleKill}>
                🔪 지금 해지하기
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-between border-t text-sm">
            <span className="text-muted-foreground">차단된 구독입니다.</span>
            <Button size="sm" variant="outline" onClick={() => setConfirmType("revive")}>
              다시 구독 중으로 변경
            </Button>
          </div>
        )}
      </div>

      {/* Direct Cancellation Deep-Link & Dark Pattern Breaker */}
      <div className="p-6 border-2 border-primary/20 bg-muted/30 rounded-2xl space-y-5">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h2 className="text-lg font-bold">1초 해지 직통 내비게이터 (Kill-Switch Hub)</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          어떤 계정으로 가입했는지, 어떤 수단으로 결제했는지 바로 확인하고 해지 페이지로 즉시
          이동합니다.
        </p>

        {/* Linked Account Card */}
        <div className="p-4 bg-card border rounded-2xl space-y-2 text-xs">
          <div className="font-bold flex items-center justify-between text-foreground">
            <span>🔐 로그인 연동 계정</span>
            {sub.linkedAccountName && (
              <button
                onClick={() => {
                  const idOnly =
                    sub.linkedAccountName!.split("(")[1]?.replace(")", "") ||
                    sub.linkedAccountName!;
                  navigator.clipboard.writeText(idOnly);
                  showToast("계정 ID가 클립보드에 복사되었습니다! 📋");
                }}
                className="text-primary underline hover:opacity-80 font-medium"
              >
                계정 ID 복사 📋
              </button>
            )}
          </div>
          {sub.linkedAccountName ? (
            <p className="text-muted-foreground">
              이 구독은 <strong className="text-foreground">{sub.linkedAccountName}</strong> 계정에
              연결되어 있습니다. 해지 페이지 진입 시 해당 계정으로 로그인되어 있어야 구독 취소
              버튼이 나타납니다.
            </p>
          ) : (
            <p className="text-muted-foreground">
              연동된 계정이 없습니다. 평소 주로 사용하는 대표 계정으로 로그인해주세요. (상단
              &lsquo;정보 수정&rsquo;에서 연동 계정 지정 가능)
            </p>
          )}

          {/* Payment Method Details */}
          {(() => {
            const pm = PAYMENT_METHOD_OPTIONS.find((p) => p.value === sub.paymentMethod);
            if (!pm) return null;
            return (
              <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground">
                결제 수단: <strong className="text-foreground">{pm.label}</strong>
                {pm.guide && <div className="mt-1 text-foreground/80">{pm.guide}</div>}
              </div>
            );
          })()}
        </div>

        {/* Action Buttons based on Payment Method & Service */}
        <div className="space-y-2">
          {(() => {
            const pm = PAYMENT_METHOD_OPTIONS.find((p) => p.value === sub.paymentMethod);
            return (
              <>
                {pm?.directCancelUrl && (
                  <Button
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-bold h-12 rounded-xl shadow-md"
                    onClick={() => window.open(pm.directCancelUrl, "_blank")}
                  >
                    💳 {pm.label} 전용 정기결제 관리 열기 (새 창)
                  </Button>
                )}
                {sub.cancelUrl && (
                  <>
                    <Button
                      size="lg"
                      className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold h-12 rounded-xl shadow-md"
                      onClick={() => window.open(sub.cancelUrl, "_blank")}
                    >
                      {cancelUrlKind === "direct"
                        ? `🚀 ${sub.name} 해지 페이지 바로가기 (새 창)`
                        : `🚀 ${sub.name} 열기 (새 창)`}
                    </Button>
                    {cancelUrlKind !== "direct" && (
                      <p className="text-[11px] text-muted-foreground text-center">
                        {cancelUrlKind === "entry"
                          ? "이 링크는 해지 화면이 아니라 서비스 첫 화면으로 갑니다. 아래 안내를 따라 해지 메뉴까지 이동하세요."
                          : "직접 입력한 주소입니다. 어디로 연결되는지는 확인되지 않았습니다."}
                      </p>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* 가이드 모달 진입점 — 링크가 죽었을 때의 폴백까지 한 화면에 모아준다. */}
        <Button
          variant="outline"
          size="lg"
          className="w-full h-11 rounded-xl font-semibold"
          onClick={() => setIsGuideOpen(true)}
        >
          📖 해지 방법 보기 (단계별 안내 · 폴백 링크)
        </Button>

        {sub.cancelGuide && (
          <div className="p-4 bg-background border rounded-xl space-y-2 text-xs">
            <div className="font-bold text-foreground">💡 30초 다크 패턴 탈출 가이드:</div>
            <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
              {sub.cancelGuide}
            </p>
          </div>
        )}
      </div>

      {/* Usage History / Check-In Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">체크인 기록 ({subLogs.length}건)</h3>
          <Button size="sm" variant="outline" onClick={handleOpenCheckIn}>
            + 체크인 하기
          </Button>
        </div>

        {subLogs.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl text-xs text-muted-foreground">
            아직 체크인 기록이 없습니다. 월 이용 횟수를 입력하여 1회당 비용을 계산해보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {subLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-card text-sm"
              >
                <div>
                  <div className="font-bold">{log.month} 사용 기록</div>
                  <div className="text-xs text-muted-foreground">
                    총 {log.usageCount}회 이용 · 1회당 ₩
                    {Math.round(log.costPerUse).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge level={log.riskLevel} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>구독 정보 수정</DialogTitle>
            <DialogDescription>금액, 결제일, 해지 링크 등의 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <SubForm
              popularServices={POPULAR_SERVICES}
              initialData={{
                name: sub.name,
                amount: sub.amount,
                currency: sub.currency,
                billingDay: sub.billingDay,
                billingCycle: sub.billingCycle,
                // 빠져 있으면 연간 구독의 결제 월이 '선택해주세요'로, 공유 구독이
                // '나 혼자'로 보여서 저장된 값과 다른 폼을 고치게 된다.
                billingMonth: sub.billingMonth,
                sharingCount: sub.sharingCount,
                myShareAmount: sub.myShareAmount,
                category: sub.category,
                cancelUrl: sub.cancelUrl,
                cancelGuide: sub.cancelGuide,
                iconUrl: sub.iconUrl,
                paymentMethod: sub.paymentMethod,
                linkedAccountId: sub.linkedAccountId,
                linkedAccountName: sub.linkedAccountName,
                accountMemo: sub.accountMemo,
              }}
              submitLabel="수정 내용 저장하기"
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
        onConfirmKilled={() => setConfirmType("kill")}
      />

      {/* Confirmation Modal */}
      {confirmType && (
        <ConfirmDialog
          isOpen={!!confirmType}
          onClose={() => setConfirmType(null)}
          onConfirm={executeConfirm}
          title={
            confirmType === "kill"
              ? "구독 해지 완료 처리"
              : confirmType === "revive"
                ? "구독 다시 살리기"
                : "구독 영구 삭제"
          }
          description={
            confirmType === "kill"
              ? `'${sub.name}' 구독을 해지(방어) 완료 상태로 전환하시겠습니까?
방어 성공 자산으로 기록되며 대시보드와 절약 현황에 반영됩니다.`
              : confirmType === "revive"
                ? `'${sub.name}' 구독을 다시 활성화하시겠습니까?
활성 구독 목록으로 복원되며, 절약 방어 자산에서 제외됩니다.`
                : `'${sub.name}' 구독을 영구 삭제하시겠습니까?
삭제된 구독 데이터는 복구할 수 없습니다.`
          }
          confirmText={
            confirmType === "kill" ? "해지 완료" : confirmType === "revive" ? "다시 살리기" : "삭제"
          }
          cancelText="취소"
          variant={confirmType === "revive" ? "default" : "destructive"}
        />
      )}
    </div>
  );
}
