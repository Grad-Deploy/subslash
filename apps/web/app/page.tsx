"use client";

import React, { useEffect } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import { IS_APP_BUILD } from "@lib/platform";
import {
  LandingCalculator,
  LandingDuo,
  LandingFinalCta,
  LandingOpening,
  LandingPrivacy,
  LandingSavings,
  LandingShowcase,
} from "../components/home/Landing";

/**
 * 웹의 첫 화면은 내려 읽는 소개 페이지다. 어떤 서비스인지만 알리고, 등록·체크인처럼 실제로 쓰는 일은
 * 대시보드로 넘긴다 — 예전에는 이 화면에서 등록 창을 열어, 소개와 쓰는 곳이 섞였다.
 * 모양은 Claude Design의 'Subslash 랜딩 페이지 재설계'(Landing v2.dc.html)를 따른다.
 */
export default function Home() {
  const router = useRouter();
  const { subscriptions, startDemo } = useStore();
  const mounted = useIsClient();
  // 구독 중인 것만 센다. 하이드레이션 전에는 저장소를 모르므로 처음 온 사람으로 그린다.
  const activeCount = mounted ? subscriptions.filter((sub) => sub.status === "active").length : 0;

  // 앱의 첫 화면은 대시보드다. 앱을 켜면 이 페이지(index.html)부터 열리지만, 실행 화면(인트로·짧은
  // 로고)이 가린 사이에 대시보드로 옮긴다. 소개용 홈은 웹에서만 쓴다.
  useEffect(() => {
    if (IS_APP_BUILD) router.replace("/dashboard");
  }, [router]);

  // 샘플은 내 구독에 더하지 않고 잠시 동안만 보여준다(store의 DemoSession).
  const handleLoadDemo = () => {
    startDemo();
    router.push("/dashboard");
  };

  return (
    // 큰 글씨가 많은 소개라 낱말 중간에서 줄이 바뀌면 눈에 띈다("가 / 입 없이") — 낱말 단위로 넘긴다.
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center break-keep">
      {/* 읽은 만큼 차오르는 빨간 줄. 스크롤 애니메이션을 모르는 브라우저에서는 그리지 않는다. */}
      <div aria-hidden className="landing-progress" />

      <LandingOpening activeCount={activeCount} onDemo={handleLoadDemo} />
      <LandingCalculator />
      <LandingShowcase />
      <LandingDuo />
      <LandingSavings />
      <LandingPrivacy />
      <LandingFinalCta />
    </div>
  );
}
