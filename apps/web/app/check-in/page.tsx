"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CheckInResponse, Subscription } from "@subslash/shared";
import { useStore } from "../../lib/store";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { Button } from "../../components/ui/button";

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
  const recorded = useRef(false);

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

  return (
    <CheckInModal
      subscription={subscription}
      isOpen
      onClose={() => router.replace("/dashboard")}
      onSubmit={(next) => setResult(checkIn(subscription.id, next))}
      onKill={(id) => killSubscription(id)}
      result={result}
      initialCount={count}
    />
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
