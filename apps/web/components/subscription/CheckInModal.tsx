"use client";

import React, { useState } from "react";
import {
  Subscription,
  CheckInResponse,
  PAYMENT_METHOD_OPTIONS,
  getCancelUrlKind,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button, WRAPPING_BUTTON } from "../ui/button";
import { Input } from "../ui/input";
import { RiskBadge } from "../dashboard/RiskBadge";
import { CostPerUseBar } from "./CostPerUseBar";
import { UsageMetaphorCard } from "./UsageMetaphorCard";
import { CostEfficiencyGauge } from "./CostEfficiencyGauge";
import { cn } from "@lib/utils";
import { openExternal } from "@lib/native";
import { copyText } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import dynamic from "next/dynamic";

// 앱에서는 체크인 입력을 다른 앱 체크인(등록 직후·첫 체크인 카드)과 같은 단계 막대로 받는다.
// 웹 사용자가 이 코드를 받지 않도록 앱 빌드에서만 불러온다.
const AppUsageCountPicker = IS_APP_BUILD
  ? dynamic(() => import("./app/AppUsageCountPicker").then((m) => m.AppUsageCountPicker), {
      ssr: false,
    })
  : null;

// 앱의 체크인 결과(한 화면에 한 가지 말만). 웹 결과 화면은 그대로 둔다.
const AppCheckInResult = IS_APP_BUILD
  ? dynamic(() => import("./app/AppCheckInResult").then((m) => m.AppCheckInResult), {
      ssr: false,
    })
  : null;

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
  // it is reopened or pointed at a different subscription. 렌더링 중에 맞춘다 — effect로
  // 되돌리면 렌더링이 한 번 더 일어난다.
  const openKey = isOpen ? `${subscription.id}:${initialCount}` : null;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (prevOpenKey !== openKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setCount(initialCount);
      setCopied(false);
    }
  }

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
    ? `${paymentMethodInfo?.label} 정기결제 관리 열기 (새 창)`
    : cancelUrlKind === "direct"
      ? `${subscription.name} 해지 페이지 바로가기 (새 창)`
      : `${subscription.name} 열기 (새 창)`;

  const handleCopyId = async (text: string) => {
    // 복사하지 못했으면 '복사했어요'를 띄우지 않는다. ID는 화면에 그대로 보인다.
    if (!(await copyText(text))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "sm:max-w-md max-h-[90vh] overflow-y-auto",
          // 앱 결과는 상태를 글자와 점으로 말하므로 창 전체를 붉게 칠하지 않는다.
          isRed &&
            !AppCheckInResult &&
            "bg-gradient-to-b from-red-50 to-background dark:from-red-950/40",
        )}
      >
        <DialogHeader>
          <DialogTitle className="[overflow-wrap:anywhere]">
            {subscription.name} 이용량 체크인
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="py-4 space-y-6">
            {AppUsageCountPicker ? (
              <>
                <h3 className="text-center text-base font-bold">최근 30일 동안 몇 번 썼어요?</h3>
                <AppUsageCountPicker
                  subscription={subscription}
                  value={count}
                  onChange={setCount}
                />
              </>
            ) : (
              <>
                <h3 className="text-base text-center font-medium leading-relaxed [overflow-wrap:anywhere]">
                  지난 30일 동안 <strong className="text-primary">{subscription.name}</strong>을(를)
                  <br />몇 번 썼나요?
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
              </>
            )}

            <Button
              className="w-full h-12 font-bold text-base rounded-xl"
              onClick={() => onSubmit(count)}
            >
              가성비 분석 결과 보기
            </Button>
          </div>
        ) : AppCheckInResult ? (
          <AppCheckInResult
            subscription={subscription}
            count={count}
            result={result}
            onCancelGuide={
              onKill
                ? () => {
                    onKill(subscription.id);
                    onClose();
                  }
                : undefined
            }
            fallbackLink={
              directUrl
                ? { label: cancelButtonLabel, open: () => openExternal(directUrl) }
                : undefined
            }
            onClose={onClose}
          />
        ) : (
          <div className="py-4 space-y-5 flex flex-col items-center">
            <div className="text-center space-y-2">
              <h3 className="text-xl sm:text-2xl font-black leading-snug">
                {result.shockMessage || "결과를 확인하세요"}
              </h3>
              <div className="flex justify-center">
                <RiskBadge level={result.riskLevel} size="lg" />
              </div>
            </div>

            {/* 1. 실체감 환산 지표: 커피/영화 티켓 메타포 */}
            <UsageMetaphorCard
              subscription={subscription}
              usageCount={count}
              costPerUse={result.costPerUse}
            />

            {/* 2. 게이미피케이션: 가성비 게이지 (본전선) + 1회당 비용 */}
            <div className="w-full p-4 bg-muted/70 rounded-2xl border space-y-4 flex flex-col items-center">
              <CostEfficiencyGauge
                subscription={subscription}
                usageCount={count}
                costPerUse={result.costPerUse}
              />
              <div className="w-full border-t border-border/50 pt-3">
                <CostPerUseBar
                  costPerUse={result.costPerUse}
                  monthlyAmount={getMyMonthlyShareAmount(subscription)}
                  currency={subscription.currency}
                  usageCount={count}
                />
              </div>
            </div>

            {/* Smart Cancellation Navigator with Linked Account Info */}
            <div className="w-full p-4 border rounded-2xl bg-card space-y-3 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>해지 시 로그인 계정 안내</span>
                {subscription.linkedAccountName && (
                  <button
                    onClick={() =>
                      void handleCopyId(
                        subscription.linkedAccountName!.split("(")[1]?.replace(")", "") ||
                          subscription.linkedAccountName!,
                      )
                    }
                    className="text-[11px] text-primary underline hover:opacity-80"
                  >
                    {copied ? "복사했어요" : "ID 복사"}
                  </button>
                )}
              </div>

              {subscription.linkedAccountName ? (
                <p className="text-muted-foreground [overflow-wrap:anywhere]">
                  이 구독은{" "}
                  <strong className="text-foreground">{subscription.linkedAccountName}</strong>{" "}
                  계정으로 로그인해야 해지 메뉴가 보여요.
                </p>
              ) : (
                <p className="text-muted-foreground">가입한 계정으로 로그인하세요.</p>
              )}

              {paymentMethodInfo && (
                <div className="text-[11px] text-muted-foreground bg-secondary/70 p-2.5 rounded-xl">
                  결제 수단: <strong className="text-foreground">{paymentMethodInfo.label}</strong>
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
                  className={`${WRAPPING_BUTTON} min-h-12 text-sm font-bold rounded-xl shadow-lg`}
                  onClick={() => openExternal(directUrl)}
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
                  해지 가이드 열기
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
