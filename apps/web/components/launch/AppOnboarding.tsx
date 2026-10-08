"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandWordmark } from "@components/brand/Brand";
import { useStore } from "@lib/store";
import { markWelcomeSeen, queueWelcomePicks } from "@lib/welcome";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";
import {
  AnswerSlide,
  CalculatorSlide,
  FEATURE_IMAGES,
  FeatureSlide,
  ProblemSlide,
} from "./onboarding/IntroSlides";
import { PICKS, TrySlide } from "./onboarding/TrySlide";

/**
 * 앱 첫 실행의 소개. 웹의 첫 화면(`/`)이 내려 읽는 소개라면, 앱은 같은 이야기를 옆으로 넘기는 슬라이드로
 * 한다. 모양은 Claude Design 프로젝트의 'App Onboarding v2.dc.html'을 따른다 — 문제(결제 알림) → 답(가격 말고
 * 1회당 단가로) → 1회 단가 계산기 → 기능 셋 → 직접 해 보기. 마지막 장에서 쓰는 구독을 고르거나 로그인·샘플로
 * 가고, 고르면 다시 띄우지 않는다(`markWelcomeSeen`).
 *
 * 마지막 장에서 고른 서비스는 바로 등록하지 않는다. 넷플릭스처럼 요금제가 여럿인 서비스는 요금을 사용자가
 * 골라야 하고(CLAUDE.md '제1원칙'), 결제일도 모른다. 대시보드로 넘겨 등록 창을 하나씩 연다(`queueWelcomePicks`).
 * 그래서 요금제가 여럿인 서비스는 고르는 칸에 금액을 적지 않는다.
 *
 * 화면 캡처는 웹 소개와 같은 샘플 데이터 캡처(`public/landing/`)이고 그렇게 밝힌다. 첫 장의 결제 알림은
 * 서비스 목록 기준 요금으로 만든 예시다. 움직임(첫 장이 떠오름, 장이 넘기는 만큼 올라옴, 둘째 장에 멈추면
 * 슬래시를 그음)은 움직임 줄이기를 켜면 하지 않는다.
 */

const EASE = "cubic-bezier(.22,1,.36,1)";

/** 문제·답·계산기, 기능 셋, 직접 해 보기. 장 이름은 `landing.onboarding`에서 읽는다. */
const SLIDE_COUNT = 3 + FEATURE_IMAGES.length + 1;
const LAST = SLIDE_COUNT - 1;
/** 슬래시를 긋는 장(앱 아이콘이 있는 '답'). */
const ANSWER = 1;

export function AppOnboarding({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const o = useT().landing.onboarding;
  const [problem, answer, unitCost, tryIt] = o.slideLabels;
  const slideLabels = [problem, answer, unitCost, ...o.features.map((f) => f.kicker), tryIt];
  const startDemo = useStore((state) => state.startDemo);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const busyRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const last = index === LAST;

  const finish = async (after: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    await markWelcomeSeen();
    onDone();
    after();
  };

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(LAST, i));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: reduceMotion() ? "auto" : "smooth",
    });
  };

  // 넘긴 만큼을 지금 장으로 본다. 넘기는 것은 브라우저의 스크롤 스냅이 맡는다. index는 다음 장이 절반 들어오면
  // 바뀌고(점·버튼·진행 줄), settled는 넘김이 끝나 장이 제자리에 섰을 때만 바뀐다(둘째 장의 슬래시).
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = [...track.querySelectorAll<HTMLElement>("[data-slide]")];
    const motion = !reduceMotion();
    let frame = 0;
    // 장마다 들어온 정도를 --enter로 적는다. 끝으로 갈수록 천천히 서도록 ease-out으로 굽힌다.
    const paint = () => {
      frame = 0;
      const width = track.clientWidth;
      if (width === 0) return;
      const position = track.scrollLeft / width;
      slides.forEach((slide, i) => {
        const p = Math.max(0, 1 - Math.abs(position - i));
        slide.style.setProperty("--enter", (1 - (1 - p) ** 2).toFixed(3));
      });
    };
    const onScroll = () => {
      const width = track.clientWidth;
      if (width === 0) return;
      const nearest = Math.round(track.scrollLeft / width);
      setIndex(nearest);
      // 제자리는 장 폭에 대한 비율로 본다. 화면 폭이 소수(392.7px 등)면 clientWidth는 반올림한 값이라, 뒤 장일수록
      // scrollLeft와 '장 번호 × clientWidth'의 차이가 몇 px씩 쌓여 제자리로 보지 못했다. 끝까지 넘겼으면 그것도
      // 제자리다.
      const atEnd = track.scrollLeft >= track.scrollWidth - width - 1;
      if (Math.abs(track.scrollLeft / width - nearest) < 0.01 || atEnd) setSettled(nearest);
      if (motion && !frame) frame = requestAnimationFrame(paint);
    };
    if (motion) paint();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // 첫 장은 소개가 열릴 때 한 번 차례로 떠오른다 — 질문이 먼저, 결제 알림과 합계가 뒤따라 하나씩.
  // 다른 장은 장이 바뀔 때 애니메이션을 다시 틀지 않고 넘기는 위치(--enter)를 따라 떠오른다 — 장이 바뀌는 것은
  // 넘기는 도중(다음 장이 절반 들어온 때)이라, 그때 애니메이션을 틀면 보이던 글이 사라졌다가 다시 떠올랐다.
  useEffect(() => {
    const slide = rootRef.current?.querySelector('[data-slide="0"]');
    if (!slide || reduceMotion()) return;
    const rise = (el: Element, delay: number, from: string) =>
      el.animate(
        [
          { opacity: 0, transform: from },
          { opacity: 1, transform: "none" },
        ],
        { duration: 700, delay, easing: EASE, fill: "backwards" },
      );
    const anims = [
      ...[...slide.querySelectorAll("[data-a]")].map((el, k) =>
        rise(el, 60 + k * 90, "translateY(28px)"),
      ),
      ...[...slide.querySelectorAll("[data-n]")].map((el, k) =>
        rise(el, 380 + k * 340, "translateY(36px) scale(0.95)"),
      ),
    ];
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // 둘째 장의 로고 슬래시는 처음부터 지워 두고, 그 장에 멈춰 섰을 때 한 번 긋는다. 들어오는 도중에 숨기면
  // 보이던 슬래시가 사라졌다가 다시 그어진다. 선의 길이는 1로 재 두었다(BrandAppIcon의 pathLength).
  const slashDrawnRef = useRef(false);
  useEffect(() => {
    const path = slashRef.current;
    if (!path || reduceMotion()) return;
    path.style.strokeDasharray = "1";
    path.style.strokeDashoffset = "1";
  }, []);
  useEffect(() => {
    const path = slashRef.current;
    if (settled !== ANSWER || !path || slashDrawnRef.current || reduceMotion()) return;
    slashDrawnRef.current = true;
    const anim = path.animate([{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
      duration: 650,
      delay: 120,
      easing: EASE,
      fill: "forwards",
    });
    anim.onfinish = () => {
      path.style.strokeDashoffset = "0";
      anim.cancel();
    };
  }, [settled]);

  const togglePick = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const slide = (i: number) => {
    if (i === 0) return <ProblemSlide />;
    if (i === ANSWER) return <AnswerSlide slashRef={slashRef} />;
    if (i === 2) return <CalculatorSlide />;
    if (i === LAST)
      return (
        <TrySlide
          picked={picked}
          onToggle={togglePick}
          onStart={() =>
            void finish(() => {
              // 목록 순서대로 연다(고른 순서와 관계없이).
              queueWelcomePicks(PICKS.filter((p) => picked.includes(p.id)).map((p) => p.id));
              router.push("/dashboard");
            })
          }
          onSample={() =>
            void finish(() => {
              startDemo();
              router.push("/dashboard");
            })
          }
          onLogin={() => void finish(() => router.push("/login"))}
        />
      );
    return <FeatureSlide index={i - 3} />;
  };

  return (
    // 인트로의 검은 판에서 이어지므로 바깥은 검게 두고 소개만 서서히 드러낸다(그 사이 홈이 비치지 않게).
    <div className="fixed inset-0 z-[100] bg-[#09090b]">
      <div
        ref={rootRef}
        className="hero-in relative h-full overflow-hidden bg-background text-foreground break-keep"
        style={{ "--hero-delay": "0ms" } as CSSProperties}
        role="region"
        aria-roledescription="carousel"
        aria-label={o.label}
      >
        <div
          ref={trackRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slideLabels.map((label, i) => (
            <section
              key={i}
              data-slide={i}
              aria-roledescription="slide"
              aria-label={o.slideAria(i + 1, SLIDE_COUNT, label)}
              aria-hidden={i !== index}
              className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              {slide(i)}
            </section>
          ))}
        </div>

        {/* 위: 워드마크와 건너뛰기, 그 아래 몇 장째인지 차오르는 빨간 줄. 건너뛰기는 마지막 장에서 숨긴다. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-background pt-[env(safe-area-inset-top)]">
          <div className="flex h-16 items-center justify-between px-5 pt-2">
            <BrandWordmark className="text-base" />
            <button
              type="button"
              onClick={() => goTo(LAST)}
              tabIndex={last ? -1 : undefined}
              className={cn(
                "px-1 py-3 text-[15px] font-semibold text-muted-foreground transition-opacity duration-300",
                last ? "opacity-0" : "pointer-events-auto",
              )}
            >
              {o.skip}
            </button>
          </div>
          <div
            aria-hidden
            className="h-0.5 bg-red-500 transition-[width] duration-[350ms] ease-out"
            style={{ width: `${((index + 1) / SLIDE_COUNT) * 100}%` }}
          />
        </div>

        {/* 아래: 몇 번째 장인지와 다음. 마지막 장에서는 그 장의 버튼이 대신한다. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 box-content flex h-28 items-center justify-between bg-gradient-to-t from-background from-70% to-transparent px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] transition-[opacity,transform] duration-300",
            last && "pointer-events-none translate-y-5 opacity-0",
          )}
        >
          <div className="flex items-center gap-1.5">
            {slideLabels.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                tabIndex={last ? -1 : undefined}
                aria-label={o.dotAria(i + 1, label)}
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
            {o.next}
            <ArrowRight className="size-[18px]" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
