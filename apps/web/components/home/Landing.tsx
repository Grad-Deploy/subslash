"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Globe,
  HardDrive,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@lib/utils";
import { prefersReducedMotion } from "@lib/motion";

/**
 * 첫 화면(소개)의 칸들. 내려 읽으며 무엇을 하는 서비스인지, 어디서 쓰는지만 알리고, 쓰는 것은 대시보드로
 * 넘긴다. 모양은 Claude Design의 'Subslash 랜딩 페이지 재설계'(Landing.dc.html)를 따른다.
 *
 * 문장은 앱이 실제로 하는 일만 적는다(CLAUDE.md '제1원칙'). 화면 캡처는 샘플 데이터로 찍은 앱 화면이고,
 * 그렇게 밝혀 둔다. 앱은 아직 비공개 테스트라 받을 곳이 없으므로 '준비 중'으로 두고 링크를 만들지 않는다 —
 * 받을 수 없는 스토어 주소를 걸면 눌러 본 사람이 막힌다.
 *
 * `scroll-reveal`(globals.css)은 화면에 들어올 때 떠오르게 한다. 브라우저가 스크롤 애니메이션을 모르거나
 * 사용자가 움직임 줄이기를 켰으면 처음부터 보인다 — 글이 숨은 채로 남지 않게 JS 없이 CSS만 쓴다.
 */

const sectionTitle = "text-[clamp(2rem,4.4vw,3.5rem)] font-black tracking-[-0.04em]";

const HOW_IT_WORKS = [
  { title: "구독 고르기", body: "요금·해지 방법이 채워져요." },
  { title: "한 달 사용 횟수 체크", body: "1회당 얼마인지 나와요." },
  { title: "안 쓰면 해지", body: "해지 경로를 알려 드려요." },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      id="how"
      className="w-full scroll-mt-20 rounded-[2rem] bg-muted px-5 py-[clamp(4rem,10vh,7rem)] sm:px-10"
      aria-labelledby="how-title"
    >
      <h2 id="how-title" className={cn("scroll-reveal", sectionTitle)}>
        이렇게 써요
      </h2>
      <ol className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, i) => (
          <li
            key={step.title}
            className="scroll-reveal flex flex-col gap-10 rounded-3xl border bg-card px-7 py-8 sm:gap-14"
          >
            <span
              className={cn(
                "grid size-13 place-items-center rounded-full text-xl font-extrabold",
                // 마지막 단계(해지)만 브랜드의 빨간 슬래시 색으로 둔다.
                i === HOW_IT_WORKS.length - 1
                  ? "bg-red-500 text-white"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {i + 1}
            </span>
            <div>
              <h3 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-[1.625rem]">
                {step.title}
              </h3>
              <p className="mt-2.5 text-base text-muted-foreground sm:text-[17px]">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const FEATURES = [
  {
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
    title: "결정할 구독만 골라 보여 줘요",
    body: "결제일이 다가오는데 잘 쓰지 않는 구독을 맨 위에 모아요. 1회당 얼마인지, 결제 전에 끊으면 얼마를 아끼는지 함께 보여요.",
  },
  {
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
    title: "해지하는 곳까지 데려다줘요",
    body: "서비스마다 해지 화면 링크와 메뉴 경로를 정리해 뒀어요. 해지는 각 서비스에서 하고, 마치면 '해지 완료'로 기록해요.",
  },
  {
    image: "/landing/gmail-import.png",
    alt: "결제 메일 가져오기 화면",
    title: "결제 메일로 구독을 찾아요",
    body: "Gmail 결제 메일이나 결제 문자에서 구독을 찾아 등록 후보로 모아요. 메일 제목과 본문은 저장하지 않아요.",
  },
  {
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
    title: "해지로 지킨 돈이 쌓여요",
    body: "해지한 뒤 결제일이 지나고 결제가 없었다고 확인한 금액만 '지킨 돈'으로 세요. 확인하지 않은 돈은 부풀리지 않아요.",
  },
] as const;

const featureNumber = (i: number) => String(i + 1).padStart(2, "0");

/** 앱 화면 캡처를 담는 폰 테두리. */
function PhoneFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[3.25rem] bg-zinc-950 p-2.5 shadow-[0_50px_100px_-40px_rgba(9,9,11,0.45)] ring-1 ring-transparent dark:ring-zinc-700",
        className,
      )}
    >
      <div className="relative aspect-[1080/1920] overflow-hidden rounded-[2.625rem] bg-card">
        {children}
      </div>
    </div>
  );
}

/**
 * 할 수 있는 것. 넓은 화면에서는 글이 지나가는 동안 폰 화면이 한자리에 머물며 지금 읽는 기능의 화면으로
 * 바뀌고, 좁은 화면에서는 화면과 글을 차례로 쌓는다.
 */
export function LandingFeatures() {
  const [active, setActive] = useState(0);
  const blocksRef = useRef<(HTMLDivElement | null)[]>([]);

  // 화면 가운데에 가장 가까운 글을 지금 기능으로 본다.
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Infinity;
      blocksRef.current.forEach((el, i) => {
        if (!el || el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - mid);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = blocksRef.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const reduce = prefersReducedMotion();
    window.scrollTo({
      top: top - window.innerHeight / 2 + el.offsetHeight / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  return (
    <section
      id="features"
      className="w-full scroll-mt-20 pt-[clamp(5rem,12vh,8.75rem)]"
      aria-labelledby="features-title"
    >
      <h2 id="features-title" className={cn("scroll-reveal", sectionTitle)}>
        SubSlash로 할 수 있는 것
      </h2>

      {/* 넓은 화면: 글은 지나가고 폰 화면은 머문다. */}
      <div className="hidden grid-cols-2 gap-16 lg:grid">
        <div>
          {FEATURES.map((feature, i) => (
            <div
              key={feature.image}
              ref={(el) => {
                blocksRef.current[i] = el;
              }}
              className={cn(
                "flex min-h-[78vh] flex-col justify-center transition-opacity duration-500",
                i === active ? "opacity-100" : "opacity-[0.22]",
              )}
            >
              <span className="text-[15px] font-bold tabular-nums text-red-500">
                {featureNumber(i)}
              </span>
              <h3 className="mt-3.5 text-[clamp(2rem,3.6vw,3rem)] leading-tight font-black tracking-[-0.04em]">
                {feature.title}
              </h3>
              <p className="mt-5 max-w-[460px] text-[19px] leading-[1.7] text-muted-foreground">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
        <div>
          <div className="sticky top-[calc(50vh-20rem)] flex h-[40rem] items-center justify-center gap-7">
            <PhoneFrame className="w-80">
              {FEATURES.map((feature, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={feature.image}
                  src={feature.image}
                  alt={i === active ? feature.alt : ""}
                  aria-hidden={i !== active}
                  width={1080}
                  height={1920}
                  className={cn(
                    "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-[cubic-bezier(.2,.7,.2,1)]",
                    i === active
                      ? "scale-100 opacity-100"
                      : i < active
                        ? "scale-[1.04] opacity-0"
                        : "scale-[0.96] opacity-0",
                  )}
                />
              ))}
            </PhoneFrame>
            <div className="flex flex-col gap-2">
              {FEATURES.map((feature, i) => (
                <button
                  key={feature.image}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={feature.title}
                  aria-current={i === active ? "step" : undefined}
                  className={cn(
                    "w-1 rounded-full transition-all duration-300",
                    i === active ? "h-10 bg-foreground" : "h-4 bg-border hover:bg-muted-foreground",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 좁은 화면: 화면과 글을 차례로 쌓는다. */}
      <div className="mt-16 flex flex-col gap-24 lg:hidden">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.image}
            className={cn(
              "scroll-reveal flex flex-col items-center gap-10 md:flex-row md:gap-16",
              i % 2 === 1 && "md:flex-row-reverse",
            )}
          >
            <PhoneFrame className="w-[clamp(13.75rem,28vw,18.75rem)] shrink-0 p-2">
              {/*
                앱 화면 캡처(1080×1920). 앱 빌드는 정적 내보내기라 next/image의 최적화를 쓸 수 없다
                (ServiceLogo와 같다).
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.image}
                alt={feature.alt}
                width={1080}
                height={1920}
                loading="lazy"
                className="size-full object-cover"
              />
            </PhoneFrame>
            <div className="max-w-[480px]">
              <span className="text-[15px] font-bold text-red-500">{featureNumber(i)}</span>
              <h3 className="mt-3 text-[clamp(1.75rem,3.4vw,2.75rem)] leading-tight font-black tracking-[-0.04em]">
                {feature.title}
              </h3>
              <p className="mt-4 text-lg leading-[1.7] text-muted-foreground">{feature.body}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="pt-12 text-center text-[13px] text-muted-foreground">
        화면은 샘플 데이터로 찍은 앱 화면이에요. 지금 화면과 조금 다를 수 있어요.
      </p>
    </section>
  );
}

const cardClass =
  "rounded-3xl border bg-card px-7 py-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(9,9,11,0.18)] motion-reduce:hover:translate-y-0";

const PLATFORMS: ReadonlyArray<{
  Icon: LucideIcon;
  title: string;
  body: string;
  pending?: boolean;
}> = [
  {
    Icon: Globe,
    title: "웹",
    body: "PC·아이폰·안드로이드 어느 브라우저에서나 가입 없이 바로 써요. 기록은 그 브라우저에 저장돼요.",
  },
  {
    Icon: Smartphone,
    title: "안드로이드 앱",
    body: "결제일 알림을 폰에서 받고, 허락하면 폰 사용 기록으로 한 달에 몇 번 썼는지 채워요.",
    pending: true,
  },
  {
    Icon: RefreshCw,
    title: "로그인하면 이어져요",
    body: "로그인은 선택이에요. 로그인하면 웹과 앱, 여러 기기의 구독 기록이 같은 계정으로 맞춰져요.",
  },
];

export function LandingPlatforms() {
  return (
    <section
      id="platforms"
      className="w-full scroll-mt-20 pt-[clamp(6rem,14vh,10rem)]"
      aria-labelledby="platforms-title"
    >
      <h2 id="platforms-title" className={cn("scroll-reveal", sectionTitle)}>
        웹에서도, 폰에서도
      </h2>
      <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLATFORMS.map(({ Icon, title, body, pending }) => (
          <li key={title} className={cn("scroll-reveal", cardClass)}>
            <Icon className="size-8 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <h3 className="text-[22px] font-extrabold tracking-[-0.03em]">{title}</h3>
              {pending && (
                <span className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">
                  준비 중
                </span>
              )}
            </div>
            <p className="mt-2.5 text-base leading-[1.7] text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const TRUST = [
  {
    Icon: HardDrive,
    title: "기록은 기본으로 이 기기에",
    body: "가입하지 않아도 쓸 수 있고, 구독 기록은 이 브라우저나 휴대폰 안에만 저장돼요.",
  },
  {
    Icon: MailCheck,
    title: "메일 본문은 저장하지 않아요",
    body: "결제 메일에서는 서비스·금액·결제일 같은 구독 후보만 남겨요.",
  },
  {
    Icon: ShieldCheck,
    title: "광고가 없어요",
    body: "구독 기록을 광고에 쓰거나 다른 회사에 넘기지 않아요.",
  },
] as const;

export function LandingTrust() {
  return (
    <section
      id="trust"
      className="w-full scroll-mt-20 py-[clamp(6rem,14vh,10rem)]"
      aria-labelledby="trust-title"
    >
      <h2 id="trust-title" className={cn("scroll-reveal", sectionTitle)}>
        안심하고 쓰세요
      </h2>
      <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {TRUST.map(({ Icon, title, body }) => (
          <li key={title} className={cn("scroll-reveal", cardClass)}>
            <Icon className="size-8 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <h3 className="mt-7 text-[22px] font-extrabold tracking-[-0.03em]">{title}</h3>
            <p className="mt-2.5 text-base leading-[1.7] text-muted-foreground">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[15px] text-muted-foreground">
        자세한 내용은{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          개인정보처리방침
        </Link>
        과{" "}
        <Link href="/help" className="underline underline-offset-4 hover:text-foreground">
          도움말
        </Link>
        에 있어요.
      </p>
    </section>
  );
}

/** 앱 받기 자리. 공개 출시 전에는 누를 수 없는 '준비 중' 표시로 둔다. */
export function AppDownloadPending({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-2.5 text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      <Smartphone className="size-4" aria-hidden />
      안드로이드 앱 · Google Play 준비 중
    </span>
  );
}

export function LandingFinalCta() {
  return (
    <section
      // 테마와 관계없이 어두운 칸이다. 다크 모드에서는 배경과 구분되게 카드 색과 테두리를 쓴다.
      className="scroll-reveal relative w-full overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-[clamp(4rem,10vw,8rem)] text-center text-zinc-50 dark:bg-card dark:ring-1 dark:ring-border"
      aria-labelledby="final-cta"
    >
      <svg
        viewBox="0 0 400 400"
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-[22.5rem] opacity-90"
      >
        <path
          className="cta-slash"
          d="M40 360 L360 40"
          pathLength={1}
          stroke="#ef4444"
          strokeWidth={44}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <h2
        id="final-cta"
        className="relative text-[clamp(2.25rem,5.4vw,4.5rem)] leading-[1.15] font-black tracking-[-0.045em]"
      >
        이번 달 구독,
        <br />
        지금 점검해 보세요
      </h2>
      <p className="relative mt-6 text-lg text-zinc-400">가입 없이 웹에서 바로 쓸 수 있어요.</p>
      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="whitespace-nowrap rounded-[0.625rem] bg-zinc-50 px-7 py-4 text-base font-semibold text-zinc-900 transition hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        >
          웹에서 바로 시작하기 →
        </Link>
        <AppDownloadPending className="rounded-[0.625rem] border-zinc-600 px-5 py-[0.9375rem] text-[15px] text-zinc-400" />
      </div>
    </section>
  );
}
