"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CheckInResponse, Subscription } from "@subslash/shared";
import { useStore } from "../../lib/store";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { CancelGuideModal } from "../../components/subscription/CancelGuideModal";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { Button } from "../../components/ui/button";

type Stage = "check-in" | "guide" | "confirm";

/**
 * Target of the one-tap buttons in the reminder email.
 *
 * The mirror on the server holds no check-in history, so this records the
 * answer straight into localStorage on the device that opens the link — no
 * round-trip, no token. Opening it on another device simply finds nothing.
 */
function CheckInReceiver() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscriptions, checkIn, killSubscription } = useStore();

  const subId = searchParams.get("sub");
  const rawCount = Number(searchParams.get("count"));
  const count = Number.isInteger(rawCount) && rawCount >= 0 ? rawCount : null;

  const [mounted, setMounted] = useState(false);
  const [result, setResult] = useState<CheckInResponse | undefined>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stage, setStage] = useState<Stage>("check-in");
  const recorded = useRef(false);
  // 세 모달 모두 다음으로 넘어가는 콜백 바로 뒤에 onClose를 부른다. 그 onClose가
  // 대시보드로 떠나 버리면 다음 단계가 열리지 않으므로, 한 번은 건너뛴다.
  const skipNextClose = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || recorded.current || !subId || count === null) return;

    const found = subscriptions.find((sub) => sub.id === subId);
    if (!found) return;

    recorded.current = true;
    setSubscription(found);
    try {
      setResult(checkIn(found.id, count));
    } catch (error) {
      console.error("Failed to record check-in from email link:", error);
    }
  }, [mounted, subId, count, subscriptions, checkIn]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin text-3xl">✂️</div>
      </div>
    );
  }

  if (!subId || count === null) {
    return (
      <Fallback
        title="잘못된 체크인 링크입니다"
        body="이메일의 버튼을 다시 눌러보시거나, 대시보드에서 직접 체크인해주세요."
      />
    );
  }

  if (!subscription) {
    return (
      <Fallback
        title="이 기기에서 해당 구독을 찾을 수 없습니다"
        body="구독 정보는 기기의 브라우저에만 저장됩니다. 구독을 등록한 기기·브라우저에서 링크를 열어주세요."
      />
    );
  }

  const goTo = (next: Stage) => {
    skipNextClose.current = true;
    setStage(next);
  };

  const leave = () => {
    if (skipNextClose.current) {
      skipNextClose.current = false;
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <>
      {/*
        '해지 가이드 열기'는 가이드를 연다. 예전에는 여기서 곧바로 해지 완료로
        기록해서, 서비스에서 실제로 해지하기도 전에 방어액이 쌓였다. 다른
        화면과 같이 가이드 → '해지 완료했어요' → 확인을 거쳐야 기록된다.
      */}
      <CheckInModal
        subscription={subscription}
        isOpen={stage === "check-in"}
        onClose={() => leave()}
        onSubmit={(next) => setResult(checkIn(subscription.id, next))}
        onKill={() => goTo("guide")}
        result={result}
        initialCount={count}
      />
      <CancelGuideModal
        subscription={subscription}
        isOpen={stage === "guide"}
        onClose={() => leave()}
        onConfirmKilled={() => goTo("confirm")}
      />
      <ConfirmDialog
        isOpen={stage === "confirm"}
        onClose={() => leave()}
        onConfirm={() => {
          killSubscription(subscription.id);
          skipNextClose.current = true;
          router.replace("/savings");
        }}
        title="구독 해지 완료 처리"
        description={`'${subscription.name}' 구독을 해지(방어) 완료 상태로 전환하시겠습니까?\n방어 성공 자산으로 기록되며 대시보드와 절약 현황에 반영됩니다.`}
        confirmText="해지 완료"
        cancelText="취소"
        variant="destructive"
      />
    </>
  );
}

function Fallback({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return (
    <div className="text-center py-20 space-y-4">
      <div className="text-4xl">📭</div>
      <h1 className="text-xl font-black tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{body}</p>
      <Button onClick={() => router.push("/dashboard")}>대시보드로 가기 →</Button>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin text-3xl">✂️</div>
        </div>
      }
    >
      <CheckInReceiver />
    </Suspense>
  );
}
