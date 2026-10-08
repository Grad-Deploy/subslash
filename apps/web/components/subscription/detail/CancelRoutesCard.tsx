"use client";

import React from "react";
import {
  PAYMENT_METHOD_OPTIONS,
  getCancelAndroidApp,
  getCancelRoutes,
  getCancelUrlKind,
  type Subscription,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { copyText, openExternal } from "@lib/native";
import { useT, useServiceNames } from "@lib/i18n";
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
  const names = useServiceNames();
  const t = useT().detail;
  const paymentMethod = PAYMENT_METHOD_OPTIONS.find((p) => p.value === sub.paymentMethod);
  const cancelUrlKind = getCancelUrlKind(sub.cancelUrl);

  const copyAccountId = (accountName: string) => {
    const idOnly = accountName.split("(")[1]?.replace(")", "") || accountName;
    void copyText(idOnly).then((copied) =>
      onMessage(copied ? t.routes.idCopied : t.routes.copyFailed),
    );
  };

  return (
    <div className="p-6 border-2 border-primary/20 bg-muted/30 rounded-2xl space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{t.routes.title}</h2>
      </div>

      {/* 가입한 계정 — 정보 수정의 '가입한 계정' 칸에 적은 것 */}
      <div className="p-4 bg-card border rounded-2xl space-y-2 text-xs">
        <div className="font-bold flex items-center justify-between text-foreground">
          <span>{t.routes.account}</span>
          {sub.linkedAccountName && (
            <button
              onClick={() => copyAccountId(sub.linkedAccountName!)}
              className="text-primary underline hover:opacity-80 font-medium"
            >
              {t.routes.copyId}
            </button>
          )}
        </div>
        {sub.linkedAccountName ? (
          <p className="text-muted-foreground [overflow-wrap:anywhere]">
            <strong className="text-foreground">{sub.linkedAccountName}</strong>
            {t.routes.loginWith}
          </p>
        ) : (
          <p className="text-muted-foreground">{t.routes.loginAny}</p>
        )}

        {paymentMethod && (
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground">
            {t.routes.paymentMethod}
            <strong className="text-foreground">{paymentMethod.label}</strong>
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
                ? t.link.newWindow(
                    t.link.paymentManage(
                      paymentMethod.shortName ?? paymentMethod.label,
                      paymentMethod.directCancelUrlKind === "direct",
                    ),
                  )
                : cancelUrlKind === "direct"
                  ? t.link.cancelPage(names.sub(sub))
                  : t.link.open(names.sub(sub))}
            </Button>
            {route.kind !== "direct" && (
              <p className="text-[11px] text-muted-foreground text-center">
                {route.source === "payment"
                  ? t.routes.paymentEntry
                  : route.kind === "entry"
                    ? t.routes.entry
                    : t.routes.custom}
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
        {t.routes.openGuide}
      </Button>

      {sub.cancelGuide && (
        <div className="p-4 bg-background border rounded-xl space-y-2 text-xs">
          <div className="font-bold text-foreground">{t.routes.savedSteps}</div>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {sub.cancelGuide}
          </p>
        </div>
      )}
    </div>
  );
}
