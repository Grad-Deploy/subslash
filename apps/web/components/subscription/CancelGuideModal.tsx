"use client";

import React from "react";
import {
  Subscription,
  bundleCheckLinks,
  getAccountFallbackUrl,
  getCancelAndroidApp,
  getCancelRoutes,
  getCancelUrlKind,
  getServiceHomeUrl,
  parseCancelGuideSteps,
} from "@subslash/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button, WRAPPING_BUTTON } from "../ui/button";
import { openExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { useLocale, useT, useServiceNames } from "@lib/i18n";
import { findPaymentMethod } from "@lib/payment-method";
import { ServiceLogo } from "./ServiceLogo";
import { PlanAlternatives } from "./PlanAlternatives";

interface CancelGuideModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  /** 사용자가 실제로 해지를 마쳤다고 알려줄 때. */
  onConfirmKilled: (id: string) => void;
}

/**
 * 해지 가이드 모달.
 *
 * 링크마다 어디로 가는지가 다르기 때문에 버튼 문구를 나눈다. 프리셋에서
 * 확인된 직통 링크만 "해지 페이지"라고 부르고, 첫 화면으로 가는 링크나
 * 사용자가 직접 넣은 주소는 그렇게 부르지 않는다.
 */
export function CancelGuideModal({
  subscription,
  isOpen,
  onClose,
  onConfirmKilled,
}: CancelGuideModalProps) {
  const names = useServiceNames();
  const t = useT().detail;
  const locale = useLocale();
  // 해지 화면(다른 앱·인앱 브라우저)에 다녀온 구독. 돌아오면 창 맨 위에서 마쳤는지 묻는다 — '해지
  // 완료했어요'는 긴 창의 맨 아래라, 돌아와서 그냥 닫으면 해지가 기록되지 않았다.
  const leftFor = React.useRef<string | null>(null);
  const [cameBackFor, setCameBackFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === "visible" && leftFor.current) {
        setCameBackFor(leftFor.current);
      }
    };
    document.addEventListener("visibilitychange", onReturn);
    // Capacitor는 앱이 앞으로 돌아올 때 document에 'resume'도 보낸다.
    document.addEventListener("resume", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      document.removeEventListener("resume", onReturn);
    };
  }, []);

  if (!subscription) return null;

  const close = () => {
    leftFor.current = null;
    setCameBackFor(null);
    onClose();
  };
  const leaveTo = (url: string | undefined, options?: { androidApp?: string }) => {
    leftFor.current = subscription.id;
    openExternal(url, options);
  };
  const askIfDone = isOpen && cameBackFor === subscription.id && subscription.status !== "killed";

  const sub = subscription;
  const cancelUrlKind = getCancelUrlKind(sub.cancelUrl);
  const homeUrl = getServiceHomeUrl(sub.cancelUrl);
  const accountUrl = getAccountFallbackUrl(sub.cancelUrl);
  const steps = parseCancelGuideSteps(sub.cancelGuide);
  const paymentMethod = findPaymentMethod(sub.paymentMethod, locale);
  const routes = getCancelRoutes(sub);
  const checkLinks = bundleCheckLinks(sub);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ServiceLogo
              name={sub.name}
              cancelUrl={sub.cancelUrl}
              fallbackEmoji={sub.iconUrl}
              fallbackColor={sub.iconColor}
              size={20}
            />
            <span className="min-w-0 [overflow-wrap:anywhere]">
              {t.guide.title(names.sub(sub))}
            </span>
          </DialogTitle>
          <DialogDescription>{t.guide.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {askIfDone && (
            <section
              role="status"
              className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold">{t.guide.askTitle}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t.guide.askBody}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setCameBackFor(null)}
                >
                  {t.guide.notYet}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 font-bold rounded-xl"
                  onClick={() => {
                    onConfirmKilled(sub.id);
                    close();
                  }}
                >
                  {t.guide.done}
                </Button>
              </div>
            </section>
          )}

          {/*
            0. 해지 전에 — 같은 서비스의 더 싼 요금제. 대안이 없으면 이 칸은 없다. 요금제를 바꿨다고
            기록하면 해지할 일이 없어졌으니 창을 닫는다.
          */}
          {sub.status === "active" && (
            <PlanAlternatives subscription={sub} compact onChanged={close} />
          )}

          {/* 1. 해지 링크 */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.guide.step1}
            </h4>

            {/*
              결제수단의 정기결제 관리가 먼저다(구글 플레이로 낸 구글 원은 Play에서 끊는다). 해지 화면으로
              바로 가는 링크만 빨갛게 칠한다 — 첫 화면으로 가는 링크가 해지 버튼처럼 보이면 헷갈린다.
            */}
            {routes.length > 0 ? (
              routes.map((route) => (
                <div key={route.source} className="space-y-1">
                  <Button
                    variant={route.kind === "direct" ? "destructive" : "outline"}
                    className={`${WRAPPING_BUTTON} min-h-11 font-bold rounded-xl`}
                    onClick={() =>
                      route.source === "payment"
                        ? leaveTo(route.url)
                        : leaveTo(route.url, { androidApp: getCancelAndroidApp(sub) })
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
                        ? t.link.cancelPageOpen(names.sub(sub))
                        : t.link.open(names.sub(sub))}
                  </Button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {route.source === "payment"
                      ? `${
                          route.kind === "direct"
                            ? t.guide.paymentDirect(paymentMethod?.label ?? "")
                            : t.guide.paymentEntry(paymentMethod?.label ?? "")
                        }${paymentMethod?.guide ? ` ${paymentMethod.guide}` : ""}`
                      : route.kind === "direct"
                        ? t.guide.direct
                        : route.kind === "entry"
                          ? t.guide.entry
                          : t.guide.custom}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl">
                {t.guide.noLinks}
              </p>
            )}
          </section>

          {/*
            결합 상품 — 포함된 서비스마다 끝났는지 볼 곳. 해지 버튼은 두지 않는다: 판매처가 결제해서
            그 서비스 화면에서는 해지되지 않고, 한쪽만 해지하는 경로는 확인하지 못했다.
          */}
          {checkLinks.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t.guide.together}
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t.guide.togetherNote}
              </p>
              <div className="space-y-2">
                {checkLinks.map((link) => (
                  <Button
                    key={link.serviceId}
                    variant="outline"
                    className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                    onClick={() => leaveTo(link.url)}
                  >
                    {link.kind === "direct"
                      ? t.guide.checkStatus(link.name)
                      : t.guide.openService(link.name)}
                  </Button>
                ))}
              </div>
              {/*
                서비스 앱이 자기 화면 기록 안에서 열면(유튜브) 뒤로 가기가 그 앱의 첫 화면으로 간다.
                우리가 바꿀 수 없어 돌아오는 길을 적는다.
              */}
              {IS_APP_BUILD && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t.guide.appBack}
                </p>
              )}
            </section>
          )}

          {/* 2. 폴백 경로 — 실제로 아는 주소만 */}
          {(accountUrl || homeUrl) && (
            <section className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t.guide.fallback}
              </h4>
              <div className="space-y-2">
                {accountUrl && (
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                      onClick={() => leaveTo(accountUrl)}
                    >
                      {t.guide.tryAccount}
                    </Button>
                    <p className="text-[11px] text-muted-foreground break-all">
                      {t.guide.guessed(accountUrl)}
                    </p>
                  </div>
                )}
                {homeUrl && (
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                      onClick={() => leaveTo(homeUrl)}
                    >
                      {t.guide.homeOf(new URL(homeUrl).hostname)}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">{t.guide.homeNote}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. 단계별 텍스트 안내 */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t.guide.step2}
            </h4>
            {steps.length > 0 ? (
              <ol className="space-y-2">
                {steps.map((step, index) => (
                  <li key={`${index}-${step}`} className="flex gap-2.5 text-xs leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <span className="text-foreground/90 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl">
                {t.guide.noSteps}
              </p>
            )}
          </section>

          {/*
            4. 완료 처리. 이미 해지한 구독에는 내밀지 않는다 — 한 번 더 누르면
            해지일이 오늘로 바뀌어 쌓인 지킨 돈이 사라지던 자리다.
          */}
          {sub.status === "killed" ? (
            <section className="pt-2 border-t space-y-2">
              <p className="text-[11px] text-muted-foreground">{t.guide.alreadyKilled}</p>
              <Button variant="outline" className="w-full rounded-xl" onClick={close}>
                {t.guide.close}
              </Button>
            </section>
          ) : (
            <section className="pt-2 border-t space-y-2">
              <p className="text-[11px] text-muted-foreground">{t.guide.doneNote}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={close}>
                  {t.guide.later}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 font-bold rounded-xl"
                  onClick={() => {
                    onConfirmKilled(sub.id);
                    close();
                  }}
                >
                  {t.guide.done}
                </Button>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
