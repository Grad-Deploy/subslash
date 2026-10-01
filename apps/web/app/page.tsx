"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import { useStore } from "../lib/store";
import { IS_APP_BUILD } from "@lib/platform";
import { UnitCostCalculator } from "../components/home/UnitCostCalculator";
import {
  AppDownloadPending,
  LandingFeatures,
  LandingFinalCta,
  LandingHowItWorks,
  LandingPlatforms,
  LandingTrust,
} from "../components/home/Landing";

/** 첫 칸의 요소가 차례로 떠오르게 하는 지연(globals.css의 `hero-in`). */
const heroDelay = (i: number) => ({ "--hero-delay": `${80 + i * 110}ms` }) as React.CSSProperties;

/**
 * 웹의 첫 화면은 내려 읽는 소개 페이지다. 어떤 서비스인지, 웹과 앱 어디서 쓰는지만 알리고, 등록·체크인처럼
 * 실제로 쓰는 일은 대시보드로 넘긴다 — 예전에는 이 화면에서 등록 창을 열어, 소개와 쓰는 곳이 섞였다.
 * 모양은 Claude Design의 'Subslash 랜딩 페이지 재설계'(Landing.dc.html)를 따른다.
 */
export default function Home() {
  const router = useRouter();
  const { subscriptions, startDemo } = useStore();
  const mounted = useIsClient();
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;

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

  // 구독 중인 것만 센다. 해지한 것까지 세어 "N개"라고 하면 대시보드에는 하나도 없을 수 있다.
  const returning = mounted && activeCount > 0;

  return (
    // 큰 글씨가 많은 소개라 낱말 중간에서 줄이 바뀌면 눈에 띈다("가 / 입 없이") — 낱말 단위로 넘긴다.
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center break-keep">
      {/* 읽은 만큼 차오르는 빨간 줄. 스크롤 애니메이션을 모르는 브라우저에서는 그리지 않는다. */}
      <div aria-hidden className="landing-progress" />

      <section
        id="top"
        className="grid min-h-[calc(100svh-8rem)] w-full grid-cols-1 items-center gap-[clamp(2.5rem,5vw,4.5rem)] py-[clamp(2rem,7vh,5rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
        aria-labelledby="hero"
      >
        <div>
          <span
            className="hero-in inline-block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm text-muted-foreground"
            style={heroDelay(0)}
          >
            구독 디톡스
          </span>
          <h1
            id="hero"
            className="hero-in mt-6 text-[clamp(2.75rem,5.4vw,4.25rem)] leading-[1.12] font-black tracking-[-0.045em]"
            style={heroDelay(1)}
          >
            그 구독,
            <br />한 달에{" "}
            <span className="relative isolate inline-block whitespace-nowrap">
              몇 번{/* 워드마크의 슬래시처럼 기울인 빨간 막대가 '몇 번' 아래를 긋는다. */}
              <span
                aria-hidden
                className="hero-slash absolute right-[-0.04em] bottom-[0.06em] left-[-0.04em] -z-10 h-[0.16em] origin-left -skew-x-[14deg] rounded-[0.02em] bg-red-500"
              />
            </span>{" "}
            써요?
          </h1>
          <p
            className="hero-in mt-6 max-w-[480px] text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-[1.65] text-pretty text-muted-foreground"
            style={heroDelay(2)}
          >
            가격 말고 1회당 단가로 판단하세요. 횟수를 움직여 1회당 얼마인지 보세요.
          </p>

          <div className="hero-in mt-9 flex flex-wrap gap-2.5" style={heroDelay(3)}>
            <Link
              href="/dashboard"
              className="w-full whitespace-nowrap rounded-[0.625rem] bg-primary px-6 py-4 text-center text-base font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 motion-reduce:hover:translate-y-0 sm:w-auto"
            >
              {returning ? `구독 중 ${activeCount}개 · 대시보드로 →` : "웹에서 바로 시작하기 →"}
            </Link>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="w-full whitespace-nowrap rounded-[0.625rem] border bg-card px-6 py-4 text-base font-semibold transition hover:-translate-y-0.5 hover:bg-muted motion-reduce:hover:translate-y-0 sm:w-auto"
            >
              샘플로 둘러보기
            </button>
          </div>
          <p className="hero-in mt-4 text-sm text-muted-foreground" style={heroDelay(4)}>
            가입 없이 이 브라우저에 저장돼요.
          </p>
          <AppDownloadPending className="hero-in mt-4 px-3.5 py-2 text-[13px]" />
        </div>

        <div className="hero-in" style={heroDelay(2)}>
          <UnitCostCalculator />
        </div>
      </section>

      <LandingHowItWorks />
      <LandingFeatures />
      <LandingPlatforms />
      <LandingTrust />
      <div className="w-full pb-[clamp(2rem,6vh,4rem)]">
        <LandingFinalCta />
      </div>
    </div>
  );
}
