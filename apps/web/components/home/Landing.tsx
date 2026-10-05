"use client";

import React from "react";
import Link from "next/link";
import { Check, ChevronDown, Smartphone } from "lucide-react";
import { cn } from "@lib/utils";
import { BrandAppIcon } from "@components/brand/Brand";
import { UnitCostCalculator } from "./UnitCostCalculator";
import { PhoneFrame } from "./PhoneFrame";
import { SampleChargeCard } from "./SampleChargeCard";
import { SAMPLES, SAMPLE_NOTE, SAMPLE_TOTAL } from "./samples";

/**
 * 첫 화면(소개)의 칸들. 내려 읽으며 무엇을 하는 서비스인지만 알리고, 쓰는 것은 대시보드로 넘긴다. 모양은
 * Claude Design의 'Subslash 랜딩 페이지 재설계'(Landing v2.dc.html)를 따른다. 디자인의 헤더 메뉴·테마 버튼·
 * 푸터는 앱 공통 헤더·푸터가 맡는다.
 *
 * 문장은 앱이 실제로 하는 일만 적는다(CLAUDE.md '제1원칙'). 화면 캡처는 샘플 데이터로 찍은 앱 화면이고,
 * 그렇게 밝혀 둔다. 앱은 아직 비공개 테스트라 받을 곳이 없으므로 '준비 중'으로 두고 링크를 만들지 않는다 —
 * 받을 수 없는 스토어 주소를 걸면 눌러 본 사람이 막힌다.
 *
 * 움직임은 모두 CSS다(globals.css의 `opening-*`·`scroll-reveal`·`landing-parallax-*`·`cta-slash`). 브라우저가
 * 스크롤 애니메이션을 모르거나 사용자가 움직임 줄이기를 켰으면 처음부터 보인다 — 글이 숨은 채로 남지 않게.
 */

const kicker = "text-base font-semibold text-red-500";
const sectionTitle =
  "text-[clamp(2.5rem,5.4vw,4.5rem)] leading-[1.1] font-black tracking-[-0.05em]";
const lead =
  "text-[clamp(1.0625rem,1.5vw,1.25rem)] leading-[1.65] text-pretty text-muted-foreground";
const primaryButton =
  "whitespace-nowrap rounded-xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 motion-reduce:hover:translate-y-0";

/** 앱 받기 자리. 공개 출시 전에는 누를 수 없는 '준비 중' 표시로 둔다. */
export function AppDownloadPending({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-dashed px-[1.375rem] py-[0.9375rem] text-[15px] font-medium text-muted-foreground",
        className,
      )}
    >
      <Smartphone className="size-4" aria-hidden />
      안드로이드 앱 · Google Play 준비 중
    </span>
  );
}

/** 뒤 장면의 요소가 차례로 떠오르게 하는 지연(globals.css의 `hero-in`). */
const heroDelay = (i: number) => ({ "--hero-delay": `${80 + i * 110}ms` }) as React.CSSProperties;

/**
 * 첫 칸. 스크롤 애니메이션을 아는 브라우저에서는 화면에 머문 채로 장면이 바뀐다 — 질문과 결제 알림이 차례로
 * 쌓이고("모르는 사이 매달 …"), 그다음 '가격 말고 1회당 단가로.'가 떠오른다. 모르는 브라우저와 움직임 줄이기는
 * 앞 장면 없이 뒤 장면(시작하기가 있는 칸)만 보여 준다.
 *
 * 결제 알림은 서비스 목록의 요금으로 만든 예시이고, 그렇게 적는다.
 */
export function LandingOpening({
  activeCount,
  onDemo,
}: {
  /** 구독 중인 구독 수. 0이면 처음 온 사람으로 본다. */
  activeCount: number;
  onDemo: () => void;
}) {
  return (
    <section id="top" className="opening w-full" aria-labelledby="hero">
      <div className="opening-stage">
        <div className="opening-a flex-col items-center justify-center gap-[clamp(0.875rem,3.6vh,2.75rem)] px-4">
          <div className="text-center">
            <h2 className="text-[clamp(1.75rem,min(5.2vw,7vh),4.25rem)] leading-[1.15] font-black tracking-[-0.045em]">
              넷플릭스, 이번 달에 몇 번 봤어요?
            </h2>
            <p className="opening-q2 mt-[clamp(0.375rem,1.4vh,0.875rem)] text-[clamp(1.375rem,min(3.6vw,5vh),3rem)] leading-[1.2] font-extrabold tracking-[-0.04em] text-muted-foreground">
              쿠팡 와우는? 유튜브 프리미엄은?
            </p>
          </div>
          <ul className="flex w-full max-w-[440px] flex-col gap-2.5">
            {SAMPLES.map((sample, i) => (
              <SampleChargeCard
                key={sample.preset.id}
                sample={sample}
                className={cn(`opening-notif-${i}`, "py-[clamp(0.5rem,1.5vh,0.875rem)]")}
              />
            ))}
          </ul>
          {SAMPLE_TOTAL && (
            <div className="opening-total text-center">
              <p className="text-[clamp(1.375rem,2.6vw,2rem)] font-extrabold tracking-[-0.035em]">
                모르는 사이 매달 <span className="text-red-500 tabular-nums">{SAMPLE_TOTAL}</span>
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{SAMPLE_NOTE}</p>
            </div>
          )}
        </div>

        <div className="opening-hint" aria-hidden>
          <span>스크롤해 보세요</span>
          <ChevronDown className="size-[18px]" />
        </div>

        <div className="opening-b flex-col items-center justify-center px-4 py-6 text-center">
          <BrandAppIcon className="hero-in size-[clamp(5rem,9vw,7rem)]" style={heroDelay(0)} />
          <p
            className="hero-in mt-8 text-base font-semibold text-muted-foreground"
            style={heroDelay(1)}
          >
            구독 디톡스
          </p>
          <h1
            id="hero"
            className="hero-in mt-3 text-[clamp(3rem,8vw,6.75rem)] leading-[1.06] font-black tracking-[-0.05em]"
            style={heroDelay(2)}
          >
            가격 말고
            <br />
            <span className="text-red-500">1회당 단가로.</span>
          </h1>
          <p className={cn("hero-in mt-6 max-w-[520px]", lead)} style={heroDelay(3)}>
            한 달에 몇 번 쓰는지 체크하면 안 쓰는 구독이 보여요. 해지 경로까지 알려 드려요.
          </p>
          <div className="hero-in mt-9 flex flex-wrap justify-center gap-2.5" style={heroDelay(4)}>
            <Link href="/dashboard" className={primaryButton}>
              {/* 구독 중인 것만 센다. 해지한 것까지 세어 "N개"라고 하면 대시보드에는 하나도 없을 수 있다. */}
              {activeCount > 0
                ? `구독 중 ${activeCount}개 · 대시보드로 →`
                : "웹에서 바로 시작하기 →"}
            </Link>
            <button
              type="button"
              onClick={onDemo}
              className="whitespace-nowrap rounded-xl border bg-card px-7 py-4 text-base font-semibold transition hover:-translate-y-0.5 hover:bg-muted motion-reduce:hover:translate-y-0"
            >
              샘플로 둘러보기
            </button>
          </div>
          <AppDownloadPending className="hero-in mt-3" />
          <p className="hero-in mt-4 text-sm text-muted-foreground" style={heroDelay(5)}>
            가입 없이 이 브라우저에 저장돼요.
          </p>
        </div>
      </div>
    </section>
  );
}

export function LandingCalculator() {
  return (
    <section
      id="calc"
      className="grid w-full scroll-mt-20 grid-cols-1 items-center gap-[clamp(2.5rem,6vw,6rem)] py-[clamp(6rem,14vh,10rem)] lg:grid-cols-2"
      aria-labelledby="calc-title"
    >
      <div className="scroll-reveal">
        <p className={kicker}>1회당 단가</p>
        <h2 id="calc-title" className={cn("mt-3.5", sectionTitle)}>
          그 구독,
          <br />한 달에 몇 번 써요?
        </h2>
        <p className={cn("mt-6 max-w-[440px]", lead)}>
          가격 말고 1회당 단가로 판단하세요. 아래에서 횟수를 움직여 보세요.
        </p>
      </div>
      <div className="scroll-reveal">
        <UnitCostCalculator />
      </div>
    </section>
  );
}

/** 한눈에 보기. 가운데 대시보드를 두고, 넓은 화면에서는 양옆 화면이 스크롤을 따라 다른 속도로 움직인다. */
export function LandingShowcase() {
  return (
    <section
      id="features"
      className="w-full scroll-mt-20 pb-[clamp(6rem,14vh,10rem)] text-center"
      aria-labelledby="features-title"
    >
      <div className="scroll-reveal">
        <p className={kicker}>한눈에 보기</p>
        <h2 id="features-title" className={cn("mt-3.5", sectionTitle)}>
          결정할 구독만
          <br />
          골라 보여 줘요
        </h2>
        <p className={cn("mx-auto mt-6 max-w-[560px]", lead)}>
          결제일이 다가오는데 잘 쓰지 않는 구독을 맨 위에 모아요. 1회당 얼마인지, 결제 전에 끊으면
          얼마를 아끼는지 함께 보여요.
        </p>
      </div>
      <div className="mt-[clamp(3.5rem,8vh,6rem)] flex items-start justify-center gap-[clamp(0.75rem,3vw,2.5rem)]">
        <div className="landing-parallax-side mt-20 hidden w-[clamp(12.5rem,22vw,17rem)] opacity-90 lg:block">
          <PhoneFrame
            src="/landing/gmail-import.png"
            alt="결제 메일 가져오기 화면"
            loading="lazy"
            className="rounded-[2.75rem] p-[9px]"
            screenClassName="aspect-[1080/1920] rounded-[2.25rem]"
          />
        </div>
        <div className="landing-parallax-center relative z-[1] w-[clamp(16.25rem,27vw,20.625rem)]">
          <PhoneFrame
            src="/landing/dashboard.png"
            alt="대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액"
            className="rounded-[3.25rem]"
            screenClassName="aspect-[1080/1920] rounded-[2.625rem]"
          />
        </div>
        <div className="landing-parallax-side mt-20 hidden w-[clamp(12.5rem,22vw,17rem)] opacity-90 lg:block">
          <PhoneFrame
            src="/landing/savings.png"
            alt="절약 현황 화면"
            loading="lazy"
            className="rounded-[2.75rem] p-[9px]"
            screenClassName="aspect-[1080/1920] rounded-[2.25rem]"
          />
        </div>
      </div>
      <p className="pt-10 text-[13px] text-muted-foreground">
        화면은 샘플 데이터로 찍은 앱 화면이에요. 지금 화면과 조금 다를 수 있어요.
      </p>
    </section>
  );
}

const DUO = [
  {
    kicker: "해지 안내",
    title: "해지하는 곳까지 데려다줘요",
    body: "서비스마다 해지 화면 링크와 메뉴 경로를 정리해 뒀어요. 해지는 각 서비스에서 하고, 마치면 '해지 완료'로 기록해요.",
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
  },
  {
    kicker: "메일로 찾기",
    title: "결제 메일로 구독을 찾아요",
    body: "Gmail 결제 메일이나 결제 문자에서 구독을 찾아 등록 후보로 모아요. 메일 제목과 본문은 저장하지 않아요.",
    image: "/landing/gmail-import.png",
    alt: "결제 메일 가져오기 화면",
  },
] as const;

/** 해지 안내·메일로 찾기. 카드 아래로 폰 윗부분만 보이게 자른다. */
export function LandingDuo() {
  return (
    <section className="grid w-full grid-cols-1 gap-5 pb-[clamp(6rem,14vh,10rem)] md:grid-cols-2">
      {DUO.map((item) => (
        <div
          key={item.title}
          className="scroll-reveal flex flex-col overflow-hidden rounded-[2.25rem] border bg-card px-[clamp(1.75rem,4vw,3rem)] pt-[clamp(2rem,4vw,3rem)]"
        >
          <p className="text-[15px] font-semibold text-red-500">{item.kicker}</p>
          <h3 className="mt-3 text-[clamp(1.875rem,3.2vw,2.625rem)] leading-[1.18] font-black tracking-[-0.045em]">
            {item.title}
          </h3>
          <p className="mt-4 text-[17px] leading-[1.65] text-pretty text-muted-foreground">
            {item.body}
          </p>
          <PhoneFrame
            src={item.image}
            alt={item.alt}
            loading="lazy"
            className="mx-auto mt-11 w-[min(300px,86%)] rounded-t-[2.875rem] pb-0 shadow-none"
            screenClassName="h-[clamp(18.75rem,34vw,25rem)] rounded-t-[2.25rem] object-top"
          />
        </div>
      ))}
    </section>
  );
}

/** 해지로 지킨 돈. 테마와 관계없이 어두운 칸이다. 다크 모드에서는 배경과 구분되게 카드 색과 테두리를 쓴다. */
export function LandingSavings() {
  return (
    <section className="w-full pb-[clamp(6rem,14vh,10rem)]" aria-labelledby="savings-title">
      <div className="grid grid-cols-1 items-end gap-[clamp(2.5rem,6vw,5rem)] overflow-hidden rounded-[2.5rem] bg-zinc-950 px-[clamp(1.75rem,6vw,5.5rem)] pt-[clamp(3rem,7vw,6rem)] text-zinc-50 md:grid-cols-2 dark:bg-card dark:ring-1 dark:ring-border">
        <div className="scroll-reveal self-center pb-[clamp(3rem,7vw,6rem)]">
          <p className="text-base font-semibold text-red-400">지킨 돈</p>
          <h2
            id="savings-title"
            className="mt-3.5 text-[clamp(2.375rem,5vw,4rem)] leading-[1.12] font-black tracking-[-0.05em]"
          >
            해지로 지킨 돈이
            <br />
            쌓여요
          </h2>
          <p className="mt-6 max-w-[440px] text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-[1.7] text-pretty text-zinc-400">
            해지한 뒤 결제일이 지나고 결제가 없었다고 확인한 금액만 &lsquo;지킨 돈&rsquo;으로 세요.
            확인하지 않은 돈은 부풀리지 않아요.
          </p>
        </div>
        <PhoneFrame
          src="/landing/savings.png"
          alt="절약 현황 화면 — 해지로 지킨 돈"
          loading="lazy"
          className="scroll-reveal w-[min(320px,100%)] justify-self-center rounded-t-[3.125rem] bg-zinc-800 pb-0 shadow-none dark:ring-0"
          screenClassName="h-[clamp(23.75rem,40vw,31.25rem)] rounded-t-[2.5rem] object-top"
        />
      </div>
    </section>
  );
}

const PRIVACY_ROWS = [
  { label: "구독 기록", value: "기본은 이 기기에만" },
  { label: "결제 메일 본문", value: "저장하지 않음" },
  { label: "광고·제3자 제공", value: "없음" },
] as const;

export function LandingPrivacy() {
  return (
    <section
      id="privacy"
      className="mx-auto w-full max-w-[880px] scroll-mt-20 pb-[clamp(6rem,14vh,10rem)] text-center"
      aria-labelledby="privacy-title"
    >
      <div className="scroll-reveal">
        <p className={kicker}>안심하고 쓰세요</p>
        <h2 id="privacy-title" className={cn("mt-3.5", sectionTitle)}>
          내 구독 기록은
          <br />내 기기에.
        </h2>
        <p className={cn("mx-auto mt-6 max-w-[520px]", lead)}>
          가입하지 않아도 쓸 수 있고, 구독 기록은 이 브라우저나 휴대폰 안에 저장돼요. 로그인은
          선택이에요 — 로그인하면 여러 기기에서 이어 쓰도록 계정에도 저장해요.
        </p>
      </div>
      <ul className="mt-14 divide-y rounded-[1.75rem] border bg-card text-left">
        {PRIVACY_ROWS.map((row) => (
          <li
            key={row.label}
            className="scroll-reveal flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-[clamp(1.25rem,3vw,2rem)] py-6"
          >
            <span className="text-[17px] font-medium text-muted-foreground">{row.label}</span>
            <span className="inline-flex items-center gap-2.5 text-[clamp(1.125rem,1.8vw,1.375rem)] font-extrabold tracking-[-0.03em]">
              <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-emerald-600">
                <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
              </span>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="scroll-reveal mt-6 text-[15px] text-muted-foreground">
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

export function LandingFinalCta() {
  return (
    <section
      className="w-full border-t pt-[clamp(4rem,10vh,7.5rem)] pb-[clamp(4rem,10vh,7.5rem)]"
      aria-labelledby="final-cta"
    >
      <div className="scroll-reveal flex flex-col items-center text-center">
        <BrandAppIcon className="size-[88px]" slashClassName="cta-slash" />
        <h2 id="final-cta" className={cn("mt-8", sectionTitle, "leading-[1.12]")}>
          이번 달 구독,
          <br />
          지금 점검해 보세요
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">가입 없이 웹에서 바로 쓸 수 있어요.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-2.5">
          <Link href="/dashboard" className={primaryButton}>
            웹에서 바로 시작하기 →
          </Link>
          <AppDownloadPending />
        </div>
      </div>
    </section>
  );
}
