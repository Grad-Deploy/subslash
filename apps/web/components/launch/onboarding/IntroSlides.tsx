"use client";

import { BrandAppIcon } from "@components/brand/Brand";
import { UnitCostCalculator } from "@components/home/UnitCostCalculator";
import { PhoneFrame } from "@components/home/PhoneFrame";
import { SampleChargeCard } from "@components/home/SampleChargeCard";
import { SAMPLES, SAMPLE_NOTE, SAMPLE_TOTAL } from "@components/home/samples";
import { cn } from "@lib/utils";
import { RISE_PHONE, RISE_TEXT, kicker, slideBody, slideTitle, slideTop } from "./styles";

/**
 * 앱 소개의 앞 장들: 문제(결제 알림) → 답(가격 말고 1회당 단가로) → 1회 단가 계산기 → 기능 셋. 화면 캡처는 웹
 * 소개와 같은 샘플 데이터 캡처(`public/landing/`)이고 그렇게 밝힌다. 첫 장의 결제 알림은 서비스 목록 기준 요금으로
 * 만든 예시다.
 */

/** 기능 장. 화면 캡처의 윗부분만 보인다. */
export const FEATURES = [
  {
    kicker: "한눈에 보기",
    title: ["결정할 구독만", "골라 보여 줘요"],
    body: "결제일이 다가오는데 잘 쓰지 않는 구독을 맨 위에 모아요.",
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
  },
  {
    kicker: "해지 안내",
    title: ["해지하는 곳까지", "데려다줘요"],
    body: "서비스마다 해지 화면 링크와 메뉴 경로를 정리해 뒀어요.",
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
  },
  {
    kicker: "지킨 돈",
    title: ["해지로 지킨 돈이", "쌓여요"],
    body: "결제가 없었다고 확인한 금액만 '지킨 돈'으로 세요.",
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
  },
] as const;

export function ProblemSlide() {
  return (
    <div
      className={cn(
        "flex h-full flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+120px)]",
        "pt-[calc(env(safe-area-inset-top)+104px)]",
      )}
    >
      <h1 data-a className="text-[32px] leading-[1.2] font-black tracking-[-0.045em]">
        넷플릭스,
        <br />
        이번 달에 몇 번 봤어요?
      </h1>
      <p
        data-a
        className="mt-3 text-[22px] leading-[1.3] font-extrabold tracking-[-0.04em] text-muted-foreground"
      >
        쿠팡 와우는? 유튜브 프리미엄은?
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
            모르는 사이 매달
            <br />
            <span className="text-red-500 tabular-nums">{SAMPLE_TOTAL}</span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{SAMPLE_NOTE}</p>
        </div>
      )}
    </div>
  );
}

export function AnswerSlide({ slashRef }: { slashRef: React.Ref<SVGPathElement> }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-7 pb-[calc(env(safe-area-inset-bottom)+112px)] text-center"
      style={RISE_TEXT}
    >
      {/* 슬래시는 이 장에 멈춰 섰을 때 긋는다(slashRef). */}
      <BrandAppIcon className="size-[104px]" slashRef={slashRef} />
      <p className="mt-8 text-[15px] font-semibold text-muted-foreground">구독 디톡스</p>
      <h2 className="mt-2.5 text-[48px] leading-[1.08] font-black tracking-[-0.05em]">
        가격 말고
        <br />
        <span className="text-red-500">1회당 단가로.</span>
      </h2>
      <p className="mt-5 text-[17px] leading-[1.6] text-pretty text-muted-foreground">
        한 달에 몇 번 쓰는지 체크하면 안 쓰는 구독이 보여요. 해지 경로까지 알려 드려요.
      </p>
    </div>
  );
}

export function CalculatorSlide() {
  return (
    <div className={cn("flex h-full flex-col px-5", slideTop)}>
      <div className="px-1" style={RISE_TEXT}>
        <p className={kicker}>1회당 단가</p>
        <h2 className={slideTitle}>
          그 구독,
          <br />한 달에 몇 번 써요?
        </h2>
        <p className={slideBody}>횟수를 움직여 보세요.</p>
      </div>
      {/* 웹 소개와 같은 계산기다. 요금은 서비스 목록에서 읽는다. */}
      <div className="mt-6" style={RISE_TEXT}>
        <UnitCostCalculator />
      </div>
    </div>
  );
}

export function FeatureSlide({ feature }: { feature: (typeof FEATURES)[number] }) {
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
        <p className="mt-1 text-xs text-muted-foreground/80">샘플 데이터로 찍은 화면</p>
      </div>
      {/* 폰 윗부분만 보인다. 아래쪽은 넘기기 막대 뒤로 잘려도 된다. */}
      <PhoneFrame
        src={feature.image}
        alt={feature.alt}
        draggable={false}
        className="mx-auto mt-7 w-[290px] rounded-t-[46px] pb-0 shadow-none"
        screenClassName="h-[440px] rounded-t-[36px] object-top"
        style={RISE_PHONE}
      />
    </div>
  );
}
