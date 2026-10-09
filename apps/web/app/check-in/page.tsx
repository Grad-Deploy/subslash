"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter, useSearchParams } from "next/navigation";
import type { CheckInResponse, Subscription } from "@subslash/shared";
import { useStore } from "../../lib/store";
import { useServiceNames, useT } from "../../lib/i18n";
import { CheckInModal } from "../../components/subscription/CheckInModal";
import { CancelGuideModal } from "../../components/subscription/CancelGuideModal";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { CalendarCheck } from "lucide-react";

type Stage = "check-in" | "guide";

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
  const t = useT();
  const names = useServiceNames();

  const subId = searchParams.get("sub");
  const rawCount = Number(searchParams.get("count"));
  const count = Number.isInteger(rawCount) && rawCount >= 0 ? rawCount : null;

  const mounted = useIsClient();
  const [result, setResult] = useState<CheckInResponse | undefined>();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [stage, setStage] = useState<Stage>("check-in");
  const recorded = useRef(false);
  // 두 모달 모두 다음으로 넘어가는 콜백 바로 뒤에 onClose를 부른다. 그 onClose가
  // 대시보드로 떠나 버리면 다음 단계가 열리지 않으므로, 한 번은 건너뛴다.
  const skipNextClose = useRef(false);

  // 메일 링크를 연 순간 한 번 기록하는 곳이라 effect가 맞는 자리다. 기록한 구독과 결과는
  // 저장소에서 다시 끌어낼 수 없어(기록 뒤에는 목록이 바뀐다) 상태로 담는다.
  useEffect(() => {
    if (!mounted || recorded.current || !subId || count === null) return;

    const found = subscriptions.find((sub) => sub.id === subId);
    if (!found) return;

    recorded.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 설명 참고. 한 번만 돈다.
    setSubscription(found);
    // 해지하기 전에 받은 메일의 버튼일 수 있다. 해지한 구독에는 체크인을 남기지
    // 않고, 해지 가이드를 다시 열어 해지일을 덮어쓰지도 않는다.
    if (found.status === "killed") return;
    try {
      // 메일의 버튼은 'N회'로 묻는다. 음악(시간)처럼 다른 것을 재는 구독이어도 횟수로 적는다 —
      // 3회를 3시간으로 읽으면 사용자가 답하지 않은 숫자가 된다.
      setResult(checkIn(found.id, count, { metric: "uses" }));
    } catch (error) {
      console.error("Failed to record check-in from email link:", error);
    }
  }, [mounted, subId, count, subscriptions, checkIn]);

  const l = t.checkin.link;

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!subId || count === null) {
    return <Fallback title={l.invalidTitle} body={l.invalidBody} />;
  }

  if (!subscription) {
    return <Fallback title={l.missingTitle} body={l.missingBody} />;
  }

  if (subscription.status === "killed") {
    return <Fallback title={l.killedTitle} body={l.killedBody(names.sub(subscription))} />;
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
        화면과 같이 가이드에서 '해지 완료했어요'를 눌러야 기록된다.
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
        onConfirmKilled={() => {
          // 가이드에서 '해지 완료했어요'를 누른 것이 곧 확인이다 — 예전에는 확인 창을 한 번 더 띄웠다.
          killSubscription(subscription.id);
          skipNextClose.current = true;
          router.replace("/savings");
        }}
      />
    </>
  );
}

function Fallback({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  const t = useT();
  return (
    <div className="text-center py-20 space-y-4">
      <CalendarCheck className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-black tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{body}</p>
      <Button onClick={() => router.push("/dashboard")}>{t.checkin.link.dashboard}</Button>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-8" />
        </div>
      }
    >
      <CheckInReceiver />
    </Suspense>
  );
}
