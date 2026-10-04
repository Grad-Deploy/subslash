"use client";

import { useRef, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandWordmark } from "@components/brand/Brand";
import { markOnboardingSeen } from "@lib/onboarding-seen";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";
import { FEATURES, LAST_SLIDE, SLIDE_LABELS } from "./content";
import { FeatureSlide } from "./FeatureSlide";
import { HeroSlide } from "./HeroSlide";
import { StartSlide } from "./StartSlide";
import { useCarousel } from "./useCarousel";
import { slideAttr, useOnboardingMotion } from "./useOnboardingMotion";

/**
 * 앱 첫 실행의 소개. 웹의 첫 화면(`/`)이 내려 읽는 소개라면, 앱은 같은 이야기를 옆으로 넘기는 슬라이드로
 * 한다 — 예전 앱은 곧바로 대시보드로 가서 무엇을 하는 앱인지 알릴 곳이 없었다. 마지막 장에서 내 구독 등록
 * (대시보드)·샘플·로그인 중에 고르고, 고르면 다시 띄우지 않는다(`markOnboardingSeen`).
 *
 * 모양은 Claude Design 프로젝트의 'App Onboarding.dc.html'을 따른다. 이 파일은 장을 늘어놓고 위아래의
 * 막대(건너뛰기, 몇 번째 장, 다음)를 그린다. 장의 내용은 content.ts와 장별 파일에, 넘기기는 useCarousel,
 * 움직임은 useOnboardingMotion에 있다.
 */
export function AppOnboarding({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const startDemo = useStore((state) => state.startDemo);
  const rootRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const busyRef = useRef(false);
  const { trackRef, index, goTo } = useCarousel(LAST_SLIDE);
  useOnboardingMotion({ rootRef, index, slashIndex: LAST_SLIDE, slashRef });
  const last = index === LAST_SLIDE;

  /** 고른 뒤: 다시 띄우지 않게 적고, 소개를 걷고, 고른 곳으로 간다. 두 번 눌러도 한 번만 한다. */
  const finish = async (after: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    await markOnboardingSeen();
    onDone();
    after();
  };

  return (
    // 인트로의 검은 판에서 이어지므로 바깥은 검게 두고 소개만 서서히 드러낸다(그 사이 홈이 비치지 않게).
    <div className="fixed inset-0 z-[100] bg-[#09090b]">
      <div
        ref={rootRef}
        className="hero-in relative h-full overflow-hidden bg-muted text-foreground break-keep"
        style={{ "--hero-delay": "0ms" } as CSSProperties}
        role="region"
        aria-roledescription="carousel"
        aria-label="SubSlash 소개"
      >
        <div
          ref={trackRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SLIDE_LABELS.map((label, i) => (
            <section
              key={label}
              {...slideAttr(i)}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDE_LABELS.length} · ${label}`}
              aria-hidden={i !== index}
              className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              {i === 0 ? (
                <HeroSlide />
              ) : i === LAST_SLIDE ? (
                <StartSlide
                  slashRef={slashRef}
                  onStart={() => void finish(() => router.push("/dashboard"))}
                  onSample={() =>
                    void finish(() => {
                      startDemo();
                      router.push("/dashboard");
                    })
                  }
                  onLogin={() => void finish(() => router.push("/login"))}
                />
              ) : (
                <FeatureSlide feature={FEATURES[i - 1]} />
              )}
            </section>
          ))}
        </div>

        {/* 위: 워드마크와 건너뛰기. 마지막 장에서는 숨긴다. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 box-content flex h-14 items-center justify-between px-5 pt-[env(safe-area-inset-top)] transition-opacity duration-300",
            last && "opacity-0",
          )}
        >
          <BrandWordmark className="text-base" />
          <button
            type="button"
            onClick={() => goTo(LAST_SLIDE)}
            tabIndex={last ? -1 : undefined}
            className={cn(
              "px-1 py-3 text-[15px] font-semibold text-muted-foreground",
              !last && "pointer-events-auto",
            )}
          >
            건너뛰기
          </button>
        </div>

        {/* 아래: 몇 번째 장인지와 다음. 마지막 장에서는 고르는 버튼이 대신한다. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 box-content flex h-28 items-center justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] transition-[opacity,transform] duration-300",
            last && "pointer-events-none translate-y-5 opacity-0",
          )}
        >
          <div className="flex items-center gap-1.5">
            {SLIDE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => goTo(i)}
                tabIndex={last ? -1 : undefined}
                aria-label={`${i + 1}번째 장 · ${label}`}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-foreground" : "w-2 bg-zinc-300 dark:bg-zinc-700",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            tabIndex={last ? -1 : undefined}
            className="flex h-[52px] items-center gap-1.5 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground"
          >
            다음
            <ArrowRight className="size-[18px]" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
