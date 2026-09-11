"use client";

import React, { useEffect, useState } from "react";
import {
  Subscription,
  CheckInResponse,
  PAYMENT_METHOD_OPTIONS,
  getCancelUrlKind,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RiskBadge } from "../dashboard/RiskBadge";
import { CostPerUseBar } from "./CostPerUseBar";
import { cn } from "@lib/utils";

interface CheckInModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
  onKill?: (id: string) => void;
  result?: CheckInResponse;
  /** Pre-selected answer, e.g. the one-tap button pressed in a reminder email. */
  initialCount?: number;
}

export function CheckInModal({
  subscription,
  isOpen,
  onClose,
  onSubmit,
  onKill,
  result,
  initialCount = 0,
}: CheckInModalProps) {
  const [count, setCount] = useState<number>(initialCount);
  const [copied, setCopied] = useState(false);

  // The modal stays mounted on the detail page, so reset the counter whenever
  // it is reopened or pointed at a different subscription.
  useEffect(() => {
    if (isOpen) {
      setCount(initialCount);
      setCopied(false);
    }
  }, [isOpen, subscription.id, initialCount]);

  const presets = [0, 1, 3, 5, 10, 20, 30];
  const isRed = result?.riskLevel === "red";

  // Match direct cancel URL based on payment method or service cancelUrl
  const paymentMethodInfo = PAYMENT_METHOD_OPTIONS.find(
    (pm) => pm.value === subscription.paymentMethod,
  );

  // The payment-method link manages the recurring charge at the payment
  // provider, not at the service, so it cannot be labelled as the service's
  // cancellation page.
  const usesPaymentMethodUrl = Boolean(paymentMethodInfo?.directCancelUrl);
  const directUrl = paymentMethodInfo?.directCancelUrl || subscription.cancelUrl;
  const cancelUrlKind = getCancelUrlKind(subscription.cancelUrl);
  const cancelButtonLabel = usesPaymentMethodUrl
    ? `💳 ${paymentMethodInfo?.label} 정기결제 관리 열기 (새 창)`
    : cancelUrlKind === "direct"
      ? `🚀 ${subscription.name} 해지 페이지 바로가기 (새 창)`
      : `🚀 ${subscription.name} 열기 (새 창)`;

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md max-h-[90vh] overflow-y-auto",
          isRed && "bg-gradient-to-b from-red-50 to-background dark:from-red-950/40",
        )}
      >
        <DialogHeader>
          <DialogTitle>{subscription.name} 이용량 체크인</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="py-4 space-y-6">
            <h3 className="text-base text-center font-medium leading-relaxed">
              지난 30일 동안 <strong className="text-primary">{subscription.name}</strong>을(를)
              <br />몇 번이나 실제로 이용하셨나요?
            </h3>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl text-lg font-bold"
                onClick={() => setCount(Math.max(0, count - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                className="w-24 text-center text-2xl font-black h-12 rounded-xl"
                value={count}
                onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl text-lg font-bold"
                onClick={() => setCount(count + 1)}
              >
                +
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {presets.map((p) => (
                <Button
                  key={p}
                  variant={count === p ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => setCount(p)}
                >
                  {p}회
                </Button>
              ))}
            </div>

            <Button
              className="w-full h-12 font-bold text-base rounded-xl"
              onClick={() => onSubmit(count)}
            >
              가성비 분석 결과 보기
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-5 flex flex-col items-center">
            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black leading-snug">
                {result.shockMessage || "충격적인 결과입니다!"}
              </h3>
              <div className="flex justify-center">
                <RiskBadge level={result.riskLevel} size="lg" />
              </div>
            </div>

            <div className="w-full p-4 bg-muted/70 rounded-2xl border">
              <CostPerUseBar
                costPerUse={result.costPerUse}
                monthlyAmount={getMyMonthlyShareAmount(subscription)}
                currency={subscription.currency}
                usageCount={count}
              />
            </div>

            {/* Smart Cancellation Navigator with Linked Account Info */}
            <div className="w-full p-4 border rounded-2xl bg-card space-y-3 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>🔐 해지 시 로그인 계정 안내</span>
                {subscription.linkedAccountName && (
                  <button
                    onClick={() =>
                      handleCopyId(
                        subscription.linkedAccountName!.split("(")[1]?.replace(")", "") ||
                          subscription.linkedAccountName!,
                      )
                    }
                    className="text-[11px] text-primary underline hover:opacity-80"
                  >
                    {copied ? "복사완료! ✓" : "ID 복사 📋"}
                  </button>
                )}
              </div>

              {subscription.linkedAccountName ? (
                <p className="text-muted-foreground">
                  이 구독은{" "}
                  <strong className="text-foreground">{subscription.linkedAccountName}</strong>{" "}
                  계정으로 등록되어 있습니다. 해당 계정으로 접속하셔야 해지 메뉴가 표시됩니다.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  지정된 연동 계정이 없습니다. 평소 주로 사용하는 계정으로 로그인해 주세요.
                </p>
              )}

              {paymentMethodInfo && (
                <div className="text-[11px] text-muted-foreground bg-secondary/70 p-2.5 rounded-xl">
                  💳 결제 수단:{" "}
                  <strong className="text-foreground">{paymentMethodInfo.label}</strong>
                  {paymentMethodInfo.guide && (
                    <div className="mt-1 opacity-90">{paymentMethodInfo.guide}</div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="w-full flex-col sm:flex-col gap-2 mt-2">
              {directUrl && (
                <Button
                  variant="destructive"
                  className="w-full h-12 text-sm font-bold rounded-xl shadow-lg"
                  onClick={() => window.open(directUrl, "_blank")}
                >
                  {cancelButtonLabel}
                </Button>
              )}
              {onKill && (
                <Button
                  variant="outline"
                  className="w-full text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => {
                    onKill(subscription.id);
                    onClose();
                  }}
                >
                  🔪 해지 가이드 열기
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={onClose}>
                닫기
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
