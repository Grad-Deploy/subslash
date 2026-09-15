"use client";

import React, { useEffect } from "react";
import { DEMO_DURATION_MS, isDemoExpired, useStore } from "@lib/store";
import { Button } from "../ui/button";

/** 체험 시간이 지났는지 다시 보는 간격. */
const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * 샘플 체험 중임을 모든 화면 위에 알린다.
 *
 * 체험 중에는 대시보드와 내 구독이 샘플만 보여준다. 그 사실을 모르면 내 구독이 사라진 것처럼
 * 보이므로, 무엇을 보고 있는지와 끝내는 방법을 늘 보인다. 정해진 시간이 지나면 스스로 끝낸다 —
 * 탭을 켜 둔 채 잊어도 샘플이 내 구독 자리를 계속 차지하지 않는다.
 */
export function DemoBanner() {
  const demo = useStore((state) => state.demo);
  const endDemo = useStore((state) => state.endDemo);

  useEffect(() => {
    if (!demo) return;
    const endIfExpired = () => {
      if (isDemoExpired(demo)) endDemo();
    };
    endIfExpired();
    const timer = setInterval(endIfExpired, CHECK_INTERVAL_MS);
    // 잠든 탭에서는 타이머가 늦게 돈다. 돌아왔을 때 바로 한 번 더 본다.
    document.addEventListener("visibilitychange", endIfExpired);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", endIfExpired);
    };
  }, [demo, endDemo]);

  if (!demo) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
    >
      <div className="container mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-relaxed break-keep">
          ✨ <strong>샘플로 체험하는 중입니다.</strong> 지금 보이는 구독은 예시이고 내 구독과 섞이지
          않습니다. 여기서 바꾼 내용은 저장되지 않고, 새로고침하거나 {DEMO_DURATION_MS / 60_000}분이
          지나면 체험이 끝납니다.
        </p>
        <Button size="sm" variant="outline" className="shrink-0 bg-background" onClick={endDemo}>
          체험 끝내기
        </Button>
      </div>
    </div>
  );
}
