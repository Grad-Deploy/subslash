import { AppScreenshot } from "./AppScreenshot";
import type { OnboardingFeature } from "./content";
import { ENTER } from "./useOnboardingMotion";

/** 기능 소개 한 장: 제목·한 줄 설명 아래 폰 화면. */
export function FeatureSlide({ feature }: { feature: OnboardingFeature }) {
  return (
    <div className="flex h-full flex-col items-center pt-[calc(env(safe-area-inset-top)+68px)]">
      <h2 {...ENTER} className="text-[32px] font-black tracking-[-0.045em]">
        {feature.name}
      </h2>
      <p
        {...ENTER}
        className="mt-2.5 px-8 text-center text-[17px] leading-normal text-balance text-muted-foreground"
      >
        {feature.title}
      </p>
      <p {...ENTER} className="mt-1 text-xs text-muted-foreground/80">
        샘플 데이터로 찍은 화면
      </p>
      {/* 폰 그림은 화면 높이에 맞춰 줄인다. 아래쪽은 넘기기 막대 뒤로 잘려도 된다. 테두리는 웹 소개의 PhoneFrame처럼
          검게 둔다 — 바탕(muted)과 비슷한 회색으로 두면 테두리가 보이지 않았다. */}
      <div
        {...ENTER}
        className="mt-6 w-[min(304px,calc((100svh-env(safe-area-inset-top)-200px)*0.5625))] rounded-[48px] bg-zinc-950 p-[9px] shadow-[0_40px_80px_-30px_rgba(9,9,11,0.45)] ring-1 ring-transparent dark:ring-zinc-600"
      >
        <div className="overflow-hidden rounded-[39px] bg-card">
          <AppScreenshot src={feature.image} alt={feature.alt} />
        </div>
      </div>
    </div>
  );
}
