"use client";

import React from "react";
import {
  PAYMENT_METHOD_OPTIONS,
  getCancelAndroidApp,
  getCancelRoutes,
  getCancelUrlKind,
  paymentCancelLabel,
  type Subscription,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { copyText, openExternal } from "@lib/native";
import { Button, WRAPPING_BUTTON } from "../../ui/button";

/** 해지 경로 안내 — 가입한 계정, 결제 수단, 해지하러 갈 곳, 저장해 둔 단계를 한곳에 모은다. */
export function CancelRoutesCard({
  sub,
  onMessage,
  onOpenGuide,
}: {
  sub: Subscription;
  onMessage: (message: string) => void;
  onOpenGuide: () => void;
}) {
  const paymentMethod = PAYMENT_METHOD_OPTIONS.find((p) => p.value === sub.paymentMethod);
  const cancelUrlKind = getCancelUrlKind(sub.cancelUrl);

  const copyAccountId = (accountName: string) => {
    const idOnly = accountName.split("(")[1]?.replace(")", "") || accountName;
    void copyText(idOnly).then((copied) =>
      onMessage(
        copied ? "계정 ID를 복사했어요" : "복사하지 못했어요. 화면의 ID를 직접 선택해 주세요",
      ),
    );
  };

  return (
    <div className="p-6 border-2 border-primary/20 bg-muted/30 rounded-2xl space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">해지 경로 안내</h2>
      </div>

      {/* 가입한 계정 — 정보 수정의 '가입한 계정' 칸에 적은 것 */}
      <div className="p-4 bg-card border rounded-2xl space-y-2 text-xs">
        <div className="font-bold flex items-center justify-between text-foreground">
          <span>가입한 계정</span>
          {sub.linkedAccountName && (
            <button
              onClick={() => copyAccountId(sub.linkedAccountName!)}
              className="text-primary underline hover:opacity-80 font-medium"
            >
              계정 ID 복사
            </button>
          )}
        </div>
        {sub.linkedAccountName ? (
          <p className="text-muted-foreground [overflow-wrap:anywhere]">
            <strong className="text-foreground">{sub.linkedAccountName}</strong> 계정으로 로그인해야
            해지 버튼이 보여요.
          </p>
        ) : (
          <p className="text-muted-foreground">
            가입한 계정으로 로그인하세요. 계정은 &lsquo;정보 수정&rsquo;에서 적을 수 있어요.
          </p>
        )}

        {paymentMethod && (
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground">
            결제 수단: <strong className="text-foreground">{paymentMethod.label}</strong>
            {paymentMethod.guide && (
              <div className="mt-1 text-foreground/80">{paymentMethod.guide}</div>
            )}
          </div>
        )}
      </div>

      {/*
        해지하러 갈 곳 — 결제수단의 정기결제 관리가 먼저다. 해지 화면으로 바로 가는 링크만 빨갛게
        칠한다. 첫 화면으로 가는 링크를 빨갛게 칠하면 그쪽이 해지 버튼처럼 보인다.
      */}
      <div className="space-y-2">
        {getCancelRoutes(sub).map((route) => (
          <div key={route.source} className="space-y-1">
            <Button
              size="lg"
              variant={route.kind === "direct" ? "destructive" : "outline"}
              className={cn(
                WRAPPING_BUTTON,
                "min-h-12 font-bold rounded-xl",
                route.kind === "direct" && "shadow-md",
              )}
              onClick={() =>
                route.source === "payment"
                  ? openExternal(route.url)
                  : openExternal(route.url, { androidApp: getCancelAndroidApp(sub) })
              }
            >
              {route.source === "payment" && paymentMethod
                ? `${paymentCancelLabel(paymentMethod)} (새 창)`
                : cancelUrlKind === "direct"
                  ? `${sub.name} 해지 페이지 바로가기 (새 창)`
                  : `${sub.name} 열기 (새 창)`}
            </Button>
            {route.kind !== "direct" && (
              <p className="text-[11px] text-muted-foreground text-center">
                {route.source === "payment"
                  ? "정기결제 목록이 아니라 첫 화면으로 가요. 위 결제 수단 안내대로 해지 메뉴를 찾아가세요."
                  : route.kind === "entry"
                    ? "해지 화면이 아니라 첫 화면·계정 화면으로 가요. 아래 안내대로 해지 메뉴를 찾아가세요."
                    : "직접 입력한 주소예요. 어디로 가는지는 확인하지 않았어요."}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 가이드 모달 진입점 — 링크가 죽었을 때의 폴백까지 한 화면에 모아준다. */}
      <Button
        variant="outline"
        size="lg"
        className={`${WRAPPING_BUTTON} min-h-11 rounded-xl font-semibold`}
        onClick={onOpenGuide}
      >
        해지 방법 보기
      </Button>

      {sub.cancelGuide && (
        <div className="p-4 bg-background border rounded-xl space-y-2 text-xs">
          <div className="font-bold text-foreground">저장해 둔 해지 단계:</div>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {sub.cancelGuide}
          </p>
        </div>
      )}
    </div>
  );
}
