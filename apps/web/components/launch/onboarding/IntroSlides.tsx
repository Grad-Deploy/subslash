"use client";

import { BrandAppIcon } from "@components/brand/Brand";
import { UnitCostCalculator } from "@components/home/UnitCostCalculator";
import { PhoneFrame } from "@components/home/PhoneFrame";
import { SampleChargeCard } from "@components/home/SampleChargeCard";
import { SAMPLES, SAMPLE_TOTAL } from "@components/home/samples";
import { useLocale, useT } from "@lib/i18n";
import { landingScreen, type LandingScreen } from "../../home/screens";
import { cn } from "@lib/utils";
import { RISE_PHONE, RISE_TEXT, kicker, slideBody, slideTitle, slideTop } from "./styles";

/**
 * 앱 소개의 앞 장들: 문제(결제 알림) → 답(가격 말고 1회당 단가로) → 1회 단가 계산기 → 기능 셋. 화면 캡처는 웹
 * 소개와 같은 샘플 데이터 캡처(`public/landing/`)이고 그렇게 밝힌다. 첫 장의 결제 알림은 서비스 목록 기준 요금으로
 * 만든 예시다.
 */

/** 기능 장의 화면 캡처. 윗부분만 보인다. 글은 `landing.onboarding.features`에 같은 순서로 있다. */
export const FEATURE_IMAGES = [
  { screen: "dashboard" },
  { screen: "cancel-guide" },
  { screen: "savings" },
] as const satisfies readonly { screen: LandingScreen }[];

export function ProblemSlide() {
  const t = useT();
  const o = t.landing.onboarding;
  return (
    <div
      className={cn(
        "flex h-full flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+120px)]",
        "pt-[calc(env(safe-area-inset-top)+104px)]",
      )}
    >
      <h1 data-a className="text-[32px] leading-[1.2] font-black tracking-[-0.045em]">
        {o.problemQ1a}
        <br />
        {o.problemQ1b}
      </h1>
      <p
        data-a
        className="mt-3 text-[22px] leading-[1.3] font-extrabold tracking-[-0.04em] text-muted-foreground"
      >
        {t.landing.opening.q2}
      </p>
      <ul className="mt-10 flex flex-col gap-2.5">
        {SAMPLES.map((sample) => (
          <SampleChargeCard key={sample.preset.id} sample={sample} data-n />
        ))}
      </ul>
      <div className="flex-1" />
      {SAMPLE_TOTAL && (
        <div data-n>
          <p className="text-[26px] leading-[1.3] font-black tracking-[-0.04em]">
            {o.problemTotal1}
            <br />
            <span className="text-red-500 tabular-nums">{SAMPLE_TOTAL}</span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{t.landing.sampleNote}</p>
        </div>
      )}
    </div>
  );
}

export function AnswerSlide({ slashRef }: { slashRef: React.Ref<SVGPathElement> }) {
  const o = useT().landing.opening;
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-7 pb-[calc(env(safe-area-inset-bottom)+112px)] text-center"
      style={RISE_TEXT}
    >
      {/* 슬래시는 이 장에 멈춰 섰을 때 긋는다(slashRef). */}
      <BrandAppIcon className="size-[104px]" slashRef={slashRef} />
      <p className="mt-8 text-[15px] font-semibold text-muted-foreground">{o.kicker}</p>
      <h2 className="mt-2.5 text-[48px] leading-[1.08] font-black tracking-[-0.05em]">
        {o.headline1}
        <br />
        <span className="text-red-500">{o.headline2}</span>
      </h2>
      <p className="mt-5 text-[17px] leading-[1.6] text-pretty text-muted-foreground">{o.lead}</p>
    </div>
  );
}

export function CalculatorSlide() {
  const t = useT();
  const c = t.landing.calc;
  return (
    <div className={cn("flex h-full flex-col px-5", slideTop)}>
      <div className="px-1" style={RISE_TEXT}>
        <p className={kicker}>{c.kicker}</p>
        <h2 className={slideTitle}>
          {c.title1}
          <br />
          {c.title2}
        </h2>
        <p className={slideBody}>{t.landing.onboarding.calcHint}</p>
      </div>
      {/* 웹 소개와 같은 계산기다. 요금은 서비스 목록에서 읽는다. */}
      <div className="mt-6" style={RISE_TEXT}>
        <UnitCostCalculator />
      </div>
    </div>
  );
}

export function FeatureSlide({ index }: { index: number }) {
  const o = useT().landing.onboarding;
  const locale = useLocale();
  const feature = o.features[index];
  return (
    <div className={cn("flex h-full flex-col", slideTop)}>
      <div className="px-6" style={RISE_TEXT}>
        <p className={kicker}>{feature.kicker}</p>
        <h2 className={slideTitle}>
          {feature.title[0]}
          <br />
          {feature.title[1]}
        </h2>
        <p className={slideBody}>{feature.body}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">{o.sampleShot}</p>
      </div>
      {/* 폰 윗부분만 보인다. 아래쪽은 넘기기 막대 뒤로 잘려도 된다. */}
      <PhoneFrame
        src={landingScreen(FEATURE_IMAGES[index].screen, locale)}
        alt={feature.alt}
        draggable={false}
        className="mx-auto mt-7 w-[290px] rounded-t-[46px] pb-0 shadow-none"
        screenClassName="h-[440px] rounded-t-[36px] object-top"
        style={RISE_PHONE}
      />
    </div>
  );
}
