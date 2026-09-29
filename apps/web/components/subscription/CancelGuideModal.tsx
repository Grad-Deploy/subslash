"use client";

import React from "react";
import {
  Subscription,
  PAYMENT_METHOD_OPTIONS,
  bundleCheckLinks,
  getAccountFallbackUrl,
  getCancelUrlKind,
  getServiceHomeUrl,
  parseCancelGuideSteps,
} from "@subslash/shared";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button, WRAPPING_BUTTON } from "../ui/button";
import { openExternal } from "@lib/native";
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
  if (!subscription) return null;

  const sub = subscription;
  const cancelUrlKind = getCancelUrlKind(sub.cancelUrl);
  const homeUrl = getServiceHomeUrl(sub.cancelUrl);
  const accountUrl = getAccountFallbackUrl(sub.cancelUrl);
  const steps = parseCancelGuideSteps(sub.cancelGuide);
  const paymentMethod = PAYMENT_METHOD_OPTIONS.find((p) => p.value === sub.paymentMethod);
  const checkLinks = bundleCheckLinks(sub);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            <span className="min-w-0 [overflow-wrap:anywhere]">{sub.name} 해지 가이드</span>
          </DialogTitle>
          <DialogDescription>링크가 안 열리면 아래 단계를 따라가세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/*
            0. 해지 전에 — 같은 서비스의 더 싼 요금제. 대안이 없으면 이 칸은 없다. 요금제를 바꿨다고
            기록하면 해지할 일이 없어졌으니 창을 닫는다.
          */}
          {sub.status === "active" && (
            <PlanAlternatives subscription={sub} compact onChanged={() => onClose()} />
          )}

          {/* 1. 해지 링크 */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              1단계 · 해지 화면 열기
            </h4>

            {sub.cancelUrl ? (
              <>
                <Button
                  className={`${WRAPPING_BUTTON} min-h-11 font-bold rounded-xl`}
                  onClick={() => openExternal(sub.cancelUrl)}
                >
                  {cancelUrlKind === "direct"
                    ? `${sub.name} 해지 페이지 열기 (새 창)`
                    : `${sub.name} 열기 (새 창)`}
                </Button>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {cancelUrlKind === "direct"
                    ? "해지 화면으로 바로 가요."
                    : cancelUrlKind === "entry"
                      ? "해지 화면이 아니라 첫 화면·계정 화면으로 가요. 아래 단계대로 해지 메뉴를 찾아가세요."
                      : "직접 입력한 주소예요. 어디로 가는지는 확인하지 않았어요."}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground p-3 border border-dashed rounded-xl">
                저장된 해지 링크가 없어요. &lsquo;정보 수정&rsquo;에서 주소를 넣으면 바로가기가
                생겨요.
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
                함께 받는 서비스
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                결합 상품은 위 해지 화면에서 해지해요. 포함된 서비스만 따로 해지할 수 있는지는
                확인하지 못했어요. 해지한 뒤 각 서비스에서 구독이 끝났는지 확인하세요.
              </p>
              <div className="space-y-2">
                {checkLinks.map((link) => (
                  <Button
                    key={link.serviceId}
                    variant="outline"
                    className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                    onClick={() => openExternal(link.url)}
                  >
                    {link.kind === "direct"
                      ? `${link.name} 구독 상태 확인하기`
                      : `${link.name} 열기`}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* 2. 폴백 경로 — 실제로 아는 주소만 */}
          {(accountUrl || homeUrl || paymentMethod?.directCancelUrl) && (
            <section className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                링크가 안 열릴 때
              </h4>
              <div className="space-y-2">
                {paymentMethod?.directCancelUrl && (
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                      onClick={() => openExternal(paymentMethod.directCancelUrl)}
                    >
                      {paymentMethod.label} 정기결제 관리 열기
                    </Button>
                    {paymentMethod.guide && (
                      <p className="text-[11px] text-muted-foreground">{paymentMethod.guide}</p>
                    )}
                  </div>
                )}
                {accountUrl && (
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                      onClick={() => openExternal(accountUrl)}
                    >
                      계정 관리 페이지로 이동 시도
                    </Button>
                    <p className="text-[11px] text-muted-foreground break-all">
                      {accountUrl} — 흔한 주소 형태로 추정한 것이라 없을 수 있어요.
                    </p>
                  </div>
                )}
                {homeUrl && (
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      className={`${WRAPPING_BUTTON} min-h-10 text-sm rounded-xl`}
                      onClick={() => openExternal(homeUrl)}
                    >
                      {new URL(homeUrl).hostname} 첫 화면 열기
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      로그인한 뒤 아래 단계를 따라가세요.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. 단계별 텍스트 안내 */}
          <section className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              2단계 · 해지 메뉴까지 가는 길
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
                저장된 단계 안내가 없어요. &lsquo;정보 수정&rsquo;에 적어 두면 다음에 편해요.
              </p>
            )}
          </section>

          {/*
            4. 완료 처리. 이미 해지한 구독에는 내밀지 않는다 — 한 번 더 누르면
            해지일이 오늘로 바뀌어 쌓인 지킨 돈이 사라지던 자리다.
          */}
          {sub.status === "killed" ? (
            <section className="pt-2 border-t space-y-2">
              <p className="text-[11px] text-muted-foreground">
                이미 해지한 구독으로 기록되어 있어요. 해지가 안 됐다면 구독 상세에서 &lsquo;다시
                구독 중으로 변경&rsquo; 후 다시 기록하세요.
              </p>
              <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
                닫기
              </Button>
            </section>
          ) : (
            <section className="pt-2 border-t space-y-2">
              <p className="text-[11px] text-muted-foreground">
                해지를 마쳤다면 눌러 주세요. 앱은 해지 여부를 직접 확인할 수 없어요.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
                  나중에 하기
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 font-bold rounded-xl"
                  onClick={() => {
                    onConfirmKilled(sub.id);
                    onClose();
                  }}
                >
                  해지 완료했어요
                </Button>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
